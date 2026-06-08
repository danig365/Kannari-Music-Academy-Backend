# Generated manually on 2026-05-30

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0104_add_lessonblock_model'),
    ]

    operations = [
        migrations.CreateModel(
            name='LessonBlock',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('block_type', models.CharField(
                    choices=[
                        ('video',           'Teacher Video'),
                        ('audio',           'Practice Audio'),
                        ('image',           'Image / Diagram'),
                        ('repeat_after_me', 'Repeat After Me'),
                        ('checklist',       'Practice Checklist'),
                        ('timer',           'Practice Timer'),
                        ('quiz',            'Quiz'),
                        ('submission',      'Student Submission'),
                        ('badge',           'Reward Badge'),
                        ('assignment',      'Assignment'),
                    ],
                    max_length=20,
                )),
                ('order', models.PositiveIntegerField(default=0, help_text='Position within the lesson (0 = first)')),
                ('title', models.CharField(blank=True, default='', max_length=200, help_text='Optional display label shown to students')),
                ('file', models.FileField(
                    blank=True, null=True, max_length=500,
                    upload_to='lesson_blocks/',
                    help_text='Media file for video/audio/image/repeat_after_me blocks',
                )),
                ('config', models.JSONField(
                    blank=True, default=dict,
                    help_text='Block-type-specific configuration',
                )),
                ('is_library_item', models.BooleanField(default=False, help_text="Saved to the teacher's reusable block library")),
                ('library_name', models.CharField(blank=True, default='', max_length=200, help_text='Name shown in the block library')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lesson', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='blocks',
                    to='main.modulelesson',
                )),
            ],
            options={
                'verbose_name_plural': '4c. Lesson Blocks',
                'ordering': ['order', 'id'],
            },
        ),
    ]
