# Generated migration for CodingProblem test cases restructure

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0001_initial'),
    ]

    operations = [
        # Add the new test_cases_advanced field
        migrations.AddField(
            model_name='codingproblem',
            name='test_cases_advanced',
            field=models.JSONField(default=list, help_text='Advanced test cases for submission evaluation'),
        ),
        
        # Rename test_cases to test_cases_basic
        migrations.RenameField(
            model_name='codingproblem',
            old_name='test_cases',
            new_name='test_cases_basic',
        ),
        
        # Remove the input field
        migrations.RemoveField(
            model_name='codingproblem',
            name='input',
        ),
        
        # Update the help text for test_cases_basic
        migrations.AlterField(
            model_name='codingproblem',
            name='test_cases_basic',
            field=models.JSONField(help_text='Basic test cases visible to students'),
        ),
    ]