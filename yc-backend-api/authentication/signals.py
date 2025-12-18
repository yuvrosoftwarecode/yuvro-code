from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Profile
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, "profile"):
        instance.profile.save()


@receiver(post_save, sender=User)
def assign_user_group(sender, instance, created, **kwargs):
    """
    Assign user to a group based on their role.
    """
    from django.contrib.auth.models import Group
    
    if instance.role:
        group, _ = Group.objects.get_or_create(name=instance.role)
        if not instance.groups.filter(name=instance.role).exists():
            instance.groups.add(group)

