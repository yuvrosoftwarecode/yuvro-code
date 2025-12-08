import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


class Course(models.Model):
    """
    Course model representing a complete learning course.
    """

    CATEGORY_CHOICES = [
        ("fundamentals", "Fundamentals"),
        ("programming_languages", "Programming Languages"),
        ("databases", "Databases"),
        ("ai_tools", "AI Tools"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    short_code = models.CharField(max_length=20, blank=True, null=True, unique=True)
    name = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    instructors = models.ManyToManyField(
        User, through="CourseInstructor", related_name="courses_taught"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "-created_at"]

    def __str__(self):
        if self.short_code:
            return f"{self.short_code}: {self.name}"
        return self.name


class Topic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="topics")
    name = models.CharField(max_length=255)
    order_index = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order_index"]

    def save(self, *args, **kwargs):
        if self.order_index is None:
            last = (
                Topic.objects.filter(course=self.course)
                .order_by("-order_index")
                .first()
            )
            self.order_index = (last.order_index + 1) if last else 0

        else:
            conflict = Topic.objects.filter(
                course=self.course, order_index=self.order_index
            ).exclude(id=self.id)

            if conflict.exists():
                Topic.objects.filter(
                    course=self.course, order_index__gte=self.order_index
                ).exclude(id=self.id).update(order_index=models.F("order_index") + 1)

        super().save(*args, **kwargs)


class Subtopic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="subtopics")
    name = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    order_index = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order_index"]

    def save(self, *args, **kwargs):
        if self.order_index is None:
            last = (
                Subtopic.objects.filter(topic=self.topic)
                .order_by("-order_index")
                .first()
            )
            self.order_index = (last.order_index + 1) if last else 0

        else:
            conflict = Subtopic.objects.filter(
                topic=self.topic, order_index=self.order_index
            ).exclude(id=self.id)

            if conflict.exists():
                Subtopic.objects.filter(
                    topic=self.topic, order_index__gte=self.order_index
                ).exclude(id=self.id).update(order_index=models.F("order_index") + 1)

        super().save(*args, **kwargs)


class Video(models.Model):
    """
    Video model representing video content associated with a subtopic.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_topic = models.ForeignKey(
        Subtopic, on_delete=models.CASCADE, related_name="videos"
    )
    title = models.CharField(max_length=255)
    video_link = models.URLField()
    ai_context = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sub_topic.name} - {self.title}"








class Note(models.Model):
    """
    Note model representing user-created notes for personal study.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_topic = models.ForeignKey(
        Subtopic, on_delete=models.CASCADE, related_name="notes"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.sub_topic.name} - {self.content[:30]}..."


class CourseInstructor(models.Model):
    """
    Mapping table for assigning multiple instructors to a course.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="course_instructors"
    )

    instructor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="instructor_courses",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("course", "instructor")  # Prevent duplicates
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.instructor.email} → {self.course.name}"

    def clean(self):
        from django.core.exceptions import ValidationError

        # Only users with instructor/admin roles can be linked
        if self.instructor.role not in ["instructor", "admin"]:
            raise ValidationError(
                "Only instructors or admins can be assigned to a course."
            )

    def save(self, *args, **kwargs):
        self.full_clean()  # Validate before saving
        super().save(*args, **kwargs)


class LearnProgress(models.Model):
    """
    Tracks which subtopic a user has completed inside
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learn_progress"
    )
    
    subtopic = models.ForeignKey(
        Subtopic,
        on_delete=models.CASCADE,
        related_name="progress_records"
    )
    completed = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ("user", "subtopic")
        ordering = ["-updated_at"]
        
    def __str__(self):
        return f"{self.user.username} - {self.subtopic.name} ({'Done' if self.completed else 'Pending'}) "
    
class CourseContinue(models.Model):
    """
    Stores the last subtopic the user viewed inside a course,
    used to power 'Continue Learning
    """
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="continue_learning")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="continue_records")
    last_subtopic = models.ForeignKey(Subtopic, null=True, blank=True, on_delete=models.SET_NULL, related_name="last_viewed_by")
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ("user", "course")
        ordering = ["-updated_at"]
        
    def __str__(self):
        return f"{self.user.username} - {self.course.name}"

        
class Question(models.Model):
    """
    Unified Question Bank model for storing questions at different levels (course, topic, subtopic)
    Supports MCQ, Coding, and Descriptive question types with multiple categories
    """
    QUESTION_TYPES = [
        ("mcq", "Multiple Choice Question"),
        ("coding", "Coding Problem"),
        ("descriptive", "Descriptive Question"),
    ]
    
    DIFFICULTY_LEVELS = [
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    ]
    
    QUESTION_LEVELS = [
        ("course", "Course Level"),
        ("topic", "Topic Level"),
        ("subtopic", "Subtopic Level"),
    ]
    
    QUESTION_CATEGORIES = [
        ("learn", "Learn & Certify"),
        ("practice", "Practice Questions"),
        ("skill_test", "Skill Test"),
        ("contest", "Contest"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Question basic info
    type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    title = models.CharField(max_length=500)
    content = models.TextField()
    
    # Level and associations
    level = models.CharField(max_length=20, choices=QUESTION_LEVELS)
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="questions"
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="questions"
    )
    subtopic = models.ForeignKey(
        Subtopic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="questions"
    )
    
    # Question properties
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_LEVELS, default="easy")
    marks = models.PositiveIntegerField(default=1)
    categories = models.JSONField(
        default=list,
        help_text="List of categories this question belongs to (learn, practice, skill_test, contest)"
    )
    
    # MCQ specific fields
    mcq_options = models.JSONField(null=True, blank=True, help_text="Options for MCQ questions")
    mcq_correct_answer_index = models.PositiveIntegerField(null=True, blank=True, help_text="Index of correct answer for MCQ")
    
    # Coding specific fields
    test_cases_basic = models.JSONField(null=True, blank=True, help_text="Basic test cases visible to students")
    test_cases_advanced = models.JSONField(default=list, blank=True, help_text="Advanced test cases for evaluation")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_questions"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["type", "level"]),
            models.Index(fields=["difficulty"]),
            models.Index(fields=["course", "topic", "subtopic"]),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Validate level associations
        if self.level == "course" and not self.course:
            raise ValidationError("Course is required for course-level questions")
        if self.level == "topic" and not self.topic:
            raise ValidationError("Topic is required for topic-level questions")
        if self.level == "subtopic" and not self.subtopic:
            raise ValidationError("Subtopic is required for subtopic-level questions")
            
        # Validate categories
        if self.categories:
            valid_categories = [choice[0] for choice in self.QUESTION_CATEGORIES]
            for category in self.categories:
                if category not in valid_categories:
                    raise ValidationError(f"Invalid category: {category}")
            
        # Validate MCQ fields
        if self.type == "mcq":
            if not self.mcq_options or not isinstance(self.mcq_options, list) or len(self.mcq_options) < 2:
                raise ValidationError("MCQ questions must have at least 2 options")
            if self.mcq_correct_answer_index is None:
                raise ValidationError("MCQ questions must have a correct answer index")
            if self.mcq_correct_answer_index >= len(self.mcq_options):
                raise ValidationError("MCQ correct answer index is out of range")
                
        # Validate coding fields
        if self.type == "coding":
            if not self.test_cases_basic or not isinstance(self.test_cases_basic, list) or len(self.test_cases_basic) == 0:
                raise ValidationError("Coding questions must have at least 1 basic test case")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.type.upper()}: {self.title[:50]}..."