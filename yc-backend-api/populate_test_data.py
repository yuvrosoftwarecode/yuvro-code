import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yc-backend-api.settings')
django.setup()

from django.contrib.auth import get_user_model
from authentication.models import Profile
from job.models import Skill, Experience, Education, JobProfile, JobSkill
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

def create_sample_data():
    
    print("Creating sample job profiles...")
    
    skills_data = [
        'Python', 'JavaScript', 'React', 'Node.js', 'Django', 'Flask',
        'Java', 'Spring Boot', 'Angular', 'Vue.js', 'TypeScript',
        'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
        'AWS', 'Azure', 'GCP', 'Git', 'Jenkins', 'CI/CD'
    ]
    
    companies = [
        'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta',
        'TCS', 'Infosys', 'Wipro', 'Accenture',
        'Flipkart', 'Paytm', 'Zomato', 'Swiggy'
    ]
    
    locations = [
        'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai',
        'Pune', 'Kolkata', 'Ahmedabad', 'Gurgaon', 'Noida'
    ]
    
    domains = ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education']
    
    roles = [
        'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer',
        'Frontend Developer', 'Backend Developer', 'DevOps Engineer'
    ]
    
    for i in range(1, 21):
        try:
            # Create user
            user = User.objects.create_user(
                username=f'candidate_{i}',
                email=f'candidate{i}@example.com',
                first_name=f'Candidate',
                last_name=f'{i}',
                role='student'
            )
            
            profile = Profile.objects.create(
                user=user,
                full_name=f'Candidate {i}',
                title=random.choice(roles),
                location=random.choice(locations),
                about=f'Experienced software developer with {random.randint(1, 8)} years of experience.'
            )
            
            job_profile = JobProfile.objects.create(
                profile=profile,
                current_ctc=random.randint(300, 1500) / 10,  
                expected_ctc=random.randint(400, 2000) / 10, 
                currency='INR',
                total_experience_years=random.randint(0, 10),
                total_experience_months=random.randint(0, 11),
                notice_period=random.choice([choice[0] for choice in JobProfile.NOTICE_PERIOD_CHOICES]),
                preferred_employment_types=['full_time', 'remote'],
                preferred_locations=random.sample(locations, random.randint(1, 3)),
                open_to_remote=True,
                highest_education=random.choice([choice[0] for choice in JobProfile.EDUCATION_LEVEL_CHOICES]),
                domain=random.choice(domains),
                preferred_company_types=['startup', 'enterprise'],
                is_actively_looking=True,
                last_active=timezone.now() - timedelta(days=random.randint(0, 30))
            )
            
            user_skills = random.sample(skills_data, random.randint(3, 6))
            for skill_name in user_skills:
                Skill.objects.create(
                    profile=profile,
                    name=skill_name,
                    level=random.choice(['Beginner', 'Intermediate', 'Advanced']),
                    percentage=random.randint(60, 95)
                )
                
                JobSkill.objects.create(
                    job_profile=job_profile,
                    skill_name=skill_name,
                    proficiency=random.choice(['intermediate', 'advanced']),
                    years_of_experience=random.randint(1, job_profile.total_experience_years + 1)
                )
            
            Experience.objects.create(
                profile=profile,
                company=random.choice(companies),
                role=random.choice(roles),
                duration=f'{random.randint(12, 36)} months',
                description_list=[
                    'Developed web applications using modern frameworks',
                    'Collaborated with cross-functional teams',
                    'Implemented best practices and code reviews'
                ],
                technologies=random.sample(skills_data, random.randint(3, 5))
            )
            
            Education.objects.create(
                profile=profile,
                institution=f'University {i}',
                degree='B.Tech',
                field='Computer Science',
                duration='4 years',
                cgpa=f'{random.randint(70, 90)/10:.1f}',
                start_year=2016,
                end_year=2020
            )
            
            print(f"Created candidate {i}: {user.email}")
            
        except Exception as e:
            print(f"Error creating candidate {i}: {str(e)}")
            continue
    
    print(f"\nSample data creation completed!")
    print(f"Total job profiles: {JobProfile.objects.count()}")
    print(f"Total job skills: {JobSkill.objects.count()}")

if __name__ == '__main__':
    create_sample_data()