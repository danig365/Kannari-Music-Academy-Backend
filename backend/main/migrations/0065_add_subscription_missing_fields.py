# Generated manually - add only missing fields to subscription

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0064_add_price_paid_to_subscription'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscription',
            name='is_paid',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='subscription',
            name='payment_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='subscription',
            name='activated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='subscription',
            name='cancelled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='subscription',
            name='courses_accessed',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='subscription',
            name='lessons_accessed',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='subscription',
            name='current_week_lessons',
            field=models.IntegerField(default=0, help_text='Lessons accessed in current week'),
        ),
    ]
