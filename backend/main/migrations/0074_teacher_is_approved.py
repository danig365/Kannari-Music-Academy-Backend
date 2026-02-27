from django.db import migrations, models


def approve_existing_teachers(apps, schema_editor):
    Teacher = apps.get_model('main', 'Teacher')
    Teacher.objects.all().update(is_approved=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0073_teacher_student_email_verification'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacher',
            name='is_approved',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(approve_existing_teachers, noop_reverse),
    ]
