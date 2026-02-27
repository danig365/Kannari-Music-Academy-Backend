from django.urls import path
from . import views

urlpatterns =[
        path('teacher/', views.TeacherList.as_view()),

        path('student/', views.StudentList.as_view()),

        path('teacher/<int:pk>/',views.TeacherDetail.as_view()),
        
        path('teacher-login',views.teacher_login),

     path('verify-email/teacher/', views.verify_teacher_email, name='verify-teacher-email'),
   path('password-reset/request/teacher/', views.request_teacher_password_reset),
   path('password-reset/confirm/teacher/', views.confirm_teacher_password_reset),

        path('teacher/change-password/<int:teacher_id>/',views.teacher_change_password),

        path('student/change-password/<int:student_id>/',views.student_change_password),

        path('teacher/dashboard/<int:pk>/', views.TeacherDashboard.as_view()),

        path('student/dashboard/<int:pk>/', views.StudentDashboard.as_view()),

        path('student-login',views.student_login),

     path('verify-email/student/', views.verify_student_email, name='verify-student-email'),
   path('password-reset/request/student/', views.request_student_password_reset),
   path('password-reset/confirm/student/', views.confirm_student_password_reset),

        path('student/<int:pk>/',views.StudentDetail.as_view()),

        path('category/', views.CategoryList.as_view()),

        path('course/', views.CourseList.as_view()),

        path('search-courses/<str:searchstring>', views.CourseList.as_view()),

        path('course/<int:pk>/', views.CourseDetailView.as_view()),

        path('chapter/<int:pk>', views.ChapterDetailView.as_view()),

        path('course-chapters/<int:course_id>', views.CourseChapterList.as_view()),

        path('teacher-course/<int:teacher_id>', views.TeacherCourseList.as_view()),

        path('teacher-course-detail/<int:pk>', views.TeacherCourseDetail.as_view()),

        path('student-enroll-course/', views.StudentEnrollCourseList.as_view()),

        path('fetch-enroll-status/<int:student_id>/<int:course_id>', views.fetch_enroll_status),

        path('fetch-enrolled-courses/<int:student_id>', views.EnrolledStuentList.as_view()),

        path('fetch-enrolled-students/<int:course_id>', views.EnrolledStuentList.as_view()),

        path('fetch-recomemded-coourses/<int:student_id>', views.EnrolledStuentList.as_view()),

        path('fetch-all-enrolled-students/<int:teacher_id>', views.EnrolledStuentList.as_view()),

        path('course-rating/', views.CourseRatingList.as_view()),

        path('popular-courses/', views.CourseRatingList.as_view()),

        path('fetch-rating-status/<int:student_id>/<int:course_id>', views.fetch_rating_status),
        path('fetch-favorite-status/<int:student_id>/<int:course_id>', views.fetch_favorite_status),

        path('student-add-favorte-course/', views.StudentFavoriteCourseList.as_view()),

        path('student-remove-favorite-course/<int:course_id>/<int:student_id>', views.remove_favorite_course),

        path('fetch-favorite-coourses/<int:student_id>', views.StudentFavoriteCourseList.as_view()),

        path('study-material/<int:course_id>', views.StudyMaterialList.as_view()),

        path('study-materials/<int:pk>', views.StudyMaterialView.as_view()),

        path('user/study-material/<int:course_id>', views.StudyMaterialList.as_view()),

        path('update-view/<int:course_id>', views.update_view),

        path('student-test/', views.CourseRatingList.as_view()),

        path('popular-teachers/', views.TeacherList.as_view()),

        path('faq/', views.FaqList.as_view()),

        path('pages/', views.FlatPagesList.as_view()),

        path('pages/<int:pk>/<str:page_slug>', views.FlatPagesDetail.as_view()),

        path('fetch-my-teachers/<int:student_id>', views.MyTeacherList().as_view()),

        # ==================== ADMIN DASHBOARD URLS ====================
        
        # Admin Authentication
        path('admin-user/', views.AdminList.as_view()),
        path('admin-user/<int:pk>/', views.AdminDetail.as_view()),
        path('admin-login', views.admin_login),
        path('admin/change-password/<int:admin_id>/', views.admin_change_password),
        path('admin/dashboard/<int:pk>/', views.AdminDashboard.as_view()),
        path('admin/stats/', views.admin_stats),
        
        # School Management
        path('schools/', views.SchoolList.as_view()),
        path('schools/<int:pk>/', views.SchoolDetail.as_view()),
        path('schools/<int:school_id>/teachers/', views.SchoolTeacherList.as_view()),
        path('school-teachers/<int:pk>/', views.SchoolTeacherDetail.as_view()),
        path('schools/<int:school_id>/students/', views.SchoolStudentList.as_view()),
        path('school-students/<int:pk>/', views.SchoolStudentDetail.as_view()),
        path('schools/<int:school_id>/courses/', views.SchoolCourseList.as_view()),
        path('school-courses/<int:pk>/', views.SchoolCourseDetail.as_view()),
        
        # Activity Logs
        path('activity-logs/', views.ActivityLogList.as_view()),
        
        # System Settings
        path('system-settings/', views.SystemSettingsList.as_view()),
        path('system-settings/<int:pk>/', views.SystemSettingsDetail.as_view()),
        path('get-settings/', views.get_or_create_settings),
        
        # Admin Management of All Users
        path('admin/teachers/', views.AdminTeacherList.as_view()),
        path('admin/toggle-teacher/<int:teacher_id>/', views.admin_toggle_teacher_status),
      path('teacher/<int:teacher_id>/verification/start/', views.teacher_verification_start),
      path('teacher/<int:teacher_id>/verification/status/', views.teacher_verification_status),
      path('teacher/<int:teacher_id>/verification/upload-id/', views.teacher_verification_upload_id),
      path('teacher/<int:teacher_id>/verification/background-check/', views.teacher_verification_submit_background),
      path('teacher/<int:teacher_id>/verification/sign-agreement/', views.teacher_verification_sign_agreement),
      path('admin/teacher/<int:teacher_id>/verification/', views.admin_teacher_verification_detail),
      path('admin/teacher/<int:teacher_id>/verification/review-id/', views.admin_review_teacher_id_verification),
      path('admin/teacher/<int:teacher_id>/verification/review-background/', views.admin_review_teacher_background_check),
      path('admin/teacher/<int:teacher_id>/verification/review-agreement/<int:signature_id>/', views.admin_review_teacher_agreement),
      path('admin/teacher/<int:teacher_id>/verification/activate/', views.admin_activate_teacher_after_verification),
      path('admin/teacher/<int:teacher_id>/verification/reject/', views.admin_reject_teacher_verification),
        path('admin/students/', views.AdminStudentList.as_view()),
        path('admin/courses/', views.AdminCourseList.as_view()),
        path('admin/course/create/', views.AdminCourseCreate.as_view()),
        path('admin/course/<int:pk>/', views.AdminCourseDetail.as_view()),
        path('admin/delete-course/<int:course_id>/', views.admin_delete_course),

        # ==================== ADMIN LESSON MANAGEMENT URLS ====================
        
        # Modules (formerly Chapters)
        path('admin/modules/', views.AdminModuleList.as_view()),
        path('admin/module/<int:pk>/', views.AdminModuleDetail.as_view()),
        path('admin/course/<int:course_id>/modules/', views.AdminCourseModulesWithLessons.as_view()),
        path('admin/course/<int:course_id>/reorder-modules/', views.admin_reorder_modules),
        
        # Module Lessons
        path('admin/module/<int:module_id>/lessons/', views.AdminModuleLessonList.as_view()),
        path('admin/lesson/<int:pk>/', views.AdminModuleLessonDetail.as_view()),
     path('admin/lesson/<int:lesson_id>/duplicate/', views.duplicate_module_lesson),
        path('admin/module/<int:module_id>/reorder-lessons/', views.admin_reorder_lessons),
        path('admin/lessons/bulk-delete/', views.admin_bulk_delete_lessons),
        
        # Lesson Downloadables (Admin)
        path('lesson/<int:lesson_id>/downloadables/', views.LessonDownloadableList.as_view()),
        path('downloadable/<int:pk>/', views.LessonDownloadableDetail.as_view()),
        path('downloadable/<int:downloadable_id>/increment/', views.increment_download_count),
        
        # Student Lesson Progress
        path('student/<int:student_id>/course/<int:course_id>/progress/', views.StudentModuleProgress.as_view()),
        path('student/<int:student_id>/course/<int:course_id>/progress-enhanced/', views.StudentModuleProgressEnhanced.as_view()),
        path('student/<int:student_id>/lesson/<int:lesson_id>/complete/', views.mark_lesson_complete),
        path('student/<int:student_id>/lesson/<int:lesson_id>/position/', views.update_lesson_position),
        path('student/<int:student_id>/course/<int:course_id>/lesson/<int:current_lesson_id>/navigation/', views.StudentCourseNavigation.as_view()),
        path('student/<int:student_id>/lesson/<int:lesson_id>/unlock-status/', views.check_lesson_unlock_status),
        path('lesson/<int:lesson_id>/detail/', views.LessonDetailWithDownloadables.as_view()),
        path('lesson/<int:lesson_id>/detail/<int:student_id>/', views.LessonDetailWithDownloadables.as_view()),

      # Minor safety & parental consent
      path('student/<int:student_id>/parent/request-link/', views.student_request_parent_link),
      path('student/<int:student_id>/parent/resend-email/', views.resend_parental_consent_email),
      path('student/<int:student_id>/parent/status/', views.student_parent_consent_status),
      path('parent/consent/verify/', views.parental_consent_verify),
      path('parent/consent/respond/', views.parental_consent_respond),
      path('parent/<int:parent_id>/student/<int:student_id>/authorize/', views.parent_authorize_student),
      path('parent/<int:parent_id>/student/<int:student_id>/live-consent/', views.parent_manage_live_consent),
      path('parent/<int:parent_id>/student/<int:student_id>/preauthorize-sessions/', views.parent_preauthorize_sessions),
      path('parent/<int:parent_id>/children/', views.parent_children),
      path('session/<int:session_id>/student/<int:student_id>/parental-status/', views.session_parental_status),
      path('admin/minors/consent-status/', views.admin_minors_consent_status),
        
        # Consolidated Lesson Page Data (replaces 3 separate calls)
        path('student/<int:student_id>/course/<int:course_id>/lesson/<int:lesson_id>/full-page-data/', 
             views.StudentLessonPageData.as_view()),
        path('student/<int:student_id>/course/<int:course_id>/full-page-data/', 
             views.StudentLessonPageData.as_view()),

        # ==================== ENHANCED STUDENT DASHBOARD URLS ====================
        
        # Enhanced Dashboard
        path('student/enhanced-dashboard/<int:student_id>/', views.EnhancedStudentDashboard.as_view()),
        
        # Streak Calendar & Gamification
        path('student/streak-calendar/<int:student_id>/', views.StudentStreakCalendar.as_view()),
        path('student/all-achievements/<int:student_id>/', views.StudentAllAchievements.as_view()),
        
        # Weekly Goals
        path('student/weekly-goals/<int:student_id>/', views.WeeklyGoalList.as_view()),
        path('student/weekly-goal/<int:pk>/', views.WeeklyGoalDetail.as_view()),
        path('student/create-weekly-goal/<int:student_id>/', views.create_weekly_goal),
        
        # Lesson Progress
        path('student/lesson-progress/<int:student_id>/', views.LessonProgressList.as_view()),
        path('student/lesson-progress/<int:student_id>/<int:course_id>/', views.LessonProgressList.as_view()),
        path('student/update-lesson-progress/<int:student_id>/<int:chapter_id>/', views.update_lesson_progress),
        
        # Course Progress
        path('student/course-progress/<int:student_id>/', views.CourseProgressList.as_view()),
        path('student/course-progress/<int:student_id>/<int:course_id>/', views.CourseProgressDetail.as_view()),
        
        # Daily Activity
        path('student/daily-activity/<int:student_id>/', views.DailyActivityList.as_view()),
        
        # Achievements
        path('achievements/', views.AchievementList.as_view()),
        path('student/achievements/<int:student_id>/', views.StudentAchievementList.as_view()),
        path('student/check-achievements/<int:student_id>/', views.check_achievements),
        
        # ==================== ENHANCED TEACHER DASHBOARD URLS ====================
        
        # Teacher Dashboard Overview
        path('teacher/overview/<int:teacher_id>/', views.TeacherOverviewDashboard.as_view()),
        
        # Teacher Students Management
        path('teacher/students/<int:teacher_id>/', views.TeacherStudentList.as_view()),
        path('teacher/student/<int:pk>/', views.TeacherStudentDetail.as_view()),
        path('teacher/students-from-enrollments/<int:teacher_id>/', views.get_teacher_students_from_enrollments),
        path('teacher/search-students/<int:teacher_id>/', views.search_students_for_teacher),
        path('teacher/assign-course/<int:teacher_id>/', views.assign_course_to_student),
        path('teacher/unassign-course/<int:teacher_id>/', views.unassign_course_from_student),
        path('teacher/courses-for-student/<int:teacher_id>/<int:student_id>/', views.get_teacher_courses_for_student),
        
        # Teacher Sessions/Appointments
        path('teacher/sessions/<int:teacher_id>/', views.TeacherSessionList.as_view()),
        path('teacher/session/<int:pk>/', views.TeacherSessionDetail.as_view()),
        path('session/<int:session_id>/recording/update/', views.update_session_recording),
        path('session/<int:session_id>/report/', views.create_session_safety_report),
        path('audio-message/<int:audio_message_id>/report/', views.create_audio_message_safety_report),
        path('admin/safety-reports/', views.admin_safety_reports),
        path('admin/safety-report/<int:report_id>/update/', views.admin_update_safety_report),
        
        # Teacher Activity Feed
        path('teacher/activities/<int:teacher_id>/', views.TeacherActivityList.as_view()),
        path('teacher/activity/create/<int:teacher_id>/', views.create_teacher_activity),
        
        # Lesson Library
        path('teacher/lessons/<int:teacher_id>/', views.TeacherLessonList.as_view()),
        path('teacher/lesson/<int:pk>/', views.TeacherLessonDetail.as_view()),
        
        # Lesson Materials
        path('lesson/materials/<int:lesson_id>/', views.LessonMaterialList.as_view()),
        path('lesson/material/<int:pk>/', views.LessonMaterialDetail.as_view()),
        path('lesson/upload-material/<int:lesson_id>/', views.upload_lesson_material),
        
        # Teacher Progress Dashboard
        path('teacher/progress/<int:teacher_id>/', views.TeacherProgressDashboard.as_view()),

        # ==================== SUBSCRIPTION MANAGEMENT URLS ====================
        
        # Subscription Plans
        path('subscription-plans/', views.SubscriptionPlanList.as_view()),
        path('subscription-plan/<int:pk>/', views.SubscriptionPlanDetail.as_view()),
        
        # Subscriptions
        path('subscriptions/', views.SubscriptionList.as_view()),
        path('subscription/create-payment-intent/', views.create_payment_intent),
        path('subscription/<int:subscription_id>/activate/', views.activate_subscription),
        path('subscription/<int:subscription_id>/cancel/', views.cancel_subscription),
        path('subscription/<int:pk>/', views.SubscriptionDetail.as_view()),
        
        # Subscription History
        path('subscription-history/', views.SubscriptionHistoryList.as_view()),
        
        # Admin Stats
        path('admin/subscription-stats/', views.get_admin_subscription_stats),
        
        # ==================== ACCESS CONTROL URLS ====================
        
        # Check subscription status
        path('access/check-subscription/<int:student_id>/', views.check_subscription_access),
        
        # Check course access
        path('access/course/<int:student_id>/<int:course_id>/', views.check_course_access),
        
        # Check lesson access
        path('access/lesson/<int:student_id>/<int:lesson_id>/', views.check_lesson_access),
        
        # Record lesson access (updates usage counters)
        path('access/record-lesson/<int:student_id>/<int:lesson_id>/', views.record_lesson_access),
        
        # Enroll with subscription validation
        path('access/enroll/', views.enroll_with_subscription),
        
        # Protected enrollment endpoint
        path('access/protected-enroll/', views.ProtectedCourseEnrollView.as_view()),
        
        # Get student access summary
        path('access/summary/<int:student_id>/', views.get_student_access_info),
        
        # Get accessible courses for a student
        path('access/courses/<int:student_id>/', views.get_accessible_courses),
        
        # Get subscription usage
        path('access/usage/<int:student_id>/', views.get_subscription_usage),
        
        # Get assigned teacher
        path('access/assigned-teacher/<int:student_id>/', views.get_assigned_teacher),
        
        # Assign teacher to subscription
        path('access/assign-teacher/', views.assign_teacher_to_student),
        
        # Get teachers available for a plan
        path('access/plan-teachers/<int:plan_id>/', views.get_plan_teachers),
        
        # Upgrade subscription
        path('access/upgrade/', views.upgrade_subscription),
        
        # Downgrade subscription
        path('access/downgrade/', views.downgrade_subscription),
        
        # Manual expiration check (for admin/cron)
        path('access/expire-check/', views.expire_old_subscriptions),

        # ==================== AUDIT LOGS URLS ====================
        
        # Upload Logs
        path('audit/uploads/', views.UploadLogList.as_view(), name='upload-logs'),
        path('audit/uploads/<int:pk>/', views.UploadLogDetail.as_view(), name='upload-log-detail'),
        path('audit/log-upload/', views.log_file_upload),
        
        # Payment Logs
        path('audit/payments/', views.PaymentLogList.as_view(), name='payment-logs'),
        path('audit/payments/<int:pk>/', views.PaymentLogDetail.as_view(), name='payment-log-detail'),
        path('audit/log-payment/', views.api_log_payment),
        
        # Access Logs
        path('audit/access/', views.AccessLogList.as_view(), name='access-logs'),
        path('audit/access/<int:pk>/', views.AccessLogDetail.as_view(), name='access-log-detail'),
        path('audit/log-access/', views.api_log_access),
        
        # Audit Summary & Export
        path('audit/summary/', views.get_audit_summary),
        path('audit/export/<str:log_type>/', views.export_audit_logs),

        # ==================== SCHOOL DASHBOARD URLS ====================
        
        # School Authentication
        path('school-login', views.school_login),
        path('school/change-password/<int:school_user_id>/', views.school_change_password),
        path('school/dashboard/<int:school_id>/', views.school_dashboard_stats),
        
        # School Teachers / Students / Courses
        path('school/teachers/<int:school_id>/', views.SchoolTeacherListView.as_view()),
        path('school/students/<int:school_id>/', views.SchoolStudentListView.as_view()),
        path('school/courses/<int:school_id>/', views.SchoolCourseListView.as_view()),
        path('school/assign-teacher-to-student/<int:school_id>/', views.school_assign_teacher_to_student),
        
        # Group Classes
        path('school/groups/<int:school_id>/', views.SchoolGroupClassList.as_view()),
        path('school/group/<int:pk>/', views.SchoolGroupClassDetail.as_view()),
        path('school/group/<int:group_id>/assign-teacher/', views.school_assign_teacher_to_group),
        path('school/group/<int:group_id>/remove-teacher/<int:teacher_id>/', views.school_remove_teacher_from_group),
        path('school/group/<int:group_id>/assign-student/', views.school_assign_student_to_group),
        path('school/group/<int:group_id>/remove-student/<int:student_id>/', views.school_remove_student_from_group),
        path('school/group/<int:group_id>/teachers/', views.GroupClassTeacherList.as_view()),
        path('school/group/<int:group_id>/students/', views.GroupClassStudentList.as_view()),
        
        # Lesson Assignments
        path('school/lesson-assignments/<int:school_id>/', views.SchoolLessonAssignmentList.as_view()),
        path('school/lesson-assignment/<int:pk>/', views.SchoolLessonAssignmentDetail.as_view()),
     path('student/<int:student_id>/lesson-assignments/', views.StudentLessonAssignmentList.as_view()),
     path('student/<int:student_id>/lesson-assignment/<int:assignment_id>/submit/', views.student_submit_lesson_assignment),
     path('teacher/<int:teacher_id>/lesson-assignment-submissions/', views.TeacherLessonAssignmentSubmissionList.as_view()),
     path('teacher/<int:teacher_id>/lesson-assignment-submission/<int:submission_id>/grade/', views.teacher_grade_lesson_assignment_submission),
        
        # School Progress
        path('school/progress/<int:school_id>/', views.school_progress_overview),

        # ==================== LIVE VIDEO SESSION URLS ====================
        
        path('session/<int:session_id>/go-live/', views.session_go_live),
        path('session/<int:session_id>/end/', views.session_end),
        path('student/<int:student_id>/upcoming-sessions/', views.StudentUpcomingSessions.as_view()),
        path('student/<int:student_id>/live-sessions/', views.StudentLiveSessions.as_view()),
        path('student/<int:student_id>/join-session/<int:session_id>/', views.student_join_live_session),

        # ==================== AUDIO MESSAGE URLS ====================
        
        path('teacher/<int:teacher_id>/audio-messages/', views.TeacherAudioMessageList.as_view()),
        path('audio-message/<int:pk>/', views.TeacherAudioMessageDetail.as_view()),
        path('student/<int:student_id>/audio-messages/', views.StudentAudioMessageList.as_view()),
        path('audio-message/<int:pk>/read/', views.mark_audio_message_read),
        path('student/<int:student_id>/unread-audio-count/', views.student_unread_audio_count),

]