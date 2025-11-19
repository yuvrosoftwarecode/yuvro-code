# Generated manually for refactoring to use CodingProblem

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0001_initial'),
        ('code_executor', '0001_initial'),
    ]

    operations = [
        # Drop the TestCase model first to avoid foreign key issues
        migrations.DeleteModel(
            name='TestCase',
        ),
        
        # Clear existing submissions by recreating the table
        migrations.RunSQL(
            "TRUNCATE TABLE code_executor_codesubmission CASCADE;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Remove the old fields
        migrations.RemoveField(
            model_name='codesubmission',
            name='course',
        ),
        migrations.RemoveField(
            model_name='codesubmission',
            name='problem_title',
        ),
        
        # Add the new coding_problem field as required
        migrations.AddField(
            model_name='codesubmission',
            name='coding_problem',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, 
                to='course.codingproblem',
                default=None  # This will be overridden since table is empty
            ),
            preserve_default=False,
        ),
    ]