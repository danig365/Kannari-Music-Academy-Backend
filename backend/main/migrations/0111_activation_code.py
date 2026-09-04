"""
Activation codes for card-free onboarding.

Students sign up into a pending state; an admin gives them a single-use code;
entering a valid code activates the account. Codes are generated/managed from the
admin dashboard.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0110_plan_external_payment_link'),
    ]

    operations = [
        migrations.CreateModel(
            name='ActivationCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(db_index=True, max_length=20, unique=True)),
                ('status', models.CharField(choices=[('unused', 'Unused'), ('used', 'Used'), ('revoked', 'Revoked')], default='unused', max_length=10)),
                ('note', models.CharField(blank=True, help_text='Optional label — e.g. who this code is for.', max_length=200, null=True)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('expires_at', models.DateTimeField(blank=True, help_text='Optional expiry. Blank = never expires.', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='activation_codes', to='main.admin')),
                ('used_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='activation_codes_used', to='main.student')),
            ],
            options={
                'verbose_name_plural': 'Activation Codes',
                'ordering': ['-created_at'],
            },
        ),
    ]
