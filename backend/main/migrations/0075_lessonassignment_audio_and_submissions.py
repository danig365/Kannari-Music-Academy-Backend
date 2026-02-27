from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0074_teacher_is_approved'),
    ]

    operations = [
        migrations.AddField(
            model_name='lessonassignment',
            name='audio_required',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='lessonassignment',
            name='max_points',
            field=models.PositiveIntegerField(default=100),
        ),
        migrations.CreateModel(
            name='LessonAssignmentSubmission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('audio_file', models.FileField(upload_to='assignment_submissions/')),
                ('submission_notes', models.TextField(blank=True, null=True)),
                ('points_awarded', models.PositiveIntegerField(blank=True, null=True)),
                ('teacher_feedback', models.TextField(blank=True, null=True)),
                ('graded_at', models.DateTimeField(blank=True, null=True)),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assignment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='main.lessonassignment')),
                ('graded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='graded_assignment_submissions', to='main.teacher')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lesson_assignment_submissions', to='main.student')),
            ],
            options={
                'verbose_name_plural': '60a. Lesson Assignment Submissions',
                'ordering': ['-submitted_at'],
                'unique_together': {('assignment', 'student')},
            },
        ),
    ]
