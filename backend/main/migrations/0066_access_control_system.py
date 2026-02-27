# Generated manually - Access Control System migration
# Only adds fields that don't already exist in the database

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0065_add_subscription_missing_fields'),
    ]

    operations = [
        # Course access level fields
        migrations.AddField(
            model_name='course',
            name='is_featured',
            field=models.BooleanField(default=False, help_text='Feature this course on homepage'),
        ),
        migrations.AddField(
            model_name='course',
            name='is_premium',
            field=models.BooleanField(default=False, help_text='Mark as premium content'),
        ),
        migrations.AddField(
            model_name='course',
            name='required_access_level',
            field=models.CharField(choices=[('free', 'Free'), ('basic', 'Basic'), ('standard', 'Standard'), ('premium', 'Premium')], default='free', help_text='Minimum subscription level required to access this course', max_length=20),
        ),
        
        # ModuleLesson access level fields
        migrations.AddField(
            model_name='modulelesson',
            name='is_premium',
            field=models.BooleanField(default=False, help_text='Premium content - requires premium subscription'),
        ),
        migrations.AddField(
            model_name='modulelesson',
            name='required_access_level',
            field=models.CharField(choices=[('free', 'Free'), ('basic', 'Basic'), ('standard', 'Standard'), ('premium', 'Premium')], default='free', help_text='Minimum subscription level required', max_length=20),
        ),
        
        # StudentCourseEnrollment tracking fields
        migrations.AddField(
            model_name='studentcourseenrollment',
            name='completed_at',
            field=models.DateTimeField(blank=True, help_text='When course was completed', null=True),
        ),
        migrations.AddField(
            model_name='studentcourseenrollment',
            name='is_active',
            field=models.BooleanField(default=True, help_text='Whether enrollment is currently active'),
        ),
        migrations.AddField(
            model_name='studentcourseenrollment',
            name='last_accessed',
            field=models.DateTimeField(blank=True, help_text='Last time student accessed the course', null=True),
        ),
        migrations.AddField(
            model_name='studentcourseenrollment',
            name='progress_percent',
            field=models.IntegerField(default=0, help_text='Overall course completion percentage'),
        ),
        migrations.AddField(
            model_name='studentcourseenrollment',
            name='subscription',
            field=models.ForeignKey(blank=True, help_text='Subscription used for this enrollment', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='enrollments', to='main.subscription'),
        ),
        
        # Subscription - assigned teacher (new)
        migrations.AddField(
            model_name='subscription',
            name='assigned_teacher',
            field=models.ForeignKey(blank=True, help_text='Primary teacher assigned to this subscription', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_subscriptions', to='main.teacher'),
        ),
        
        # Subscription - daily/weekly reset fields (new)
        migrations.AddField(
            model_name='subscription',
            name='last_daily_reset',
            field=models.DateField(blank=True, help_text='Last date daily lesson count was reset', null=True),
        ),
        migrations.AddField(
            model_name='subscription',
            name='last_weekly_reset',
            field=models.DateField(blank=True, help_text='Last date weekly lesson count was reset', null=True),
        ),
        migrations.AddField(
            model_name='subscription',
            name='lessons_used_today',
            field=models.IntegerField(default=0, help_text='Lessons accessed today'),
        ),
        
        # SubscriptionPlan - access control fields
        migrations.AddField(
            model_name='subscriptionplan',
            name='access_level',
            field=models.CharField(choices=[('free', 'Free'), ('basic', 'Basic'), ('standard', 'Standard'), ('premium', 'Premium'), ('unlimited', 'Unlimited')], default='basic', help_text='Access tier: free < basic < standard < premium < unlimited', max_length=20),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='allowed_categories',
            field=models.ManyToManyField(blank=True, help_text='Categories accessible with this plan. Empty = all categories.', related_name='subscription_plans', to='main.coursecategory'),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='allowed_teachers',
            field=models.ManyToManyField(blank=True, help_text='Teachers whose courses are accessible with this plan. Empty = all teachers.', related_name='subscription_plans', to='main.teacher'),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='can_access_live_sessions',
            field=models.BooleanField(default=False, help_text='Can access live teaching sessions'),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='can_access_premium_content',
            field=models.BooleanField(default=False, help_text='Can access premium/exclusive lessons'),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='can_download',
            field=models.BooleanField(default=False, help_text='Can download lesson materials'),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='lessons_per_day',
            field=models.IntegerField(blank=True, help_text='Max lessons per day (None = unlimited)', null=True),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='priority_support',
            field=models.BooleanField(default=False, help_text='Has priority customer support'),
        ),
        
        # Unique constraint on enrollment
        migrations.AlterUniqueTogether(
            name='studentcourseenrollment',
            unique_together={('course', 'student')},
        ),
    ]
