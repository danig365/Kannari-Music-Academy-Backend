from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0100_student_stripe_customer_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='modulelesson',
            name='repeat_after_me_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='modulelesson',
            name='repeat_after_me_prompt',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='modulelesson',
            name='repeat_after_me_audio',
            field=models.FileField(blank=True, max_length=500, null=True, upload_to='lesson_interactions/repeat_after_me/'),
        ),
    ]
