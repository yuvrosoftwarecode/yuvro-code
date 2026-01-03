from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse
import asyncio
import logging

from .serializers import (
    CodeExecutionRequestSerializer,
    CodeExecutionResponseSerializer,
    CodeSubmissionSerializer
)
from .services import CodeExecutorService, CodeSubmissionService
from .models import CodeSubmission

logger = logging.getLogger(__name__)


@extend_schema(
    request=CodeExecutionRequestSerializer,
    responses={
        200: CodeExecutionResponseSerializer,
        400: OpenApiResponse(description="Bad Request"),
        500: OpenApiResponse(description="Internal Server Error")
    },
    description="Execute code with test cases and return detailed results including plagiarism check"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_code(request):
    """
    Execute code with test cases and return formatted response
    Store submission based on question_submission_type:
    - 'learn': Store in UserCourseProgress
    - 'practice': Store in StudentCodePractice
    - Other types: Store in assessment models via save_question_activity
    """
    try:
        serializer = CodeExecutionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid request data", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        question_submission_type = validated_data.get("question_submission_type", "practice")
        question_id = validated_data.get("question_id")
        
        # Get peer submissions for plagiarism checking
        peer_submissions = CodeSubmissionService.get_peer_submissions(
            language=validated_data["language"],
            question_id=question_id,
            exclude_user=request.user,
            limit=5
        )
        validated_data["peer_submissions"] = peer_submissions
        
        # Always create a CodeSubmission for tracking
        submission = CodeSubmissionService.create_submission(
            user=request.user,
            code=validated_data["code"],
            language=validated_data["language"],
            question_id=question_id
        )
        
        # Execute code
        executor_service = CodeExecutorService()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                executor_service.submit_code_and_check_plagiarism(validated_data)
            )
        finally:
            loop.close()
        
        # Update submission with results
        if submission:
            CodeSubmissionService.update_submission_results(submission, result)
        
        # Store in appropriate model based on submission type
        if question_submission_type == "learn":
            _store_learn_submission(request.user, question_id, submission, result, validated_data)
        elif question_submission_type == "practice":
            _store_practice_submission(request.user, question_id, submission, result, validated_data)
        else:
            # For skill_test, contest, mock_interview - use existing activity tracking
            CodeSubmissionService.save_question_activity(
                user=request.user,
                question_id=question_id,
                question_submission_type=question_submission_type,
                submission=submission,
                result=result,
                request_data=validated_data
            )
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in code execution: {e}")
        return Response(
            {"error": "Internal server error", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _store_learn_submission(user, question_id, submission, result, request_data):
    """Store submission in UserCourseProgress for learn mode"""
    from course.models import Question, UserCourseProgress
    
    if not question_id:
        return
    
    try:
        question = Question.objects.get(id=question_id)
        
        # Find or create UserCourseProgress for the subtopic
        if question.subtopic:
            progress, created = UserCourseProgress.objects.get_or_create(
                user=user,
                subtopic=question.subtopic,
                defaults={
                    'course': question.course,
                    'topic': question.topic,
                }
            )
            
            # Update coding-related fields
            execution_summary = result.get("execution_summary", {})
            progress.coding_answers = progress.coding_answers or {}
            progress.coding_answers[str(question_id)] = {
                'user_code': request_data.get('code', ''),
                'language': request_data.get('language', ''),
                'test_results': result,
                'is_correct': result.get('status') == 'success',
                'timestamp': submission.created_at.isoformat() if submission else None,
                'score_percent': execution_summary.get('score_percent', 0)
            }
            
            # Update coding completion status
            progress.coding_score = execution_summary.get('score_percent', 0)
            progress.is_coding_completed = result.get('status') == 'success'
            
            # TODO: Link the code submission after migration
            # progress.code_submission = submission
            
            # Recalculate overall progress
            progress.calculate_progress()
            progress.save()
            
    except Question.DoesNotExist:
        logger.error(f"Question {question_id} not found for learn submission")
    except Exception as e:
        logger.error(f"Error storing learn submission: {e}")


def _store_practice_submission(user, question_id, submission, result, request_data):
    """Store submission in StudentCodePractice for practice mode"""
    from course.models import Question, StudentCodePractice
    
    if not question_id:
        return
    
    try:
        question = Question.objects.get(id=question_id)
        
        # Find or create StudentCodePractice
        practice, created = StudentCodePractice.objects.get_or_create(
            user=user,
            question=question,
            defaults={
                'course': question.course,
                'topic': question.topic,
                'status': 'started'
            }
        )
        
        # Update with latest submission data
        execution_summary = result.get("execution_summary", {})
        practice.answer_latest = {
            'code': request_data.get('code', ''),
            'language': request_data.get('language', ''),
            'test_cases': {
                'basic': request_data.get('test_cases_basic', []),
                'advanced': request_data.get('test_cases_advanced', []),
                'custom': request_data.get('test_cases_custom', [])
            }
        }
        
        # Add to answer history
        if not practice.answer_history:
            practice.answer_history = []
        
        practice.answer_history.append({
            'timestamp': submission.created_at.isoformat() if submission else None,
            'answer_data': practice.answer_latest,
            'is_auto_save': False,
            'execution_results': result
        })
        
        # Update evaluation results
        practice.evaluation_results = {
            'total_tests': execution_summary.get('total_test_cases', 0),
            'total_passed': execution_summary.get('passed_test_cases', 0),
            'score_percent': execution_summary.get('score_percent', 0),
            'execution_time_ms': execution_summary.get('runtime_ms', 0),
            'peak_memory_kb': execution_summary.get('peak_memory_kb', 0),
            'status': result.get('status', 'error')
        }
        
        practice.marks_obtained = execution_summary.get('score_percent', 0)
        practice.answer_attempt_count += 1
        practice.status = 'completed' if result.get('status') == 'success' else 'in_progress'
        
        # TODO: Link the code submission after migration
        # practice.code_submission = submission
        
        practice.save()
        
    except Question.DoesNotExist:
        logger.error(f"Question {question_id} not found for practice submission")
    except Exception as e:
        logger.error(f"Error storing practice submission: {e}")


@extend_schema(
    responses={
        200: CodeSubmissionSerializer(many=True),
    },
    description="Get user's code submissions"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_submissions(request):
    """Get user's code submissions"""
    try:
        language = request.query_params.get('language')
        question_id = request.query_params.get('question_id')
        
        queryset = CodeSubmission.objects.filter(user=request.user)
        
        if language:
            queryset = queryset.filter(language=language)
        
        if question_id:
            queryset = queryset.filter(question_id=question_id)
        
        submissions = queryset.order_by('-created_at')[:20]
        serializer = CodeSubmissionSerializer(submissions, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting user submissions: {e}")
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )