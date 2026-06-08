from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0105_lessonblock'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lessonblock',
            name='block_type',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('video',            'Teacher Video'),
                    ('audio',            'Practice Audio'),
                    ('image',            'Image / Diagram'),
                    ('repeat_after_me',  'Repeat After Me'),
                    ('checklist',        'Practice Checklist'),
                    ('timer',            'Practice Timer'),
                    ('quiz',             'Quiz'),
                    ('submission',       'Student Submission'),
                    ('badge',            'Reward Badge'),
                    ('assignment',       'Assignment'),
                    ('practice_counter', 'Practice Counter'),
                ],
            ),
        ),
    ]
