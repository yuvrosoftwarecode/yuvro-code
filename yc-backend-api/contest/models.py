from django.db import models

from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Contest(models.Model):
    TYPE_COMPANY = 'company'
    TYPE_COLLEGE = 'college'
    TYPE_WEEKLY = 'weekly'
    TYPE_MONTHLY = 'monthly'
    TYPE_CHOICES = [
        (TYPE_COMPANY, 'Company'),
        (TYPE_COLLEGE, 'College'),
        (TYPE_WEEKLY, 'Weekly'),
        (TYPE_MONTHLY, 'Monthly'),
    ]
    
    STATUS_UPCOMING = 'upcoming'
    STATUS_ONGOING = 'ongoing'
    STATUS_PAST = 'past'
    STATUS_CHOICES = [
        (STATUS_UPCOMING, 'Upcoming'),
        (STATUS_ONGOING, 'Ongoing'),
        (STATUS_PAST, 'Past'),
    ]
    
    DIFF_EASY = 'easy'
    DIFF_MEDIUM = 'medium'
    DIFF_HARD = 'hard'
    DIFF_CHOICES = [
        (DIFF_EASY, 'Easy'),
        (DIFF_MEDIUM, 'Medium'),
        (DIFF_HARD, 'Hard'),
    ]
    
    title = models.CharField(max_length=255)
    organizer = models.CharField(max_length=255, help_text="Name of the organizer")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_COMPANY)
    status = models.CharField(max_length=20, choices= STATUS_CHOICES, default=STATUS_UPCOMING)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    duration = models.IntegerField(blank=True, null=True, help_text="Duration in seconds")
    prize = models.CharField(max_length=255, blank=True, null=True)
    difficulty = models.CharField(max_length=10, choices=DIFF_CHOICES, default=DIFF_MEDIUM)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, null=True, blank = True, on_delete=models.CASCADE, related_name='created_contests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    participants_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['start_date']),
        ]
        
    def __str__(self):
        return f"{self.title} ({self.organizer})"
    
    def update_status(self):
        now = timezone.now()
        if self.start_date <= now <= self.end_date:
            self.status = self.STATUS_ONGOING
        elif now < self.start_date:
            self.status = self.STATUS_UPCOMING
        else:
            self.status = self.STATUS_PAST
        return self.status