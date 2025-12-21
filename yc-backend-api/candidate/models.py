import uuid
from django.db import models
from django.contrib.auth import get_user_model
from authentication.models import Profile

User = get_user_model()


class CandidateProfile(models.Model):

    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full-Time'),
        ('part_time', 'Part-Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('remote', 'Remote'),
    ]
    
    NOTICE_PERIOD_CHOICES = [
        ('immediate', 'Immediate'),
        ('15_days', '15 Days'),
        ('30_days', '30 Days'),
        ('60_days', '60 Days'),
        ('90_days', '90 Days'),
    ]
    
    EDUCATION_LEVEL_CHOICES = [
        ('high_school', 'High School'),
        ('diploma', 'Diploma'),
        ('bachelor', 'Bachelor\'s Degree'),
        ('master', 'Master\'s Degree'),
        ('phd', 'PhD'),
    ]
    
    COMPANY_TYPE_CHOICES = [
        ('startup', 'Startup'),
        ('mid_size', 'Mid-size Company'),
        ('enterprise', 'Enterprise'),
        ('government', 'Government'),
        ('non_profit', 'Non-profit'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='candidate_profile')
    
    current_ctc = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expected_ctc = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='INR')
    
    total_experience_years = models.IntegerField(default=0)
    total_experience_months = models.IntegerField(default=0)
    
    notice_period = models.CharField(max_length=20, choices=NOTICE_PERIOD_CHOICES, default='30_days')
    available_from = models.DateField(null=True, blank=True)
    
    preferred_employment_types = models.JSONField(default=list)  
    preferred_locations = models.JSONField(default=list)  
    open_to_remote = models.BooleanField(default=True)
    
    highest_education = models.CharField(max_length=20, choices=EDUCATION_LEVEL_CHOICES, null=True, blank=True)
    
    domain = models.CharField(max_length=100, null=True, blank=True)
    
    preferred_company_types = models.JSONField(default=list)
    
    last_active = models.DateTimeField(auto_now=True)
    is_actively_looking = models.BooleanField(default=True)
    
    resume_file = models.URLField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'candidate_profile'
        
    def __str__(self):
        return f"Candidate: {self.user.email}"
    
    @property
    def total_experience_in_years(self):
        """Calculate total experience in decimal years"""
        return self.total_experience_years + (self.total_experience_months / 12)
    
    @property
    def skills_list(self):
        """Get list of skills from related profile"""
        return [skill.name for skill in self.profile.skills.all()]
    
    @property
    def experience_companies(self):
        """Get list of companies from experience"""
        return [exp.company for exp in self.profile.experiences.all()]


class CandidateSkill(models.Model):
    """
    Skills specifically for candidate search
    """
    PROFICIENCY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE, related_name='candidate_skills')
    skill_name = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES, default='intermediate')
    years_of_experience = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['candidate', 'skill_name']
        db_table = 'candidate_skill'
    
    def __str__(self):
        return f"{self.candidate.user.email} - {self.skill_name} ({self.proficiency})"


class CandidateSearchLog(models.Model):
    """
    Log candidate search queries for analytics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_logs')
    
    # Search parameters
    search_filters = models.JSONField(default=dict)
    results_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'candidate_search_log'
    
    def __str__(self):
        return f"Search by {self.recruiter.email} at {self.created_at}"