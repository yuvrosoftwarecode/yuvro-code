from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("contest", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name='contest',
            name='duration',
        ),
        migrations.AddField(
            model_name='contest',
            name='duration',
            field=models.IntegerField(blank=True, null=True, help_text="Duration in seconds"),
        ),
    ]
