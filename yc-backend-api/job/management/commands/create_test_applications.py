import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from job.models import Job, JobApplication

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test job applications from students to jobs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing applications before creating new ones',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=20,
            help='Number of applications to create',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing applications...')
            JobApplication.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing applications cleared.'))

        # Get all students
        students = User.objects.filter(role='student')
        if not students.exists():
            self.stdout.write(self.style.ERROR('No students found. Please run create_test_users first.'))
            return

        # Get all active jobs
        jobs = Job.objects.filter(status='active')
        if not jobs.exists():
            self.stdout.write(self.style.ERROR('No active jobs found. Please run load_sample_companies_and_jobs first.'))
            return

        self.stdout.write(f'Found {students.count()} students and {jobs.count()} active jobs.')
        
        count = options['count']
        created_count = 0
        
        # Status choices
        statuses = [
            'applied', 'applied', 'applied',  # Higher weight for applied
            'under_review', 'under_review',
            'shortlisted',
            'interview_scheduled',
            'selected',
            'rejected'
        ]

        # Tracking set to avoid duplicates
        existing_applications = set(
            JobApplication.objects.values_list('job_id', 'applicant_id')
        )

        for _ in range(count):
            student = random.choice(students)
            job = random.choice(jobs)

            if (job.id, student.id) in existing_applications:
                continue

            # Randomly determine dates
            days_ago = random.randint(1, 10)
            applied_at = timezone.now() - timedelta(days=days_ago)
            
            status = random.choice(statuses)
            
            application = JobApplication(
                job=job,
                applicant=student,
                is_applied=True,
                status=status,
                applied_at=applied_at,
                cover_letter=f"I am very interested in the {job.title} position at {job.company.name}. I believe my skills match the requirements perfectly.",
                expected_salary=random.randint(50000, 150000),
                expected_currency=job.currency,
                available_from=timezone.now().date() + timedelta(days=random.randint(15, 60)),
                notice_period_days=random.choice([15, 30, 45, 60, 90])
            )
            
            application.save()
            existing_applications.add((job.id, student.id))
            created_count += 1
            
            self.stdout.write(f'Created application: {student.username} -> {job.title} ({status})')

            if created_count >= count:
                break

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} job applications!'))
