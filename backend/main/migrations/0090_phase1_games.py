from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0089_add_youtube_url_to_modulelesson'),
    ]

    operations = [
        migrations.CreateModel(
            name='GameBadge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('badge_key', models.CharField(choices=[('note_master', 'Note Master'), ('rhythm_king', 'Rhythm King'), ('theory_champion', 'Theory Champion')], max_length=40, unique=True)),
                ('title', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True, default='')),
                ('criteria', models.JSONField(blank=True, default=dict)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name_plural': '70. Game Badges',
            },
        ),
        migrations.CreateModel(
            name='GameDefinition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('game_type', models.CharField(choices=[('note_ninja', 'Note Ninja'), ('rhythm_rush', 'Rhythm Rush'), ('music_challenge', '5-Second Music Challenge')], max_length=30, unique=True)),
                ('title', models.CharField(max_length=120)),
                ('description', models.TextField(blank=True, default='')),
                ('is_active', models.BooleanField(default=True)),
                ('min_access_level', models.CharField(choices=[('free', 'Free'), ('basic', 'Basic'), ('standard', 'Standard'), ('premium', 'Premium')], default='free', max_length=20)),
                ('max_level', models.PositiveIntegerField(default=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name_plural': '65. Game Definitions',
            },
        ),
        migrations.CreateModel(
            name='GameQuestion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('level', models.PositiveIntegerField(default=1)),
                ('prompt', models.TextField()),
                ('question_payload', models.JSONField(blank=True, default=dict)),
                ('choices', models.JSONField(blank=True, default=list)),
                ('correct_answer', models.CharField(blank=True, default='', max_length=255)),
                ('time_limit_seconds', models.PositiveIntegerField(default=5)),
                ('points', models.PositiveIntegerField(default=10)),
                ('is_active', models.BooleanField(default=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='main.gamedefinition')),
            ],
            options={
                'verbose_name_plural': '66. Game Questions',
                'ordering': ['game_id', 'level', 'order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='GameSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('level', models.PositiveIntegerField(default=1)),
                ('score', models.IntegerField(default=0)),
                ('streak', models.PositiveIntegerField(default=0)),
                ('max_streak', models.PositiveIntegerField(default=0)),
                ('correct_count', models.PositiveIntegerField(default=0)),
                ('wrong_count', models.PositiveIntegerField(default=0)),
                ('average_response_ms', models.PositiveIntegerField(default=0)),
                ('time_spent_seconds', models.PositiveIntegerField(default=0)),
                ('status', models.CharField(choices=[('active', 'Active'), ('completed', 'Completed'), ('abandoned', 'Abandoned')], default='active', max_length=20)),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sessions', to='main.gamedefinition')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='game_sessions', to='main.student')),
            ],
            options={
                'verbose_name_plural': '68. Game Sessions',
                'ordering': ['-started_at'],
            },
        ),
        migrations.CreateModel(
            name='StudentGameProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_attempts', models.PositiveIntegerField(default=0)),
                ('correct_attempts', models.PositiveIntegerField(default=0)),
                ('total_score', models.IntegerField(default=0)),
                ('best_score', models.IntegerField(default=0)),
                ('best_streak', models.PositiveIntegerField(default=0)),
                ('highest_level_unlocked', models.PositiveIntegerField(default=1)),
                ('time_spent_seconds', models.PositiveIntegerField(default=0)),
                ('sonara_coins', models.PositiveIntegerField(default=0)),
                ('last_played_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_profiles', to='main.gamedefinition')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='game_profiles', to='main.student')),
            ],
            options={
                'verbose_name_plural': '67. Student Game Profiles',
                'unique_together': {('student', 'game')},
            },
        ),
        migrations.CreateModel(
            name='WeeklyGameLeaderboard',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('week_start', models.DateField()),
                ('week_end', models.DateField()),
                ('total_score', models.IntegerField(default=0)),
                ('attempts_count', models.PositiveIntegerField(default=0)),
                ('avg_accuracy', models.FloatField(default=0)),
                ('best_streak', models.PositiveIntegerField(default=0)),
                ('rank', models.PositiveIntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='weekly_rankings', to='main.gamedefinition')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='weekly_game_rankings', to='main.student')),
            ],
            options={
                'verbose_name_plural': '72. Weekly Game Leaderboard',
                'ordering': ['week_start', 'game', 'rank'],
                'unique_together': {('student', 'game', 'week_start')},
            },
        ),
        migrations.CreateModel(
            name='StudentGameBadge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('awarded_at', models.DateTimeField(auto_now_add=True)),
                ('badge', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_badges', to='main.gamebadge')),
                ('source_game', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='awarded_badges', to='main.gamedefinition')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='game_badges', to='main.student')),
            ],
            options={
                'verbose_name_plural': '71. Student Game Badges',
                'unique_together': {('student', 'badge')},
            },
        ),
        migrations.CreateModel(
            name='GameAttempt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('expected_payload', models.JSONField(blank=True, default=dict)),
                ('submitted_payload', models.JSONField(blank=True, default=dict)),
                ('response_time_ms', models.PositiveIntegerField(default=0)),
                ('is_correct', models.BooleanField(default=False)),
                ('accuracy_score', models.FloatField(default=0)),
                ('points_earned', models.IntegerField(default=0)),
                ('feedback', models.CharField(choices=[('perfect', 'Perfect'), ('good', 'Good'), ('try_again', 'Try Again'), ('correct', 'Correct'), ('incorrect', 'Incorrect')], default='try_again', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('question', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='attempts', to='main.gamequestion')),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attempts', to='main.gamesession')),
            ],
            options={
                'verbose_name_plural': '69. Game Attempts',
                'ordering': ['id'],
            },
        ),
    ]
