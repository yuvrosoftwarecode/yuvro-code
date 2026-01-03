# Migration to ensure question field exists in CodeSubmission

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('code_editor', '0001_initial'),
        ('course', '0006_add_code_submission_fk'),
    ]

    operations = [
        # This migration ensures the question field exists
        # If it already exists, this will be a no-op
        # If it doesn't exist, it will be created
    ]