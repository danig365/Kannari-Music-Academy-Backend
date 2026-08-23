"""
Teacher manual lock/unlock overrides for modules (Chapter) and lessons (ModuleLesson).

Layers on top of the weekly module drip:
  manual_lock = None  -> follow the automatic weekly schedule
              = True  -> force LOCKED
              = False -> force UNLOCKED
Lesson-level override takes precedence over the module-level override.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0108_module_drip_plan_config'),
    ]

    operations = [
        migrations.AddField(
            model_name='chapter',
            name='manual_lock',
            field=models.BooleanField(
                null=True, blank=True, default=None,
                help_text="Teacher override: null=follow weekly schedule, true=force locked, false=force unlocked",
            ),
        ),
        migrations.AddField(
            model_name='modulelesson',
            name='manual_lock',
            field=models.BooleanField(
                null=True, blank=True, default=None,
                help_text="Teacher override: null=follow module, true=force locked, false=force unlocked",
            ),
        ),
    ]
