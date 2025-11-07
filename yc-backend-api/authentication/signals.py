# Authentication signals
# This file contains Django signals for the authentication app

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Signal to handle user profile creation or updates after user save.
    This can be extended to create related profile models or perform
    other post-registration tasks.
    """
    if created:
        # Add any post-user-creation logic here
        # For example, creating a user profile, sending welcome emails, etc.
        pass


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Signal to handle user profile updates.
    This can be extended to update related profile models.
    """
    # Add any post-user-update logic here
    pass
