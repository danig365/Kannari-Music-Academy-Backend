"""
Access Control Module for Kannari Music Academy

This module provides comprehensive subscription-based access control functionality.
It enforces access rules at the backend level for:
- Course enrollment restrictions
- Lesson access control
- Teacher assignment validation
- Subscription status checks
"""

from datetime import timedelta
from django.utils import timezone
from django.http import JsonResponse
from functools import wraps
from . import models


class AccessControlError(Exception):
    """Custom exception for access control violations"""
    def __init__(self, message, error_code=None):
        self.message = message
        self.error_code = error_code or 'ACCESS_DENIED'
        super().__init__(self.message)


class SubscriptionAccessControl:
    """
    Main class for handling subscription-based access control.
    Provides methods to check and enforce access rules.
    """
    
    @staticmethod
    def get_active_subscription(student_id):
        """
        Get the active subscription for a student.
        Returns the most recent active and paid subscription.
        """
        try:
            student = models.Student.objects.get(id=student_id)
        except models.Student.DoesNotExist:
            return None
        
        today = timezone.now().date()

        # Get active subscription (most recent first).
        # end_date=None means an ongoing subscription with no expiry (Stripe-
        # managed recurring billing) — it must count as active. The previous
        # `end_date__gte=today` filter silently excluded these NULL end_dates,
        # so paid, active subscriptions granted no access at all.
        from django.db.models import Q
        subscription = models.Subscription.objects.filter(
            student=student,
            status='active',
            is_paid=True,
            start_date__lte=today,
        ).filter(
            Q(end_date__gte=today) | Q(end_date__isnull=True)
        ).select_related('plan', 'assigned_teacher').order_by('-id').first()

        return subscription
    
    @staticmethod
    def check_subscription_status(student_id):
        """
        Check if student has an active, paid subscription.
        Returns tuple: (has_subscription: bool, subscription: Subscription|None, message: str)
        """
        subscription = SubscriptionAccessControl.get_active_subscription(student_id)
        
        if not subscription:
            # Check if there's any subscription at all
            any_sub = models.Subscription.objects.filter(student_id=student_id).first()
            if not any_sub:
                return False, None, "No subscription found. Please subscribe to access content."
            elif any_sub.status == 'pending':
                return False, any_sub, "Your subscription is pending activation. Please complete payment."
            elif any_sub.status == 'expired':
                return False, any_sub, "Your subscription has expired. Please renew to continue."
            elif any_sub.status == 'cancelled':
                return False, any_sub, "Your subscription has been cancelled. Please subscribe again."
            elif any_sub.status == 'paused':
                return False, any_sub, "Your subscription is paused. Please contact support to resume."
            else:
                return False, any_sub, "No active subscription found."
        
        if not subscription.is_paid:
            return False, subscription, "Your subscription payment is pending. Please complete payment."
        
        return True, subscription, "Active subscription found."
    
    @staticmethod
    def can_enroll_in_course(student_id, course_id):
        """
        Check if student can enroll in a specific course.
        Returns tuple: (can_enroll: bool, message: str)
        """
        # Phase 5: Check minor access gate before subscription check
        try:
            student = models.Student.objects.get(id=student_id)
            if student.is_minor():
                if not student.has_approved_parent_with_policies():
                    return False, (
                        "Parental consent is required before minors can enroll in courses. "
                        "Please ask your parent/guardian to complete the consent process "
                        "via the email they received, including accepting the Terms of Service "
                        "and Child Safety Policy."
                    )
        except models.Student.DoesNotExist:
            return False, "Student not found."

        # First check subscription status
        has_sub, subscription, msg = SubscriptionAccessControl.check_subscription_status(student_id)
        
        print(f'=== COURSE ENROLLMENT CHECK ===')
        print(f'Student ID: {student_id}, Course ID: {course_id}')
        print(f'Has subscription: {has_sub}, Message: {msg}')
        
        if not has_sub:
            return False, msg
        
        # Check if already enrolled
        already_enrolled = models.StudentCourseEnrollment.objects.filter(
            student_id=student_id,
            course_id=course_id
        ).exists()
        if already_enrolled:
            return False, "You are already enrolled in this course."
        
        # Get the course
        try:
            course = models.Course.objects.select_related('teacher', 'category').get(id=course_id)
            print(f'Course: {course.title}, Teacher: {course.teacher.full_name}, Category: {course.category.title}')
        except models.Course.DoesNotExist:
            return False, "Course not found."
        
        # Check if subscription allows this course
        can_access, reason = subscription.can_access_course(course)
        print(f'Can access course: {can_access}, Reason: {reason}')
        
        # Print subscription details
        if subscription:
            print(f'Subscription Plan: {subscription.plan.name}')
            print(f'Allowed Teachers: {subscription.plan.get_allowed_teacher_ids()}')
            print(f'Allowed Categories: {subscription.plan.get_allowed_category_ids()}')
            print(f'Is teacher allowed: {subscription.plan.is_teacher_allowed(course.teacher_id)}')
            print(f'Is category allowed: {subscription.plan.is_category_allowed(course.category_id)}')
        
        if not can_access:
            return False, reason
        
        return True, "You can enroll in this course."
    
    @staticmethod
    def get_course_module_unlock_state(student_id, course, subscription):
        """
        Compute the weekly module-drip unlock state for every module in a course.

        Behaviour (client requirement): students unlock ONE module per week
        (or `plan.modules_per_week`), starting from the course enrollment date.
        When a module is unlocked, ALL lessons inside it are accessible. The next
        module unlocks the following week. This is purely time-based — completing
        the previous module is NOT required.

        Returns a dict keyed by module (Chapter) id:
            { chapter_id: {"unlocked": bool, "unlock_date": date|None, "week": int} }

        If the plan has no `modules_per_week` (e.g. the Cohort plan) everything is
        unlocked immediately (no drip).
        """
        today = timezone.now().date()

        try:
            mpw = subscription.plan.modules_per_week if (subscription and subscription.plan) else None
        except Exception:
            mpw = None

        modules = list(models.Chapter.objects.filter(course=course).order_by('order', 'id'))

        drip = bool(mpw)
        allowed_modules = 0
        enrolled_date = today
        if drip:
            mpw = int(mpw)
            # Anchor = per-course enrollment date, fallback to subscription start, then today.
            enrolled_date = None
            try:
                enrollment = models.StudentCourseEnrollment.objects.filter(
                    student_id=student_id, course=course
                ).order_by('enrolled_time').first()
                if enrollment and enrollment.enrolled_time:
                    enrolled_date = enrollment.enrolled_time.date()
            except Exception:
                enrolled_date = None
            if not enrolled_date and subscription and subscription.start_date:
                enrolled_date = subscription.start_date
            if not enrolled_date:
                enrolled_date = today

            days_since_enroll = max(0, (today - enrolled_date).days)
            weeks_elapsed = (days_since_enroll // 7) + 1   # first 7 days = week 1
            allowed_modules = weeks_elapsed * mpw

        state = {}
        for idx, m in enumerate(modules):
            order = getattr(m, 'order', idx) or 0

            # Automatic weekly schedule for this module.
            if drip:
                week_needed = (order // mpw) + 1
                drip_unlocked = order < allowed_modules
                drip_unlock_date = enrolled_date + timedelta(weeks=(week_needed - 1))
            else:
                week_needed = 1
                drip_unlocked = True
                drip_unlock_date = None

            # Teacher manual override wins over the schedule.
            if m.manual_lock is True:
                unlocked, unlock_date = False, None          # locked by teacher (no schedule date)
            elif m.manual_lock is False:
                unlocked, unlock_date = True, None            # unlocked by teacher (possibly early)
            else:
                unlocked = drip_unlocked
                unlock_date = None if drip_unlocked else drip_unlock_date

            state[m.id] = {
                "unlocked": unlocked,
                "unlock_date": unlock_date,
                "week": week_needed,
                "manual": m.manual_lock,   # None / True / False — for the teacher UI
            }
        return state

    @staticmethod
    def resolve_lesson_lock(lesson, module_state):
        """
        Resolve whether a lesson is locked, combining the module's state (which
        already includes the weekly drip + the module-level teacher override) with
        the lesson's own teacher override. Lesson override takes precedence.

        Returns (is_locked: bool, message: str).
        """
        # Individual lesson override wins over everything.
        if lesson.manual_lock is True:
            return True, "This lesson has been locked by your teacher."
        if lesson.manual_lock is False:
            return False, ""

        # Otherwise follow the module.
        if module_state.get("unlocked"):
            return False, ""
        if module_state.get("manual") is True:
            return True, "This module has been locked by your teacher."
        ud = module_state.get("unlock_date")
        when = f" It unlocks on {ud.strftime('%b %d, %Y')}." if ud else ""
        return True, f"This module is not yet unlocked.{when}"

    @staticmethod
    def can_access_lesson(student_id, lesson_id):
        """
        Check if student can access a specific lesson.
        Returns tuple: (can_access: bool, message: str, subscription: Subscription|None)
        """
        # First check subscription status
        has_sub, subscription, msg = SubscriptionAccessControl.check_subscription_status(student_id)
        if not has_sub:
            return False, msg, subscription
        
        # Get the lesson
        try:
            lesson = models.ModuleLesson.objects.select_related(
                'module', 'module__course', 'module__course__teacher', 'module__course__category'
            ).get(id=lesson_id)
        except models.ModuleLesson.DoesNotExist:
            return False, "Lesson not found.", subscription
        
        # Check if preview is allowed (anyone can access preview lessons)
        if lesson.is_preview:
            return True, "Preview lesson - access granted.", subscription
        
        # Check if enrolled in the course
        course = lesson.module.course
        enrollment = models.StudentCourseEnrollment.objects.filter(
            student_id=student_id,
            course_id=course.id
        ).first()
        
        if not enrollment:
            return False, "You must enroll in this course to access this lesson.", subscription

        # ------------------ Module-based weekly unlocking ------------------
        # Students unlock one module per week (plan.modules_per_week) from their
        # course enrollment date. When a module unlocks, ALL its lessons open.
        # This pacing applies to EVERY student (teacher-assigned or not) — the
        # teacher-assignment bypass below only relaxes teacher/category plan
        # restrictions, never the weekly drip. Previously-accessed lessons stay
        # accessible even if somehow re-locked.
        unlock_state = SubscriptionAccessControl.get_course_module_unlock_state(
            student_id, course, subscription
        )
        module_state = unlock_state.get(lesson.module_id, {"unlocked": True, "unlock_date": None, "manual": None})
        is_locked, lock_msg = SubscriptionAccessControl.resolve_lesson_lock(lesson, module_state)
        if is_locked:
            already_accessed = models.ModuleLessonProgress.objects.filter(
                student_id=student_id, lesson_id=lesson_id
            ).exists()
            if not already_accessed:
                return False, lock_msg, subscription
        # ------------------------------------------------------------------

        # If the student is on this course's teacher's roster, the teacher has
        # explicitly granted access — skip the teacher/category plan restrictions
        # (but NOT the weekly drip, which was already enforced above).
        teacher_assigned = models.TeacherStudent.objects.filter(
            teacher=course.teacher,
            student_id=student_id,
            status='active'
        ).exists()
        if teacher_assigned:
            if not subscription.plan or not subscription.is_active_and_paid():
                return False, "No active subscription", subscription
            return True, "Access granted (teacher assigned).", subscription

        # Standard subscription-based lesson access check (access level / premium /
        # teacher-category). Per-lesson weekly/daily/total counters are no longer
        # enforced — pacing is handled by the module drip above.
        can_access, reason = subscription.can_access_lesson(lesson)
        if not can_access:
            return False, reason, subscription

        return True, "Access granted.", subscription
    
    @staticmethod
    def record_lesson_access(student_id, lesson_id):
        """
        Record that a student accessed a lesson.
        Updates subscription counters.
        Returns tuple: (success: bool, message: str)
        """
        # First verify access
        can_access, msg, subscription = SubscriptionAccessControl.can_access_lesson(student_id, lesson_id)
        if not can_access:
            return False, msg
        
        # Get or create lesson progress
        lesson = models.ModuleLesson.objects.get(id=lesson_id)
        progress, created = models.ModuleLessonProgress.objects.get_or_create(
            student_id=student_id,
            lesson_id=lesson_id,
            defaults={'is_completed': False}
        )
        
        # Only count if this is a new access (first time viewing)
        if created:
            subscription.record_lesson_access()
        
        return True, "Lesson access recorded."
    
    @staticmethod
    def enroll_student_in_course(student_id, course_id):
        """
        Enroll a student in a course with subscription validation.
        Returns tuple: (success: bool, enrollment|None, message: str)
        """
        # Verify enrollment is allowed
        can_enroll, msg = SubscriptionAccessControl.can_enroll_in_course(student_id, course_id)
        if not can_enroll:
            return False, None, msg
        
        # Get active subscription
        subscription = SubscriptionAccessControl.get_active_subscription(student_id)
        
        # Create enrollment
        enrollment = models.StudentCourseEnrollment.objects.create(
            student_id=student_id,
            course_id=course_id
        )
        
        # Record course access in subscription
        subscription.record_course_enrollment()
        
        return True, enrollment, "Successfully enrolled in course."
    
    @staticmethod
    def get_accessible_courses_for_student(student_id):
        """
        Get all courses a student can access based on their subscription.
        Returns queryset of courses.
        """
        subscription = SubscriptionAccessControl.get_active_subscription(student_id)
        if not subscription:
            return models.Course.objects.none()
        
        return subscription.get_accessible_courses()
    
    @staticmethod
    def get_assigned_teacher(student_id):
        """
        Get the teacher assigned to a student's subscription.
        Returns Teacher object or None.
        """
        subscription = SubscriptionAccessControl.get_active_subscription(student_id)
        if not subscription:
            return None
        return subscription.assigned_teacher
    
    @staticmethod
    def check_and_expire_subscriptions():
        """
        Check all active subscriptions and expire those past their end date.
        Should be called by a scheduled task (e.g., daily cron job).
        """
        today = timezone.now().date()
        
        expired_subs = models.Subscription.objects.filter(
            status='active',
            end_date__lt=today
        )
        
        count = 0
        for sub in expired_subs:
            sub.expire()
            count += 1
        
        return count
    
    @staticmethod
    def get_subscription_usage(student_id):
        """
        Get detailed usage information for a student's subscription.
        Returns dict with usage details.
        """
        subscription = SubscriptionAccessControl.get_active_subscription(student_id)
        if not subscription:
            return {
                'has_subscription': False,
                'message': 'No active subscription'
            }
        
        usage = subscription.get_usage_summary()
        usage['has_subscription'] = True
        usage['subscription_id'] = subscription.id
        usage['plan_name'] = subscription.plan.name if subscription.plan else None
        usage['assigned_teacher'] = {
            'id': subscription.assigned_teacher.id,
            'name': subscription.assigned_teacher.full_name
        } if subscription.assigned_teacher else None
        
        return usage
    
    @staticmethod
    def assign_teacher_to_subscription(subscription_id, teacher_id):
        """
        Assign a teacher to a subscription.
        Returns tuple: (success: bool, message: str)
        """
        try:
            subscription = models.Subscription.objects.get(id=subscription_id)
        except models.Subscription.DoesNotExist:
            return False, "Subscription not found."
        
        try:
            teacher = models.Teacher.objects.get(id=teacher_id)
        except models.Teacher.DoesNotExist:
            return False, "Teacher not found."
        
        # Validate teacher is allowed in the plan
        if subscription.plan and not subscription.plan.is_teacher_allowed(teacher_id):
            return False, "This teacher is not available in the current subscription plan."
        
        subscription.assigned_teacher = teacher
        subscription.save(update_fields=['assigned_teacher', 'updated_at'])
        
        return True, f"Teacher {teacher.full_name} assigned successfully."
    
    @staticmethod
    def upgrade_subscription(subscription_id, new_plan_id, price_difference=0):
        """
        Upgrade a subscription to a higher plan.
        Returns tuple: (success: bool, message: str)
        """
        try:
            subscription = models.Subscription.objects.get(id=subscription_id)
        except models.Subscription.DoesNotExist:
            return False, "Subscription not found."
        
        try:
            new_plan = models.SubscriptionPlan.objects.get(id=new_plan_id)
        except models.SubscriptionPlan.DoesNotExist:
            return False, "New plan not found."
        
        # Validate it's an upgrade (higher tier)
        if subscription.plan:
            current_rank = subscription.plan.get_access_level_rank()
            new_rank = new_plan.get_access_level_rank()
            if new_rank <= current_rank:
                return False, "New plan must be a higher tier for upgrade."
        
        subscription.upgrade_plan(new_plan, price_difference)
        return True, f"Successfully upgraded to {new_plan.name} plan."
    
    @staticmethod
    def downgrade_subscription(subscription_id, new_plan_id):
        """
        Downgrade a subscription to a lower plan.
        Returns tuple: (success: bool, message: str)
        """
        try:
            subscription = models.Subscription.objects.get(id=subscription_id)
        except models.Subscription.DoesNotExist:
            return False, "Subscription not found."
        
        try:
            new_plan = models.SubscriptionPlan.objects.get(id=new_plan_id)
        except models.SubscriptionPlan.DoesNotExist:
            return False, "New plan not found."
        
        # Validate it's a downgrade (lower tier)
        if subscription.plan:
            current_rank = subscription.plan.get_access_level_rank()
            new_rank = new_plan.get_access_level_rank()
            if new_rank >= current_rank:
                return False, "New plan must be a lower tier for downgrade."
        
        subscription.downgrade_plan(new_plan)
        return True, f"Successfully downgraded to {new_plan.name} plan. Changes take effect at next renewal."


# ==================== DECORATORS FOR VIEW PROTECTION ====================

def require_active_subscription(view_func):
    """
    Decorator to require an active subscription for a view.
    Expects student_id in the request (GET param, POST data, or URL kwargs).
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Try to get student_id from various sources
        student_id = (
            kwargs.get('student_id') or
            request.GET.get('student_id') or
            request.POST.get('student_id') or
            (hasattr(request, 'data') and request.data.get('student_id'))
        )
        
        if not student_id:
            return JsonResponse({
                'error': 'Student ID is required',
                'error_code': 'MISSING_STUDENT_ID'
            }, status=400)
        
        has_sub, subscription, msg = SubscriptionAccessControl.check_subscription_status(student_id)
        
        if not has_sub:
            return JsonResponse({
                'error': msg,
                'error_code': 'NO_ACTIVE_SUBSCRIPTION',
                'subscription_status': subscription.status if subscription else None
            }, status=403)
        
        # Attach subscription to request for use in view
        request.subscription = subscription
        return view_func(request, *args, **kwargs)
    
    return wrapper


def require_course_access(view_func):
    """
    Decorator to require course access permission.
    Expects student_id and course_id in the request.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        student_id = (
            kwargs.get('student_id') or
            request.GET.get('student_id') or
            request.POST.get('student_id') or
            (hasattr(request, 'data') and request.data.get('student_id'))
        )
        
        course_id = (
            kwargs.get('course_id') or
            kwargs.get('pk') or
            request.GET.get('course_id') or
            request.POST.get('course_id') or
            (hasattr(request, 'data') and request.data.get('course_id'))
        )
        
        if not student_id or not course_id:
            return JsonResponse({
                'error': 'Student ID and Course ID are required',
                'error_code': 'MISSING_PARAMETERS'
            }, status=400)
        
        can_access, msg = SubscriptionAccessControl.can_enroll_in_course(student_id, course_id)
        
        if not can_access:
            return JsonResponse({
                'error': msg,
                'error_code': 'COURSE_ACCESS_DENIED'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def require_lesson_access(view_func):
    """
    Decorator to require lesson access permission.
    Expects student_id and lesson_id in the request.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        student_id = (
            kwargs.get('student_id') or
            request.GET.get('student_id') or
            request.POST.get('student_id') or
            (hasattr(request, 'data') and request.data.get('student_id'))
        )
        
        lesson_id = (
            kwargs.get('lesson_id') or
            kwargs.get('pk') or
            request.GET.get('lesson_id') or
            request.POST.get('lesson_id') or
            (hasattr(request, 'data') and request.data.get('lesson_id'))
        )
        
        if not student_id or not lesson_id:
            return JsonResponse({
                'error': 'Student ID and Lesson ID are required',
                'error_code': 'MISSING_PARAMETERS'
            }, status=400)
        
        can_access, msg, subscription = SubscriptionAccessControl.can_access_lesson(student_id, lesson_id)
        
        if not can_access:
            return JsonResponse({
                'error': msg,
                'error_code': 'LESSON_ACCESS_DENIED',
                'subscription_info': subscription.get_usage_summary() if subscription else None
            }, status=403)
        
        # Attach subscription to request
        request.subscription = subscription
        return view_func(request, *args, **kwargs)
    
    return wrapper


# ==================== UTILITY FUNCTIONS ====================

def get_student_access_summary(student_id):
    """
    Get a complete access summary for a student.
    Useful for displaying on dashboard.
    """
    subscription = SubscriptionAccessControl.get_active_subscription(student_id)
    
    if not subscription:
        return {
            'has_active_subscription': False,
            'accessible_courses': [],
            'assigned_teacher': None,
            'usage': None,
            'plan': None
        }
    
    accessible_courses = subscription.get_accessible_courses().values('id', 'title', 'teacher__full_name')
    
    return {
        'has_active_subscription': True,
        'subscription_id': subscription.id,
        'plan': {
            'id': subscription.plan.id,
            'name': subscription.plan.name,
            'access_level': subscription.plan.access_level,
            'can_download': subscription.plan.can_download,
        } if subscription.plan else None,
        'assigned_teacher': {
            'id': subscription.assigned_teacher.id,
            'name': subscription.assigned_teacher.full_name
        } if subscription.assigned_teacher else None,
        'accessible_courses_count': accessible_courses.count(),
        'usage': subscription.get_usage_summary(),
        'status': subscription.status,
        'end_date': subscription.end_date.isoformat() if subscription.end_date else None,
        'days_remaining': subscription.days_remaining()
    }


def validate_course_for_enrollment(student_id, course_id):
    """
    Validate if a course can be enrolled by a student.
    Returns detailed validation result.
    """
    result = {
        'can_enroll': False,
        'reasons': [],
        'warnings': []
    }
    
    # Check subscription
    has_sub, subscription, msg = SubscriptionAccessControl.check_subscription_status(student_id)
    if not has_sub:
        result['reasons'].append(msg)
        return result
    
    # Check if already enrolled
    if models.StudentCourseEnrollment.objects.filter(
        student_id=student_id, course_id=course_id
    ).exists():
        result['reasons'].append("Already enrolled in this course")
        return result
    
    # Get course
    try:
        course = models.Course.objects.select_related('teacher', 'category').get(id=course_id)
    except models.Course.DoesNotExist:
        result['reasons'].append("Course not found")
        return result
    
    # Check subscription access
    can_access, reason = subscription.can_access_course(course)
    if not can_access:
        result['reasons'].append(reason)
        return result
    
    # Add warnings if close to limits
    usage = subscription.get_usage_summary()
    if usage['courses_remaining'] <= 2:
        result['warnings'].append(f"Only {usage['courses_remaining']} course slots remaining")
    
    result['can_enroll'] = True
    return result
