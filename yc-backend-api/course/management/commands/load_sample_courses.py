from django.core.management.base import BaseCommand
from course.models import Course, Topic, Subtopic, Video, CodingProblem, Quiz


class Command(BaseCommand):
    help = 'Load sample course data for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing course data before loading',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(
                self.style.WARNING('Clearing existing course data...')
            )
            # Clear course data (this will cascade to related models)
            Course.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS('Existing course data cleared.')
            )

        self.stdout.write('Loading sample course data...')
        
        try:
            # Create Data Structures Course
            ds_course = Course.objects.create(
                short_code="DS101",
                name="Data Structures and Algorithms Fundamentals",
                category="fundamentals"
            )
            
            # Create Python Course
            py_course = Course.objects.create(
                short_code="PY101",
                name="Python Programming Complete Course",
                category="programming_languages"
            )
            
            # Create Topics for Data Structures Course
            ds_intro_topic = Topic.objects.create(
                course=ds_course,
                name="Introduction to Data Structures",
                order_index=0
            )
            
            ds_linear_topic = Topic.objects.create(
                course=ds_course,
                name="Linear Data Structures",
                order_index=1
            )
            
            # Create Topics for Python Course
            py_basics_topic = Topic.objects.create(
                course=py_course,
                name="Python Basics",
                order_index=0
            )
            
            py_oop_topic = Topic.objects.create(
                course=py_course,
                name="Object-Oriented Programming",
                order_index=1
            )
            
            # Create Subtopics for Data Structures
            ds_what_subtopic = Subtopic.objects.create(
                topic=ds_intro_topic,
                name="What are Data Structures?",
                content="Data structures are ways of organizing and storing data so that they can be accessed and worked with efficiently.",
                order_index=0
            )
            
            ds_complexity_subtopic = Subtopic.objects.create(
                topic=ds_intro_topic,
                name="Time and Space Complexity",
                content="Understanding Big O notation and how to analyze the efficiency of algorithms.",
                order_index=1
            )
            
            ds_arrays_subtopic = Subtopic.objects.create(
                topic=ds_linear_topic,
                name="Arrays and Lists",
                content="Arrays are collections of elements stored at contiguous memory locations.",
                order_index=0
            )
            
            ds_stacks_subtopic = Subtopic.objects.create(
                topic=ds_linear_topic,
                name="Stacks and Queues",
                content="Stacks follow LIFO principle, while queues follow FIFO principle.",
                order_index=1
            )
            
            # Create Subtopics for Python
            py_syntax_subtopic = Subtopic.objects.create(
                topic=py_basics_topic,
                name="Python Syntax and Variables",
                content="Learn the basic syntax of Python and how to declare variables.",
                order_index=0
            )
            
            py_control_subtopic = Subtopic.objects.create(
                topic=py_basics_topic,
                name="Control Flow and Loops",
                content="Understanding if statements, for loops, and while loops in Python.",
                order_index=1
            )
            
            py_classes_subtopic = Subtopic.objects.create(
                topic=py_oop_topic,
                name="Classes and Objects",
                content="Learn how to create classes and instantiate objects in Python.",
                order_index=0
            )
            
            py_inheritance_subtopic = Subtopic.objects.create(
                topic=py_oop_topic,
                name="Inheritance and Polymorphism",
                content="Understanding inheritance and polymorphism in Python OOP.",
                order_index=1
            )
            
            # Create Videos
            Video.objects.create(
                sub_topic=ds_what_subtopic,
                title="Introduction to Data Structures - Complete Overview",
                video_link="https://www.youtube.com/watch?v=bum_19loj9A",
                ai_context="This video provides a comprehensive introduction to data structures."
            )
            
            Video.objects.create(
                sub_topic=ds_complexity_subtopic,
                title="Big O Notation Explained",
                video_link="https://www.youtube.com/watch?v=D6xkbGLQesk",
                ai_context="Explains time and space complexity analysis using Big O notation."
            )
            
            Video.objects.create(
                sub_topic=py_syntax_subtopic,
                title="Python Variables and Data Types",
                video_link="https://www.youtube.com/watch?v=kqtD5dpn9C8",
                ai_context="Covers Python's basic syntax and variable declaration."
            )
            
            # Create Coding Problems
            CodingProblem.objects.create(
                sub_topic=ds_arrays_subtopic,
                title="Two Sum Problem",
                description="Given an array of integers and a target, return indices of two numbers that add up to target.",
                input="nums = [2,7,11,15], target = 9",
                test_cases=[
                    {
                        "input": {"nums": [2, 7, 11, 15], "target": 9},
                        "expected_output": [0, 1],
                        "description": "Basic case with solution at beginning"
                    }
                ]
            )
            
            CodingProblem.objects.create(
                sub_topic=py_syntax_subtopic,
                title="FizzBuzz",
                description="Print numbers 1 to n, but print 'Fizz' for multiples of 3, 'Buzz' for multiples of 5, and 'FizzBuzz' for multiples of both.",
                input="n = 15",
                test_cases=[
                    {
                        "input": {"n": 15},
                        "expected_output": ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"],
                        "description": "Standard FizzBuzz up to 15"
                    }
                ]
            )
            
            # Create Quizzes
            Quiz.objects.create(
                sub_topic=ds_what_subtopic,
                question="What is the main purpose of data structures?",
                options=[
                    "To make code look prettier",
                    "To organize and store data efficiently",
                    "To increase file size",
                    "To slow down programs"
                ],
                correct_answer_index=1  # "To organize and store data efficiently"
            )
            
            Quiz.objects.create(
                sub_topic=ds_complexity_subtopic,
                question="What does O(n) represent in Big O notation?",
                options=[
                    "Constant time complexity",
                    "Linear time complexity",
                    "Quadratic time complexity",
                    "Logarithmic time complexity"
                ],
                correct_answer_index=1  # "Linear time complexity"
            )
            
            Quiz.objects.create(
                sub_topic=py_syntax_subtopic,
                question="Which of the following is NOT a valid Python variable name?",
                options=[
                    "my_variable",
                    "_private_var",
                    "2nd_variable",
                    "variable2"
                ],
                correct_answer_index=2  # "2nd_variable"
            )
            
            Quiz.objects.create(
                sub_topic=ds_arrays_subtopic,
                question="What is the time complexity of accessing an element in an array by index?",
                options=[
                    "O(1)",
                    "O(n)",
                    "O(log n)",
                    "O(n²)"
                ],
                correct_answer_index=0  # "O(1)"
            )
            
            Quiz.objects.create(
                sub_topic=py_classes_subtopic,
                question="What keyword is used to create a class in Python?",
                options=[
                    "class",
                    "def",
                    "create",
                    "new"
                ],
                correct_answer_index=0  # "class"
            )
            
            self.stdout.write(
                self.style.SUCCESS('Successfully loaded sample course data!')
            )
            
            # Display summary
            courses_count = Course.objects.count()
            topics_count = Topic.objects.count()
            subtopics_count = Subtopic.objects.count()
            videos_count = Video.objects.count()
            problems_count = CodingProblem.objects.count()
            quizzes_count = Quiz.objects.count()
            
            self.stdout.write(f'\nData Summary:')
            self.stdout.write(f'- Courses: {courses_count}')
            self.stdout.write(f'- Topics: {topics_count}')
            self.stdout.write(f'- Subtopics: {subtopics_count}')
            self.stdout.write(f'- Videos: {videos_count}')
            self.stdout.write(f'- Coding Problems: {problems_count}')
            self.stdout.write(f'- Quizzes: {quizzes_count}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error loading data: {str(e)}')
            )