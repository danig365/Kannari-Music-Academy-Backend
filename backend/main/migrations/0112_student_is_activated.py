"""
Card-free pending signup: add Student.is_activated.

New signups are created pending (is_activated=False) and must be activated with an
activation code (or by an admin) before they can access assigned content. All
EXISTING students are marked activated so they are not locked out by this change.
"""
from django.db import migrations, models


def activate_existing_students(apps, schema_editor):
    Student = apps.get_model('main', 'Student')
    Student.objects.update(is_activated=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0111_activation_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='is_activated',
            field=models.BooleanField(
                default=False,
                help_text="Account activated via activation code or by an admin. Pending accounts cannot access assigned content.",
            ),
        ),
        migrations.RunPython(activate_existing_students, noop_reverse),
    ]
