# Generated migration to update Question categories help text

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0012_remove_codingproblem_sub_topic_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='question',
            name='categories',
            field=models.JSONField(default=list, help_text='List of categories this question belongs to (learn, practice, skill_test, contest)'),
        ),
    ]