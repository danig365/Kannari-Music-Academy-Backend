from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0099_student_phone_address'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='stripe_customer_id',
            field=models.CharField(
                blank=True,
                help_text='Stripe customer ID stored at registration for card-on-file billing',
                max_length=255,
                null=True,
            ),
        ),
    ]
