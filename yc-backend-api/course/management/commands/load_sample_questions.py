from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from course.models import Course, Topic, Subtopic, Question

User = get_user_model()


class Command(BaseCommand):
    help = 'Load sample questions for testing the Question Bank feature'

    def handle(self, *args, **options):
        # Get or create a test user
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': True,
                'role': 'admin'
            }
        )
        if created:
            user.set_password('admin123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        # Get or create a test course
        course, created = Course.objects.get_or_create(
            short_code='TEST101',
            defaults={
                'name': 'Test Course for Question Bank',
                'category': 'programming'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created course: {course.name}'))

        # Get or create a test topic
        topic, created = Topic.objects.get_or_create(
            name='Python Basics',
            course=course,
            defaults={'order_index': 1}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created topic: {topic.name}'))

        # Get or create a test subtopic
        subtopic, created = Subtopic.objects.get_or_create(
            name='Variables and Data Types',
            topic=topic,
            defaults={
                'order_index': 1,
                'content': 'Learn about Python variables and data types'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created subtopic: {subtopic.name}'))

        # Create sample questions
        sample_questions = [
            {
                'type': 'mcq',
                'title': 'What is the correct way to declare a variable in Python?',
                'content': 'Choose the correct syntax for declaring a variable in Python.',
                'level': 'subtopic',
                'subtopic': subtopic,
                'difficulty': 'easy',
                'marks': 2,
                'categories': ['learn', 'practice'],
                'mcq_options': [
                    'var x = 5',
                    'x = 5',
                    'int x = 5',
                    'declare x = 5'
                ],
                'mcq_correct_answer_index': 1
            },
            {
                'type': 'coding',
                'title': 'Hello World Program',
                'content': 'Write a Python program that prints "Hello, World!" to the console.',
                'level': 'topic',
                'topic': topic,
                'difficulty': 'easy',
                'marks': 5,
                'categories': ['practice', 'skill_test'],
                'test_cases_basic': [
                    {
                        'input': '',
                        'expected_output': 'Hello, World!'
                    }
                ],
                'test_cases_advanced': [
                    {
                        'input': '',
                        'expected_output': 'Hello, World!'
                    }
                ]
            },
            {
                'type': 'descriptive',
                'title': 'Explain Python Data Types',
                'content': 'Explain the different data types available in Python with examples.',
                'level': 'course',
                'course': course,
                'difficulty': 'medium',
                'marks': 10,
                'categories': ['learn', 'skill_test']
            },
            {
                'type': 'mcq',
                'title': 'Which of the following is a mutable data type in Python?',
                'content': 'Select the mutable data type from the options below.',
                'level': 'topic',
                'topic': topic,
                'difficulty': 'medium',
                'marks': 3,
                'categories': ['contest'],
                'mcq_options': [
                    'tuple',
                    'string',
                    'list',
                    'int'
                ],
                'mcq_correct_answer_index': 2
            },
            {
                'type': 'coding',
                'title': 'Sum of Two Numbers',
                'content': 'Write a function that takes two numbers as input and returns their sum.',
                'level': 'subtopic',
                'subtopic': subtopic,
                'difficulty': 'easy',
                'marks': 8,
                'categories': ['practice', 'skill_test'],
                'test_cases_basic': [
                    {
                        'input': '5 3',
                        'expected_output': '8'
                    },
                    {
                        'input': '10 -2',
                        'expected_output': '8'
                    }
                ],
                'test_cases_advanced': [
                    {
                        'input': '0 0',
                        'expected_output': '0'
                    },
                    {
                        'input': '-5 -3',
                        'expected_output': '-8'
                    }
                ]
            }
        ]

        created_count = 0
        for question_data in sample_questions:
            question, created = Question.objects.get_or_create(
                title=question_data['title'],
                type=question_data['type'],
                defaults={
                    **question_data,
                    'created_by': user
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created {question.type} question: {question.title}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} sample questions!')
        )
        self.stdout.write(
            self.style.SUCCESS('Question Bank feature is ready for testing!')
        )