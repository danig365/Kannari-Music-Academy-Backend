from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0096_teacher_verification_admin_override'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscriptionplan',
            name='stripe_price_id',
            field=models.CharField(
                blank=True, null=True, max_length=255,
                help_text='Stripe Price ID (price_xxx) for recurring billing'
            ),
        ),
        migrations.AddField(
            model_name='subscription',
            name='stripe_customer_id',
            field=models.CharField(
                blank=True, null=True, max_length=255,
                help_text='Stripe customer ID'
            ),
        ),
        migrations.AddField(
            model_name='subscription',
            name='stripe_subscription_id',
            field=models.CharField(
                blank=True, null=True, max_length=255,
                help_text='Stripe subscription ID for recurring billing'
            ),
        ),
        migrations.AddField(
            model_name='subscription',
            name='cancel_at_period_end',
            field=models.BooleanField(
                default=False,
                help_text='Cancels at end of current billing period'
            ),
        ),
    ]
