# Data migration to handle the transition from question_ids to questions_config

from django.db import migrations


def migrate_question_data_forward(apps, schema_editor):
    """
    Migrate data from old question_ids format to new questions_config format
    """
    Contest = apps.get_model('assessment', 'Contest')
    SkillTest = apps.get_model('assessment', 'SkillTest')
    MockInterview = apps.get_model('assessment', 'MockInterview')
    JobTest = apps.get_model('assessment', 'JobTest')
    
    models_to_migrate = [Contest, SkillTest, MockInterview, JobTest]
    
    for Model in models_to_migrate:
        for obj in Model.objects.all():
            # Initialize questions_config if it's empty or None
            if not obj.questions_config:
                obj.questions_config = {
                    'mcq_single': [],
                    'mcq_multiple': [],
                    'coding': [],
                    'descriptive': []
                }
            
            # Initialize questions_random_config if it's empty or None
            if not obj.questions_random_config:
                obj.questions_random_config = {
                    'mcq_single': 0,
                    'mcq_multiple': 0,
                    'coding': 0,
                    'descriptive': 0
                }
            
            obj.save()


def migrate_question_data_reverse(apps, schema_editor):
    """
    Reverse migration - convert back to old format if needed
    """
    # This is a no-op since we can't easily convert back
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('assessment', '0003_rename_question_fields'),
    ]

    operations = [
        migrations.RunPython(
            migrate_question_data_forward,
            migrate_question_data_reverse,
        ),
    ]