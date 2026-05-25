from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0101_modulelesson_repeat_after_me'),
    ]

    operations = [
        migrations.CreateModel(
            name='RepeatAfterMeAction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('done', 'Done'), ('again', 'Practice Again'), ('got_it', 'I Got It')], max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='repeat_after_me_actions', to='main.modulelesson')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='repeat_after_me_actions', to='main.student')),
            ],
            options={
                'verbose_name_plural': '4e. Repeat After Me Actions',
                'ordering': ['-created_at', '-id'],
            },
        ),
    ]
