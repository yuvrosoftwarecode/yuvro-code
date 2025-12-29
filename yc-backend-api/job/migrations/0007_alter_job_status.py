from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("job", "0006_remove_candidatesearchlog_created_by_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="job",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("active", "Active"),
                    ("paused", "Paused"),
                    ("closed", "Closed"),
                    ("rejected", "Rejected"),
                ],
                default="draft",
                max_length=20,
            ),
        ),
    ]
