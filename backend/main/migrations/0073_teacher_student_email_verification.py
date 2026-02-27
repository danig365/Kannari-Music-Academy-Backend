from django.db import migrations, models


def mark_existing_users_verified(apps, schema_editor):
    Teacher = apps.get_model('main', 'Teacher')
    Student = apps.get_model('main', 'Student')
    Teacher.objects.all().update(is_verified=True)
    Student.objects.all().update(is_verified=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0072_subscription_audio_messages_used_this_month_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacher',
            name='is_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='student',
            name='is_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(mark_existing_users_verified, noop_reverse),
    ]
