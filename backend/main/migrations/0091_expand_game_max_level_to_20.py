from django.db import migrations, models


def expand_game_max_level(apps, schema_editor):
    GameDefinition = apps.get_model('main', 'GameDefinition')
    GameDefinition.objects.filter(max_level__lt=20).update(max_level=20)


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0090_phase1_games'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gamedefinition',
            name='max_level',
            field=models.PositiveIntegerField(default=20),
        ),
        migrations.RunPython(expand_game_max_level, migrations.RunPython.noop),
    ]
