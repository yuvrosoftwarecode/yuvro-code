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
    SkillTestQuestionActivity, ContestQuestionActivity, MockInterviewQuestionActivity,
    CodePracticeQuestionSubmission
)
from .serializers import (
    ContestSerializer, SkillTestSerializer, MockInterviewSerializer,
    SkillTestSubmissionSerializer
)

from course.models import Question
from authentication.permissions import IsOwnerOrInstructorOrAdmin
from .mixins import ProctoringMixin
from django.core.mail import send_mail
from django.conf import settings


class ContestViewSet(ProctoringMixin, viewsets.ModelViewSet):
    queryset = Contest.objects.all()
    serializer_class = ContestSerializer
    
    submission_model = ContestSubmission
    question_activity_model = ContestQuestionActivity
    submission_lookup_field = 'contest'
    submission_related_field = 'contest_submission'
    
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

        try:
            subject = f"Registration Confirmed: {contest.title}"
            message = f"""
        Hello {user.first_name or user.username},

        You have successfully registered for the contest: {contest.title}.

        Start Time: {contest.start_datetime.strftime('%Y-%m-%d %H:%M:%Z')}
        End Time: {contest.end_datetime.strftime('%Y-%m-%d %H:%M:%Z')}
        
        Good Luck!

        Team Yuvro
        """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )

        except Exception as e:
            print(f"Failed to send email: {str(e)}")

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

        if contest.questions_config:
            all_ids = []
            for q_type, ids in contest.questions_config.items():
                if isinstance(ids, list):
                    all_ids.extend(ids)

            if all_ids:
                questions_to_send = list(Question.objects.filter(id__in=all_ids).values('id', 'title', 'content', 'type', 'mcq_options', 'marks', 'test_cases_basic'))

        if contest.questions_random_config:
            existing_ids = [q['id'] for q in questions_to_send]
            
            for q_type, count in contest.questions_random_config.items():
                if count > 0:
                    candidates = list(Question.objects.filter(
                        type=q_type
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
        
        total_score = 0
        question_ids = answers.keys()
        db_questions = Question.objects.filter(id__in=question_ids)
        q_map = {str(q.id): q for q in db_questions}
        
        for q_id, user_ans in answers.items():
            if q_id not in q_map:
                continue
            question = q_map[q_id]
            
            if question.type == 'mcq_single':
                correct_opt = next((opt for opt in question.mcq_options if opt.get('is_correct')), None)
                if correct_opt and user_ans == correct_opt['text']:
                    total_score += question.marks
            
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

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def leaderboard(self, request, pk=None):
        contest = self.get_object()
        
        # 1. Fetch Submissions (Only submitted/completed ones)
        submissions = ContestSubmission.objects.filter(
            contest=contest,
            status__in=[ContestSubmission.STATUS_SUBMITTED, ContestSubmission.STATUS_COMPLETED]
        ).select_related('user').order_by('-marks', 'submitted_at')
        
        # 2. Build Leaderboard Data
        leaderboard_data = []
        rank = 1
        
        for sub in submissions:
            leaderboard_data.append({
                'rank': rank,
                'user': f"{sub.user.first_name} {sub.user.last_name}".strip() or sub.user.username,
                'avatar': sub.user.avatar.url if hasattr(sub.user, 'avatar') and sub.user.avatar else None,
                'score': sub.marks,
                'time_taken': str(sub.submitted_at - sub.started_at) if sub.submitted_at and sub.started_at else None,
                'submitted_at': sub.submitted_at
            })
            rank += 1
            
        return Response(leaderboard_data, status=status.HTTP_200_OK)


class SkillTestViewSet(ProctoringMixin, viewsets.ModelViewSet):
    queryset = SkillTest.objects.all()
    serializer_class = SkillTestSerializer
    
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


class CodePracticeSubmissionViewSet(viewsets.ModelViewSet):
    queryset = CodePracticeQuestionSubmission.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'marks_obtained']
    
    def _mask_test_data(self, data_str):
        """Mask sensitive parts of test data while keeping structure visible"""
        if not data_str:
            return data_str
            
        # For arrays/lists, show structure but mask some values
        if data_str.startswith('[') and data_str.endswith(']'):
            try:
                import json
                data = json.loads(data_str)
                if isinstance(data, list) and len(data) > 0:
                    if len(data) <= 3:
                        # For small arrays, mask middle elements
                        masked = data.copy()
                        for i in range(1, len(masked) - 1):
                            masked[i] = '***'
                        return json.dumps(masked)
                    else:
                        # For larger arrays, show first, last, and some masked elements
                        masked = [data[0], '***', '***']
                        if len(data) > 3:
                            masked.append('***')
                        masked.append(data[-1])
                        return json.dumps(masked)
            except:
                pass
        
        # For simple values, partially mask
        if len(data_str) <= 3:
            return '***'
        elif len(data_str) <= 10:
            return data_str[:2] + '***'
        else:
            return data_str[:3] + '***' + data_str[-2:]
    
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        if not user.is_staff:
            qs = qs.filter(user=user)
            
        question_id = self.request.query_params.get('question_id')
        if question_id:
            qs = qs.filter(question_id=question_id)
            
        return qs
    
    def get_serializer_class(self):
        from .serializers import CodePracticeQuestionSubmissionSerializer
        return CodePracticeQuestionSubmissionSerializer
    
    @action(detail=False, methods=['post'], url_path='submit')
    def submit_code(self, request):
        try:
            code = request.data.get('code')
            language = request.data.get('language')
            question_id = request.data.get('coding_problem_id')
            course_id = request.data.get('course_id')
            topic_id = request.data.get('topic_id')
            test_cases_basic = request.data.get('test_cases_basic', [])
            test_cases_advanced = request.data.get('test_cases_advanced', [])
            test_cases_custom = request.data.get('test_cases_custom', [])
            
            if not code or not language or not question_id:
                return Response({
                    'error': 'Missing required fields: code, language, coding_problem_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                question = Question.objects.get(id=question_id)
            except Question.DoesNotExist:
                return Response({
                    'error': 'Question not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Use provided test cases or fall back to question's test cases
            if not test_cases_basic:
                test_cases_basic = question.test_cases_basic or []
            if not test_cases_advanced:
                test_cases_advanced = question.test_cases_advanced or []
            
            service_url = os.environ.get('CODE_EXECUTOR_URL', 'http://code-executor:8002')
            
            payload = {
                'code': code,
                'language': language,
                'test_cases_basic': test_cases_basic,
                'test_cases_advanced': test_cases_advanced,
                'test_cases_custom': test_cases_custom,
                'timeout': 10
            }
            
            executor_response = requests.post(
                f"{service_url}/execute-with-tests",
                json=payload,
                timeout=15
            )
            response_data = executor_response.json()
            
            plagiarism_score = 0.0
            plagiarism_details = {}
            
            try:
                reference_submissions = []
                
                recent_submissions = CodePracticeQuestionSubmission.objects.filter(
                    question=question
                ).exclude(user=request.user).select_related('user').order_by('-created_at')[:20]
                
                for submission in recent_submissions:
                    code_data = submission.answer_data.get('code', '') if submission.answer_data else ''
                    reference_submissions.append({
                        'submission_id': str(submission.id),
                        'user_id': str(submission.user.id),
                        'answer_data': {'code': code_data}
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
                        plagiarism_score = plag_data.get('max_similarity', 0.0)
                        plagiarism_details = plag_data
                        
            except Exception as e:
                print(f"Plagiarism check failed: {e}")
                pass
            
            exec_res = response_data.get('execution_result', {})
            
            # Get separate test results
            basic_results = response_data.get('basic_results', [])
            advanced_results = response_data.get('advanced_results', [])
            custom_results = response_data.get('custom_results', [])
            
            # Get counts
            basic_passed = response_data.get('basic_passed', 0)
            advanced_passed = response_data.get('advanced_passed', 0)
            custom_passed = response_data.get('custom_passed', 0)
            
            total_tests = response_data.get('total_tests', 0)
            total_passed = response_data.get('total_passed', 0)
            is_successful = total_tests > 0 and total_passed == total_tests
            
            # Check if submission already exists for this user and question
            existing_submission = CodePracticeQuestionSubmission.objects.filter(
                user=request.user,
                question=question
            ).first()
            
            if existing_submission:
                # Update existing submission
                submission = existing_submission
                
                # Add current submission to history
                history_entry = {
                    'timestamp': timezone.now().isoformat(),
                    'answer_data': {
                        'code': code,
                        'language': language,
                        'test_cases_basic': test_cases_basic,
                        'test_cases_advanced': test_cases_advanced,
                        'test_cases_custom': test_cases_custom
                    },
                    'execution_results': {
                        'execution_result': exec_res,
                        'basic_results': basic_results,
                        'advanced_results': advanced_results,
                        'custom_results': custom_results,
                        'basic_passed': basic_passed,
                        'advanced_passed': advanced_passed,
                        'custom_passed': custom_passed,
                        'total_passed': total_passed,
                        'total_tests': total_tests,
                        'success': exec_res.get('success', False)
                    },
                    'plagiarism_data': {
                        'is_plagiarized': plagiarism_score > 0.8,
                        'similarity_score': plagiarism_score,
                        'matched_with': plagiarism_details.get('best_match', {}).get('submission_id', '') if plagiarism_details else ''
                    },
                    'is_auto_save': False
                }
                
                # Update submission fields
                submission.answer_latest = {
                    'code': code,
                    'language': language,
                    'test_cases_basic': test_cases_basic,
                    'test_cases_advanced': test_cases_advanced,
                    'test_cases_custom': test_cases_custom
                }
                submission.answer_history.append(history_entry)
                submission.answer_attempt_count += 1
                submission.execution_output = exec_res.get('output', '')
                submission.evaluation_results = {
                    'execution_result': exec_res,
                    'basic_results': basic_results,
                    'advanced_results': advanced_results,
                    'custom_results': custom_results,
                    'basic_passed': basic_passed,
                    'advanced_passed': advanced_passed,
                    'custom_passed': custom_passed,
                    'total_passed': total_passed,
                    'total_tests': total_tests,
                    'success': exec_res.get('success', False)
                }
                submission.plagiarism_data = {
                    'is_plagiarized': plagiarism_score > 0.8,
                    'similarity_score': plagiarism_score,
                    'matched_with': plagiarism_details.get('best_match', {}).get('submission_id', '') if plagiarism_details else ''
                }
                submission.marks_obtained = question.marks if is_successful else 0
                
                # Update course and topic from frontend or question if not set
                if course_id and not submission.course:
                    try:
                        from course.models import Course
                        submission.course = Course.objects.get(id=course_id)
                    except Course.DoesNotExist:
                        pass
                elif not submission.course and question.course:
                    submission.course = question.course
                    
                if topic_id and not submission.topic:
                    try:
                        from course.models import Topic
                        submission.topic = Topic.objects.get(id=topic_id)
                    except Topic.DoesNotExist:
                        pass
                elif not submission.topic and question.topic:
                    submission.topic = question.topic
                elif not submission.topic and question.subtopic and question.subtopic.topic:
                    submission.topic = question.subtopic.topic
                    
                submission.save()
                
            else:
                # Determine course and topic from frontend or question
                course = None
                topic = None
                
                # Try to get course and topic from frontend parameters first
                if course_id:
                    try:
                        from course.models import Course
                        course = Course.objects.get(id=course_id)
                    except Course.DoesNotExist:
                        pass
                        
                if topic_id:
                    try:
                        from course.models import Topic
                        topic = Topic.objects.get(id=topic_id)
                    except Topic.DoesNotExist:
                        pass
                
                # Fall back to question's relationships if not provided from frontend
                if not course:
                    course = question.course
                if not topic:
                    topic = question.topic
                    if not topic and question.subtopic:
                        topic = question.subtopic.topic
                
                # Create new submission
                submission = CodePracticeQuestionSubmission.objects.create(
                    user=request.user,
                    question=question,
                    course=course,
                    topic=topic,
                    status=CodePracticeQuestionSubmission.STATUS_COMPLETED,
                    answer_latest={
                        'code': code,
                        'language': language,
                        'test_cases_basic': test_cases_basic,
                        'test_cases_advanced': test_cases_advanced,
                        'test_cases_custom': test_cases_custom
                    },
                    answer_history=[{
                        'timestamp': timezone.now().isoformat(),
                        'answer_data': {
                            'code': code,
                            'language': language,
                            'test_cases_basic': test_cases_basic,
                            'test_cases_advanced': test_cases_advanced,
                            'test_cases_custom': test_cases_custom
                        },
                        'execution_results': {
                            'execution_result': exec_res,
                            'basic_results': basic_results,
                            'advanced_results': advanced_results,
                            'custom_results': custom_results,
                            'basic_passed': basic_passed,
                            'advanced_passed': advanced_passed,
                            'custom_passed': custom_passed,
                            'total_passed': total_passed,
                            'total_tests': total_tests,
                            'success': exec_res.get('success', False)
                        },
                        'plagiarism_data': {
                            'is_plagiarized': plagiarism_score > 0.8,
                            'similarity_score': plagiarism_score,
                            'matched_with': plagiarism_details.get('best_match', {}).get('submission_id', '') if plagiarism_details else ''
                        },
                        'is_auto_save': False
                    }],
                    execution_output=exec_res.get('output', ''),
                    evaluation_results={
                        'execution_result': exec_res,
                        'basic_results': basic_results,
                        'advanced_results': advanced_results,
                        'custom_results': custom_results,
                        'basic_passed': basic_passed,
                        'advanced_passed': advanced_passed,
                        'custom_passed': custom_passed,
                        'total_passed': total_passed,
                        'total_tests': total_tests,
                        'success': exec_res.get('success', False)
                    },
                    plagiarism_data={
                        'is_plagiarized': plagiarism_score > 0.8,
                        'similarity_score': plagiarism_score,
                        'matched_with': plagiarism_details.get('best_match', {}).get('submission_id', '') if plagiarism_details else ''
                    },
                    answer_attempt_count=1,
                    marks_obtained=question.marks if is_successful else 0
                )
            
            # Calculate test case counts for filtering results
            basic_count = len(test_cases_basic)
            custom_count = len(test_cases_custom)
            advanced_count = len(test_cases_advanced)
            visible_test_count = basic_count + custom_count
            total_test_count = basic_count + custom_count + advanced_count
            
            # Show basic and custom test case results to the user
            visible_test_results = basic_results + custom_results
            visible_passed = basic_passed + custom_passed
            visible_test_count = len(basic_results) + len(custom_results)
            
            # Create masked advanced test case results
            masked_advanced_results = []
            for i, result in enumerate(advanced_results):
                # Mask parts of input and expected output for advanced test cases
                masked_input = self._mask_test_data(result.get('input', ''))
                masked_expected = self._mask_test_data(result.get('expected_output', ''))
                
                masked_advanced_results.append({
                    'passed': result.get('passed', False),
                    'input': masked_input,
                    'expected_output': masked_expected,
                    'actual_output': result.get('actual_output', '') if result.get('passed', False) else '***',
                    'error': result.get('error', '') if not result.get('passed', False) else '',
                    'execution_time': result.get('execution_time', 0),
                    'is_hidden': True,
                    'test_case_number': visible_test_count + i + 1
                })
            
            # Combine visible and masked advanced test results
            all_displayed_results = visible_test_results + masked_advanced_results
            
            # Calculate overall success including hidden advanced tests
            overall_success = total_tests > 0 and total_passed == total_tests
            
            formatted_response = {
                'id': submission.id,
                'coding_problem': str(question.id),
                'problem_title': question.title,
                'problem_description': question.content,
                'code': code,
                'language': language,
                'status': 'completed',  # Always completed if submission was processed
                'output': submission.execution_output,
                'error_message': exec_res.get('error', ''),
                'execution_time': exec_res.get('execution_time', 0),
                'memory_usage': exec_res.get('memory_usage', 0),
                'test_cases_passed': total_passed,  # Show total passed including advanced
                'total_test_cases': total_tests,  # Show total including advanced
                'plagiarism_score': plagiarism_score,
                'plagiarism_details': plagiarism_details,
                'created_at': submission.created_at.isoformat(),
                'updated_at': submission.updated_at.isoformat(),
                'test_results': {
                    'passed': total_passed,
                    'total': total_tests,
                    'total_passed': total_passed,
                    'total_tests': total_tests,
                    'success': overall_success,
                    'test_results': all_displayed_results,
                    'results': all_displayed_results,
                    'visible_passed': visible_passed,
                    'visible_total': visible_test_count,
                    'advanced_passed': total_passed - visible_passed if total_tests > visible_test_count else 0,
                    'advanced_total': advanced_count,
                    'overall_success': overall_success
                },
                'plagiarism_flagged': plagiarism_score > 0.8
            }
            
            return Response(formatted_response, status=status.HTTP_201_CREATED)
            
        except requests.exceptions.RequestException as e:
            return Response({
                'status': 'error',
                'error_message': f"Code Executor Service Unavailable: {str(e)}",
                'execution_result': {'success': False},
                'test_results': []
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
 