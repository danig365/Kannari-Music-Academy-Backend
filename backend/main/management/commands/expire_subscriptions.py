import datetime
from django.core.management.base import BaseCommand
from main.models import Subscription, SubscriptionHistory


class Command(BaseCommand):
    help = 'Mark subscriptions as expired when their end_date has passed and no active Stripe subscription is managing them.'

    def handle(self, *args, **options):
        today = datetime.date.today()

        # Only target local subscriptions whose end_date has passed.
        # Stripe-managed ones (stripe_subscription_id set) are handled by webhooks,
        # but we include them as a safety net in case a webhook was missed.
        overdue = Subscription.objects.filter(status='active', end_date__lt=today)
        count = overdue.count()

        if count == 0:
            self.stdout.write('No overdue subscriptions found.')
            return

        self.stdout.write(f'Expiring {count} overdue subscription(s)...')
        for sub in overdue:
            old_status = sub.status
            sub.status = 'expired'
            sub.save()
            SubscriptionHistory.objects.create(
                subscription=sub,
                action='cancelled',
                old_status=old_status,
                new_status='expired',
                changed_by='system',
                notes='Auto-expired by expire_subscriptions management command: end_date passed.',
            )
            self.stdout.write(f'  Expired: {sub.student.fullname} | {sub.plan.name if sub.plan else "N/A"} | ended {sub.end_date}')

        self.stdout.write(self.style.SUCCESS(f'Done. {count} subscription(s) expired.'))
