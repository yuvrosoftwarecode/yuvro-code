import json
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import models
from authentication.models import Profile

User = get_user_model()


class Command(BaseCommand):
    help = "Create test users with different roles for development and testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing test users before creating new ones",
        )
        parser.add_argument(
            "--file",
            type=str,
            default="fixtures/test_users_data.json",
            help="Path to JSON file with user data (relative to authentication app)",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write(self.style.WARNING("Clearing existing test users..."))
            User.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Existing test users cleared."))

        self.stdout.write("Creating test users with different roles...")

        try:
            # Get the path to the JSON file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            auth_app_dir = os.path.dirname(os.path.dirname(current_dir))
            json_file_path = os.path.join(auth_app_dir, options["file"])

            if not os.path.exists(json_file_path):
                self.stdout.write(
                    self.style.ERROR(f"JSON file not found: {json_file_path}")
                )
                return

            # Load JSON data
            with open(json_file_path, "r", encoding="utf-8") as file:
                data = json.load(file)

            # Process each user
            for user_data in data["users"]:
                # Check if user already exists by email or username
                existing_user = User.objects.filter(
                    models.Q(email=user_data["email"])
                    | models.Q(username=user_data["username"])
                ).first()

                if existing_user:
                    if existing_user.email == user_data["email"]:
                        self.stdout.write(
                            f'- {user_data["role"].title()} user already exists (email): {user_data["email"]}'
                        )
                    else:
                        self.stdout.write(
                            f'- Username "{user_data["username"]}" already exists for user: {existing_user.email}'
                        )
                    user = existing_user
                    created = False
                else:
                    # Create new user
                    user = User.objects.create(
                        email=user_data["email"],
                        username=user_data["username"],
                        first_name=user_data["first_name"],
                        last_name=user_data["last_name"],
                        role=user_data["role"],
                        is_staff=user_data.get("is_staff", False),
                        is_superuser=user_data.get("is_superuser", False),
                    )
                    user.set_password(user_data["password"])
                    user.save()
                    created = True

                if created:
                    user.set_password(user_data["password"])
                    user.save()
                    self.stdout.write(
                        f'✓ Created {user_data["role"]} user: {user.email}'
                    )
                else:
                    self.stdout.write(
                        f'- {user_data["role"].title()} user already exists: {user.email}'
                    )

                # Create or update profile
                profile_data = user_data.get("profile", {})
                profile, profile_created = Profile.objects.get_or_create(
                    user=user, defaults=profile_data
                )

                if profile_created and profile_data:
                    self.stdout.write(f"  ✓ Created profile for: {user.email}")

            self.stdout.write(self.style.SUCCESS("\nSuccessfully created test users!"))

            # Display summary
            admin_count = User.objects.filter(role="admin").count()
            instructor_count = User.objects.filter(role="instructor").count()
            recruiter_count = User.objects.filter(role="recruiter").count()
            student_count = User.objects.filter(role="student").count()

            self.stdout.write(f"\nUser Summary:")
            self.stdout.write(f"- Admins: {admin_count}")
            self.stdout.write(f"- Instructors: {instructor_count}")
            self.stdout.write(f"- Recruiters: {recruiter_count}")
            self.stdout.write(f"- Students: {student_count}")
            self.stdout.write(f"- Total Users: {User.objects.count()}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error creating test users: {str(e)}"))
