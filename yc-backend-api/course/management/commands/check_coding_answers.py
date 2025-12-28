from django.core.management.base import BaseCommand
from course.models import UserCourseProgress
import json

class Command(BaseCommand):
    help = 'Check the format of coding_answers in UserCourseProgress records'

    def handle(self, *args, **options):
        progress_records = UserCourseProgress.objects.filter(
            coding_answers__isnull=False
        ).exclude(coding_answers={})
        
        self.stdout.write(f"Found {progress_records.count()} records with coding_answers data")
        
        for progress in progress_records[:10]:  # Show first 10 records
            self.stdout.write(f"\nUser: {progress.user.username}")
            self.stdout.write(f"Subtopic: {progress.subtopic.name}")
            self.stdout.write(f"Coding Answers: {json.dumps(progress.coding_answers, indent=2)}")
            
            # Check format of each answer
            for q_id, answer_data in progress.coding_answers.items():
                if isinstance(answer_data, dict):
                    self.stdout.write(f"  Question {q_id}: DETAILED format ✓")
                    if 'user_code' in answer_data:
                        self.stdout.write(f"    - Has user_code: {len(answer_data['user_code'])} chars")
                    if 'language' in answer_data:
                        self.stdout.write(f"    - Language: {answer_data['language']}")
                    if 'test_results' in answer_data:
                        self.stdout.write(f"    - Test results: {answer_data['test_results']}")
                elif isinstance(answer_data, bool):
                    self.stdout.write(f"  Question {q_id}: SIMPLE format (boolean: {answer_data})")
                else:
                    self.stdout.write(f"  Question {q_id}: UNKNOWN format: {type(answer_data)}")