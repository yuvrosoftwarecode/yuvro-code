# Generated migration for Question model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('course', '0010_remove_course_assigned_admin_courseinstructor_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[('mcq', 'Multiple Choice Question'), ('coding', 'Coding Problem'), ('descriptive', 'Descriptive Question')], max_length=20)),
                ('title', models.CharField(max_length=500)),
                ('content', models.TextField()),
                ('level', models.CharField(choices=[('course', 'Course Level'), ('topic', 'Topic Level'), ('subtopic', 'Subtopic Level')], max_length=20)),
                ('difficulty', models.CharField(choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='easy', max_length=10)),
                ('marks', models.PositiveIntegerField(default=1)),
                ('categories', models.JSONField(default=list, help_text='List of categories this question belongs to (learn, practice, skill_test, contest)')),
                ('mcq_options', models.JSONField(blank=True, help_text='Options for MCQ questions', null=True)),
                ('mcq_correct_answer_index', models.PositiveIntegerField(blank=True, help_text='Index of correct answer for MCQ', null=True)),
                ('test_cases_basic', models.JSONField(blank=True, help_text='Basic test cases visible to students', null=True)),
                ('test_cases_advanced', models.JSONField(default=list, help_text='Advanced test cases for evaluation')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('course', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='course.course')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_questions', to=settings.AUTH_USER_MODEL)),
                ('subtopic', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='course.subtopic')),
                ('topic', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='course.topic')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='question',
            index=models.Index(fields=['type', 'level'], name='course_ques_type_b8c8a5_idx'),
        ),
        migrations.AddIndex(
            model_name='question',
            index=models.Index(fields=['difficulty'], name='course_ques_difficu_8f4b2a_idx'),
        ),
        migrations.AddIndex(
            model_name='question',
            index=models.Index(fields=['course', 'topic', 'subtopic'], name='course_ques_course__c8e8f1_idx'),
        ),
    ]