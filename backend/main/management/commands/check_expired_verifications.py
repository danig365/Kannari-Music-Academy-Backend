"""
Management command to check and expire teacher background verifications.

Run daily via cron:
    docker exec html-backend-1 python manage.py check_expired_verifications

Crontab example (every day at 2 AM):
    0 2 * * * docker exec html-backend-1 python manage.py check_expired_verifications >> /var/log/verification_expiry.log 2>&1
"""
from django.core.management.base import BaseCommand
from django.utils import timezone

from main import models


class Command(BaseCommand):
    help = 'Check and expire teacher background verifications that have passed their expiry date.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report what would be expired without making changes.',
        )
        parser.add_argument(
            '--warn-days',
            type=int,
            default=30,
            help='Also list verifications expiring within this many days (default: 30).',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        warn_days = options['warn_days']
        now = timezone.now()

        # 1. Auto-expire overdue background checks
        overdue = models.TeacherBackgroundCheck.objects.filter(
            status='approved',
            expires_at__lte=now,
        ).select_related('verification__teacher')

        expired_count = 0
        for bg in overdue:
            teacher = bg.verification.teacher
            self.stdout.write(
                f'EXPIRED: Teacher #{teacher.id} {teacher.full_name} — '
                f'background check expired {bg.expires_at.date()}'
            )
            if not dry_run:
                bg.status = 'expired'
                bg.save(update_fields=['status', 'updated_at'])
                bg.verification.background_check_status = 'expired'
                bg.verification.save(update_fields=['background_check_status', 'updated_at'])
                bg.verification.recalculate_status()
            expired_count += 1

        # 2. Warn about upcoming expirations
        import datetime
        warn_cutoff = now + datetime.timedelta(days=warn_days)
        upcoming = models.TeacherBackgroundCheck.objects.filter(
            status='approved',
            expires_at__gt=now,
            expires_at__lte=warn_cutoff,
        ).select_related('verification__teacher')

        warn_count = 0
        for bg in upcoming:
            teacher = bg.verification.teacher
            days_left = (bg.expires_at - now).days
            self.stdout.write(
                self.style.WARNING(
                    f'WARNING: Teacher #{teacher.id} {teacher.full_name} — '
                    f'background check expires in {days_left} days ({bg.expires_at.date()})'
                )
            )
            warn_count += 1

        # Summary
        prefix = '[DRY RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'\n{prefix}Done. Expired: {expired_count}. Expiring within {warn_days} days: {warn_count}.'
        ))
