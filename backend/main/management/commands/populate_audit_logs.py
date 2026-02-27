import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from main.models import UploadLog, PaymentLog, AccessLog, Student, Teacher, Course, SubscriptionPlan
from faker import Faker

fake = Faker()

class Command(BaseCommand):
    help = 'Populate database with dummy audit log data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--uploads',
            type=int,
            default=20,
            help='Number of upload logs to create'
        )
        parser.add_argument(
            '--payments',
            type=int,
            default=15,
            help='Number of payment logs to create'
        )
        parser.add_argument(
            '--access',
            type=int,
            default=50,
            help='Number of access logs to create'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to populate audit logs...'))

        # Get or create some test users
        students = Student.objects.all()[:5]
        teachers = Teacher.objects.all()[:3]
        courses = Course.objects.all()[:3]
        plans = SubscriptionPlan.objects.all()[:2]

        if not students:
            self.stdout.write(self.style.WARNING('No students found in database'))
            return
        if not teachers:
            self.stdout.write(self.style.WARNING('No teachers found in database'))
            return

        # Create Upload Logs
        self.stdout.write('Creating upload logs...')
        upload_types = ['lesson_content', 'student_submission', 'profile_image', 'course_image', 'study_material']
        file_types = ['mp4', 'pdf', 'jpg', 'png', 'docx', 'mp3', 'webm']
        
        for i in range(options['uploads']):
            user = random.choice(students) if random.choice([True, False]) else None
            teacher = random.choice(teachers) if not user else None
            
            created_at = timezone.now() - timedelta(days=random.randint(0, 30))
            status = random.choice(['success', 'failed', 'pending'])
            
            upload_log = UploadLog.objects.create(
                student=user,
                teacher=teacher,
                file_name=f'test_file_{i}_{fake.file_name(extension=random.choice(file_types))}',
                file_type=random.choice(file_types),
                file_size=random.randint(1024, 10485760),  # 1KB to 10MB
                upload_type=random.choice(upload_types),
                status=status,
                error_message='File size too large' if status == 'failed' else None,
                file_path=f'/media/uploads/{i}/{fake.file_name()}',
                ip_address=fake.ipv4(),
                user_agent=fake.user_agent(),
                created_at=created_at,
                completed_at=created_at + timedelta(seconds=random.randint(1, 60)) if status == 'success' else None,
            )
            
            if (i + 1) % 5 == 0:
                self.stdout.write(f'  Created {i + 1} upload logs')

        self.stdout.write(self.style.SUCCESS(f'✓ Created {options["uploads"]} upload logs'))

        # Create Payment Logs
        self.stdout.write('Creating payment logs...')
        payment_types = ['subscription_purchase', 'plan_upgrade', 'plan_downgrade', 'renewal', 'refund']
        payment_methods = ['stripe', 'paypal', 'credit_card', 'debit_card']
        
        for i in range(options['payments']):
            student = random.choice(students)
            plan = random.choice(plans) if plans else None
            status = random.choice(['completed', 'failed', 'pending', 'refunded'])
            amount = random.randint(100, 5000)
            
            created_at = timezone.now() - timedelta(days=random.randint(0, 30))
            
            payment_log = PaymentLog.objects.create(
                student=student,
                subscription_plan=plan,
                transaction_id=f'TXN_{fake.uuid4()}',
                payment_type=random.choice(payment_types),
                status=status,
                payment_method=random.choice(payment_methods),
                amount=amount,
                tax_amount=amount * 0.18,  # 18% GST
                discount_amount=random.choice([0, 0, 0, amount * 0.05]),  # 5% discount occasionally
                final_amount=amount + (amount * 0.18) - (random.choice([0, 0, 0, amount * 0.05])),
                currency='INR',
                gateway_response={
                    'status': status,
                    'message': 'Payment processed successfully' if status == 'completed' else 'Payment failed',
                    'timestamp': created_at.isoformat(),
                    'processor': random.choice(payment_methods)
                },
                receipt_url=f'https://receipts.example.com/{fake.uuid4()}.pdf' if status == 'completed' else None,
                invoice_number=f'INV-2026-{i:05d}' if status == 'completed' else None,
                error_message='Insufficient funds' if status == 'failed' else None,
                error_code='E001' if status == 'failed' else None,
                user_email=student.email,
                user_ip_address=fake.ipv4(),
                created_at=created_at,
                completed_at=created_at + timedelta(seconds=random.randint(1, 30)) if status == 'completed' else None,
            )
            
            if (i + 1) % 5 == 0:
                self.stdout.write(f'  Created {i + 1} payment logs')

        self.stdout.write(self.style.SUCCESS(f'✓ Created {options["payments"]} payment logs'))

        # Create Access Logs
        self.stdout.write('Creating access logs...')
        access_types = ['course_view', 'lesson_view', 'course_enroll', 'course_unenroll', 'download_material', 'lesson_complete']
        denial_reasons = [
            'subscription_expired',
            'teacher_not_in_plan',
            'category_not_allowed',
            'insufficient_permissions',
            'content_locked',
            None  # Allowed
        ]
        
        for i in range(options['access']):
            student = random.choice(students)
            course = random.choice(courses) if courses else None
            
            access_type = random.choice(access_types)
            denial_reason = random.choice(denial_reasons)
            was_allowed = denial_reason is None
            
            created_at = timezone.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
            
            access_log = AccessLog.objects.create(
                student=student,
                access_type=access_type,
                course=course,
                was_allowed=was_allowed,
                denial_reason=denial_reason,
                duration_seconds=random.randint(0, 3600) if was_allowed else 0,
                ip_address=fake.ipv4(),
                user_agent=fake.user_agent(),
                created_at=created_at,
            )
            
            if (i + 1) % 10 == 0:
                self.stdout.write(f'  Created {i + 1} access logs')

        self.stdout.write(self.style.SUCCESS(f'✓ Created {options["access"]} access logs'))

        self.stdout.write(self.style.SUCCESS('\n✅ Successfully populated all audit logs!'))
        self.stdout.write(self.style.HTTP_SUCCESS('\nYou can now view the data in the Admin Audit Logs Dashboard'))
