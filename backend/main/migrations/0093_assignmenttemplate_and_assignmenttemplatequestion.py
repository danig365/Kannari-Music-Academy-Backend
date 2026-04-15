from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0092_fix_game_question_mismatch_and_timers'),
    ]

    operations = [
        migrations.CreateModel(
            name='AssignmentTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=300)),
                ('description', models.TextField(blank=True, null=True)),
                ('submission_type', models.CharField(choices=[('audio', 'Audio Submission'), ('video', 'Video Submission'), ('discussion', 'Discussion Thread'), ('multiple_choice', 'Multiple Choice (Auto-Graded)'), ('file_upload', 'File Upload')], default='audio', max_length=20)),
                ('max_points', models.PositiveIntegerField(default=100)),
                ('audio_required', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assignment_templates', to='main.teacher')),
            ],
            options={
                'verbose_name_plural': '59a. Assignment Templates',
                'ordering': ['-updated_at', '-id'],
            },
        ),
        migrations.CreateModel(
            name='AssignmentTemplateQuestion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question_text', models.TextField()),
                ('option_a', models.CharField(max_length=500)),
                ('option_b', models.CharField(max_length=500)),
                ('option_c', models.CharField(blank=True, default='', max_length=500)),
                ('option_d', models.CharField(blank=True, default='', max_length=500)),
                ('correct_option', models.CharField(choices=[('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D')], max_length=1)),
                ('points', models.PositiveIntegerField(default=1)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('template', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mc_questions', to='main.assignmenttemplate')),
            ],
            options={
                'verbose_name_plural': '59b. Assignment Template Questions',
                'ordering': ['order', 'id'],
            },
        ),
    ]
