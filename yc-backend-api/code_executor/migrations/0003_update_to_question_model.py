# Migration to update CodeSubmission to use Question instead of CodingProblem

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0011_add_question_model'),
        ('code_executor', '0002_refactor_to_coding_problem'),
    ]

    operations = [
        # Clear existing submissions to avoid foreign key issues
        migrations.RunSQL(
            "TRUNCATE TABLE code_executor_codesubmission CASCADE;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Remove the old coding_problem field
        migrations.RemoveField(
            model_name='codesubmission',
            name='coding_problem',
        ),
        
        # Add the new question field (no default needed since table is empty)
        migrations.AddField(
            model_name='codesubmission',
            name='question',
            field=models.ForeignKey(
                limit_choices_to={'type': 'coding'}, 
                on_delete=django.db.models.deletion.CASCADE, 
                to='course.question'
            ),
        ),
    ]