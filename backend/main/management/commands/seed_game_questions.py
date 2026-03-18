"""
Management command: seed_game_questions
Populates GameQuestion rows for Note Ninja, Rhythm Rush, and 5-Second Music Challenge.
Run: python manage.py seed_game_questions
"""
from django.core.management.base import BaseCommand
from main.models import GameDefinition, GameQuestion


class Command(BaseCommand):
    help = 'Seed game questions for all three Phase-1 games (Note Ninja, Rhythm Rush, Music Challenge)'

    def handle(self, *args, **options):
        GameDefinition.objects.filter(
            game_type__in=['note_ninja', 'rhythm_rush', 'music_challenge'],
            max_level__lt=20
        ).update(max_level=20)

        self._seed_note_ninja()
        self._seed_rhythm_rush()
        self._seed_music_challenge()
        total = GameQuestion.objects.count()
        self.stdout.write(self.style.SUCCESS(f'Done. Total GameQuestion rows: {total}'))

    # ------------------------------------------------------------------
    # NOTE NINJA  (treble clef L1-5, bass clef L6-8, mixed L9-10)
    # ------------------------------------------------------------------
    def _seed_note_ninja(self):
        game = GameDefinition.objects.filter(game_type='note_ninja').first()
        if not game:
            self.stdout.write(self.style.WARNING('note_ninja GameDefinition not found – skipping'))
            return

        questions = [
            # ===== LEVEL 1 – Treble Clef: Lines (E G B D F) =====
            {'level': 1, 'prompt': 'Identify the note on the first line of the treble clef',
             'question_payload': {'clef': 'treble', 'position': 'line_1', 'note': 'E4', 'staff_description': 'Note sitting on the bottom (first) line of the treble staff'},
             'choices': ['E', 'F', 'D', 'G'], 'correct_answer': 'E', 'time_limit_seconds': 8, 'points': 10},
            {'level': 1, 'prompt': 'Identify the note on the second line of the treble clef',
             'question_payload': {'clef': 'treble', 'position': 'line_2', 'note': 'G4'},
             'choices': ['A', 'G', 'F', 'B'], 'correct_answer': 'G', 'time_limit_seconds': 8, 'points': 10},
            {'level': 1, 'prompt': 'Identify the note on the third line of the treble clef',
             'question_payload': {'clef': 'treble', 'position': 'line_3', 'note': 'B4'},
             'choices': ['B', 'C', 'A', 'D'], 'correct_answer': 'B', 'time_limit_seconds': 8, 'points': 10},
            {'level': 1, 'prompt': 'Identify the note on the fourth line of the treble clef',
             'question_payload': {'clef': 'treble', 'position': 'line_4', 'note': 'D5'},
             'choices': ['C', 'E', 'D', 'B'], 'correct_answer': 'D', 'time_limit_seconds': 8, 'points': 10},
            {'level': 1, 'prompt': 'Identify the note on the fifth line of the treble clef',
             'question_payload': {'clef': 'treble', 'position': 'line_5', 'note': 'F5'},
             'choices': ['F', 'G', 'E', 'A'], 'correct_answer': 'F', 'time_limit_seconds': 8, 'points': 10},
            {'level': 1, 'prompt': 'Which note sits on the bottom line of the treble clef?',
             'question_payload': {'clef': 'treble', 'position': 'line_1', 'note': 'E4'},
             'choices': ['D', 'E', 'F', 'C'], 'correct_answer': 'E', 'time_limit_seconds': 8, 'points': 10},

            # ===== LEVEL 2 – Treble Clef: Spaces (F A C E) =====
            {'level': 2, 'prompt': 'Identify the note in the first space of the treble clef',
             'question_payload': {'clef': 'treble', 'position': 'space_1', 'note': 'F4'},
             'choices': ['F', 'E', 'G', 'A'], 'correct_answer': 'F', 'time_limit_seconds': 8, 'points': 10},
            {'level': 2, 'prompt': 'Identify the note in the second space of the treble clef',
             'question_payload': {'clef': 'treble', 'position': 'space_2', 'note': 'A4'},
             'choices': ['G', 'A', 'B', 'C'], 'correct_answer': 'A', 'time_limit_seconds': 8, 'points': 10},
            {'level': 2, 'prompt': 'Identify the note in the third space of the treble clef',
             'question_payload': {'clef': 'treble', 'position': 'space_3', 'note': 'C5'},
             'choices': ['C', 'D', 'B', 'E'], 'correct_answer': 'C', 'time_limit_seconds': 8, 'points': 10},
            {'level': 2, 'prompt': 'Identify the note in the fourth space of the treble clef',
             'question_payload': {'clef': 'treble', 'position': 'space_4', 'note': 'E5'},
             'choices': ['D', 'F', 'E', 'G'], 'correct_answer': 'E', 'time_limit_seconds': 8, 'points': 10},
            {'level': 2, 'prompt': 'Which note sits between the second and third lines of the treble clef?',
             'question_payload': {'clef': 'treble', 'position': 'space_2', 'note': 'A4'},
             'choices': ['A', 'B', 'G', 'C'], 'correct_answer': 'A', 'time_limit_seconds': 8, 'points': 10},

            # ===== LEVEL 3 – Treble Clef: Mixed lines & spaces =====
            {'level': 3, 'prompt': 'Name this treble clef note: it is on the third line',
             'question_payload': {'clef': 'treble', 'position': 'line_3', 'note': 'B4'},
             'choices': ['A', 'B', 'C', 'D'], 'correct_answer': 'B', 'time_limit_seconds': 7, 'points': 12},
            {'level': 3, 'prompt': 'Name this treble clef note: it is in the first space',
             'question_payload': {'clef': 'treble', 'position': 'space_1', 'note': 'F4'},
             'choices': ['E', 'F', 'G', 'A'], 'correct_answer': 'F', 'time_limit_seconds': 7, 'points': 12},
            {'level': 3, 'prompt': 'Name this treble clef note: it is on the second line',
             'question_payload': {'clef': 'treble', 'position': 'line_2', 'note': 'G4'},
             'choices': ['G', 'A', 'F', 'E'], 'correct_answer': 'G', 'time_limit_seconds': 7, 'points': 12},
            {'level': 3, 'prompt': 'Name this treble clef note: it is in the third space',
             'question_payload': {'clef': 'treble', 'position': 'space_3', 'note': 'C5'},
             'choices': ['D', 'C', 'B', 'A'], 'correct_answer': 'C', 'time_limit_seconds': 7, 'points': 12},
            {'level': 3, 'prompt': 'Name this treble clef note: it is on the fourth line',
             'question_payload': {'clef': 'treble', 'position': 'line_4', 'note': 'D5'},
             'choices': ['D', 'E', 'C', 'F'], 'correct_answer': 'D', 'time_limit_seconds': 7, 'points': 12},
            {'level': 3, 'prompt': 'Name this treble clef note: it is in the fourth space',
             'question_payload': {'clef': 'treble', 'position': 'space_4', 'note': 'E5'},
             'choices': ['E', 'D', 'F', 'C'], 'correct_answer': 'E', 'time_limit_seconds': 7, 'points': 12},

            # ===== LEVEL 4 – Treble Clef: Ledger lines (Middle C, D below staff, A/B above) =====
            {'level': 4, 'prompt': 'Identify the note on the first ledger line below the treble staff',
             'question_payload': {'clef': 'treble', 'position': 'ledger_below_1', 'note': 'C4', 'staff_description': 'Note on one ledger line below the staff – Middle C'},
             'choices': ['C', 'B', 'D', 'E'], 'correct_answer': 'C', 'time_limit_seconds': 7, 'points': 14},
            {'level': 4, 'prompt': 'Identify the note just below the first line of the treble staff (space below)',
             'question_payload': {'clef': 'treble', 'position': 'space_below_1', 'note': 'D4'},
             'choices': ['D', 'C', 'E', 'B'], 'correct_answer': 'D', 'time_limit_seconds': 7, 'points': 14},
            {'level': 4, 'prompt': 'Identify the note on the first ledger line above the treble staff',
             'question_payload': {'clef': 'treble', 'position': 'ledger_above_1', 'note': 'A5'},
             'choices': ['A', 'G', 'B', 'C'], 'correct_answer': 'A', 'time_limit_seconds': 7, 'points': 14},
            {'level': 4, 'prompt': 'Identify the note in the space just above the fifth line of the treble staff',
             'question_payload': {'clef': 'treble', 'position': 'space_above_1', 'note': 'G5'},
             'choices': ['G', 'F', 'A', 'E'], 'correct_answer': 'G', 'time_limit_seconds': 7, 'points': 14},
            {'level': 4, 'prompt': 'What note is Middle C in the treble clef?',
             'question_payload': {'clef': 'treble', 'position': 'ledger_below_1', 'note': 'C4'},
             'choices': ['C', 'D', 'B', 'E'], 'correct_answer': 'C', 'time_limit_seconds': 7, 'points': 14},

            # ===== LEVEL 5 – Treble Clef: Speed round (shorter timer) =====
            {'level': 5, 'prompt': 'Quick! Which note is on line 1 of treble clef?',
             'question_payload': {'clef': 'treble', 'position': 'line_1', 'note': 'E4'},
             'choices': ['E', 'F', 'D', 'G'], 'correct_answer': 'E', 'time_limit_seconds': 5, 'points': 16},
            {'level': 5, 'prompt': 'Quick! Which note is in space 2 of treble clef?',
             'question_payload': {'clef': 'treble', 'position': 'space_2', 'note': 'A4'},
             'choices': ['A', 'B', 'G', 'C'], 'correct_answer': 'A', 'time_limit_seconds': 5, 'points': 16},
            {'level': 5, 'prompt': 'Quick! Which note is on line 5 of treble clef?',
             'question_payload': {'clef': 'treble', 'position': 'line_5', 'note': 'F5'},
             'choices': ['F', 'E', 'G', 'D'], 'correct_answer': 'F', 'time_limit_seconds': 5, 'points': 16},
            {'level': 5, 'prompt': 'Quick! Which note is in space 3 of treble clef?',
             'question_payload': {'clef': 'treble', 'position': 'space_3', 'note': 'C5'},
             'choices': ['C', 'D', 'B', 'A'], 'correct_answer': 'C', 'time_limit_seconds': 5, 'points': 16},
            {'level': 5, 'prompt': 'Quick! Ledger line below treble staff — what note?',
             'question_payload': {'clef': 'treble', 'position': 'ledger_below_1', 'note': 'C4'},
             'choices': ['C', 'D', 'B', 'E'], 'correct_answer': 'C', 'time_limit_seconds': 5, 'points': 16},
            {'level': 5, 'prompt': 'Quick! Which note is on line 3 of treble clef?',
             'question_payload': {'clef': 'treble', 'position': 'line_3', 'note': 'B4'},
             'choices': ['B', 'A', 'C', 'D'], 'correct_answer': 'B', 'time_limit_seconds': 5, 'points': 16},

            # ===== LEVEL 6 – Bass Clef: Lines (G B D F A) =====
            {'level': 6, 'prompt': 'Identify the note on the first line of the bass clef',
             'question_payload': {'clef': 'bass', 'position': 'line_1', 'note': 'G2'},
             'choices': ['G', 'A', 'F', 'E'], 'correct_answer': 'G', 'time_limit_seconds': 8, 'points': 14},
            {'level': 6, 'prompt': 'Identify the note on the second line of the bass clef',
             'question_payload': {'clef': 'bass', 'position': 'line_2', 'note': 'B2'},
             'choices': ['B', 'C', 'A', 'D'], 'correct_answer': 'B', 'time_limit_seconds': 8, 'points': 14},
            {'level': 6, 'prompt': 'Identify the note on the third line of the bass clef',
             'question_payload': {'clef': 'bass', 'position': 'line_3', 'note': 'D3'},
             'choices': ['D', 'E', 'C', 'F'], 'correct_answer': 'D', 'time_limit_seconds': 8, 'points': 14},
            {'level': 6, 'prompt': 'Identify the note on the fourth line of the bass clef',
             'question_payload': {'clef': 'bass', 'position': 'line_4', 'note': 'F3'},
             'choices': ['F', 'G', 'E', 'D'], 'correct_answer': 'F', 'time_limit_seconds': 8, 'points': 14},
            {'level': 6, 'prompt': 'Identify the note on the fifth line of the bass clef',
             'question_payload': {'clef': 'bass', 'position': 'line_5', 'note': 'A3'},
             'choices': ['A', 'B', 'G', 'C'], 'correct_answer': 'A', 'time_limit_seconds': 8, 'points': 14},
            {'level': 6, 'prompt': 'The mnemonic for bass clef lines is "Good Boys Do Fine Always." What is the first note?',
             'question_payload': {'clef': 'bass', 'position': 'line_1', 'note': 'G2'},
             'choices': ['G', 'B', 'D', 'F'], 'correct_answer': 'G', 'time_limit_seconds': 8, 'points': 14},

            # ===== LEVEL 7 – Bass Clef: Spaces (A C E G) =====
            {'level': 7, 'prompt': 'Identify the note in the first space of the bass clef',
             'question_payload': {'clef': 'bass', 'position': 'space_1', 'note': 'A2'},
             'choices': ['A', 'B', 'G', 'C'], 'correct_answer': 'A', 'time_limit_seconds': 7, 'points': 16},
            {'level': 7, 'prompt': 'Identify the note in the second space of the bass clef',
             'question_payload': {'clef': 'bass', 'position': 'space_2', 'note': 'C3'},
             'choices': ['C', 'D', 'B', 'E'], 'correct_answer': 'C', 'time_limit_seconds': 7, 'points': 16},
            {'level': 7, 'prompt': 'Identify the note in the third space of the bass clef',
             'question_payload': {'clef': 'bass', 'position': 'space_3', 'note': 'E3'},
             'choices': ['E', 'F', 'D', 'G'], 'correct_answer': 'E', 'time_limit_seconds': 7, 'points': 16},
            {'level': 7, 'prompt': 'Identify the note in the fourth space of the bass clef',
             'question_payload': {'clef': 'bass', 'position': 'space_4', 'note': 'G3'},
             'choices': ['G', 'A', 'F', 'B'], 'correct_answer': 'G', 'time_limit_seconds': 7, 'points': 16},
            {'level': 7, 'prompt': 'The mnemonic for bass clef spaces is "All Cows Eat Grass." What is the third note?',
             'question_payload': {'clef': 'bass', 'position': 'space_3', 'note': 'E3'},
             'choices': ['E', 'C', 'G', 'A'], 'correct_answer': 'E', 'time_limit_seconds': 7, 'points': 16},
            {'level': 7, 'prompt': 'Which note sits in the space between lines 3 and 4 of bass clef?',
             'question_payload': {'clef': 'bass', 'position': 'space_3', 'note': 'E3'},
             'choices': ['E', 'F', 'D', 'C'], 'correct_answer': 'E', 'time_limit_seconds': 7, 'points': 16},

            # ===== LEVEL 8 – Bass Clef: Mixed lines & spaces + ledger lines =====
            {'level': 8, 'prompt': 'Identify the note on the first ledger line above the bass staff',
             'question_payload': {'clef': 'bass', 'position': 'ledger_above_1', 'note': 'C4', 'staff_description': 'Middle C on a ledger line above bass staff'},
             'choices': ['C', 'B', 'D', 'A'], 'correct_answer': 'C', 'time_limit_seconds': 7, 'points': 18},
            {'level': 8, 'prompt': 'Name this bass clef note: it is on the fourth line',
             'question_payload': {'clef': 'bass', 'position': 'line_4', 'note': 'F3'},
             'choices': ['F', 'E', 'G', 'D'], 'correct_answer': 'F', 'time_limit_seconds': 7, 'points': 18},
            {'level': 8, 'prompt': 'Name this bass clef note: it is in the second space',
             'question_payload': {'clef': 'bass', 'position': 'space_2', 'note': 'C3'},
             'choices': ['C', 'D', 'B', 'E'], 'correct_answer': 'C', 'time_limit_seconds': 7, 'points': 18},
            {'level': 8, 'prompt': 'What note is Middle C in the bass clef?',
             'question_payload': {'clef': 'bass', 'position': 'ledger_above_1', 'note': 'C4'},
             'choices': ['C', 'D', 'B', 'A'], 'correct_answer': 'C', 'time_limit_seconds': 7, 'points': 18},
            {'level': 8, 'prompt': 'Identify the note just below the first line of the bass staff',
             'question_payload': {'clef': 'bass', 'position': 'ledger_below_1', 'note': 'F2'},
             'choices': ['F', 'E', 'G', 'D'], 'correct_answer': 'F', 'time_limit_seconds': 7, 'points': 18},

            # ===== LEVEL 9 – Mixed Clef: Treble & Bass =====
            {'level': 9, 'prompt': 'Treble clef, line 2 — which note?',
             'question_payload': {'clef': 'treble', 'position': 'line_2', 'note': 'G4'},
             'choices': ['G', 'A', 'F', 'B'], 'correct_answer': 'G', 'time_limit_seconds': 6, 'points': 20},
            {'level': 9, 'prompt': 'Bass clef, space 4 — which note?',
             'question_payload': {'clef': 'bass', 'position': 'space_4', 'note': 'G3'},
             'choices': ['G', 'F', 'A', 'E'], 'correct_answer': 'G', 'time_limit_seconds': 6, 'points': 20},
            {'level': 9, 'prompt': 'Treble clef, space 1 — which note?',
             'question_payload': {'clef': 'treble', 'position': 'space_1', 'note': 'F4'},
             'choices': ['F', 'E', 'G', 'D'], 'correct_answer': 'F', 'time_limit_seconds': 6, 'points': 20},
            {'level': 9, 'prompt': 'Bass clef, line 3 — which note?',
             'question_payload': {'clef': 'bass', 'position': 'line_3', 'note': 'D3'},
             'choices': ['D', 'C', 'E', 'F'], 'correct_answer': 'D', 'time_limit_seconds': 6, 'points': 20},
            {'level': 9, 'prompt': 'Treble clef, ledger line below — which note?',
             'question_payload': {'clef': 'treble', 'position': 'ledger_below_1', 'note': 'C4'},
             'choices': ['C', 'B', 'D', 'E'], 'correct_answer': 'C', 'time_limit_seconds': 6, 'points': 20},
            {'level': 9, 'prompt': 'Bass clef, ledger line above — which note?',
             'question_payload': {'clef': 'bass', 'position': 'ledger_above_1', 'note': 'C4'},
             'choices': ['C', 'D', 'B', 'A'], 'correct_answer': 'C', 'time_limit_seconds': 6, 'points': 20},

            # ===== LEVEL 10 – Expert: Rapid-fire mixed clef =====
            {'level': 10, 'prompt': 'Expert! Treble line 4?',
             'question_payload': {'clef': 'treble', 'position': 'line_4', 'note': 'D5'},
             'choices': ['D', 'E', 'C', 'F'], 'correct_answer': 'D', 'time_limit_seconds': 5, 'points': 24},
            {'level': 10, 'prompt': 'Expert! Bass space 1?',
             'question_payload': {'clef': 'bass', 'position': 'space_1', 'note': 'A2'},
             'choices': ['A', 'B', 'G', 'C'], 'correct_answer': 'A', 'time_limit_seconds': 5, 'points': 24},
            {'level': 10, 'prompt': 'Expert! Treble space 4?',
             'question_payload': {'clef': 'treble', 'position': 'space_4', 'note': 'E5'},
             'choices': ['E', 'D', 'F', 'C'], 'correct_answer': 'E', 'time_limit_seconds': 5, 'points': 24},
            {'level': 10, 'prompt': 'Expert! Bass line 5?',
             'question_payload': {'clef': 'bass', 'position': 'line_5', 'note': 'A3'},
             'choices': ['A', 'G', 'B', 'F'], 'correct_answer': 'A', 'time_limit_seconds': 5, 'points': 24},
            {'level': 10, 'prompt': 'Expert! Bass ledger above?',
             'question_payload': {'clef': 'bass', 'position': 'ledger_above_1', 'note': 'C4'},
             'choices': ['C', 'B', 'D', 'E'], 'correct_answer': 'C', 'time_limit_seconds': 5, 'points': 24},
            {'level': 10, 'prompt': 'Expert! Treble line 1?',
             'question_payload': {'clef': 'treble', 'position': 'line_1', 'note': 'E4'},
             'choices': ['E', 'F', 'D', 'G'], 'correct_answer': 'E', 'time_limit_seconds': 5, 'points': 24},
        ]

        GameQuestion.objects.filter(
            game=game,
            prompt='The spaces of the treble clef spell which word?'
        ).delete()

        questions = self._extend_note_ninja_levels(questions)
        created = self._bulk_create(game, questions)
        self.stdout.write(f'  Note Ninja: {created} questions created')

    # ------------------------------------------------------------------
    # RHYTHM RUSH  (patterns stored as expected_timestamps in payload)
    # ------------------------------------------------------------------
    def _seed_rhythm_rush(self):
        game = GameDefinition.objects.filter(game_type='rhythm_rush').first()
        if not game:
            self.stdout.write(self.style.WARNING('rhythm_rush GameDefinition not found – skipping'))
            return

        questions = [
            # LEVEL 1 – Simple quarter notes at 60 BPM (1000ms apart)
            {'level': 1, 'prompt': 'Tap 4 quarter notes at 60 BPM',
             'question_payload': {'bpm': 60, 'time_signature': '4/4', 'note_types': ['quarter', 'quarter', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 1000, 2000, 3000], 'tolerance_ms': 150,
                                  'description': 'Four steady quarter notes, one per second'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 10, 'points': 10},
            {'level': 1, 'prompt': 'Tap 3 quarter notes at 60 BPM',
             'question_payload': {'bpm': 60, 'time_signature': '3/4', 'note_types': ['quarter', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 1000, 2000], 'tolerance_ms': 150,
                                  'description': 'Three steady quarter notes'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 8, 'points': 10},
            {'level': 1, 'prompt': 'Tap 4 quarter notes evenly',
             'question_payload': {'bpm': 60, 'time_signature': '4/4', 'note_types': ['quarter', 'quarter', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 1000, 2000, 3000], 'tolerance_ms': 160,
                                  'description': 'Keep a steady beat'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 10, 'points': 10},

            # LEVEL 2 – Quarter notes at 80 BPM (750ms)
            {'level': 2, 'prompt': 'Tap 4 quarter notes at 80 BPM',
             'question_payload': {'bpm': 80, 'time_signature': '4/4', 'note_types': ['quarter', 'quarter', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 750, 1500, 2250], 'tolerance_ms': 140,
                                  'description': 'Slightly faster quarter notes'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 8, 'points': 12},
            {'level': 2, 'prompt': 'Tap 4 quarter notes at a moderately fast tempo',
             'question_payload': {'bpm': 80, 'time_signature': '4/4', 'note_types': ['quarter', 'quarter', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 750, 1500, 2250], 'tolerance_ms': 140,
                                  'description': 'Steady beat at 80 BPM'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 8, 'points': 12},
            {'level': 2, 'prompt': 'Tap 3 quarter notes at 80 BPM',
             'question_payload': {'bpm': 80, 'time_signature': '3/4', 'note_types': ['quarter', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 750, 1500], 'tolerance_ms': 140,
                                  'description': 'Three beats at 80 BPM'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 6, 'points': 12},

            # LEVEL 3 – Quarter + eighth note combos at 80 BPM
            {'level': 3, 'prompt': 'Tap: quarter, two eighths, quarter',
             'question_payload': {'bpm': 80, 'time_signature': '4/4', 'note_types': ['quarter', 'eighth', 'eighth', 'quarter'],
                                  'expected_timestamps': [0, 750, 1125, 1500], 'tolerance_ms': 130,
                                  'description': 'Quarter note, two eighth notes, quarter note'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 8, 'points': 14},
            {'level': 3, 'prompt': 'Tap: two eighths, quarter, quarter',
             'question_payload': {'bpm': 80, 'time_signature': '4/4', 'note_types': ['eighth', 'eighth', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 375, 750, 1500], 'tolerance_ms': 130,
                                  'description': 'Two eighth notes then two quarter notes'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 8, 'points': 14},
            {'level': 3, 'prompt': 'Tap: quarter, quarter, two eighths',
             'question_payload': {'bpm': 80, 'time_signature': '4/4', 'note_types': ['quarter', 'quarter', 'eighth', 'eighth'],
                                  'expected_timestamps': [0, 750, 1500, 1875], 'tolerance_ms': 130,
                                  'description': 'Two quarter notes then two eighth notes'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 8, 'points': 14},

            # LEVEL 4 – 100 BPM with mixed values
            {'level': 4, 'prompt': 'Tap 4 quarter notes at 100 BPM',
             'question_payload': {'bpm': 100, 'time_signature': '4/4', 'note_types': ['quarter', 'quarter', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 600, 1200, 1800], 'tolerance_ms': 120,
                                  'description': 'Fast quarter notes at 100 BPM'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 7, 'points': 16},
            {'level': 4, 'prompt': 'Tap: quarter, two eighths, two eighths',
             'question_payload': {'bpm': 100, 'time_signature': '4/4', 'note_types': ['quarter', 'eighth', 'eighth', 'eighth', 'eighth'],
                                  'expected_timestamps': [0, 600, 900, 1200, 1500], 'tolerance_ms': 120,
                                  'description': 'Quarter then four eighth notes'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 7, 'points': 16},

            # LEVEL 5 – Dotted rhythms
            {'level': 5, 'prompt': 'Tap: dotted quarter, eighth, quarter, quarter',
             'question_payload': {'bpm': 80, 'time_signature': '4/4', 'note_types': ['dotted_quarter', 'eighth', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 1125, 1500, 2250], 'tolerance_ms': 120,
                                  'description': 'Dotted quarter note rhythm'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 8, 'points': 18},
            {'level': 5, 'prompt': 'Tap: quarter, dotted quarter, eighth',
             'question_payload': {'bpm': 80, 'time_signature': '3/4', 'note_types': ['quarter', 'dotted_quarter', 'eighth'],
                                  'expected_timestamps': [0, 750, 1875], 'tolerance_ms': 120,
                                  'description': 'Three-beat pattern with dotted quarter'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 8, 'points': 18},

            # LEVEL 6 – 120 BPM
            {'level': 6, 'prompt': 'Tap 4 quarter notes at 120 BPM',
             'question_payload': {'bpm': 120, 'time_signature': '4/4', 'note_types': ['quarter', 'quarter', 'quarter', 'quarter'],
                                  'expected_timestamps': [0, 500, 1000, 1500], 'tolerance_ms': 110,
                                  'description': 'Fast quarter notes'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 6, 'points': 18},
            {'level': 6, 'prompt': 'Tap: two eighths, quarter, two eighths at 120 BPM',
             'question_payload': {'bpm': 120, 'time_signature': '4/4', 'note_types': ['eighth', 'eighth', 'quarter', 'eighth', 'eighth'],
                                  'expected_timestamps': [0, 250, 500, 1000, 1250], 'tolerance_ms': 110,
                                  'description': 'Mixed rhythm at 120 BPM'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 6, 'points': 18},

            # LEVEL 7 – Syncopation
            {'level': 7, 'prompt': 'Tap syncopated pattern: eighth, quarter, eighth, quarter',
             'question_payload': {'bpm': 100, 'time_signature': '4/4', 'note_types': ['eighth', 'quarter', 'eighth', 'quarter'],
                                  'expected_timestamps': [0, 300, 900, 1200], 'tolerance_ms': 110,
                                  'description': 'Syncopated off-beat pattern'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 7, 'points': 20},
            {'level': 7, 'prompt': 'Tap: rest, eighth, quarter, eighth, quarter',
             'question_payload': {'bpm': 100, 'time_signature': '4/4', 'note_types': ['eighth_rest', 'eighth', 'quarter', 'eighth', 'quarter'],
                                  'expected_timestamps': [300, 900, 1200, 1800], 'tolerance_ms': 110,
                                  'description': 'Pattern starting on the off-beat'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 7, 'points': 20},

            # LEVEL 8 – Triplets
            {'level': 8, 'prompt': 'Tap a triplet followed by a quarter note (80 BPM)',
             'question_payload': {'bpm': 80, 'time_signature': '4/4', 'note_types': ['triplet', 'triplet', 'triplet', 'quarter'],
                                  'expected_timestamps': [0, 250, 500, 750], 'tolerance_ms': 110,
                                  'description': 'Three even taps then one longer'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 6, 'points': 22},
            {'level': 8, 'prompt': 'Tap two sets of triplets',
             'question_payload': {'bpm': 80, 'time_signature': '4/4', 'note_types': ['triplet', 'triplet', 'triplet', 'triplet', 'triplet', 'triplet'],
                                  'expected_timestamps': [0, 250, 500, 750, 1000, 1250], 'tolerance_ms': 110,
                                  'description': 'Six evenly spaced taps in triplet groupings'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 6, 'points': 22},

            # LEVEL 9 – 140 BPM complex
            {'level': 9, 'prompt': 'Tap: two eighths, quarter, two eighths, quarter at 140 BPM',
             'question_payload': {'bpm': 140, 'time_signature': '4/4', 'note_types': ['eighth', 'eighth', 'quarter', 'eighth', 'eighth', 'quarter'],
                                  'expected_timestamps': [0, 214, 428, 857, 1071, 1285], 'tolerance_ms': 100,
                                  'description': 'Complex fast rhythm'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 6, 'points': 24},

            # LEVEL 10 – Expert speed / complexity
            {'level': 10, 'prompt': 'Expert! Tap: sixteenth, sixteenth, eighth, quarter, two eighths at 100 BPM',
             'question_payload': {'bpm': 100, 'time_signature': '4/4', 'note_types': ['sixteenth', 'sixteenth', 'eighth', 'quarter', 'eighth', 'eighth'],
                                  'expected_timestamps': [0, 150, 300, 600, 1200, 1500], 'tolerance_ms': 100,
                                  'description': 'Complex expert pattern with sixteenth notes'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 6, 'points': 26},
            {'level': 10, 'prompt': 'Expert! Tap 8 eighth notes at 140 BPM',
             'question_payload': {'bpm': 140, 'time_signature': '4/4', 'note_types': ['eighth'] * 8,
                                  'expected_timestamps': [0, 214, 428, 643, 857, 1071, 1285, 1500], 'tolerance_ms': 100,
                                  'description': 'Eight fast eighth notes'},
             'choices': [], 'correct_answer': '', 'time_limit_seconds': 6, 'points': 26},
        ]

        questions = self._extend_rhythm_rush_levels(questions)
        created = self._bulk_create(game, questions)
        self.stdout.write(f'  Rhythm Rush: {created} questions created')

    # ------------------------------------------------------------------
    # MUSIC CHALLENGE  (music theory MCQ across 10 levels)
    # ------------------------------------------------------------------
    def _seed_music_challenge(self):
        game = GameDefinition.objects.filter(game_type='music_challenge').first()
        if not game:
            self.stdout.write(self.style.WARNING('music_challenge GameDefinition not found – skipping'))
            return

        questions = [
            # ===== LEVEL 1 – Basic instrument identification =====
            {'level': 1, 'prompt': 'Which of these is a woodwind instrument?',
             'question_payload': {'category': 'instruments'},
             'choices': ['Flute', 'Trumpet', 'Violin', 'Drum'], 'correct_answer': 'Flute', 'time_limit_seconds': 5, 'points': 10},
            {'level': 1, 'prompt': 'Which of these is a string instrument?',
             'question_payload': {'category': 'instruments'},
             'choices': ['Violin', 'Trombone', 'Clarinet', 'Snare Drum'], 'correct_answer': 'Violin', 'time_limit_seconds': 5, 'points': 10},
            {'level': 1, 'prompt': 'Which of these is a brass instrument?',
             'question_payload': {'category': 'instruments'},
             'choices': ['Trumpet', 'Cello', 'Oboe', 'Xylophone'], 'correct_answer': 'Trumpet', 'time_limit_seconds': 5, 'points': 10},
            {'level': 1, 'prompt': 'Which instrument uses a bow?',
             'question_payload': {'category': 'instruments'},
             'choices': ['Violin', 'Guitar', 'Piano', 'Flute'], 'correct_answer': 'Violin', 'time_limit_seconds': 5, 'points': 10},
            {'level': 1, 'prompt': 'Which instrument has keys and hammers inside?',
             'question_payload': {'category': 'instruments'},
             'choices': ['Piano', 'Organ', 'Accordion', 'Drum'], 'correct_answer': 'Piano', 'time_limit_seconds': 5, 'points': 10},
            {'level': 1, 'prompt': 'Which of these is a percussion instrument?',
             'question_payload': {'category': 'instruments'},
             'choices': ['Snare Drum', 'Saxophone', 'Viola', 'Tuba'], 'correct_answer': 'Snare Drum', 'time_limit_seconds': 5, 'points': 10},

            # ===== LEVEL 2 – Music symbols =====
            {'level': 2, 'prompt': 'What does "f" (forte) mean in music?',
             'question_payload': {'category': 'symbols'},
             'choices': ['Loud', 'Soft', 'Fast', 'Slow'], 'correct_answer': 'Loud', 'time_limit_seconds': 5, 'points': 10},
            {'level': 2, 'prompt': 'What does "p" (piano) mean in music?',
             'question_payload': {'category': 'symbols'},
             'choices': ['Soft', 'Loud', 'Medium', 'Silence'], 'correct_answer': 'Soft', 'time_limit_seconds': 5, 'points': 10},
            {'level': 2, 'prompt': 'What does a sharp (♯) do to a note?',
             'question_payload': {'category': 'symbols'},
             'choices': ['Raises it by a half step', 'Lowers it by a half step', 'Doubles it', 'Makes it louder'], 'correct_answer': 'Raises it by a half step', 'time_limit_seconds': 5, 'points': 10},
            {'level': 2, 'prompt': 'What does a flat (♭) do to a note?',
             'question_payload': {'category': 'symbols'},
             'choices': ['Lowers it by a half step', 'Raises it by a half step', 'Doubles its length', 'Makes it softer'], 'correct_answer': 'Lowers it by a half step', 'time_limit_seconds': 5, 'points': 10},
            {'level': 2, 'prompt': 'What symbol cancels a sharp or flat?',
             'question_payload': {'category': 'symbols'},
             'choices': ['Natural', 'Double sharp', 'Tie', 'Fermata'], 'correct_answer': 'Natural', 'time_limit_seconds': 5, 'points': 10},
            {'level': 2, 'prompt': 'What does "pp" (pianissimo) mean?',
             'question_payload': {'category': 'symbols'},
             'choices': ['Very soft', 'Very loud', 'Medium soft', 'Silence'], 'correct_answer': 'Very soft', 'time_limit_seconds': 5, 'points': 10},
            {'level': 2, 'prompt': 'The spaces of the treble clef spell which word?',
             'question_payload': {'category': 'theory'},
             'choices': ['FACE', 'FADE', 'CAFE', 'CAGE'], 'correct_answer': 'FACE', 'time_limit_seconds': 8, 'points': 10},

            # ===== LEVEL 3 – Rhythm values =====
            {'level': 3, 'prompt': 'How many beats does a whole note get in 4/4 time?',
             'question_payload': {'category': 'rhythm'},
             'choices': ['4', '2', '1', '3'], 'correct_answer': '4', 'time_limit_seconds': 5, 'points': 12},
            {'level': 3, 'prompt': 'How many beats does a half note get in 4/4 time?',
             'question_payload': {'category': 'rhythm'},
             'choices': ['2', '4', '1', '3'], 'correct_answer': '2', 'time_limit_seconds': 5, 'points': 12},
            {'level': 3, 'prompt': 'How many beats does a quarter note get in 4/4 time?',
             'question_payload': {'category': 'rhythm'},
             'choices': ['1', '2', '0.5', '4'], 'correct_answer': '1', 'time_limit_seconds': 5, 'points': 12},
            {'level': 3, 'prompt': 'How many eighth notes equal one quarter note?',
             'question_payload': {'category': 'rhythm'},
             'choices': ['2', '4', '1', '3'], 'correct_answer': '2', 'time_limit_seconds': 5, 'points': 12},
            {'level': 3, 'prompt': 'What does a dot after a note do?',
             'question_payload': {'category': 'rhythm'},
             'choices': ['Adds half its value', 'Doubles its value', 'Makes it staccato', 'Nothing'], 'correct_answer': 'Adds half its value', 'time_limit_seconds': 5, 'points': 12},
            {'level': 3, 'prompt': 'How many beats does a dotted half note get in 4/4?',
             'question_payload': {'category': 'rhythm'},
             'choices': ['3', '4', '2', '1.5'], 'correct_answer': '3', 'time_limit_seconds': 5, 'points': 12},

            # ===== LEVEL 4 – Basic theory =====
            {'level': 4, 'prompt': 'How many notes are in a major scale?',
             'question_payload': {'category': 'theory'},
             'choices': ['7', '8', '5', '12'], 'correct_answer': '7', 'time_limit_seconds': 5, 'points': 14},
            {'level': 4, 'prompt': 'What is the distance between two adjacent keys on a piano called?',
             'question_payload': {'category': 'theory'},
             'choices': ['Half step', 'Whole step', 'Octave', 'Fifth'], 'correct_answer': 'Half step', 'time_limit_seconds': 5, 'points': 14},
            {'level': 4, 'prompt': 'What is the first note of the C major scale?',
             'question_payload': {'category': 'theory'},
             'choices': ['C', 'D', 'G', 'A'], 'correct_answer': 'C', 'time_limit_seconds': 5, 'points': 14},
            {'level': 4, 'prompt': 'What is the top number in a time signature?',
             'question_payload': {'category': 'theory'},
             'choices': ['Beats per measure', 'Tempo', 'Key', 'Volume'], 'correct_answer': 'Beats per measure', 'time_limit_seconds': 5, 'points': 14},
            {'level': 4, 'prompt': 'What does "tempo" refer to?',
             'question_payload': {'category': 'theory'},
             'choices': ['Speed of the music', 'Volume', 'Pitch', 'Key signature'], 'correct_answer': 'Speed of the music', 'time_limit_seconds': 5, 'points': 14},

            # ===== LEVEL 5 – Composer recognition =====
            {'level': 5, 'prompt': 'Who composed "Für Elise"?',
             'question_payload': {'category': 'composers'},
             'choices': ['Beethoven', 'Mozart', 'Bach', 'Chopin'], 'correct_answer': 'Beethoven', 'time_limit_seconds': 5, 'points': 14},
            {'level': 5, 'prompt': 'Who composed "The Four Seasons"?',
             'question_payload': {'category': 'composers'},
             'choices': ['Vivaldi', 'Handel', 'Haydn', 'Brahms'], 'correct_answer': 'Vivaldi', 'time_limit_seconds': 5, 'points': 14},
            {'level': 5, 'prompt': 'Who composed "Moonlight Sonata"?',
             'question_payload': {'category': 'composers'},
             'choices': ['Beethoven', 'Debussy', 'Liszt', 'Schubert'], 'correct_answer': 'Beethoven', 'time_limit_seconds': 5, 'points': 14},
            {'level': 5, 'prompt': 'Who composed the "Hallelujah" chorus in Messiah?',
             'question_payload': {'category': 'composers'},
             'choices': ['Handel', 'Bach', 'Mozart', 'Vivaldi'], 'correct_answer': 'Handel', 'time_limit_seconds': 5, 'points': 14},
            {'level': 5, 'prompt': 'Who is known as the "Father of the Symphony"?',
             'question_payload': {'category': 'composers'},
             'choices': ['Haydn', 'Beethoven', 'Mozart', 'Brahms'], 'correct_answer': 'Haydn', 'time_limit_seconds': 5, 'points': 14},

            # ===== LEVEL 6 – Intermediate theory =====
            {'level': 6, 'prompt': 'What interval is C to G?',
             'question_payload': {'category': 'theory'},
             'choices': ['Perfect 5th', 'Perfect 4th', 'Major 3rd', 'Octave'], 'correct_answer': 'Perfect 5th', 'time_limit_seconds': 5, 'points': 16},
            {'level': 6, 'prompt': 'How many half steps in an octave?',
             'question_payload': {'category': 'theory'},
             'choices': ['12', '7', '8', '10'], 'correct_answer': '12', 'time_limit_seconds': 5, 'points': 16},
            {'level': 6, 'prompt': 'What scale uses only the black keys on a piano?',
             'question_payload': {'category': 'theory'},
             'choices': ['F♯ major pentatonic', 'C major', 'A minor', 'D major'], 'correct_answer': 'F♯ major pentatonic', 'time_limit_seconds': 5, 'points': 16},
            {'level': 6, 'prompt': 'What is the relative minor of C major?',
             'question_payload': {'category': 'theory'},
             'choices': ['A minor', 'D minor', 'E minor', 'G minor'], 'correct_answer': 'A minor', 'time_limit_seconds': 5, 'points': 16},
            {'level': 6, 'prompt': 'What does "allegro" mean?',
             'question_payload': {'category': 'theory'},
             'choices': ['Fast', 'Slow', 'Medium', 'Very fast'], 'correct_answer': 'Fast', 'time_limit_seconds': 5, 'points': 16},

            # ===== LEVEL 7 – Key signatures & scales =====
            {'level': 7, 'prompt': 'How many sharps in the key of G major?',
             'question_payload': {'category': 'theory'},
             'choices': ['1', '2', '0', '3'], 'correct_answer': '1', 'time_limit_seconds': 5, 'points': 18},
            {'level': 7, 'prompt': 'How many flats in the key of F major?',
             'question_payload': {'category': 'theory'},
             'choices': ['1', '2', '0', '3'], 'correct_answer': '1', 'time_limit_seconds': 5, 'points': 18},
            {'level': 7, 'prompt': 'What key has no sharps or flats?',
             'question_payload': {'category': 'theory'},
             'choices': ['C major', 'G major', 'D major', 'F major'], 'correct_answer': 'C major', 'time_limit_seconds': 5, 'points': 18},
            {'level': 7, 'prompt': 'What is the order of sharps in key signatures?',
             'question_payload': {'category': 'theory'},
             'choices': ['FCGDAEB', 'BEADGCF', 'ABCDEFG', 'GDAEBFC'], 'correct_answer': 'FCGDAEB', 'time_limit_seconds': 5, 'points': 18},
            {'level': 7, 'prompt': 'Which mode starts on the 6th degree of a major scale?',
             'question_payload': {'category': 'theory'},
             'choices': ['Aeolian', 'Dorian', 'Mixolydian', 'Phrygian'], 'correct_answer': 'Aeolian', 'time_limit_seconds': 5, 'points': 18},

            # ===== LEVEL 8 – Chords & harmony =====
            {'level': 8, 'prompt': 'What notes make up a C major chord?',
             'question_payload': {'category': 'theory'},
             'choices': ['C E G', 'C D G', 'C F A', 'C E A'], 'correct_answer': 'C E G', 'time_limit_seconds': 5, 'points': 20},
            {'level': 8, 'prompt': 'What type of chord is C E♭ G?',
             'question_payload': {'category': 'theory'},
             'choices': ['Minor', 'Major', 'Diminished', 'Augmented'], 'correct_answer': 'Minor', 'time_limit_seconds': 5, 'points': 20},
            {'level': 8, 'prompt': 'What type of chord is C E G♯?',
             'question_payload': {'category': 'theory'},
             'choices': ['Augmented', 'Major', 'Diminished', 'Minor'], 'correct_answer': 'Augmented', 'time_limit_seconds': 5, 'points': 20},
            {'level': 8, 'prompt': 'What is the V chord in the key of C major?',
             'question_payload': {'category': 'theory'},
             'choices': ['G major', 'F major', 'D minor', 'A minor'], 'correct_answer': 'G major', 'time_limit_seconds': 5, 'points': 20},
            {'level': 8, 'prompt': 'What chord progression is I–V–vi–IV?',
             'question_payload': {'category': 'theory'},
             'choices': ['Pop progression', 'Blues progression', 'Jazz turnaround', '12-bar blues'], 'correct_answer': 'Pop progression', 'time_limit_seconds': 5, 'points': 20},

            # ===== LEVEL 9 – Advanced theory =====
            {'level': 9, 'prompt': 'What is an enharmonic equivalent of C♯?',
             'question_payload': {'category': 'theory'},
             'choices': ['D♭', 'D', 'B♯', 'E♭'], 'correct_answer': 'D♭', 'time_limit_seconds': 5, 'points': 22},
            {'level': 9, 'prompt': 'What is a tritone?',
             'question_payload': {'category': 'theory'},
             'choices': ['An interval of 3 whole steps', 'An interval of 2 whole steps', 'A chord with 3 notes', 'A scale with 3 notes'], 'correct_answer': 'An interval of 3 whole steps', 'time_limit_seconds': 5, 'points': 22},
            {'level': 9, 'prompt': 'What is the circle of fifths used for?',
             'question_payload': {'category': 'theory'},
             'choices': ['Showing key relationships', 'Tuning instruments', 'Writing lyrics', 'Counting beats'], 'correct_answer': 'Showing key relationships', 'time_limit_seconds': 5, 'points': 22},
            {'level': 9, 'prompt': 'What does "sforzando" (sfz) mean?',
             'question_payload': {'category': 'symbols'},
             'choices': ['Sudden strong accent', 'Very soft', 'Gradually louder', 'Gradually softer'], 'correct_answer': 'Sudden strong accent', 'time_limit_seconds': 5, 'points': 22},
            {'level': 9, 'prompt': 'How many notes are in a chromatic scale?',
             'question_payload': {'category': 'theory'},
             'choices': ['12', '7', '8', '5'], 'correct_answer': '12', 'time_limit_seconds': 5, 'points': 22},

            # ===== LEVEL 10 – Expert round =====
            {'level': 10, 'prompt': 'What is the Neapolitan chord?',
             'question_payload': {'category': 'theory'},
             'choices': ['Major chord on ♭II', 'Minor chord on VII', 'Diminished chord on IV', 'Augmented chord on V'], 'correct_answer': 'Major chord on ♭II', 'time_limit_seconds': 5, 'points': 24},
            {'level': 10, 'prompt': 'What is a hemiola?',
             'question_payload': {'category': 'rhythm'},
             'choices': ['Rhythmic ratio of 3:2', 'A type of scale', 'A chord inversion', 'A clef type'], 'correct_answer': 'Rhythmic ratio of 3:2', 'time_limit_seconds': 5, 'points': 24},
            {'level': 10, 'prompt': 'In counterpoint, what is parallel motion?',
             'question_payload': {'category': 'theory'},
             'choices': ['Voices move in the same direction by same interval', 'Voices move in opposite directions', 'One voice stays the same', 'Voices cross'], 'correct_answer': 'Voices move in the same direction by same interval', 'time_limit_seconds': 5, 'points': 24},
            {'level': 10, 'prompt': 'What mode is often used in jazz for dominant 7th chords?',
             'question_payload': {'category': 'theory'},
             'choices': ['Mixolydian', 'Dorian', 'Lydian', 'Phrygian'], 'correct_answer': 'Mixolydian', 'time_limit_seconds': 5, 'points': 24},
            {'level': 10, 'prompt': 'What is meant by "enharmonic spelling"?',
             'question_payload': {'category': 'theory'},
             'choices': ['Same pitch, different note name', 'Same name, different pitch', 'A type of key change', 'A scale degree'], 'correct_answer': 'Same pitch, different note name', 'time_limit_seconds': 5, 'points': 24},
        ]

        for question in questions:
            base_time = int(question.get('time_limit_seconds', 5) or 5)
            question['time_limit_seconds'] = max(8, base_time)

        questions = self._extend_music_challenge_levels(questions)
        created = self._bulk_create(game, questions)
        self.stdout.write(f'  Music Challenge: {created} questions created')

    def _extend_note_ninja_levels(self, questions):
        advanced_templates = [q for q in questions if q['level'] in [9, 10]]
        generated = []
        for level in range(11, 21):
            for idx, template in enumerate(advanced_templates, start=1):
                payload = dict(template.get('question_payload', {}))
                payload['advanced_level'] = level
                payload['drill_index'] = idx

                generated.append({
                    **template,
                    'level': level,
                    'prompt': f"Lv{level} • {template['prompt']}",
                    'question_payload': payload,
                    'time_limit_seconds': max(3, int(template.get('time_limit_seconds', 5)) - (1 if level >= 15 else 0)),
                    'points': int(template.get('points', 10)) + ((level - 10) * 2),
                })
        return questions + generated

    def _extend_rhythm_rush_levels(self, questions):
        advanced_templates = [q for q in questions if q['level'] in [9, 10]]
        generated = []
        for level in range(11, 21):
            for idx, template in enumerate(advanced_templates, start=1):
                payload = dict(template.get('question_payload', {}))
                base_bpm = int(payload.get('bpm', 100) or 100)
                new_bpm = min(200, base_bpm + ((level - 10) * 4))
                scale = base_bpm / new_bpm if new_bpm > 0 else 1
                expected = payload.get('expected_timestamps', []) or []

                payload['bpm'] = new_bpm
                payload['advanced_level'] = level
                payload['drill_index'] = idx
                payload['expected_timestamps'] = [max(0, int(round(ts * scale))) for ts in expected]
                payload['tolerance_ms'] = max(80, int(payload.get('tolerance_ms', 120)) - ((level - 10) * 2))

                generated.append({
                    **template,
                    'level': level,
                    'prompt': f"Lv{level} • {template['prompt']}",
                    'question_payload': payload,
                    'time_limit_seconds': max(4, int(template.get('time_limit_seconds', 6)) - 1),
                    'points': int(template.get('points', 10)) + ((level - 10) * 2),
                })
        return questions + generated

    def _extend_music_challenge_levels(self, questions):
        advanced_templates = [q for q in questions if q['level'] in [9, 10]]
        generated = []
        for level in range(11, 21):
            for idx, template in enumerate(advanced_templates, start=1):
                payload = dict(template.get('question_payload', {}))
                payload['advanced_level'] = level
                payload['drill_index'] = idx

                generated.append({
                    **template,
                    'level': level,
                    'prompt': f"Lv{level} • {template['prompt']}",
                    'question_payload': payload,
                    'time_limit_seconds': max(7, int(template.get('time_limit_seconds', 8)) - (1 if level >= 16 else 0)),
                    'points': int(template.get('points', 10)) + ((level - 10) * 2),
                })
        return questions + generated

    # ------------------------------------------------------------------
    # Helper: bulk-insert questions, skip duplicates by (game, level, prompt)
    # ------------------------------------------------------------------
    def _bulk_create(self, game, questions):
        existing_map = {
            (row.level, row.prompt): row
            for row in GameQuestion.objects.filter(game=game)
        }
        to_create = []
        to_update = []
        for idx, q in enumerate(questions):
            key = (q['level'], q['prompt'])
            payload = q.get('question_payload', {})
            choices = q.get('choices', [])
            correct_answer = q.get('correct_answer', '')
            time_limit_seconds = q.get('time_limit_seconds', 5)
            points = q.get('points', 10)
            order = idx + 1

            existing_row = existing_map.get(key)
            if existing_row:
                changed = False
                if existing_row.question_payload != payload:
                    existing_row.question_payload = payload
                    changed = True
                if existing_row.choices != choices:
                    existing_row.choices = choices
                    changed = True
                if existing_row.correct_answer != correct_answer:
                    existing_row.correct_answer = correct_answer
                    changed = True
                if existing_row.time_limit_seconds != time_limit_seconds:
                    existing_row.time_limit_seconds = time_limit_seconds
                    changed = True
                if existing_row.points != points:
                    existing_row.points = points
                    changed = True
                if existing_row.order != order:
                    existing_row.order = order
                    changed = True
                if existing_row.is_active is not True:
                    existing_row.is_active = True
                    changed = True
                if changed:
                    to_update.append(existing_row)
                continue

            to_create.append(GameQuestion(
                game=game,
                level=q['level'],
                prompt=q['prompt'],
                question_payload=payload,
                choices=choices,
                correct_answer=correct_answer,
                time_limit_seconds=time_limit_seconds,
                points=points,
                is_active=True,
                order=order,
            ))

        if to_create:
            GameQuestion.objects.bulk_create(to_create)
        if to_update:
            GameQuestion.objects.bulk_update(
                to_update,
                ['question_payload', 'choices', 'correct_answer', 'time_limit_seconds', 'points', 'is_active', 'order']
            )
        return len(to_create)
