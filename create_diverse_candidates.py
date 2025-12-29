import os
import sys
import django

# Add the Django project to the path
sys.path.append('/home/vinod/Downloads/Learn_Project/new__new/yuvro-code/yc-backend-api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yc-backend-api.settings')
django.setup()

from job.models import JobProfile
from authentication.models import Profile, User

def create_diverse_candidates():
    """Create candidates with diverse filter values"""
    
    # Candidate 1: Different notice period and employment type
    try:
        user1 = User.objects.create_user(
            username='candidate1',
            email='candidate1@test.com',
            password='test123',
            first_name='Alice',
            last_name='Johnson',
            role='student'
        )
        
        profile1 = Profile.objects.create(
            user=user1,
            full_name='Alice Johnson',
            title='Senior Frontend Developer',
            location='San Francisco, CA',
            about='Senior frontend developer with 5+ years experience'
        )
        
        job_profile1 = JobProfile.objects.create(
            profile=profile1,
            current_ctc=1200000,  # 12 LPA
            expected_ctc=1500000,  # 15 LPA
            currency='INR',
            total_experience_years=5,
            total_experience_months=6,
            notice_period='immediate',  # Different notice period
            preferred_employment_types=['part_time', 'contract'],  # Different employment types
            preferred_locations=['San Francisco', 'Remote'],
            open_to_remote=True,
            highest_education='master',  # Different education
            domain='finance',  # Different domain
            preferred_company_types=['enterprise', 'government'],  # Different company types
            is_actively_looking=True
        )
        print(f"✅ Created candidate: {profile1.full_name}")
        
    except Exception as e:
        print(f"❌ Error creating candidate 1: {e}")
    
    # Candidate 2: Different values
    try:
        user2 = User.objects.create_user(
            username='candidate2',
            email='candidate2@test.com',
            password='test123',
            first_name='Bob',
            last_name='Smith',
            role='student'
        )
        
        profile2 = Profile.objects.create(
            user=user2,
            full_name='Bob Smith',
            title='DevOps Engineer',
            location='Austin, TX',
            about='DevOps engineer specializing in cloud infrastructure'
        )
        
        job_profile2 = JobProfile.objects.create(
            profile=profile2,
            current_ctc=1000000,  # 10 LPA
            expected_ctc=1300000,  # 13 LPA
            currency='INR',
            total_experience_years=3,
            total_experience_months=0,
            notice_period='60_days',  # Different notice period
            preferred_employment_types=['remote', 'full_time'],  # Different employment types
            preferred_locations=['Austin', 'Denver'],
            open_to_remote=True,
            highest_education='diploma',  # Different education
            domain='healthcare',  # Different domain
            preferred_company_types=['non_profit'],  # Different company types
            is_actively_looking=False
        )
        print(f"✅ Created candidate: {profile2.full_name}")
        
    except Exception as e:
        print(f"❌ Error creating candidate 2: {e}")
    
    # Candidate 3: More different values
    try:
        user3 = User.objects.create_user(
            username='candidate3',
            email='candidate3@test.com',
            password='test123',
            first_name='Carol',
            last_name='Davis',
            role='student'
        )
        
        profile3 = Profile.objects.create(
            user=user3,
            full_name='Carol Davis',
            title='Data Scientist',
            location='Boston, MA',
            about='Data scientist with expertise in machine learning'
        )
        
        job_profile3 = JobProfile.objects.create(
            profile=profile3,
            current_ctc=900000,  # 9 LPA
            expected_ctc=1100000,  # 11 LPA
            currency='INR',
            total_experience_years=7,
            total_experience_months=3,
            notice_period='15_days',  # Different notice period
            preferred_employment_types=['internship'],  # Different employment types
            preferred_locations=['Boston', 'New York'],
            open_to_remote=False,
            highest_education='phd',  # Different education
            domain='education',  # Different domain
            preferred_company_types=['startup'],  # Different company types
            is_actively_looking=True
        )
        print(f"✅ Created candidate: {profile3.full_name}")
        
    except Exception as e:
        print(f"❌ Error creating candidate 3: {e}")

def main():
    print("🔧 CREATING DIVERSE CANDIDATE DATA")
    print("=" * 50)
    
    create_diverse_candidates()
    
    print("\n📊 SUMMARY:")
    total_candidates = JobProfile.objects.count()
    print(f"Total candidates in database: {total_candidates}")
    
    # Show diversity
    print("\n📋 Notice Period Distribution:")
    notice_periods = JobProfile.objects.values_list('notice_period', flat=True)
    for period in set(notice_periods):
        count = notice_periods.filter(notice_period=period).count() if hasattr(notice_periods, 'filter') else list(notice_periods).count(period)
        print(f"   {period}: {count}")
    
    print("\n📋 Education Distribution:")
    educations = JobProfile.objects.values_list('highest_education', flat=True)
    for edu in set(educations):
        count = list(educations).count(edu)
        print(f"   {edu}: {count}")
    
    print("\n📋 Domain Distribution:")
    domains = JobProfile.objects.values_list('domain', flat=True)
    for domain in set(domains):
        count = list(domains).count(domain)
        print(f"   {domain}: {count}")

if __name__ == "__main__":
    main()