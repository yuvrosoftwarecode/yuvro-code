import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import BaseModel, BaseTimestampedModel

User = get_user_model()


class BaseAssessmentModel(BaseModel):   
    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_MEDIUM = 'medium'
    DIFFICULTY_HARD = 'hard'
    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, 'Easy'),
        (DIFFICULTY_MEDIUM, 'Medium'),
        (DIFFICULTY_HARD, 'Hard'),
    ]
    
    PUBLISH_STATUS_DRAFT = 'draft'
    PUBLISH_STATUS_ACTIVE = 'active'
    PUBLISH_STATUS_INACTIVE = 'inactive'
    PUBLISH_STATUS_ARCHIVED = 'archived'
    PUBLISH_STATUS_CHOICES = [
        (PUBLISH_STATUS_DRAFT, 'Draft'),
        (PUBLISH_STATUS_ACTIVE, 'Active'),
        (PUBLISH_STATUS_INACTIVE, 'Inactive'),
        (PUBLISH_STATUS_ARCHIVED, 'Archived'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default=DIFFICULTY_MEDIUM)
    
    
    duration = models.IntegerField(default=60, help_text="Duration in minutes")
    total_marks = models.IntegerField(default=100)
    passing_marks = models.IntegerField(default=60)
    enable_proctoring = models.BooleanField(default=False)
    total_attempts = models.PositiveIntegerField(default=0, help_text="Total number of attempts made")
    
    questions_config = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="Questions configuration by category: {'mcq_single': ['uuid1', 'uuid2'], 'mcq_multiple': ['uuid3'], 'coding': ['uuid4'], 'descriptive': ['uuid5']}"
    )
    
    questions_random_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Random question configuration: {'mcq_single': 5, 'mcq_multiple': 3, 'coding': 2, 'descriptive': 1}"
    )
    
    publish_status = models.CharField(
        max_length=20, 
        choices=PUBLISH_STATUS_CHOICES, 
        default=PUBLISH_STATUS_DRAFT
    )
    

    
    class Meta:
        abstract = True
    
    
class SkillTest(BaseAssessmentModel):
    # Course integration - only for SkillTest
    course = models.ForeignKey(
        'course.Course', 
        on_delete=models.CASCADE, 
        related_name='skill_test_assessments',
        help_text="Course this skill test belongs to",
        null=True,
        blank=True
    )
    topic = models.ForeignKey(
        'course.Topic', 
        on_delete=models.CASCADE, 
        related_name='skill_test_assessments', 
        null=True, 
        blank=True,
        help_text="Specific topic within the course (optional)"
    )
       
    def __str__(self):
        return f"{self.title} - {self.course.name if self.course else 'No Course'} ({self.topic.name if self.topic else 'All Topics'})"


class Contest(BaseAssessmentModel):
    TYPE_COMPANY = 'company'
    TYPE_COLLEGE = 'college'
    TYPE_CHOICES = [
        (TYPE_COMPANY, 'Company'),
        (TYPE_COLLEGE, 'College'),
    ]
    
    STATUS_UPCOMING = 'upcoming'
    STATUS_ONGOING = 'ongoing'
    STATUS_PAST = 'past'
    STATUS_CHOICES = [
        (STATUS_UPCOMING, 'Upcoming'),
        (STATUS_ONGOING, 'Ongoing'),
        (STATUS_PAST, 'Past'),
    ]
    
    organizer = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_COMPANY)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UPCOMING)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    prize = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['-start_datetime']
        
    def __str__(self):
        return f"{self.title} ({self.organizer})"
    
    def update_status(self):
        now = timezone.now()
        if self.start_datetime <= now <= self.end_datetime:
            self.status = self.STATUS_ONGOING
        elif now < self.start_datetime:
            self.status = self.STATUS_UPCOMING
        else:
            self.status = self.STATUS_PAST
        return self.status


class MockInterview(BaseAssessmentModel):
    TYPE_CODING = 'coding'
    TYPE_SYSTEM_DESIGN = 'system_design'
    TYPE_APTITUDE = 'aptitude'
    TYPE_BEHAVIORAL = 'behavioral'
    TYPE_DOMAIN_SPECIFIC = 'domain_specific'
    TYPE_CHOICES = [
        (TYPE_CODING, 'Coding'),
        (TYPE_SYSTEM_DESIGN, 'System Design'),
        (TYPE_APTITUDE, 'Aptitude'),
        (TYPE_BEHAVIORAL, 'Behavioral'),
        (TYPE_DOMAIN_SPECIFIC, 'Domain Specific'),
    ]
    
    STATUS_SCHEDULED = 'scheduled'
    STATUS_ONGOING = 'ongoing'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_ONGOING, 'Ongoing'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_CODING)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    scheduled_datetime = models.DateTimeField()
    
    class Meta:
        ordering = ['-scheduled_datetime']

    
    def __str__(self):
        return f"{self.title} - {self.get_type_display()} ({self.scheduled_datetime.strftime('%Y-%m-%d %H:%M')})"
    
    def update_status(self):
        now = timezone.now()
        if self.status == self.STATUS_CANCELLED:
            return self.status
            
        if now < self.scheduled_datetime:
            self.status = self.STATUS_SCHEDULED
        elif now >= self.scheduled_datetime and now <= (self.scheduled_datetime + timezone.timedelta(minutes=self.duration)):
            if self.status != self.STATUS_COMPLETED:
                self.status = self.STATUS_ONGOING
        elif now > (self.scheduled_datetime + timezone.timedelta(minutes=self.duration)):
            if self.status != self.STATUS_COMPLETED:
                self.status = self.STATUS_COMPLETED
        
        return self.status


class JobTest(BaseAssessmentModel):
    TYPE_CODING = 'coding'
    TYPE_SYSTEM_DESIGN = 'system_design'
    TYPE_APTITUDE = 'aptitude'
    TYPE_BEHAVIORAL = 'behavioral'
    TYPE_DOMAIN_SPECIFIC = 'domain_specific'
    TYPE_CHOICES = [
        (TYPE_CODING, 'Coding'),
        (TYPE_SYSTEM_DESIGN, 'System Design'),
        (TYPE_APTITUDE, 'Aptitude'),
        (TYPE_BEHAVIORAL, 'Behavioral'),
        (TYPE_DOMAIN_SPECIFIC, 'Domain Specific'),
    ]
    
    company_name = models.CharField(max_length=255)
    position_title = models.CharField(max_length=255)
    start_datetime = models.DateTimeField(null=True, blank=True)
    end_datetime = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.company_name} ({self.position_title})"



class BaseUserSubmission(BaseTimestampedModel):
    STATUS_STARTED = 'started'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'
    STATUS_SUBMITTED = 'submitted'
    STATUS_EVALUATED = 'evaluated'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_STARTED, 'Started'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_EVALUATED, 'Evaluated'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='%(class)s_submissions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_STARTED)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    proctoring_events = models.JSONField(default=list, blank=True)
    browser_info = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    marks = models.FloatField(null=True, blank=True)
    
    class Meta:
        abstract = True

class SkillTestSubmission(BaseUserSubmission):
    skill_test = models.ForeignKey(SkillTest, on_delete=models.CASCADE, related_name='skill_test_submissions')

    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'skill_test']
        
    def __str__(self):
        return f"{self.user.username} - {self.skill_test.title}"


class ContestSubmission(BaseUserSubmission):
    contest = models.ForeignKey(Contest, on_delete=models.CASCADE, related_name='contest_submissions')

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'contest']
        
    def __str__(self):
        return f"{self.user.username} - {self.contest.title}"


class MockInterviewSubmission(BaseUserSubmission):
    mock_interview = models.ForeignKey(MockInterview, on_delete=models.CASCADE, related_name='mock_interview_submissions')
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'mock_interview']
        
    def __str__(self):
        return f"{self.user.username} - {self.mock_interview.title}"


class JobTestSubmission(BaseUserSubmission):
    job_test = models.ForeignKey(JobTest, on_delete=models.CASCADE, related_name='job_test_submissions')
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'job_test']
        
    def __str__(self):
        return f"{self.user.username} - {self.job_test.title}"