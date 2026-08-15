"""
Switch paid plans to weekly MODULE drip.

Client requirement: students unlock one MODULE per week (not one lesson per week).
Each unlocked module exposes all of its lessons. Pacing is handled entirely by
`modules_per_week`, so the per-lesson counters are disabled and the lifetime
`max_lessons` cap raised so it can't block lessons inside an already-unlocked module.

NOTE: `modules_per_week` was previously added to the model and the DB column, but
no schema migration was ever generated for it (schema drift). This migration first
reconciles that field into Django's migration STATE only (SeparateDatabaseAndState
with no database operation, since the column already exists), then updates the plan
values. This keeps future makemigrations/migrate runs consistent.

Data changes are reversible: previous values are restored on rollback.
"""
from django.db import migrations, models


# name -> previous config (for reverse). Matches the live config at time of writing.
PREVIOUS = {
    'Starter':  {'modules_per_week': 1, 'lessons_per_week': 1, 'lessons_per_day': None, 'max_lessons': 24},
    'Standard': {'modules_per_week': 1, 'lessons_per_week': 2, 'lessons_per_day': None, 'max_lessons': 40},
    'Premium':  {'modules_per_week': 1, 'lessons_per_week': 1, 'lessons_per_day': None, 'max_lessons': 80},
}


def apply_module_drip(apps, schema_editor):
    SubscriptionPlan = apps.get_model('main', 'SubscriptionPlan')
    # Target every paid plan that had a per-lesson weekly cap (the ones driving the
    # "one lesson per week" behaviour). The Cohort plan (no weekly cap) is left alone.
    for plan in SubscriptionPlan.objects.filter(lessons_per_week__isnull=False):
        plan.modules_per_week = 1
        plan.lessons_per_week = None
        plan.lessons_per_day = None
        plan.max_lessons = 9999
        plan.save(update_fields=['modules_per_week', 'lessons_per_week',
                                 'lessons_per_day', 'max_lessons'])


def revert_module_drip(apps, schema_editor):
    SubscriptionPlan = apps.get_model('main', 'SubscriptionPlan')
    for name, cfg in PREVIOUS.items():
        for plan in SubscriptionPlan.objects.filter(name=name):
            plan.modules_per_week = cfg['modules_per_week']
            plan.lessons_per_week = cfg['lessons_per_week']
            plan.lessons_per_day = cfg['lessons_per_day']
            plan.max_lessons = cfg['max_lessons']
            plan.save(update_fields=['modules_per_week', 'lessons_per_week',
                                     'lessons_per_day', 'max_lessons'])


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0107_alter_lessonblock_config_alter_lessonblock_id_and_more'),
    ]

    operations = [
        # Reconcile the pre-existing `modules_per_week` column into migration STATE
        # only — the DB column already exists, so no database operation is performed.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='subscriptionplan',
                    name='modules_per_week',
                    field=models.IntegerField(
                        null=True, blank=True, default=None,
                        help_text="Max modules unlocked per week (None = unlimited). When set, modules are unlocked progressively; all lessons inside an unlocked module are accessible.",
                    ),
                ),
            ],
            database_operations=[],
        ),
        migrations.RunPython(apply_module_drip, revert_module_drip),
    ]
