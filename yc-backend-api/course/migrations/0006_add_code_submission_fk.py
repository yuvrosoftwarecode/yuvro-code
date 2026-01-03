# Generated migration to add code_submission foreign key

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('course', '0005_studentcodepractice'),
        ('code_editor', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='usercourseprogress',
            name='code_submission',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='user_course_progress',
                to='code_editor.codesubmission'
            ),
        ),
        migrations.AddField(
            model_name='studentcodepractice',
            name='code_submission',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='student_code_practices',
                to='code_editor.codesubmission'
            ),
        ),
    ]