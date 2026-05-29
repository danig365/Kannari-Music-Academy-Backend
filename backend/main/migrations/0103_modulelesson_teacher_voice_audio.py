from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0102_repeat_after_me_action'),
    ]

    operations = [
        migrations.AddField(
            model_name='modulelesson',
            name='teacher_voice_audio',
            field=models.FileField(
                blank=True,
                null=True,
                upload_to='lesson_interactions/practice_with_teacher/',
                max_length=500,
                help_text='Teacher narration/explanation audio for Practice with Teacher mode',
            ),
        ),
    ]
