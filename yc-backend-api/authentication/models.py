import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending AbstractUser with email as USERNAME_FIELD
    while retaining username field for compatibility.
    """
    
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('admin_content', 'Content Administrator'),
        ('admin', 'Administrator'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
    
    def is_admin(self):
        """Check if user has admin role."""
        return self.role == 'admin'
    
    def is_content_admin(self):
        """Check if user has content admin role."""
        return self.role == 'admin_content'
    
    def is_student(self):
        """Check if user has student role."""
        return self.role == 'student'
    
    def can_manage_content(self):
        """Check if user can manage content (admin or content admin)."""
        return self.role in ['admin', 'admin_content']
    
    def can_manage_users(self):
        """Check if user can manage users (admin only)."""
        return self.role == 'admin'
    
    # Override save method to ensure role consistency
    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'admin'
        super().save(*args, **kwargs)

class Profile(models.Model):
    """
    Profile model to store additional user information and OAuth data.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    google_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    avatar_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s Profile"
