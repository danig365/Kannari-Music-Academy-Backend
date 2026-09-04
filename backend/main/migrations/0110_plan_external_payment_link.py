"""
Add an admin-editable external payment link to each subscription plan.

Payments move outside the app: students are sent to this URL to pay; no card
is collected in-app. Admins set/edit the link per plan from the dashboard.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0109_teacher_lock_overrides'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscriptionplan',
            name='external_payment_link',
            field=models.URLField(
                max_length=500, null=True, blank=True,
                help_text="External payment page URL for this plan. Students are sent here to pay; no card is collected in-app.",
            ),
        ),
    ]
