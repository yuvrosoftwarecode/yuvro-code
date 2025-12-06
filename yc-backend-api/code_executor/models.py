from django.db import models
from django.contrib.auth import get_user_model
from course.models import Question

User = get_user_model()


class CodeSubmission(models.Model):
    LANGUAGE_CHOICES = [
        ("python", "Python"),
        ("javascript", "JavaScript"),
        ("java", "Java"),
        ("cpp", "C++"),
        ("c", "C"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("error", "Error"),
        ("timeout", "Timeout"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, limit_choices_to={'type': 'coding'})
    code = models.TextField()
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    output = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    execution_time = models.FloatField(null=True, blank=True)
    memory_usage = models.FloatField(null=True, blank=True)
    test_cases_passed = models.IntegerField(default=0)
    total_test_cases = models.IntegerField(default=0)
    plagiarism_score = models.FloatField(null=True, blank=True)
    plagiarism_details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.question.title} ({self.language})"


class PlagiarismReport(models.Model):
    submission1 = models.ForeignKey(
        CodeSubmission,
        on_delete=models.CASCADE,
        related_name="plagiarism_reports_as_first",
    )
    submission2 = models.ForeignKey(
        CodeSubmission,
        on_delete=models.CASCADE,
        related_name="plagiarism_reports_as_second",
    )
    similarity_score = models.FloatField()
    similarity_details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["submission1", "submission2"]

    def __str__(self):
        return f"Plagiarism Report: {self.similarity_score}% similarity"
