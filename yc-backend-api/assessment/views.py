from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, F
from django.db import models
from django.shortcuts import get_object_or_404
import random
import os
import requests
import json
from pypdf import PdfReader
from io import BytesIO
from ai_assistant.models import AIAgent, ChatSession, ChatMessage
from authentication.models import Profile
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import (
    Contest, MockInterview, JobTest, SkillTest,
    ContestSubmission, MockInterviewSubmission, 
    JobTestSubmission, SkillTestSubmission,
    SkillTestQuestionActivity, ContestQuestionActivity, MockInterviewQuestionActivity
)
from .serializers import (
    ContestSerializer, SkillTestSerializer, MockInterviewSerializer,
    SkillTestSubmissionSerializer
)
from course.models import Question
from authentication.permissions import IsOwnerOrInstructorOrAdmin
from .mixins import ProctoringMixin


class CodeSubmissionViewSet(viewsets.ViewSet):
    """
    ViewSet to handle code execution requests Proxy.
    Mimics the old code_executor API but logic is now effectively stateless or handled here.
    """
    permission_classes = [AllowAny] # Or IsAuthenticated depending on requirements

    @action(detail=False, methods=['post'], url_path='execute')
    def execute_code(self, request):
        """
        Execute code with test cases.
        Proxies to the yc-code-executor microservice.
        """
        try:
            # 1. Get Data
            code = request.data.get('code')
            language = request.data.get('language')
            test_cases = request.data.get('test_cases', [])
            test_cases_custom = request.data.get('test_cases_custom', [])
            coding_problem_id = request.data.get('coding_problem_id')
            
            # 2. Call Code Executor Service
            service_url = os.environ.get('CODE_EXECUTOR_URL', 'http://code-executor:8002')
            
            payload = {
                'code': code,
                'language': language,
                'test_cases': test_cases,
                'test_cases_custom': test_cases_custom,
                'timeout': 10
            }
            
            executor_response = requests.post(
                f"{service_url}/execute-with-tests",
                json=payload,
                timeout=15
            )
            response_data = executor_response.json()

            # 3. Plagiarism Check (if coding question and execution successful)
            if coding_problem_id:
                try:
                    reference_submissions = []
                    
                    # Fetch from various activity models
                    exclude_user_kwargs = {'user': request.user} if request.user.is_authenticated else {}
                    
                    models_to_check = [
                        SkillTestQuestionActivity,
                        ContestQuestionActivity,
                        MockInterviewQuestionActivity
                    ]
                    
                    for model_class in models_to_check:
                         qs = model_class.objects.filter(
                             question_id=coding_problem_id, 
                             is_final_answer=True
                         ).exclude(**exclude_user_kwargs).select_related('user').order_by('-updated_at')[:20]
                         
                         for activity in qs:
                             reference_submissions.append({
                                 'submission_id': str(activity.id),
                                 'user_id': str(activity.user.id),
                                 'answer_data': activity.answer_data
                             })
                             
                    if reference_submissions:
                        plagiarism_payload = {
                            'target_code': code,
                            'language': language,
                            'reference_submissions': reference_submissions
                        }
                        
                        plag_response = requests.post(
                            f"{service_url}/plagiarism-check",
                            json=plagiarism_payload,
                            timeout=5
                        )
                        
                        if plag_response.status_code == 200:
                            plag_data = plag_response.json()
                            response_data['plagiarism_score'] = plag_data.get('max_similarity', 0.0)
                            response_data['plagiarism_details'] = plag_data
                        
                except Exception as e:
                    print(f"Plagiarism check failed: {e}")
                    pass

            # 4. Format Response to match frontend expectation
            exec_res = response_data.get('execution_result', {})
            t_results = response_data.get('test_results', [])
            
            formatted_response = {
                'id': 0, # Placeholder
                'coding_problem': coding_problem_id or '',
                'problem_title': 'Assessment Problem',
                'problem_description': '',
                'code': code,
                'language': language,
                'status': exec_res.get('status', 'error'),
                'output': exec_res.get('output', ''),
                'error_message': exec_res.get('error', ''),
                'execution_time': exec_res.get('execution_time', 0),
                'memory_usage': exec_res.get('memory_usage', 0),
                'test_cases_passed': response_data.get('total_passed', 0),
                'total_test_cases': response_data.get('total_tests', 0),
                'plagiarism_score': response_data.get('plagiarism_score', 0),
                'plagiarism_details': response_data.get('plagiarism_details', None),
                'created_at': timezone.now().isoformat(),
                'updated_at': timezone.now().isoformat(),
                'test_results': {
                    'passed': response_data.get('total_passed', 0),
                    'total': response_data.get('total_tests', 0),
                    'success': exec_res.get('success', False),
                    'results': t_results
                },
                'plagiarism_flagged': response_data.get('plagiarism_score', 0) > 0.8
            }

            return Response(formatted_response, status=executor_response.status_code)

        except requests.exceptions.RequestException as e:
             return Response({
                'status': 'error',
                'error_message': f"Executor Service Unavailable: {str(e)}",
                'execution_result': {'success': False},
                'test_results': []
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request):
        # Stub for getSubmissions
        return Response([])

    def retrieve(self, request, pk=None):
        # Stub for getSubmission
        return Response({})


class ContestViewSet(viewsets.ModelViewSet):
    queryset = Contest.objects.all()
    serializer_class = ContestSerializer
    permission_classes = [IsOwnerOrInstructorOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    search_fields = ['title', 'organizer', 'description']
    ordering_fields = ['start_datetime']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
    def get_queryset(self):
        qs = super().get_queryset()
        
        status_param = self.request.query_params.get('status')
        type_param = self.request.query_params.get('type')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        q = Q()
        if status_param:
            q &= Q(status=status_param)
            
        if type_param:
            q &= Q(type=type_param)
        
        if date_from:
            q &= Q(start_date__gte=date_from)
        
        if date_to:
            q &= Q(start_date__lte=date_to)

        if q:
            qs = qs.filter(q)
            
        for obj in qs:
            obj.update_status()
        return qs
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        contest = self.get_object()
        user = request.user

        if ContestSubmission.objects.filter(contest=contest, user=user).exists():
            return Response({'message': 'Already Registered'}, status=status.HTTP_200_OK)

        ContestSubmission.objects.create(contest=contest, user=user, status=ContestSubmission.STATUS_STARTED)

        return Response({'status': 'Registered'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        contest = self.get_object()
        user = request.user

        submission, created = ContestSubmission.objects.get_or_create(
            contest=contest, 
            user=user,
            defaults={'status': ContestSubmission.STATUS_STARTED}
        )

        contest.update_status()
        if contest.status != Contest.STATUS_ONGOING:
            return Response({'error': 'Contest is not live'}, status=status.HTTP_400_BAD_REQUEST)

        questions_to_send = []

        # Option A: Fixed Configuration
        if contest.questions_config:
            all_ids = []
            for q_type, ids in contest.questions_config.items():
                if isinstance(ids, list):
                    all_ids.extend(ids)

            if all_ids:
                questions_to_send = list(Question.objects.filter(id__in=all_ids).values('id', 'title', 'content', 'type', 'mcq_options', 'marks', 'test_cases_basic'))

        # Option B: Random Configuration
        if contest.questions_random_config:
            existing_ids = [q['id'] for q in questions_to_send]
            
            for q_type, count in contest.questions_random_config.items():
                if count > 0:
                    # Filter questions by type and ensure they are contest-appropriate
                    # You might want to filter by difficulty or category if needed
                    # For now, we assume any question of that type (maybe filtered by category='contest' if strictly enforced)
                    candidates = list(Question.objects.filter(
                        type=q_type
                        # category='contest' # Uncomment if you want to restrict to contest questions only
                    ).exclude(id__in=existing_ids).values('id', 'title', 'content', 'type', 'mcq_options', 'marks', 'test_cases_basic'))
                    
                    if len(candidates) >= count:
                        selected = random.sample(candidates, count)
                    else:
                        selected = candidates
                    
                    questions_to_send.extend(selected)

        random.shuffle(questions_to_send)

        return Response({ 'submission_id': submission.id, 'duration': contest.duration, 'questions': questions_to_send})

    @action(detail=True, methods=['post'], permission_classes= [permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        contest = self.get_object()
        submission_id = request.data.get('submission_id')
        answers = request.data.get('answers', {})

        submission = get_object_or_404(ContestSubmission, id=submission_id, user=request.user)

        if submission.status == ContestSubmission.STATUS_COMPLETED:
            return Response({'error': 'Submission already completed'}, status=status.HTTP_400_BAD_REQUEST)

        submission.answer_data = answers
        submission.status = ContestSubmission.STATUS_SUBMITTED
        submission.submitted_at = timezone.now()
        
        # Auto-Grading Logic
        total_score = 0
        question_ids = answers.keys()
        db_questions = Question.objects.filter(id__in=question_ids)
        q_map = {str(q.id): q for q in db_questions}
        
        for q_id, user_ans in answers.items():
            if q_id not in q_map:
                continue
            question = q_map[q_id]
            
            # MCQ Single
            if question.type == 'mcq_single':
                correct_opt = next((opt for opt in question.mcq_options if opt.get('is_correct')), None)
                if correct_opt and user_ans == correct_opt['text']:
                    total_score += question.marks
            
            # MCQ Multiple
            elif question.type == 'mcq_multiple':
                correct_opts = set(opt['text'] for opt in question.mcq_options if opt.get('is_correct'))
                user_opts = set(user_ans) if isinstance(user_ans, list) else set([user_ans])
                if correct_opts == user_opts:
                    total_score += question.marks
                    
        submission.marks = total_score
        submission.save()
        
        return Response({'status': 'Submitted', 'score': total_score}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path="increment-participant")
    def increment_participant(self, request, pk=None):
        contest = self.get_object() 
        contest.participants_count = F('participants_count') + 1
        contest.save(update_fields=['participants_count'])
        contest.refresh_from_db()
        
        return Response({'participants_count': contest.participants_count}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='recompute-status')
    def recompute_status(self, request, pk=None):
        contest = self.get_object()
        new_status = contest.update_status()
        contest.save(update_fields=['status'])
        return Response({'status': new_status}, status=status.HTTP_200_OK)


class SkillTestViewSet(ProctoringMixin, viewsets.ModelViewSet):
    queryset = SkillTest.objects.all()
    serializer_class = SkillTestSerializer
    
    # ProctoringMixin Config
    submission_model = SkillTestSubmission
    question_activity_model = SkillTestQuestionActivity
    submission_lookup_field = 'skill_test'
    submission_related_field = 'skill_test_submission'
    permission_classes = [IsOwnerOrInstructorOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    search_fields = ['title', 'description']
    ordering_fields = ['created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
    def get_queryset(self):
        qs = super().get_queryset()
        
        course_param = self.request.query_params.get('course')
        topic_param = self.request.query_params.get('topic')
        difficulty_param = self.request.query_params.get('difficulty')
        
        q = Q()
        if course_param:
            q &= Q(course=course_param)
            
        if topic_param:
            q &= Q(topic=topic_param)
        
        if difficulty_param:
            q &= Q(difficulty=difficulty_param)

        if q:
            qs = qs.filter(q)
            
        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        skill_test = self.get_object()
        user = request.user
        
        # 1. Check for existing UNFINISHED submission to resume
        submission = SkillTestSubmission.objects.filter(
            skill_test=skill_test,
            user=user,
            status=SkillTestSubmission.STATUS_STARTED
        ).first()

        if not submission:
            # 2. Check total completed attempts
            completed_count = SkillTestSubmission.objects.filter(
                skill_test=skill_test,
                user=user,
                status=SkillTestSubmission.STATUS_COMPLETED
            ).count()

            if completed_count >= skill_test.max_attempts:
                return Response(
                    {'error': f'Maximum attempt limit ({skill_test.max_attempts}) reached for this test.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 3. Create NEW submission
            submission = SkillTestSubmission.objects.create(
                skill_test=skill_test,
                user=user,
                status=SkillTestSubmission.STATUS_STARTED
            )
        
        # 1. Resolve Questions
        questions_to_send = []
        
        # Option A: Fixed Configuration
        if skill_test.questions_config:
            # Expected format: {'mcq_single': [id1, id2], ...}
            all_ids = []
            for q_type, ids in skill_test.questions_config.items():
                if isinstance(ids, list):
                    all_ids.extend(ids)
            
            if all_ids:
                questions_to_send = list(Question.objects.filter(id__in=all_ids).values(
                    'id', 'title', 'content', 'type', 'mcq_options', 'marks', 'test_cases_basic'
                ))
        
        # Option B: Random Configuration (Additive)
        if skill_test.questions_random_config:
            # Expected format: {'mcq_single': 10, 'coding': 2}
            
            # Get IDs already selected to avoid duplicates
            existing_ids = [q['id'] for q in questions_to_send]
            
            for q_type, count in skill_test.questions_random_config.items():
                if count > 0:
                    q_filter = Q(type=q_type)
                    
                    if skill_test.topic:
                        # Include questions linked to subtopics of this topic OR directly to the topic
                        q_filter &= (Q(subtopic__topic=skill_test.topic) | Q(topic=skill_test.topic))
                    elif skill_test.course:
                        q_filter &= Q(course=skill_test.course)
                        
                    # Fetch candidate questions excluding already selected ones
                    candidates = list(Question.objects.filter(
                        q_filter
                    ).exclude(id__in=existing_ids).values('id', 'title', 'content', 'type', 'mcq_options', 'marks', 'test_cases_basic'))
                    
                    if len(candidates) >= count:
                        selected = random.sample(candidates, count)
                    else:
                        selected = candidates # Take all if not enough
                    
                    questions_to_send.extend(selected)
                    
        # Shuffle final list
        random.shuffle(questions_to_send)
        
        # 2. Return Response
        return Response({
            'submission_id': submission.id,
            'status': submission.status,
            'duration': skill_test.duration,
            'questions': questions_to_send
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        skill_test = self.get_object()
        submission_id = request.data.get('submission_id')
        answers = request.data.get('answers', {})
        explanations = request.data.get('explanations', {})
        all_question_ids = request.data.get('all_question_ids', [])

        submission = get_object_or_404(
            SkillTestSubmission,
            id=submission_id,
            user=request.user,
            skill_test=skill_test
        )
        
        # Merge all_question_ids with answers.keys() to ensure we process everything
        question_ids = list(set(list(answers.keys()) + all_question_ids))

        if submission.status == SkillTestSubmission.STATUS_COMPLETED:
             return Response({'error': 'Already submitted'}, status=status.HTTP_400_BAD_REQUEST)

        submission.status = SkillTestSubmission.STATUS_COMPLETED
        submission.submitted_at = timezone.now()
        submission.completed_at = timezone.now()
        submission.answer_data = answers
        
        total_score = 0
        
        # Process each answer and create activities
        for q_id in question_ids:
            user_ans = answers.get(q_id)
            try:
                question = Question.objects.get(id=q_id)
            except Question.DoesNotExist:
                continue

            marks_obtained = 0
            is_correct = False
            
            # Grading Logic
            if question.type == 'mcq_single':
                correct_opt = next((opt for opt in question.mcq_options if opt.get('is_correct')), None)
                if correct_opt and user_ans == correct_opt['text']:
                    marks_obtained = question.marks
                    is_correct = True
            elif question.type == 'mcq_multiple':
                 correct_opts = set(opt['text'] for opt in question.mcq_options if opt.get('is_correct'))
                 user_opts = set(user_ans) if isinstance(user_ans, list) else set([user_ans]) if user_ans else set()
                 if correct_opts == user_opts and correct_opts:
                     marks_obtained = question.marks
                     is_correct = True
            elif question.type == 'coding':
                # For coding, we'll mark as incorrect by default unless manually or auto-graded elsewhere
                # But for now, if there's code, we give 0 or partial? 
                # Let's keep it 0 as it's not auto-graded yet
                marks_obtained = 0
                is_correct = False
            elif question.type == 'descriptive':
                marks_obtained = 0
                is_correct = False

            # Create or update activity
            SkillTestQuestionActivity.objects.update_or_create(
                skill_test_submission=submission,
                question=question,
                user=request.user,
                defaults={
                    'answer_data': {
                        'answer': user_ans,
                        'explanation': explanations.get(q_id, '')
                    },
                    'is_final_answer': True,
                    'is_correct': is_correct,
                    'marks_obtained': marks_obtained,
                    'auto_graded': True if question.type in ['mcq_single', 'mcq_multiple'] else False
                }
            )
            total_score += marks_obtained
        
        submission.marks = total_score
        submission.save()
        
        return Response({
            'status': 'submitted',
            'score': total_score
        })

class MockInterviewViewSet(viewsets.ModelViewSet):
    queryset = MockInterview.objects.all()
    serializer_class = MockInterviewSerializer
    permission_classes = [IsOwnerOrInstructorOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        publish_status_param = self.request.query_params.get('publish_status')
        ai_mode_param = self.request.query_params.get('ai_generation_mode')

        q = Q()
        if publish_status_param:
            q &= Q(publish_status=publish_status_param)

        if ai_mode_param:
            q &= Q(ai_generation_mode=ai_mode_param)

        if q:
            qs = qs.filter(q)

        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start_interview(self, request, pk=None):
        try:
            mock_interview = self.get_object()
            user = request.user
            
            # Get user settings
            experience_level = request.data.get('experience_level', MockInterviewSubmission.EXP_LEVEL_BEGINNER)
            selected_duration = request.data.get('selected_duration', 0)
            resume_file = request.FILES.get('resume')
            
            # 1. Check for existing active submission
            submission = MockInterviewSubmission.objects.filter(
                mock_interview=mock_interview,
                user=user,
                status=MockInterviewSubmission.STATUS_STARTED
            ).first()

            chat_session = None

            if not submission:
                # 2. Handle Resume / Context Extraction
                context_text = ""
                
                if resume_file:
                    try:
                        # Parse PDF
                        reader = PdfReader(resume_file)
                        for page in reader.pages:
                            text = page.extract_text()
                            if text:
                                context_text += text + "\n"
                    except Exception as e:
                        print(f"Error parsing resume: {e}")
                
                # If no resume text, fetch profile data
                if not context_text.strip():
                    try:
                        # Handle potential Profile.DoesNotExist
                        if hasattr(user, 'profile'):
                            profile = user.profile
                            context_text += f"Name: {profile.full_name}\n"
                            context_text += f"Title: {profile.title}\n"
                            context_text += f"About: {profile.about}\n"
                            
                            # Skills
                            skills = profile.skills.all()
                            if skills.exists():
                                context_text += "Skills:\n"
                                for skill in skills:
                                    context_text += f"- {skill.name} ({skill.level})\n"
                                    
                            # Experience
                            experiences = profile.experiences.all()
                            if experiences.exists():
                                context_text += "Experience:\n"
                                for exp in experiences:
                                    context_text += f"- {exp.role} at {exp.company} ({exp.duration})\n"
                                    
                            # Education
                            educations = profile.education.all()
                            if educations.exists():
                                context_text += "Education:\n"
                                for edu in educations:
                                    context_text += f"- {edu.degree} in {edu.field} from {edu.institution}\n"
                    except Exception as e:
                        print(f"Error fetching profile: {e}")
                
                # If still empty, use fallback
                if not context_text.strip():
                    context_text = "No resume or profile information provided. Please ask general questions relevant to the position."

                # 3. Initialize AI Chat Session
                if mock_interview.ai_generation_mode in [MockInterview.AI_GEN_FULL, MockInterview.AI_GEN_MIXED]:
                    # Find an active AI agent (prefer Gemini)
                    ai_agent = AIAgent.objects.filter(is_active=True, provider='gemini').first()
                    if not ai_agent:
                        ai_agent = AIAgent.objects.filter(is_active=True).first()
                    
                    if ai_agent:
                        # Safe user name
                        user_first_name = user.first_name if user.first_name else "Candidate"
                        
                        chat_session = ChatSession.objects.create(
                            user=user,
                            ai_agent=ai_agent,
                            title=f"Mock Interview: {mock_interview.title}",
                            page="mock_interview"
                        )
                        
                        # Create System Prompt
                        system_prompt = f"""You are an expert technical interviewer named {mock_interview.interviewer_name}.
You are conducting a mock interview for the "{mock_interview.title}".
Description: {mock_interview.description}
Instructions: {mock_interview.instructions}

Candidate Context (Resume/Profile):
{context_text}

Your Goal:
1. Conduct a professional and adaptive interview.
2. Ask questions based on the candidate's experience and the interview requirements.
3. Determine the next question based on the candidate's previous answer.
4. If the candidate answers poorly, ask easier follow-up questions or clarify.
5. If the candidate answers well, increase the difficulty.
6. Keep your responses concise and conversational (as if speaking).
7. Do not just list questions. Engage in a dialogue.

Begin by greeting the candidate politely (e.g., "Hello {user_first_name}, welcome to the interview..."), introducing yourself, and then asking the first question.
"""
                        ChatMessage.objects.create(
                            chat_session=chat_session,
                            message_type="system",
                            content=system_prompt
                        )

                # 4. Create NEW submission
                submission = MockInterviewSubmission.objects.create(
                    mock_interview=mock_interview,
                    user=user,
                    status=MockInterviewSubmission.STATUS_STARTED,
                    experience_level=experience_level,
                    selected_duration=selected_duration,
                    resume=resume_file,
                    chat_session=chat_session
                )
            else:
                 # Update settings if restarted
                 submission.experience_level = experience_level
                 submission.selected_duration = selected_duration
                 if resume_file: 
                     submission.resume = resume_file
                 submission.save()
                 chat_session = submission.chat_session

            # 5. Return Response
            return Response({
                'submission_id': submission.id,
                'status': submission.status,
                'max_duration': mock_interview.max_duration,
                'selected_duration': submission.selected_duration,
                'experience_level': submission.experience_level,
                'chat_session_id': chat_session.id if chat_session else None,
                'ai_config': {
                    'mode': mock_interview.ai_generation_mode,
                    'verbal_count': mock_interview.ai_verbal_question_count,
                    'coding_count': mock_interview.ai_coding_question_count,
                    'voice_type': mock_interview.voice_type,
                    'voice_speed': mock_interview.voice_speed,
                    'interviewer_name': mock_interview.interviewer_name,
                    'interviewer_voice_id': mock_interview.interviewer_voice_id
                }
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    


class SkillTestSubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SkillTestSubmission.objects.all()
    serializer_class = SkillTestSubmissionSerializer
    permission_classes = [IsOwnerOrInstructorOrAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'marks']
    
    def get_queryset(self):
        qs = super().get_queryset()
        skill_test_id = self.request.query_params.get('skill_test')
        if skill_test_id:
            qs = qs.filter(skill_test_id=skill_test_id)
        return qs
