from django.db import migrations


def forwards(apps, schema_editor):
    GameDefinition = apps.get_model('main', 'GameDefinition')
    GameQuestion = apps.get_model('main', 'GameQuestion')

    note_ninja = GameDefinition.objects.filter(game_type='note_ninja').first()
    music_challenge = GameDefinition.objects.filter(game_type='music_challenge').first()
    if not music_challenge:
        return

    target_prompt = 'The spaces of the treble clef spell which word?'
    target_choices = ['FACE', 'FADE', 'CAFE', 'CAGE']

    if note_ninja:
        GameQuestion.objects.filter(
            game=note_ninja,
            prompt=target_prompt,
        ).update(is_active=False)

    music_question = GameQuestion.objects.filter(
        game=music_challenge,
        prompt=target_prompt,
    ).order_by('id').first()

    if music_question:
        music_question.level = 2
        music_question.question_payload = {'category': 'theory'}
        music_question.choices = target_choices
        music_question.correct_answer = 'FACE'
        music_question.time_limit_seconds = max(8, int(music_question.time_limit_seconds or 0))
        music_question.points = max(10, int(music_question.points or 0))
        music_question.is_active = True
        music_question.save(update_fields=[
            'level',
            'question_payload',
            'choices',
            'correct_answer',
            'time_limit_seconds',
            'points',
            'is_active',
        ])
    else:
        GameQuestion.objects.create(
            game=music_challenge,
            level=2,
            prompt=target_prompt,
            question_payload={'category': 'theory'},
            choices=target_choices,
            correct_answer='FACE',
            time_limit_seconds=8,
            points=10,
            is_active=True,
            order=999,
        )

    music_questions = list(GameQuestion.objects.filter(game=music_challenge))
    to_update = []
    for question in music_questions:
        min_limit = 8 if int(question.level or 1) <= 10 else 7
        existing_limit = int(question.time_limit_seconds or 0)
        if existing_limit < min_limit:
            question.time_limit_seconds = min_limit
            to_update.append(question)

    if to_update:
        GameQuestion.objects.bulk_update(to_update, ['time_limit_seconds'])


def backwards(apps, schema_editor):
    # Intentionally no-op: keep corrected distribution and safer timer values.
    return


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0091_expand_game_max_level_to_20'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
