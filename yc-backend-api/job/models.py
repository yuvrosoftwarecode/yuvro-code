from django.db import models
from django.contrib.auth import get_user_model
from core.models import BaseModel, BaseTimestampedModel

User = get_user_model()

class Company(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    benefits = models.TextField(blank=True, null=True)
    domain = models.CharField(max_length=255, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    size = models.CharField(max_length=100, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

class Job(BaseModel):
    EMPLOYMENT_TYPE_CHOICES = [
        ('full-time', 'Full Time'),
        ('part-time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('closed', 'Closed'),
    ]
    
    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupee'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
    ]
    
    EDUCATION_LEVEL_CHOICES = [
        ('high_school', 'High School'),
        ('diploma', 'Diploma'),
        ('bachelor', 'Bachelor\'s Degree'),
        ('master', 'Master\'s Degree'),
        ('phd', 'PhD'),
        ('any', 'Any'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES)
    experience_min_years = models.PositiveIntegerField(default=0)
    experience_max_years = models.PositiveIntegerField(blank=True, null=True)
    
    locations = models.JSONField(default=list, blank=True)  # Array of location strings
    is_remote = models.BooleanField(default=False)
    
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    
    skills = models.JSONField(default=list, blank=True)
    notice_period = models.PositiveIntegerField(blank=True, null=True, help_text="Notice period in days")
    education_level = models.CharField(max_length=20, choices=EDUCATION_LEVEL_CHOICES, default='any')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    posted_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    screening_questions_config = models.JSONField(default=dict, blank=True)
    screening_questions_random_config = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.title} at {self.company.name}"
    
    class Meta:
        ordering = ['-created_at']


class JobApplication(BaseTimestampedModel):
    APPLICATION_STATUS_CHOICES = [
        ('screening_test_completed', 'Screening Test Completed'),
        ('under_review', 'Under Review'),
        ('shortlisted', 'Shortlisted'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interviewed', 'Interviewed'),
        ('selected', 'Selected'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_applications')
    
    is_bookmarked = models.BooleanField(default=False)
    is_applied = models.BooleanField(default=False)
    
    cover_letter = models.TextField(blank=True, null=True)
    resume_file = models.FileField(upload_to='resumes/', blank=True, null=True)
    portfolio_url = models.URLField(blank=True, null=True)
    
    status = models.CharField(max_length=31, choices=APPLICATION_STATUS_CHOICES, blank=True, null=True)
    applied_at = models.DateTimeField(blank=True, null=True)
    
    screening_responses = models.JSONField(default=dict, blank=True)
    
    recruiter_notes = models.TextField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    
    interview_scheduled_at = models.DateTimeField(blank=True, null=True)
    interview_feedback = models.TextField(blank=True, null=True)
    
    expected_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    expected_currency = models.CharField(max_length=3, choices=Job.CURRENCY_CHOICES, default='USD')
    
    available_from = models.DateField(blank=True, null=True)
    notice_period_days = models.PositiveIntegerField(blank=True, null=True)

    class Meta:
        ordering = ['-applied_at']
        unique_together = ['job', 'applicant']  # Prevent duplicate applications

    def __str__(self):
        return f"{self.applicant.username} applied for {self.job.title} at {self.job.company.name}"


