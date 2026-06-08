from django.core.management.base import BaseCommand, CommandError
from main import models


class Command(BaseCommand):
    help = 'Set modules_per_week on SubscriptionPlan records. Use --default N to set default for plans without a value.'

    def add_arguments(self, parser):
        parser.add_argument('--default', type=int, help='Default modules_per_week value to apply to eligible plans')
        parser.add_argument('--apply', action='store_true', help='Actually persist changes (dry-run by default)')
        parser.add_argument('--show', action='store_true', help='Show current plan values')

    def handle(self, *args, **options):
        default = options.get('default')
        apply_changes = options.get('apply')
        show = options.get('show')

        plans = models.SubscriptionPlan.objects.all()
        if show:
            self.stdout.write('Current SubscriptionPlan.modules_per_week values:')
            for p in plans:
                self.stdout.write(f'- [{p.id}] {p.name} ({p.access_level}): modules_per_week={p.modules_per_week}')
            return

        if default is None:
            raise CommandError('Please specify --default N (integer) or use --show to list plans')

        to_update = []
        for p in plans:
            # Skip unlimited access plans
            if p.access_level == 'unlimited':
                continue
            # Only update plans where modules_per_week is None
            if p.modules_per_week is None:
                to_update.append(p)

        if not to_update:
            self.stdout.write('No plans require updating.')
            return

        self.stdout.write(f'Plans to update to modules_per_week={default}:')
        for p in to_update:
            self.stdout.write(f'- [{p.id}] {p.name} ({p.access_level})')

        if not apply_changes:
            self.stdout.write('\nDry-run mode. Use --apply to persist changes.')
            return

        for p in to_update:
            p.modules_per_week = default
            p.save(update_fields=['modules_per_week'])
            self.stdout.write(f'Updated plan [{p.id}] {p.name} -> modules_per_week={default}')

        self.stdout.write('\nDone.')
