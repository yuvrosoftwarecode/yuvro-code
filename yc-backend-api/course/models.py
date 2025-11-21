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
        User,
        through="CourseInstructor",
        related_name="courses_taught"
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
        # ❌ REMOVE UNIQUE CONSTRAINT (we handle it manually)
        # unique_together = ['course', 'order_index']

    def save(self, *args, **kwargs):
        # **Auto assign if no index**
        if self.order_index is None:
            last = (
                Topic.objects.filter(course=self.course)
                .order_by("-order_index")
                .first()
            )
            self.order_index = (last.order_index + 1) if last else 0

        else:
            # **Check if another topic already has this index**
            conflict = Topic.objects.filter(
                course=self.course, order_index=self.order_index
            ).exclude(id=self.id)

            if conflict.exists():
                # SHIFT all indexes >= current
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
        # ❌ REMOVE UNIQUE TOGETHER (we handle ordering ourselves)
        # unique_together = ['topic', 'order_index']

    def save(self, *args, **kwargs):
        # Auto assign if empty
        if self.order_index is None:
            last = (
                Subtopic.objects.filter(topic=self.topic)
                .order_by("-order_index")
                .first()
            )
            self.order_index = (last.order_index + 1) if last else 0

        else:
            # Detect conflict
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


class CodingProblem(models.Model):
    CATEGORY_CHOICES = [
        ("learn_certify", "Learn & Certify"),
        ("practice", "Practice Questions"),
        ("skill_test", "Skill Test"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # NEW: optional topic mapping
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="coding_problems_topic",
    )

    # OLD: subtopic mapping (now optional)
    sub_topic = models.ForeignKey(
        Subtopic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="coding_problems",
    )

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)

    title = models.CharField(max_length=255)
    description = models.TextField()

    test_cases_basic = models.JSONField(help_text="Basic test cases visible to students")
    test_cases_advanced = models.JSONField(default=list, help_text="Advanced test cases")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sub_topic.name if self.sub_topic else self.topic.name} - {self.title}"

    def clean(self):
        from django.core.exceptions import ValidationError

        # CASE 1: learn & certify → must map to subtopic
        if self.category == "learn_certify":
            if not self.sub_topic:
                raise ValidationError("Learn & Certify questions must belong to a Subtopic.")
            if self.topic:
                raise ValidationError("Learn & Certify questions cannot be linked to a Topic.")

        # CASE 2: practice / skill test → must map to topic
        if self.category in ["practice", "skill_test"]:
            if not self.topic:
                raise ValidationError("Practice/Skill Test questions must belong to a Topic.")
            if self.sub_topic:
                raise ValidationError("Practice/Skill Test questions cannot be linked to a Subtopic.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    



class Quiz(models.Model):
    CATEGORY_CHOICES = [
        ("learn_certify", "Learn & Certify"),
        ("practice", "Practice Questions"),
        ("skill_test", "Skill Test"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # NEW: optional topic
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="quizzes_topic",
    )

    # OLD: optional subtopic
    sub_topic = models.ForeignKey(
        Subtopic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="quizzes",
    )

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)

    question = models.TextField()
    options = models.JSONField()
    correct_answer_index = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def clean(self):
        from django.core.exceptions import ValidationError

        # validate answer index
        if self.options and self.correct_answer_index is not None:
            if isinstance(self.options, list):
                if self.correct_answer_index >= len(self.options):
                    raise ValidationError(
                        f"Correct answer index {self.correct_answer_index} is out of range. Options has {len(self.options)} items."
                    )
                if self.correct_answer_index < 0:
                    raise ValidationError("Correct answer index must be non-negative.")

        # Mapping logic
        if self.category == "learn_certify":
            if not self.sub_topic:
                raise ValidationError("Learn & Certify quizzes must belong to a Subtopic.")
            if self.topic:
                raise ValidationError("Learn & Certify quizzes cannot be linked to a Topic.")

        if self.category in ["practice", "skill_test"]:
            if not self.topic:
                raise ValidationError("Practice/Skill Test quizzes must belong to a Topic.")
            if self.sub_topic:
                raise ValidationError("Practice/Skill Test quizzes cannot be linked to a Subtopic.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def correct_answer(self):
        """
        Get the correct answer text based on the index.
        """
        if (
            self.options
            and isinstance(self.options, list)
            and 0 <= self.correct_answer_index < len(self.options)
        ):
            return self.options[self.correct_answer_index]
        return None

    def __str__(self):
        return f"{self.sub_topic.name} - {self.question[:50]}..."


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
        Course,
        on_delete=models.CASCADE,
        related_name="course_instructors"
    )

    instructor = models.ForeignKey(
        User,  # Using your custom User model
        on_delete=models.CASCADE,
        related_name="instructor_courses"
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
            raise ValidationError("Only instructors or admins can be assigned to a course.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Validate before saving
        super().save(*args, **kwargs)
