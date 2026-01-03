import uuid

from django.db import models
from django.contrib.auth import get_user_model
from core.models import BaseTimestampedModel


User = get_user_model()


class CodeSubmission(BaseTimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='code_submissions')
    
    code = models.TextField()
    language = models.CharField(max_length=50)
    question = models.ForeignKey(
        'course.Question', 
        on_delete=models.CASCADE, 
        related_name='code_submissions',
        null=True,
        blank=True
    )
    
    total_test_cases = models.IntegerField(default=0)
    passed_test_cases = models.IntegerField(default=0)
    execution_time_ms = models.FloatField(default=0)
    peak_memory_kb = models.FloatField(default=0)
    score_percent = models.FloatField(default=0)
    marks = models.FloatField(default=0)

    plagiarism_flagged = models.BooleanField(default=False)
    max_similarity = models.FloatField(default=0)
    
    test_results_basic = models.JSONField(default=list, blank=True)
    test_results_advanced = models.JSONField(default=list, blank=True)
    test_results_custom = models.JSONField(default=list, blank=True)
    

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.language} - {self.score_percent}% - {self.created_at}"