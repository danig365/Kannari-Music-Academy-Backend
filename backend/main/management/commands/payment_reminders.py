"""
Daily payment reminder. Emails students whose subscription renews soon, and
sends admins a summary. Intended to be run once a day (see the `scheduler`
service in docker-compose).

    python manage.py payment_reminders            # dry-run (lists who would be emailed)
    python manage.py payment_reminders --send     # actually email
    python manage.py payment_reminders --days 3   # remind subs renewing in N days (default 3)
"""
import os
import datetime
import stripe
from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from main import models


class Command(BaseCommand):
    help = 'Email students whose subscription renews soon (and summarise for admins).'

    def add_arguments(self, parser):
        parser.add_argument('--send', action='store_true', help='Actually send (dry-run by default)')
        parser.add_argument('--days', type=int, default=3, help='Remind subscriptions renewing in exactly N days')

    def _has_card(self, customer_id):
        if not customer_id:
            return False
        try:
            c = stripe.Customer.retrieve(customer_id)
            inv = getattr(c, 'invoice_settings', None)
            return bool(getattr(inv, 'default_payment_method', None) if inv else None)
        except Exception:
            return False

    def handle(self, *args, **options):
        send = options['send']
        days = options['days']
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        from_email = os.getenv('EMAIL_HOST_USER') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kannari.local')

        target_date = datetime.date.today() + datetime.timedelta(days=days)
        subs = models.Subscription.objects.filter(
            status='active', end_date=target_date
        ).select_related('student', 'plan')

        reminders = []
        for sub in subs:
            student = sub.student
            if not student or not student.email:
                continue
            has_card = self._has_card(sub.stripe_customer_id) if stripe.api_key else True
            reminders.append((sub, has_card))

        self.stdout.write(f'{len(reminders)} student(s) renewing on {target_date}:')
        for sub, has_card in reminders:
            flag = '' if has_card else '  [NO CARD ON FILE]'
            self.stdout.write(f'  - {sub.student.fullname} <{sub.student.email}> ({sub.plan.name if sub.plan else "?"}){flag}')

        if not send:
            self.stdout.write(self.style.WARNING('\nDry-run. Re-run with --send to email.'))
            return

        sent = 0
        for sub, has_card in reminders:
            student = sub.student
            plan_name = sub.plan.name if sub.plan else 'your subscription'
            if has_card:
                body = (
                    f"Hi {student.fullname},\n\n"
                    f"This is a friendly reminder that your {plan_name} subscription renews on "
                    f"{sub.end_date}. Your saved card will be charged automatically — no action needed.\n\n"
                    f"Thank you,\nKannari Music Academy"
                )
            else:
                body = (
                    f"Hi {student.fullname},\n\n"
                    f"Your {plan_name} subscription renews on {sub.end_date}, but we don't have a "
                    f"payment card saved. Please add one to avoid any interruption:\n\n"
                    f"{frontend_url}/student/update-payment\n\n"
                    f"Thank you,\nKannari Music Academy"
                )
            try:
                send_mail(f'Your Kannari subscription renews on {sub.end_date}', body, from_email, [student.email], fail_silently=False)
                sent += 1
            except Exception as e:
                self.stderr.write(f'  FAILED -> {student.email}: {e}')

        # Admin summary
        admins = list(models.Admin.objects.filter(
            is_active=True, role__in=['super_admin', 'school_admin']
        ).values_list('email', flat=True))
        if not admins:
            admins = list(models.Admin.objects.filter(is_active=True).values_list('email', flat=True))
        admins = [e for e in admins if e]
        if admins and reminders:
            lines = [f"- {s.student.fullname} ({s.plan.name if s.plan else '?'})"
                     f"{'' if hc else ' — NO CARD ON FILE'}" for s, hc in reminders]
            send_mail(
                f'{len(reminders)} subscription(s) renewing on {target_date}',
                "Upcoming renewals:\n\n" + "\n".join(lines) +
                f"\n\nReview unpaid accounts: {frontend_url}/admin/subscriptions\n",
                from_email, admins, fail_silently=True,
            )

        self.stdout.write(self.style.SUCCESS(f'\nDone. {sent}/{len(reminders)} reminders sent.'))
