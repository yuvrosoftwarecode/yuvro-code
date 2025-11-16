import json
import os
from django.core.management.base import BaseCommand
from course.models import Course, Topic, Subtopic, Video, CodingProblem, Quiz


class Command(BaseCommand):
    help = "Load sample course data for development and testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing course data before loading",
        )
        parser.add_argument(
            "--file",
            type=str,
            default="fixtures/sample_courses_data.json",
            help="Path to JSON file with course data (relative to course app)",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write(self.style.WARNING("Clearing existing course data..."))
            # Clear course data (this will cascade to related models)
            Course.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Existing course data cleared."))

        self.stdout.write("Loading sample course data...")

        try:
            # Get the path to the JSON file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            course_app_dir = os.path.dirname(os.path.dirname(current_dir))
            json_file_path = os.path.join(course_app_dir, options["file"])

            if not os.path.exists(json_file_path):
                self.stdout.write(
                    self.style.ERROR(f"JSON file not found: {json_file_path}")
                )
                return

            # Load JSON data
            with open(json_file_path, "r", encoding="utf-8") as file:
                data = json.load(file)

            # Process each course
            for course_data in data["courses"]:
                # Create or get course
                course, created = Course.objects.get_or_create(
                    short_code=course_data["short_code"],
                    defaults={
                        "name": course_data["name"],
                        "category": course_data["category"],
                    },
                )

                if created:
                    self.stdout.write(f"✓ Created course: {course.name}")
                else:
                    self.stdout.write(f"- Course already exists: {course.name}")

                # Process topics
                for topic_data in course_data.get("topics", []):
                    topic, created = Topic.objects.get_or_create(
                        course=course,
                        name=topic_data["name"],
                        defaults={"order_index": topic_data["order_index"]},
                    )

                    if created:
                        self.stdout.write(f"  ✓ Created topic: {topic.name}")

                    # Process subtopics
                    for subtopic_data in topic_data.get("subtopics", []):
                        subtopic, created = Subtopic.objects.get_or_create(
                            topic=topic,
                            name=subtopic_data["name"],
                            defaults={
                                "content": subtopic_data["content"],
                                "order_index": subtopic_data["order_index"],
                            },
                        )

                        if created:
                            self.stdout.write(
                                f"    ✓ Created subtopic: {subtopic.name}"
                            )

                        # Process videos
                        for video_data in subtopic_data.get("videos", []):
                            video, created = Video.objects.get_or_create(
                                sub_topic=subtopic,
                                title=video_data["title"],
                                defaults={
                                    "video_link": video_data["video_link"],
                                    "ai_context": video_data["ai_context"],
                                },
                            )

                            if created:
                                self.stdout.write(
                                    f"      ✓ Created video: {video.title}"
                                )

                        # Process coding problems
                        for problem_data in subtopic_data.get("coding_problems", []):
                            problem, created = CodingProblem.objects.get_or_create(
                                sub_topic=subtopic,
                                title=problem_data["title"],
                                defaults={
                                    "description": problem_data["description"],
                                    "test_cases_basic": problem_data[
                                        "test_cases_basic"
                                    ],
                                    "test_cases_advanced": problem_data.get(
                                        "test_cases_advanced", []
                                    ),
                                },
                            )

                            if created:
                                self.stdout.write(
                                    f"      ✓ Created coding problem: {problem.title}"
                                )

                        # Process quizzes
                        for quiz_data in subtopic_data.get("quizzes", []):
                            quiz, created = Quiz.objects.get_or_create(
                                sub_topic=subtopic,
                                question=quiz_data["question"],
                                defaults={
                                    "options": quiz_data["options"],
                                    "correct_answer_index": quiz_data[
                                        "correct_answer_index"
                                    ],
                                },
                            )

                            if created:
                                self.stdout.write(
                                    f"      ✓ Created quiz: {quiz.question[:50]}..."
                                )

            self.stdout.write(
                self.style.SUCCESS("Successfully loaded sample course data!")
            )

            # Display summary
            courses_count = Course.objects.count()
            topics_count = Topic.objects.count()
            subtopics_count = Subtopic.objects.count()
            videos_count = Video.objects.count()
            problems_count = CodingProblem.objects.count()
            quizzes_count = Quiz.objects.count()

            self.stdout.write(f"\nData Summary:")
            self.stdout.write(f"- Courses: {courses_count}")
            self.stdout.write(f"- Topics: {topics_count}")
            self.stdout.write(f"- Subtopics: {subtopics_count}")
            self.stdout.write(f"- Videos: {videos_count}")
            self.stdout.write(f"- Coding Problems: {problems_count}")
            self.stdout.write(f"- Quizzes: {quizzes_count}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error loading data: {str(e)}"))
