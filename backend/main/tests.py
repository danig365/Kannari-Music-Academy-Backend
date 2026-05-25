from django.test import TestCase
from django.utils import timezone

from . import models


class TeacherMinorOverrideTests(TestCase):
    def setUp(self):
        self.admin = models.Admin.objects.create(
            full_name='Admin User',
            email='admin@example.com',
            password='secret',
            role='super_admin',
        )
        self.teacher = models.Teacher.objects.create(
            full_name='Teacher User',
            email='teacher@example.com',
            password='secret',
            qualification='Music Education',
            mobile_no='9999999999',
        )

    def test_admin_can_quick_approve_and_revoke_minor_access(self):
        approve_response = self.client.post(
            f'/api/admin/teacher/{self.teacher.id}/verification/override-minors/',
            data={
                'requester_admin_id': self.admin.id,
                'decision': 'approved',
                'reason': 'Trusted teacher onboarding',
            },
        )

        self.assertEqual(approve_response.status_code, 200)
        self.assertTrue(approve_response.json()['bool'])

        verification = models.TeacherVerification.objects.get(teacher=self.teacher)
        self.teacher.refresh_from_db()
        self.assertTrue(verification.admin_override_for_minors)
        self.assertTrue(self.teacher.can_teach_minors)
        self.assertEqual(models.ActivityLog.objects.count(), 1)
        self.assertIn('granted minor-teaching override', models.ActivityLog.objects.first().description)

        revoke_response = self.client.post(
            f'/api/admin/teacher/{self.teacher.id}/verification/override-minors/',
            data={
                'requester_admin_id': self.admin.id,
                'decision': 'revoked',
                'reason': 'Policy review completed',
            },
        )

        self.assertEqual(revoke_response.status_code, 200)
        self.assertTrue(revoke_response.json()['bool'])

        verification.refresh_from_db()
        self.teacher.refresh_from_db()
        self.assertFalse(verification.admin_override_for_minors)
        self.assertFalse(self.teacher.can_teach_minors)
        self.assertEqual(models.ActivityLog.objects.count(), 2)
        self.assertIn('revoked minor-teaching override', models.ActivityLog.objects.first().description)


class RepeatAfterMeActionTests(TestCase):
    def setUp(self):
        self.teacher = models.Teacher.objects.create(
            full_name='Repeat Teacher',
            email='repeat.teacher@example.com',
            password='secret',
            qualification='Music Education',
            mobile_no='9999999998',
        )
        self.category = models.CourseCategory.objects.create(
            title='Guitar',
            description='Guitar lessons'
        )
        self.course = models.Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='Beginner Guitar',
            description='Start here'
        )
        self.module = models.Chapter.objects.create(
            course=self.course,
            title='Module 1',
            description='Basics'
        )
        self.lesson = models.ModuleLesson.objects.create(
            module=self.module,
            title='Lesson 1',
            description='Intro'
        )
        self.student = models.Student.objects.create(
            fullname='Repeat Student',
            email='repeat.student@example.com',
            password='secret',
            username='repeatstudent',
            interseted_categories='guitar'
        )
        self.plan = models.SubscriptionPlan.objects.create(
            name='Basic Plan',
            access_level='basic'
        )
        today = timezone.now().date()
        self.subscription = models.Subscription.objects.create(
            student=self.student,
            plan=self.plan,
            status='active',
            is_paid=True,
            start_date=today,
            end_date=today + timezone.timedelta(days=30)
        )
        models.StudentCourseEnrollment.objects.create(
            course=self.course,
            student=self.student,
            subscription=self.subscription
        )

    def test_repeat_action_rejected_when_disabled(self):
        response = self.client.post(
            f'/api/student/{self.student.id}/lesson/{self.lesson.id}/repeat-after-me/',
            data={'action': 'done'}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(models.RepeatAfterMeAction.objects.count(), 0)

    def test_repeat_action_recorded_when_enabled(self):
        self.lesson.repeat_after_me_enabled = True
        self.lesson.save(update_fields=['repeat_after_me_enabled'])

        response = self.client.post(
            f'/api/student/{self.student.id}/lesson/{self.lesson.id}/repeat-after-me/',
            data={'action': 'done'}
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload['bool'])
        self.assertEqual(payload['action'], 'done')

        action = models.RepeatAfterMeAction.objects.first()
        self.assertIsNotNone(action)
        self.assertEqual(action.action, 'done')
        self.assertEqual(action.student_id, self.student.id)
        self.assertEqual(action.lesson_id, self.lesson.id)


class TeacherProgressRepeatAfterMeTests(TestCase):
    def setUp(self):
        self.teacher = models.Teacher.objects.create(
            full_name='Progress Teacher',
            email='progress.teacher@example.com',
            password='secret',
            qualification='Music Education',
            mobile_no='9999999997',
        )
        self.category = models.CourseCategory.objects.create(
            title='Piano',
            description='Piano lessons'
        )
        self.course = models.Course.objects.create(
            category=self.category,
            teacher=self.teacher,
            title='Piano Basics',
            description='Learn piano'
        )
        self.module = models.Chapter.objects.create(
            course=self.course,
            title='Module 1',
            description='Intro'
        )
        self.lesson = models.ModuleLesson.objects.create(
            module=self.module,
            title='Lesson 1',
            description='Intro lesson',
            repeat_after_me_enabled=True
        )
        self.student = models.Student.objects.create(
            fullname='Progress Student',
            email='progress.student@example.com',
            password='secret',
            username='progressstudent',
            interseted_categories='piano'
        )
        models.TeacherStudent.objects.create(
            teacher=self.teacher,
            student=self.student,
            instrument='piano',
            level='beginner'
        )
        models.RepeatAfterMeAction.objects.create(
            student=self.student,
            lesson=self.lesson,
            action='got_it'
        )

    def test_teacher_progress_includes_repeat_after_me_activity(self):
        response = self.client.get(f'/api/teacher/progress/{self.teacher.id}/')

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('repeat_after_me_counts', payload)
        self.assertIn('repeat_after_me_recent', payload)
        self.assertEqual(payload['repeat_after_me_counts']['total'], 1)
        self.assertEqual(payload['repeat_after_me_counts']['got_it'], 1)
        self.assertTrue(len(payload['repeat_after_me_recent']) >= 1)
        self.assertEqual(payload['repeat_after_me_recent'][0]['action'], 'got_it')

    def test_teacher_progress_repeat_after_me_pagination(self):
        models.RepeatAfterMeAction.objects.create(
            student=self.student,
            lesson=self.lesson,
            action='done'
        )

        response = self.client.get(
            f'/api/teacher/progress/{self.teacher.id}/?repeat_after_me_limit=1&repeat_after_me_offset=0'
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload['repeat_after_me_recent']), 1)
        self.assertEqual(payload['repeat_after_me_recent_meta']['total'], 2)
        self.assertEqual(payload['repeat_after_me_recent_meta']['limit'], 1)
        self.assertEqual(payload['repeat_after_me_recent_meta']['offset'], 0)

    def test_teacher_progress_repeat_after_me_filter_action(self):
        models.RepeatAfterMeAction.objects.create(
            student=self.student,
            lesson=self.lesson,
            action='done'
        )

        response = self.client.get(
            f'/api/teacher/progress/{self.teacher.id}/?repeat_after_me_action=done'
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['repeat_after_me_counts']['total'], 1)
        self.assertEqual(payload['repeat_after_me_counts']['done'], 1)
        self.assertEqual(payload['repeat_after_me_recent'][0]['action'], 'done')
