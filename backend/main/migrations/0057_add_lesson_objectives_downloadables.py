# Generated migration for lesson objectives and downloadables

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0056_remove_streak_achievement_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='modulelesson',
            name='is_locked',
            field=models.BooleanField(default=True, help_text='Lesson locked until previous lessons completed'),
        ),
        migrations.AddField(
            model_name='modulelesson',
            name='is_preview',
            field=models.BooleanField(default=False, help_text='Allow non-enrolled users to preview this lesson'),
        ),
        migrations.AddField(
            model_name='modulelesson',
            name='objectives',
            field=models.TextField(blank=True, help_text='What students will learn in this lesson (one per line)', null=True),
        ),
        migrations.CreateModel(
            name='LessonDownloadable',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('file_type', models.CharField(choices=[('pdf', 'PDF Document'), ('sheet_music', 'Sheet Music'), ('audio_slow', 'Audio - Slow Version'), ('audio_fast', 'Audio - Fast Version'), ('audio_playalong', 'Audio - Play Along'), ('worksheet', 'Worksheet'), ('other', 'Other')], default='pdf', max_length=20)),
                ('file', models.FileField(upload_to='lesson_downloadables/')),
                ('description', models.TextField(blank=True, null=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('download_count', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='downloadables', to='main.modulelesson')),
            ],
            options={
                'verbose_name_plural': '4b2. Lesson Downloadables',
                'ordering': ['order', 'id'],
            },
        ),
    ]
