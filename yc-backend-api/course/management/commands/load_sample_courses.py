# course/management/commands/load_sample_courses.py
import uuid
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

from course.models import (
    Course,
    Topic,
    Subtopic,
    Video,
    CodingProblem,
    Quiz,
    CourseInstructor,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Create rich sample data: courses, topics, subtopics, videos, quizzes, coding problems."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing course data before loading",
        )

    def _get_instructors(self):
        """
        Resolve the 2 instructors from your screenshot:
        - instructor_python@yuvro.com
        - instructor_ds@yuvro.com
        """
        emails = [
            "instructor_python@yuvro.com",
            "instructor_ds@yuvro.com",
        ]
        instructors = []
        for email in emails:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise User.DoesNotExist(
                    f"Required instructor with email '{email}' does not exist. "
                    f"Create that user first."
                )
            instructors.append(user)
        return instructors[0], instructors[1]

    def handle(self, *args, **options):
        clear = options["clear"]

        if clear:
            self.stdout.write(self.style.WARNING("Clearing existing course data..."))
            # Deleting Course cascades to Topic, Subtopic, Video, CodingProblem, Quiz, CourseInstructor
            Course.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Existing course data cleared."))

        try:
            instructor1, instructor2 = self._get_instructors()
        except User.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(str(e)))
            return

        self.stdout.write(
            "Creating sample courses, topics, subtopics, and questions..."
        )

        with transaction.atomic():
            self._create_sample_data(instructor1, instructor2)

        # Summary
        self.stdout.write("\nData Summary:")
        self.stdout.write(f"- Courses: {Course.objects.count()}")
        self.stdout.write(f"- Topics: {Topic.objects.count()}")
        self.stdout.write(f"- Subtopics: {Subtopic.objects.count()}")
        self.stdout.write(f"- Videos: {Video.objects.count()}")
        self.stdout.write(f"- Coding Problems: {CodingProblem.objects.count()}")
        self.stdout.write(f"- Quizzes: {Quiz.objects.count()}")
        self.stdout.write(self.style.SUCCESS("\nDone! Sample course data created."))

    # ------------------------------------------------------------------
    # INTERNAL HELPERS
    # ------------------------------------------------------------------
    def _youtube_link(self, course_short, topic_idx, sub_idx, video_idx):
        """
        You picked V2: YouTube-style placeholder links.
        We can still make them look uniqueish per resource.
        """
        base_id = f"{course_short}-{topic_idx}-{sub_idx}-{video_idx}".replace(
            "_", ""
        ).replace("-", "")
        # Just take a slice (YouTube IDs are 11 chars, but any string is fine here)
        yt_id = (base_id or "samplevideo").lower()[:11]
        return f"https://youtu.be/{yt_id or 'samplevideo'}"

    def _basic_test_cases(self, label="sum"):
        """
        Return a small set of basic & advanced test cases.
        This is reused for all coding problems.
        """
        if label == "sum":
            basic = [
                {
                    "input": "2 3",
                    "output": "5",
                    "description": "Small positive numbers",
                },
                {"input": "10 0", "output": "10", "description": "Zero case"},
            ]
            advanced = [
                {"input": "-5 12", "output": "7", "description": "Negative + positive"},
                {
                    "input": "1000000 1000000",
                    "output": "2000000",
                    "description": "Large numbers",
                },
            ]
        else:
            basic = [
                {"input": "hello", "output": "olleh", "description": "Simple string"},
                {"input": "abc", "output": "cba", "description": "Short string"},
            ]
            advanced = [
                {"input": "racecar", "output": "racecar", "description": "Palindrome"},
                {
                    "input": "longerstring",
                    "output": "gnirtSregnol".lower(),
                    "description": "Long string",
                },
            ]
        return basic, advanced

    def _create_learn_certify_subtopic_content(
        self,
        course,
        topic,
        subtopic,
        topic_index,
        sub_index,
    ):
        """
        For each Subtopic:
        - 2 videos
        - 2 learn_certify coding problems (map to sub_topic)
        - 2 learn_certify quizzes (map to sub_topic)
        """
        # ---- Videos ----
        for v_idx in range(1, 3):
            title = f"{course.short_code} T{topic_index} S{sub_index} Video {v_idx}"
            Video.objects.create(
                sub_topic=subtopic,
                title=title,
                video_link=self._youtube_link(
                    course.short_code, topic_index, sub_index, v_idx
                ),
                ai_context=f"Context for {title} in course {course.name}",
            )

        # ---- Learn & Certify Coding Problems (sub_topic only) ----
        sum_basic, sum_advanced = self._basic_test_cases("sum")
        rev_basic, rev_advanced = self._basic_test_cases("reverse")

        CodingProblem.objects.create(
            category="learn_certify",
            topic=None,
            sub_topic=subtopic,
            title=f"{course.short_code} T{topic_index} S{sub_index} – Sum of two numbers",
            description="Write a program that reads two integers and prints their sum.",
            test_cases_basic=sum_basic,
            test_cases_advanced=sum_advanced,
        )

        CodingProblem.objects.create(
            category="learn_certify",
            topic=None,
            sub_topic=subtopic,
            title=f"{course.short_code} T{topic_index} S{sub_index} – Reverse a string",
            description="Write a program that reverses a given string.",
            test_cases_basic=rev_basic,
            test_cases_advanced=rev_advanced,
        )

        # ---- Learn & Certify Quizzes (sub_topic only) ----
        Quiz.objects.create(
            category="learn_certify",
            topic=None,
            sub_topic=subtopic,
            question=f"In {course.name}, Topic {topic_index}, Subtopic {sub_index}, what does this subtopic primarily focus on?",
            options=[
                "Core concept explanation",
                "Unrelated advanced topic",
                "Project deployment steps only",
                "None of the above",
            ],
            correct_answer_index=0,
        )

        Quiz.objects.create(
            category="learn_certify",
            topic=None,
            sub_topic=subtopic,
            question=f"Which statement is true for Topic {topic_index}, Subtopic {sub_index} in course {course.short_code}?",
            options=[
                "It introduces fundamentals with examples.",
                "It covers only theory without examples.",
                "It is not related to this course.",
                "It only has coding problems and no theory.",
            ],
            correct_answer_index=0,
        )

    def _create_topic_level_questions(self, course, topic, topic_index):
        """
        For each Topic:
        - Create basic topic-level questions for learning, practice, and skill tests
        """
        from course.models import Question
        
        # Create a simple practice coding question
        Question.objects.get_or_create(
            title=f"{course.short_code} T{topic_index} Practice - Basic Problem",
            type="coding",
            defaults={
                'content': f"Write a function to solve a basic problem for {topic.name}.",
                'level': 'topic',
                'topic': topic,
                'difficulty': 'easy',
                'marks': 10,
                'categories': ['practice'],
                'test_cases_basic': [
                    {'input': '5', 'expected_output': '5'}
                ],
                'test_cases_advanced': [
                    {'input': '10', 'expected_output': '10'}
                ]
            }
        )
        
        # Create a skill test question
        Question.objects.get_or_create(
            title=f"{course.short_code} T{topic_index} Skill Test - Assessment",
            type="mcq",
            defaults={
                'content': f"What is the main concept covered in {topic.name}?",
                'level': 'topic',
                'topic': topic,
                'difficulty': 'medium',
                'marks': 5,
                'categories': ['skill_test'],
                'mcq_options': [
                    'Concept A',
                    'Concept B', 
                    'Concept C',
                    'All of the above'
                ],
                'mcq_correct_answer_index': 3
            }
        )

    def _create_sample_data(self, instructor1, instructor2):
        """
        Core logic that creates:
        - 4 categories
        - 3 courses per category
          - 1 owned by instructor1
          - 1 owned by instructor2
          - 1 shared by both
        - Each course: 3 topics
        - Each topic: 3 subtopics
        - All required videos, quizzes, and coding problems.
        """
        categories = [
            ("fundamentals", "CS Fundamentals"),
            ("programming_languages", "Programming Languages"),
            ("databases", "Database Systems"),
            ("ai_tools", "AI Tools & Platforms"),
        ]

        for category_key, category_name in categories:
            self.stdout.write(f"\nCategory: {category_name} ({category_key})")

            # Three ownership patterns:
            ownership_patterns = [
                ("A", [instructor1], "Only Python instructor"),
                ("B", [instructor2], "Only DS instructor"),
                ("C", [instructor1, instructor2], "Both instructors"),
            ]

            for idx, (suffix, owners, desc) in enumerate(ownership_patterns, start=1):
                short_code = f"{category_key[:3].upper()}{suffix}"
                course_name = f"{category_name} – Track {suffix}"

                course, created = Course.objects.get_or_create(
                    short_code=short_code,
                    defaults={
                        "name": course_name,
                        "category": category_key,
                    },
                )

                if created:
                    self.stdout.write(f"  ✓ Created course: {course_name} [{desc}]")
                else:
                    self.stdout.write(
                        f"  - Course already exists: {course_name} [{desc}]"
                    )

                # Assign instructors via CourseInstructor
                for inst in owners:
                    CourseInstructor.objects.get_or_create(
                        course=course,
                        instructor=inst,
                    )

                # ---------------------------------
                # Create 3 topics for this course
                # ---------------------------------
                for t_idx in range(1, 4):
                    topic_name = f"Topic {t_idx}: {category_name} Concept {t_idx}"
                    topic = Topic.objects.create(
                        course=course,
                        name=topic_name,
                        order_index=t_idx - 1,
                    )

                    # Topic-level questions (simplified)
                    self._create_topic_level_questions(course, topic, t_idx)

                    # ---------------------------------
                    # Create 3 subtopics for this topic
                    # ---------------------------------
                    for s_idx in range(1, 4):
                        subtopic_name = f"Subtopic {t_idx}.{s_idx}: Deep Dive {s_idx}"
                        subtopic = Subtopic.objects.create(
                            topic=topic,
                            name=subtopic_name,
                            content=(
                                f"Content for {subtopic_name} in {course.name}. "
                                f"This explains the concept with examples and notes."
                            ),
                            order_index=s_idx - 1,
                        )

                        # Subtopic-level content (videos + learn_certify Qs)
                        self._create_learn_certify_subtopic_content(
                            course, topic, subtopic, t_idx, s_idx
                        )

        self.stdout.write(
            self.style.SUCCESS("\nSuccessfully created full sample dataset.")
        )
