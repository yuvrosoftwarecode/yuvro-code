import json
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from assessment.models import SkillTest, Contest, MockInterview, JobTest
from course.models import Course, Topic

User = get_user_model()


class Command(BaseCommand):
    help = 'Load comprehensive sample assessment tests from JSON file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing assessment data before loading new data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing assessment data...')
            JobTest.objects.all().delete()
            MockInterview.objects.all().delete()
            Contest.objects.all().delete()
            SkillTest.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing assessment data cleared.'))

        # Load data from JSON file
        json_file_path = os.path.join(os.path.dirname(__file__), '../../fixtures/sample_assessment_tests_data.json')
        
        try:
            with open(json_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'JSON file not found at: {json_file_path}'))
            return
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f'Invalid JSON format: {e}'))
            return

        self.stdout.write('Loading sample assessment tests from JSON...')
        
        # Load skill tests
        self.load_skill_tests_from_json(data)
        
        # Load contests
        self.load_contests_from_json(data)
        
        # Load mock interviews
        self.load_mock_interviews_from_json(data)
        
        # Load job tests
        self.load_job_tests_from_json(data)
        
        self.stdout.write(self.style.SUCCESS('Successfully loaded all sample assessment tests from JSON!'))

    def get_or_create_default_user(self):
        """Get or create a default user for creating assessments"""
        # Try to get an admin user first
        admin_user = User.objects.filter(role='admin').first()
        if admin_user:
            return admin_user
        
        # Try to get any superuser
        superuser = User.objects.filter(is_superuser=True).first()
        if superuser:
            return superuser
        
        # Try to get any staff user
        staff_user = User.objects.filter(is_staff=True).first()
        if staff_user:
            return staff_user
        
        # Create a default admin user if none exists
        default_user, created = User.objects.get_or_create(
            email='admin@yuvro.com',
            defaults={
                'username': 'admin',
                'first_name': 'System',
                'last_name': 'Admin',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            default_user.set_password('admin123')
            default_user.save()
            self.stdout.write(f'✓ Created default admin user: {default_user.email}')
        
        return default_user

    def get_course_and_topic(self, course_short_code, topic_name=None):
        """Get course and topic objects"""
        try:
            course = Course.objects.get(short_code=course_short_code)
        except Course.DoesNotExist:
            self.stdout.write(self.style.WARNING(f'Course {course_short_code} not found'))
            return None, None
        
        topic = None
        if topic_name:
            try:
                topic = Topic.objects.get(course=course, name=topic_name)
            except Topic.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Topic {topic_name} not found in course {course_short_code}'))
        
        return course, topic

    def load_skill_tests_from_json(self, data):
        """Load skill tests from JSON data"""
        
        default_user = self.get_or_create_default_user()
        
        for skill_test_data in data.get('skill_tests', []):
            self.stdout.write(f'Loading skill test: {skill_test_data["title"]}')
            
            course, topic = self.get_course_and_topic(
                skill_test_data.get('course_short_code'),
                skill_test_data.get('topic_name')
            )
            
            if not course:
                continue
            
            skill_test_kwargs = {
                'title': skill_test_data['title'],
                'description': skill_test_data['description'],
                'instructions': skill_test_data['instructions'],
                'difficulty': skill_test_data['difficulty'],
                'duration': skill_test_data['duration'],
                'total_marks': skill_test_data['total_marks'],
                'passing_marks': skill_test_data['passing_marks'],
                'enable_proctoring': skill_test_data.get('enable_proctoring', False),
                'course': course,
                'topic': topic,
                'questions_random_config': skill_test_data.get('questions_random_config', {}),
                'publish_status': skill_test_data.get('publish_status', 'draft'),
                'created_by': default_user
            }
            
            # Check if skill test already exists
            existing_skill_test = SkillTest.objects.filter(
                title=skill_test_kwargs['title'],
                course=course
            ).first()
            
            if not existing_skill_test:
                SkillTest.objects.create(**skill_test_kwargs)
                self.stdout.write(f'✓ Created skill test: {skill_test_data["title"]}')
            else:
                self.stdout.write(f'→ Skill test already exists: {skill_test_data["title"]}')

    def load_contests_from_json(self, data):
        """Load contests from JSON data"""
        
        default_user = self.get_or_create_default_user()
        
        for contest_data in data.get('contests', []):
            self.stdout.write(f'Loading contest: {contest_data["title"]}')
            
            course, topic = self.get_course_and_topic(
                contest_data.get('course_short_code'),
                contest_data.get('topic_name')
            )
            
            if not course:
                continue
            
            # Calculate start and end times
            start_days = contest_data.get('start_days_from_now', 7)
            start_datetime = timezone.now() + timedelta(days=start_days)
            end_datetime = start_datetime + timedelta(minutes=contest_data['duration'])
            
            contest_kwargs = {
                'title': contest_data['title'],
                'description': contest_data['description'],
                'instructions': contest_data['instructions'],
                'difficulty': contest_data['difficulty'],
                'duration': contest_data['duration'],
                'total_marks': contest_data['total_marks'],
                'passing_marks': contest_data['passing_marks'],
                'enable_proctoring': contest_data.get('enable_proctoring', False),
                'organizer': contest_data['organizer'],
                'type': contest_data['type'],
                'start_datetime': start_datetime,
                'end_datetime': end_datetime,
                'prize': contest_data.get('prize', ''),
                'questions_random_config': contest_data.get('questions_random_config', {}),
                'publish_status': contest_data.get('publish_status', 'draft'),
                'created_by': default_user
            }
            
            # Check if contest already exists
            existing_contest = Contest.objects.filter(
                title=contest_kwargs['title'],
                organizer=contest_kwargs['organizer']
            ).first()
            
            if not existing_contest:
                Contest.objects.create(**contest_kwargs)
                self.stdout.write(f'✓ Created contest: {contest_data["title"]}')
            else:
                self.stdout.write(f'→ Contest already exists: {contest_data["title"]}')

    def load_mock_interviews_from_json(self, data):
        """Load mock interviews from JSON data"""
        
        default_user = self.get_or_create_default_user()
        
        for mock_interview_data in data.get('mock_interviews', []):
            self.stdout.write(f'Loading mock interview: {mock_interview_data["title"]}')
            
            course, topic = self.get_course_and_topic(
                mock_interview_data.get('course_short_code'),
                mock_interview_data.get('topic_name')
            )
            
            if not course:
                continue
            
            # Calculate scheduled time
            scheduled_days = mock_interview_data.get('scheduled_days_from_now', 3)
            scheduled_datetime = timezone.now() + timedelta(days=scheduled_days)
            
            mock_interview_kwargs = {
                'title': mock_interview_data['title'],
                'description': mock_interview_data['description'],
                'instructions': mock_interview_data['instructions'],
                'type': mock_interview_data['type'],
                'difficulty': mock_interview_data['difficulty'],
                'duration': mock_interview_data['duration'],
                'total_marks': mock_interview_data['total_marks'],
                'passing_marks': mock_interview_data['passing_marks'],
                'enable_proctoring': mock_interview_data.get('enable_proctoring', False),
                'scheduled_datetime': scheduled_datetime,
                'questions_random_config': mock_interview_data.get('questions_random_config', {}),
                'publish_status': mock_interview_data.get('publish_status', 'draft'),
                'created_by': default_user
            }
            
            # Check if mock interview already exists
            existing_mock_interview = MockInterview.objects.filter(
                title=mock_interview_kwargs['title']
            ).first()
            
            if not existing_mock_interview:
                MockInterview.objects.create(**mock_interview_kwargs)
                self.stdout.write(f'✓ Created mock interview: {mock_interview_data["title"]}')
            else:
                self.stdout.write(f'→ Mock interview already exists: {mock_interview_data["title"]}')

    def load_job_tests_from_json(self, data):
        """Load job tests from JSON data"""
        
        default_user = self.get_or_create_default_user()
        
        for job_test_data in data.get('job_tests', []):
            self.stdout.write(f'Loading job test: {job_test_data["title"]}')
            
            course, topic = self.get_course_and_topic(
                job_test_data.get('course_short_code'),
                job_test_data.get('topic_name')
            )
            
            if not course:
                continue
            
            # Calculate start and end times
            start_days = job_test_data.get('start_days_from_now', 1)
            start_datetime = timezone.now() + timedelta(days=start_days)
            end_datetime = start_datetime + timedelta(days=30)  # Job tests are usually open for 30 days
            
            job_test_kwargs = {
                'title': job_test_data['title'],
                'description': job_test_data['description'],
                'instructions': job_test_data['instructions'],
                'company_name': job_test_data['company_name'],
                'position_title': job_test_data['position_title'],
                'difficulty': job_test_data['difficulty'],
                'duration': job_test_data['duration'],
                'total_marks': job_test_data['total_marks'],
                'passing_marks': job_test_data['passing_marks'],
                'enable_proctoring': job_test_data.get('enable_proctoring', False),
                'start_datetime': start_datetime,
                'end_datetime': end_datetime,
                'questions_random_config': job_test_data.get('questions_random_config', {}),
                'publish_status': job_test_data.get('publish_status', 'draft'),
                'created_by': default_user
            }
            
            # Check if job test already exists
            existing_job_test = JobTest.objects.filter(
                title=job_test_kwargs['title'],
                company_name=job_test_kwargs['company_name']
            ).first()
            
            if not existing_job_test:
                JobTest.objects.create(**job_test_kwargs)
                self.stdout.write(f'✓ Created job test: {job_test_data["title"]}')
            else:
                self.stdout.write(f'→ Job test already exists: {job_test_data["title"]}')