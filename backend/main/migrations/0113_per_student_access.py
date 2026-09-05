"""
Per-student course access (Feature C): a course access_mode on the enrollment,
plus per-student per-module and per-lesson override tables.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0112_student_is_activated'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentcourseenrollment',
            name='access_mode',
            field=models.CharField(
                choices=[('auto', 'Auto (weekly)'), ('unlocked', 'Fully unlocked'), ('locked', 'Locked')],
                default='auto', max_length=10,
                help_text="Per-student access: auto (weekly drip), unlocked (whole course), or locked.",
            ),
        ),
        migrations.CreateModel(
            name='StudentModuleAccess',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('state', models.CharField(choices=[('locked', 'Locked'), ('unlocked', 'Unlocked')], max_length=10)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('module', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_access', to='main.chapter')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='module_access', to='main.student')),
            ],
            options={'verbose_name_plural': 'Student Module Access', 'unique_together': {('student', 'module')}},
        ),
        migrations.CreateModel(
            name='StudentLessonAccess',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('state', models.CharField(choices=[('locked', 'Locked'), ('unlocked', 'Unlocked')], max_length=10)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_access', to='main.modulelesson')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lesson_access', to='main.student')),
            ],
            options={'verbose_name_plural': 'Student Lesson Access', 'unique_together': {('student', 'lesson')}},
        ),
    ]
