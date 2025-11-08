import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings


class Course(models.Model):
    """
    Course model representing a complete learning course.
    """
    CATEGORY_CHOICES = [
        ('fundamentals', 'Fundamentals'),
        ('programming_languages', 'Programming Languages'),
        ('databases', 'Databases'),
        ('ai_tools', 'AI Tools'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    short_code = models.CharField(max_length=20, blank=True, null=True, unique=True)
    name = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', '-created_at']

    def __str__(self):
        if self.short_code:
            return f"{self.short_code}: {self.name}"
        return self.name


class Topic(models.Model):
    """
    Topic model representing a major section within a course.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=255)
    order_index = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order_index']
        unique_together = ['course', 'order_index']

    def save(self, *args, **kwargs):
        if self.order_index is None:
            # Auto-assign next available order_index
            last_topic = Topic.objects.filter(course=self.course).order_by('-order_index').first()
            self.order_index = (last_topic.order_index + 1) if last_topic else 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.course.name} - {self.name}"


class Subtopic(models.Model):
    """
    Subtopic model representing detailed content within a topic.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='subtopics')
    name = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    order_index = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order_index']
        unique_together = ['topic', 'order_index']

    def save(self, *args, **kwargs):
        if self.order_index is None:
            # Auto-assign next available order_index
            last_subtopic = Subtopic.objects.filter(topic=self.topic).order_by('-order_index').first()
            self.order_index = (last_subtopic.order_index + 1) if last_subtopic else 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.topic.name} - {self.name}"


class Video(models.Model):
    """
    Video model representing video content associated with a subtopic.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_topic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='videos')
    title = models.CharField(max_length=255)
    video_link = models.URLField()
    ai_context = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sub_topic.name} - {self.title}"


class CodingProblem(models.Model):
    """
    CodingProblem model representing coding exercises for programming practice.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_topic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='coding_problems')
    title = models.CharField(max_length=255)
    description = models.TextField()
    input = models.TextField()
    test_cases = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sub_topic.name} - {self.title}"


class Quiz(models.Model):
    """
    Quiz model representing multiple choice questions for knowledge assessment.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_topic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='quizzes')
    question = models.TextField()
    options = models.JSONField()
    correct_answer_index = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def clean(self):
        """
        Validate that correct_answer_index is within the range of options.
        """
        from django.core.exceptions import ValidationError
        if self.options and self.correct_answer_index is not None:
            if isinstance(self.options, list):
                if self.correct_answer_index >= len(self.options):
                    raise ValidationError(f'Correct answer index {self.correct_answer_index} is out of range. Options has {len(self.options)} items.')
                if self.correct_answer_index < 0:
                    raise ValidationError('Correct answer index must be non-negative.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def correct_answer(self):
        """
        Get the correct answer text based on the index.
        """
        if self.options and isinstance(self.options, list) and 0 <= self.correct_answer_index < len(self.options):
            return self.options[self.correct_answer_index]
        return None

    def __str__(self):
        return f"{self.sub_topic.name} - {self.question[:50]}..."


class Note(models.Model):
    """
    Note model representing user-created notes for personal study.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_topic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username} - {self.sub_topic.name} - {self.content[:30]}..."