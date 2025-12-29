from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("job", "0007_alter_job_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="approval_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending Approval"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="approved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="job",
            name="approved_by",
            field=models.ForeignKey(
                blank=True,
                help_text="Admin user who approved this job",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="approved_jobs",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="rejection_reason",
            field=models.TextField(
                blank=True, help_text="Reason for rejection if applicable", null=True
            ),
        ),
    ]
