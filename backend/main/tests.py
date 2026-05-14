from django.test import TestCase

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
