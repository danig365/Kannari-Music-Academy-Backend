"""
Find trialing Stripe subscriptions that have NO saved card and email those
students a link to add one before their trial ends and the first charge fails.

Dry-run by default. Use --send to actually email.

    python manage.py email_cardless_trials          # list affected students
    python manage.py email_cardless_trials --send    # send the emails
"""
import os
import stripe
from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from main import models


class Command(BaseCommand):
    help = 'Email students whose trialing subscription has no saved card.'

    def add_arguments(self, parser):
        parser.add_argument('--send', action='store_true', help='Actually send emails (dry-run by default)')
        parser.add_argument('--limit', type=int, default=100, help='Max Stripe subscriptions to scan')

    def handle(self, *args, **options):
        send = options['send']
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        if not stripe.api_key:
            self.stderr.write('STRIPE_SECRET_KEY not configured.')
            return

        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        update_link = f'{frontend_url}/student/update-payment'
        from_email = os.getenv('EMAIL_HOST_USER') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kannari.local')

        subs = stripe.Subscription.list(limit=options['limit'], status='trialing')
        affected = {}  # student_id -> Student

        for s in subs.data:
            sub_pm = getattr(s, 'default_payment_method', None)
            cust_pm = None
            try:
                c = stripe.Customer.retrieve(s.customer)
                inv = getattr(c, 'invoice_settings', None)
                cust_pm = getattr(inv, 'default_payment_method', None) if inv else None
            except Exception:
                pass
            if sub_pm or cust_pm:
                continue  # has a card — skip

            # Resolve the student: prefer subscription metadata, fall back to customer id.
            meta = getattr(s, 'metadata', None)
            student = None
            sid = getattr(meta, 'student_id', None) if meta else None
            if sid:
                student = models.Student.objects.filter(id=sid).first()
            if not student:
                student = models.Student.objects.filter(stripe_customer_id=s.customer).first()
            if student and student.email:
                affected[student.id] = student

        self.stdout.write(f'Found {len(affected)} student(s) with a card-less trial:')
        for st in affected.values():
            self.stdout.write(f'  - {st.fullname} <{st.email}> (id {st.id})')

        if not send:
            self.stdout.write(self.style.WARNING('\nDry-run. Re-run with --send to email them.'))
            return

        sent = 0
        for st in affected.values():
            subject = 'Action needed: add a card to keep your Kannari subscription active'
            message = (
                f"Hi {st.fullname},\n\n"
                f"Thanks for subscribing to Kannari Music Academy! Your first month is free, "
                f"and billing begins on the 1st.\n\n"
                f"We noticed we don't have a payment card saved for your account yet. To avoid "
                f"any interruption, please add your card here before the 1st:\n\n"
                f"{update_link}\n\n"
                f"It only takes a minute and you won't be charged today.\n\n"
                f"If you've already added a card, you can ignore this message.\n\n"
                f"Thank you,\nKannari Music Academy"
            )
            try:
                send_mail(subject, message, from_email, [st.email], fail_silently=False)
                sent += 1
                self.stdout.write(self.style.SUCCESS(f'  sent -> {st.email}'))
            except Exception as e:
                self.stderr.write(f'  FAILED -> {st.email}: {e}')

        self.stdout.write(self.style.SUCCESS(f'\nDone. {sent}/{len(affected)} emails sent.'))
