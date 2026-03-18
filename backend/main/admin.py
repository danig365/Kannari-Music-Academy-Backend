from django.contrib import admin
from . import models

admin.site.register(models.Teacher)

admin.site.register(models.CourseCategory)

admin.site.register(models.Course)

admin.site.register(models.Chapter)

admin.site.register(models.Student)

admin.site.register(models.StudentCourseEnrollment)

admin.site.register(models.CourseRating)

admin.site.register(models.StudentFavoriteCourse)

admin.site.register(models.StudyMaterial)

admin.site.register(models.Faq)

admin.site.register(models.SubscriptionPlan)

admin.site.register(models.Subscription)

admin.site.register(models.SubscriptionHistory)

# Teacher Dashboard models
class TeacherStudentAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'student', 'instrument', 'level', 'status', 'progress_percentage', 'last_active']
    list_filter = ['status', 'instrument', 'level', 'teacher']
    search_fields = ['teacher__full_name', 'student__fullname', 'student__email']
    raw_id_fields = ['teacher', 'student']

admin.site.register(models.TeacherStudent, TeacherStudentAdmin)
admin.site.register(models.TeacherSession)
admin.site.register(models.TeacherActivity)

# School models
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'city', 'status', 'max_teachers', 'max_students', 'created_at']
    list_filter = ['status', 'city', 'country']
    search_fields = ['name', 'email', 'city']

admin.site.register(models.School, SchoolAdmin)

class SchoolUserAdmin(admin.ModelAdmin):
    list_display = ['email', 'school', 'is_active', 'last_login', 'created_at']
    list_filter = ['is_active']
    search_fields = ['email', 'school__name']

admin.site.register(models.SchoolUser, SchoolUserAdmin)

# Custom Admin model
class CustomAdminAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'role', 'is_active', 'last_login', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['full_name', 'email']

admin.site.register(models.Admin, CustomAdminAdmin)
admin.site.register(models.PolicyDocument)
admin.site.register(models.TeacherVerification)
admin.site.register(models.TeacherIDVerification)
admin.site.register(models.TeacherBackgroundCheck)
admin.site.register(models.TeacherAgreementSignature)
admin.site.register(models.ParentAccount)
admin.site.register(models.StudentParentLink)
admin.site.register(models.ParentalConsent)
admin.site.register(models.SessionAuthorization)
admin.site.register(models.SessionParticipantLog)
admin.site.register(models.SafetyReport)

# Messaging & Chat Lock
admin.site.register(models.Message)

class ChatLockPolicyAdmin(admin.ModelAdmin):
    list_display = ['parent_link', 'is_locked', 'lock_reason', 'unlocked_by', 'unlock_expires_at', 'updated_at']
    list_filter = ['is_locked', 'lock_reason', 'unlocked_by']
admin.site.register(models.ChatLockPolicy, ChatLockPolicyAdmin)

class TeacherOfficeHoursAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'day_of_week', 'start_time', 'end_time', 'is_active']
    list_filter = ['is_active', 'day_of_week']
admin.site.register(models.TeacherOfficeHours, TeacherOfficeHoursAdmin)

class ChatUnlockRequestAdmin(admin.ModelAdmin):
    list_display = ['parent_link', 'unlocked_by_admin', 'unlocked_by_school', 'duration_hours', 'expires_at']
    list_filter = ['duration_hours']
admin.site.register(models.ChatUnlockRequest, ChatUnlockRequestAdmin)

# Group Features
admin.site.register(models.GroupMessage)
admin.site.register(models.GroupAnnouncement)
admin.site.register(models.GroupResource)

class GroupSessionAdmin(admin.ModelAdmin):
    list_display = ['group_class', 'teacher', 'title', 'scheduled_date', 'scheduled_time', 'status', 'is_live']
    list_filter = ['status', 'is_live', 'session_type']
admin.site.register(models.GroupSession, GroupSessionAdmin)
admin.site.register(models.GroupSessionParticipantLog)

# Discussion & Multiple Choice
admin.site.register(models.DiscussionThread)
admin.site.register(models.MultipleChoiceQuestion)
admin.site.register(models.MultipleChoiceAnswer)

# Parent Policy
admin.site.register(models.ParentPolicyAcceptance)