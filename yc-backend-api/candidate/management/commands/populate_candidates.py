from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from authentication.models import Profile, Skill, Experience, Education
from candidate.models import CandidateProfile, CandidateSkill
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate sample candidate data'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample candidates...')
        
        # Sample data
        sample_candidates = [
            {
                'email': 'john.doe@example.com',
                'username': 'johndoe',
                'first_name': 'John',
                'last_name': 'Doe',
                'profile_data': {
                    'full_name': 'John Doe',
                    'title': 'Senior Full Stack Developer',
                    'location': 'Bangalore, India',
                    'about': 'Experienced full-stack developer with 5+ years in React, Node.js, and Python. Passionate about building scalable web applications.'
                },
                'candidate_data': {
                    'current_ctc': Decimal('12.00'),
                    'expected_ctc': Decimal('18.00'),
                    'total_experience_years': 5,
                    'total_experience_months': 3,
                    'notice_period': '30_days',
                    'highest_education': 'bachelor',
                    'domain': 'Technology',
                    'preferred_employment_types': ['full_time', 'remote'],
                    'preferred_locations': ['Bangalore', 'Mumbai', 'Remote'],
                    'preferred_company_types': ['startup', 'mid_size']
                },
                'skills': [
                    {'name': 'React', 'proficiency': 'advanced', 'years': 4.0},
                    {'name': 'Node.js', 'proficiency': 'advanced', 'years': 4.5},
                    {'name': 'Python', 'proficiency': 'intermediate', 'years': 3.0},
                    {'name': 'JavaScript', 'proficiency': 'expert', 'years': 5.0},
                    {'name': 'TypeScript', 'proficiency': 'advanced', 'years': 3.0}
                ]
            },
            {
                'email': 'sarah.wilson@example.com',
                'username': 'sarahwilson',
                'first_name': 'Sarah',
                'last_name': 'Wilson',
                'profile_data': {
                    'full_name': 'Sarah Wilson',
                    'title': 'Data Scientist',
                    'location': 'Hyderabad, India',
                    'about': 'Data scientist with expertise in machine learning, Python, and statistical analysis. 3+ years of experience in fintech.'
                },
                'candidate_data': {
                    'current_ctc': Decimal('15.00'),
                    'expected_ctc': Decimal('22.00'),
                    'total_experience_years': 3,
                    'total_experience_months': 8,
                    'notice_period': '60_days',
                    'highest_education': 'master',
                    'domain': 'Finance',
                    'preferred_employment_types': ['full_time'],
                    'preferred_locations': ['Hyderabad', 'Bangalore', 'Pune'],
                    'preferred_company_types': ['enterprise', 'startup']
                },
                'skills': [
                    {'name': 'Python', 'proficiency': 'expert', 'years': 4.0},
                    {'name': 'Machine Learning', 'proficiency': 'advanced', 'years': 3.5},
                    {'name': 'SQL', 'proficiency': 'advanced', 'years': 3.0},
                    {'name': 'TensorFlow', 'proficiency': 'intermediate', 'years': 2.0},
                    {'name': 'Pandas', 'proficiency': 'advanced', 'years': 3.5}
                ]
            },
            {
                'email': 'mike.chen@example.com',
                'username': 'mikechen',
                'first_name': 'Mike',
                'last_name': 'Chen',
                'profile_data': {
                    'full_name': 'Mike Chen',
                    'title': 'DevOps Engineer',
                    'location': 'Mumbai, India',
                    'about': 'DevOps engineer specializing in AWS, Docker, and Kubernetes. Experience in CI/CD pipelines and infrastructure automation.'
                },
                'candidate_data': {
                    'current_ctc': Decimal('14.00'),
                    'expected_ctc': Decimal('20.00'),
                    'total_experience_years': 4,
                    'total_experience_months': 2,
                    'notice_period': '30_days',
                    'highest_education': 'bachelor',
                    'domain': 'Technology',
                    'preferred_employment_types': ['full_time', 'contract'],
                    'preferred_locations': ['Mumbai', 'Pune', 'Remote'],
                    'preferred_company_types': ['startup', 'enterprise']
                },
                'skills': [
                    {'name': 'AWS', 'proficiency': 'advanced', 'years': 4.0},
                    {'name': 'Docker', 'proficiency': 'advanced', 'years': 3.5},
                    {'name': 'Kubernetes', 'proficiency': 'intermediate', 'years': 2.5},
                    {'name': 'Jenkins', 'proficiency': 'advanced', 'years': 3.0},
                    {'name': 'Terraform', 'proficiency': 'intermediate', 'years': 2.0}
                ]
            },
            {
                'email': 'priya.sharma@example.com',
                'username': 'priyasharma',
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'profile_data': {
                    'full_name': 'Priya Sharma',
                    'title': 'Frontend Developer',
                    'location': 'Delhi, India',
                    'about': 'Creative frontend developer with 2+ years experience in React, Vue.js, and modern CSS frameworks. Love creating beautiful user interfaces.'
                },
                'candidate_data': {
                    'current_ctc': Decimal('8.00'),
                    'expected_ctc': Decimal('12.00'),
                    'total_experience_years': 2,
                    'total_experience_months': 6,
                    'notice_period': '15_days',
                    'highest_education': 'bachelor',
                    'domain': 'Technology',
                    'preferred_employment_types': ['full_time', 'part_time'],
                    'preferred_locations': ['Delhi', 'Gurgaon', 'Remote'],
                    'preferred_company_types': ['startup']
                },
                'skills': [
                    {'name': 'React', 'proficiency': 'advanced', 'years': 2.5},
                    {'name': 'Vue.js', 'proficiency': 'intermediate', 'years': 1.5},
                    {'name': 'CSS', 'proficiency': 'advanced', 'years': 3.0},
                    {'name': 'JavaScript', 'proficiency': 'advanced', 'years': 2.5},
                    {'name': 'Tailwind CSS', 'proficiency': 'advanced', 'years': 2.0}
                ]
            },
            {
                'email': 'alex.kumar@example.com',
                'username': 'alexkumar',
                'first_name': 'Alex',
                'last_name': 'Kumar',
                'profile_data': {
                    'full_name': 'Alex Kumar',
                    'title': 'Backend Developer',
                    'location': 'Chennai, India',
                    'about': 'Backend developer with strong experience in Java, Spring Boot, and microservices architecture. 4+ years in enterprise applications.'
                },
                'candidate_data': {
                    'current_ctc': Decimal('11.00'),
                    'expected_ctc': Decimal('16.00'),
                    'total_experience_years': 4,
                    'total_experience_months': 0,
                    'notice_period': '90_days',
                    'highest_education': 'bachelor',
                    'domain': 'Technology',
                    'preferred_employment_types': ['full_time'],
                    'preferred_locations': ['Chennai', 'Bangalore', 'Hyderabad'],
                    'preferred_company_types': ['enterprise', 'mid_size']
                },
                'skills': [
                    {'name': 'Java', 'proficiency': 'expert', 'years': 4.0},
                    {'name': 'Spring Boot', 'proficiency': 'advanced', 'years': 3.5},
                    {'name': 'Microservices', 'proficiency': 'advanced', 'years': 3.0},
                    {'name': 'MySQL', 'proficiency': 'advanced', 'years': 4.0},
                    {'name': 'Redis', 'proficiency': 'intermediate', 'years': 2.0}
                ]
            }
        ]

        created_count = 0
        for candidate_data in sample_candidates:
            try:
                # Create or get user
                user, user_created = User.objects.get_or_create(
                    email=candidate_data['email'],
                    defaults={
                        'username': candidate_data['username'],
                        'first_name': candidate_data['first_name'],
                        'last_name': candidate_data['last_name'],
                        'role': 'student'
                    }
                )

                # Create or get profile
                profile, profile_created = Profile.objects.get_or_create(
                    user=user,
                    defaults=candidate_data['profile_data']
                )

                # Create or get candidate profile
                candidate_profile, candidate_created = CandidateProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'profile': profile,
                        **candidate_data['candidate_data']
                    }
                )

                # Add skills
                for skill_data in candidate_data['skills']:
                    CandidateSkill.objects.get_or_create(
                        candidate=candidate_profile,
                        skill_name=skill_data['name'],
                        defaults={
                            'proficiency': skill_data['proficiency'],
                            'years_of_experience': skill_data['years']
                        }
                    )

                if candidate_created:
                    created_count += 1
                    self.stdout.write(f'Created candidate: {candidate_data["email"]}')

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating candidate {candidate_data["email"]}: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} candidates')
        )