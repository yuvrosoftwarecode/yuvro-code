from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from assessment.models import Contest, MockInterview, JobTest, SkillTest, UserSubmission

User = get_user_model()

class Command(BaseCommand):
    help = 'Load sample contests and mock interviews for testing'

    def handle(self, *args, **options):
        self.stdout.write('Loading sample assessments...')
        
        # Get or create users
        admin_user, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'username': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'role': 'admin'
            }
        )
        
        instructor, created = User.objects.get_or_create(
            username='instructor1',
            defaults={
                'email': 'instructor1@example.com',
                'first_name': 'John',
                'last_name': 'Instructor',
                'role': 'instructor'
            }
        )
        
        instructor2, created = User.objects.get_or_create(
            username='instructor2',
            defaults={
                'email': 'instructor2@example.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'role': 'instructor'
            }
        )
        
        student1, created = User.objects.get_or_create(
            username='student1',
            defaults={
                'email': 'student1@example.com',
                'first_name': 'Alice',
                'last_name': 'Student',
                'role': 'student'
            }
        )
        
        student2, created = User.objects.get_or_create(
            username='student2',
            defaults={
                'email': 'student2@example.com',
                'first_name': 'Bob',
                'last_name': 'Johnson',
                'role': 'student'
            }
        )
        
        # Sample contests data
        contests_data = [
            {
                'title': 'Weekly Coding Challenge #1',
                'organizer': 'Yuvro Platform',
                'type': Contest.TYPE_WEEKLY,
                'status': Contest.STATUS_UPCOMING,
                'start_date': timezone.now() + timedelta(days=2),
                'end_date': timezone.now() + timedelta(days=2, hours=2),
                'duration': 7200,  # 2 hours in seconds
                'prize': '₹10,000',
                'difficulty': Contest.DIFF_MEDIUM,
                'description': 'A weekly coding challenge focusing on algorithms and data structures.',
                'participants_count': 45,
                'questions_config': {
                    'mcq_single': ['1'],
                    'mcq_multiple': ['2'],
                    'coding': ['3'],
                    'descriptive': []
                },
            },
            {
                'title': 'Company Hiring Contest - TechCorp',
                'organizer': 'TechCorp Solutions',
                'type': Contest.TYPE_COMPANY,
                'status': Contest.STATUS_ONGOING,
                'start_date': timezone.now() - timedelta(hours=1),
                'end_date': timezone.now() + timedelta(hours=3),
                'duration': 14400,  # 4 hours in seconds
                'prize': 'Job Opportunity',
                'difficulty': Contest.DIFF_HARD,
                'description': 'Hiring contest for software engineering positions at TechCorp.',
                'participants_count': 128,
                'questions_config': {
                    'mcq_single': ['4', '5'],
                    'mcq_multiple': ['6'],
                    'coding': ['7'],
                    'descriptive': []
                },
            },
            {
                'title': 'College Programming Contest',
                'organizer': 'MIT Computer Science',
                'type': Contest.TYPE_COLLEGE,
                'status': Contest.STATUS_PAST,
                'start_date': timezone.now() - timedelta(days=7),
                'end_date': timezone.now() - timedelta(days=7, hours=-3),
                'duration': 10800,  # 3 hours in seconds
                'prize': '₹25,000',
                'difficulty': Contest.DIFF_HARD,
                'description': 'Annual programming contest for college students.',
                'participants_count': 89,
                'questions_config': {
                    'mcq_single': ['8'],
                    'mcq_multiple': ['9'],
                    'coding': ['10'],
                    'descriptive': []
                },
            },
            {
                'title': 'Beginner Friendly Contest',
                'organizer': 'CodeLearn Academy',
                'type': Contest.TYPE_WEEKLY,
                'status': Contest.STATUS_UPCOMING,
                'start_date': timezone.now() + timedelta(days=5),
                'end_date': timezone.now() + timedelta(days=5, hours=1, minutes=30),
                'duration': 5400,  # 1.5 hours in seconds
                'prize': '₹5,000',
                'difficulty': Contest.DIFF_EASY,
                'description': 'Perfect contest for beginners to get started with competitive programming.',
                'participants_count': 67,
                'questions_config': {
                    'mcq_single': ['11'],
                    'mcq_multiple': ['12'],
                    'coding': [],
                    'descriptive': []
                },
            },
        ]

        # Sample skill tests data
        from course.models import Course, Topic
        
        # Get sample courses and topics
        try:
            js_course = Course.objects.filter(name__icontains='javascript').first()
            python_course = Course.objects.filter(name__icontains='python').first()
            
            if not js_course:
                js_course = Course.objects.create(
                    name='JavaScript Fundamentals',
                    category='programming_languages',
                    short_code='JS101'
                )
            
            if not python_course:
                python_course = Course.objects.create(
                    name='Python Programming',
                    category='programming_languages', 
                    short_code='PY101'
                )
            
            # Get or create topics
            js_basics_topic, _ = Topic.objects.get_or_create(
                course=js_course,
                name='JavaScript Basics',
                defaults={'order_index': 1}
            )
            
            js_dom_topic, _ = Topic.objects.get_or_create(
                course=js_course,
                name='DOM Manipulation',
                defaults={'order_index': 2}
            )
            
            python_basics_topic, _ = Topic.objects.get_or_create(
                course=python_course,
                name='Python Basics',
                defaults={'order_index': 1}
            )
            
        except Exception as e:
            self.stdout.write(f'Warning: Could not create sample courses/topics: {e}')
            js_course = python_course = None
            js_basics_topic = js_dom_topic = python_basics_topic = None

        skill_tests_data = [
            {
                'title': 'JavaScript Variables and Functions',
                'description': 'Test your knowledge of JavaScript variables, functions, and basic syntax',
                'instructions': 'Answer all questions within the time limit. No external resources allowed.',
                'difficulty': 'easy',
                'duration': 30,
                'total_marks': 50,
                'passing_marks': 30,
                'enable_proctoring': False,
                'publish_status': 'active',
                'course': js_course,
                'topic': js_basics_topic,
                'questions_config': {
                    'mcq_single': ['1', '2'],
                    'mcq_multiple': ['3'],
                    'coding': [],
                    'descriptive': []
                },
                'questions_random_config': {
                    'mcq_single': 5,
                    'mcq_multiple': 2,
                    'coding': 0,
                    'descriptive': 0
                }
            },
            {
                'title': 'DOM Manipulation Skills Test',
                'description': 'Assess your ability to manipulate DOM elements using JavaScript',
                'instructions': 'Complete the coding challenges and answer the questions.',
                'difficulty': 'medium',
                'duration': 45,
                'total_marks': 75,
                'passing_marks': 45,
                'enable_proctoring': True,
                'publish_status': 'active',
                'course': js_course,
                'topic': js_dom_topic,
                'questions_config': {
                    'mcq_single': ['4'],
                    'mcq_multiple': [],
                    'coding': ['5'],
                    'descriptive': []
                },
                'questions_random_config': {
                    'mcq_single': 3,
                    'mcq_multiple': 1,
                    'coding': 2,
                    'descriptive': 0
                }
            },
            {
                'title': 'Python Fundamentals Assessment',
                'description': 'Comprehensive test covering Python basics, data types, and control structures',
                'instructions': 'Read each question carefully and provide accurate answers.',
                'difficulty': 'easy',
                'duration': 40,
                'total_marks': 60,
                'passing_marks': 36,
                'enable_proctoring': False,
                'publish_status': 'active',
                'course': python_course,
                'topic': python_basics_topic,
                'questions_config': {
                    'mcq_single': ['6', '7'],
                    'mcq_multiple': ['8'],
                    'coding': ['9'],
                    'descriptive': []
                },
                'questions_random_config': {
                    'mcq_single': 4,
                    'mcq_multiple': 2,
                    'coding': 1,
                    'descriptive': 1
                }
            },
            {
                'title': 'Advanced JavaScript Concepts',
                'description': 'Test your understanding of closures, promises, async/await, and ES6+ features',
                'instructions': 'This is an advanced test. Take your time to think through each problem.',
                'difficulty': 'hard',
                'duration': 60,
                'total_marks': 100,
                'passing_marks': 70,
                'enable_proctoring': True,
                'publish_status': 'draft',
                'course': js_course,
                'topic': None,  # Course-level test
                'questions_config': {
                    'mcq_single': ['10'],
                    'mcq_multiple': ['11'],
                    'coding': ['12', '13'],
                    'descriptive': ['14']
                },
                'questions_random_config': {
                    'mcq_single': 2,
                    'mcq_multiple': 1,
                    'coding': 3,
                    'descriptive': 1
                }
            }
        ]

        # Sample mock interviews
        interviews_data = [
            {
                'title': 'Frontend Developer Technical Interview',
                'description': 'Technical interview focusing on React, JavaScript, and CSS fundamentals',
                'type': MockInterview.TYPE_TECHNICAL,
                'difficulty': MockInterview.DIFFICULTY_MEDIUM,
                'status': MockInterview.STATUS_SCHEDULED,
                'scheduled_date': timezone.now() + timedelta(days=2),
                'duration': 60,
                'interviewer': instructor,
                'interviewee': student1,
                'meeting_link': 'https://meet.google.com/abc-defg-hij',
                'meeting_id': 'abc-defg-hij',
                'questions': [
                    {'question': 'Explain the difference between let, const, and var in JavaScript'},
                    {'question': 'What are React hooks and how do they work?'},
                    {'question': 'How would you optimize a React application for performance?'}
                ]
            },
            {
                'title': 'Backend Developer System Design Interview',
                'description': 'System design interview for backend developer position',
                'type': MockInterview.TYPE_SYSTEM_DESIGN,
                'difficulty': MockInterview.DIFFICULTY_HARD,
                'status': MockInterview.STATUS_SCHEDULED,
                'scheduled_date': timezone.now() + timedelta(days=5),
                'duration': 90,
                'interviewer': instructor2,
                'interviewee': student2,
                'meeting_link': 'https://zoom.us/j/123456789',
                'meeting_id': '123-456-789',
                'questions': [
                    {'question': 'Design a URL shortening service like bit.ly'},
                    {'question': 'How would you handle rate limiting in your system?'},
                    {'question': 'Explain database sharding and when you would use it'}
                ]
            },
            {
                'title': 'Behavioral Interview - Software Engineer',
                'description': 'Behavioral interview to assess soft skills and cultural fit',
                'type': MockInterview.TYPE_BEHAVIORAL,
                'difficulty': MockInterview.DIFFICULTY_EASY,
                'status': MockInterview.STATUS_COMPLETED,
                'scheduled_date': timezone.now() - timedelta(days=3),
                'duration': 45,
                'interviewer': instructor,
                'interviewee': student1,
                'meeting_link': 'https://meet.google.com/xyz-uvw-rst',
                'meeting_id': 'xyz-uvw-rst',
                'questions': [
                    {'question': 'Tell me about a time you faced a challenging problem at work'},
                    {'question': 'How do you handle conflicts with team members?'},
                    {'question': 'Where do you see yourself in 5 years?'}
                ],
                'notes': 'Candidate showed good communication skills and problem-solving approach',
                'feedback': 'Strong candidate with excellent soft skills. Recommended for next round.',
                'technical_score': 8,
                'communication_score': 9,
                'problem_solving_score': 8,
                'overall_score': 8.3
            },
            {
                'title': 'Coding Challenge - Data Structures',
                'description': 'Live coding interview focusing on algorithms and data structures',
                'type': MockInterview.TYPE_CODING,
                'difficulty': MockInterview.DIFFICULTY_MEDIUM,
                'status': MockInterview.STATUS_ONGOING,
                'scheduled_date': timezone.now() - timedelta(minutes=30),
                'duration': 75,
                'interviewer': instructor2,
                'interviewee': student2,
                'meeting_link': 'https://meet.google.com/coding-session',
                'meeting_id': 'coding-123',
                'questions': [
                    {'question': 'Implement a binary search algorithm'},
                    {'question': 'Find the longest palindromic substring'},
                    {'question': 'Design and implement a LRU cache'}
                ]
            }
        ]

        # Create contests
        contest_count = 0
        for contest_data in contests_data:
            contest, created = Contest.objects.get_or_create(
                title=contest_data['title'],
                defaults={
                    **contest_data,
                    'created_by': admin_user,
                }
            )
            if created:
                contest_count += 1
                self.stdout.write(f'Created contest: {contest.title}')

        # Create skill tests
        skill_test_count = 0
        for skill_test_data in skill_tests_data:
            if skill_test_data['course']:  # Only create if course exists
                skill_test, created = SkillTest.objects.get_or_create(
                    title=skill_test_data['title'],
                    defaults={
                        **skill_test_data,
                        'created_by': instructor,
                    }
                )
                if created:
                    skill_test_count += 1
                    self.stdout.write(f'Created skill test: {skill_test.title}')

        # Create mock interviews
        interview_count = 0
        for interview_data in interviews_data:
            interview, created = MockInterview.objects.get_or_create(
                title=interview_data['title'],
                interviewer=interview_data['interviewer'],
                defaults=interview_data
            )
            if created:
                interview_count += 1
                self.stdout.write(f'Created mock interview: {interview.title}')
        
        # Sample job tests
        job_tests_data = [
            {
                'title': 'Frontend Developer Assessment',
                'description': 'Comprehensive assessment for frontend developer position',
                'type': JobTest.TYPE_TECHNICAL,
                'difficulty': JobTest.DIFFICULTY_MEDIUM,
                'status': JobTest.STATUS_ACTIVE,
                'job_id': 'job_001',
                'company_name': 'TechCorp Solutions',
                'position_title': 'Senior Frontend Developer',
                'duration': 90,
                'total_marks': 100,
                'passing_marks': 70,
                'questions': [
                    {'question': 'Explain React hooks and their use cases'},
                    {'question': 'Implement a responsive navigation component'},
                    {'question': 'Optimize a React application for performance'}
                ],
                'instructions': 'Complete all questions within the time limit. Proctoring is enabled.',
                'enable_proctoring': True,
                'enable_screen_recording': True,
                'enable_webcam_monitoring': True,
                'enable_tab_switching_detection': True,
                'start_date': timezone.now() - timedelta(days=1),
                'end_date': timezone.now() + timedelta(days=30),
                'created_by': instructor,
            },
            {
                'title': 'Backend Developer Coding Challenge',
                'description': 'Coding challenge for backend developer role',
                'type': JobTest.TYPE_CODING,
                'difficulty': JobTest.DIFFICULTY_HARD,
                'status': JobTest.STATUS_ACTIVE,
                'job_id': 'job_002',
                'company_name': 'DataFlow Inc',
                'position_title': 'Backend Engineer',
                'duration': 120,
                'total_marks': 150,
                'passing_marks': 90,
                'questions': [
                    {'question': 'Design and implement a REST API for user management'},
                    {'question': 'Optimize database queries for large datasets'},
                    {'question': 'Implement caching strategy for high-traffic application'}
                ],
                'instructions': 'Focus on code quality, scalability, and best practices.',
                'enable_proctoring': True,
                'enable_screen_recording': False,
                'enable_webcam_monitoring': True,
                'enable_tab_switching_detection': True,
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=15),
                'created_by': instructor2,
            },
            {
                'title': 'Data Scientist Aptitude Test',
                'description': 'Aptitude and technical assessment for data scientist position',
                'type': JobTest.TYPE_APTITUDE,
                'difficulty': JobTest.DIFFICULTY_MEDIUM,
                'status': JobTest.STATUS_ACTIVE,
                'job_id': 'job_003',
                'company_name': 'AI Innovations',
                'position_title': 'Data Scientist',
                'duration': 60,
                'total_marks': 80,
                'passing_marks': 56,
                'questions': [
                    {'question': 'Statistical analysis and probability questions'},
                    {'question': 'Machine learning algorithm selection'},
                    {'question': 'Data visualization best practices'}
                ],
                'instructions': 'Answer all questions. No external resources allowed.',
                'enable_proctoring': True,
                'enable_screen_recording': False,
                'enable_webcam_monitoring': True,
                'enable_tab_switching_detection': True,
                'start_date': timezone.now() - timedelta(hours=12),
                'end_date': timezone.now() + timedelta(days=7),
                'created_by': admin_user,
            }
        ]

        # Sample user submissions
        submissions_data = [
            {
                'user': student1,
                'assessment_type': UserSubmission.ASSESSMENT_TYPE_JOB_TEST,
                'assessment_title': 'Frontend Developer Assessment',
                'status': UserSubmission.STATUS_COMPLETED,
                'started_at': timezone.now() - timedelta(hours=2),
                'submitted_at': timezone.now() - timedelta(hours=1),
                'completed_at': timezone.now() - timedelta(hours=1),
                'time_spent': 5400,  # 90 minutes
                'user_solutions': {
                    '1': 'React hooks are functions that let you use state and lifecycle features...',
                    '2': 'Here is my navigation component implementation...',
                    '3': 'Performance optimization techniques include...'
                },
                'question_scores': {'1': 8, '2': 9, '3': 7},
                'total_score': 80,
                'max_possible_score': 100,
                'technical_score': 8.0,
                'tab_switches': 2,
                'window_focus_lost_count': 1,
                'copy_paste_attempts': 0,
                'suspicious_activity_count': 0,
                'browser_info': {'browser': 'Chrome', 'version': '91.0'},
                'ip_address': '192.168.1.100',
                'evaluator_feedback': 'Good technical knowledge, clean code implementation',
                'manual_evaluation_required': False,
            },
            {
                'user': student2,
                'assessment_type': UserSubmission.ASSESSMENT_TYPE_CONTEST,
                'assessment_title': 'Weekly Coding Challenge #1',
                'status': UserSubmission.STATUS_SUBMITTED,
                'started_at': timezone.now() - timedelta(hours=3),
                'submitted_at': timezone.now() - timedelta(hours=1),
                'time_spent': 7200,  # 2 hours
                'user_solutions': {
                    '1': 'Solution for algorithm problem 1...',
                    '2': 'Solution for algorithm problem 2...',
                    '3': 'Solution for algorithm problem 3...'
                },
                'question_scores': {'1': 10, '2': 8, '3': 9},
                'total_score': 90,
                'max_possible_score': 100,
                'coding_score': 9.0,
                'tab_switches': 0,
                'window_focus_lost_count': 0,
                'copy_paste_attempts': 1,
                'suspicious_activity_count': 0,
                'browser_info': {'browser': 'Firefox', 'version': '89.0'},
                'ip_address': '192.168.1.101',
                'manual_evaluation_required': False,
            }
        ]

        # Create job tests
        job_test_count = 0
        created_job_tests = []
        for job_test_data in job_tests_data:
            job_test, created = JobTest.objects.get_or_create(
                title=job_test_data['title'],
                job_id=job_test_data['job_id'],
                defaults=job_test_data
            )
            if created:
                job_test_count += 1
                created_job_tests.append(job_test)
                self.stdout.write(f'Created job test: {job_test.title}')

        # Create user submissions
        submission_count = 0
        for submission_data in submissions_data:
            # Set assessment_id based on type
            if submission_data['assessment_type'] == UserSubmission.ASSESSMENT_TYPE_JOB_TEST:
                # Find the job test by title
                try:
                    job_test = JobTest.objects.get(title=submission_data['assessment_title'])
                    submission_data['assessment_id'] = str(job_test.id)
                except JobTest.DoesNotExist:
                    continue
            elif submission_data['assessment_type'] == UserSubmission.ASSESSMENT_TYPE_CONTEST:
                # Find the contest by title
                try:
                    contest = Contest.objects.get(title=submission_data['assessment_title'])
                    submission_data['assessment_id'] = str(contest.id)
                except Contest.DoesNotExist:
                    continue
            
            submission, created = UserSubmission.objects.get_or_create(
                user=submission_data['user'],
                assessment_type=submission_data['assessment_type'],
                assessment_id=submission_data['assessment_id'],
                defaults=submission_data
            )
            if created:
                submission.calculate_percentage_score()
                submission.save()
                submission_count += 1
                self.stdout.write(f'Created submission: {submission.user.username} - {submission.assessment_title}')

        self.stdout.write(
            self.style.SUCCESS(f'Successfully loaded {contest_count} contests, {skill_test_count} skill tests, {interview_count} mock interviews, {job_test_count} job tests, and {submission_count} submissions')
        )