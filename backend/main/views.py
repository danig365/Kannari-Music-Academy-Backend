from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from django.contrib.flatpages.models import FlatPage
from . serializers import TeacherSerializer,FlatPageSerializer,FaqSerializer,StudyMaterialSerializer,StudentDashboardSerializer,StudentFavoriteCourseSerializer,CategorySerializer,CourseSerializer,ChapterSerializer,StudentSerializer,StudentCourseEnrollSerializer,CourseRatingSerializer,TeacherDashboardSerializer,LessonDownloadableSerializer,ModuleLessonSerializer,SubscriptionPlanSerializer,SubscriptionSerializer,SubscriptionHistorySerializer
from rest_framework import permissions
from django.db.models import Q, Avg, Sum
from django.db import transaction
from . import models
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
import os
import uuid
import json


# ==================== AUDIT LOG HELPERS ====================

def _get_client_ip(request):
    """Extract client IP from request (handles proxies)"""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_upload(request, file, upload_type, content_type_str=None, object_id=None,
               status='success', error_message=None, admin=None, teacher=None, student=None):
    """Create an UploadLog entry. Call after a successful (or failed) file upload."""
    try:
        ext = os.path.splitext(file.name)[1].lower().lstrip('.') if file else ''
        models.UploadLog.objects.create(
            teacher=teacher,
            student=student,
            admin=admin,
            file_name=file.name if file else 'unknown',
            file_type=ext,
            file_size=file.size if file else 0,
            upload_type=upload_type,
            content_type=content_type_str,
            object_id=object_id,
            status=status,
            error_message=error_message,
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            completed_at=timezone.now() if status == 'success' else None,
        )
    except Exception as e:
        print(f"[AuditLog] Failed to create upload log: {e}")


def log_payment(student, subscription, plan, amount, payment_type='subscription_purchase',
                status='completed', payment_method='stripe', transaction_id=None,
                gateway_response=None, error_message=None, request=None):
    """Create a PaymentLog entry for subscription payments."""
    try:
        models.PaymentLog.objects.create(
            student=student,
            subscription=subscription,
            subscription_plan=plan,
            transaction_id=transaction_id or f"TXN-{uuid.uuid4().hex[:12].upper()}",
            payment_type=payment_type,
            status=status,
            payment_method=payment_method,
            amount=amount,
            currency='USD',
            tax_amount=0,
            discount_amount=0,
            final_amount=amount,
            gateway_response=gateway_response,
            error_message=error_message,
            user_email=student.email if student else None,
            user_ip_address=_get_client_ip(request) if request else None,
            completed_at=timezone.now() if status == 'completed' else None,
        )
    except Exception as e:
        print(f"[AuditLog] Failed to create payment log: {e}")


def log_access(request, access_type, was_allowed=True, denial_reason=None,
               course=None, lesson=None, subscription=None,
               admin=None, teacher=None, student=None, duration_seconds=None):
    """Create an AccessLog entry for course/lesson access events."""
    try:
        models.AccessLog.objects.create(
            teacher=teacher,
            student=student,
            admin=admin,
            access_type=access_type,
            course=course,
            lesson=lesson,
            subscription=subscription,
            was_allowed=was_allowed,
            denial_reason=denial_reason,
            duration_seconds=duration_seconds,
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        )
    except Exception as e:
        print(f"[AuditLog] Failed to create access log: {e}")


def log_activity(request, action, description, model_name=None, object_id=None,
                 admin=None, teacher=None, student=None):
    """Create an ActivityLog entry for any user action.
    
    action: login, logout, create, update, delete, view, export, import
    """
    try:
        models.ActivityLog.objects.create(
            admin=admin,
            teacher=teacher,
            student=student,
            action=action,
            model_name=model_name,
            object_id=object_id,
            description=description,
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        )
    except Exception as e:
        print(f"[ActivityLog] Failed to create activity log: {e}")

# ==================== END AUDIT LOG HELPERS ====================

class StandardResultSetPagination(PageNumberPagination):
    page_size=8
    page_size_query_param='page_size'
    max_page_size=1


VERIFICATION_SALT = 'kannari-email-verification'
VERIFICATION_MAX_AGE_SECONDS = 60 * 60 * 24 * 3  # 3 days
PASSWORD_RESET_SALT = 'kannari-password-reset'
PASSWORD_RESET_MAX_AGE_SECONDS = 60 * 60 * 2  # 2 hours
PARENTAL_CONSENT_SALT = 'kannari-parental-consent'
PARENTAL_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30  # 30 days


def _require_approved_teacher(teacher_id):
    teacher = models.Teacher.objects.filter(pk=teacher_id).first()
    if not teacher:
        return None, JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)
    if not teacher.is_approved:
        return None, JsonResponse({'bool': False, 'message': 'Your teacher account is pending admin approval.'}, status=403)
    return teacher, None


def _require_can_teach_minors(teacher, student):
    """Block if student is a minor and teacher isn't cleared to teach minors.
    Also triggers expiration re-check on the teacher's verification."""
    if not student.is_minor():
        return None  # no restriction
    # Re-check expiration on the fly
    verification = models.TeacherVerification.objects.filter(teacher=teacher).first()
    if verification:
        verification.recalculate_status()  # triggers _check_background_expiration
        teacher.refresh_from_db()
    if not teacher.can_teach_minors:
        reason = 'expired verification' if teacher.verification_status == 'expired' else 'incomplete verification'
        error_msg = (f'This teacher is not cleared to teach minor students ({reason}). '
                     f'Please complete or renew the child safety verification process.')
        return JsonResponse({
            'bool': False,
            'error': error_msg,
            'message': error_msg,
            'teacher_verification_status': teacher.verification_status,
        }, status=403)
    return None


def _build_email_verification_token(user_type, user_id, email):
    payload = {
        'user_type': user_type,
        'user_id': user_id,
        'email': email,
    }
    return signing.dumps(payload, salt=VERIFICATION_SALT)


def _send_verification_email(request, user_type, user_obj):
    try:
        token = _build_email_verification_token(user_type, user_obj.id, user_obj.email)
        if user_type == 'teacher':
            verify_path = reverse('verify-teacher-email')
            login_path = '/teacher-login'
            display_name = getattr(user_obj, 'full_name', 'Teacher')
        else:
            verify_path = reverse('verify-student-email')
            login_path = '/user-login'
            display_name = getattr(user_obj, 'fullname', 'Student')

        verify_url = request.build_absolute_uri(f"{verify_path}?token={token}")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        login_url = f"{frontend_url}{login_path}"

        subject = 'Verify your Kannari Music Academy account'
        message = (
            f"Hi {display_name},\n\n"
            f"Thank you for registering with Kannari Music Academy.\n"
            f"Please verify your email by clicking this link:\n\n"
            f"{verify_url}\n\n"
            f"After verification, you can log in here:\n"
            f"{login_url}\n\n"
            f"This link expires in 3 days.\n\n"
            f"If you did not create this account, you can ignore this email."
        )

        from_email = os.getenv('EMAIL_HOST_USER') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kannari.local')
        send_mail(subject, message, from_email, [user_obj.email], fail_silently=False)
        return True
    except Exception as e:
        print(f"[EmailVerification] Failed to send verification email to {user_obj.email}: {e}")
        return False


def _finalize_email_verification(token, expected_user_type):
    try:
        payload = signing.loads(token, salt=VERIFICATION_SALT, max_age=VERIFICATION_MAX_AGE_SECONDS)
    except signing.SignatureExpired:
        return None, 'Verification link expired. Please register again or request a new link.'
    except signing.BadSignature:
        return None, 'Invalid verification link.'

    if payload.get('user_type') != expected_user_type:
        return None, 'Verification link is not valid for this account type.'

    user_id = payload.get('user_id')
    email = payload.get('email')

    if expected_user_type == 'teacher':
        user_obj = models.Teacher.objects.filter(id=user_id, email=email).first()
        login_path = '/teacher-login'
    else:
        user_obj = models.Student.objects.filter(id=user_id, email=email).first()
        login_path = '/user-login'

    if not user_obj:
        return None, 'User not found for this verification link.'

    if not user_obj.is_verified:
        user_obj.is_verified = True
        user_obj.save(update_fields=['is_verified'])

    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    return f"{frontend_url}{login_path}?verified=1", None


def _build_password_reset_token(user_type, user_id, email):
    payload = {
        'user_type': user_type,
        'user_id': user_id,
        'email': email,
    }
    return signing.dumps(payload, salt=PASSWORD_RESET_SALT)


def _extract_request_data(request):
    data = {}
    if request.POST:
        data.update(request.POST.dict())
    if not data and request.body:
        try:
            data.update(json.loads(request.body.decode('utf-8')))
        except Exception:
            pass
    return data


def _validate_admin_requester(request, payload=None):
    payload = payload or {}
    requester_admin_id = payload.get('requester_admin_id') or request.GET.get('requester_admin_id')
    if not requester_admin_id:
        return None, JsonResponse({'bool': False, 'message': 'requester_admin_id is required'}, status=400)
    admin = models.Admin.objects.filter(id=requester_admin_id).first()
    if not admin:
        return None, JsonResponse({'bool': False, 'message': 'Admin not found'}, status=404)
    if not admin.is_active:
        return None, JsonResponse({'bool': False, 'message': 'Admin is inactive'}, status=403)
    return admin, None


def _get_active_parent_link(student):
    return models.StudentParentLink.objects.filter(
        student=student,
        status='approved'
    ).order_by('-approved_at', '-id').first()


def _get_active_live_sessions_consent(parent_link):
    now = timezone.now()
    return models.ParentalConsent.objects.filter(
        parent_link=parent_link,
        consent_type='live_sessions',
        status='approved'
    ).filter(
        Q(expires_at__isnull=True) | Q(expires_at__gte=now)
    ).order_by('-approved_at', '-id').first()


# ==================== PARENTAL CONSENT EMAIL ====================

def _build_parental_consent_token(link_id, parent_email, student_id):
    payload = {
        'link_id': link_id,
        'parent_email': parent_email,
        'student_id': student_id,
    }
    return signing.dumps(payload, salt=PARENTAL_CONSENT_SALT)


def _verify_parental_consent_token(token):
    """Validate token and return (payload_dict, error_string)."""
    try:
        payload = signing.loads(token, salt=PARENTAL_CONSENT_SALT,
                                max_age=PARENTAL_CONSENT_MAX_AGE_SECONDS)
    except signing.SignatureExpired:
        return None, 'This consent link has expired. Please ask your child to resend the request.'
    except signing.BadSignature:
        return None, 'Invalid consent link.'
    return payload, None


def _send_parental_consent_email(link, student):
    """Send an email to the parent with a signed consent link."""
    try:
        token = _build_parental_consent_token(link.id, link.parent.email, student.id)
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        consent_url = f"{frontend_url}/parent-consent/{token}"

        parent = link.parent
        subject = f'Parental Consent Required — {student.fullname} on Kannari Music Academy'
        message = (
            f"Dear {parent.fullname},\n\n"
            f"Your child, {student.fullname}, has registered on Kannari Music Academy "
            f"and requires your consent to participate in live music sessions.\n\n"
            f"As a parent/guardian, we need your authorization before your child can:\n"
            f"  • Join live video/audio sessions with their teacher\n"
            f"  • Participate in interactive lessons\n\n"
            f"Please review and approve by clicking the secure link below:\n\n"
            f"{consent_url}\n\n"
            f"This link is valid for 30 days.\n\n"
            f"If you did not expect this email, you can safely ignore it.\n\n"
            f"Warm regards,\n"
            f"Kannari Music Academy\n"
            f"Child Safety Team"
        )

        from_email = os.getenv('EMAIL_HOST_USER') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kannari.local')
        send_mail(subject, message, from_email, [parent.email], fail_silently=False)
        return True
    except Exception as e:
        print(f"[ParentalConsent] Failed to send consent email to {link.parent.email}: {e}")
        return False


def _send_parental_consent_approved_email(link, student):
    """Notify the student that their parent has approved consent."""
    try:
        subject = f'Parent Consent Approved — Kannari Music Academy'
        message = (
            f"Hi {student.fullname},\n\n"
            f"Great news! Your parent/guardian ({link.parent.fullname}) has approved your "
            f"participation in live sessions on Kannari Music Academy.\n\n"
            f"You can now join live sessions with your teacher.\n\n"
            f"Happy learning!\n"
            f"Kannari Music Academy"
        )
        from_email = os.getenv('EMAIL_HOST_USER') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kannari.local')
        send_mail(subject, message, from_email, [student.email], fail_silently=False)
        return True
    except Exception as e:
        print(f"[ParentalConsent] Failed to send approval notification to {student.email}: {e}")
        return False


def _send_parental_consent_denied_email(link, student, reason=''):
    """Notify the student that their parent has denied consent."""
    try:
        subject = f'Parent Consent Update — Kannari Music Academy'
        reason_text = f"\nReason given: {reason}\n" if reason else ""
        message = (
            f"Hi {student.fullname},\n\n"
            f"Your parent/guardian ({link.parent.fullname}) has declined the consent request "
            f"for live sessions on Kannari Music Academy.\n"
            f"{reason_text}\n"
            f"If you believe this is a mistake, please discuss it with your parent/guardian.\n\n"
            f"Kannari Music Academy"
        )
        from_email = os.getenv('EMAIL_HOST_USER') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kannari.local')
        send_mail(subject, message, from_email, [student.email], fail_silently=False)
        return True
    except Exception as e:
        print(f"[ParentalConsent] Failed to send denial notification to {student.email}: {e}")
        return False


def _send_password_reset_email(request, user_type, user_obj):
    try:
        token = _build_password_reset_token(user_type, user_obj.id, user_obj.email)
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

        if user_type == 'teacher':
            reset_url = f"{frontend_url}/teacher-forgot-password?token={token}"
            display_name = getattr(user_obj, 'full_name', 'Teacher')
            login_url = f"{frontend_url}/teacher-login"
        else:
            reset_url = f"{frontend_url}/user-forgot-password?token={token}"
            display_name = getattr(user_obj, 'fullname', 'Student')
            login_url = f"{frontend_url}/user-login"

        subject = 'Reset your Kannari Music Academy account password'
        message = (
            f"Hi {display_name},\n\n"
            f"We received a request to reset your password.\n"
            f"Click the link below to set a new password:\n\n"
            f"{reset_url}\n\n"
            f"This link expires in 2 hours.\n"
            f"If you did not request this, you can ignore this email.\n\n"
            f"Login page: {login_url}"
        )

        from_email = os.getenv('EMAIL_HOST_USER') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kannari.local')
        send_mail(subject, message, from_email, [user_obj.email], fail_silently=False)
        return True
    except Exception as e:
        print(f"[PasswordReset] Failed to send password reset email to {user_obj.email}: {e}")
        return False


def _send_teacher_approval_status_email(teacher, is_approved):
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        login_url = f"{frontend_url}/teacher-login"

        if is_approved:
            subject = 'Your teacher account has been approved'
            message = (
                f"Hi {teacher.full_name},\n\n"
                f"Your teacher account at Kannari Music Academy has been approved by admin.\n"
                f"You can now log in and access teacher features.\n\n"
                f"Login here: {login_url}\n\n"
                f"Thank you."
            )
        else:
            subject = 'Your teacher account approval was revoked'
            message = (
                f"Hi {teacher.full_name},\n\n"
                f"Your teacher account approval status has been changed by admin.\n"
                f"You currently cannot access teacher features.\n"
                f"If you believe this is a mistake, please contact support.\n\n"
                f"Teacher login page: {login_url}\n\n"
                f"Thank you."
            )

        from_email = os.getenv('EMAIL_HOST_USER') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kannari.local')
        send_mail(subject, message, from_email, [teacher.email], fail_silently=False)
        return True
    except Exception as e:
        print(f"[TeacherApprovalEmail] Failed to send approval status email to {teacher.email}: {e}")
        return False


def _finalize_password_reset(token, expected_user_type, new_password):
    if not new_password:
        return False, 'New password is required.'
    if len(new_password) < 8:
        return False, 'Password must be at least 8 characters.'

    try:
        payload = signing.loads(token, salt=PASSWORD_RESET_SALT, max_age=PASSWORD_RESET_MAX_AGE_SECONDS)
    except signing.SignatureExpired:
        return False, 'Password reset link expired. Please request a new one.'
    except signing.BadSignature:
        return False, 'Invalid password reset link.'

    if payload.get('user_type') != expected_user_type:
        return False, 'Invalid account type for this reset link.'

    user_id = payload.get('user_id')
    email = payload.get('email')

    if expected_user_type == 'teacher':
        user_obj = models.Teacher.objects.filter(id=user_id, email=email).first()
    else:
        user_obj = models.Student.objects.filter(id=user_id, email=email).first()

    if not user_obj:
        return False, 'User not found for this reset link.'

    user_obj.password = new_password
    user_obj.save(update_fields=['password'])
    return True, 'Password reset successful. You can now log in.'

class TeacherList(generics.ListCreateAPIView):
    queryset=models.Teacher.objects.all()
    serializer_class=TeacherSerializer

    def get_queryset(self):
        if 'popular' in self.request.GET:
            sql="SELECT t.id, t.full_name, t.email, t.password, t.mobile_no, t.qualification, t.skills, t.profile_img, COUNT(c.id) as total_course FROM main_teacher as t LEFT JOIN main_course as c ON c.teacher_id=t.id GROUP BY t.id, t.full_name, t.email, t.password, t.mobile_no, t.qualification, t.skills, t.profile_img ORDER BY total_course desc"  
            return models.Teacher.objects.raw(sql)
        return models.Teacher.objects.all()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code in [200, 201] and response.data.get('id'):
            teacher = models.Teacher.objects.filter(id=response.data['id']).first()
            if teacher:
                _send_verification_email(request, 'teacher', teacher)
            response.data['verification_required'] = True
            response.data['approval_required'] = True
            response.data['message'] = 'Registration successful. Please verify your email. Your account also requires admin approval before login.'
        return response

class TeacherDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset=models.Teacher.objects.all()
    serializer_class=TeacherSerializer
    
@csrf_exempt
def teacher_login(request):
    email=request.POST.get('email')
    password=request.POST.get('password')
    if not email or not password:
        return JsonResponse({'bool':False, 'message': 'Email and password are required.'}, status=400)
    try:
        teacherData=models.Teacher.objects.get(email=email,password=password)
    except models.Teacher.DoesNotExist:
        teacherData=None
    if teacherData:
        if not teacherData.is_verified:
            return JsonResponse({'bool':False, 'message': 'Please verify your email before login.'}, status=403)
        if not teacherData.is_approved:
            return JsonResponse({'bool':False, 'message': 'Your teacher account is pending admin approval.'}, status=403)
        log_activity(request, 'login', f'Teacher {teacherData.full_name} logged in',
                     model_name='Teacher', object_id=teacherData.id, teacher=teacherData)
        return JsonResponse({
            'bool': True,
            'teacher_id': teacherData.id,
            'teacher_name': teacherData.full_name,
            'teacher_email': teacherData.email,
            'teacher_qualification': teacherData.qualification,
            'teacher_mobile': teacherData.mobile_no,
            'teacher_profile_img': teacherData.profile_img.url if teacherData.profile_img else None
        })
    else:
        return JsonResponse({'bool':False})

class StudentDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset=models.Student.objects.all()
    serializer_class=StudentSerializer

class CategoryList(generics.ListCreateAPIView):
    queryset=models.CourseCategory.objects.all()
    serializer_class=CategorySerializer

class TeacherDashboard(generics.RetrieveAPIView):
    queryset=models.Teacher.objects.all()
    serializer_class=TeacherDashboardSerializer

class CourseList(generics.ListCreateAPIView):
    queryset=models.Course.objects.all()
    serializer_class=CourseSerializer
    pagination_class=StandardResultSetPagination

    def get_queryset(self):
        qs=super().get_queryset()
        if 'result' in self.request.GET:
            limit=int(self.request.GET['result'])
            qs=models.Course.objects.all().order_by('-id')[:limit]
        if 'popular' in self.request.GET:
            qs=models.Course.objects.all().order_by('-id')[:limit]

        if 'category' in self.request.GET :
            category=self.request.GET['category']
            category=models.CourseCategory.objects.filter(id=category).first()
            qs=models.Course.objects.filter(category=category)

        if 'skill_name' in self.request.GET and 'teacher' in self.request.GET:
            skill_name=self.request.GET['skill_name']
            teacher=self.request.GET['teacher']
            teacher=models.Teacher.objects.filter(id=teacher).first()
            qs=models.Course.objects.filter(techs__icontains=skill_name,teacher=teacher)

        if 'searchstring' in self.kwargs:
            search=self.kwargs['searchstring']
            qs=models.Course.objects.filter(Q(title__icontains=search)|Q(title__icontains=search))
        
        return qs

class TeacherCourseList(generics.ListAPIView):
    serializer_class=CourseSerializer

    def get_queryset(self):
        teacher_id=self.kwargs['teacher_id']
        teacher=models.Teacher.objects.get(pk=teacher_id)
        return models.Course.objects.filter(teacher=teacher)

class CourseDetailView(generics.RetrieveAPIView):
    queryset=models.Course.objects.all()
    serializer_class=CourseSerializer

class TeacherCourseDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset=models.Course.objects.all()
    serializer_class=CourseSerializer

class ChapterList(generics.ListCreateAPIView):
    queryset=models.Chapter.objects.all()
    serializer_class=ChapterSerializer

class CourseChapterList(generics.ListCreateAPIView):
    serializer_class=ChapterSerializer

    def get_queryset(self):
        course_id=self.kwargs['course_id']
        course=models.Course.objects.get(pk=course_id)
        return models.Chapter.objects.filter(course=course)

class ChapterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset=models.Chapter.objects.all()
    serializer_class=ChapterSerializer

class StudentList(generics.ListCreateAPIView):
    queryset=models.Student.objects.all()
    serializer_class=StudentSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code in [200, 201] and response.data.get('id'):
            student = models.Student.objects.filter(id=response.data['id']).first()
            if student:
                _send_verification_email(request, 'student', student)
            response.data['verification_required'] = True
            response.data['message'] = 'Registration successful. Please verify your email to log in.'
        return response

class StudentDashboard(generics.RetrieveAPIView):
    queryset=models.Student.objects.all()
    serializer_class=StudentDashboardSerializer

@csrf_exempt
def student_login(request):
    email=request.POST.get('email')
    password=request.POST.get('password')
    if not email or not password:
        return JsonResponse({'bool':False, 'message': 'Email and password are required.'}, status=400)
    try:
        studentData=models.Student.objects.get(email=email,password=password)
    except models.Student.DoesNotExist:
        studentData=None
    if studentData:
        if not studentData.is_verified:
            return JsonResponse({'bool':False, 'message': 'Please verify your email before login.'}, status=403)
        log_activity(request, 'login', f'Student {studentData.fullname} logged in',
                     model_name='Student', object_id=studentData.id, student=studentData)
        return JsonResponse({'bool':True,'student_id':studentData.id})
    else:
        return JsonResponse({'bool':False})


def verify_teacher_email(request):
    token = request.GET.get('token')
    if not token:
        return HttpResponse('Missing verification token.', status=400)
    redirect_url, error = _finalize_email_verification(token, 'teacher')
    if error:
        return HttpResponse(error, status=400)
    return redirect(redirect_url)


def verify_student_email(request):
    token = request.GET.get('token')
    if not token:
        return HttpResponse('Missing verification token.', status=400)
    redirect_url, error = _finalize_email_verification(token, 'student')
    if error:
        return HttpResponse(error, status=400)
    return redirect(redirect_url)


@csrf_exempt
def request_teacher_password_reset(request):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    data = _extract_request_data(request)
    email = (data.get('email') or '').strip()
    if email:
        teacher = models.Teacher.objects.filter(email=email).first()
        if teacher:
            _send_password_reset_email(request, 'teacher', teacher)

    return JsonResponse({'bool': True, 'message': 'If this email exists, a reset link has been sent.'})


@csrf_exempt
def request_student_password_reset(request):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    data = _extract_request_data(request)
    email = (data.get('email') or '').strip()
    if email:
        student = models.Student.objects.filter(email=email).first()
        if student:
            _send_password_reset_email(request, 'student', student)

    return JsonResponse({'bool': True, 'message': 'If this email exists, a reset link has been sent.'})


@csrf_exempt
def confirm_teacher_password_reset(request):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    data = _extract_request_data(request)
    token = data.get('token')
    new_password = data.get('new_password')

    success, message = _finalize_password_reset(token, 'teacher', new_password)
    if not success:
        return JsonResponse({'bool': False, 'message': message}, status=400)
    return JsonResponse({'bool': True, 'message': message})


@csrf_exempt
def confirm_student_password_reset(request):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    data = _extract_request_data(request)
    token = data.get('token')
    new_password = data.get('new_password')

    success, message = _finalize_password_reset(token, 'student', new_password)
    if not success:
        return JsonResponse({'bool': False, 'message': message}, status=400)
    return JsonResponse({'bool': True, 'message': message})

class StudentEnrollCourseList(generics.ListCreateAPIView):
    queryset=models.StudentCourseEnrollment.objects.all()
    serializer_class=StudentCourseEnrollSerializer

    def create(self, request, *args, **kwargs):
        """Override create to enforce subscription validation on enrollment"""
        from .access_control import SubscriptionAccessControl
        student_id = request.data.get('student')
        course_id = request.data.get('course')
        
        if student_id and course_id:
            can_enroll, msg = SubscriptionAccessControl.can_enroll_in_course(student_id, course_id)
            if not can_enroll:
                # Audit: log denied enrollment
                try:
                    student_obj = models.Student.objects.get(id=student_id)
                    course_obj = models.Course.objects.get(id=course_id)
                    log_access(request=request, access_type='course_enroll', was_allowed=False,
                               denial_reason=msg, student=student_obj, course=course_obj)
                except Exception:
                    pass
                return Response(
                    {'error': msg, 'detail': msg},
                    status=403
                )
            # If enrollment is allowed, create and also record it in subscription
            response = super().create(request, *args, **kwargs)
            if response.status_code == 201:
                subscription = SubscriptionAccessControl.get_active_subscription(student_id)
                if subscription:
                    subscription.record_course_enrollment()
                # Audit: log successful enrollment
                try:
                    student_obj = models.Student.objects.get(id=student_id)
                    course_obj = models.Course.objects.get(id=course_id)
                    log_access(request=request, access_type='course_enroll', was_allowed=True,
                               student=student_obj, course=course_obj, subscription=subscription)
                    # Auto-award achievements when enrolling (e.g., "Versatile Musician")
                    check_and_award_achievements(student_obj)
                except Exception as e:
                    print(f"[Enrollment] Error logging/checking achievements: {e}")
            return response
        return super().create(request, *args, **kwargs)

def fetch_enroll_status(request,student_id,course_id):
    student=models.Student.objects.filter(id=student_id).first()
    course=models.Course.objects.filter(id=course_id).first()
    enrollStatus=models.StudentCourseEnrollment.objects.filter(course=course,student=student).count()
    if enrollStatus:
        return JsonResponse({'bool':True})
    else:
        return JsonResponse({'bool':False})

class EnrolledStuentList(generics.ListAPIView):
    queryset=models.StudentCourseEnrollment.objects.all()
    serializer_class=StudentCourseEnrollSerializer

    def get_queryset(self):
        if 'course_id' in self.kwargs:
            course_id=self.kwargs['course_id']
            course=models.Course.objects.get(pk=course_id)
            return models.StudentCourseEnrollment.objects.filter(course=course)
        elif 'teacher_id' in self.kwargs:
            teacher_id=self.kwargs['teacher_id']
            teacher=models.Teacher.objects.get(pk=teacher_id)
            return models.StudentCourseEnrollment.objects.filter(course__teacher=teacher).distinct()
        elif 'student_id' in self.kwargs:
            student_id=self.kwargs['student_id']
            student=models.Student.objects.get(pk=student_id)
            return models.StudentCourseEnrollment.objects.filter(student=student).distinct()
        elif 'studentId' in self.kwargs:
            student_id=self.kwargs['student_id']
            student=models.Student.objects.get(pk=student_id)
            print(student.interseted_categories)
            queries=[Q(techs__iendwith=value) for value in student.interseted_categories]
            query=queries.pop()
            for item in queries:
                query |= item
            qs=models.Course.objects.filter(query)
        return qs

class CourseRatingList(generics.ListCreateAPIView):
    queryset=models.CourseRating.objects.all()
    serializer_class=CourseRatingSerializer
    pagination_class=StandardResultSetPagination

    def get_queryset(self):
        if 'popular' in self.request.GET:
            sql="SELECT cr.id, cr.course_id, cr.student_id, cr.rating, cr.reviews, cr.review_time, AVG(cr.rating) as avg_rating FROM main_courserating as cr INNER JOIN main_course as c ON cr.course_id=c.id GROUP BY cr.id, cr.course_id, cr.student_id, cr.rating, cr.reviews, cr.review_time ORDER BY avg_rating desc LIMIT 3"
            return models.CourseRating.objects.raw(sql)
        if 'all' in self.request.GET:
            sql="SELECT cr.id, cr.course_id, cr.student_id, cr.rating, cr.reviews, cr.review_time, AVG(cr.rating) as avg_rating FROM main_courserating as cr INNER JOIN main_course as c ON cr.course_id=c.id GROUP BY cr.id, cr.course_id, cr.student_id, cr.rating, cr.reviews, cr.review_time ORDER BY avg_rating desc"
            return models.CourseRating.objects.raw(sql)
        return models.CourseRating.objects.filter(course__isnull=False).order_by('-rating')

def fetch_rating_status(request,student_id,course_id):
    student=models.Student.objects.filter(id=student_id).first()
    course=models.Course.objects.filter(id=course_id).first()
    ratingStatus=models.CourseRating.objects.filter(course=course,student=student).count()
    if ratingStatus:
        return JsonResponse({'bool':True})
    else:
        return JsonResponse({'bool':False})

@csrf_exempt
def teacher_change_password(request,teacher_id):
    password=request.POST['password']
    try:
        teacherData=models.Teacher.objects.get(id=teacher_id)
    except models.Teacher.DoesNotExist:
        teacherData=None
    if teacherData:
        models.Teacher.objects.filter(id=teacher_id).update(password=password)
        return JsonResponse({'bool':True})
    else:
        return JsonResponse({'bool':False})

class StudentFavoriteCourseList(generics.ListCreateAPIView):
    queryset=models.StudentFavoriteCourse.objects.all()
    serializer_class=StudentFavoriteCourseSerializer

    def get_queryset(self):
        if 'student_id' in self.kwargs:
            student_id=self.kwargs['student_id']
            student=models.Student.objects.get(pk=student_id)
            return models.StudentFavoriteCourse.objects.filter(student=student).distinct()

def fetch_favorite_status(request, student_id, course_id):
    student = models.Student.objects.filter(id=student_id).first()
    course = models.Course.objects.filter(id=course_id).first()
    favoriteStatus = models.StudentFavoriteCourse.objects.filter(course=course, student=student).count()
    if favoriteStatus:
        return JsonResponse({'bool': True})
    else:
        return JsonResponse({'bool': False})

def remove_favorite_course(request,course_id,student_id):
    student=models.Student.objects.filter(id=student_id).first()
    course=models.Course.objects.filter(id=course_id).first()
    favoriteStatus=models.StudentFavoriteCourse.objects.filter(course=course,student=student).delete()
    if favoriteStatus:
        return JsonResponse({'bool':True})
    else:
        return JsonResponse({'bool':False})

@csrf_exempt
def student_change_password(request,student_id):
    password=request.POST['password']
    try:
        studentData=models.Student.objects.get(id=student_id)
    except models.Student.DoesNotExist:
        studentData=None
    if studentData:
        models.Student.objects.filter(id=student_id).update(password=password)
        return JsonResponse({'bool':True})
    else:
        return JsonResponse({'bool':False})


class StudyMaterialList(generics.ListCreateAPIView):
    serializer_class=StudyMaterialSerializer

    def get_queryset(self):
        course_id=self.kwargs['course_id']
        course=models.Course.objects.get(pk=course_id)
        return models.StudyMaterial.objects.filter(course=course)

class StudyMaterialView(generics.RetrieveUpdateDestroyAPIView):
    queryset=models.StudyMaterial.objects.all()
    serializer_class=StudyMaterialSerializer

def update_view(request,course_id):
    queryset=models.Course.objects.filter(pk=course_id).first()
    queryset.course_views+=1
    queryset.save()
    return JsonResponse({'views':queryset.course_views})

class FaqList(generics.ListAPIView):
    queryset=models.Faq.objects.all()
    serializer_class=FaqSerializer

class FlatPagesList(generics.ListAPIView):
    queryset=FlatPage.objects.all()
    serializer_class=FlatPageSerializer

class FlatPagesDetail(generics.ListAPIView):
    queryset=FlatPage.objects.all()
    serializer_class=FlatPageSerializer

class MyTeacherList(generics.ListAPIView):
    queryset=models.Course.objects.all()
    serializer_class=CourseSerializer

    def get_queryset(self):
        if 'student_id' in self.kwargs:
            student_id=self.kwargs['student_id']
            sql=f"SELECT * FROM main_course as c,main_studentcourseenrollment as e,main_teacher as t WHERE c.teacher_id=t.id AND e.course_id=c.id AND e.student_id={student_id} GROUP BY c.teacher_id"
            qs=models.Course.objects.raw(sql)
            print(qs)
            return qs


# ==================== ADMIN DASHBOARD VIEWS ====================

from . serializers import (
    AdminSerializer, AdminDashboardSerializer, SchoolSerializer,
    SchoolTeacherSerializer, SchoolStudentSerializer, SchoolCourseSerializer,
    ActivityLogSerializer, SystemSettingsSerializer,
    AdminStatsSerializer
)
from django.db.models import Count, Avg, Sum
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta


class AdminList(generics.ListCreateAPIView):
    queryset = models.Admin.objects.all()
    serializer_class = AdminSerializer


class AdminDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.Admin.objects.all()
    serializer_class = AdminSerializer
    
    def update(self, request, *args, **kwargs):
        # Handle both partial and full updates
        instance = self.get_object()
        
        # Don't allow password updates through this endpoint
        data = request.data.copy()
        if 'password' in data:
            del data['password']
        
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)


@csrf_exempt
def admin_login(request):
    import hashlib

    email = request.POST.get('email')
    password = request.POST.get('password')

    if not email or not password:
        return JsonResponse({'bool': False, 'message': 'Email and password are required.'}, status=400)

    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    adminData = models.Admin.objects.filter(email__iexact=email).first()

    if adminData:
        stored_password = adminData.password or ''
        is_valid = stored_password == hashed_password or stored_password == password

        if is_valid:
            update_fields = ['last_login']
            adminData.last_login = timezone.now()

            # Auto-migrate legacy plain-text password to hash
            if stored_password == password:
                adminData.password = hashed_password
                update_fields.append('password')

            adminData.save(update_fields=update_fields)

            log_activity(request, 'login', f'Admin {adminData.full_name} logged in',
                         model_name='Admin', object_id=adminData.id, admin=adminData)
        else:
            adminData = None

    if adminData:
        return JsonResponse({
            'bool': True,
            'admin_id': adminData.id,
            'role': adminData.role,
            'name': adminData.full_name
        })
    else:
        return JsonResponse({'bool': False})


@csrf_exempt
def admin_change_password(request, admin_id):
    import hashlib

    password = request.POST.get('password')
    if not password:
        return JsonResponse({'bool': False, 'message': 'password is required'}, status=400)

    try:
        adminData = models.Admin.objects.get(id=admin_id)
        adminData.password = hashlib.sha256(password.encode()).hexdigest()
        adminData.save()
        log_activity(request, 'update', f'Admin {adminData.full_name} changed password',
                     model_name='Admin', object_id=admin_id, admin=adminData)
        return JsonResponse({'bool': True})
    except models.Admin.DoesNotExist:
        return JsonResponse({'bool': False})


class AdminDashboard(generics.RetrieveAPIView):
    queryset = models.Admin.objects.all()
    serializer_class = AdminDashboardSerializer


def admin_stats(request):
    """Get comprehensive admin dashboard statistics"""
    # Basic counts
    total_schools = models.School.objects.count()
    total_teachers = models.Teacher.objects.count()
    total_students = models.Student.objects.count()
    total_courses = models.Course.objects.count()
    total_enrollments = models.StudentCourseEnrollment.objects.count()
    
    # Recent enrollments (last 7 days)
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_enrollments = models.StudentCourseEnrollment.objects.filter(
        enrolled_time__gte=seven_days_ago
    ).select_related('student', 'course')[:10]
    
    recent_enrollment_data = [{
        'id': e.id,
        'student_name': e.student.fullname if e.student else 'Unknown',
        'course_title': e.course.title if e.course else 'Unknown',
        'enrolled_time': e.enrolled_time.strftime('%Y-%m-%d %H:%M')
    } for e in recent_enrollments]
    
    # Popular courses
    popular_courses = models.Course.objects.annotate(
        enrollment_count=Count('enrolled_courses')
    ).order_by('-enrollment_count')[:5]
    
    popular_course_data = [{
        'id': c.id,
        'title': c.title,
        'enrollments': c.enrollment_count,
        'rating': c.course_rating() or 0
    } for c in popular_courses]
    
    # Monthly statistics (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)
    monthly_enrollments = models.StudentCourseEnrollment.objects.filter(
        enrolled_time__gte=six_months_ago
    ).annotate(
        month=TruncMonth('enrolled_time')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    monthly_stats = {
        'labels': [m['month'].strftime('%b %Y') for m in monthly_enrollments],
        'enrollments': [m['count'] for m in monthly_enrollments]
    }
    
    # Category-wise courses
    category_stats = models.CourseCategory.objects.annotate(
        course_count=Count('category_courses')
    ).values('title', 'course_count')
    
    # Teacher performance
    top_teachers = models.Teacher.objects.annotate(
        student_count=Count('teacher_courses__enrolled_courses')
    ).order_by('-student_count')[:5]
    
    top_teacher_data = [{
        'id': t.id,
        'name': t.full_name,
        'students': t.student_count,
        'courses': t.total_teacher_course()
    } for t in top_teachers]
    
    return JsonResponse({
        'total_schools': total_schools,
        'total_teachers': total_teachers,
        'total_students': total_students,
        'total_courses': total_courses,
        'total_enrollments': total_enrollments,
        'recent_enrollments': recent_enrollment_data,
        'popular_courses': popular_course_data,
        'monthly_stats': monthly_stats,
        'category_stats': list(category_stats),
        'top_teachers': top_teacher_data
    })

# School Views
class SchoolList(generics.ListCreateAPIView):
    queryset = models.School.objects.all()
    serializer_class = SchoolSerializer
    pagination_class = StandardResultSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        if 'search' in self.request.GET:
            search = self.request.GET['search']
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search)
            )
        if 'admin_id' in self.request.GET:
            admin_id = self.request.GET['admin_id']
            qs = qs.filter(admin_id=admin_id)
        if 'status' in self.request.GET:
            status = self.request.GET['status']
            qs = qs.filter(status=status)
        return qs

    def create(self, request, *args, **kwargs):
        import hashlib, secrets, string
        response = super().create(request, *args, **kwargs)
        school = models.School.objects.get(id=response.data['id'])
        
        # Auto-generate a password for the school user
        raw_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))
        hashed_password = hashlib.sha256(raw_password.encode()).hexdigest()
        
        # Create SchoolUser with the school's email
        school_user, created = models.SchoolUser.objects.get_or_create(
            school=school,
            defaults={
                'email': school.email,
                'password': hashed_password,
                'is_active': True,
            }
        )
        
        # Include the login credentials in the response
        response.data['school_login_email'] = school.email
        response.data['school_login_password'] = raw_password
        response.data['school_user_created'] = created
        
        log_activity(request, 'create', f'School "{school.name}" created',
                     model_name='School', object_id=school.id)
        
        return response


class SchoolDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.School.objects.all()
    serializer_class = SchoolSerializer


class SchoolTeacherList(generics.ListCreateAPIView):
    queryset = models.SchoolTeacher.objects.all()
    serializer_class = SchoolTeacherSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if 'school_id' in self.kwargs:
            qs = qs.filter(school_id=self.kwargs['school_id'])
        return qs


class SchoolTeacherDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.SchoolTeacher.objects.all()
    serializer_class = SchoolTeacherSerializer


class SchoolStudentList(generics.ListCreateAPIView):
    queryset = models.SchoolStudent.objects.all()
    serializer_class = SchoolStudentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if 'school_id' in self.kwargs:
            qs = qs.filter(school_id=self.kwargs['school_id'])
        return qs


class SchoolStudentDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.SchoolStudent.objects.all()
    serializer_class = SchoolStudentSerializer


class SchoolCourseList(generics.ListCreateAPIView):
    queryset = models.SchoolCourse.objects.all()
    serializer_class = SchoolCourseSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if 'school_id' in self.kwargs:
            qs = qs.filter(school_id=self.kwargs['school_id'])
        return qs


class SchoolCourseDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.SchoolCourse.objects.all()
    serializer_class = SchoolCourseSerializer


# Activity Log Views
class ActivityLogList(generics.ListCreateAPIView):
    queryset = models.ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    pagination_class = StandardResultSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        if 'admin_id' in self.request.GET:
            qs = qs.filter(admin_id=self.request.GET['admin_id'])
        if 'action' in self.request.GET:
            qs = qs.filter(action=self.request.GET['action'])
        if 'date_from' in self.request.GET:
            qs = qs.filter(created_at__gte=self.request.GET['date_from'])
        if 'date_to' in self.request.GET:
            qs = qs.filter(created_at__lte=self.request.GET['date_to'])
        return qs


# System Settings Views
class SystemSettingsList(generics.ListCreateAPIView):
    queryset = models.SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer


class SystemSettingsDetail(generics.RetrieveUpdateAPIView):
    queryset = models.SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer


def get_or_create_settings(request):
    """Get or create system settings"""
    settings, created = models.SystemSettings.objects.get_or_create(pk=1)
    return JsonResponse({
        'id': settings.id,
        'site_name': settings.site_name,
        'contact_email': settings.contact_email,
        'contact_phone': settings.contact_phone,
        'maintenance_mode': settings.maintenance_mode,
        'allow_registration': settings.allow_registration,
        'default_language': settings.default_language,
        'timezone': settings.timezone
    })


# Admin manage all teachers
class AdminTeacherList(generics.ListAPIView):
    queryset = models.Teacher.objects.all()
    serializer_class = TeacherSerializer
    pagination_class = StandardResultSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        if 'search' in self.request.GET:
            search = self.request.GET['search']
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search)
            )
        # Safety / verification filters
        verification_status = self.request.GET.get('verification_status', '')
        if verification_status:
            qs = qs.filter(verification_status=verification_status)
        can_teach_minors = self.request.GET.get('can_teach_minors', '')
        if can_teach_minors.lower() == 'true':
            qs = qs.filter(can_teach_minors=True)
        elif can_teach_minors.lower() == 'false':
            qs = qs.filter(can_teach_minors=False)
        is_approved = self.request.GET.get('is_approved', '')
        if is_approved.lower() == 'true':
            qs = qs.filter(is_approved=True)
        elif is_approved.lower() == 'false':
            qs = qs.filter(is_approved=False)
        # Expiration filter: teachers whose background check is expired
        expired_bg = self.request.GET.get('expired_background', '')
        if expired_bg.lower() == 'true':
            qs = qs.filter(
                teacherverification__background_check__status='expired'
            )
        return qs


@csrf_exempt
def admin_toggle_teacher_status(request, teacher_id):
    """Approve or revoke teacher access from admin panel."""
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    data = _extract_request_data(request)
    try:
        teacher = models.Teacher.objects.get(id=teacher_id)
        if 'is_approved' in data:
            value = str(data.get('is_approved')).strip().lower()
            is_approved = value in ['1', 'true', 'yes', 'approved']
        else:
            is_approved = not teacher.is_approved

        teacher.is_approved = is_approved
        teacher.save(update_fields=['is_approved'])

        email_sent = _send_teacher_approval_status_email(teacher, teacher.is_approved)

        action_label = 'approved' if is_approved else 'approval revoked'
        log_activity(
            request,
            'update',
            f'Teacher {teacher.full_name} {action_label} by admin',
            model_name='Teacher',
            object_id=teacher.id,
        )

        return JsonResponse({
            'bool': True,
            'message': f'Teacher {action_label} successfully.',
            'teacher_id': teacher.id,
            'is_approved': teacher.is_approved,
            'email_sent': email_sent,
        })
    except models.Teacher.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'})


def _get_or_create_teacher_verification(teacher):
    verification, _ = models.TeacherVerification.objects.get_or_create(teacher=teacher)
    models.TeacherIDVerification.objects.get_or_create(verification=verification)
    models.TeacherBackgroundCheck.objects.get_or_create(verification=verification)
    return verification


def _serialize_teacher_verification(verification):
    id_verification = models.TeacherIDVerification.objects.filter(verification=verification).first()
    background_check = models.TeacherBackgroundCheck.objects.filter(verification=verification).first()
    signatures = models.TeacherAgreementSignature.objects.filter(verification=verification).order_by('-signed_at')

    return {
        'teacher_id': verification.teacher_id,
        'teacher_name': verification.teacher.full_name,
        'overall_status': verification.overall_status,
        'id_verification_status': verification.id_verification_status,
        'background_check_status': verification.background_check_status,
        'agreement_status': verification.agreement_status,
        'teacher_verification_status': verification.teacher.verification_status,
        'teacher_is_approved': verification.teacher.is_approved,
        'can_teach_minors': verification.teacher.can_teach_minors,
        'submitted_at': verification.submitted_at,
        'reviewed_at': verification.reviewed_at,
        'rejection_reason': verification.rejection_reason,
        'id_verification': {
            'status': id_verification.status if id_verification else 'pending',
            'document_type': id_verification.document_type if id_verification else None,
            'id_document': id_verification.id_document.url if id_verification and id_verification.id_document else None,
            'submitted_at': id_verification.submitted_at if id_verification else None,
            'reviewed_at': id_verification.reviewed_at if id_verification else None,
            'review_notes': id_verification.review_notes if id_verification else None,
        },
        'background_check': {
            'status': background_check.status if background_check else 'pending',
            'provider_name': background_check.provider_name if background_check else None,
            'reference_number': background_check.reference_number if background_check else None,
            'confirmation_email': background_check.confirmation_email if background_check else None,
            'evidence_file': background_check.evidence_file.url if background_check and background_check.evidence_file else None,
            'submitted_at': background_check.submitted_at if background_check else None,
            'reviewed_at': background_check.reviewed_at if background_check else None,
            'review_notes': background_check.review_notes if background_check else None,
            'expires_at': background_check.expires_at.isoformat() if background_check and background_check.expires_at else None,
            'days_until_expiry': background_check.days_until_expiry() if background_check else None,
            'is_expired': background_check.is_expired() if background_check else False,
        },
        'agreement_signatures': [
            {
                'id': signature.id,
                'agreement_type': signature.agreement_type,
                'policy_version': signature.policy_version,
                'signature_text': signature.signature_text,
                'status': signature.status,
                'signed_at': signature.signed_at.isoformat() if signature.signed_at else None,
                'reviewed_at': signature.reviewed_at.isoformat() if signature.reviewed_at else None,
                'review_notes': signature.review_notes,
                'ip_address': signature.ip_address,
            }
            for signature in signatures
        ]
    }


def _sync_agreement_step_status(verification):
    required_types = {'child_safety', 'code_of_conduct', 'background_check_consent'}
    latest_by_type = {}
    for signature in models.TeacherAgreementSignature.objects.filter(verification=verification).order_by('-signed_at'):
        latest_by_type.setdefault(signature.agreement_type, signature)

    if not latest_by_type:
        verification.agreement_status = 'pending'
    else:
        statuses = [latest_by_type[a_type].status for a_type in required_types if a_type in latest_by_type]
        missing_required = any(a_type not in latest_by_type for a_type in required_types)

        if any(status == 'rejected' for status in statuses):
            verification.agreement_status = 'rejected'
        elif (not missing_required) and all(status == 'approved' for status in statuses):
            verification.agreement_status = 'approved'
        elif any(status in ['in_review', 'approved'] for status in statuses):
            verification.agreement_status = 'in_review'
        else:
            verification.agreement_status = 'pending'

    verification.save(update_fields=['agreement_status', 'updated_at'])
    verification.recalculate_status()


@csrf_exempt
def teacher_verification_start(request, teacher_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    verification = _get_or_create_teacher_verification(teacher)
    verification.overall_status = 'in_review'
    verification.submitted_at = timezone.now()
    verification.save(update_fields=['overall_status', 'submitted_at', 'updated_at'])

    teacher.verification_status = 'in_review'
    teacher.can_teach_minors = False
    teacher.save(update_fields=['verification_status', 'can_teach_minors'])

    return JsonResponse({
        'bool': True,
        'message': 'Verification process started',
        'verification': _serialize_teacher_verification(verification),
    })


def teacher_verification_status(request, teacher_id):
    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    verification = _get_or_create_teacher_verification(teacher)
    _sync_agreement_step_status(verification)
    return JsonResponse({'bool': True, 'verification': _serialize_teacher_verification(verification)})


@csrf_exempt
def teacher_verification_upload_id(request, teacher_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    document = request.FILES.get('id_document')
    if not document:
        return JsonResponse({'bool': False, 'message': 'id_document file is required'}, status=400)

    verification = _get_or_create_teacher_verification(teacher)
    id_verification, _ = models.TeacherIDVerification.objects.get_or_create(verification=verification)
    id_verification.id_document = document
    id_verification.document_type = request.POST.get('document_type', 'government_id')
    id_verification.status = 'in_review'
    id_verification.submitted_at = timezone.now()
    id_verification.reviewed_at = None
    id_verification.reviewed_by = None
    id_verification.review_notes = None
    id_verification.save()

    verification.id_verification_status = 'in_review'
    verification.submitted_at = verification.submitted_at or timezone.now()
    verification.save(update_fields=['id_verification_status', 'submitted_at', 'updated_at'])
    verification.recalculate_status()

    return JsonResponse({'bool': True, 'message': 'ID document submitted for review'})


@csrf_exempt
def teacher_verification_submit_background(request, teacher_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    verification = _get_or_create_teacher_verification(teacher)
    background, _ = models.TeacherBackgroundCheck.objects.get_or_create(verification=verification)

    background.provider_name = request.POST.get('provider_name', background.provider_name)
    background.reference_number = request.POST.get('reference_number', background.reference_number)
    background.confirmation_email = request.POST.get('confirmation_email', background.confirmation_email)
    evidence_file = request.FILES.get('evidence_file')
    if evidence_file:
        background.evidence_file = evidence_file

    background.status = 'in_review'
    background.submitted_at = timezone.now()
    background.reviewed_at = None
    background.reviewed_by = None
    background.review_notes = None
    background.save()

    verification.background_check_status = 'in_review'
    verification.submitted_at = verification.submitted_at or timezone.now()
    verification.save(update_fields=['background_check_status', 'submitted_at', 'updated_at'])
    verification.recalculate_status()

    return JsonResponse({'bool': True, 'message': 'Background check details submitted for review'})


@csrf_exempt
def teacher_verification_sign_agreement(request, teacher_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    payload = _extract_request_data(request)
    agreement_type = (payload.get('agreement_type') or '').strip()
    signature_text = (payload.get('signature_text') or '').strip()

    if agreement_type not in ['child_safety', 'code_of_conduct', 'background_check_consent', 'other']:
        return JsonResponse({'bool': False, 'message': 'Invalid agreement_type'}, status=400)
    if not signature_text:
        return JsonResponse({'bool': False, 'message': 'signature_text is required'}, status=400)

    verification = _get_or_create_teacher_verification(teacher)
    policy = models.PolicyDocument.objects.filter(policy_type=agreement_type, is_active=True).order_by('-created_at').first()
    policy_version = payload.get('policy_version') or (policy.version if policy else '1.0')

    models.TeacherAgreementSignature.objects.create(
        verification=verification,
        policy_document=policy,
        agreement_type=agreement_type,
        policy_version=policy_version,
        signature_text=signature_text,
        ip_address=_get_client_ip(request),
        status='in_review',
    )

    verification.agreement_status = 'in_review'
    verification.submitted_at = verification.submitted_at or timezone.now()
    verification.save(update_fields=['agreement_status', 'submitted_at', 'updated_at'])
    _sync_agreement_step_status(verification)

    return JsonResponse({'bool': True, 'message': 'Agreement submitted for admin verification'})


def admin_teacher_verification_detail(request, teacher_id):
    admin, error = _validate_admin_requester(request)
    if error:
        return error

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    verification = _get_or_create_teacher_verification(teacher)
    _sync_agreement_step_status(verification)
    log_activity(request, 'view', f'Admin {admin.full_name} viewed teacher verification details',
                 model_name='TeacherVerification', object_id=verification.id, admin=admin)
    return JsonResponse({'bool': True, 'verification': _serialize_teacher_verification(verification)})


@csrf_exempt
def admin_review_teacher_id_verification(request, teacher_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    payload = _extract_request_data(request)
    admin, error = _validate_admin_requester(request, payload)
    if error:
        return error

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    decision = (payload.get('decision') or '').strip().lower()
    if decision not in ['approved', 'rejected']:
        return JsonResponse({'bool': False, 'message': 'decision must be approved or rejected'}, status=400)

    verification = _get_or_create_teacher_verification(teacher)
    id_verification, _ = models.TeacherIDVerification.objects.get_or_create(verification=verification)
    new_status = 'approved' if decision == 'approved' else 'rejected'
    notes = payload.get('notes')

    id_verification.status = new_status
    id_verification.reviewed_at = timezone.now()
    id_verification.reviewed_by = admin
    id_verification.review_notes = notes
    id_verification.save()

    verification.id_verification_status = new_status
    verification.reviewed_by = admin
    verification.reviewed_at = timezone.now()
    verification.save(update_fields=['id_verification_status', 'reviewed_by', 'reviewed_at', 'updated_at'])
    verification.recalculate_status()

    return JsonResponse({'bool': True, 'message': f'ID verification {new_status}'})


@csrf_exempt
def admin_review_teacher_background_check(request, teacher_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    payload = _extract_request_data(request)
    admin, error = _validate_admin_requester(request, payload)
    if error:
        return error

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    decision = (payload.get('decision') or '').strip().lower()
    if decision not in ['approved', 'rejected']:
        return JsonResponse({'bool': False, 'message': 'decision must be approved or rejected'}, status=400)

    verification = _get_or_create_teacher_verification(teacher)
    background, _ = models.TeacherBackgroundCheck.objects.get_or_create(verification=verification)
    new_status = 'approved' if decision == 'approved' else 'rejected'
    notes = payload.get('notes')

    background.status = new_status
    background.reviewed_at = timezone.now()
    background.reviewed_by = admin
    background.review_notes = notes
    if new_status == 'approved':
        background.set_expiration_on_approval()
    elif new_status == 'rejected':
        background.expires_at = None
    background.save()

    verification.background_check_status = new_status
    verification.reviewed_by = admin
    verification.reviewed_at = timezone.now()
    verification.save(update_fields=['background_check_status', 'reviewed_by', 'reviewed_at', 'updated_at'])
    verification.recalculate_status()

    return JsonResponse({'bool': True, 'message': f'Background check {new_status}'})


@csrf_exempt
def admin_review_teacher_agreement(request, teacher_id, signature_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    payload = _extract_request_data(request)
    admin, error = _validate_admin_requester(request, payload)
    if error:
        return error

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    verification = _get_or_create_teacher_verification(teacher)
    signature = models.TeacherAgreementSignature.objects.filter(id=signature_id, verification=verification).first()
    if not signature:
        return JsonResponse({'bool': False, 'message': 'Agreement signature not found'}, status=404)

    decision = (payload.get('decision') or '').strip().lower()
    if decision not in ['approved', 'rejected']:
        return JsonResponse({'bool': False, 'message': 'decision must be approved or rejected'}, status=400)

    new_status = 'approved' if decision == 'approved' else 'rejected'
    signature.status = new_status
    signature.reviewed_by = admin
    signature.reviewed_at = timezone.now()
    signature.review_notes = payload.get('notes')
    signature.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_notes'])

    verification.reviewed_by = admin
    verification.reviewed_at = timezone.now()
    verification.save(update_fields=['reviewed_by', 'reviewed_at', 'updated_at'])
    _sync_agreement_step_status(verification)

    return JsonResponse({'bool': True, 'message': f'Agreement signature {new_status}'})


@csrf_exempt
def admin_activate_teacher_after_verification(request, teacher_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    payload = _extract_request_data(request)
    admin, error = _validate_admin_requester(request, payload)
    if error:
        return error

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    verification = _get_or_create_teacher_verification(teacher)
    _sync_agreement_step_status(verification)

    if verification.id_verification_status != 'approved':
        return JsonResponse({'bool': False, 'message': 'ID verification is not approved'}, status=400)
    if verification.background_check_status != 'approved':
        return JsonResponse({'bool': False, 'message': 'Background check is not approved'}, status=400)
    if verification.agreement_status != 'approved':
        return JsonResponse({'bool': False, 'message': 'All required agreements are not approved'}, status=400)

    teacher.is_approved = True
    teacher.verification_status = 'verified'
    teacher.can_teach_minors = True
    teacher.save(update_fields=['is_approved', 'verification_status', 'can_teach_minors'])

    verification.overall_status = 'approved'
    verification.reviewed_by = admin
    verification.reviewed_at = timezone.now()
    verification.rejection_reason = None
    verification.save(update_fields=['overall_status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'updated_at'])

    return JsonResponse({'bool': True, 'message': 'Teacher activated for teaching after verification'})


@csrf_exempt
def admin_reject_teacher_verification(request, teacher_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    payload = _extract_request_data(request)
    admin, error = _validate_admin_requester(request, payload)
    if error:
        return error

    reason = (payload.get('reason') or '').strip()
    if not reason:
        return JsonResponse({'bool': False, 'message': 'reason is required'}, status=400)

    teacher = models.Teacher.objects.filter(id=teacher_id).first()
    if not teacher:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)

    verification = _get_or_create_teacher_verification(teacher)
    verification.overall_status = 'rejected'
    verification.rejection_reason = reason
    verification.reviewed_by = admin
    verification.reviewed_at = timezone.now()
    verification.save(update_fields=['overall_status', 'rejection_reason', 'reviewed_by', 'reviewed_at', 'updated_at'])

    teacher.is_approved = False
    teacher.verification_status = 'rejected'
    teacher.can_teach_minors = False
    teacher.save(update_fields=['is_approved', 'verification_status', 'can_teach_minors'])

    return JsonResponse({'bool': True, 'message': 'Teacher verification rejected'})


@csrf_exempt
def student_request_parent_link(request, student_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    student = models.Student.objects.filter(id=student_id).first()
    if not student:
        return JsonResponse({'bool': False, 'message': 'Student not found'}, status=404)

    payload = _extract_request_data(request)
    parent_fullname = (payload.get('parent_fullname') or '').strip()
    parent_email = (payload.get('parent_email') or '').strip().lower()
    relationship = (payload.get('relationship') or 'guardian').strip().lower()
    authorization_mode = (payload.get('authorization_mode') or 'pre_authorized').strip().lower()

    if not student.is_minor():
        student.parent_account_required = False
        student.save(update_fields=['parent_account_required'])
        return JsonResponse({'bool': True, 'message': 'Student is not a minor; parental linking not required'})

    if not parent_fullname or not parent_email:
        return JsonResponse({'bool': False, 'message': 'parent_fullname and parent_email are required'}, status=400)
    if relationship not in ['mother', 'father', 'guardian', 'other']:
        return JsonResponse({'bool': False, 'message': 'Invalid relationship'}, status=400)
    if authorization_mode not in ['pre_authorized', 'per_session_login']:
        return JsonResponse({'bool': False, 'message': 'Invalid authorization_mode'}, status=400)

    parent, _ = models.ParentAccount.objects.get_or_create(
        email=parent_email,
        defaults={
            'fullname': parent_fullname,
            'mobile_no': payload.get('parent_mobile_no'),
        }
    )
    if parent.fullname != parent_fullname:
        parent.fullname = parent_fullname
        if payload.get('parent_mobile_no'):
            parent.mobile_no = payload.get('parent_mobile_no')
        parent.save(update_fields=['fullname', 'mobile_no', 'updated_at'])

    link, created = models.StudentParentLink.objects.get_or_create(
        student=student,
        parent=parent,
        defaults={
            'relationship': relationship,
            'status': 'pending',
            'authorization_mode': authorization_mode,
        }
    )

    if not created:
        link.relationship = relationship
        link.authorization_mode = authorization_mode
        if link.status == 'revoked':
            link.status = 'pending'
            link.revoked_at = None
        link.save(update_fields=['relationship', 'authorization_mode', 'status', 'revoked_at', 'updated_at'])

    student.parent_account_required = True
    student.save(update_fields=['parent_account_required'])

    # Send consent email to parent
    email_sent = _send_parental_consent_email(link, student)

    return JsonResponse({
        'bool': True,
        'message': 'Consent request sent to parent\'s email. They will receive a secure link to approve.' if email_sent
                   else 'Parent link created but email could not be sent. You can resend from your profile.',
        'email_sent': email_sent,
        'parent_email': parent.email,
        'student_parent_link_id': link.id,
        'status': link.status,
    })


@csrf_exempt
def resend_parental_consent_email(request, student_id):
    """Resend the parental consent email for a pending link."""
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    student = models.Student.objects.filter(id=student_id).first()
    if not student:
        return JsonResponse({'bool': False, 'message': 'Student not found'}, status=404)

    link = models.StudentParentLink.objects.filter(
        student=student,
        status__in=['pending', 'approved']
    ).select_related('parent').order_by('-created_at').first()

    if not link:
        return JsonResponse({'bool': False, 'message': 'No parent link request found'}, status=404)

    email_sent = _send_parental_consent_email(link, student)
    if email_sent:
        return JsonResponse({'bool': True, 'message': f'Consent email resent to {link.parent.email}'})
    return JsonResponse({'bool': False, 'message': 'Failed to send email. Please try again later.'}, status=500)


def parental_consent_verify(request):
    """GET endpoint — validates the token and returns parent + student details for the consent page."""
    token = request.GET.get('token', '').strip()
    if not token:
        return JsonResponse({'bool': False, 'message': 'Token is required'}, status=400)

    payload, error = _verify_parental_consent_token(token)
    if error:
        return JsonResponse({'bool': False, 'message': error}, status=400)

    link = models.StudentParentLink.objects.filter(id=payload['link_id']).select_related('parent', 'student').first()
    if not link:
        return JsonResponse({'bool': False, 'message': 'Consent request not found'}, status=404)

    if link.parent.email != payload['parent_email']:
        return JsonResponse({'bool': False, 'message': 'Token mismatch'}, status=400)

    student = link.student

    # Get existing consent status if any
    live_consent = models.ParentalConsent.objects.filter(
        parent_link=link, consent_type='live_sessions'
    ).first()

    return JsonResponse({
        'bool': True,
        'student_name': student.fullname,
        'student_email': student.email,
        'student_dob': student.date_of_birth.isoformat() if student.date_of_birth else None,
        'parent_name': link.parent.fullname,
        'parent_email': link.parent.email,
        'relationship': link.relationship,
        'authorization_mode': link.authorization_mode,
        'link_status': link.status,
        'live_sessions_status': live_consent.status if live_consent else 'pending',
        'approved_at': link.approved_at.isoformat() if link.approved_at else None,
    })


@csrf_exempt
def parental_consent_respond(request):
    """POST endpoint — parent approves or denies consent via token."""
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    payload_data = _extract_request_data(request)
    token = (payload_data.get('token') or '').strip()
    decision = (payload_data.get('decision') or '').strip().lower()
    authorization_mode = (payload_data.get('authorization_mode') or 'pre_authorized').strip().lower()
    parent_signature = (payload_data.get('parent_signature') or '').strip()
    deny_reason = (payload_data.get('deny_reason') or '').strip()

    if not token:
        return JsonResponse({'bool': False, 'message': 'Token is required'}, status=400)
    if decision not in ['approve', 'deny']:
        return JsonResponse({'bool': False, 'message': 'decision must be "approve" or "deny"'}, status=400)
    if decision == 'approve' and not parent_signature:
        return JsonResponse({'bool': False, 'message': 'Your signature is required to approve consent'}, status=400)
    if authorization_mode not in ['pre_authorized', 'per_session_login']:
        authorization_mode = 'pre_authorized'

    payload, error = _verify_parental_consent_token(token)
    if error:
        return JsonResponse({'bool': False, 'message': error}, status=400)

    link = models.StudentParentLink.objects.filter(id=payload['link_id']).select_related('parent', 'student').first()
    if not link:
        return JsonResponse({'bool': False, 'message': 'Consent request not found'}, status=404)

    if link.parent.email != payload['parent_email']:
        return JsonResponse({'bool': False, 'message': 'Token mismatch'}, status=400)

    student = link.student

    if decision == 'approve':
        # Approve the link
        link.status = 'approved'
        link.authorization_mode = authorization_mode
        link.approved_at = timezone.now()
        link.revoked_at = None
        link.save(update_fields=['status', 'authorization_mode', 'approved_at', 'revoked_at', 'updated_at'])

        # Mark parent as verified
        link.parent.is_verified = True
        link.parent.save(update_fields=['is_verified', 'updated_at'])

        student.parent_account_required = True
        student.parent_linked_at = timezone.now()
        student.save(update_fields=['parent_account_required', 'parent_linked_at'])

        # Create/update account activation consent
        account_consent, _ = models.ParentalConsent.objects.get_or_create(
            parent_link=link,
            consent_type='account_activation',
            defaults={'status': 'approved', 'approved_at': timezone.now()}
        )
        if account_consent.status != 'approved':
            account_consent.status = 'approved'
            account_consent.approved_at = timezone.now()
            account_consent.revoked_at = None
            account_consent.save(update_fields=['status', 'approved_at', 'revoked_at', 'updated_at'])

        # Create/update live sessions consent
        live_consent, _ = models.ParentalConsent.objects.get_or_create(
            parent_link=link,
            consent_type='live_sessions',
            defaults={'status': 'approved', 'approved_at': timezone.now(),
                      'notes': f'Approved via email consent by {link.parent.fullname}. Signature: "{parent_signature}"'}
        )
        if live_consent.status != 'approved':
            live_consent.status = 'approved'
            live_consent.approved_at = timezone.now()
            live_consent.revoked_at = None
            live_consent.notes = f'Approved via email consent by {link.parent.fullname}. Signature: "{parent_signature}"'
            live_consent.save(update_fields=['status', 'approved_at', 'revoked_at', 'notes', 'updated_at'])

        # Notify student
        _send_parental_consent_approved_email(link, student)

        return JsonResponse({
            'bool': True,
            'message': 'Thank you! Your consent has been recorded. Your child can now participate in live sessions.',
            'status': 'approved',
        })

    else:  # deny
        link.status = 'revoked'
        link.revoked_at = timezone.now()
        link.save(update_fields=['status', 'revoked_at', 'updated_at'])

        # Revoke any existing consents
        models.ParentalConsent.objects.filter(parent_link=link).update(
            status='revoked', revoked_at=timezone.now()
        )

        # Notify student
        _send_parental_consent_denied_email(link, student, deny_reason)

        return JsonResponse({
            'bool': True,
            'message': 'Your response has been recorded. The student has been notified.',
            'status': 'denied',
        })


def student_parent_consent_status(request, student_id):
    """GET endpoint — returns parent link & consent status for the student's profile."""
    student = models.Student.objects.filter(id=student_id).first()
    if not student:
        return JsonResponse({'bool': False, 'message': 'Student not found'}, status=404)

    link = models.StudentParentLink.objects.filter(
        student=student
    ).select_related('parent').order_by('-created_at').first()

    if not link:
        return JsonResponse({
            'bool': True,
            'has_link': False,
            'is_minor': student.is_minor(),
        })

    live_consent = models.ParentalConsent.objects.filter(
        parent_link=link, consent_type='live_sessions'
    ).first()

    return JsonResponse({
        'bool': True,
        'has_link': True,
        'is_minor': student.is_minor(),
        'parent_name': link.parent.fullname,
        'parent_email': link.parent.email,
        'relationship': link.relationship,
        'link_status': link.status,
        'authorization_mode': link.authorization_mode,
        'live_sessions_status': live_consent.status if live_consent else 'pending',
        'approved_at': link.approved_at.isoformat() if link.approved_at else None,
    })


@csrf_exempt
def parent_authorize_student(request, parent_id, student_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    parent = models.ParentAccount.objects.filter(id=parent_id).first()
    student = models.Student.objects.filter(id=student_id).first()
    if not parent or not student:
        return JsonResponse({'bool': False, 'message': 'Parent or student not found'}, status=404)

    link = models.StudentParentLink.objects.filter(parent=parent, student=student).first()
    if not link:
        return JsonResponse({'bool': False, 'message': 'No pending parent link found for this child'}, status=404)

    payload = _extract_request_data(request)
    authorization_mode = (payload.get('authorization_mode') or link.authorization_mode or 'pre_authorized').strip().lower()
    if authorization_mode not in ['pre_authorized', 'per_session_login']:
        return JsonResponse({'bool': False, 'message': 'Invalid authorization_mode'}, status=400)

    link.status = 'approved'
    link.authorization_mode = authorization_mode
    link.approved_at = timezone.now()
    link.revoked_at = None
    link.save(update_fields=['status', 'authorization_mode', 'approved_at', 'revoked_at', 'updated_at'])

    student.parent_account_required = True
    student.parent_linked_at = timezone.now()
    student.save(update_fields=['parent_account_required', 'parent_linked_at'])

    account_consent, _ = models.ParentalConsent.objects.get_or_create(
        parent_link=link,
        consent_type='account_activation',
        defaults={'status': 'approved', 'approved_at': timezone.now()}
    )
    if account_consent.status != 'approved':
        account_consent.status = 'approved'
        account_consent.approved_at = timezone.now()
        account_consent.revoked_at = None
        account_consent.save(update_fields=['status', 'approved_at', 'revoked_at', 'updated_at'])

    live_status = (payload.get('live_sessions_status') or 'pending').strip().lower()
    if live_status not in ['pending', 'approved', 'revoked']:
        live_status = 'pending'
    live_consent, _ = models.ParentalConsent.objects.get_or_create(
        parent_link=link,
        consent_type='live_sessions',
        defaults={'status': live_status, 'approved_at': timezone.now() if live_status == 'approved' else None}
    )
    if live_consent.status != live_status:
        live_consent.status = live_status
        live_consent.approved_at = timezone.now() if live_status == 'approved' else live_consent.approved_at
        if live_status == 'revoked':
            live_consent.revoked_at = timezone.now()
        elif live_status == 'approved':
            live_consent.revoked_at = None
        live_consent.save(update_fields=['status', 'approved_at', 'revoked_at', 'updated_at'])

    return JsonResponse({
        'bool': True,
        'message': 'Parent authorization completed',
        'authorization_mode': link.authorization_mode,
        'live_sessions_status': live_consent.status,
    })


@csrf_exempt
def parent_manage_live_consent(request, parent_id, student_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    parent = models.ParentAccount.objects.filter(id=parent_id).first()
    student = models.Student.objects.filter(id=student_id).first()
    if not parent or not student:
        return JsonResponse({'bool': False, 'message': 'Parent or student not found'}, status=404)

    link = models.StudentParentLink.objects.filter(parent=parent, student=student, status='approved').first()
    if not link:
        return JsonResponse({'bool': False, 'message': 'Approved parent link required'}, status=403)

    payload = _extract_request_data(request)
    consent_status = (payload.get('status') or '').strip().lower()
    authorization_mode = (payload.get('authorization_mode') or link.authorization_mode).strip().lower()

    if consent_status not in ['approved', 'revoked', 'pending']:
        return JsonResponse({'bool': False, 'message': 'status must be approved, revoked, or pending'}, status=400)
    if authorization_mode not in ['pre_authorized', 'per_session_login']:
        return JsonResponse({'bool': False, 'message': 'Invalid authorization_mode'}, status=400)

    expires_at = payload.get('expires_at')
    parsed_expires_at = None
    if expires_at:
        try:
            parsed_expires_at = timezone.datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        except Exception:
            return JsonResponse({'bool': False, 'message': 'expires_at must be ISO datetime'}, status=400)

    link.authorization_mode = authorization_mode
    link.save(update_fields=['authorization_mode', 'updated_at'])

    consent, _ = models.ParentalConsent.objects.get_or_create(
        parent_link=link,
        consent_type='live_sessions'
    )
    consent.status = consent_status
    consent.expires_at = parsed_expires_at
    if consent_status == 'approved':
        consent.approved_at = timezone.now()
        consent.revoked_at = None
    elif consent_status == 'revoked':
        consent.revoked_at = timezone.now()
    consent.notes = payload.get('notes')
    consent.save()

    return JsonResponse({'bool': True, 'message': 'Live session consent updated', 'status': consent.status})


@csrf_exempt
def parent_preauthorize_sessions(request, parent_id, student_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    parent = models.ParentAccount.objects.filter(id=parent_id).first()
    student = models.Student.objects.filter(id=student_id).first()
    if not parent or not student:
        return JsonResponse({'bool': False, 'message': 'Parent or student not found'}, status=404)

    link = models.StudentParentLink.objects.filter(parent=parent, student=student, status='approved').first()
    if not link:
        return JsonResponse({'bool': False, 'message': 'Approved parent link required'}, status=403)

    live_consent = _get_active_live_sessions_consent(link)
    if not live_consent:
        return JsonResponse({'bool': False, 'message': 'Active live session consent required before pre-authorization'}, status=403)

    payload = _extract_request_data(request)
    session_ids_raw = payload.get('session_ids')
    if not session_ids_raw:
        return JsonResponse({'bool': False, 'message': 'session_ids is required'}, status=400)

    if isinstance(session_ids_raw, str):
        try:
            session_ids = json.loads(session_ids_raw)
            if not isinstance(session_ids, list):
                session_ids = [int(session_ids_raw)]
        except Exception:
            session_ids = [int(s.strip()) for s in session_ids_raw.split(',') if s.strip()]
    else:
        session_ids = session_ids_raw if isinstance(session_ids_raw, list) else []

    expires_at = payload.get('expires_at')
    parsed_expires_at = None
    if expires_at:
        try:
            parsed_expires_at = timezone.datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        except Exception:
            return JsonResponse({'bool': False, 'message': 'expires_at must be ISO datetime'}, status=400)

    created_count = 0
    for session_id in session_ids:
        session = models.TeacherSession.objects.filter(id=session_id, student=student).first()
        if not session:
            continue
        _, created = models.SessionAuthorization.objects.update_or_create(
            parent_link=link,
            session=session,
            defaults={
                'student': student,
                'consent': live_consent,
                'status': 'approved',
                'expires_at': parsed_expires_at,
            }
        )
        if created:
            created_count += 1

    return JsonResponse({'bool': True, 'message': 'Sessions pre-authorized', 'created_count': created_count})


def parent_children(request, parent_id):
    parent = models.ParentAccount.objects.filter(id=parent_id).first()
    if not parent:
        return JsonResponse({'bool': False, 'message': 'Parent not found'}, status=404)

    links = models.StudentParentLink.objects.filter(parent=parent).select_related('student')
    children = []
    for link in links:
        live_consent = models.ParentalConsent.objects.filter(parent_link=link, consent_type='live_sessions').first()
        children.append({
            'student_id': link.student_id,
            'student_name': link.student.fullname,
            'student_email': link.student.email,
            'link_status': link.status,
            'authorization_mode': link.authorization_mode,
            'live_sessions_status': live_consent.status if live_consent else 'pending',
            'approved_at': link.approved_at,
        })

    return JsonResponse({'bool': True, 'parent_id': parent.id, 'children': children})


def session_parental_status(request, session_id, student_id):
    student = models.Student.objects.filter(id=student_id).first()
    session = models.TeacherSession.objects.filter(id=session_id, student_id=student_id).first()
    if not student or not session:
        return JsonResponse({'bool': False, 'message': 'Student or session not found'}, status=404)

    if not student.is_minor():
        return JsonResponse({'bool': True, 'requires_parental_consent': False, 'authorized': True})

    link = _get_active_parent_link(student)
    if not link:
        return JsonResponse({'bool': True, 'requires_parental_consent': True, 'authorized': False,
                             'message': 'No approved parent account linked'})

    consent = _get_active_live_sessions_consent(link)
    if not consent:
        return JsonResponse({'bool': True, 'requires_parental_consent': True, 'authorized': False,
                             'message': 'Live session consent not approved'})

    if link.authorization_mode == 'per_session_login':
        session_auth = models.SessionAuthorization.objects.filter(
            parent_link=link,
            session=session,
            status='approved'
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now())
        ).first()
        if not session_auth:
            return JsonResponse({'bool': True, 'requires_parental_consent': True, 'authorized': False,
                                 'message': 'Parent approval required for this specific session'})

    return JsonResponse({'bool': True, 'requires_parental_consent': True, 'authorized': True,
                         'authorization_mode': link.authorization_mode})


def admin_minors_consent_status(request):
    admin, error = _validate_admin_requester(request)
    if error:
        return error

    students = models.Student.objects.filter(date_of_birth__isnull=False)
    minor_rows = []
    for student in students:
        if not student.is_minor():
            continue
        link = _get_active_parent_link(student)
        live_consent = _get_active_live_sessions_consent(link) if link else None
        minor_rows.append({
            'student_id': student.id,
            'student_name': student.fullname,
            'student_email': student.email,
            'parent_required': student.parent_account_required,
            'parent_linked_at': student.parent_linked_at,
            'parent_link_status': link.status if link else 'missing',
            'parent_name': link.parent.fullname if link else None,
            'authorization_mode': link.authorization_mode if link else None,
            'live_sessions_status': live_consent.status if live_consent else 'missing',
        })

    log_activity(request, 'view', f'Admin {admin.full_name} viewed minor consent status dashboard',
                 model_name='Student', admin=admin)
    return JsonResponse({'bool': True, 'total_minors': len(minor_rows), 'minors': minor_rows})


# Admin manage all students
class AdminStudentList(generics.ListAPIView):
    queryset = models.Student.objects.all()
    serializer_class = StudentSerializer
    pagination_class = StandardResultSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        if 'search' in self.request.GET:
            search = self.request.GET['search']
            qs = qs.filter(
                Q(fullname__icontains=search) |
                Q(email__icontains=search)
            )
        return qs


# Admin manage all courses
class AdminCourseList(generics.ListAPIView):
    queryset = models.Course.objects.all()
    serializer_class = CourseSerializer
    pagination_class = StandardResultSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        if 'search' in self.request.GET:
            search = self.request.GET['search']
            qs = qs.filter(title__icontains=search)
        if 'category' in self.request.GET:
            qs = qs.filter(category_id=self.request.GET['category'])
        if 'teacher' in self.request.GET:
            qs = qs.filter(teacher_id=self.request.GET['teacher'])
        return qs


@csrf_exempt
def admin_delete_course(request, course_id):
    """Delete a course and all its related data (admin only)"""
    try:
        course = models.Course.objects.get(id=course_id)
        print(f'=== DELETING COURSE ===')
        print(f'Course ID: {course_id}, Title: {course.title}')
        
        # Delete all related records to avoid foreign key constraint errors
        # Get all chapters for this course first
        chapters = models.Chapter.objects.filter(course=course)
        chapter_ids = list(chapters.values_list('id', flat=True))
        print(f'Found {len(chapter_ids)} chapters to delete')
        
        # Delete lesson progress records for lessons in these chapters
        if chapter_ids:
            deleted_progress, _ = models.LessonProgress.objects.filter(lesson__chapter_id__in=chapter_ids).delete()
            print(f'Deleted {deleted_progress} lesson progress records')
        
        # Delete student assignments related to this course
        deleted_assignments, _ = models.StudentAssignment.objects.filter(chapter__course=course).delete()
        print(f'Deleted {deleted_assignments} student assignments')
        
        # Delete student enrollments
        deleted_enrollments, _ = models.StudentCourseEnrollment.objects.filter(course=course).delete()
        print(f'Deleted {deleted_enrollments} enrollments')
        
        # Delete course ratings
        deleted_ratings, _ = models.CourseRating.objects.filter(course=course).delete()
        print(f'Deleted {deleted_ratings} ratings')
        
        # Delete student favorite courses
        deleted_favorites, _ = models.StudentFavoriteCourse.objects.filter(course=course).delete()
        print(f'Deleted {deleted_favorites} favorite records')
        
        # Delete chapters and their lessons (cascades automatically if set)
        deleted_chapters, _ = models.Chapter.objects.filter(course=course).delete()
        print(f'Deleted {deleted_chapters} chapters and related lessons')
        
        # Finally delete the course
        course_title = course.title
        course.delete()
        print(f'Successfully deleted course: {course_title}')
        
        log_activity(request, 'delete', f'Course "{course_title}" deleted with all related data',
                     model_name='Course', object_id=course_id)
        
        return JsonResponse({
            'bool': True, 
            'message': f'Course "{course_title}" and all its contents have been deleted successfully'
        })
    except models.Course.DoesNotExist:
        print(f'Course {course_id} not found')
        return JsonResponse({
            'bool': False, 
            'message': 'Course not found'
        }, status=404)
    except Exception as e:
        print(f'Error deleting course: {str(e)}')
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'bool': False, 
            'message': f'Error deleting course: {str(e)}'
        }, status=500)


class AdminCourseCreate(generics.CreateAPIView):
    """Admin create course"""
    queryset = models.Course.objects.all()
    serializer_class = CourseSerializer
    
    def create(self, request, *args, **kwargs):
        print('=' * 50)
        print('COURSE CREATE REQUEST')
        print('=' * 50)
        print(f'Data: {request.data}')
        print(f'Content-Type: {request.content_type}')
        
        # Handle category_name field - convert to category ID
        data = request.data.copy()
        if 'category_name' in data:
            category_name = data.get('category_name', '').strip()
            if not category_name:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'category': ['Category name cannot be empty']})
            
            # Try to find existing category, or create new one
            category, created = models.CourseCategory.objects.get_or_create(
                title__iexact=category_name,
                defaults={'title': category_name, 'description': f'Category for {category_name} courses'}
            )
            data['category'] = category.id
            print(f'Category: {category.title} (id: {category.id}) - Created: {created}')
        
        request._full_data = data
        
        # Try to create with better error logging
        try:
            response = super().create(request, *args, **kwargs)
            log_activity(request, 'create', f'Course "{response.data.get("title", "")}" created',
                         model_name='Course', object_id=response.data.get('id'))
            return response
        except Exception as e:
            print(f'ERROR: {str(e)}')
            import traceback
            traceback.print_exc()
            raise


class AdminCourseDetail(generics.RetrieveUpdateDestroyAPIView):
    """Admin view/edit/delete single course"""
    queryset = models.Course.objects.all()
    serializer_class = CourseSerializer
    
    def update(self, request, *args, **kwargs):
        # Handle category_name field - convert to category ID
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'category_name' in data:
            category_name = data.get('category_name', '').strip()
            if category_name:
                # Try to find existing category, or create new one
                category, created = models.CourseCategory.objects.get_or_create(
                    title__iexact=category_name,
                    defaults={'title': category_name, 'description': f'Category for {category_name} courses'}
                )
                data['category'] = category.id
                print(f'Updated Category: {category.title} (id: {category.id}) - Created: {created}')
        
        # Update the request data with the modified data
        if isinstance(request.data, dict):
            request.data.update(data)
        else:
            request._full_data = data
        
        print(f'=== COURSE UPDATE ===')
        print(f'Course ID: {kwargs.get("pk")}')
        print(f'Update Data: {dict(data)}')
        
        response = super().update(request, *args, **kwargs)
        log_activity(request, 'update', f'Course "{response.data.get("title", "")}" updated',
                     model_name='Course', object_id=kwargs.get('pk'))
        return response


# ==================== ENHANCED STUDENT DASHBOARD VIEWS ====================

from . serializers import (
    WeeklyGoalSerializer, LessonProgressSerializer,
    CourseProgressSerializer, DailyLearningActivitySerializer, AchievementSerializer,
    StudentAchievementSerializer, EnhancedStudentDashboardSerializer
)


class EnhancedStudentDashboard(APIView):
    """Comprehensive student dashboard with all metrics"""
    
    def get(self, request, student_id):
        from datetime import date, timedelta
        
        try:
            student = models.Student.objects.get(pk=student_id)
        except models.Student.DoesNotExist:
            return JsonResponse({'error': 'Student not found'}, status=404)
        
        # Basic stats
        enrolled_courses = models.StudentCourseEnrollment.objects.filter(student=student).count()
        favorite_courses = models.StudentFavoriteCourse.objects.filter(student=student).count()
        
        # Course progress stats
        course_progress_qs = models.CourseProgress.objects.filter(student=student)
        courses_completed = course_progress_qs.filter(is_completed=True).count()
        courses_in_progress = course_progress_qs.filter(is_completed=False, progress_percentage__gt=0).count()
        
        # Overall progress
        total_progress = course_progress_qs.aggregate(avg=Avg('progress_percentage'))['avg'] or 0
        
        # Total learning time
        total_time = course_progress_qs.aggregate(total=Sum('total_time_spent_seconds'))['total'] or 0
        hours = total_time // 3600
        minutes = (total_time % 3600) // 60
        time_formatted = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
        # Weekly goal
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        try:
            weekly_goal = models.WeeklyGoal.objects.filter(
                student=student,
                week_start__lte=today,
                week_end__gte=today
            ).first()
            
            if weekly_goal:
                # Update current_value from actual progress
                weekly_goal.update_current_value()
                weekly_goal_data = {
                    'id': weekly_goal.id,
                    'goal_type': weekly_goal.goal_type,
                    'target_value': weekly_goal.target_value,
                    'current_value': weekly_goal.current_value,
                    'progress_percentage': weekly_goal.progress_percentage(),
                    'is_achieved': weekly_goal.is_achieved
                }
            else:
                weekly_goal_data = {
                    'goal_type': 'lessons',
                    'target_value': 5,
                    'current_value': 0,
                    'progress_percentage': 0,
                    'is_achieved': False
                }
        except:
            weekly_goal_data = {
                'goal_type': 'lessons',
                'target_value': 5,
                'current_value': 0,
                'progress_percentage': 0,
                'is_achieved': False
            }
        
        # Recent courses (last accessed)
        recent_progress = models.CourseProgress.objects.filter(
            student=student
        ).select_related('course', 'course__teacher').order_by('-last_accessed')[:5]
        
        recent_courses = [{
            'id': cp.course.id,
            'title': cp.course.title,
            'featured_img': cp.course.featured_img.url if cp.course.featured_img else None,
            'teacher': cp.course.teacher.full_name,
            'progress_percentage': cp.progress_percentage,
            'completed_chapters': cp.completed_chapters,
            'total_chapters': cp.total_chapters,
            'last_accessed': cp.last_accessed.strftime('%Y-%m-%d %H:%M')
        } for cp in recent_progress]
        
        # Recent achievements
        recent_achievements = models.StudentAchievement.objects.filter(
            student=student
        ).select_related('achievement').order_by('-earned_at')[:5]
        
        achievements_data = [{
            'id': sa.achievement.id,
            'name': sa.achievement.name,
            'description': sa.achievement.description,
            'icon': sa.achievement.icon.url if sa.achievement.icon else None,
            'earned_at': sa.earned_at.strftime('%Y-%m-%d')
        } for sa in recent_achievements]
        
        return JsonResponse({
            'enrolled_courses': enrolled_courses,
            'favorite_courses': favorite_courses,
            'total_learning_time_seconds': total_time,
            'total_learning_time_formatted': time_formatted,
            'courses_completed': courses_completed,
            'courses_in_progress': courses_in_progress,
            'overall_progress_percentage': int(total_progress),
            'weekly_goal': weekly_goal_data,
            'recent_courses': recent_courses,
            'recent_achievements': achievements_data
        })


class StudentStreakCalendar(APIView):
    """Get student's streak calendar and activity data"""
    
    def get(self, request, student_id):
        from datetime import date, timedelta
        from collections import defaultdict
        
        try:
            student = models.Student.objects.get(pk=student_id)
        except models.Student.DoesNotExist:
            return JsonResponse({'error': 'Student not found'}, status=404)
        
        today = date.today()
        
        # Get activity data for the last 90 days (about 3 months)
        start_date = today - timedelta(days=90)
        
        # Get completed lessons with dates
        completed_lessons = models.ModuleLessonProgress.objects.filter(
            student=student,
            is_completed=True,
            completed_at__date__gte=start_date
        ).values_list('completed_at__date', flat=True)
        
        # Also get lesson progress activity (viewed_at for partial progress)
        activity_dates = models.ModuleLessonProgress.objects.filter(
            student=student,
            viewed_at__date__gte=start_date
        ).values_list('viewed_at__date', flat=True)
        
        # Create activity map (date -> activity level: 0-4)
        activity_count = defaultdict(int)
        for d in completed_lessons:
            if d:
                activity_count[d.strftime('%Y-%m-%d')] += 2  # Completed = higher weight
        for d in activity_dates:
            if d:
                activity_count[d.strftime('%Y-%m-%d')] += 1
        
        # Normalize to 0-4 scale
        calendar_data = {}
        for date_str, count in activity_count.items():
            if count >= 5:
                calendar_data[date_str] = 4  # Very high activity
            elif count >= 3:
                calendar_data[date_str] = 3  # High activity
            elif count >= 2:
                calendar_data[date_str] = 2  # Medium activity
            else:
                calendar_data[date_str] = 1  # Low activity
        
        # Calculate current streak
        current_streak = 0
        check_date = today
        unique_activity_dates = set(activity_count.keys())
        
        while True:
            date_str = check_date.strftime('%Y-%m-%d')
            if date_str in unique_activity_dates:
                current_streak += 1
                check_date -= timedelta(days=1)
            elif check_date == today:
                # Allow for today not having activity yet
                check_date -= timedelta(days=1)
            else:
                break
        
        # Calculate longest streak
        all_dates = sorted([date.fromisoformat(d) for d in unique_activity_dates])
        longest_streak = 0
        temp_streak = 0
        prev_date = None
        
        for d in all_dates:
            if prev_date is None or (d - prev_date).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
            prev_date = d
        longest_streak = max(longest_streak, temp_streak)
        
        # Total active days
        total_active_days = len(unique_activity_dates)
        
        # This week's activity
        week_start = today - timedelta(days=today.weekday())
        this_week_active = sum(1 for d in unique_activity_dates 
                              if date.fromisoformat(d) >= week_start)
        
        return JsonResponse({
            'calendar_data': calendar_data,
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'total_active_days': total_active_days,
            'this_week_active': this_week_active,
            'today': today.strftime('%Y-%m-%d'),
            'start_date': start_date.strftime('%Y-%m-%d')
        })


class StudentAllAchievements(APIView):
    """Get all achievements with student's progress"""
    
    def get(self, request, student_id):
        try:
            student = models.Student.objects.get(pk=student_id)
        except models.Student.DoesNotExist:
            return JsonResponse({'error': 'Student not found'}, status=404)
        
        # Get all available achievements
        all_achievements = models.Achievement.objects.filter(is_active=True)
        
        # Get student's earned achievements
        earned = models.StudentAchievement.objects.filter(student=student).values_list('achievement_id', flat=True)
        earned_set = set(earned)
        
        # Calculate total points
        total_points = models.StudentAchievement.objects.filter(
            student=student
        ).aggregate(total=Sum('achievement__points'))['total'] or 0
        
        achievements_data = []
        for achievement in all_achievements:
            earned_record = None
            if achievement.id in earned_set:
                earned_record = models.StudentAchievement.objects.get(
                    student=student, achievement=achievement
                )
            
            achievements_data.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'icon': achievement.icon.url if achievement.icon else None,
                'achievement_type': achievement.achievement_type,
                'requirement_value': achievement.requirement_value,
                'points': achievement.points,
                'is_earned': achievement.id in earned_set,
                'earned_at': earned_record.earned_at.strftime('%Y-%m-%d %H:%M') if earned_record else None
            })
        
        # Sort: earned first, then by type
        achievements_data.sort(key=lambda x: (not x['is_earned'], x['achievement_type']))
        
        return JsonResponse({
            'achievements': achievements_data,
            'total_earned': len(earned_set),
            'total_available': len(all_achievements),
            'total_points': total_points,
            'completion_percentage': round((len(earned_set) / len(all_achievements)) * 100) if all_achievements else 0
        })


class WeeklyGoalList(generics.ListCreateAPIView):
    """List and create weekly goals"""
    serializer_class = WeeklyGoalSerializer
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        return models.WeeklyGoal.objects.filter(student_id=student_id)


class WeeklyGoalDetail(generics.RetrieveUpdateAPIView):
    """Get or update a specific weekly goal"""
    queryset = models.WeeklyGoal.objects.all()
    serializer_class = WeeklyGoalSerializer


@csrf_exempt
def create_weekly_goal(request, student_id):
    """Create or update this week's goal"""
    from datetime import date, timedelta
    import json
    
    try:
        student = models.Student.objects.get(pk=student_id)
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        if request.method == 'POST':
            data = json.loads(request.body) if request.body else {}
            goal_type = data.get('goal_type', 'lessons')
            target_value = data.get('target_value', 5)
            
            goal, created = models.WeeklyGoal.objects.update_or_create(
                student=student,
                week_start=week_start,
                week_end=week_end,
                defaults={
                    'goal_type': goal_type,
                    'target_value': target_value
                }
            )
            
            # Update current_value based on actual progress
            goal.update_current_value()
            
            return JsonResponse({
                'bool': True,
                'goal': {
                    'id': goal.id,
                    'goal_type': goal.goal_type,
                    'target_value': goal.target_value,
                    'current_value': goal.current_value,
                    'progress_percentage': goal.progress_percentage(),
                    'is_achieved': goal.is_achieved
                }
            })
    except models.Student.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Student not found'})
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)})


class LessonProgressList(generics.ListAPIView):
    """List lesson progress for a student"""
    serializer_class = LessonProgressSerializer
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        course_id = self.kwargs.get('course_id', None)
        qs = models.LessonProgress.objects.filter(student_id=student_id)
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs


@csrf_exempt
def update_lesson_progress(request, student_id, chapter_id):
    """Update progress for a specific lesson/chapter"""
    from django.utils import timezone
    import json
    
    try:
        student = models.Student.objects.get(pk=student_id)
        chapter = models.Chapter.objects.get(pk=chapter_id)
        course = chapter.course
        
        if request.method == 'POST':
            data = json.loads(request.body) if request.body else {}
            progress_percentage = data.get('progress_percentage', 0)
            time_spent = data.get('time_spent_seconds', 0)
            last_position = data.get('last_position_seconds', 0)
            
            lesson_progress, created = models.LessonProgress.objects.get_or_create(
                student=student,
                chapter=chapter,
                course=course
            )
            
            lesson_progress.progress_percentage = max(lesson_progress.progress_percentage, progress_percentage)
            lesson_progress.time_spent_seconds += time_spent
            lesson_progress.last_position_seconds = last_position
            
            if progress_percentage >= 90 and not lesson_progress.is_completed:
                lesson_progress.is_completed = True
                lesson_progress.completed_at = timezone.now()
                
                # Update weekly goal if applicable
                today = timezone.now().date()
                from datetime import timedelta
                week_start = today - timedelta(days=today.weekday())
                week_end = week_start + timedelta(days=6)
                
                goal = models.WeeklyGoal.objects.filter(
                    student=student,
                    week_start=week_start,
                    week_end=week_end
                ).first()
                
                if goal:
                    # Update current value based on actual progress
                    goal.update_current_value()
            
            lesson_progress.save()
            
            # Check if any new achievements were earned when lesson is completed
            if lesson_progress.is_completed:
                try:
                    # Check for first_steps achievements (lessons/chapters completed)
                    # Count distinct chapters that are marked as completed
                    lessons_completed = models.LessonProgress.objects.filter(
                        student=student,
                        is_completed=True
                    ).count()
                    
                    # If no lesson progress records, count completed courses as chapters
                    if lessons_completed == 0:
                        lessons_completed = models.CourseProgress.objects.filter(
                            student=student,
                            is_completed=True
                        ).count()
                    
                    first_steps_achievements = models.Achievement.objects.filter(
                        achievement_type='first_steps',
                        is_active=True
                    )
                    for achievement in first_steps_achievements:
                        if lessons_completed >= achievement.requirement_value:
                            models.StudentAchievement.objects.get_or_create(
                                student=student,
                                achievement=achievement
                            )
                except:
                    pass  # Silently fail if achievement check has issues
            
            # Update course progress
            course_progress, cp_created = models.CourseProgress.objects.get_or_create(
                student=student,
                course=course
            )
            course_progress.update_progress()
            
            # Log daily activity
            today = timezone.now().date()
            daily_activity, da_created = models.DailyLearningActivity.objects.get_or_create(
                student=student,
                date=today
            )
            daily_activity.total_time_seconds += time_spent
            if lesson_progress.is_completed and not da_created:
                daily_activity.lessons_completed += 1
            daily_activity.save()
            
            return JsonResponse({
                'bool': True,
                'lesson_progress': {
                    'progress_percentage': lesson_progress.progress_percentage,
                    'is_completed': lesson_progress.is_completed,
                    'time_spent_seconds': lesson_progress.time_spent_seconds
                },
                'course_progress': {
                    'progress_percentage': course_progress.progress_percentage,
                    'completed_chapters': course_progress.completed_chapters,
                    'total_chapters': course_progress.total_chapters
                }
            })
            
    except models.Student.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Student not found'})
    except models.Chapter.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Chapter not found'})
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)})


class CourseProgressList(generics.ListAPIView):
    """List all course progress for a student"""
    serializer_class = CourseProgressSerializer
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        return models.CourseProgress.objects.filter(student_id=student_id).select_related('course')


class CourseProgressDetail(generics.RetrieveAPIView):
    """Get progress for a specific course"""
    serializer_class = CourseProgressSerializer
    
    def get_object(self):
        student_id = self.kwargs.get('student_id')
        course_id = self.kwargs.get('course_id')
        return models.CourseProgress.objects.get(student_id=student_id, course_id=course_id)


class DailyActivityList(generics.ListAPIView):
    """Get daily learning activity for charts"""
    serializer_class = DailyLearningActivitySerializer
    
    def get_queryset(self):
        from datetime import date, timedelta
        student_id = self.kwargs.get('student_id')
        days = int(self.request.GET.get('days', 7))
        start_date = date.today() - timedelta(days=days)
        return models.DailyLearningActivity.objects.filter(
            student_id=student_id,
            date__gte=start_date
        ).order_by('date')


class AchievementList(generics.ListAPIView):
    """List all achievements"""
    serializer_class = AchievementSerializer
    queryset = models.Achievement.objects.filter(is_active=True)


class StudentAchievementList(generics.ListAPIView):
    """List achievements earned by a student"""
    serializer_class = StudentAchievementSerializer
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        return models.StudentAchievement.objects.filter(student_id=student_id)


def check_and_award_achievements(student):
    """Helper function to check and award achievements for a student.
    
    Awards generic achievements based on:
    - Lessons completed (total across all courses)
    - Courses enrolled
    - Courses completed at 100%
    
    Returns a list of newly awarded achievements (dict with name, description, points).
    Can be called from any view without request context.
    """
    try:
        new_achievements = []
        
        # LESSON ACHIEVEMENTS - Count total lessons completed
        lessons_completed = models.ModuleLessonProgress.objects.filter(
            student=student,
            is_completed=True
        ).count()
        
        lesson_achievements = [
            ('First Steps', 1),
            ('Lesson Lover', 5),
            ('Lesson Master', 10),
            ('Lesson Legend', 25),
            ('Lesson Warrior', 50),
        ]
        
        for ach_name, required_lessons in lesson_achievements:
            if lessons_completed >= required_lessons:
                achievement = models.Achievement.objects.filter(
                    name=ach_name,
                    is_active=True
                ).first()
                
                if achievement:
                    earned, created = models.StudentAchievement.objects.get_or_create(
                        student=student,
                        achievement=achievement
                    )
                    if created:
                        new_achievements.append({
                            'name': achievement.name,
                            'description': achievement.description,
                            'points': achievement.points
                        })
        
        # ENROLLMENT ACHIEVEMENTS - Count courses the student is enrolled in
        courses_enrolled = models.StudentCourseEnrollment.objects.filter(
            student=student
        ).count()
        
        enrollment_achievements = [
            ('Versatile Learner', 1),
            ('Music Explorer', 3),
            ('Course Collector', 5),
        ]
        
        for ach_name, required_courses in enrollment_achievements:
            if courses_enrolled >= required_courses:
                achievement = models.Achievement.objects.filter(
                    name=ach_name,
                    is_active=True
                ).first()
                
                if achievement:
                    earned, created = models.StudentAchievement.objects.get_or_create(
                        student=student,
                        achievement=achievement
                    )
                    if created:
                        new_achievements.append({
                            'name': achievement.name,
                            'description': achievement.description,
                            'points': achievement.points
                        })
        
        # COMPLETION ACHIEVEMENTS - Count courses completed at 100%
        courses_completed = models.CourseProgress.objects.filter(
            student=student,
            progress_percentage=100
        ).count()
        
        completion_achievements = [
            ('First Finish', 1),
            ('Finisher', 3),
            ('Completion Master', 5),
        ]
        
        for ach_name, required_completions in completion_achievements:
            if courses_completed >= required_completions:
                achievement = models.Achievement.objects.filter(
                    name=ach_name,
                    is_active=True
                ).first()
                
                if achievement:
                    earned, created = models.StudentAchievement.objects.get_or_create(
                        student=student,
                        achievement=achievement
                    )
                    if created:
                        new_achievements.append({
                            'name': achievement.name,
                            'description': achievement.description,
                            'points': achievement.points
                        })
        
        return new_achievements
    except Exception as e:
        print(f"[Achievements] Error checking achievements for student {student.id}: {e}")
        import traceback
        traceback.print_exc()
        return []


@csrf_exempt
def check_achievements(request, student_id):
    """API endpoint to check and award achievements for a student"""
    try:
        student = models.Student.objects.get(pk=student_id)
        new_achievements = check_and_award_achievements(student)
        return JsonResponse({
            'bool': True,
            'new_achievements': new_achievements,
            'message': f'{len(new_achievements)} new achievement(s) awarded' if new_achievements else 'No new achievements'
        })
    except models.Student.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Student not found'}, status=404)
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)}, status=400)


# ==================== ENHANCED TEACHER DASHBOARD VIEWS ====================

from . serializers import (
    TeacherStudentSerializer, TeacherSessionSerializer, TeacherActivitySerializer,
    LessonSerializer, LessonMaterialSerializer,
    TeacherDashboardMetricsSerializer, TeacherOverviewSerializer
)


class TeacherOverviewDashboard(APIView):
    """Comprehensive teacher dashboard overview with real metrics only"""
    
    def get(self, request, teacher_id):
        from datetime import date, timedelta
        from django.utils import timezone
        from django.db.models import Avg, Sum

        teacher, blocked_response = _require_approved_teacher(teacher_id)
        if blocked_response:
            return blocked_response
        
        now = timezone.now()
        last_month = now - timedelta(days=30)
        last_week = now - timedelta(days=7)
        today = date.today()
        
        # ── Total Students ──
        # Count from TeacherStudent model first, then fall back to distinct enrollment students
        total_students = models.TeacherStudent.objects.filter(teacher=teacher).count()
        if total_students == 0:
            total_students = models.StudentCourseEnrollment.objects.filter(
                course__teacher=teacher
            ).values('student').distinct().count()
        
        # Students added in last 30 days
        new_students_this_month = models.TeacherStudent.objects.filter(
            teacher=teacher, assigned_at__gte=last_month
        ).count()
        if new_students_this_month == 0:
            new_students_this_month = models.StudentCourseEnrollment.objects.filter(
                course__teacher=teacher, enrolled_time__gte=last_month
            ).values('student').distinct().count()
        
        # ── Courses ──
        total_courses = models.Course.objects.filter(teacher=teacher).count()
        
        # ── Total Chapters & Lessons ──
        total_chapters = models.Chapter.objects.filter(course__teacher=teacher).count()
        total_module_lessons = models.ModuleLesson.objects.filter(module__course__teacher=teacher).count()
        
        # Lesson Library items
        lesson_library_count = models.Lesson.objects.filter(teacher=teacher, is_published=True).count()
        
        # ── Enrollments ──
        total_enrollments = models.StudentCourseEnrollment.objects.filter(
            course__teacher=teacher
        ).count()
        active_enrollments = models.StudentCourseEnrollment.objects.filter(
            course__teacher=teacher, is_active=True
        ).count()
        new_enrollments_this_week = models.StudentCourseEnrollment.objects.filter(
            course__teacher=teacher, enrolled_time__gte=last_week
        ).count()
        
        # ── Completion Rate ──
        completed_count = models.CourseProgress.objects.filter(
            course__teacher=teacher, is_completed=True
        ).count()
        completion_rate = round((completed_count / total_enrollments * 100), 1) if total_enrollments > 0 else 0
        
        # Average progress across all enrollments (from CourseProgress for accuracy)
        avg_progress = models.CourseProgress.objects.filter(
            course__teacher=teacher
        ).aggregate(avg=Avg('progress_percentage'))['avg'] or 0
        
        # ── Recent Activities (real only) ──
        recent_activities = models.TeacherActivity.objects.filter(
            teacher=teacher
        ).select_related('student').order_by('-created_at')[:10]
        
        icon_map = {
            'lesson_completed': 'check',
            'assignment_submitted': 'document',
            'course_started': 'play',
            'comment_added': 'comment',
            'material_downloaded': 'download',
            'session_attended': 'calendar',
            'course_completed': 'trophy',
            'enrolled': 'person-plus',
        }
        
        activities_data = [{
            'id': a.id,
            'student_name': a.student.fullname if a.student else 'Unknown',
            'student_profile_img': a.student.profile_img.url if a.student and a.student.profile_img else None,
            'activity_type': a.activity_type,
            'target_name': a.target_name,
            'target_id': a.target_id,
            'time_ago': a.time_ago,
            'icon_type': icon_map.get(a.activity_type, 'default')
        } for a in recent_activities]
        
        # If no TeacherActivity records, build activity feed from real events
        if not activities_data:
            from django.utils.timesince import timesince
            raw_events = []
            
            # Lesson completions
            completed_lessons = models.ModuleLessonProgress.objects.filter(
                lesson__module__course__teacher=teacher,
                is_completed=True
            ).select_related('student', 'lesson', 'lesson__module__course').order_by('-completed_at')[:10]
            for lp in completed_lessons:
                raw_events.append({
                    'id': f'lp-{lp.id}',
                    'student_name': lp.student.fullname,
                    'student_profile_img': lp.student.profile_img.url if lp.student.profile_img else None,
                    'activity_type': 'lesson_completed',
                    'target_name': lp.lesson.title,
                    'target_id': lp.lesson.module.course.id if lp.lesson.module else None,
                    'time_ago': timesince(lp.completed_at) + ' ago' if lp.completed_at else 'recently',
                    'icon_type': 'check',
                    'sort_time': lp.completed_at or lp.viewed_at,
                })
            
            # Course completions
            completed_courses = models.CourseProgress.objects.filter(
                course__teacher=teacher,
                is_completed=True
            ).select_related('student', 'course').order_by('-completed_at')[:10]
            for cp in completed_courses:
                raw_events.append({
                    'id': f'cp-{cp.id}',
                    'student_name': cp.student.fullname,
                    'student_profile_img': cp.student.profile_img.url if cp.student.profile_img else None,
                    'activity_type': 'course_completed',
                    'target_name': cp.course.title,
                    'target_id': cp.course.id,
                    'time_ago': timesince(cp.completed_at) + ' ago' if cp.completed_at else 'recently',
                    'icon_type': 'trophy',
                    'sort_time': cp.completed_at or cp.started_at,
                })
            
            # Enrollments
            recent_enroll_activities = models.StudentCourseEnrollment.objects.filter(
                course__teacher=teacher
            ).select_related('student', 'course').order_by('-enrolled_time')[:10]
            for e in recent_enroll_activities:
                raw_events.append({
                    'id': f'en-{e.id}',
                    'student_name': e.student.fullname,
                    'student_profile_img': e.student.profile_img.url if e.student.profile_img else None,
                    'activity_type': 'enrolled',
                    'target_name': e.course.title,
                    'target_id': e.course.id,
                    'time_ago': timesince(e.enrolled_time) + ' ago' if e.enrolled_time else 'recently',
                    'icon_type': 'person-plus',
                    'sort_time': e.enrolled_time,
                })
            
            # Sort all events by time (most recent first), take top 10
            raw_events.sort(key=lambda x: x['sort_time'] or now, reverse=True)
            activities_data = [{k: v for k, v in evt.items() if k != 'sort_time'} for evt in raw_events[:10]]
        
        # ── Upcoming Sessions (real only) ──
        upcoming_sessions = models.TeacherSession.objects.filter(
            teacher=teacher,
            scheduled_date__gte=today,
            status__in=['confirmed', 'pending']
        ).select_related('student').order_by('scheduled_date', 'scheduled_time')[:5]
        
        sessions_data = [{
            'id': s.id,
            'student_name': s.student.fullname if s.student else 'Unknown',
            'student_profile_img': s.student.profile_img.url if s.student and s.student.profile_img else None,
            'title': s.title,
            'scheduled_date': s.scheduled_date.strftime('%Y-%m-%d'),
            'scheduled_time': s.scheduled_time.strftime('%H:%M'),
            'status': s.status,
            'duration_minutes': s.duration_minutes,
        } for s in upcoming_sessions]
        
        # ── Recent Enrollments (latest 5) ──
        recent_enrollments = models.StudentCourseEnrollment.objects.filter(
            course__teacher=teacher
        ).select_related('student', 'course').order_by('-enrolled_time')[:5]
        
        recent_enrollments_data = []
        for e in recent_enrollments:
            cp = models.CourseProgress.objects.filter(student=e.student, course=e.course).first()
            real_progress = cp.progress_percentage if cp else e.progress_percent
            recent_enrollments_data.append({
                'student_name': e.student.fullname,
                'student_profile_img': e.student.profile_img.url if e.student.profile_img else None,
                'course_title': e.course.title,
                'enrolled_time': e.enrolled_time.strftime('%Y-%m-%d %H:%M') if e.enrolled_time else None,
                'progress_percent': real_progress,
            })
        
        # ── Top Courses by enrollment ──
        teacher_courses = models.Course.objects.filter(teacher=teacher)
        courses_data = []
        for course in teacher_courses:
            enroll_count = models.StudentCourseEnrollment.objects.filter(course=course).count()
            chapter_count = models.Chapter.objects.filter(course=course).count()
            lesson_count = models.ModuleLesson.objects.filter(module__course=course).count()
            avg_prog = models.CourseProgress.objects.filter(
                course=course
            ).aggregate(avg=Avg('progress_percentage'))['avg'] or 0
            courses_data.append({
                'id': course.id,
                'title': course.title,
                'featured_img': course.featured_img.url if course.featured_img else None,
                'total_enrolled': enroll_count,
                'chapter_count': chapter_count,
                'lesson_count': lesson_count,
                'avg_progress': round(avg_prog, 1),
            })
        courses_data.sort(key=lambda x: x['total_enrolled'], reverse=True)
        
        return Response({
            'teacher_id': teacher.id,
            'teacher_name': teacher.full_name,
            'teacher_profile_img': teacher.profile_img.url if teacher.profile_img else None,
            
            # Metrics
            'total_students': total_students,
            'total_courses': total_courses,
            'total_chapters': total_chapters,
            'total_lessons': total_module_lessons,
            'lesson_library_count': lesson_library_count,
            'total_enrollments': total_enrollments,
            'active_enrollments': active_enrollments,
            'completed_courses': completed_count,
            'completion_rate': completion_rate,
            'avg_progress': round(avg_progress, 1),
            
            # Trends
            'new_students_this_month': new_students_this_month,
            'new_enrollments_this_week': new_enrollments_this_week,
            
            # Lists
            'recent_activities': activities_data,
            'upcoming_sessions': sessions_data,
            'recent_enrollments': recent_enrollments_data,
            'courses': courses_data,
        })


class TeacherStudentList(generics.ListCreateAPIView):
    """List and manage teacher's students"""
    serializer_class = TeacherStudentSerializer
    
    def get_queryset(self):
        teacher_id = self.kwargs.get('teacher_id')
        qs = models.TeacherStudent.objects.filter(teacher_id=teacher_id)
        
        # Search filter
        search = self.request.GET.get('search', '')
        if search:
            qs = qs.filter(
                Q(student__fullname__icontains=search) |
                Q(student__email__icontains=search)
            )
        
        # Instrument filter
        instrument = self.request.GET.get('instrument', '')
        if instrument:
            qs = qs.filter(instrument=instrument)
        
        # Level filter
        level = self.request.GET.get('level', '')
        if level:
            qs = qs.filter(level=level)
        
        # Status filter
        status = self.request.GET.get('status', '')
        if status:
            qs = qs.filter(status=status)
        
        return qs.select_related('student')


class TeacherStudentDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete a teacher-student relationship"""
    queryset = models.TeacherStudent.objects.all()
    serializer_class = TeacherStudentSerializer


@csrf_exempt
def search_students_for_teacher(request, teacher_id):
    """Search all students so teacher can add them. Excludes already-assigned students."""
    if request.method != 'GET':
        return JsonResponse({'error': 'GET only'}, status=405)
    
    search = request.GET.get('search', '').strip()
    if len(search) < 2:
        return JsonResponse({'students': [], 'message': 'Enter at least 2 characters'})
    
    teacher, blocked_response = _require_approved_teacher(teacher_id)
    if blocked_response:
        return blocked_response
    
    # Get IDs of students already assigned to this teacher
    assigned_ids = models.TeacherStudent.objects.filter(
        teacher=teacher
    ).values_list('student_id', flat=True)
    
    # Search students not yet assigned
    students = models.Student.objects.filter(
        Q(fullname__icontains=search) | Q(email__icontains=search)
    ).exclude(id__in=assigned_ids)[:20]
    
    results = [{
        'id': s.id,
        'fullname': s.fullname,
        'email': s.email,
        'profile_img': s.profile_img.url if s.profile_img else None,
    } for s in students]
    
    return JsonResponse({'students': results})


@csrf_exempt
def assign_course_to_student(request, teacher_id):
    """Teacher assigns one of their courses to a student (creates enrollment)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    
    import json
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    student_id = data.get('student_id')
    course_id = data.get('course_id')
    
    if not student_id or not course_id:
        return JsonResponse({'error': 'student_id and course_id required'}, status=400)
    
    teacher, blocked_response = _require_approved_teacher(teacher_id)
    if blocked_response:
        return blocked_response

    try:
        student = models.Student.objects.get(pk=student_id)
        course = models.Course.objects.get(pk=course_id, teacher=teacher)
    except models.Student.DoesNotExist:
        return JsonResponse({'error': 'Student not found'}, status=404)
    except models.Course.DoesNotExist:
        return JsonResponse({'error': 'Course not found or does not belong to this teacher'}, status=404)
    
    # Enforce teacher minor-teaching clearance
    minor_block = _require_can_teach_minors(teacher, student)
    if minor_block:
        return minor_block

    # Check if already enrolled
    if models.StudentCourseEnrollment.objects.filter(course=course, student=student).exists():
        return JsonResponse({'bool': False, 'message': 'Student is already enrolled in this course'})
    
    # Find student's active subscription to link with enrollment
    from .access_control import SubscriptionAccessControl
    active_subscription = SubscriptionAccessControl.get_active_subscription(student.id)
    
    # Check if student has an active subscription
    if not active_subscription:
        return JsonResponse({
            'bool': False,
            'error': f'{student.fullname} does not have an active subscription. '
                     f'The student must subscribe to a plan before being enrolled in a course.',
            'message': f'{student.fullname} does not have an active subscription. '
                       f'The student must subscribe to a plan before being enrolled in a course.',
        }, status=403)
    
    # Check if subscription allows more course enrollments
    can_enroll, msg = SubscriptionAccessControl.can_enroll_in_course(student.id, course.id)
    if not can_enroll:
        return JsonResponse({
            'bool': False,
            'error': msg,
            'message': msg,
        }, status=403)
    
    # Create enrollment (linked to subscription if available)
    enrollment = models.StudentCourseEnrollment.objects.create(
        course=course,
        student=student,
        subscription=active_subscription,
        is_active=True,
        progress_percent=0
    )
    
    # Record course enrollment in subscription usage tracking
    if active_subscription:
        active_subscription.record_course_enrollment()
    
    # Create CourseProgress record
    total_lessons = 0
    for chapter in course.course_chapters.all():
        total_lessons += chapter.module_lessons.count()
    
    models.CourseProgress.objects.get_or_create(
        student=student,
        course=course,
        defaults={
            'enrollment': enrollment,
            'total_chapters': total_lessons,
            'completed_chapters': 0,
            'progress_percentage': 0,
            'is_completed': False
        }
    )
    
    # Ensure TeacherStudent relationship exists
    teacher_student, created = models.TeacherStudent.objects.get_or_create(
        teacher=teacher,
        student=student,
        defaults={
            'instrument': 'piano',
            'level': 'beginner',
            'status': 'active',
            'progress_percentage': 0,
        }
    )
    
    return JsonResponse({
        'bool': True,
        'message': f'{student.fullname} enrolled in {course.title}',
        'enrollment_id': enrollment.id
    })


@csrf_exempt
def unassign_course_from_student(request, teacher_id):
    """Teacher removes a student's enrollment from one of their courses"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    
    import json
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    student_id = data.get('student_id')
    course_id = data.get('course_id')
    
    if not student_id or not course_id:
        return JsonResponse({'error': 'student_id and course_id required'}, status=400)
    
    teacher, blocked_response = _require_approved_teacher(teacher_id)
    if blocked_response:
        return blocked_response

    try:
        course = models.Course.objects.get(pk=course_id, teacher=teacher)
    except models.Course.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    
    deleted_count, _ = models.StudentCourseEnrollment.objects.filter(
        course=course, student_id=student_id
    ).delete()
    
    # Also delete CourseProgress
    models.CourseProgress.objects.filter(
        course=course, student_id=student_id
    ).delete()
    
    if deleted_count > 0:
        return JsonResponse({'bool': True, 'message': 'Enrollment removed'})
    return JsonResponse({'bool': False, 'message': 'Enrollment not found'})


def get_teacher_courses_for_student(request, teacher_id, student_id):
    """Get teacher's courses with enrollment status for a specific student"""
    if request.method != 'GET':
        return JsonResponse({'error': 'GET only'}, status=405)
    
    try:
        teacher = models.Teacher.objects.get(pk=teacher_id)
        student = models.Student.objects.get(pk=student_id)
    except (models.Teacher.DoesNotExist, models.Student.DoesNotExist):
        return JsonResponse({'error': 'Not found'}, status=404)
    
    courses = models.Course.objects.filter(teacher=teacher)
    enrolled_course_ids = set(
        models.StudentCourseEnrollment.objects.filter(
            student=student, course__teacher=teacher
        ).values_list('course_id', flat=True)
    )
    
    course_list = [{
        'id': c.id,
        'title': c.title,
        'description': c.description[:100] + '...' if len(c.description) > 100 else c.description,
        'featured_img': c.featured_img.url if c.featured_img else None,
        'is_enrolled': c.id in enrolled_course_ids,
        'total_enrolled': c.total_enrolled_students(),
    } for c in courses]
    
    return JsonResponse({'courses': course_list})


@csrf_exempt
def get_teacher_students_from_enrollments(request, teacher_id):
    """Get students from course enrollments if no direct assignments exist"""
    try:
        teacher = models.Teacher.objects.get(pk=teacher_id)
        
        # Get unique students enrolled in teacher's courses
        enrollments = models.StudentCourseEnrollment.objects.filter(
            course__teacher=teacher
        ).select_related('student', 'course').distinct()
        
        # Group by student
        students_map = {}
        for enrollment in enrollments:
            student = enrollment.student
            if student.id not in students_map:
                # Check if there's a TeacherStudent record
                teacher_student = models.TeacherStudent.objects.filter(
                    teacher=teacher,
                    student=student
                ).first()
                
                # Calculate progress
                from django.db.models import Avg as DbAvg
                course_progress = models.CourseProgress.objects.filter(
                    student=student,
                    course__teacher=teacher
                )
                avg_progress = course_progress.aggregate(
                    avg=DbAvg('progress_percentage')
                )['avg'] or 0
                
                students_map[student.id] = {
                    'id': student.id,
                    'fullname': student.fullname,
                    'email': student.email,
                    'profile_img': student.profile_img.url if student.profile_img else None,
                    'instrument': teacher_student.instrument if teacher_student else 'piano',
                    'level': teacher_student.level if teacher_student else 'beginner',
                    'status': teacher_student.status if teacher_student else 'active',
                    'progress_percentage': int(avg_progress),
                    'last_active': teacher_student.last_active.strftime('%Y-%m-%d %H:%M') if teacher_student else enrollment.enrolled_time.strftime('%Y-%m-%d %H:%M'),
                    'enrolled_courses': []
                }
            
            students_map[student.id]['enrolled_courses'].append({
                'course_id': enrollment.course.id,
                'course_title': enrollment.course.title
            })
        
        return JsonResponse({
            'bool': True,
            'students': list(students_map.values()),
            'total': len(students_map)
        })
        
    except models.Teacher.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'})


class TeacherSessionList(generics.ListCreateAPIView):
    """List and create teaching sessions"""
    serializer_class = TeacherSessionSerializer
    
    def get_queryset(self):
        teacher_id = self.kwargs.get('teacher_id')
        qs = models.TeacherSession.objects.filter(teacher_id=teacher_id, teacher__is_approved=True)
        
        # Filter by date range
        date_from = self.request.GET.get('date_from', '')
        if date_from:
            qs = qs.filter(scheduled_date__gte=date_from)
        
        date_to = self.request.GET.get('date_to', '')
        if date_to:
            qs = qs.filter(scheduled_date__lte=date_to)
        
        # Filter by status
        status = self.request.GET.get('status', '')
        if status:
            qs = qs.filter(status=status)
        
        # Upcoming only
        upcoming = self.request.GET.get('upcoming', 'false')
        if upcoming.lower() == 'true':
            from datetime import date
            qs = qs.filter(scheduled_date__gte=date.today())
        
        return qs.select_related('student')

    def create(self, request, *args, **kwargs):
        teacher_id = self.kwargs.get('teacher_id')
        _, blocked_response = _require_approved_teacher(teacher_id)
        if blocked_response:
            return blocked_response
        return super().create(request, *args, **kwargs)


class TeacherSessionDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete a session"""
    queryset = models.TeacherSession.objects.all()
    serializer_class = TeacherSessionSerializer


# ==================== LIVE VIDEO SESSION VIEWS ====================

@csrf_exempt
def session_go_live(request, session_id):
    """Teacher starts a live video session"""
    if request.method == 'POST':
        try:
            session = models.TeacherSession.objects.get(pk=session_id)
            if not session.teacher.is_approved:
                return JsonResponse({'bool': False, 'error': 'Teacher account is not approved for live sessions.', 'message': 'Teacher account is not approved for live sessions.'}, status=403)
            # Enforce minor teaching clearance
            if session.student:
                minor_block = _require_can_teach_minors(session.teacher, session.student)
                if minor_block:
                    return minor_block
            session.go_live()
            return JsonResponse({
                'bool': True,
                'message': 'Session is now live',
                'room_name': session.room_name,
                'meeting_link': session.meeting_link,
                'is_live': True
            })
        except models.TeacherSession.DoesNotExist:
            return JsonResponse({'bool': False, 'message': 'Session not found'}, status=404)
    return JsonResponse({'bool': False, 'message': 'Invalid method'})


@csrf_exempt
def session_end(request, session_id):
    """Teacher ends a live video session"""
    if request.method == 'POST':
        try:
            session = models.TeacherSession.objects.get(pk=session_id)
            if not session.teacher.is_approved:
                return JsonResponse({'bool': False, 'message': 'Teacher account is not approved.'}, status=403)
            session.end_session()
            return JsonResponse({
                'bool': True,
                'message': 'Session ended',
                'actual_duration_minutes': session.actual_duration_minutes
            })
        except models.TeacherSession.DoesNotExist:
            return JsonResponse({'bool': False, 'message': 'Session not found'}, status=404)
    return JsonResponse({'bool': False, 'message': 'Invalid method'})


class StudentUpcomingSessions(generics.ListAPIView):
    """Student: list upcoming sessions"""
    serializer_class = TeacherSessionSerializer
    
    def get_queryset(self):
        from datetime import date
        student_id = self.kwargs.get('student_id')
        return models.TeacherSession.objects.filter(
            student_id=student_id,
            scheduled_date__gte=date.today(),
            status__in=['pending', 'confirmed']
        ).select_related('teacher').order_by('scheduled_date', 'scheduled_time')


class StudentLiveSessions(generics.ListAPIView):
    """Student: list currently live sessions they can join"""
    serializer_class = TeacherSessionSerializer
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        return models.TeacherSession.objects.filter(
            student_id=student_id,
            is_live=True
        ).select_related('teacher')


@csrf_exempt
def student_join_live_session(request, student_id, session_id):
    """Student joins a live session — checks subscription access"""
    if request.method == 'POST':
        try:
            student = models.Student.objects.get(pk=student_id)
            session = models.TeacherSession.objects.get(pk=session_id, student=student)
            
            if not session.is_live:
                return JsonResponse({'bool': False, 'message': 'This session is not live yet'})

            # Enforce teacher minor-teaching clearance
            minor_block = _require_can_teach_minors(session.teacher, student)
            if minor_block:
                return minor_block

            # Minor safety check: parental authorization for live sessions
            if student.is_minor():
                if not student.parent_account_required:
                    student.parent_account_required = True
                    student.save(update_fields=['parent_account_required'])

                parent_link = _get_active_parent_link(student)
                if not parent_link:
                    return JsonResponse({
                        'bool': False,
                        'message': 'Parent account authorization is required before joining live sessions.',
                        'requires_parental_consent': True,
                    }, status=403)

                live_consent = _get_active_live_sessions_consent(parent_link)
                if not live_consent:
                    return JsonResponse({
                        'bool': False,
                        'message': 'Parent has not approved live session participation.',
                        'requires_parental_consent': True,
                    }, status=403)

                if parent_link.authorization_mode == 'per_session_login':
                    session_authorized = models.SessionAuthorization.objects.filter(
                        parent_link=parent_link,
                        session=session,
                        status='approved',
                    ).filter(
                        Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now())
                    ).exists()
                    if not session_authorized:
                        return JsonResponse({
                            'bool': False,
                            'message': 'Parent must approve this session before student can join.',
                            'requires_parental_consent': True,
                        }, status=403)
            
            # Check subscription access for live sessions
            from .access_control import SubscriptionAccessControl
            subscription = SubscriptionAccessControl.get_active_subscription(student_id)
            if not subscription:
                return JsonResponse({'bool': False, 'message': 'Active subscription required for live sessions', 'requires_upgrade': True}, status=403)

            can_access, msg = subscription.can_access_live_session()
            if not can_access:
                return JsonResponse({'bool': False, 'message': msg, 'requires_upgrade': True}, status=403)
            subscription.record_live_session()

            models.SessionParticipantLog.objects.update_or_create(
                session=session,
                student=student,
                participant_role='student',
                defaults={
                    'teacher': session.teacher,
                    'ip_address': _get_client_ip(request),
                }
            )
            
            return JsonResponse({
                'bool': True,
                'room_name': session.room_name,
                'meeting_link': session.meeting_link,
                'session_title': session.title,
                'teacher_name': session.teacher.full_name
            })
        except models.Student.DoesNotExist:
            return JsonResponse({'bool': False, 'message': 'Student not found'}, status=404)
        except models.TeacherSession.DoesNotExist:
            return JsonResponse({'bool': False, 'message': 'Session not found'}, status=404)
    return JsonResponse({'bool': False, 'message': 'Invalid method'})


@csrf_exempt
def update_session_recording(request, session_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    payload = _extract_request_data(request)
    teacher_id = payload.get('requester_teacher_id')
    if not teacher_id:
        return JsonResponse({'bool': False, 'message': 'requester_teacher_id is required'}, status=400)

    teacher, blocked_response = _require_approved_teacher(teacher_id)
    if blocked_response:
        return blocked_response

    session = models.TeacherSession.objects.filter(id=session_id).first()
    if not session:
        return JsonResponse({'bool': False, 'message': 'Session not found'}, status=404)
    if session.teacher_id != teacher.id:
        return JsonResponse({'bool': False, 'message': 'Not allowed to update this session'}, status=403)

    recording_enabled = payload.get('recording_enabled')
    if recording_enabled is not None:
        value = str(recording_enabled).strip().lower()
        session.recording_enabled = value in ['1', 'true', 'yes', 'on']

    if payload.get('recording_url'):
        session.recording_url = payload.get('recording_url').strip()

    session.save(update_fields=['recording_enabled', 'recording_url', 'updated_at'])

    return JsonResponse({
        'bool': True,
        'message': 'Session recording settings updated',
        'recording_enabled': session.recording_enabled,
        'recording_url': session.recording_url,
    })


@csrf_exempt
def create_session_safety_report(request, session_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    session = models.TeacherSession.objects.filter(id=session_id).first()
    if not session:
        return JsonResponse({'bool': False, 'message': 'Session not found'}, status=404)

    payload = _extract_request_data(request)
    reporter_type = (payload.get('reporter_type') or '').strip().lower()
    reporter_id = payload.get('reporter_id')
    description = (payload.get('description') or '').strip()
    report_type = (payload.get('report_type') or 'session').strip().lower()

    if reporter_type not in ['teacher', 'student']:
        return JsonResponse({'bool': False, 'message': 'reporter_type must be teacher or student'}, status=400)
    if not reporter_id:
        return JsonResponse({'bool': False, 'message': 'reporter_id is required'}, status=400)
    if not description:
        return JsonResponse({'bool': False, 'message': 'description is required'}, status=400)

    reported_teacher = models.Teacher.objects.filter(id=payload.get('reported_teacher_id')).first() if payload.get('reported_teacher_id') else session.teacher
    reported_student = models.Student.objects.filter(id=payload.get('reported_student_id')).first() if payload.get('reported_student_id') else session.student

    report = models.SafetyReport(
        report_type=report_type if report_type in ['session', 'audio_message', 'other'] else 'session',
        session=session,
        description=description,
        reported_teacher=reported_teacher,
        reported_student=reported_student,
    )

    if reporter_type == 'teacher':
        reporter = models.Teacher.objects.filter(id=reporter_id).first()
        if not reporter:
            return JsonResponse({'bool': False, 'message': 'Teacher reporter not found'}, status=404)
        report.reported_by_teacher = reporter
    else:
        reporter = models.Student.objects.filter(id=reporter_id).first()
        if not reporter:
            return JsonResponse({'bool': False, 'message': 'Student reporter not found'}, status=404)
        report.reported_by_student = reporter

    report.save()
    return JsonResponse({'bool': True, 'message': 'Safety report submitted', 'report_id': report.id})


@csrf_exempt
def create_audio_message_safety_report(request, audio_message_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    message = models.AudioMessage.objects.filter(id=audio_message_id).first()
    if not message:
        return JsonResponse({'bool': False, 'message': 'Audio message not found'}, status=404)

    payload = _extract_request_data(request)
    reporter_type = (payload.get('reporter_type') or '').strip().lower()
    reporter_id = payload.get('reporter_id')
    description = (payload.get('description') or '').strip()

    if reporter_type not in ['teacher', 'student']:
        return JsonResponse({'bool': False, 'message': 'reporter_type must be teacher or student'}, status=400)
    if not reporter_id:
        return JsonResponse({'bool': False, 'message': 'reporter_id is required'}, status=400)
    if not description:
        return JsonResponse({'bool': False, 'message': 'description is required'}, status=400)

    report = models.SafetyReport(
        report_type='audio_message',
        audio_message=message,
        description=description,
        reported_teacher=message.teacher,
        reported_student=message.student,
    )

    if reporter_type == 'teacher':
        reporter = models.Teacher.objects.filter(id=reporter_id).first()
        if not reporter:
            return JsonResponse({'bool': False, 'message': 'Teacher reporter not found'}, status=404)
        report.reported_by_teacher = reporter
    else:
        reporter = models.Student.objects.filter(id=reporter_id).first()
        if not reporter:
            return JsonResponse({'bool': False, 'message': 'Student reporter not found'}, status=404)
        report.reported_by_student = reporter

    report.save()
    return JsonResponse({'bool': True, 'message': 'Audio message safety report submitted', 'report_id': report.id})


def admin_safety_reports(request):
    admin, error = _validate_admin_requester(request)
    if error:
        return error

    status_filter = request.GET.get('status')
    reports = models.SafetyReport.objects.all().select_related(
        'session', 'audio_message', 'reported_by_teacher', 'reported_by_student',
        'reported_teacher', 'reported_student', 'reviewed_by'
    )
    if status_filter:
        reports = reports.filter(status=status_filter)

    data = []
    for report in reports[:200]:
        data.append({
            'id': report.id,
            'report_type': report.report_type,
            'status': report.status,
            'description': report.description,
            'session_id': report.session_id,
            'audio_message_id': report.audio_message_id,
            'reported_by_teacher': report.reported_by_teacher.full_name if report.reported_by_teacher else None,
            'reported_by_student': report.reported_by_student.fullname if report.reported_by_student else None,
            'reported_teacher': report.reported_teacher.full_name if report.reported_teacher else None,
            'reported_student': report.reported_student.fullname if report.reported_student else None,
            'admin_notes': report.admin_notes,
            'reviewed_by': report.reviewed_by.full_name if report.reviewed_by else None,
            'created_at': report.created_at,
            'reviewed_at': report.reviewed_at,
        })

    log_activity(request, 'view', f'Admin {admin.full_name} viewed safety reports',
                 model_name='SafetyReport', admin=admin)
    return JsonResponse({'bool': True, 'count': len(data), 'reports': data})


@csrf_exempt
def admin_update_safety_report(request, report_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST method required.'}, status=405)

    payload = _extract_request_data(request)
    admin, error = _validate_admin_requester(request, payload)
    if error:
        return error

    report = models.SafetyReport.objects.filter(id=report_id).first()
    if not report:
        return JsonResponse({'bool': False, 'message': 'Safety report not found'}, status=404)

    new_status = (payload.get('status') or '').strip().lower()
    if new_status and new_status not in ['open', 'in_review', 'resolved', 'dismissed']:
        return JsonResponse({'bool': False, 'message': 'Invalid status'}, status=400)

    if new_status:
        report.status = new_status
    if payload.get('admin_notes') is not None:
        report.admin_notes = payload.get('admin_notes')
    report.reviewed_by = admin
    report.reviewed_at = timezone.now()
    report.save(update_fields=['status', 'admin_notes', 'reviewed_by', 'reviewed_at', 'updated_at'])

    return JsonResponse({'bool': True, 'message': 'Safety report updated', 'status': report.status})


# ==================== AUDIO MESSAGE VIEWS ====================

from .serializers import AudioMessageSerializer

class TeacherAudioMessageList(generics.ListCreateAPIView):
    """Teacher: list sent audio messages or send a new one"""
    serializer_class = AudioMessageSerializer
    
    def get_queryset(self):
        teacher_id = self.kwargs.get('teacher_id')
        student_id = self.request.GET.get('student_id')
        qs = models.AudioMessage.objects.filter(teacher_id=teacher_id, teacher__is_approved=True)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.select_related('student', 'course')
    
    def create(self, request, *args, **kwargs):
        """Check subscription limits before allowing audio message send"""
        teacher_id = self.kwargs.get('teacher_id')
        _, blocked_response = _require_approved_teacher(teacher_id)
        if blocked_response:
            return blocked_response
        student_id = request.data.get('student')
        
        if student_id:
            # Check if the student's subscription allows receiving audio messages
            from .access_control import SubscriptionAccessControl
            subscription = SubscriptionAccessControl.get_active_subscription(student_id)
            if not subscription:
                return Response({'error': 'Active subscription required for audio messages', 'requires_upgrade': True}, status=403)
            can_send, msg = subscription.can_send_audio_message()
            if not can_send:
                return Response({'error': msg, 'requires_upgrade': True}, status=403)
            # Will record usage after successful creation
        
        response = super().create(request, *args, **kwargs)
        
        if response.status_code == 201 and student_id:
            # Record audio message usage on the subscription
            if subscription:
                subscription.record_audio_message()
        
        return response


class TeacherAudioMessageDetail(generics.RetrieveDestroyAPIView):
    """Teacher: get or delete an audio message"""
    queryset = models.AudioMessage.objects.all()
    serializer_class = AudioMessageSerializer


class StudentAudioMessageList(generics.ListAPIView):
    """Student: list received audio messages"""
    serializer_class = AudioMessageSerializer
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        return models.AudioMessage.objects.filter(
            student_id=student_id
        ).select_related('teacher', 'course')


@csrf_exempt
def mark_audio_message_read(request, pk):
    """Mark an audio message as read"""
    if request.method == 'PATCH':
        try:
            from django.utils import timezone
            msg = models.AudioMessage.objects.get(pk=pk)
            msg.is_read = True
            msg.read_at = timezone.now()
            msg.save(update_fields=['is_read', 'read_at'])
            return JsonResponse({'bool': True})
        except models.AudioMessage.DoesNotExist:
            return JsonResponse({'bool': False, 'message': 'Message not found'}, status=404)
    return JsonResponse({'bool': False, 'message': 'Invalid method'})


def student_unread_audio_count(request, student_id):
    """Get count of unread audio messages for a student"""
    count = models.AudioMessage.objects.filter(student_id=student_id, is_read=False).count()
    return JsonResponse({'unread_count': count})


class TeacherActivityList(generics.ListAPIView):
    """List teacher's activity feed"""
    serializer_class = TeacherActivitySerializer
    
    def get_queryset(self):
        teacher_id = self.kwargs.get('teacher_id')
        limit = int(self.request.GET.get('limit', 20))
        return models.TeacherActivity.objects.filter(
            teacher_id=teacher_id,
            teacher__is_approved=True,
        ).select_related('student')[:limit]


@csrf_exempt
def create_teacher_activity(request, teacher_id):
    """Create a new activity entry (usually called from student actions)"""
    import json
    
    try:
        teacher, blocked_response = _require_approved_teacher(teacher_id)
        if blocked_response:
            return blocked_response
        
        if request.method == 'POST':
            data = json.loads(request.body) if request.body else {}
            
            activity = models.TeacherActivity.objects.create(
                teacher=teacher,
                student_id=data.get('student_id'),
                activity_type=data.get('activity_type'),
                target_name=data.get('target_name'),
                target_id=data.get('target_id'),
                target_type=data.get('target_type'),
                description=data.get('description')
            )
            
            return JsonResponse({
                'bool': True,
                'activity_id': activity.id
            })
            
    except models.Teacher.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Teacher not found'})
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)})


# Lesson Library Views
class TeacherLessonList(generics.ListCreateAPIView):
    """List and create lessons for a teacher"""
    serializer_class = LessonSerializer
    
    def get_queryset(self):
        teacher_id = self.kwargs.get('teacher_id')
        qs = models.Lesson.objects.filter(teacher_id=teacher_id, teacher__is_approved=True)
        
        # Search filter
        search = self.request.GET.get('search', '')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Category filter
        category = self.request.GET.get('category', '')
        if category:
            qs = qs.filter(category_id=category)
        
        # Difficulty filter
        difficulty = self.request.GET.get('difficulty', '')
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        
        # Published filter
        published = self.request.GET.get('published', '')
        if published:
            qs = qs.filter(is_published=published.lower() == 'true')
        
        return qs.select_related('category')

    def create(self, request, *args, **kwargs):
        teacher_id = self.kwargs.get('teacher_id')
        _, blocked_response = _require_approved_teacher(teacher_id)
        if blocked_response:
            return blocked_response
        return super().create(request, *args, **kwargs)


class TeacherLessonDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete a lesson"""
    queryset = models.Lesson.objects.all()
    serializer_class = LessonSerializer


class LessonMaterialList(generics.ListCreateAPIView):
    """List and upload lesson materials"""
    serializer_class = LessonMaterialSerializer
    
    def get_queryset(self):
        lesson_id = self.kwargs.get('lesson_id')
        return models.LessonMaterial.objects.filter(lesson_id=lesson_id)
    
    def perform_create(self, serializer):
        # Calculate file size
        file = self.request.FILES.get('file')
        if file:
            serializer.save(file_size=file.size)
        else:
            serializer.save()


class LessonMaterialDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete a lesson material"""
    queryset = models.LessonMaterial.objects.all()
    serializer_class = LessonMaterialSerializer


@csrf_exempt
def upload_lesson_material(request, lesson_id):
    """Handle file upload for lesson materials"""
    from django.core.files.storage import default_storage
    import os
    
    try:
        lesson = models.Lesson.objects.get(pk=lesson_id)
        
        if request.method == 'POST':
            file = request.FILES.get('file')
            title = request.POST.get('title', '')
            material_type = request.POST.get('material_type', 'other')
            
            if not file:
                return JsonResponse({'bool': False, 'message': 'No file provided'})
            
            # Validate file size (50MB max)
            if file.size > 50 * 1024 * 1024:
                return JsonResponse({'bool': False, 'message': 'File size exceeds 50MB limit'})
            
            # Validate file type
            allowed_extensions = {
                'video': ['.mp4', '.webm', '.mov', '.avi'],
                'audio': ['.mp3', '.wav', '.ogg', '.m4a'],
                'pdf': ['.pdf'],
                'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
            }
            
            ext = os.path.splitext(file.name)[1].lower()
            
            # Auto-detect material type if not specified
            if material_type == 'other':
                for mtype, extensions in allowed_extensions.items():
                    if ext in extensions:
                        material_type = mtype
                        break
            
            # Create material
            material = models.LessonMaterial.objects.create(
                lesson=lesson,
                title=title or file.name,
                material_type=material_type,
                file=file,
                file_size=file.size,
                order=models.LessonMaterial.objects.filter(lesson=lesson).count()
            )
            
            # Audit: log material upload
            log_upload(
                request=request, file=file, upload_type='study_material',
                content_type_str='LessonMaterial', object_id=material.id, status='success'
            )
            
            # Update lesson duration if it's a video/audio
            if material_type in ['video', 'audio']:
                duration_seconds = request.POST.get('duration_seconds', 0)
                if duration_seconds:
                    material.duration_seconds = int(duration_seconds)
                    material.save()
                    
                    # Update total lesson duration
                    total_duration = models.LessonMaterial.objects.filter(
                        lesson=lesson
                    ).aggregate(total=models.Sum('duration_seconds'))['total'] or 0
                    lesson.duration_minutes = total_duration // 60
                    lesson.save()
            
            return JsonResponse({
                'bool': True,
                'material_id': material.id,
                'file_url': material.file.url,
                'file_size_formatted': material.file_size_formatted
            })
            
    except models.Lesson.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Lesson not found'})
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)})


# Teacher Progress View
class TeacherProgressDashboard(APIView):
    """Progress analytics for teacher dashboard"""
    
    def get(self, request, teacher_id):
        from datetime import date, timedelta
        from django.db.models import Count, Avg, Sum, Q
        from django.utils import timezone
        
        try:
            teacher = models.Teacher.objects.get(pk=teacher_id)
        except models.Teacher.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=404)
        
        # Auto-update student statuses based on last activity
        for ts in models.TeacherStudent.objects.filter(teacher=teacher):
            ts.update_status()
        
        # Reload after status updates
        students = models.TeacherStudent.objects.filter(teacher=teacher).select_related('student')
        total_students = students.count()
        
        # Calculate real avg_progress from CourseProgress
        avg_progress = models.CourseProgress.objects.filter(
            course__teacher=teacher
        ).aggregate(avg=Avg('progress_percentage'))['avg'] or 0
        
        # Build real progress distribution from CourseProgress per student
        progress_counts = {'excellent': 0, 'good': 0, 'average': 0, 'needs_improvement': 0}
        for s in students:
            student_avg = models.CourseProgress.objects.filter(
                student=s.student, course__teacher=teacher
            ).aggregate(avg=Avg('progress_percentage'))['avg'] or 0
            if student_avg >= 80:
                progress_counts['excellent'] += 1
            elif student_avg >= 60:
                progress_counts['good'] += 1
            elif student_avg >= 40:
                progress_counts['average'] += 1
            else:
                progress_counts['needs_improvement'] += 1
        progress_distribution = progress_counts
        
        # Student progress list with course enrollment data
        student_progress = []
        for s in students:
            # Get total enrolled courses for this student under this teacher
            enrolled_courses = models.StudentCourseEnrollment.objects.filter(
                student=s.student,
                course__teacher=teacher
            ).count()
            completed_courses = models.CourseProgress.objects.filter(
                student=s.student,
                course__teacher=teacher,
                is_completed=True
            ).count()
            # Total time spent across all teacher's courses
            time_spent = models.CourseProgress.objects.filter(
                student=s.student,
                course__teacher=teacher
            ).aggregate(total=Sum('total_time_spent_seconds'))['total'] or 0
            
            # Calculate real progress from CourseProgress
            real_progress = models.CourseProgress.objects.filter(
                student=s.student, course__teacher=teacher
            ).aggregate(avg=Avg('progress_percentage'))['avg'] or 0
            
            student_progress.append({
                'id': s.id,
                'student_id': s.student.id,
                'student_name': s.student.fullname,
                'student_email': s.student.email,
                'student_profile_img': s.student.profile_img.url if s.student.profile_img else None,
                'instrument': s.instrument,
                'level': s.level,
                'progress_percentage': round(real_progress),
                'status': s.status,
                'last_active': s.last_active.strftime('%Y-%m-%d'),
                'enrolled_courses': enrolled_courses,
                'completed_courses': completed_courses,
                'time_spent_minutes': round(time_spent / 60),
                'notes': s.notes or '',
            })
        
        # Lesson and course completion stats
        total_lessons = models.ModuleLesson.objects.filter(module__course__teacher=teacher).count()
        total_enrollments = models.StudentCourseEnrollment.objects.filter(
            course__teacher=teacher
        ).count()
        total_completed_courses = models.CourseProgress.objects.filter(
            course__teacher=teacher,
            is_completed=True
        ).count()
        
        # Completion rate based on actual lesson completions (ModuleLessonProgress)
        total_lesson_records = models.ModuleLessonProgress.objects.filter(
            lesson__module__course__teacher=teacher
        ).count()
        completed_lesson_records = models.ModuleLessonProgress.objects.filter(
            lesson__module__course__teacher=teacher,
            is_completed=True
        ).count()
        completion_rate = round(
            (completed_lesson_records / total_lesson_records * 100) if total_lesson_records > 0 else 0, 1
        )
        
        # Weekly activity (last 7 days) — combine all real activity sources
        today = date.today()
        weekly_activity = []
        student_ids = list(students.values_list('student_id', flat=True))
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            
            # TeacherActivity records
            teacher_act_count = models.TeacherActivity.objects.filter(
                teacher=teacher,
                created_at__date=day
            ).count()
            
            # DailyLearningActivity records
            student_activities = models.DailyLearningActivity.objects.filter(
                student_id__in=student_ids,
                date=day
            ).aggregate(
                lessons=Sum('lessons_completed'),
                time=Sum('total_time_seconds')
            )
            daily_lessons = student_activities['lessons'] or 0
            daily_time = student_activities['time'] or 0
            
            # If no TeacherActivity/DailyLearningActivity, count from real progress data
            if teacher_act_count == 0 and daily_lessons == 0:
                # Lesson completions on this day
                lesson_completions = models.ModuleLessonProgress.objects.filter(
                    lesson__module__course__teacher=teacher,
                    is_completed=True,
                    completed_at__date=day
                ).count()
                
                # Lesson views on this day (not yet completed)
                lesson_views = models.ModuleLessonProgress.objects.filter(
                    lesson__module__course__teacher=teacher,
                    viewed_at__date=day
                ).count()
                
                # Enrollments on this day
                enrollment_count = models.StudentCourseEnrollment.objects.filter(
                    course__teacher=teacher,
                    enrolled_time__date=day
                ).count()
                
                # Course completions on this day
                course_completions = models.CourseProgress.objects.filter(
                    course__teacher=teacher,
                    is_completed=True,
                    completed_at__date=day
                ).count()
                
                daily_lessons = lesson_completions + enrollment_count + course_completions
                # Estimate time from lesson views (if any progress exists)
                time_from_progress = models.CourseProgress.objects.filter(
                    course__teacher=teacher,
                    last_accessed__date=day
                ).aggregate(total=Sum('total_time_spent_seconds'))['total'] or 0
                daily_time = time_from_progress
            
            total_activities = teacher_act_count + daily_lessons
            
            weekly_activity.append({
                'date': day.strftime('%a'),
                'full_date': day.strftime('%Y-%m-%d'),
                'activities': total_activities,
                'time_minutes': round(daily_time / 60),
            })
        
        # Top performing students (sorted by real progress from CourseProgress)
        top_students_data = []
        for s in students:
            real_prog = models.CourseProgress.objects.filter(
                student=s.student, course__teacher=teacher
            ).aggregate(avg=Avg('progress_percentage'))['avg'] or 0
            top_students_data.append({
                'id': s.id,
                'student_name': s.student.fullname,
                'student_profile_img': s.student.profile_img.url if s.student.profile_img else None,
                'progress_percentage': round(real_prog),
                'level': s.level,
                'instrument': s.instrument,
            })
        top_students_data.sort(key=lambda x: x['progress_percentage'], reverse=True)
        top_students_data = top_students_data[:5]
        
        # Students needing attention (status warning/inactive OR low real progress)
        attention_data = []
        for s in students:
            real_prog = models.CourseProgress.objects.filter(
                student=s.student, course__teacher=teacher
            ).aggregate(avg=Avg('progress_percentage'))['avg'] or 0
            if s.status in ['warning', 'inactive'] or real_prog < 30:
                attention_data.append({
                    'id': s.id,
                    'student_name': s.student.fullname,
                    'student_profile_img': s.student.profile_img.url if s.student.profile_img else None,
                    'progress_percentage': round(real_prog),
                    'status': s.status,
                    'last_active': s.last_active.strftime('%Y-%m-%d'),
                    'instrument': s.instrument,
                })
        attention_data.sort(key=lambda x: x['progress_percentage'])
        attention_data = attention_data[:5]
        
        # Course-level stats for the teacher
        teacher_courses = models.Course.objects.filter(teacher=teacher)
        course_stats = []
        for course in teacher_courses:
            enrollments = models.StudentCourseEnrollment.objects.filter(course=course).count()
            avg_course_progress = models.CourseProgress.objects.filter(
                course=course
            ).aggregate(avg=Avg('progress_percentage'))['avg'] or 0
            course_stats.append({
                'id': course.id,
                'title': course.title,
                'enrollments': enrollments,
                'avg_progress': round(avg_course_progress, 1),
            })
        
        return Response({
            'overall_progress': round(avg_progress, 1),
            'total_students': total_students,
            'total_lessons': total_lessons,
            'total_enrollments': total_enrollments,
            'total_completed_courses': total_completed_courses,
            'completion_rate': completion_rate,
            'progress_distribution': progress_distribution,
            'student_progress': student_progress,
            'weekly_activity': weekly_activity,
            'top_students': top_students_data,
            'attention_needed': attention_data,
            'course_stats': course_stats,
        })


# ==================== ADMIN LESSON MANAGEMENT ====================

from .serializers import ModuleLessonSerializer, ModuleLessonProgressSerializer, ModuleProgressSerializer

class AdminModuleList(generics.ListCreateAPIView):
    """Admin: List all modules or create new module for a course"""
    serializer_class = ChapterSerializer
    
    def get_queryset(self):
        course_id = self.request.GET.get('course_id')
        if course_id:
            return models.Chapter.objects.filter(course_id=course_id).order_by('order', 'id')
        return models.Chapter.objects.all().order_by('course__id', 'order', 'id')


class AdminModuleDetail(generics.RetrieveUpdateDestroyAPIView):
    """Admin: Get, update or delete a module"""
    queryset = models.Chapter.objects.all()
    serializer_class = ChapterSerializer


# Per-content-type upload size limits (in bytes)
LESSON_FILE_SIZE_LIMITS = {
    'video': 2 * 1024 * 1024 * 1024,   # 2 GB
    'audio': 200 * 1024 * 1024,         # 200 MB
    'pdf':   50 * 1024 * 1024,          # 50 MB
    'image': 20 * 1024 * 1024,          # 20 MB
}

LESSON_FILE_SIZE_LABELS = {
    'video': '2 GB',
    'audio': '200 MB',
    'pdf':   '50 MB',
    'image': '20 MB',
}

LESSON_ALLOWED_EXTENSIONS = {
    'video': ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
    'audio': ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'],
    'pdf':   ['.pdf'],
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
}


class AdminModuleLessonList(generics.ListCreateAPIView):
    """Admin: List all lessons in a module or create new lesson"""
    serializer_class = ModuleLessonSerializer
    
    def get_queryset(self):
        module_id = self.kwargs.get('module_id')
        if module_id:
            return models.ModuleLesson.objects.filter(module_id=module_id).order_by('order', 'id')
        return models.ModuleLesson.objects.all().order_by('module__id', 'order', 'id')
    
    def create(self, request, *args, **kwargs):
        """Override create to validate file size and type before saving"""
        import os
        file = request.FILES.get('file')
        content_type = request.data.get('content_type', 'video')
        
        if file:
            ext = os.path.splitext(file.name)[1].lower()
            
            # Validate file extension
            allowed_exts = LESSON_ALLOWED_EXTENSIONS.get(content_type, [])
            if allowed_exts and ext not in allowed_exts:
                err_msg = f'Invalid file type for {content_type}. Allowed: {", ".join(allowed_exts)}'
                log_upload(request=request, file=file, upload_type='lesson_content',
                           status='failed', error_message=err_msg)
                return JsonResponse({'error': err_msg}, status=400)
            
            # Validate file size
            max_size = LESSON_FILE_SIZE_LIMITS.get(content_type, 50 * 1024 * 1024)
            if file.size > max_size:
                label = LESSON_FILE_SIZE_LABELS.get(content_type, '50 MB')
                file_mb = file.size / (1024*1024)
                err_msg = f'File too large for {content_type} content. Maximum allowed: {label}. Your file: {file_mb:.1f} MB'
                log_upload(request=request, file=file, upload_type='lesson_content',
                           status='failed', error_message=err_msg)
                return JsonResponse({'error': err_msg}, status=400)
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        # Auto-detect content type from file extension
        import os
        file = self.request.FILES.get('file')
        if file:
            ext = os.path.splitext(file.name)[1].lower()
            content_type_map = {
                '.mp4': 'video', '.webm': 'video', '.mov': 'video', '.avi': 'video', '.mkv': 'video',
                '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio', '.m4a': 'audio', '.flac': 'audio', '.aac': 'audio',
                '.pdf': 'pdf',
                '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image', '.svg': 'image',
            }
            content_type = content_type_map.get(ext, 'video')
            
            # Get next order number
            module_id = self.request.data.get('module')
            last_order = models.ModuleLesson.objects.filter(module_id=module_id).order_by('-order').first()
            next_order = (last_order.order + 1) if last_order else 0
            
            instance = serializer.save(content_type=content_type, order=next_order)
            
            # Audit: log successful upload
            log_upload(
                request=self.request, file=file, upload_type='lesson_content',
                content_type_str='ModuleLesson', object_id=instance.id, status='success'
            )
        else:
            serializer.save()


class AdminModuleLessonDetail(generics.RetrieveUpdateDestroyAPIView):
    """Admin: Get, update or delete a lesson"""
    queryset = models.ModuleLesson.objects.all()
    serializer_class = ModuleLessonSerializer

    def update(self, request, *args, **kwargs):
        """Override update to validate file size and type"""
        import os
        file = request.FILES.get('file')
        content_type = request.data.get('content_type', 'video')
        
        if file:
            ext = os.path.splitext(file.name)[1].lower()
            
            allowed_exts = LESSON_ALLOWED_EXTENSIONS.get(content_type, [])
            if allowed_exts and ext not in allowed_exts:
                return JsonResponse({
                    'error': f'Invalid file type for {content_type}. Allowed: {", ".join(allowed_exts)}'
                }, status=400)
            
            max_size = LESSON_FILE_SIZE_LIMITS.get(content_type, 50 * 1024 * 1024)
            if file.size > max_size:
                label = LESSON_FILE_SIZE_LABELS.get(content_type, '50 MB')
                file_mb = file.size / (1024*1024)
                return JsonResponse({
                    'error': f'File too large for {content_type} content. Maximum allowed: {label}. Your file: {file_mb:.1f} MB'
                }, status=400)
        
        return super().update(request, *args, **kwargs)


@csrf_exempt
def duplicate_module_lesson(request, lesson_id):
    """Duplicate a lesson with downloadables and school assignments."""
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST required'}, status=405)

    try:
        lesson = models.ModuleLesson.objects.select_related('module__course__teacher').get(pk=lesson_id)
    except models.ModuleLesson.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Lesson not found'}, status=404)

    payload = _extract_request_data(request)
    requester_type = (payload.get('requester_type') or '').strip().lower()
    requester_id = payload.get('requester_id')

    if requester_type == 'teacher':
        if not requester_id:
            return JsonResponse({'bool': False, 'message': 'requester_id is required for teacher'}, status=400)

        teacher, blocked_response = _require_approved_teacher(requester_id)
        if blocked_response:
            return blocked_response

        if lesson.module.course.teacher_id != teacher.id:
            return JsonResponse({'bool': False, 'message': 'Not authorized to duplicate this lesson'}, status=403)

    elif requester_type == 'admin':
        if requester_id:
            admin = models.Admin.objects.filter(id=requester_id).first()
            if not admin:
                return JsonResponse({'bool': False, 'message': 'Admin not found'}, status=404)

    elif requester_type:
        return JsonResponse({'bool': False, 'message': 'requester_type must be admin or teacher'}, status=400)

    copy_title = payload.get('title')
    if copy_title:
        copy_title = copy_title.strip()
    if not copy_title:
        copy_title = f"{lesson.title} (Copy)"

    try:
        with transaction.atomic():
            last_order = models.ModuleLesson.objects.filter(module=lesson.module).order_by('-order').first()
            next_order = (last_order.order + 1) if last_order else 0

            duplicated_lesson = models.ModuleLesson.objects.create(
                module=lesson.module,
                title=copy_title,
                description=lesson.description,
                objectives=lesson.objectives,
                content_type=lesson.content_type,
                file=lesson.file.name if lesson.file else None,
                duration_seconds=lesson.duration_seconds,
                order=next_order,
                is_preview=lesson.is_preview,
                is_locked=lesson.is_locked,
                is_premium=lesson.is_premium,
                required_access_level=lesson.required_access_level,
            )

            source_downloadables = models.LessonDownloadable.objects.filter(lesson=lesson).order_by('order', 'id')
            for downloadable in source_downloadables:
                models.LessonDownloadable.objects.create(
                    lesson=duplicated_lesson,
                    title=downloadable.title,
                    file_type=downloadable.file_type,
                    file=downloadable.file.name if downloadable.file else None,
                    description=downloadable.description,
                    order=downloadable.order,
                )

            source_assignments = models.LessonAssignment.objects.filter(lesson=lesson)
            for assignment in source_assignments:
                models.LessonAssignment.objects.create(
                    school=assignment.school,
                    lesson=duplicated_lesson,
                    assignment_type=assignment.assignment_type,
                    student=assignment.student,
                    group_class=assignment.group_class,
                    due_date=assignment.due_date,
                    audio_required=assignment.audio_required,
                    max_points=assignment.max_points,
                    notes=assignment.notes,
                )

        serialized = ModuleLessonSerializer(duplicated_lesson, context={'request': request}).data
        return JsonResponse({
            'bool': True,
            'message': 'Lesson duplicated successfully',
            'lesson': serialized,
            'meta': {
                'source_lesson_id': lesson.id,
                'duplicated_lesson_id': duplicated_lesson.id,
                'downloadables_copied': source_downloadables.count(),
                'assignments_copied': source_assignments.count(),
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)}, status=500)


@csrf_exempt
def admin_reorder_modules(request, course_id):
    """Admin: Reorder modules within a course"""
    import json
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            module_order = data.get('order', [])  # List of module IDs in new order
            
            for index, module_id in enumerate(module_order):
                models.Chapter.objects.filter(id=module_id, course_id=course_id).update(order=index)
            
            return JsonResponse({'bool': True, 'message': 'Modules reordered successfully'})
        except Exception as e:
            return JsonResponse({'bool': False, 'message': str(e)})
    
    return JsonResponse({'bool': False, 'message': 'Invalid request method'})


@csrf_exempt
def admin_reorder_lessons(request, module_id):
    """Admin: Reorder lessons within a module"""
    import json
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            lesson_order = data.get('order', [])  # List of lesson IDs in new order
            
            for index, lesson_id in enumerate(lesson_order):
                models.ModuleLesson.objects.filter(id=lesson_id, module_id=module_id).update(order=index)
            
            return JsonResponse({'bool': True, 'message': 'Lessons reordered successfully'})
        except Exception as e:
            return JsonResponse({'bool': False, 'message': str(e)})
    
    return JsonResponse({'bool': False, 'message': 'Invalid request method'})


@csrf_exempt
def admin_bulk_delete_lessons(request):
    """Admin: Delete multiple lessons at once"""
    import json
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            lesson_ids = data.get('lesson_ids', [])
            
            deleted_count = models.ModuleLesson.objects.filter(id__in=lesson_ids).delete()[0]
            
            return JsonResponse({
                'bool': True, 
                'message': f'{deleted_count} lessons deleted successfully'
            })
        except Exception as e:
            return JsonResponse({'bool': False, 'message': str(e)})
    
    return JsonResponse({'bool': False, 'message': 'Invalid request method'})


class AdminCourseModulesWithLessons(APIView):
    """Admin: Get complete course structure with all modules and lessons"""
    
    def get(self, request, course_id):
        try:
            course = models.Course.objects.get(pk=course_id)
            modules = models.Chapter.objects.filter(course=course).order_by('order', 'id')
            
            modules_data = []
            for module in modules:
                lessons = models.ModuleLesson.objects.filter(module=module).order_by('order', 'id')
                lessons_data = [{
                    'id': lesson.id,
                    'title': lesson.title,
                    'description': lesson.description,
                    'content_type': lesson.content_type,
                    'file': request.build_absolute_uri(lesson.file.url) if lesson.file else None,
                    'duration_seconds': lesson.duration_seconds,
                    'duration_formatted': lesson.duration_formatted,
                    'order': lesson.order
                } for lesson in lessons]
                
                modules_data.append({
                    'id': module.id,
                    'title': module.title,
                    'description': module.description,
                    'order': module.order,
                    'total_lessons': len(lessons_data),
                    'lessons': lessons_data
                })
            
            return Response({
                'course_id': course.id,
                'course_title': course.title,
                'total_modules': len(modules_data),
                'modules': modules_data
            })
        except models.Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)


# ==================== STUDENT LESSON PROGRESS ====================

class StudentModuleProgress(APIView):
    """Get student's progress for a specific course"""
    
    def get(self, request, student_id, course_id):
        try:
            student = models.Student.objects.get(pk=student_id)
            course = models.Course.objects.get(pk=course_id)
            modules = models.Chapter.objects.filter(course=course).order_by('order', 'id')
            
            modules_data = []
            total_lessons = 0
            completed_lessons = 0
            
            for module in modules:
                lessons = models.ModuleLesson.objects.filter(module=module).order_by('order', 'id')
                module_total = lessons.count()
                
                # Get or create module progress
                module_progress, _ = models.ModuleProgress.objects.get_or_create(
                    student=student, module=module
                )
                
                lessons_data = []
                module_completed = 0
                
                for lesson in lessons:
                    lesson_progress = models.ModuleLessonProgress.objects.filter(
                        student=student, lesson=lesson
                    ).first()
                    
                    is_completed = lesson_progress.is_completed if lesson_progress else False
                    if is_completed:
                        module_completed += 1
                        completed_lessons += 1
                    
                    lessons_data.append({
                        'id': lesson.id,
                        'title': lesson.title,
                        'content_type': lesson.content_type,
                        'duration_formatted': lesson.duration_formatted,
                        'is_completed': is_completed,
                        'last_position': lesson_progress.last_position_seconds if lesson_progress else 0
                    })
                
                total_lessons += module_total
                
                modules_data.append({
                    'id': module.id,
                    'title': module.title,
                    'order': module.order,
                    'total_lessons': module_total,
                    'completed_lessons': module_completed,
                    'is_completed': module_progress.is_completed,
                    'lessons': lessons_data
                })
            
            progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            
            return Response({
                'course_id': course.id,
                'course_title': course.title,
                'total_modules': len(modules_data),
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'progress_percentage': round(progress_percentage, 1),
                'modules': modules_data
            })
        except (models.Student.DoesNotExist, models.Course.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)


@csrf_exempt
def mark_lesson_complete(request, student_id, lesson_id):
    """Mark a lesson as completed for a student"""
    from django.utils import timezone
    
    if request.method == 'POST':
        try:
            student = models.Student.objects.get(pk=student_id)
            lesson = models.ModuleLesson.objects.get(pk=lesson_id)
            course = lesson.module.course
            
            # Audit: log lesson completion
            log_access(
                request=request, access_type='lesson_complete', was_allowed=True,
                student=student, course=course, lesson=lesson
            )
            
            # Get or create lesson progress
            progress, created = models.ModuleLessonProgress.objects.get_or_create(
                student=student, lesson=lesson
            )
            
            progress.is_completed = True
            progress.completed_at = timezone.now()
            progress.save()
            
            # Check if module is now complete
            module_progress, _ = models.ModuleProgress.objects.get_or_create(
                student=student, module=lesson.module
            )
            module_progress.check_completion()
            
            # Update CourseProgress
            course_progress, cp_created = models.CourseProgress.objects.get_or_create(
                student=student,
                course=course,
                defaults={'total_chapters': 0, 'completed_chapters': 0}
            )
            
            # Calculate total lessons and completed lessons for this course
            total_lessons = 0
            for chapter in course.course_chapters.all():
                total_lessons += chapter.module_lessons.count()
            
            # Count completed lessons for this student in this course
            completed_lessons = models.ModuleLessonProgress.objects.filter(
                student=student,
                lesson__module__course=course,
                is_completed=True
            ).count()
            
            # Update progress
            course_progress.total_chapters = total_lessons
            course_progress.completed_chapters = completed_lessons
            course_progress.progress_percentage = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
            
            # Check if course is now complete
            if course_progress.progress_percentage >= 100 and not course_progress.is_completed:
                course_progress.is_completed = True
                course_progress.completed_at = timezone.now()
                
                # Check for completion achievements
                try:
                    completed_courses = models.CourseProgress.objects.filter(
                        student=student,
                        is_completed=True
                    ).count()
                    
                    completion_achievements = models.Achievement.objects.filter(
                        achievement_type='completion',
                        is_active=True
                    )
                    for achievement in completion_achievements:
                        if completed_courses >= achievement.requirement_value:
                            models.StudentAchievement.objects.get_or_create(
                                student=student,
                                achievement=achievement
                            )
                except:
                    pass  # Silently fail if achievement check has issues
            
            course_progress.save()
            
            # Auto-award achievements now that progress has been updated
            try:
                check_and_award_achievements(student)
            except Exception as e:
                print(f"[Achievements] Failed to check achievements on lesson complete: {e}")
            
            return JsonResponse({
                'bool': True,
                'message': 'Lesson marked as complete',
                'module_completed': module_progress.is_completed,
                'course_completed': course_progress.is_completed,
                'course_progress_percentage': course_progress.progress_percentage
            })
        except (models.Student.DoesNotExist, models.ModuleLesson.DoesNotExist) as e:
            return JsonResponse({'bool': False, 'message': str(e)})
    
    return JsonResponse({'bool': False, 'message': 'Invalid request method'})


@csrf_exempt
def update_lesson_position(request, student_id, lesson_id):
    """Update the last watched position for video/audio lessons"""
    import json
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            position = data.get('position', 0)
            
            student = models.Student.objects.get(pk=student_id)
            lesson = models.ModuleLesson.objects.get(pk=lesson_id)
            
            progress, _ = models.ModuleLessonProgress.objects.get_or_create(
                student=student, lesson=lesson
            )
            progress.last_position_seconds = position
            progress.save()
            
            return JsonResponse({'bool': True, 'message': 'Position updated'})
        except Exception as e:
            return JsonResponse({'bool': False, 'message': str(e)})
    
    return JsonResponse({'bool': False, 'message': 'Invalid request method'})


class StudentCourseNavigation(APIView):
    """Get next/previous module and lesson for navigation"""
    
    def get(self, request, student_id, course_id, current_lesson_id):
        try:
            course = models.Course.objects.get(pk=course_id)
            current_lesson = models.ModuleLesson.objects.get(pk=current_lesson_id)
            current_module = current_lesson.module
            
            # Get all lessons in course order
            all_modules = models.Chapter.objects.filter(course=course).order_by('order', 'id')
            all_lessons = []
            
            for module in all_modules:
                lessons = models.ModuleLesson.objects.filter(module=module).order_by('order', 'id')
                for lesson in lessons:
                    all_lessons.append({
                        'lesson_id': lesson.id,
                        'lesson_title': lesson.title,
                        'module_id': module.id,
                        'module_title': module.title
                    })
            
            # Find current position
            current_index = None
            for i, lesson in enumerate(all_lessons):
                if lesson['lesson_id'] == current_lesson_id:
                    current_index = i
                    break
            
            prev_lesson = all_lessons[current_index - 1] if current_index and current_index > 0 else None
            next_lesson = all_lessons[current_index + 1] if current_index is not None and current_index < len(all_lessons) - 1 else None
            
            return Response({
                'current': {
                    'lesson_id': current_lesson.id,
                    'lesson_title': current_lesson.title,
                    'module_id': current_module.id,
                    'module_title': current_module.title,
                    'content_type': current_lesson.content_type,
                    'file': request.build_absolute_uri(current_lesson.file.url) if current_lesson.file else None
                },
                'previous': prev_lesson,
                'next': next_lesson,
                'total_lessons': len(all_lessons),
                'current_position': current_index + 1 if current_index is not None else 0
            })
        except Exception as e:
            return Response({'error': str(e)}, status=404)


# ==================== LESSON UNLOCK SYSTEM & DOWNLOADABLES ====================

class StudentModuleProgressEnhanced(APIView):
    """Get student's progress for a specific course with unlock status"""
    
    def get(self, request, student_id, course_id):
        try:
            student = models.Student.objects.get(pk=student_id)
            course = models.Course.objects.get(pk=course_id)

            from .access_control import SubscriptionAccessControl
            has_sub, _, sub_msg = SubscriptionAccessControl.check_subscription_status(student_id)
            if not has_sub:
                return Response({'error': sub_msg, 'subscription_required': True}, status=403)

            enrollment_exists = models.StudentCourseEnrollment.objects.filter(
                student=student,
                course=course
            ).exists()
            if not enrollment_exists:
                return Response({'error': 'Not enrolled in this course'}, status=403)

            modules = models.Chapter.objects.filter(course=course).order_by('order', 'id')
            
            modules_data = []
            total_lessons = 0
            completed_lessons = 0
            first_incomplete_found = False
            
            for module_index, module in enumerate(modules):
                lessons = models.ModuleLesson.objects.filter(module=module).order_by('order', 'id')
                module_total = lessons.count()
                
                # Get or create module progress
                module_progress, _ = models.ModuleProgress.objects.get_or_create(
                    student=student, module=module
                )
                
                lessons_data = []
                module_completed = 0
                
                for lesson_index, lesson in enumerate(lessons):
                    lesson_progress = models.ModuleLessonProgress.objects.filter(
                        student=student, lesson=lesson
                    ).first()
                    
                    is_completed = lesson_progress.is_completed if lesson_progress else False
                    if is_completed:
                        module_completed += 1
                        completed_lessons += 1
                    
                    # Determine if lesson is locked
                    # First lesson is always unlocked, others unlock when previous is complete
                    is_first_lesson = (module_index == 0 and lesson_index == 0)
                    is_preview = lesson.is_preview
                    
                    # A lesson is unlocked if:
                    # 1. It's the first lesson overall, OR
                    # 2. It's marked as a preview lesson, OR
                    # 3. It's already completed, OR
                    # 4. The previous lesson (in order) is completed, OR
                    # 5. It's the first uncompleted lesson (current lesson to work on)
                    
                    is_unlocked = is_first_lesson or is_preview or is_completed
                    
                    if not is_unlocked and not first_incomplete_found:
                        # This is the first incomplete lesson - unlock it
                        is_unlocked = True
                        first_incomplete_found = True
                    elif not is_unlocked:
                        # Check if previous lesson in this module is completed
                        if lesson_index > 0:
                            prev_lesson = lessons[lesson_index - 1]
                            prev_progress = models.ModuleLessonProgress.objects.filter(
                                student=student, lesson=prev_lesson, is_completed=True
                            ).exists()
                            is_unlocked = prev_progress
                    
                    # Get downloadables for this lesson
                    downloadables = models.LessonDownloadable.objects.filter(
                        lesson=lesson
                    ).order_by('order', 'id')
                    
                    downloadables_data = [{
                        'id': d.id,
                        'title': d.title,
                        'file_type': d.file_type,
                        'file_type_display': d.get_file_type_display(),
                        'file_type_icon': d.get_file_type_icon(),
                        'file': request.build_absolute_uri(d.file.url) if d.file else None,
                        'description': d.description,
                        'file_size_formatted': d.file_size_formatted,
                        'file_extension': d.file_extension,
                        'download_count': d.download_count
                    } for d in downloadables]
                    
                    lessons_data.append({
                        'id': lesson.id,
                        'title': lesson.title,
                        'description': lesson.description,
                        'objectives': lesson.objectives,
                        'objectives_list': lesson.objectives_list,
                        'content_type': lesson.content_type,
                        'file': request.build_absolute_uri(lesson.file.url) if lesson.file else None,
                        'duration_seconds': lesson.duration_seconds,
                        'duration_formatted': lesson.duration_formatted,
                        'is_completed': is_completed,
                        'is_preview': is_preview,
                        'is_locked': not is_unlocked,
                        'is_unlocked': is_unlocked,
                        'last_position': lesson_progress.last_position_seconds if lesson_progress else 0,
                        'downloadables': downloadables_data
                    })
                
                total_lessons += module_total
                
                # Module is unlocked if first module or previous module is completed
                module_unlocked = True
                if module_index > 0:
                    prev_module = modules[module_index - 1]
                    prev_module_progress = models.ModuleProgress.objects.filter(
                        student=student, module=prev_module, is_completed=True
                    ).exists()
                    # But if any lesson in this module is unlocked, the module is also unlocked
                    any_lesson_unlocked = any(l['is_unlocked'] for l in lessons_data)
                    module_unlocked = prev_module_progress or any_lesson_unlocked
                
                modules_data.append({
                    'id': module.id,
                    'title': module.title,
                    'description': module.description,
                    'order': module.order,
                    'total_lessons': module_total,
                    'completed_lessons': module_completed,
                    'is_completed': module_progress.is_completed,
                    'is_unlocked': module_unlocked,
                    'lessons': lessons_data
                })
            
            progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            
            return Response({
                'course_id': course.id,
                'course_title': course.title,
                'course_description': course.description,
                'total_modules': len(modules_data),
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'progress_percentage': round(progress_percentage, 1),
                'modules': modules_data
            })
        except (models.Student.DoesNotExist, models.Course.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)


class LessonDownloadableList(generics.ListCreateAPIView):
    """List or create downloadables for a lesson"""
    serializer_class = LessonDownloadableSerializer

    def _validate_manager(self, lesson):
        requester_type = (self.request.GET.get('requester_type') or self.request.data.get('requester_type') or '').strip().lower()
        requester_id = self.request.GET.get('requester_id') or self.request.data.get('requester_id')

        if requester_type == 'admin':
            if not requester_id:
                return JsonResponse({'error': 'requester_id is required for admin'}, status=400)
            admin = models.Admin.objects.filter(id=requester_id).first()
            if not admin:
                return JsonResponse({'error': 'Admin not found'}, status=404)
            return None

        if requester_type == 'teacher':
            if not requester_id:
                return JsonResponse({'error': 'requester_id is required for teacher'}, status=400)
            teacher, blocked_response = _require_approved_teacher(requester_id)
            if blocked_response:
                return blocked_response
            if lesson.module.course.teacher_id != teacher.id:
                return JsonResponse({'error': 'Not authorized for this lesson'}, status=403)
            return None

        return JsonResponse({'error': 'requester_type must be admin or teacher for lesson file management'}, status=403)

    def list(self, request, *args, **kwargs):
        lesson_id = self.kwargs.get('lesson_id')
        try:
            lesson = models.ModuleLesson.objects.select_related('module__course').get(id=lesson_id)
        except models.ModuleLesson.DoesNotExist:
            return Response({'error': 'Lesson not found'}, status=404)

        student_id = request.GET.get('student_id')
        if student_id:
            from .access_control import SubscriptionAccessControl
            can_access, msg, subscription = SubscriptionAccessControl.can_access_lesson(student_id, lesson_id)
            if not can_access:
                return Response({'error': msg, 'subscription_required': True}, status=403)
            if not subscription or not subscription.plan or not subscription.plan.can_download:
                return Response({'error': 'Your plan does not include downloadable resources'}, status=403)
        else:
            blocked = self._validate_manager(lesson)
            if blocked:
                return blocked

        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        lesson_id = self.kwargs.get('lesson_id')
        try:
            lesson = models.ModuleLesson.objects.select_related('module__course').get(id=lesson_id)
        except models.ModuleLesson.DoesNotExist:
            return Response({'error': 'Lesson not found'}, status=404)

        blocked = self._validate_manager(lesson)
        if blocked:
            return blocked

        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        lesson_id = self.kwargs.get('lesson_id')
        return models.LessonDownloadable.objects.filter(lesson_id=lesson_id).order_by('order', 'id')


class LessonDownloadableDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete a downloadable"""
    queryset = models.LessonDownloadable.objects.all()
    serializer_class = LessonDownloadableSerializer

    def _validate_manager(self, downloadable):
        requester_type = (self.request.GET.get('requester_type') or self.request.data.get('requester_type') or '').strip().lower()
        requester_id = self.request.GET.get('requester_id') or self.request.data.get('requester_id')

        if requester_type == 'admin':
            if not requester_id:
                return JsonResponse({'error': 'requester_id is required for admin'}, status=400)
            admin = models.Admin.objects.filter(id=requester_id).first()
            if not admin:
                return JsonResponse({'error': 'Admin not found'}, status=404)
            return None

        if requester_type == 'teacher':
            if not requester_id:
                return JsonResponse({'error': 'requester_id is required for teacher'}, status=400)
            teacher, blocked_response = _require_approved_teacher(requester_id)
            if blocked_response:
                return blocked_response
            if downloadable.lesson.module.course.teacher_id != teacher.id:
                return JsonResponse({'error': 'Not authorized for this lesson'}, status=403)
            return None

        return JsonResponse({'error': 'requester_type must be admin or teacher for lesson file management'}, status=403)

    def retrieve(self, request, *args, **kwargs):
        downloadable = self.get_object()
        student_id = request.GET.get('student_id')

        if student_id:
            from .access_control import SubscriptionAccessControl
            can_access, msg, subscription = SubscriptionAccessControl.can_access_lesson(student_id, downloadable.lesson_id)
            if not can_access:
                return Response({'error': msg, 'subscription_required': True}, status=403)
            if not subscription or not subscription.plan or not subscription.plan.can_download:
                return Response({'error': 'Your plan does not include downloadable resources'}, status=403)
            return super().retrieve(request, *args, **kwargs)

        blocked = self._validate_manager(downloadable)
        if blocked:
            return blocked
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        downloadable = self.get_object()
        blocked = self._validate_manager(downloadable)
        if blocked:
            return blocked
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        downloadable = self.get_object()
        blocked = self._validate_manager(downloadable)
        if blocked:
            return blocked
        return super().destroy(request, *args, **kwargs)


@csrf_exempt
def increment_download_count(request, downloadable_id):
    """Increment download count for a downloadable"""
    if request.method == 'POST':
        try:
            downloadable = models.LessonDownloadable.objects.get(pk=downloadable_id)

            data = _extract_request_data(request)
            student_id = data.get('student_id')
            if not student_id:
                return JsonResponse({'bool': False, 'message': 'student_id is required'}, status=400)

            from .access_control import SubscriptionAccessControl
            can_access, msg, subscription = SubscriptionAccessControl.can_access_lesson(student_id, downloadable.lesson_id)
            if not can_access:
                return JsonResponse({'bool': False, 'message': msg}, status=403)
            if not subscription or not subscription.plan or not subscription.plan.can_download:
                return JsonResponse({'bool': False, 'message': 'Your plan does not include downloadable resources'}, status=403)

            downloadable.download_count += 1
            downloadable.save()
            return JsonResponse({'bool': True, 'download_count': downloadable.download_count})
        except models.LessonDownloadable.DoesNotExist:
            return JsonResponse({'bool': False, 'message': 'Downloadable not found'})
    return JsonResponse({'bool': False, 'message': 'Invalid request method'})


class LessonDetailWithDownloadables(APIView):
    """Get detailed lesson info with objectives and downloadables"""
    
    def get(self, request, lesson_id, student_id=None):
        try:
            lesson = models.ModuleLesson.objects.get(pk=lesson_id)
            
            # Check active subscription before serving lesson details
            if student_id:
                from .access_control import SubscriptionAccessControl
                has_sub, subscription, sub_msg = SubscriptionAccessControl.check_subscription_status(student_id)
                if not has_sub and not lesson.is_preview:
                    return Response({
                        'error': sub_msg,
                        'subscription_required': True
                    }, status=403)

                can_access, access_msg, _ = SubscriptionAccessControl.can_access_lesson(student_id, lesson_id)
                if not can_access:
                    return Response({
                        'error': access_msg,
                        'subscription_required': True
                    }, status=403)
            
            # Get student progress if student_id provided
            is_completed = False
            last_position = 0
            is_unlocked = True
            
            if student_id:
                try:
                    student = models.Student.objects.get(pk=student_id)
                    progress = models.ModuleLessonProgress.objects.filter(
                        student=student, lesson=lesson
                    ).first()
                    if progress:
                        is_completed = progress.is_completed
                        last_position = progress.last_position_seconds
                    
                    # Check unlock status
                    course = lesson.module.course
                    module = lesson.module
                    
                    # Get all lessons before this one
                    prev_lessons = models.ModuleLesson.objects.filter(
                        module__course=course,
                        module__order__lte=module.order
                    ).exclude(
                        module=module, order__gte=lesson.order
                    ).exclude(id=lesson.id)
                    
                    # Check if this is the first lesson
                    is_first = not prev_lessons.exists()
                    
                    if not is_first and not lesson.is_preview:
                        # Check if all previous lessons are completed
                        all_prev_completed = all(
                            models.ModuleLessonProgress.objects.filter(
                                student=student, lesson=prev_lesson, is_completed=True
                            ).exists()
                            for prev_lesson in prev_lessons
                        )
                        is_unlocked = all_prev_completed or is_completed
                    
                except models.Student.DoesNotExist:
                    pass
            
            # Get downloadables
            downloadables = models.LessonDownloadable.objects.filter(
                lesson=lesson
            ).order_by('order', 'id')
            
            downloadables_data = [{
                'id': d.id,
                'title': d.title,
                'file_type': d.file_type,
                'file_type_display': d.get_file_type_display(),
                'file_type_icon': d.get_file_type_icon(),
                'file': request.build_absolute_uri(d.file.url) if d.file else None,
                'description': d.description,
                'file_size_formatted': d.file_size_formatted,
                'file_extension': d.file_extension,
                'download_count': d.download_count
            } for d in downloadables]
            
            return Response({
                'id': lesson.id,
                'title': lesson.title,
                'description': lesson.description,
                'objectives': lesson.objectives,
                'objectives_list': lesson.objectives_list,
                'content_type': lesson.content_type,
                'file': request.build_absolute_uri(lesson.file.url) if lesson.file else None,
                'duration_seconds': lesson.duration_seconds,
                'duration_formatted': lesson.duration_formatted,
                'is_preview': lesson.is_preview,
                'is_completed': is_completed,
                'is_unlocked': is_unlocked,
                'last_position': last_position,
                'module': {
                    'id': lesson.module.id,
                    'title': lesson.module.title
                },
                'course': {
                    'id': lesson.module.course.id,
                    'title': lesson.module.course.title
                },
                'downloadables': downloadables_data
            })
        except models.ModuleLesson.DoesNotExist:
            return Response({'error': 'Lesson not found'}, status=404)


def check_lesson_unlock_status(request, student_id, lesson_id):
    """Check if a specific lesson is unlocked for a student"""
    try:
        student = models.Student.objects.get(pk=student_id)
        lesson = models.ModuleLesson.objects.get(pk=lesson_id)
        course = lesson.module.course
        module = lesson.module
        
        # Get progress for this lesson
        progress = models.ModuleLessonProgress.objects.filter(
            student=student, lesson=lesson
        ).first()
        is_completed = progress.is_completed if progress else False
        
        # If already completed or preview, it's unlocked
        if is_completed or lesson.is_preview:
            return JsonResponse({'is_unlocked': True, 'is_completed': is_completed})
        
        # Get all lessons in the course ordered
        all_modules = models.Chapter.objects.filter(course=course).order_by('order', 'id')
        all_lessons = []
        
        for mod in all_modules:
            lessons = models.ModuleLesson.objects.filter(module=mod).order_by('order', 'id')
            all_lessons.extend(lessons)
        
        # Find index of current lesson
        current_index = None
        for i, l in enumerate(all_lessons):
            if l.id == lesson.id:
                current_index = i
                break
        
        # First lesson is always unlocked
        if current_index == 0:
            return JsonResponse({'is_unlocked': True, 'is_completed': is_completed})
        
        # Check if previous lesson is completed
        prev_lesson = all_lessons[current_index - 1]
        prev_progress = models.ModuleLessonProgress.objects.filter(
            student=student, lesson=prev_lesson, is_completed=True
        ).exists()
        
        return JsonResponse({
            'is_unlocked': prev_progress,
            'is_completed': is_completed,
            'requires_completion_of': {
                'id': prev_lesson.id,
                'title': prev_lesson.title
            } if not prev_progress else None
        })
        
    except (models.Student.DoesNotExist, models.ModuleLesson.DoesNotExist) as e:
        return JsonResponse({'error': str(e)}, status=404)


# ==================== CONSOLIDATED STUDENT LESSON PAGE DATA ====================

class StudentLessonPageData(APIView):
    """
    Consolidated endpoint that returns ALL data needed for the lesson player page
    in a single API call. Replaces 3 separate calls:
    - /fetch-enroll-status/
    - /progress-enhanced/
    - /navigation/
    """
    
    def get(self, request, student_id, course_id, lesson_id=None):
        try:
            student = models.Student.objects.get(pk=student_id)
            course = models.Course.objects.get(pk=course_id)
            
            # Check active subscription before serving lesson content
            from .access_control import SubscriptionAccessControl
            has_sub, subscription, sub_msg = SubscriptionAccessControl.check_subscription_status(student_id)
            if not has_sub:
                return Response({
                    'error': sub_msg,
                    'subscription_required': True
                }, status=403)

            if lesson_id:
                can_access_lesson, lesson_msg, _ = SubscriptionAccessControl.can_access_lesson(student_id, lesson_id)
                if not can_access_lesson:
                    return Response({
                        'error': lesson_msg,
                        'subscription_required': True
                    }, status=403)
            
            # Check enrollment
            enrollment = models.StudentCourseEnrollment.objects.filter(
                student=student, course=course
            ).exists()
            
            if not enrollment:
                return Response({
                    'is_enrolled': False,
                    'error': 'Not enrolled in this course'
                }, status=403)
            
            # Get all modules with lessons and progress
            modules = models.Chapter.objects.filter(course=course).order_by('order', 'id')
            
            modules_data = []
            total_lessons = 0
            completed_lessons = 0
            current_lesson_data = None
            all_lessons = []
            current_lesson_index = None
            
            for module_index, module in enumerate(modules):
                lessons = models.ModuleLesson.objects.filter(module=module).order_by('order', 'id')
                module_total = lessons.count()
                
                module_progress, _ = models.ModuleProgress.objects.get_or_create(
                    student=student, module=module
                )
                
                lessons_data = []
                module_completed = 0
                
                for lesson_index, lesson in enumerate(lessons):
                    lesson_progress = models.ModuleLessonProgress.objects.filter(
                        student=student, lesson=lesson
                    ).first()
                    
                    is_completed = lesson_progress.is_completed if lesson_progress else False
                    if is_completed:
                        module_completed += 1
                        completed_lessons += 1
                    
                    # Determine if lesson is locked (based on previous module completion)
                    is_locked = False
                    if module_index > 0:
                        prev_module = modules[module_index - 1]
                        prev_module_progress = models.ModuleProgress.objects.filter(
                            student=student, module=prev_module
                        ).first()
                        if prev_module_progress and not prev_module_progress.is_completed:
                            is_locked = True

                    lesson_access_allowed = lesson.is_preview
                    if not lesson_access_allowed:
                        lesson_access_allowed, _ = subscription.can_access_lesson(lesson)

                    can_download_resources = (
                        lesson_access_allowed and
                        subscription and
                        subscription.plan and
                        subscription.plan.can_download
                    )
                    
                    # Get lesson downloadables
                    downloadables_data = []
                    if can_download_resources:
                        downloadables = models.LessonDownloadable.objects.filter(
                            lesson=lesson
                        ).order_by('order')
                    
                        for downloadable in downloadables:
                            downloadables_data.append({
                                'id': downloadable.id,
                                'title': downloadable.title,
                                'file': request.build_absolute_uri(downloadable.file.url) if downloadable.file else None,
                                'file_type': downloadable.file_type,
                                'file_type_display': downloadable.get_file_type_display(),
                                'file_size_formatted': downloadable.file_size_formatted,
                                'download_count': downloadable.download_count,
                            })
                    
                    lesson_obj = {
                        'id': lesson.id,
                        'title': lesson.title,
                        'description': lesson.description,
                        'content_type': lesson.content_type,
                        'file': request.build_absolute_uri(lesson.file.url) if (lesson.file and lesson_access_allowed) else None,
                        'duration_seconds': lesson.duration_seconds,
                        'duration_formatted': lesson.duration_formatted,
                        'is_completed': is_completed,
                        'is_locked': is_locked,
                        'is_preview': lesson.is_preview,
                        'is_access_allowed': lesson_access_allowed,
                        'can_download_resources': bool(can_download_resources),
                        'last_position': lesson_progress.last_position_seconds if lesson_progress else 0,
                        'objectives': lesson.objectives,
                        'objectives_list': lesson.objectives_list or [],
                        'downloadables': downloadables_data,
                        'module_id': module.id,
                        'module_title': module.title,
                    }
                    
                    lessons_data.append(lesson_obj)
                    all_lessons.append(lesson_obj)
                    
                    # If lesson_id matches, store this as current
                    if lesson.id == lesson_id:
                        current_lesson_data = lesson_obj
                        current_lesson_index = len(all_lessons) - 1
                
                total_lessons += module_total
                
                modules_data.append({
                    'id': module.id,
                    'title': module.title,
                    'order': module.order,
                    'description': module.description,
                    'total_lessons': module_total,
                    'completed_lessons': module_completed,
                    'is_completed': module_progress.is_completed,
                    'lessons': lessons_data
                })
            
            # If no lesson_id or invalid lesson, use first unlocked incomplete
            if not current_lesson_data and all_lessons:
                for lesson in all_lessons:
                    if not lesson['is_locked'] and not lesson['is_completed']:
                        current_lesson_data = lesson
                        current_lesson_index = all_lessons.index(lesson)
                        break
                
                # Fallback to first lesson if all completed
                if not current_lesson_data:
                    current_lesson_data = all_lessons[0]
                    current_lesson_index = 0
            
            # Compute navigation from all_lessons list
            previous_lesson = None
            next_lesson = None
            
            if current_lesson_index is not None:
                if current_lesson_index > 0:
                    prev = all_lessons[current_lesson_index - 1]
                    previous_lesson = {
                        'id': prev['id'],
                        'title': prev['title'],
                        'module_id': prev['module_id'],
                        'module_title': prev['module_title'],
                    }
                
                if current_lesson_index < len(all_lessons) - 1:
                    nxt = all_lessons[current_lesson_index + 1]
                    next_lesson = {
                        'id': nxt['id'],
                        'title': nxt['title'],
                        'module_id': nxt['module_id'],
                        'module_title': nxt['module_title'],
                    }
            
            progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            
            return Response({
                'is_enrolled': True,
                'course': {
                    'id': course.id,
                    'title': course.title,
                    'description': course.description,
                },
                'modules': modules_data,
                'current_lesson': current_lesson_data,
                'navigation': {
                    'previous': previous_lesson,
                    'next': next_lesson,
                    'current_position': (current_lesson_index + 1) if current_lesson_index is not None else 0,
                    'total_lessons': len(all_lessons)
                },
                'progress': {
                    'completed_lessons': completed_lessons,
                    'total_lessons': total_lessons,
                    'overall_progress': round(progress_percentage, 1)
                }
            })
            
        except models.Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)
        except models.Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


# ==================== SUBSCRIPTION MANAGEMENT VIEWS ====================

class SubscriptionPlanList(generics.ListCreateAPIView):
    """List and create subscription plans"""
    serializer_class = SubscriptionPlanSerializer
    pagination_class = StandardResultSetPagination
    
    def get_queryset(self):
        queryset = models.SubscriptionPlan.objects.all()
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Create with detailed logging"""
        print('=' * 50)
        print('SUBSCRIPTION PLAN CREATE REQUEST')
        print('=' * 50)
        print(f'Request data: {request.data}')
        print(f'Request content type: {request.content_type}')
        
        try:
            response = super().create(request, *args, **kwargs)
            print('Plan created successfully')
            return response
        except Exception as e:
            print(f'ERROR CREATING PLAN: {e}')
            print(f'Error type: {type(e).__name__}')
            import traceback
            print(traceback.format_exc())
            raise


class SubscriptionPlanDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a subscription plan"""
    queryset = models.SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer


class SubscriptionList(generics.ListCreateAPIView):
    """List and create subscriptions (admin can create subscriptions for students)"""
    queryset = models.Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    pagination_class = StandardResultSetPagination
    
    def get_queryset(self):
        queryset = models.Subscription.objects.all()
        
        # Filter by student if specified
        student_id = self.request.query_params.get('student_id', None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by plan
        plan_id = self.request.query_params.get('plan_id', None)
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Save subscription and create history entry"""
        subscription = serializer.save()
        
        # Create history entry
        models.SubscriptionHistory.objects.create(
            subscription=subscription,
            action='created',
            new_status=subscription.status,
            new_plan=subscription.plan,
            changed_by='admin'
        )
        
        # Audit: log the payment
        log_payment(
            student=subscription.student,
            subscription=subscription,
            plan=subscription.plan,
            amount=subscription.price_paid or subscription.plan.price,
            payment_type='subscription_purchase',
            status='completed' if subscription.is_paid else 'pending',
            request=self.request,
        )


class SubscriptionDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a subscription"""
    queryset = models.Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    
    def perform_update(self, serializer):
        """Track subscription changes in history"""
        old_subscription = self.get_object()
        new_subscription = serializer.save()
        
        # Determine action
        action = 'updated'
        if old_subscription.status != new_subscription.status:
            if new_subscription.status == 'cancelled':
                action = 'cancelled'
            elif old_subscription.status == 'pending' and new_subscription.status == 'active':
                action = 'activated'
            elif old_subscription.plan != new_subscription.plan:
                action = 'upgraded' if new_subscription.plan.price > old_subscription.plan.price else 'downgraded'
        
        # Create history entry
        models.SubscriptionHistory.objects.create(
            subscription=new_subscription,
            action=action,
            old_status=old_subscription.status,
            new_status=new_subscription.status,
            old_plan=old_subscription.plan,
            new_plan=new_subscription.plan,
            changed_by='admin'
        )


@csrf_exempt
def activate_subscription(request, subscription_id):
    """Activate a pending subscription"""
    try:
        subscription = models.Subscription.objects.get(id=subscription_id)
        subscription.activate()
        
        # Audit: log activation as access event
        log_access(
            request=request, access_type='course_enroll', was_allowed=True,
            student=subscription.student, subscription=subscription
        )
        log_activity(request, 'update', f'Subscription #{subscription.id} activated for {subscription.student.fullname}',
                     model_name='Subscription', object_id=subscription.id)
        
        return JsonResponse({
            'bool': True,
            'message': 'Subscription activated successfully',
            'subscription': {
                'id': subscription.id,
                'status': subscription.status,
                'activated_at': subscription.activated_at.isoformat()
            }
        })
    except models.Subscription.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Subscription not found'}, status=404)
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)}, status=400)


@csrf_exempt
def cancel_subscription(request, subscription_id):
    """Cancel an active subscription"""
    try:
        subscription = models.Subscription.objects.get(id=subscription_id)
        subscription.cancel()
        
        # Audit: log cancellation as access event
        log_access(
            request=request, access_type='course_unenroll', was_allowed=True,
            student=subscription.student, subscription=subscription
        )
        log_activity(request, 'update', f'Subscription #{subscription.id} cancelled for {subscription.student.fullname}',
                     model_name='Subscription', object_id=subscription.id)
        
        return JsonResponse({
            'bool': True,
            'message': 'Subscription cancelled successfully',
            'subscription': {
                'id': subscription.id,
                'status': subscription.status,
                'cancelled_at': subscription.cancelled_at.isoformat()
            }
        })
    except models.Subscription.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Subscription not found'}, status=404)
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)}, status=400)


class SubscriptionHistoryList(generics.ListAPIView):
    """Get subscription history"""
    serializer_class = SubscriptionHistorySerializer
    pagination_class = StandardResultSetPagination
    
    def get_queryset(self):
        queryset = models.SubscriptionHistory.objects.all()
        
        # Filter by subscription if specified
        subscription_id = self.request.query_params.get('subscription_id', None)
        if subscription_id:
            queryset = queryset.filter(subscription_id=subscription_id)
        
        # Filter by student
        student_id = self.request.query_params.get('student_id', None)
        if student_id:
            queryset = queryset.filter(subscription__student_id=student_id)
        
        return queryset.order_by('-created_at')


@csrf_exempt
def create_payment_intent(request):
    """Create a Stripe payment intent for subscription"""
    import json
    import stripe
    import os
    
    print("\n" + "="*80)
    print(f"🔍 PAYMENT INTENT REQUEST RECEIVED")
    print(f"Method: {request.method}")
    print(f"Content-Type: {request.headers.get('Content-Type')}")
    print(f"Request body length: {len(request.body)} bytes")
    print("="*80)
    
    # Set Stripe API key from environment
    stripe_secret_key = os.environ.get('STRIPE_SECRET_KEY')
    if not stripe_secret_key:
        print("❌ STRIPE_SECRET_KEY not configured")
        return JsonResponse({
            'error': 'Stripe API key not configured. Please set STRIPE_SECRET_KEY environment variable.'
        }, status=500)
    
    print(f"✅ STRIPE_SECRET_KEY found")
    print(f"   Key length: {len(stripe_secret_key)} chars")
    print(f"   First 20 chars: {stripe_secret_key[:20]}")
    print(f"   Last 20 chars: {stripe_secret_key[-20:]}")
    print(f"   Full key: {stripe_secret_key}")
    stripe.api_key = stripe_secret_key
    
    if request.method == 'POST':
        try:
            print("\n📥 Attempting to parse JSON from request body...")
            print(f"Raw body: {request.body[:200]}...")  # Print first 200 chars
            
            data = json.loads(request.body)
            print(f"\n✅ JSON parsed successfully!")
            print(f"📊 Full data: {data}")
            
            amount = data.get('amount')
            plan_id = data.get('plan_id')
            student_id = data.get('student_id')
            email = data.get('email')
            name = data.get('name')
            
            # Print each field
            print(f"\n📋 Received fields:")
            print(f"   amount: {amount} (type: {type(amount).__name__})")
            print(f"   plan_id: {plan_id} (type: {type(plan_id).__name__})")
            print(f"   student_id: {student_id} (type: {type(student_id).__name__})")
            print(f"   email: {email}")
            print(f"   name: {name}")
            
            # Validate required fields
            if not all([amount, plan_id, student_id, email, name]):
                missing_fields = []
                if not amount: missing_fields.append('amount')
                if not plan_id: missing_fields.append('plan_id')
                if not student_id: missing_fields.append('student_id')
                if not email: missing_fields.append('email')
                if not name: missing_fields.append('name')
                
                error_msg = f'Missing required fields: {", ".join(missing_fields)}'
                print(f"\n❌ {error_msg}")
                print(f"Received: {data}")
                return JsonResponse({
                    'error': error_msg,
                    'received_fields': {
                        'amount': amount,
                        'plan_id': plan_id,
                        'student_id': student_id,
                        'email': email,
                        'name': name
                    }
                }, status=400)
            
            if amount <= 0:
                print(f"\n❌ Invalid amount: {amount}")
                return JsonResponse({'error': 'Invalid amount'}, status=400)
            
            print(f"\n✅ All validations passed!")
            
            # Verify the plan exists
            try:
                plan = models.SubscriptionPlan.objects.get(id=plan_id)
                print(f"✅ Plan found: {plan.name} (id: {plan_id})")
            except models.SubscriptionPlan.DoesNotExist:
                print(f"❌ Plan not found with id: {plan_id}")
                return JsonResponse({'error': 'Plan not found'}, status=404)
            
            # Verify the student exists
            try:
                student = models.Student.objects.get(id=student_id)
                print(f"✅ Student found: {student.fullname} (id: {student_id})")
            except models.Student.DoesNotExist:
                print(f"❌ Student not found with id: {student_id}")
                return JsonResponse({'error': 'Student not found'}, status=404)
            
            print(f"\n🔐 Creating Stripe Payment Intent...")
            print(f"   Amount: {int(amount)} cents (${amount/100})")
            print(f"   Currency: USD")
            print(f"   Description: Subscription to {plan.name} plan")
            
            # Create Stripe payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(amount),
                currency='usd',
                description=f'Subscription to {plan.name} plan',
                metadata={
                    'plan_id': str(plan_id),
                    'plan_name': plan.name,
                    'student_id': str(student_id),
                    'student_email': email,
                    'student_name': name
                },
                receipt_email=email
            )
            
            print(f"✅ Payment intent created successfully!")
            print(f"   Intent ID: {intent.id}")
            print(f"   Client Secret: {intent.client_secret[:30]}...")
            print("="*80 + "\n")
            
            return JsonResponse({
                'clientSecret': intent.client_secret,
                'paymentIntentId': intent.id,
                'status': 'success'
            })
        except stripe.error.CardError as e:
            print(f"\n❌ Stripe Card Error: {str(e.user_message)}")
            return JsonResponse({'error': f'Card error: {str(e.user_message)}'}, status=400)
        except stripe.error.RateLimitError:
            print(f"\n❌ Stripe Rate Limit Error")
            return JsonResponse({'error': 'Rate limit exceeded. Please try again later.'}, status=400)
        except stripe.error.InvalidRequestError as e:
            print(f"\n❌ Stripe Invalid Request: {str(e)}")
            print(f"Details: {e.http_body}")
            return JsonResponse({'error': f'Invalid request: {str(e)}'}, status=400)
        except stripe.error.AuthenticationError as e:
            print(f"\n❌ Stripe Authentication Error!")
            print(f"Error message: {str(e)}")
            print(f"HTTP status: {e.http_status}")
            print(f"HTTP body: {e.http_body}")
            print(f"This usually means your Stripe API key is invalid or expired.")
            return JsonResponse({
                'error': 'Stripe authentication failed - Invalid API key',
                'details': str(e)
            }, status=400)
        except stripe.error.APIConnectionError as e:
            print(f"\n❌ Stripe API Connection Error")
            print(f"Error: {str(e)}")
            return JsonResponse({'error': 'Network connection error. Please try again.'}, status=400)
        except stripe.error.StripeError as e:
            print(f"\n❌ Stripe Error: {str(e)}")
            print(f"Type: {type(e).__name__}")
            return JsonResponse({'error': f'Stripe error: {str(e)}'}, status=400)
        except json.JSONDecodeError as e:
            print(f"\n❌ JSON Decode Error: {str(e)}")
            print(f"Request body was: {request.body}")
            return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
        except Exception as e:
            import traceback
            print(f"\n❌ Unexpected Error: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
    
    print(f"\n❌ Invalid request method: {request.method}")
    return JsonResponse({'error': 'Invalid request method. Use POST.'}, status=405)


@csrf_exempt
def get_admin_subscription_stats(request):
    """Get subscription statistics for admin dashboard"""
    try:
        total_plans = models.SubscriptionPlan.objects.filter(status='active').count()
        total_subscriptions = models.Subscription.objects.count()
        active_subscriptions = models.Subscription.objects.filter(status='active').count()
        pending_subscriptions = models.Subscription.objects.filter(status='pending').count()
        cancelled_subscriptions = models.Subscription.objects.filter(status='cancelled').count()
        
        # Get total revenue
        from django.db.models import Sum, Count
        total_revenue = models.Subscription.objects.filter(
            is_paid=True
        ).aggregate(total=Sum('price_paid'))['total'] or 0
        
        # Get popular plans
        popular_plans = models.SubscriptionPlan.objects.annotate(
            subscriber_count=Count('subscriptions')
        ).order_by('-subscriber_count')[:5]
        
        popular_plans_data = []
        for plan in popular_plans:
            popular_plans_data.append({
                'id': plan.id,
                'name': plan.name,
                'subscriber_count': plan.subscriber_count,
                'price': str(plan.price)
            })
        
        return JsonResponse({
            'bool': True,
            'stats': {
                'total_plans': total_plans,
                'total_subscriptions': total_subscriptions,
                'active_subscriptions': active_subscriptions,
                'pending_subscriptions': pending_subscriptions,
                'cancelled_subscriptions': cancelled_subscriptions,
                'total_revenue': float(total_revenue),
                'popular_plans': popular_plans_data
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'bool': False, 'message': str(e)}, status=200)


# ==================== ACCESS CONTROL VIEWS ====================

from .access_control import (
    SubscriptionAccessControl, 
    get_student_access_summary,
    validate_course_for_enrollment
)


def _validate_student_requester(request, student_id):
    data = _extract_request_data(request)
    requester_student_id = (
        request.GET.get('requester_student_id')
        or data.get('requester_student_id')
        or request.META.get('HTTP_X_STUDENT_ID')
    )

    if str(requester_student_id or '') != str(student_id):
        return JsonResponse({
            'error': 'Unauthorized requester for this student context'
        }, status=403)
    return None


@csrf_exempt
def check_subscription_access(request, student_id):
    """
    Check if student has active subscription and return access details.
    GET /api/access/check-subscription/<student_id>/
    """
    try:
        blocked = _validate_student_requester(request, student_id)
        if blocked:
            return blocked

        has_sub, subscription, msg = SubscriptionAccessControl.check_subscription_status(student_id)
        
        response_data = {
            'has_active_subscription': has_sub,
            'message': msg,
        }
        
        if subscription:
            response_data['subscription'] = {
                'id': subscription.id,
                'status': subscription.status,
                'plan_name': subscription.plan.name if subscription.plan else None,
                'plan_id': subscription.plan.id if subscription.plan else None,
                'access_level': subscription.plan.access_level if subscription.plan else None,
                'start_date': subscription.start_date.isoformat() if subscription.start_date else None,
                'end_date': subscription.end_date.isoformat() if subscription.end_date else None,
                'days_remaining': subscription.days_remaining(),
                'is_paid': subscription.is_paid,
                'assigned_teacher': {
                    'id': subscription.assigned_teacher.id,
                    'name': subscription.assigned_teacher.full_name
                } if subscription.assigned_teacher else None,
            }
            
            if has_sub:
                response_data['usage'] = subscription.get_usage_summary()
        
        return JsonResponse(response_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': str(e),
            'has_active_subscription': False
        }, status=500)


@csrf_exempt
def check_course_access(request, student_id, course_id):
    """
    Check if student can access/enroll in a specific course.
    GET /api/access/course/<student_id>/<course_id>/
    """
    try:
        blocked = _validate_student_requester(request, student_id)
        if blocked:
            return blocked

        # First check if already enrolled - if so, allow access
        already_enrolled = models.StudentCourseEnrollment.objects.filter(
            student_id=student_id,
            course_id=course_id
        ).exists()
        if already_enrolled:
            return JsonResponse({
                'can_access': True,
                'can_enroll': False,
                'message': 'You are already enrolled in this course.',
                'validation': {'enrolled': True}
            })
        
        # If not enrolled, check if can enroll
        can_enroll, msg = SubscriptionAccessControl.can_enroll_in_course(student_id, course_id)
        
        # Get additional validation details
        validation = validate_course_for_enrollment(student_id, course_id)
        
        return JsonResponse({
            'can_access': can_enroll,
            'can_enroll': can_enroll,
            'message': msg,
            'validation': validation
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'can_access': False,
            'can_enroll': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
def check_lesson_access(request, student_id, lesson_id):
    """
    Check if student can access a specific lesson.
    GET /api/access/lesson/<student_id>/<lesson_id>/
    """
    try:
        blocked = _validate_student_requester(request, student_id)
        if blocked:
            return blocked

        can_access, msg, subscription = SubscriptionAccessControl.can_access_lesson(student_id, lesson_id)
        
        response_data = {
            'can_access': can_access,
            'message': msg
        }
        
        if subscription:
            response_data['usage'] = subscription.get_usage_summary()
        
        # Get lesson details for context
        try:
            lesson = models.ModuleLesson.objects.select_related('module', 'module__course').get(id=lesson_id)
            response_data['lesson'] = {
                'id': lesson.id,
                'title': lesson.title,
                'is_preview': lesson.is_preview,
                'required_access_level': lesson.required_access_level,
                'course_title': lesson.module.course.title if lesson.module and lesson.module.course else None
            }
        except models.ModuleLesson.DoesNotExist:
            pass
        
        return JsonResponse(response_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'can_access': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
def record_lesson_access(request, student_id, lesson_id):
    """
    Record that a student accessed a lesson (updates usage counters).
    POST /api/access/record-lesson/<student_id>/<lesson_id>/
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        blocked = _validate_student_requester(request, student_id)
        if blocked:
            return blocked

        success, msg = SubscriptionAccessControl.record_lesson_access(student_id, lesson_id)
        
        if success:
            subscription = SubscriptionAccessControl.get_active_subscription(student_id)
            return JsonResponse({
                'success': True,
                'message': msg,
                'usage': subscription.get_usage_summary() if subscription else None
            })
        else:
            return JsonResponse({
                'success': False,
                'message': msg
            }, status=403)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
def enroll_with_subscription(request):
    """
    Enroll student in course with subscription validation.
    POST /api/access/enroll/
    Body: { "student_id": int, "course_id": int }
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        import json
        data = json.loads(request.body)
        student_id = data.get('student_id')
        course_id = data.get('course_id')
        
        if not student_id or not course_id:
            return JsonResponse({
                'success': False,
                'error': 'student_id and course_id are required'
            }, status=400)
        
        success, enrollment, msg = SubscriptionAccessControl.enroll_student_in_course(student_id, course_id)
        
        if success:
            subscription = SubscriptionAccessControl.get_active_subscription(student_id)
            # Audit: log enrollment
            try:
                student_obj = models.Student.objects.get(id=student_id)
                course_obj = models.Course.objects.get(id=course_id)
                log_access(
                    request=request, access_type='course_enroll', was_allowed=True,
                    student=student_obj, course=course_obj, subscription=subscription
                )
            except Exception:
                pass
            
            return JsonResponse({
                'success': True,
                'message': msg,
                'enrollment_id': enrollment.id,
                'usage': subscription.get_usage_summary() if subscription else None
            })
        else:
            # Audit: log denied enrollment
            try:
                student_obj = models.Student.objects.get(id=student_id)
                course_obj = models.Course.objects.get(id=course_id)
                log_access(
                    request=request, access_type='course_enroll', was_allowed=False,
                    denial_reason=msg, student=student_obj, course=course_obj
                )
            except Exception:
                pass
            
            return JsonResponse({
                'success': False,
                'message': msg
            }, status=403)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
def get_student_access_info(request, student_id):
    """
    Get complete access summary for a student.
    GET /api/access/summary/<student_id>/
    """
    try:
        blocked = _validate_student_requester(request, student_id)
        if blocked:
            return blocked

        summary = get_student_access_summary(student_id)
        return JsonResponse(summary)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': str(e),
            'has_active_subscription': False
        }, status=500)


@csrf_exempt
def get_accessible_courses(request, student_id):
    """
    Get list of courses accessible to a student based on their subscription.
    GET /api/access/courses/<student_id>/
    """
    try:
        blocked = _validate_student_requester(request, student_id)
        if blocked:
            return blocked

        subscription = SubscriptionAccessControl.get_active_subscription(student_id)
        
        if not subscription:
            return JsonResponse({
                'has_subscription': False,
                'courses': [],
                'message': 'No active subscription'
            })
        
        courses = subscription.get_accessible_courses()
        courses_data = []
        
        for course in courses.select_related('teacher', 'category')[:50]:  # Limit to 50
            courses_data.append({
                'id': course.id,
                'title': course.title,
                'description': course.description[:200] if course.description else '',
                'teacher': course.teacher.full_name if course.teacher else None,
                'teacher_id': course.teacher.id if course.teacher else None,
                'category': course.category.title if course.category else None,
                'category_id': course.category.id if course.category else None,
                'featured_img': course.featured_img.url if course.featured_img else None,
                'required_access_level': course.required_access_level,
            })
        
        return JsonResponse({
            'has_subscription': True,
            'total_accessible': courses.count(),
            'courses': courses_data,
            'usage': subscription.get_usage_summary()
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': str(e),
            'courses': []
        }, status=500)


@csrf_exempt
def get_assigned_teacher(request, student_id):
    """
    Get the teacher assigned to a student's subscription.
    GET /api/access/assigned-teacher/<student_id>/
    """
    try:
        blocked = _validate_student_requester(request, student_id)
        if blocked:
            return blocked

        teacher = SubscriptionAccessControl.get_assigned_teacher(student_id)
        
        if teacher:
            return JsonResponse({
                'has_assigned_teacher': True,
                'teacher': {
                    'id': teacher.id,
                    'full_name': teacher.full_name,
                    'email': teacher.email,
                    'qualification': teacher.qualification,
                    'profile_img': teacher.profile_img.url if teacher.profile_img else None,
                    'skills': teacher.skill_list() if teacher.skills else []
                }
            })
        else:
            return JsonResponse({
                'has_assigned_teacher': False,
                'message': 'No teacher assigned to your subscription'
            })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': str(e),
            'has_assigned_teacher': False
        }, status=500)


@csrf_exempt
def assign_teacher_to_student(request):
    """
    Assign a teacher to a student's subscription.
    POST /api/access/assign-teacher/
    Body: { "subscription_id": int, "teacher_id": int }
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        import json
        data = json.loads(request.body)
        subscription_id = data.get('subscription_id')
        teacher_id = data.get('teacher_id')
        
        if not subscription_id or not teacher_id:
            return JsonResponse({
                'success': False,
                'error': 'subscription_id and teacher_id are required'
            }, status=400)
        
        success, msg = SubscriptionAccessControl.assign_teacher_to_subscription(subscription_id, teacher_id)
        
        return JsonResponse({
            'success': success,
            'message': msg
        }, status=200 if success else 400)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
def upgrade_subscription(request):
    """
    Upgrade a subscription to a higher plan.
    POST /api/access/upgrade/
    Body: { "subscription_id": int, "new_plan_id": int, "price_difference": float }
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        import json
        data = json.loads(request.body)
        subscription_id = data.get('subscription_id')
        new_plan_id = data.get('new_plan_id')
        price_difference = data.get('price_difference', 0)
        
        if not subscription_id or not new_plan_id:
            return JsonResponse({
                'success': False,
                'error': 'subscription_id and new_plan_id are required'
            }, status=400)
        
        success, msg = SubscriptionAccessControl.upgrade_subscription(
            subscription_id, new_plan_id, price_difference
        )
        
        # Audit: log upgrade as a payment
        if success:
            try:
                sub = models.Subscription.objects.get(id=subscription_id)
                log_payment(
                    student=sub.student, subscription=sub, plan=sub.plan,
                    amount=price_difference, payment_type='plan_upgrade',
                    status='completed', request=request
                )
            except Exception:
                pass
        
        return JsonResponse({
            'success': success,
            'message': msg
        }, status=200 if success else 400)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
def downgrade_subscription(request):
    """
    Downgrade a subscription to a lower plan.
    POST /api/access/downgrade/
    Body: { "subscription_id": int, "new_plan_id": int }
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        import json
        data = json.loads(request.body)
        subscription_id = data.get('subscription_id')
        new_plan_id = data.get('new_plan_id')
        
        if not subscription_id or not new_plan_id:
            return JsonResponse({
                'success': False,
                'error': 'subscription_id and new_plan_id are required'
            }, status=400)
        
        success, msg = SubscriptionAccessControl.downgrade_subscription(subscription_id, new_plan_id)
        
        return JsonResponse({
            'success': success,
            'message': msg
        }, status=200 if success else 400)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
def get_subscription_usage(request, student_id):
    """
    Get detailed subscription usage for a student.
    GET /api/access/usage/<student_id>/
    """
    try:
        blocked = _validate_student_requester(request, student_id)
        if blocked:
            return blocked

        usage = SubscriptionAccessControl.get_subscription_usage(student_id)
        return JsonResponse(usage)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': str(e),
            'has_subscription': False
        }, status=500)


@csrf_exempt
def expire_old_subscriptions(request):
    """
    Manually trigger expiration check for subscriptions.
    Should normally be called by a cron job.
    POST /api/access/expire-check/
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        count = SubscriptionAccessControl.check_and_expire_subscriptions()
        return JsonResponse({
            'success': True,
            'expired_count': count,
            'message': f'{count} subscriptions marked as expired'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
def get_plan_teachers(request, plan_id):
    """
    Get list of teachers available for a subscription plan.
    GET /api/access/plan-teachers/<plan_id>/
    """
    try:
        plan = models.SubscriptionPlan.objects.get(id=plan_id)
        
        allowed_teachers = plan.allowed_teachers.all()
        
        # If no specific teachers are set, return all teachers
        if not allowed_teachers.exists():
            allowed_teachers = models.Teacher.objects.all()
            all_teachers_allowed = True
        else:
            all_teachers_allowed = False
        
        teachers_data = []
        for teacher in allowed_teachers[:50]:  # Limit to 50
            teachers_data.append({
                'id': teacher.id,
                'full_name': teacher.full_name,
                'email': teacher.email,
                'qualification': teacher.qualification,
                'profile_img': teacher.profile_img.url if teacher.profile_img else None,
                'skills': teacher.skill_list() if teacher.skills else [],
                'total_courses': teacher.total_teacher_course()
            })
        
        return JsonResponse({
            'plan_id': plan.id,
            'plan_name': plan.name,
            'all_teachers_allowed': all_teachers_allowed,
            'teachers_count': len(teachers_data),
            'teachers': teachers_data
        })
    except models.SubscriptionPlan.DoesNotExist:
        return JsonResponse({
            'error': 'Plan not found'
        }, status=404)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': str(e)
        }, status=500)


# ==================== ENHANCED ENROLLMENT VIEWS ====================

class ProtectedCourseEnrollView(generics.CreateAPIView):
    """
    Protected enrollment endpoint that validates subscription before enrollment.
    """
    serializer_class = StudentCourseEnrollSerializer
    
    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student')
        course_id = request.data.get('course')
        
        if not student_id or not course_id:
            return Response({
                'error': 'student and course are required'
            }, status=400)
        
        # Validate subscription access
        can_enroll, msg = SubscriptionAccessControl.can_enroll_in_course(student_id, course_id)
        
        if not can_enroll:
            return Response({
                'error': msg,
                'access_denied': True
            }, status=403)
        
        # Get the subscription to link to enrollment
        subscription = SubscriptionAccessControl.get_active_subscription(student_id)
        
        # Create enrollment with subscription link
        enrollment = models.StudentCourseEnrollment.objects.create(
            student_id=student_id,
            course_id=course_id,
            subscription=subscription
        )
        
        # Record course enrollment in subscription
        if subscription:
            subscription.record_course_enrollment()
        
        serializer = self.get_serializer(enrollment)
        return Response({
            'success': True,
            'enrollment': serializer.data,
            'message': 'Successfully enrolled in course',
            'usage': subscription.get_usage_summary() if subscription else None
        }, status=201)


# ==================== AUDIT LOG VIEWS ====================

from .serializers import UploadLogSerializer, PaymentLogSerializer, AccessLogSerializer

class UploadLogList(generics.ListAPIView):
    """List all upload logs (admin only)"""
    queryset = models.UploadLog.objects.all()
    serializer_class = UploadLogSerializer
    pagination_class = StandardResultSetPagination
    
    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filter by upload type
        upload_type = self.request.GET.get('upload_type', '')
        if upload_type:
            qs = qs.filter(upload_type=upload_type)
        
        # Filter by status
        status = self.request.GET.get('status', '')
        if status:
            qs = qs.filter(status=status)
        
        # Filter by date range
        date_from = self.request.GET.get('date_from', '')
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        
        date_to = self.request.GET.get('date_to', '')
        if date_to:
            qs = qs.filter(created_at__lte=date_to)
        
        # Filter by uploader (teacher_id or student_id)
        teacher_id = self.request.GET.get('teacher_id', '')
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        
        student_id = self.request.GET.get('student_id', '')
        if student_id:
            qs = qs.filter(student_id=student_id)
        
        # Search by file name
        search = self.request.GET.get('search', '')
        if search:
            qs = qs.filter(file_name__icontains=search)
        
        return qs.order_by('-created_at')


class UploadLogDetail(generics.RetrieveAPIView):
    """Get detailed upload log entry"""
    queryset = models.UploadLog.objects.all()
    serializer_class = UploadLogSerializer


@csrf_exempt
def log_file_upload(request):
    """Create an upload log entry when a file is uploaded"""
    import json
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body) if request.body else {}
            
            # Determine who uploaded
            teacher_id = data.get('teacher_id')
            student_id = data.get('student_id')
            admin_id = data.get('admin_id')
            
            upload_log = models.UploadLog.objects.create(
                teacher_id=teacher_id,
                student_id=student_id,
                admin_id=admin_id,
                file_name=data.get('file_name', ''),
                file_type=data.get('file_type', ''),
                file_size=int(data.get('file_size', 0)),
                upload_type=data.get('upload_type', 'other'),
                content_type=data.get('content_type'),
                object_id=data.get('object_id'),
                status=data.get('status', 'success'),
                error_message=data.get('error_message'),
                file_path=data.get('file_path'),
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return JsonResponse({
                'bool': True,
                'upload_log_id': upload_log.id,
                'message': 'Upload logged successfully'
            })
        except Exception as e:
            return JsonResponse({
                'bool': False,
                'message': str(e)
            }, status=400)
    
    return JsonResponse({'bool': False, 'message': 'POST method required'}, status=405)


class PaymentLogList(generics.ListAPIView):
    """List all payment logs (admin only)"""
    queryset = models.PaymentLog.objects.all()
    serializer_class = PaymentLogSerializer
    pagination_class = StandardResultSetPagination
    
    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filter by payment type
        payment_type = self.request.GET.get('payment_type', '')
        if payment_type:
            qs = qs.filter(payment_type=payment_type)
        
        # Filter by status
        status = self.request.GET.get('status', '')
        if status:
            qs = qs.filter(status=status)
        
        # Filter by student
        student_id = self.request.GET.get('student_id', '')
        if student_id:
            qs = qs.filter(student_id=student_id)
        
        # Filter by plan
        plan_id = self.request.GET.get('plan_id', '')
        if plan_id:
            qs = qs.filter(subscription_plan_id=plan_id)
        
        # Filter by date range
        date_from = self.request.GET.get('date_from', '')
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        
        date_to = self.request.GET.get('date_to', '')
        if date_to:
            qs = qs.filter(created_at__lte=date_to)
        
        # Search by transaction ID
        search = self.request.GET.get('search', '')
        if search:
            qs = qs.filter(transaction_id__icontains=search)
        
        return qs.order_by('-created_at')


class PaymentLogDetail(generics.RetrieveAPIView):
    """Get detailed payment log entry"""
    queryset = models.PaymentLog.objects.all()
    serializer_class = PaymentLogSerializer


@csrf_exempt
def api_log_payment(request):
    """Create a payment log entry when a payment is processed"""
    import json
    from django.utils import timezone
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body) if request.body else {}
            
            payment_log = models.PaymentLog.objects.create(
                student_id=data.get('student_id'),
                subscription_id=data.get('subscription_id'),
                subscription_plan_id=data.get('plan_id'),
                transaction_id=data.get('transaction_id', ''),
                payment_type=data.get('payment_type', 'subscription_purchase'),
                status=data.get('status', 'pending'),
                payment_method=data.get('payment_method'),
                amount=data.get('amount', 0),
                currency=data.get('currency', 'INR'),
                tax_amount=data.get('tax_amount', 0),
                discount_amount=data.get('discount_amount', 0),
                final_amount=data.get('final_amount', data.get('amount', 0)),
                gateway_response=data.get('gateway_response'),
                receipt_url=data.get('receipt_url'),
                invoice_number=data.get('invoice_number'),
                error_message=data.get('error_message'),
                error_code=data.get('error_code'),
                user_email=data.get('user_email'),
                user_ip_address=request.META.get('REMOTE_ADDR'),
                completed_at=timezone.now() if data.get('status') == 'completed' else None
            )
            
            return JsonResponse({
                'bool': True,
                'payment_log_id': payment_log.id,
                'message': 'Payment logged successfully'
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'bool': False,
                'message': str(e)
            }, status=400)
    
    return JsonResponse({'bool': False, 'message': 'POST method required'}, status=405)


class AccessLogList(generics.ListAPIView):
    """List all access logs (admin only)"""
    queryset = models.AccessLog.objects.all()
    serializer_class = AccessLogSerializer
    pagination_class = StandardResultSetPagination
    
    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filter by access type
        access_type = self.request.GET.get('access_type', '')
        if access_type:
            qs = qs.filter(access_type=access_type)
        
        # Filter by was_allowed
        was_allowed = self.request.GET.get('was_allowed', '')
        if was_allowed:
            qs = qs.filter(was_allowed=was_allowed.lower() == 'true')
        
        # Filter by student
        student_id = self.request.GET.get('student_id', '')
        if student_id:
            qs = qs.filter(student_id=student_id)
        
        # Filter by course
        course_id = self.request.GET.get('course_id', '')
        if course_id:
            qs = qs.filter(course_id=course_id)
        
        # Filter by date range
        date_from = self.request.GET.get('date_from', '')
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        
        date_to = self.request.GET.get('date_to', '')
        if date_to:
            qs = qs.filter(created_at__lte=date_to)
        
        return qs.order_by('-created_at')


class AccessLogDetail(generics.RetrieveAPIView):
    """Get detailed access log entry"""
    queryset = models.AccessLog.objects.all()
    serializer_class = AccessLogSerializer


@csrf_exempt
def api_log_access(request):
    """Create an access log entry when user accesses a resource"""
    import json
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body) if request.body else {}
            
            # Determine who accessed
            teacher_id = data.get('teacher_id')
            student_id = data.get('student_id')
            admin_id = data.get('admin_id')
            
            access_log = models.AccessLog.objects.create(
                teacher_id=teacher_id,
                student_id=student_id,
                admin_id=admin_id,
                access_type=data.get('access_type', 'course_view'),
                course_id=data.get('course_id'),
                lesson_id=data.get('lesson_id'),
                subscription_id=data.get('subscription_id'),
                was_allowed=data.get('was_allowed', True),
                denial_reason=data.get('denial_reason'),
                duration_seconds=data.get('duration_seconds'),
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return JsonResponse({
                'bool': True,
                'access_log_id': access_log.id,
                'message': 'Access logged successfully'
            })
        except Exception as e:
            return JsonResponse({
                'bool': False,
                'message': str(e)
            }, status=400)
    
    return JsonResponse({'bool': False, 'message': 'POST method required'}, status=405)


@csrf_exempt
def get_audit_summary(request):
    """Get summary statistics for audit logs"""
    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Count
    
    try:
        # Get time periods for comparison
        today = timezone.now().date()
        last_7_days = timezone.now() - timedelta(days=7)
        last_30_days = timezone.now() - timedelta(days=30)
        last_90_days = timezone.now() - timedelta(days=90)
        
        # Upload stats
        total_uploads = models.UploadLog.objects.count()
        successful_uploads = models.UploadLog.objects.filter(status='success').count()
        failed_uploads = models.UploadLog.objects.filter(status='failed').count()
        recent_uploads = models.UploadLog.objects.filter(created_at__gte=last_7_days).count()
        
        upload_by_type = models.UploadLog.objects.values('upload_type').annotate(
            count=Count('id')
        )
        
        # Payment stats
        total_payments = models.PaymentLog.objects.count()
        completed_payments = models.PaymentLog.objects.filter(status='completed').count()
        failed_payments = models.PaymentLog.objects.filter(status='failed').count()
        pending_payments = models.PaymentLog.objects.filter(status='pending').count()
        refunded_payments = models.PaymentLog.objects.filter(status='refunded').count()
        
        from django.db.models import Sum
        total_revenue = models.PaymentLog.objects.filter(
            status='completed'
        ).aggregate(total=Sum('final_amount'))['total'] or 0
        
        recent_payments = models.PaymentLog.objects.filter(created_at__gte=last_7_days).count()
        
        payment_by_type = models.PaymentLog.objects.values('payment_type').annotate(
            count=Count('id')
        )
        
        payment_by_method = models.PaymentLog.objects.values('payment_method').annotate(
            count=Count('id')
        )
        
        # Access stats
        total_accesses = models.AccessLog.objects.count()
        allowed_accesses = models.AccessLog.objects.filter(was_allowed=True).count()
        denied_accesses = models.AccessLog.objects.filter(was_allowed=False).count()
        recent_accesses = models.AccessLog.objects.filter(created_at__gte=last_7_days).count()
        
        access_by_type = models.AccessLog.objects.values('access_type').annotate(
            count=Count('id')
        )
        
        # Denial reasons
        denial_reasons = models.AccessLog.objects.filter(
            was_allowed=False
        ).values('denial_reason').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return JsonResponse({
            'bool': True,
            'summary': {
                'uploads': {
                    'total': total_uploads,
                    'successful': successful_uploads,
                    'failed': failed_uploads,
                    'success_rate': (successful_uploads / total_uploads * 100) if total_uploads > 0 else 0,
                    'recent_7_days': recent_uploads,
                    'by_type': list(upload_by_type)
                },
                'payments': {
                    'total': total_payments,
                    'completed': completed_payments,
                    'failed': failed_payments,
                    'pending': pending_payments,
                    'refunded': refunded_payments,
                    'success_rate': (completed_payments / total_payments * 100) if total_payments > 0 else 0,
                    'total_revenue': float(total_revenue),
                    'recent_7_days': recent_payments,
                    'by_type': list(payment_by_type),
                    'by_method': list(payment_by_method)
                },
                'access': {
                    'total': total_accesses,
                    'allowed': allowed_accesses,
                    'denied': denied_accesses,
                    'allow_rate': (allowed_accesses / total_accesses * 100) if total_accesses > 0 else 0,
                    'recent_7_days': recent_accesses,
                    'by_type': list(access_by_type),
                    'denial_reasons': list(denial_reasons)
                }
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'bool': False,
            'message': str(e)
        }, status=500)


@csrf_exempt
def export_audit_logs(request, log_type):
    """Export audit logs as CSV"""
    import csv
    from django.http import HttpResponse
    
    try:
        if log_type == 'uploads':
            logs = models.UploadLog.objects.all()
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="upload_logs.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['ID', 'Uploader', 'File Name', 'File Type', 'File Size', 'Upload Type', 'Status', 'Created At'])
            
            for log in logs:
                writer.writerow([
                    log.id,
                    log.get_user_display(),
                    log.file_name,
                    log.file_type,
                    log.file_size,
                    log.upload_type,
                    log.status,
                    log.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])
            
            log_activity(request, 'export', f'Exported upload audit logs as CSV ({logs.count()} records)',
                         model_name='UploadLog')
            return response
        
        elif log_type == 'payments':
            logs = models.PaymentLog.objects.all()
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="payment_logs.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['ID', 'Student', 'Transaction ID', 'Amount', 'Currency', 'Status', 'Payment Type', 'Created At'])
            
            for log in logs:
                writer.writerow([
                    log.id,
                    log.student.fullname if log.student else 'Unknown',
                    log.transaction_id,
                    log.final_amount,
                    log.currency,
                    log.status,
                    log.payment_type,
                    log.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])
            
            log_activity(request, 'export', f'Exported payment audit logs as CSV ({logs.count()} records)',
                         model_name='PaymentLog')
            return response
        
        elif log_type == 'access':
            logs = models.AccessLog.objects.all()
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="access_logs.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['ID', 'User', 'Access Type', 'Course', 'Was Allowed', 'Created At'])
            
            for log in logs:
                writer.writerow([
                    log.id,
                    log.get_user_display(),
                    log.access_type,
                    log.course.title if log.course else 'N/A',
                    'Yes' if log.was_allowed else 'No',
                    log.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])
            
            log_activity(request, 'export', f'Exported access audit logs as CSV ({logs.count()} records)',
                         model_name='AccessLog')
            return response
        
        else:
            return JsonResponse({
                'bool': False,
                'message': 'Invalid log type. Use: uploads, payments, or access'
            }, status=400)
    
    except Exception as e:
        return JsonResponse({
            'bool': False,
            'message': str(e)
        }, status=500)


# ==================== SCHOOL DASHBOARD VIEWS ====================

from . serializers import (
    SchoolUserSerializer, SchoolDashboardStatsSerializer,
    GroupClassSerializer, GroupClassTeacherSerializer, GroupClassStudentSerializer,
    LessonAssignmentSerializer, StudentLessonAssignmentSerializer,
    LessonAssignmentSubmissionSerializer
)


@csrf_exempt
def school_login(request):
    import hashlib
    
    email = request.POST.get('email')
    password = request.POST.get('password')
    
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    
    try:
        schoolUser = models.SchoolUser.objects.select_related('school').get(email=email, password=hashed_password)
        schoolUser.last_login = datetime.now()
        schoolUser.save()
    except models.SchoolUser.DoesNotExist:
        schoolUser = None
    
    if schoolUser:
        log_activity(request, 'login', f'School {schoolUser.school.name} logged in',
                     model_name='School', object_id=schoolUser.school.id)
        return JsonResponse({
            'bool': True,
            'school_user_id': schoolUser.id,
            'school_id': schoolUser.school.id,
            'school_name': schoolUser.school.name,
            'school_email': schoolUser.email,
        })
    else:
        return JsonResponse({'bool': False})


@csrf_exempt
def school_change_password(request, school_user_id):
    import hashlib
    password = request.POST.get('password')
    try:
        schoolUser = models.SchoolUser.objects.get(id=school_user_id)
        schoolUser.password = hashlib.sha256(password.encode()).hexdigest()
        schoolUser.save()
        log_activity(request, 'update', f'School {schoolUser.school.name} password changed',
                     model_name='SchoolUser', object_id=school_user_id)
        return JsonResponse({'bool': True})
    except models.SchoolUser.DoesNotExist:
        return JsonResponse({'bool': False})


def school_dashboard_stats(request, school_id):
    """Get comprehensive school dashboard statistics"""
    try:
        school = models.School.objects.get(id=school_id)
    except models.School.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'School not found'}, status=404)
    
    total_teachers = models.SchoolTeacher.objects.filter(school=school).count()
    total_students = models.SchoolStudent.objects.filter(school=school).count()
    total_courses = models.SchoolCourse.objects.filter(school=school).count()
    total_groups = models.GroupClass.objects.filter(school=school).count()
    total_lesson_assignments = models.LessonAssignment.objects.filter(school=school).count()
    
    # Recent lesson assignments
    recent_assignments = models.LessonAssignment.objects.filter(
        school=school
    ).select_related('lesson', 'student', 'group_class').order_by('-assigned_at')[:5]
    
    recent_assignment_data = [{
        'id': a.id,
        'lesson_title': a.lesson.title if a.lesson else 'Unknown',
        'target': a.student.fullname if a.student else (a.group_class.name if a.group_class else 'Unknown'),
        'assignment_type': a.assignment_type,
        'assigned_at': a.assigned_at.strftime('%Y-%m-%d %H:%M'),
    } for a in recent_assignments]
    
    # Group classes overview
    group_classes = models.GroupClass.objects.filter(school=school).order_by('-created_at')[:5]
    group_data = [{
        'id': g.id,
        'name': g.name,
        'teachers': g.total_teachers(),
        'students': g.total_students(),
        'is_active': g.is_active,
    } for g in group_classes]
    
    # Teachers in school
    school_teachers = models.SchoolTeacher.objects.filter(
        school=school
    ).select_related('teacher')[:5]
    teacher_data = [{
        'id': st.teacher.id,
        'name': st.teacher.full_name,
        'email': st.teacher.email,
        'courses': st.teacher.total_teacher_course(),
        'students': st.teacher.total_teacher_students(),
    } for st in school_teachers]
    
    # Students in school  
    school_students = models.SchoolStudent.objects.filter(
        school=school
    ).select_related('student')[:5]
    student_data = [{
        'id': ss.student.id,
        'name': ss.student.fullname,
        'email': ss.student.email,
        'enrolled_courses': ss.student.enrolled_courses(),
    } for ss in school_students]
    
    return JsonResponse({
        'school_name': school.name,
        'school_status': school.status,
        'total_teachers': total_teachers,
        'total_students': total_students,
        'total_courses': total_courses,
        'total_groups': total_groups,
        'total_lesson_assignments': total_lesson_assignments,
        'recent_assignments': recent_assignment_data,
        'group_classes': group_data,
        'teachers': teacher_data,
        'students': student_data,
    })


class SchoolTeacherListView(generics.ListAPIView):
    """List teachers belonging to a school"""
    serializer_class = SchoolTeacherSerializer
    
    def get_queryset(self):
        school_id = self.kwargs['school_id']
        return models.SchoolTeacher.objects.filter(school_id=school_id)


class SchoolStudentListView(generics.ListAPIView):
    """List students belonging to a school"""
    serializer_class = SchoolStudentSerializer
    
    def get_queryset(self):
        school_id = self.kwargs['school_id']
        return models.SchoolStudent.objects.filter(school_id=school_id)


class SchoolCourseListView(generics.ListAPIView):
    """List courses belonging to a school"""
    serializer_class = SchoolCourseSerializer
    
    def get_queryset(self):
        school_id = self.kwargs['school_id']
        return models.SchoolCourse.objects.filter(school_id=school_id)


@csrf_exempt
def school_assign_teacher_to_student(request, school_id):
    """Assign a teacher to a student within the school"""
    if request.method == 'POST':
        teacher_id = request.POST.get('teacher_id')
        student_id = request.POST.get('student_id')
        instrument = request.POST.get('instrument', 'piano')
        level = request.POST.get('level', 'beginner')
        
        try:
            teacher = models.Teacher.objects.get(id=teacher_id)
            student = models.Student.objects.get(id=student_id)
            
            obj, created = models.TeacherStudent.objects.get_or_create(
                teacher=teacher,
                student=student,
                defaults={'instrument': instrument, 'level': level}
            )
            
            return JsonResponse({
                'bool': True,
                'created': created,
                'message': 'Teacher assigned to student successfully' if created else 'Assignment already exists'
            })
        except Exception as e:
            return JsonResponse({'bool': False, 'message': str(e)})
    
    return JsonResponse({'bool': False, 'message': 'POST required'})


# Group Class CRUD
class SchoolGroupClassList(generics.ListCreateAPIView):
    serializer_class = GroupClassSerializer
    
    def get_queryset(self):
        school_id = self.kwargs['school_id']
        return models.GroupClass.objects.filter(school_id=school_id)


class SchoolGroupClassDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.GroupClass.objects.all()
    serializer_class = GroupClassSerializer


@csrf_exempt
def school_assign_teacher_to_group(request, group_id):
    """Assign a teacher to a group class"""
    if request.method == 'POST':
        teacher_id = request.POST.get('teacher_id')
        try:
            teacher = models.Teacher.objects.get(pk=teacher_id)
            # Check if group contains any minor students
            group_students = models.GroupClassStudent.objects.filter(
                group_class_id=group_id
            ).select_related('student')
            for gs in group_students:
                minor_block = _require_can_teach_minors(teacher, gs.student)
                if minor_block:
                    return minor_block
            obj, created = models.GroupClassTeacher.objects.get_or_create(
                group_class_id=group_id,
                teacher_id=teacher_id
            )
            return JsonResponse({
                'bool': True, 'created': created,
                'message': 'Teacher assigned to group' if created else 'Already assigned'
            })
        except models.Teacher.DoesNotExist:
            return JsonResponse({'bool': False, 'message': 'Teacher not found'}, status=404)
        except Exception as e:
            return JsonResponse({'bool': False, 'message': str(e)})
    return JsonResponse({'bool': False, 'message': 'POST required'})


@csrf_exempt
def school_remove_teacher_from_group(request, group_id, teacher_id):
    """Remove a teacher from a group class"""
    try:
        models.GroupClassTeacher.objects.filter(
            group_class_id=group_id, teacher_id=teacher_id
        ).delete()
        return JsonResponse({'bool': True})
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)})


@csrf_exempt
def school_assign_student_to_group(request, group_id):
    """Assign a student to a group class"""
    if request.method == 'POST':
        student_id = request.POST.get('student_id')
        try:
            student = models.Student.objects.get(pk=student_id)
            # Check if any teacher in this group is cleared for minors
            if student.is_minor():
                group_teachers = models.GroupClassTeacher.objects.filter(
                    group_class_id=group_id
                ).select_related('teacher')
                for gt in group_teachers:
                    minor_block = _require_can_teach_minors(gt.teacher, student)
                    if minor_block:
                        return minor_block
            obj, created = models.GroupClassStudent.objects.get_or_create(
                group_class_id=group_id,
                student_id=student_id
            )
            return JsonResponse({
                'bool': True, 'created': created,
                'message': 'Student assigned to group' if created else 'Already assigned'
            })
        except models.Student.DoesNotExist:
            return JsonResponse({'bool': False, 'message': 'Student not found'}, status=404)
        except Exception as e:
            return JsonResponse({'bool': False, 'message': str(e)})
    return JsonResponse({'bool': False, 'message': 'POST required'})


@csrf_exempt
def school_remove_student_from_group(request, group_id, student_id):
    """Remove a student from a group class"""
    try:
        models.GroupClassStudent.objects.filter(
            group_class_id=group_id, student_id=student_id
        ).delete()
        return JsonResponse({'bool': True})
    except Exception as e:
        return JsonResponse({'bool': False, 'message': str(e)})


class GroupClassTeacherList(generics.ListAPIView):
    serializer_class = GroupClassTeacherSerializer
    
    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return models.GroupClassTeacher.objects.filter(group_class_id=group_id)


class GroupClassStudentList(generics.ListAPIView):
    serializer_class = GroupClassStudentSerializer
    
    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return models.GroupClassStudent.objects.filter(group_class_id=group_id)


# Lesson Assignments
class SchoolLessonAssignmentList(generics.ListCreateAPIView):
    serializer_class = LessonAssignmentSerializer
    
    def get_queryset(self):
        school_id = self.kwargs['school_id']
        return models.LessonAssignment.objects.filter(school_id=school_id)


class SchoolLessonAssignmentDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.LessonAssignment.objects.all()
    serializer_class = LessonAssignmentSerializer


class StudentLessonAssignmentList(generics.ListAPIView):
    serializer_class = StudentLessonAssignmentSerializer

    def get_queryset(self):
        student_id = self.kwargs['student_id']
        return models.LessonAssignment.objects.filter(
            Q(assignment_type='individual', student_id=student_id) |
            Q(assignment_type='group', group_class__group_students__student_id=student_id)
        ).select_related('lesson', 'school').distinct()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['student_id'] = self.kwargs['student_id']
        return context


@csrf_exempt
def student_submit_lesson_assignment(request, student_id, assignment_id):
    if request.method != 'POST':
        return JsonResponse({'bool': False, 'message': 'POST required'}, status=405)

    try:
        student = models.Student.objects.get(pk=student_id)
        assignment = models.LessonAssignment.objects.select_related('group_class', 'lesson').get(pk=assignment_id)
    except models.Student.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Student not found'}, status=404)
    except models.LessonAssignment.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Assignment not found'}, status=404)

    is_allowed = False
    if assignment.assignment_type == 'individual' and assignment.student_id == student.id:
        is_allowed = True
    elif assignment.assignment_type == 'group' and assignment.group_class_id:
        is_allowed = models.GroupClassStudent.objects.filter(
            group_class_id=assignment.group_class_id,
            student_id=student.id
        ).exists()

    if not is_allowed:
        return JsonResponse({'bool': False, 'message': 'This assignment is not assigned to this student'}, status=403)

    audio_file = request.FILES.get('audio_file')
    if assignment.audio_required and not audio_file:
        return JsonResponse({'bool': False, 'message': 'Audio file is required for this assignment'}, status=400)

    submission, created = models.LessonAssignmentSubmission.objects.get_or_create(
        assignment=assignment,
        student=student,
        defaults={
            'audio_file': audio_file,
            'submission_notes': request.POST.get('submission_notes', ''),
        }
    )

    if not created:
        if audio_file:
            submission.audio_file = audio_file
        submission.submission_notes = request.POST.get('submission_notes', submission.submission_notes)
        submission.points_awarded = None
        submission.teacher_feedback = None
        submission.graded_by = None
        submission.graded_at = None
        submission.save()

    data = LessonAssignmentSubmissionSerializer(submission, context={'request': request}).data
    return JsonResponse({'bool': True, 'submission': data}, status=201 if created else 200)


class TeacherLessonAssignmentSubmissionList(generics.ListAPIView):
    serializer_class = LessonAssignmentSubmissionSerializer

    def get_queryset(self):
        teacher_id = self.kwargs['teacher_id']
        _, blocked_response = _require_approved_teacher(teacher_id)
        if blocked_response:
            return models.LessonAssignmentSubmission.objects.none()

        queryset = models.LessonAssignmentSubmission.objects.filter(
            assignment__lesson__module__course__teacher_id=teacher_id
        ).select_related('assignment', 'assignment__lesson', 'student', 'graded_by')

        assignment_id = self.request.GET.get('assignment_id')
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)

        student_id = self.request.GET.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        grading_filter = self.request.GET.get('grading')
        if grading_filter == 'graded':
            queryset = queryset.filter(points_awarded__isnull=False)
        elif grading_filter == 'pending':
            queryset = queryset.filter(points_awarded__isnull=True)

        return queryset


@csrf_exempt
def teacher_grade_lesson_assignment_submission(request, teacher_id, submission_id):
    if request.method != 'PATCH':
        return JsonResponse({'bool': False, 'message': 'PATCH required'}, status=405)

    teacher, blocked_response = _require_approved_teacher(teacher_id)
    if blocked_response:
        return blocked_response

    try:
        submission = models.LessonAssignmentSubmission.objects.select_related(
            'assignment', 'assignment__lesson__module__course'
        ).get(pk=submission_id)
    except models.LessonAssignmentSubmission.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'Submission not found'}, status=404)

    assignment_teacher_id = submission.assignment.lesson.module.course.teacher_id
    if assignment_teacher_id != teacher.id:
        return JsonResponse({'bool': False, 'message': 'Not authorized to grade this submission'}, status=403)

    try:
        payload = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({'bool': False, 'message': 'Invalid JSON payload'}, status=400)

    if 'points_awarded' not in payload:
        return JsonResponse({'bool': False, 'message': 'points_awarded is required'}, status=400)

    try:
        points_awarded = int(payload.get('points_awarded'))
    except (TypeError, ValueError):
        return JsonResponse({'bool': False, 'message': 'points_awarded must be an integer'}, status=400)

    if points_awarded < 0:
        return JsonResponse({'bool': False, 'message': 'points_awarded cannot be negative'}, status=400)

    max_points = submission.assignment.max_points or 0
    if max_points > 0 and points_awarded > max_points:
        return JsonResponse({'bool': False, 'message': f'points_awarded cannot exceed max points ({max_points})'}, status=400)

    submission.points_awarded = points_awarded
    submission.teacher_feedback = payload.get('teacher_feedback', '')
    submission.graded_by = teacher
    submission.graded_at = timezone.now()
    submission.save()

    data = LessonAssignmentSubmissionSerializer(submission, context={'request': request}).data
    return JsonResponse({'bool': True, 'submission': data})


# School Progress Overview
def school_progress_overview(request, school_id):
    """High-level view of progress and participation for school"""
    try:
        school = models.School.objects.get(id=school_id)
    except models.School.DoesNotExist:
        return JsonResponse({'bool': False, 'message': 'School not found'}, status=404)
    
    # Get all student IDs in this school
    student_ids = models.SchoolStudent.objects.filter(
        school=school
    ).values_list('student_id', flat=True)
    
    # Overall enrollment stats
    total_enrollments = models.StudentCourseEnrollment.objects.filter(
        student_id__in=student_ids
    ).count()
    
    # Progress by student
    student_progress = []
    school_students = models.SchoolStudent.objects.filter(
        school=school
    ).select_related('student')[:20]
    
    for ss in school_students:
        enrollments = models.StudentCourseEnrollment.objects.filter(student=ss.student)
        total_courses = enrollments.count()
        avg_progress = enrollments.aggregate(avg=Avg('progress_percent'))['avg'] or 0
        
        student_progress.append({
            'id': ss.student.id,
            'name': ss.student.fullname,
            'email': ss.student.email,
            'total_courses': total_courses,
            'avg_progress': round(avg_progress, 1),
        })
    
    # Progress by group class
    group_progress = []
    groups = models.GroupClass.objects.filter(school=school)
    for group in groups:
        group_student_ids = group.group_students.values_list('student_id', flat=True)
        group_enrollments = models.StudentCourseEnrollment.objects.filter(
            student_id__in=group_student_ids
        )
        avg_progress = group_enrollments.aggregate(avg=Avg('progress_percent'))['avg'] or 0
        
        group_progress.append({
            'id': group.id,
            'name': group.name,
            'total_students': group.total_students(),
            'total_teachers': group.total_teachers(),
            'avg_progress': round(avg_progress, 1),
        })
    
    # Recent activity (lesson completions)
    recent_completions = models.ModuleLessonProgress.objects.filter(
        student_id__in=student_ids,
        is_completed=True
    ).select_related('student', 'lesson').order_by('-completed_at')[:10]
    
    completion_data = [{
        'student_name': c.student.fullname,
        'lesson_title': c.lesson.title,
        'completed_at': c.completed_at.strftime('%Y-%m-%d %H:%M') if c.completed_at else None,
    } for c in recent_completions]
    
    return JsonResponse({
        'total_enrollments': total_enrollments,
        'total_students': len(student_ids),
        'student_progress': student_progress,
        'group_progress': group_progress,
        'recent_completions': completion_data,
    })
