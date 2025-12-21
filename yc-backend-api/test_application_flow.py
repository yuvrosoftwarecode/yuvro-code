#!/usr/bin/env python
"""
Test script to verify job application flow
Run this with: python manage.py shell < test_application_flow.py
"""

import os
import django
from django.contrib.auth import get_user_model
from job.models import Job, Company, JobApplication
from job.serializers import JobApplicationSerializer

# Test the application creation flow
def test_application_flow():
    User = get_user_model()
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='test_student',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'Student'
        }
    )
    
    # Get or create a test company
    company, created = Company.objects.get_or_create(
        name='Test Company',
        defaults={
            'description': 'A test company',
            'domain': 'Technology'
        }
    )
    
    # Get or create a test job
    job, created = Job.objects.get_or_create(
        title='Test Developer',
        company=company,
        defaults={
            'description': 'A test job posting',
            'employment_type': 'full-time',
            'experience_min_years': 0,
            'status': 'active'
        }
    )
    
    print(f"Test setup complete:")
    print(f"- User: {user.username} ({user.email})")
    print(f"- Company: {company.name}")
    print(f"- Job: {job.title}")
    
    # Test application creation
    application_data = {
        'job_id': str(job.id),
        'cover_letter': 'This is a test application',
        'expected_salary': 50000,
        'expected_currency': 'USD'
    }
    
    # Create a mock request object
    class MockRequest:
        def __init__(self, user):
            self.user = user
    
    mock_request = MockRequest(user)
    
    # Test the serializer
    serializer = JobApplicationSerializer(
        data=application_data,
        context={'request': mock_request}
    )
    
    if serializer.is_valid():
        application = serializer.save()
        print(f"\nApplication created successfully:")
        print(f"- ID: {application.id}")
        print(f"- Status: {application.status}")
        print(f"- Is Applied: {application.is_applied}")
        print(f"- Applied At: {application.applied_at}")
        
        # Verify the application shows up in queries
        applications = JobApplication.objects.filter(job=job, is_applied=True)
        print(f"\nApplications for job '{job.title}': {applications.count()}")
        
        for app in applications:
            print(f"- {app.applicant.username}: {app.status}")
            
    else:
        print(f"Serializer errors: {serializer.errors}")

if __name__ == '__main__':
    test_application_flow()