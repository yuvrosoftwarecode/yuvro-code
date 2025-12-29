from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("job", "0008_job_approval_status_job_approved_at_job_approved_by_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="job",
            name="approval_status",
        ),
        migrations.RemoveField(
            model_name="job",
            name="approved_at",
        ),
        migrations.RemoveField(
            model_name="job",
            name="approved_by",
        ),
        migrations.RemoveField(
            model_name="job",
            name="rejection_reason",
        ),
    ]
