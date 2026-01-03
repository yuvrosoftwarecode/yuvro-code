import httpx
import asyncio
from django.conf import settings
from typing import Dict, List, Any
import logging
from .models import CodeSubmission

logger = logging.getLogger(__name__)


class CodeExecutorService:
    
    def __init__(self):
        self.base_url = settings.CODE_EXECUTOR_SERVICE_URL
        self.timeout = 30.0
    
    async def submit_code_and_check_plagiarism(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            executor_request = {
                "code": request_data["code"],
                "language": request_data["language"],
                "test_cases_basic": request_data.get("test_cases_basic", []),
                "test_cases_advanced": request_data.get("test_cases_advanced", []),
                "test_cases_custom": request_data.get("test_cases_custom", []),
                "peer_submissions": request_data.get("peer_submissions", []),
                "timeout": request_data.get("timeout", 10)
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/execute-code-with-plagiarism-checks",
                    json=executor_request
                )
                response.raise_for_status()
                result = response.json()
            
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error communicating with code executor: {e}")
            return self._create_error_response(str(e), request_data["language"])
        except Exception as e:
            logger.error(f"Unexpected error in code execution: {e}")
            return self._create_error_response(str(e), request_data["language"])
    
    def _create_error_response(self, error_message: str, language: str) -> Dict[str, Any]:
        return {
            "status": "error",
            "language": language,
            "test_cases_basic": [],
            "test_cases_advanced": [],
            "test_cases_custom": [],
            "execution_summary": {
                "runtime_ms": 0,
                "peak_memory_kb": 0,
                "passed_test_cases": 0,
                "total_test_cases": 0,
                "score_percent": 0.0
            },
            "plagiarism_report": {
                "flagged": False,
                "max_similarity": 0.0,
                "matches": []
            },
            "error": error_message
        }


class CodeSubmissionService:
    """Service to handle code submissions"""
    
    @staticmethod
    def create_submission(user, code: str, language: str, question_id: str = None) -> CodeSubmission:
        """Create a new code submission"""
        from course.models import Question
        
        question = None
        if question_id:
            try:
                question = Question.objects.get(id=question_id)
            except Question.DoesNotExist:
                pass
        
        submission = CodeSubmission.objects.create(
            user=user,
            code=code,
            language=language,
            question=question
        )
        return submission
    
    @staticmethod
    def update_submission_results(submission: CodeSubmission, execution_result: Dict) -> CodeSubmission:
        execution_summary = execution_result.get("execution_summary", {})
        plagiarism_report = execution_result.get("plagiarism_report", {})
        
        submission.total_test_cases = execution_summary.get("total_test_cases", 0)
        submission.passed_test_cases = execution_summary.get("passed_test_cases", 0)
        submission.execution_time_ms = execution_summary.get("runtime_ms", 0)
        submission.peak_memory_kb = execution_summary.get("peak_memory_kb", 0)
        submission.score_percent = execution_summary.get("score_percent", 0)
        submission.plagiarism_flagged = plagiarism_report.get("flagged", False)
        submission.max_similarity = plagiarism_report.get("max_similarity", 0)
        
        submission.test_results_basic = execution_result.get("test_cases_basic", [])
        submission.test_results_advanced = execution_result.get("test_cases_advanced", [])
        submission.test_results_custom = execution_result.get("test_cases_custom", [])
        
        submission.save()
        return submission
    
    @staticmethod
    def get_peer_submissions(language: str, question_id: str = None, exclude_user=None, limit: int = 10) -> List[Dict]:
        """Get peer submissions for plagiarism checking"""
        queryset = CodeSubmission.objects.filter(language=language)
        
        if question_id:
            queryset = queryset.filter(question__id=question_id)
        
        if exclude_user:
            queryset = queryset.exclude(user=exclude_user)
        
        submissions = queryset.order_by('-created_at')[:limit]
        
        return [
            {
                "user_id": str(sub.user.id),
                "submission_id": str(sub.id),
                "code": sub.code
            }
            for sub in submissions
        ]
    
    @staticmethod
    def save_question_activity(user, question_id: str, question_submission_type: str, 
                             submission: CodeSubmission = None, result: Dict = None, 
                             request_data: Dict = None):
        """Save question activity based on submission type"""
        from course.models import Question
        from assessment.models import (
            SkillTestQuestionActivity, ContestQuestionActivity, 
            MockInterviewQuestionActivity
        )
        
        if not question_id:
            return
        
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            logger.error(f"Question {question_id} not found")
            return
        
        activity_data = {
            'user': user,
            'question': question,
            'question_type': 'coding',
            'code_submission': submission,
            'answer_data': {
                'code': request_data.get('code', ''),
                'language': request_data.get('language', ''),
                'execution_result': result
            },
            'answer_history': [{
                'timestamp': submission.created_at.isoformat() if submission else None,
                'answer_data': {
                    'code': request_data.get('code', ''),
                    'language': request_data.get('language', '')
                },
                'execution_results': result
            }],
            'marks_obtained': result.get('execution_summary', {}).get('score_percent', 0) if result else 0,
            'is_correct': result.get('status') == 'success' if result else False,
            'auto_graded': True
        }
        
        if question_submission_type == "skill_test":
            SkillTestQuestionActivity.objects.update_or_create(
                user=user,
                question=question,
                defaults=activity_data
            )
        elif question_submission_type == "contest":
            ContestQuestionActivity.objects.update_or_create(
                user=user,
                question=question,
                defaults=activity_data
            )
        elif question_submission_type == "mock_interview":
            MockInterviewQuestionActivity.objects.update_or_create(
                user=user,
                question=question,
                defaults=activity_data
            )