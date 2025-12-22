from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from authentication.models import Profile
from job.models import Skill, Experience, Education, Project, JobProfile, JobSkill, SocialLinks
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with sample job profiles for candidate search'

    def handle(self, *args, **options):
        self.stdout.write('Creating job profiles for existing student users...')
        
        skills_data = [
            'Python', 'JavaScript', 'React', 'Node.js', 'Django', 'Flask',
            'Java', 'Spring Boot', 'Angular', 'Vue.js', 'TypeScript',
            'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
            'AWS', 'Azure', 'GCP', 'Git', 'Jenkins', 'CI/CD',
            'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch',
            'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS',
            'REST API', 'GraphQL', 'Microservices', 'DevOps'
        ]
        
        locations = [
            'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai',
            'Pune', 'Kolkata', 'Ahmedabad', 'Gurgaon', 'Noida',
            'San Francisco', 'New York', 'London', 'Singapore'
        ]
        
        domains = [
            'Technology', 'Finance', 'Healthcare', 'E-commerce',
            'Education', 'Gaming', 'Media', 'Consulting'
        ]
        
        student_profiles = Profile.objects.filter(
            user__role='student'
        ).exclude(
            job_profile__isnull=False
        )
        
        created_count = 0
        
        for profile in student_profiles:
            try:
                job_profile = JobProfile.objects.create(
                    profile=profile,
                    current_ctc=random.randint(300, 2000) / 10,  
                    expected_ctc=random.randint(400, 2500) / 10,  
                    currency='INR',
                    total_experience_years=random.randint(0, 8),
                    total_experience_months=random.randint(0, 11),
                    notice_period=random.choice([choice[0] for choice in JobProfile.NOTICE_PERIOD_CHOICES]),
                    preferred_employment_types=random.sample(
                        [choice[0] for choice in JobProfile.EMPLOYMENT_TYPE_CHOICES], 
                        random.randint(1, 3)
                    ),
                    preferred_locations=random.sample(locations, random.randint(1, 3)),
                    open_to_remote=random.choice([True, False]),
                    highest_education=random.choice([choice[0] for choice in JobProfile.EDUCATION_LEVEL_CHOICES]),
                    domain=random.choice(domains),
                    preferred_company_types=random.sample(
                        [choice[0] for choice in JobProfile.COMPANY_TYPE_CHOICES], 
                        random.randint(1, 2)
                    ),
                    is_actively_looking=random.choice([True, True, True, False]),  
                    last_active=timezone.now() - timedelta(days=random.randint(0, 90)),
                    resume_file=f'https://example.com/resumes/{profile.user.username}.pdf'
                )
                
                existing_skills = Skill.objects.filter(profile=profile)
                for skill in existing_skills:
                    JobSkill.objects.create(
                        job_profile=job_profile,
                        skill_name=skill.name,
                        proficiency=random.choice(['beginner', 'intermediate', 'advanced', 'expert']),
                        years_of_experience=random.randint(1, max(1, job_profile.total_experience_years))
                    )
                
                if existing_skills.count() < 5:
                    additional_skills = random.sample(skills_data, 5 - existing_skills.count())
                    for skill_name in additional_skills:
                        JobSkill.objects.create(
                            job_profile=job_profile,
                            skill_name=skill_name,
                            proficiency=random.choice(['beginner', 'intermediate', 'advanced']),
                            years_of_experience=random.randint(1, max(1, job_profile.total_experience_years))
                        )
                
                created_count += 1
                self.stdout.write(f'✓ Created job profile for: {profile.user.email}')
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating job profile for {profile.user.email}: {str(e)}')
                )
                continue
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} job profiles!')
        )
        
        total_profiles = JobProfile.objects.count()
        active_profiles = JobProfile.objects.filter(is_actively_looking=True).count()
        
        self.stdout.write(f'Total job profiles: {total_profiles}')
        self.stdout.write(f'Active job profiles: {active_profiles}')
        self.stdout.write(f'Total job skills: {JobSkill.objects.count()}')
        self.stdout.write(f'Total experiences: {Experience.objects.count()}')
        self.stdout.write(f'Total projects: {Project.objects.count()}')