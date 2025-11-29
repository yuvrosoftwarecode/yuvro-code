import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending AbstractUser with email as USERNAME_FIELD
    while retaining username field for compatibility.
    """

    ROLE_CHOICES = [
        ("student", "Student"),
        ("instructor", "Instructor"),
        ("recruiter", "Recruiter"),
        ("admin", "Administrator"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email

    def is_admin(self):
        """Check if user has admin role."""
        return self.role == "admin"

    def is_instructor(self):
        """Check if user has instructor role."""
        return self.role == "instructor"

    def is_recruiter(self):
        """Check if user has recruiter role."""
        return self.role == "recruiter"

    def is_student(self):
        """Check if user has student role."""
        return self.role == "student"

    def can_manage_content(self):
        """Check if user can manage content (admin or instructor)."""
        return self.role in ["admin", "instructor"]

    def can_manage_users(self):
        """Check if user can manage users (admin only)."""
        return self.role == "admin"

    # Override save method to ensure role consistency
    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = "admin"
        super().save(*args, **kwargs)


class Profile(models.Model):
    """
    Profile model to store additional user information and OAuth data.
    """

    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
        ("prefer_not_to_say", "Prefer not to say"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    # Profile media
    profile_image = models.URLField(blank=True, null=True)
    cover_image = models.URLField(blank=True, null=True)

    # Personal info
    full_name = models.CharField(max_length=200, blank=True, null=True)
    title = models.CharField(max_length=200, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)

    google_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    about = models.TextField(blank=True, null=True)
    gender = models.CharField(
        max_length=20, choices=GENDER_CHOICES, blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s Profile"


class SocialLinks(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.OneToOneField(
        Profile, on_delete=models.CASCADE, related_name="links"
    )

    github = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    portfolio = models.URLField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"Links for {self.profile.user.email}"


class Skill(models.Model):
    level_choices = [
        ("Beginner", "Beginner"),
        ("Intermediate", "Intermediate"),
        ("Advanced", "Advanced"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="skills"
    )

    name = models.CharField(max_length=100)
    level = models.CharField(
        max_length=100, choices=level_choices
    )  # Beginner/Intermediate/Advanced
    percentage = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} - {self.profile.user.email}"


class Experience(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="experiences"
    )

    company = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    duration = models.CharField(max_length=100)

    description_list = models.JSONField(default=list)  # bullet points
    technologies = models.JSONField(default=list)  # list of tech names

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.role} at {self.company}"


class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="projects"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    role = models.CharField(max_length=255)

    tech_stack = models.JSONField(default=list)
    github_link = models.URLField(blank=True, null=True)
    live_link = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Education(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="education"
    )

    institution = models.CharField(max_length=255)
    degree = models.CharField(max_length=255)
    field = models.CharField(max_length=255)
    duration = models.CharField(max_length=100)
    cgpa = models.CharField(max_length=10, blank=True, null=True)

    start_year = models.IntegerField(blank=True, null=True)
    end_year = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"{self.degree} - {self.institution}"


class Certification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="certifications"
    )

    name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    completion_date = models.CharField(max_length=100)
    certificate_file = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.profile.user.email}"
