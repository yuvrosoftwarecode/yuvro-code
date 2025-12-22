from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("authentication", "0003_remove_certification_profile_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("job", "0004_sociallinks_skill_project_experience_education_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="JobProfile",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "current_ctc",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                (
                    "expected_ctc",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                ("currency", models.CharField(default="INR", max_length=3)),
                ("total_experience_years", models.PositiveIntegerField(default=0)),
                ("total_experience_months", models.PositiveIntegerField(default=0)),
                (
                    "notice_period",
                    models.CharField(
                        choices=[
                            ("immediate", "Immediate"),
                            ("15_days", "15 Days"),
                            ("30_days", "30 Days"),
                            ("60_days", "60 Days"),
                            ("90_days", "90 Days"),
                        ],
                        default="30_days",
                        max_length=20,
                    ),
                ),
                ("available_from", models.DateField(blank=True, null=True)),
                (
                    "preferred_employment_types",
                    models.JSONField(blank=True, default=list),
                ),
                ("preferred_locations", models.JSONField(blank=True, default=list)),
                ("open_to_remote", models.BooleanField(default=False)),
                (
                    "highest_education",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("high_school", "High School"),
                            ("diploma", "Diploma"),
                            ("bachelor", "Bachelor's Degree"),
                            ("master", "Master's Degree"),
                            ("phd", "PhD"),
                        ],
                        max_length=20,
                    ),
                ),
                ("domain", models.CharField(blank=True, max_length=100)),
                ("preferred_company_types", models.JSONField(blank=True, default=list)),
                ("is_actively_looking", models.BooleanField(default=True)),
                ("last_active", models.DateTimeField(auto_now=True)),
                ("resume_file", models.URLField(blank=True, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        help_text="User who created this record",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="created_%(class)s_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "profile",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="job_profile",
                        to="authentication.profile",
                    ),
                ),
            ],
            options={
                "db_table": "job_profile",
            },
        ),
        migrations.CreateModel(
            name="CandidateSearchLog",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("search_filters", models.JSONField(default=dict)),
                ("results_count", models.PositiveIntegerField(default=0)),
                ("search_timestamp", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        help_text="User who created this record",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="created_%(class)s_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "recruiter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="candidate_search_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "candidate_search_log",
            },
        ),
        migrations.CreateModel(
            name="JobSkill",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("skill_name", models.CharField(max_length=100)),
                (
                    "proficiency",
                    models.CharField(
                        choices=[
                            ("beginner", "Beginner"),
                            ("intermediate", "Intermediate"),
                            ("advanced", "Advanced"),
                            ("expert", "Expert"),
                        ],
                        max_length=20,
                    ),
                ),
                ("years_of_experience", models.PositiveIntegerField(default=0)),
                (
                    "created_by",
                    models.ForeignKey(
                        help_text="User who created this record",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="created_%(class)s_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "job_profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="job_skills",
                        to="job.jobprofile",
                    ),
                ),
            ],
            options={
                "db_table": "candidate_job_skill",
                "unique_together": {("job_profile", "skill_name")},
            },
        ),
    ]
