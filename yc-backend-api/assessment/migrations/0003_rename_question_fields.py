# Generated migration to rename question fields

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("assessment", "0002_add_question_ids_random_field"),
    ]

    operations = [
        # Rename question_ids to questions_config for all models
        migrations.RenameField(
            model_name="contest",
            old_name="question_ids",
            new_name="questions_config",
        ),
        migrations.RenameField(
            model_name="jobtest",
            old_name="question_ids",
            new_name="questions_config",
        ),
        migrations.RenameField(
            model_name="mockinterview",
            old_name="question_ids",
            new_name="questions_config",
        ),
        migrations.RenameField(
            model_name="skilltest",
            old_name="question_ids",
            new_name="questions_config",
        ),
        
        # Rename question_ids_random to questions_random_config for all models
        migrations.RenameField(
            model_name="contest",
            old_name="question_ids_random",
            new_name="questions_random_config",
        ),
        migrations.RenameField(
            model_name="jobtest",
            old_name="question_ids_random",
            new_name="questions_random_config",
        ),
        migrations.RenameField(
            model_name="mockinterview",
            old_name="question_ids_random",
            new_name="questions_random_config",
        ),
        migrations.RenameField(
            model_name="skilltest",
            old_name="question_ids_random",
            new_name="questions_random_config",
        ),
        
        # Update the field definitions to change default from list to dict for questions_config
        migrations.AlterField(
            model_name="contest",
            name="questions_config",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Questions configuration by category: {'mcq_single': ['uuid1', 'uuid2'], 'mcq_multiple': ['uuid3'], 'coding': ['uuid4'], 'descriptive': ['uuid5']}"
            ),
        ),
        migrations.AlterField(
            model_name="jobtest",
            name="questions_config",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Questions configuration by category: {'mcq_single': ['uuid1', 'uuid2'], 'mcq_multiple': ['uuid3'], 'coding': ['uuid4'], 'descriptive': ['uuid5']}"
            ),
        ),
        migrations.AlterField(
            model_name="mockinterview",
            name="questions_config",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Questions configuration by category: {'mcq_single': ['uuid1', 'uuid2'], 'mcq_multiple': ['uuid3'], 'coding': ['uuid4'], 'descriptive': ['uuid5']}"
            ),
        ),
        migrations.AlterField(
            model_name="skilltest",
            name="questions_config",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Questions configuration by category: {'mcq_single': ['uuid1', 'uuid2'], 'mcq_multiple': ['uuid3'], 'coding': ['uuid4'], 'descriptive': ['uuid5']}"
            ),
        ),
    ]