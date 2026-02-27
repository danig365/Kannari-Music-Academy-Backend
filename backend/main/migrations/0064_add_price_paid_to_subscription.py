# Generated manually - add missing price_paid column

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0063_subscriptionhistory_subscription'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscription',
            name='price_paid',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
    ]
