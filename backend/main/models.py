from django.db import models
from django.core import serializers

class Teacher(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('unverified', 'Unverified'),
        ('in_review', 'In Review'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    full_name=models.CharField(max_length=100)
    email=models.CharField(max_length=100)
    password=models.CharField(max_length=100,blank=True,null=True)
    is_verified=models.BooleanField(default=False)
    is_approved=models.BooleanField(default=False)
    verification_status=models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='unverified')
    can_teach_minors=models.BooleanField(default=False)
    qualification=models.CharField(max_length=500)
    mobile_no=models.CharField(max_length=20)
    profile_img=models.ImageField(upload_to='teacher_profile_imgs/',null=True)
    skills=models.CharField(max_length=20,null=True)

    face_url=models.URLField(null=True,blank=True)
    insta_url=models.URLField(null=True,blank=True)
    twit_url=models.URLField(null=True,blank=True)
    web_url=models.URLField(null=True,blank=True)
    you_url=models.URLField(null=True,blank=True)

    class Meta:
        verbose_name_plural="1. Teacher"

    def skill_list(self):
        skill_list=self.skills.split(',')
        return skill_list

    def total_teacher_course(self):
        total_course=Course.objects.filter(teacher=self).count()
        return total_course

    def total_teacher_chapters(self):
        total_chapters=Chapter.objects.filter(course__teacher=self).count()
        return total_chapters

    def total_teacher_students(self):
        total_students=StudentCourseEnrollment.objects.filter(course__teacher=self).count()
        return total_students 

class CourseCategory(models.Model):
    title=models.CharField(max_length=100)
    description=models.TextField()

    class Meta:
        verbose_name_plural="2. Course Categories"

    def total_courses(self):
        return Course.objects.filter(category=self).count()

    def __str__(self) :
        return self.title

class Course(models.Model):
    ACCESS_LEVEL_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]
    
    category=models.ForeignKey(CourseCategory,on_delete=models.CASCADE, related_name='category_courses')
    teacher=models.ForeignKey(Teacher,on_delete=models.CASCADE, related_name='teacher_courses')
    title=models.CharField(max_length=150)
    description=models.TextField()
    featured_img=models.ImageField(upload_to='course_imgs/',null=True)
    techs=models.TextField(null=True)
    course_views=models.BigIntegerField(default=0)
    
    # Access control fields
    required_access_level = models.CharField(max_length=20, choices=ACCESS_LEVEL_CHOICES, default='free',
                                              help_text="Minimum subscription level required to access this course")
    is_featured = models.BooleanField(default=False, help_text="Feature this course on homepage")

    class Meta:
        verbose_name_plural="3. Courses"

    def related_videos(self):
        related_videos=Course.objects.filter(techs__icontains=self.techs).exclude(id=self.id)
        return serializers.serialize('json',related_videos)

    def teach_list(self):
        teach_list=self.techs.split(',')
        return teach_list

    def total_enrolled_students(self):
        total_enrolled_students=StudentCourseEnrollment.objects.filter(course=self).count()
        return total_enrolled_students

    def course_rating(self):
        course_rating=CourseRating.objects.filter(course=self).aggregate(avg_rating=models.Avg('rating'))
        return course_rating['avg_rating']
    
    def get_required_access_rank(self):
        """Get numeric rank for access level comparison"""
        ranks = {'free': 0, 'basic': 1, 'standard': 2, 'premium': 3}
        return ranks.get(self.required_access_level, 0)
    
    def can_be_accessed_by_level(self, access_level):
        """Check if a given access level can access this course"""
        ranks = {'free': 0, 'basic': 1, 'standard': 2, 'premium': 3, 'unlimited': 4}
        required_rank = self.get_required_access_rank()
        user_rank = ranks.get(access_level, 0)
        return user_rank >= required_rank
    
    def __str__(self) :
        return self.title

class Chapter(models.Model):
    """Module - renamed from Chapter for clarity. Contains lessons."""
    course=models.ForeignKey(Course,null=True,on_delete=models.CASCADE,related_name='course_chapters')
    title=models.CharField(max_length=150,null=True)
    description=models.TextField()
    video=models.FileField(upload_to='chapter_videos/',null=True,blank=True)
    remarks=models.TextField(null=True,blank=True)
    order=models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural="4. Modules"
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.course.title} - {self.title}" if self.course else self.title

    def total_lessons(self):
        return self.module_lessons.count()


class ModuleLesson(models.Model):
    """Individual lesson content within a Module (Chapter)"""
    CONTENT_TYPE_CHOICES = [
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('pdf', 'PDF Document'),
        ('image', 'Image'),
    ]
    
    module = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='module_lessons')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    objectives = models.TextField(blank=True, null=True, help_text="What students will learn in this lesson (one per line)")
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='video')
    file = models.FileField(upload_to='lesson_content/', blank=True, null=True, max_length=500)
    youtube_url = models.URLField(max_length=500, blank=True, null=True, help_text="Optional YouTube video link for this lesson")
    duration_seconds = models.IntegerField(default=0)  # For video/audio
    order = models.PositiveIntegerField(default=0)
    is_preview = models.BooleanField(default=False, help_text="Allow non-enrolled users to preview this lesson")
    is_locked = models.BooleanField(default=True, help_text="Lesson locked until previous lessons completed")
    is_premium = models.BooleanField(default=False, help_text="Mark as premium content")
    required_access_level = models.CharField(max_length=20, choices=[
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ], default='free', help_text="Minimum subscription level required")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "4b. Module Lessons"
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.module.title} - {self.title}"
    
    def get_required_access_rank(self):
        """Get numeric rank for access level comparison"""
        ranks = {'free': 0, 'basic': 1, 'standard': 2, 'premium': 3}
        return ranks.get(self.required_access_level, 0)
    
    def can_be_accessed_by_level(self, access_level):
        """Check if a given access level can access this lesson"""
        ranks = {'free': 0, 'basic': 1, 'standard': 2, 'premium': 3, 'unlimited': 4}
        required_rank = self.get_required_access_rank()
        user_rank = ranks.get(access_level, 0)
        return user_rank >= required_rank

    @property
    def duration_formatted(self):
        """Get formatted duration for video/audio"""
        if self.duration_seconds <= 0:
            return "0:00"
        minutes = self.duration_seconds // 60
        seconds = self.duration_seconds % 60
        return f"{minutes}:{seconds:02d}"

    @property
    def file_size_formatted(self):
        """Get human-readable file size"""
        try:
            size = self.file.size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024:
                    return f"{size:.1f} {unit}"
                size /= 1024
            return f"{size:.1f} TB"
        except:
            return "Unknown"

    @property
    def objectives_list(self):
        """Return objectives as a list"""
        if not self.objectives:
            return []
        return [obj.strip() for obj in self.objectives.split('\n') if obj.strip()]


class LessonDownloadable(models.Model):
    """Downloadable resources for a lesson (PDFs, audio files, etc.)"""
    FILE_TYPE_CHOICES = [
        ('pdf', 'PDF Document'),
        ('sheet_music', 'Sheet Music'),
        ('audio_slow', 'Audio - Slow Version'),
        ('audio_fast', 'Audio - Fast Version'),
        ('audio_playalong', 'Audio - Play Along'),
        ('worksheet', 'Worksheet'),
        ('other', 'Other'),
    ]
    
    lesson = models.ForeignKey(ModuleLesson, on_delete=models.CASCADE, related_name='downloadables')
    title = models.CharField(max_length=200)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default='pdf')
    file = models.FileField(upload_to='lesson_downloadables/')
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    download_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "4b2. Lesson Downloadables"
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.lesson.title} - {self.title}"

    @property
    def file_size(self):
        """Get file size in bytes"""
        try:
            return self.file.size
        except:
            return 0

    @property
    def file_size_formatted(self):
        """Get human-readable file size"""
        try:
            size = self.file.size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024:
                    return f"{size:.1f} {unit}"
                size /= 1024
            return f"{size:.1f} TB"
        except:
            return "Unknown"

    @property
    def file_extension(self):
        """Get file extension"""
        if self.file:
            return self.file.name.split('.')[-1].upper()
        return "FILE"

    def get_file_type_icon(self):
        """Return icon class based on file type"""
        icons = {
            'pdf': 'bi-file-pdf-fill',
            'sheet_music': 'bi-music-note-list',
            'audio_slow': 'bi-soundwave',
            'audio_fast': 'bi-lightning-fill',
            'audio_playalong': 'bi-headphones',
            'worksheet': 'bi-file-earmark-text-fill',
            'other': 'bi-file-earmark-fill',
        }
        return icons.get(self.file_type, 'bi-file-earmark-fill')


class ModuleLessonProgress(models.Model):
    """Tracks individual lesson progress within a module"""
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='module_lesson_progress')
    lesson = models.ForeignKey(ModuleLesson, on_delete=models.CASCADE, related_name='student_progress')
    is_completed = models.BooleanField(default=False)
    last_position_seconds = models.IntegerField(default=0)  # For video/audio resume
    viewed_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "4c. Module Lesson Progress"
        unique_together = ['student', 'lesson']

    def __str__(self):
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.student.fullname} - {self.lesson.title} - {status}"


class ModuleProgress(models.Model):
    """Tracks module (chapter) completion for a student"""
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='module_progress')
    module = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='student_module_progress')
    is_completed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "4d. Module Progress"
        unique_together = ['student', 'module']

    def __str__(self):
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.student.fullname} - {self.module.title} - {status}"

    def check_completion(self):
        """Mark module as complete if all lessons are completed"""
        from django.utils import timezone
        total_lessons = self.module.module_lessons.count()
        if total_lessons == 0:
            return
        completed_lessons = ModuleLessonProgress.objects.filter(
            student=self.student,
            lesson__module=self.module,
            is_completed=True
        ).count()
        if completed_lessons >= total_lessons:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save()


class Student(models.Model):
    fullname=models.CharField(max_length=100)
    email=models.CharField(max_length=100,unique=True)
    password=models.CharField(max_length=100,null=True,blank=True)
    is_verified=models.BooleanField(default=False)
    username=models.CharField(max_length=500)
    interseted_categories=models.TextField()
    profile_img=models.ImageField(upload_to='student_profile_imgs/',null=True)
    date_of_birth=models.DateField(null=True, blank=True)
    parent_account_required=models.BooleanField(default=False)
    parent_linked_at=models.DateTimeField(null=True, blank=True)

    def __str__(self) :
        return self.fullname

    def enrolled_courses(self):
        enrolled_courses=StudentCourseEnrollment.objects.filter(student=self).count()
        return enrolled_courses

    def favorite_courses(self):
        favorite_courses=StudentFavoriteCourse.objects.filter(student=self).count()
        return favorite_courses

    def is_minor(self):
        if not self.date_of_birth:
            return False
        from django.utils import timezone
        today = timezone.now().date()
        age = today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
        return age < 18

    def has_approved_parent_with_policies(self):
        """Check if minor has an approved parent link AND parent has accepted
        all required policies (TOS + Child Safety)."""
        if not self.is_minor():
            return True  # Non-minors don't need parent approval

        approved_link = StudentParentLink.objects.filter(
            student=self, status='approved'
        ).select_related('parent').first()
        if not approved_link:
            return False

        # Check parent has accepted all required policies
        required_count = PolicyDocument.objects.filter(
            is_active=True,
            policy_type__in=['child_safety', 'terms_of_service']
        ).count()
        if required_count == 0:
            return True  # No policies defined yet

        accepted_count = ParentPolicyAcceptance.objects.filter(
            parent=approved_link.parent,
            policy__is_active=True,
            policy__policy_type__in=['child_safety', 'terms_of_service']
        ).count()
        return accepted_count >= required_count

    def can_send_messages(self):
        """Minor students cannot send messages unless they have an approved parent
        who has accepted all required policies."""
        if not self.is_minor():
            return True
        return self.has_approved_parent_with_policies()

    class Meta:
        verbose_name_plural="5. Students"

class StudentCourseEnrollment(models.Model):
    """
    Track student course enrollments with subscription linkage.
    Ensures enrollment is tied to valid subscription for access control.
    """
    course=models.ForeignKey(Course,null=True,on_delete=models.CASCADE,related_name='enrolled_courses')
    student=models.ForeignKey(Student,null=True,on_delete=models.CASCADE,related_name='enrolled_student')
    subscription=models.ForeignKey('Subscription', null=True, blank=True, on_delete=models.SET_NULL, 
                                    related_name='enrollments',
                                    help_text="Subscription used for this enrollment")
    enrolled_time=models.DateTimeField(auto_now_add=True)
    
    # Access tracking
    is_active=models.BooleanField(default=True, help_text="Whether enrollment is currently active")
    completed_at=models.DateTimeField(null=True, blank=True, help_text="When course was completed")
    last_accessed=models.DateTimeField(null=True, blank=True, help_text="Last time student accessed the course")
    progress_percent=models.IntegerField(default=0, help_text="Overall course completion percentage")

    class Meta:
         verbose_name_plural="6. Enrolled Courses"
         unique_together = ['course', 'student']

    def __str__(self) :
        return f"{self.course}-{self.student}"
    
    def update_progress(self):
        """Calculate and update progress percentage based on completed lessons"""
        if not self.course:
            return 0
        
        total_lessons = ModuleLesson.objects.filter(module__course=self.course).count()
        if total_lessons == 0:
            return 0
        
        completed_lessons = ModuleLessonProgress.objects.filter(
            student=self.student,
            lesson__module__course=self.course,
            is_completed=True
        ).count()
        
        self.progress_percent = int((completed_lessons / total_lessons) * 100)
        self.save(update_fields=['progress_percent'])
        return self.progress_percent
    
    def check_subscription_validity(self):
        """Check if the associated subscription is still valid for this enrollment"""
        if not self.subscription:
            return False, "No subscription linked to enrollment"
        
        if not self.subscription.is_active_and_paid():
            return False, "Subscription is no longer active"
        
        return True, "Subscription valid"
    
    def mark_completed(self):
        """Mark the course as completed"""
        from django.utils import timezone
        self.completed_at = timezone.now()
        self.progress_percent = 100
        self.save(update_fields=['completed_at', 'progress_percent'])
    
    def record_access(self):
        """Record course access time"""
        from django.utils import timezone
        self.last_accessed = timezone.now()
        self.save(update_fields=['last_accessed'])


class ParentAccount(models.Model):
    fullname = models.CharField(max_length=100)
    email = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=100, null=True, blank=True)
    mobile_no = models.CharField(max_length=20, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=64, null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
         verbose_name_plural = "6a. Parent Accounts"

    def __str__(self):
        return f"{self.fullname} ({self.email})"


class StudentParentLink(models.Model):
    RELATIONSHIP_CHOICES = [
        ('mother', 'Mother'),
        ('father', 'Father'),
        ('guardian', 'Guardian'),
        ('other', 'Other'),
    ]

    LINK_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('revoked', 'Revoked'),
    ]

    AUTHORIZATION_MODE_CHOICES = [
        ('pre_authorized', 'Pre-authorized Multiple Sessions'),
        ('per_session_login', 'Parental Login Each Session'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parent_links')
    parent = models.ForeignKey(ParentAccount, on_delete=models.CASCADE, related_name='student_links')
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES, default='guardian')
    status = models.CharField(max_length=20, choices=LINK_STATUS_CHOICES, default='pending')
    authorization_mode = models.CharField(max_length=30, choices=AUTHORIZATION_MODE_CHOICES, default='pre_authorized')
    approved_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
         verbose_name_plural = "6b. Student Parent Links"
         unique_together = ['student', 'parent']

    def __str__(self):
        return f"{self.student.fullname} ↔ {self.parent.fullname} ({self.status})"


class ParentalConsent(models.Model):
    CONSENT_TYPE_CHOICES = [
        ('account_activation', 'Account Activation Consent'),
        ('live_sessions', 'Live Sessions Consent'),
        ('messaging', 'Messaging Consent'),
    ]

    CONSENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('revoked', 'Revoked'),
        ('expired', 'Expired'),
    ]

    parent_link = models.ForeignKey(StudentParentLink, on_delete=models.CASCADE, related_name='consents')
    consent_type = models.CharField(max_length=30, choices=CONSENT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=CONSENT_STATUS_CHOICES, default='pending')
    approved_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
         verbose_name_plural = "6c. Parental Consents"
         unique_together = ['parent_link', 'consent_type']

    def __str__(self):
        return f"{self.parent_link.student.fullname} - {self.consent_type} ({self.status})"


class SessionAuthorization(models.Model):
    AUTH_STATUS_CHOICES = [
        ('approved', 'Approved'),
        ('revoked', 'Revoked'),
    ]

    parent_link = models.ForeignKey(StudentParentLink, on_delete=models.CASCADE, related_name='session_authorizations')
    consent = models.ForeignKey(ParentalConsent, on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='session_authorizations')
    session = models.ForeignKey('TeacherSession', on_delete=models.CASCADE, related_name='parent_authorizations')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='session_parent_authorizations')
    status = models.CharField(max_length=20, choices=AUTH_STATUS_CHOICES, default='approved')
    approved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
         verbose_name_plural = "6d. Session Authorizations"
         unique_together = ['parent_link', 'session']

    def __str__(self):
        return f"{self.student.fullname} - Session {self.session_id} ({self.status})"

class CourseRating(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE,null=True)
    student=models.ForeignKey(Student,on_delete=models.CASCADE,null=True)
    rating=models.PositiveBigIntegerField(default=0)
    reviews=models.TextField(null=True)
    review_time=models.DateTimeField(auto_now_add=True)

    class Meta:
         verbose_name_plural="7. Course Ratings"

    def __str__(self):
        return f"{self.course}-{self.student}-{self.rating}"

class StudentFavoriteCourse(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    student=models.ForeignKey(Student,on_delete=models.CASCADE)
    status=models.BooleanField(default=False)

    class Meta:
         verbose_name_plural="8. Student Favorite Course"

class StudyMaterial(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    title=models.CharField(max_length=150)
    description=models.TextField()
    upload=models.FileField(upload_to='study_materials/',null=True)
    remarks=models.TextField(null=True)

    class Meta:
         verbose_name_plural="15. Course Materials"

class Faq(models.Model):
    question=models.CharField(max_length=300)
    answer=models.TextField()

    class Meta:
         verbose_name_plural="16. FAQ "


# ==================== ADMIN DASHBOARD MODELS ====================

class Admin(models.Model):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('school_admin', 'School Admin'),
        ('content_admin', 'Content Admin'),
        ('support_admin', 'Support Admin'),
    ]
    
    full_name = models.CharField(max_length=100)
    email = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='school_admin')
    profile_img = models.ImageField(upload_to='admin_profile_imgs/', null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "18. Admins"

    def __str__(self):
        return f"{self.full_name} ({self.role})"

    def total_managed_schools(self):
        return School.objects.filter(admin=self).count()


class PolicyDocument(models.Model):
    POLICY_TYPE_CHOICES = [
        ('terms_of_service', 'Terms of Service'),
        ('child_safety', 'Child Safety Policy'),
        ('code_of_conduct', 'Code of Conduct'),
        ('background_check_consent', 'Background Check Consent'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    policy_type = models.CharField(max_length=40, choices=POLICY_TYPE_CHOICES)
    version = models.CharField(max_length=20, default='1.0')
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    effective_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "18a. Policy Documents"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} (v{self.version})"


class TeacherVerification(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    teacher = models.OneToOneField(Teacher, on_delete=models.CASCADE, related_name='verification')
    id_verification_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    background_check_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    agreement_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    overall_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(Admin, null=True, blank=True, on_delete=models.SET_NULL,
                                    related_name='reviewed_teacher_verifications')
    rejection_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "18b. Teacher Verifications"
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.teacher.full_name} - {self.overall_status}"

    def recalculate_status(self):
        # Check background check expiration first
        self._check_background_expiration()

        statuses = [self.id_verification_status, self.background_check_status, self.agreement_status]
        if any(status == 'expired' for status in statuses):
            self.overall_status = 'expired'
            teacher_status = 'expired'
            can_teach_minors = False
        elif any(status == 'rejected' for status in statuses):
            self.overall_status = 'rejected'
            teacher_status = 'rejected'
            can_teach_minors = False
        elif all(status == 'approved' for status in statuses):
            self.overall_status = 'approved'
            teacher_status = 'verified'
            can_teach_minors = True
        elif any(status in ['in_review', 'approved'] for status in statuses):
            self.overall_status = 'in_review'
            teacher_status = 'in_review'
            can_teach_minors = False
        else:
            self.overall_status = 'pending'
            teacher_status = 'unverified'
            can_teach_minors = False

        self.save(update_fields=['overall_status', 'updated_at'])
        Teacher.objects.filter(id=self.teacher_id).update(
            verification_status=teacher_status,
            can_teach_minors=can_teach_minors,
        )

    def _check_background_expiration(self):
        """Auto-expire background check if 12 months have passed since approval."""
        from django.utils import timezone
        try:
            bg = self.background_check
        except TeacherBackgroundCheck.DoesNotExist:
            return
        if bg.status == 'approved' and bg.expires_at and bg.expires_at <= timezone.now():
            bg.status = 'expired'
            bg.save(update_fields=['status', 'updated_at'])
            self.background_check_status = 'expired'
            self.save(update_fields=['background_check_status', 'updated_at'])


class TeacherIDVerification(models.Model):
    STATUS_CHOICES = TeacherVerification.STATUS_CHOICES

    verification = models.OneToOneField(TeacherVerification, on_delete=models.CASCADE, related_name='id_verification')
    id_document = models.FileField(upload_to='teacher_verification/id_docs/', null=True, blank=True)
    document_type = models.CharField(max_length=60, default='government_id')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(Admin, null=True, blank=True, on_delete=models.SET_NULL,
                                    related_name='reviewed_id_verifications')
    review_notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "18c. Teacher ID Verifications"
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.verification.teacher.full_name} - ID {self.status}"


class TeacherBackgroundCheck(models.Model):
    STATUS_CHOICES = TeacherVerification.STATUS_CHOICES
    EXPIRATION_MONTHS = 12  # Background checks expire after 12 months

    verification = models.OneToOneField(TeacherVerification, on_delete=models.CASCADE, related_name='background_check')
    provider_name = models.CharField(max_length=120, null=True, blank=True)
    reference_number = models.CharField(max_length=120, null=True, blank=True)
    confirmation_email = models.EmailField(null=True, blank=True)
    evidence_file = models.FileField(upload_to='teacher_verification/background_checks/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    expires_at = models.DateTimeField(null=True, blank=True,
                                       help_text='Auto-set to 12 months after approval. Teacher locked when expired.')
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(Admin, null=True, blank=True, on_delete=models.SET_NULL,
                                    related_name='reviewed_background_checks')
    review_notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "18d. Teacher Background Checks"
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.verification.teacher.full_name} - Background {self.status}"

    def is_expired(self):
        from django.utils import timezone
        if self.status == 'expired':
            return True
        if self.status == 'approved' and self.expires_at and self.expires_at <= timezone.now():
            return True
        return False

    def set_expiration_on_approval(self):
        """Set expires_at to 12 months from now when approved."""
        from django.utils import timezone
        import datetime
        self.expires_at = timezone.now() + datetime.timedelta(days=self.EXPIRATION_MONTHS * 30)

    def days_until_expiry(self):
        from django.utils import timezone
        if not self.expires_at:
            return None
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)


class TeacherAgreementSignature(models.Model):
    STATUS_CHOICES = TeacherVerification.STATUS_CHOICES

    verification = models.ForeignKey(TeacherVerification, on_delete=models.CASCADE, related_name='agreement_signatures')
    policy_document = models.ForeignKey(PolicyDocument, null=True, blank=True, on_delete=models.SET_NULL,
                                        related_name='teacher_signatures')
    agreement_type = models.CharField(max_length=40, choices=PolicyDocument.POLICY_TYPE_CHOICES)
    policy_version = models.CharField(max_length=20, default='1.0')
    signature_text = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    signed_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(Admin, null=True, blank=True, on_delete=models.SET_NULL,
                                    related_name='reviewed_agreement_signatures')
    review_notes = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "18e. Teacher Agreement Signatures"
        ordering = ['-signed_at']

    def __str__(self):
        return f"{self.verification.teacher.full_name} - {self.agreement_type} ({self.status})"


class School(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('trial', 'Trial'),
    ]
    
    name = models.CharField(max_length=200)
    email = models.CharField(max_length=100, unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, default='India')
    logo = models.ImageField(upload_to='school_logos/', null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_schools')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    max_teachers = models.IntegerField(default=10)
    max_students = models.IntegerField(default=100)
    max_courses = models.IntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "19. Schools"

    def __str__(self):
        return self.name

    def total_teachers(self):
        return SchoolTeacher.objects.filter(school=self).count()

    def total_students(self):
        return SchoolStudent.objects.filter(school=self).count()

    def total_courses(self):
        return SchoolCourse.objects.filter(school=self).count()


class SchoolTeacher(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='school_teachers')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='teacher_schools')
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "20. School Teachers"
        unique_together = ['school', 'teacher']


class SchoolStudent(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='school_students')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_schools')
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "21. School Students"
        unique_together = ['school', 'student']


class SchoolCourse(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='school_courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_schools')
    is_featured = models.BooleanField(default=False)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "22. School Courses"
        unique_together = ['school', 'course']

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('message', 'Message Sent'),
        ('submission', 'Assignment Submission'),
        ('session_join', 'Session Join'),
        ('session_leave', 'Session Leave'),
        ('session_start', 'Session Start'),
        ('session_end', 'Session End'),
    ]
    
    admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True)
    parent = models.ForeignKey(ParentAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "24. Activity Logs"
        ordering = ['-created_at']

    def __str__(self):
        user = self.admin or self.teacher or self.student
        return f"{user} - {self.action} - {self.created_at}"


class SystemSettings(models.Model):
    site_name = models.CharField(max_length=200, default='Kannari Music Academy')
    site_logo = models.ImageField(upload_to='system/', null=True, blank=True)
    favicon = models.ImageField(upload_to='system/', null=True, blank=True)
    contact_email = models.EmailField(default='admin@kannarimusicacademy.com')
    contact_phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    maintenance_mode = models.BooleanField(default=False)
    allow_registration = models.BooleanField(default=True)
    default_language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "25. System Settings"

    def __str__(self):
        return self.site_name



# ==================== ENHANCED STUDENT DASHBOARD MODELS ====================


class WeeklyGoal(models.Model):
    """Student's weekly learning goals"""
    GOAL_TYPE_CHOICES = [
        ('lessons', 'Complete Lessons'),
        ('minutes', 'Study Minutes'),
        ('courses', 'Complete Courses'),
        ('quizzes', 'Pass Quizzes'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='weekly_goals')
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPE_CHOICES, default='lessons')
    target_value = models.IntegerField(default=5)
    current_value = models.IntegerField(default=0)
    week_start = models.DateField()
    week_end = models.DateField()
    is_achieved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "29. Weekly Goals"
        ordering = ['-week_start']

    def __str__(self):
        return f"{self.student.fullname} - {self.goal_type}: {self.current_value}/{self.target_value}"

    def calculate_current_value(self):
        """Calculate current value based on actual progress in this week"""
        from django.db.models import Sum, Q
        from django.utils import timezone
        
        if self.goal_type == 'lessons':
            # Count completed lessons this week (by completed_at date)
            completed_lessons = LessonProgress.objects.filter(
                student=self.student,
                completed_at__date__gte=self.week_start,
                completed_at__date__lte=self.week_end
            ).count()
            
            # If no lessons completed by exact date, count lessons updated/worked on this week
            if completed_lessons == 0:
                completed_lessons = LessonProgress.objects.filter(
                    student=self.student,
                    updated_at__date__gte=self.week_start,
                    updated_at__date__lte=self.week_end,
                    is_completed=True
                ).count()
            
            # If still no lessons (no LessonProgress records), count chapters in courses 
            # that were COMPLETED this week (use completed_at timestamp)
            if completed_lessons == 0:
                completed_courses_this_week = CourseProgress.objects.filter(
                    student=self.student,
                    is_completed=True,
                    completed_at__date__gte=self.week_start,
                    completed_at__date__lte=self.week_end
                )
                # Count all chapters from courses completed THIS WEEK
                for cp in completed_courses_this_week:
                    completed_lessons += cp.total_chapters
            
            return completed_lessons
        
        elif self.goal_type == 'minutes':
            # Calculate total study minutes this week
            total_seconds = LessonProgress.objects.filter(
                student=self.student,
                updated_at__date__gte=self.week_start,
                updated_at__date__lte=self.week_end
            ).aggregate(total=Sum('time_spent_seconds'))['total'] or 0
            
            # If no lesson progress, check CourseProgress for this week
            if total_seconds == 0:
                total_seconds = CourseProgress.objects.filter(
                    student=self.student,
                    last_accessed__date__gte=self.week_start,
                    last_accessed__date__lte=self.week_end
                ).aggregate(total=Sum('total_time_spent_seconds'))['total'] or 0
            
            return total_seconds // 60  # Convert to minutes
        
        elif self.goal_type == 'courses':
            # Count completed courses this week
            completed_courses = CourseProgress.objects.filter(
                student=self.student,
                completed_at__date__gte=self.week_start,
                completed_at__date__lte=self.week_end,
                is_completed=True
            ).count()
            return completed_courses
        
        elif self.goal_type == 'quizzes':
            # Count passed quizzes this week
            from main.models import AttemptQuiz
            passed_quizzes = AttemptQuiz.objects.filter(
                student=self.student,
                created_at__date__gte=self.week_start,
                created_at__date__lte=self.week_end,
                is_passed=True
            ).values('quiz').distinct().count()
            return passed_quizzes
        
        return 0

    def update_current_value(self):
        """Update and save the current value based on actual progress"""
        self.current_value = self.calculate_current_value()
        self.check_achievement()
        self.save()

    def check_achievement(self):
        if self.current_value >= self.target_value:
            self.is_achieved = True
            self.save()
        return self.is_achieved

    def progress_percentage(self):
        if self.target_value == 0:
            return 0
        return min(100, int((self.current_value / self.target_value) * 100))


class LessonProgress(models.Model):
    """Tracks individual lesson/chapter completion for a student"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='lesson_progress')
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='student_progress')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lesson_progress')
    is_completed = models.BooleanField(default=False)
    progress_percentage = models.IntegerField(default=0)  # 0-100
    time_spent_seconds = models.IntegerField(default=0)
    last_position_seconds = models.IntegerField(default=0)  # For video resume
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "30. Lesson Progress"
        unique_together = ['student', 'chapter']

    def __str__(self):
        return f"{self.student.fullname} - {self.chapter.title} - {self.progress_percentage}%"


class CourseProgress(models.Model):
    """Aggregated course progress for a student"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='course_progress')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='student_course_progress')
    enrollment = models.OneToOneField(StudentCourseEnrollment, on_delete=models.CASCADE, related_name='progress', null=True)
    total_chapters = models.IntegerField(default=0)
    completed_chapters = models.IntegerField(default=0)
    progress_percentage = models.IntegerField(default=0)
    total_time_spent_seconds = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "31. Course Progress"
        unique_together = ['student', 'course']

    def __str__(self):
        return f"{self.student.fullname} - {self.course.title} - {self.progress_percentage}%"

    def update_progress(self):
        from django.utils import timezone
        total = self.course.course_chapters.count()
        completed = LessonProgress.objects.filter(
            student=self.student,
            course=self.course,
            is_completed=True
        ).count()
        
        self.total_chapters = total
        self.completed_chapters = completed
        self.progress_percentage = int((completed / total) * 100) if total > 0 else 0
        
        # Update total time spent
        total_time = LessonProgress.objects.filter(
            student=self.student,
            course=self.course
        ).aggregate(total=models.Sum('time_spent_seconds'))['total'] or 0
        self.total_time_spent_seconds = total_time
        
        if self.progress_percentage == 100 and not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
        
        self.save()


class DailyLearningActivity(models.Model):
    """Tracks daily learning time and activity"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='daily_activities')
    date = models.DateField()
    total_time_seconds = models.IntegerField(default=0)
    lessons_completed = models.IntegerField(default=0)
    quizzes_attempted = models.IntegerField(default=0)
    courses_accessed = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "32. Daily Learning Activities"
        unique_together = ['student', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.fullname} - {self.date} - {self.total_time_seconds // 60} mins"

    @property
    def time_in_minutes(self):
        return self.total_time_seconds // 60


class Achievement(models.Model):
    """Gamification achievements/badges"""
    ACHIEVEMENT_TYPE_CHOICES = [
        ('completion', 'Course Completion'),
        ('quiz_master', 'Quiz Master'),
        ('time_spent', 'Time Spent'),
        ('first_steps', 'First Steps'),
        ('social', 'Social Achievement'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.ImageField(upload_to='achievements/', null=True, blank=True)
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPE_CHOICES)
    requirement_value = models.IntegerField(default=1)  # e.g., 1 course for completion
    points = models.IntegerField(default=10)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "36. Achievements"

    def __str__(self):
        return self.name


class StudentAchievement(models.Model):
    """Achievements earned by students"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='earned_by')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "37. Student Achievements"
        unique_together = ['student', 'achievement']

    def __str__(self):
        return f"{self.student.fullname} - {self.achievement.name}"


# ==================== ENHANCED TEACHER DASHBOARD MODELS ====================

class TeacherStudent(models.Model):
    """Direct teacher-student relationship for the new dashboard"""
    INSTRUMENT_CHOICES = [
        ('piano', 'Piano'),
        ('guitar', 'Guitar'),
        ('violin', 'Violin'),
        ('voice', 'Voice'),
        ('drums', 'Drums'),
        ('flute', 'Flute'),
        ('saxophone', 'Saxophone'),
        ('other', 'Other'),
    ]
    
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('warning', 'Warning'),
    ]
    
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='assigned_students')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assigned_teachers')
    instrument = models.CharField(max_length=20, choices=INSTRUMENT_CHOICES, default='piano')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    progress_percentage = models.IntegerField(default=0)
    lessons_assigned_this_month = models.IntegerField(default=0)
    last_active = models.DateTimeField(auto_now=True)
    notes = models.TextField(null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "39. Teacher Students"
        unique_together = ['teacher', 'student']
        ordering = ['-last_active']

    def __str__(self):
        return f"{self.teacher.full_name} - {self.student.fullname}"

    def update_status(self):
        """Auto-update status based on last activity"""
        from datetime import timedelta
        from django.utils import timezone
        
        now = timezone.now()
        days_inactive = (now - self.last_active).days
        
        if days_inactive > 14:
            self.status = 'inactive'
        elif days_inactive > 7:
            self.status = 'warning'
        else:
            self.status = 'active'
        self.save()


class TeacherSession(models.Model):
    """Teaching sessions/appointments for teacher dashboard"""
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    SESSION_TYPE_CHOICES = [
        ('video_call', 'Video Call'),
        ('audio_call', 'Audio Call'),
        ('in_person', 'In Person'),
    ]
    
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='teaching_sessions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='learning_sessions')
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.IntegerField(default=60)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    meeting_link = models.URLField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    # Live video session fields
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='video_call')
    room_name = models.CharField(max_length=200, null=True, blank=True, unique=True,
                                  help_text="Auto-generated unique room name for Jitsi")
    is_live = models.BooleanField(default=False, help_text="Whether the session is currently live")
    started_at = models.DateTimeField(null=True, blank=True, help_text="When teacher started the live session")
    ended_at = models.DateTimeField(null=True, blank=True, help_text="When the session ended")
    recording_url = models.URLField(null=True, blank=True, help_text="URL to session recording if any")
    recording_enabled = models.BooleanField(default=True, help_text="Enable safety recording/logging for this session")
    has_minor_participant = models.BooleanField(default=False, help_text="True if session student is a minor")
    requires_parental_approval = models.BooleanField(default=False, help_text="Derived from minor participant")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "40. Teacher Sessions"
        ordering = ['scheduled_date', 'scheduled_time']

    def __str__(self):
        return f"{self.teacher.full_name} - {self.student.fullname} - {self.scheduled_date}"

    def save(self, *args, **kwargs):
        """Auto-generate room_name and meeting_link on creation"""
        self.has_minor_participant = self.student.is_minor() if self.student_id else False
        self.requires_parental_approval = self.has_minor_participant
        if not self.room_name:
            import uuid
            self.room_name = f"kannari-{self.pk or 'new'}-{uuid.uuid4().hex[:8]}"
        if not self.meeting_link and self.session_type in ('video_call', 'audio_call'):
            self.meeting_link = f"https://meet.jit.si/{self.room_name}"
        super().save(*args, **kwargs)
        # Fix room_name if it was created with 'new' placeholder
        if 'new' in (self.room_name or ''):
            import uuid
            self.room_name = f"kannari-{self.pk}-{uuid.uuid4().hex[:8]}"
            self.meeting_link = f"https://meet.jit.si/{self.room_name}"
            super().save(update_fields=['room_name', 'meeting_link'])

    def go_live(self):
        """Teacher starts the live session"""
        from django.utils import timezone
        self.is_live = True
        self.started_at = timezone.now()
        self.status = 'confirmed'
        self.save(update_fields=['is_live', 'started_at', 'status', 'updated_at'])

    def end_session(self):
        """Teacher ends the live session"""
        from django.utils import timezone
        self.is_live = False
        self.ended_at = timezone.now()
        self.status = 'completed'
        self.save(update_fields=['is_live', 'ended_at', 'status', 'updated_at'])

    @property
    def actual_duration_minutes(self):
        """Calculate actual duration if session has started and ended"""
        if self.started_at and self.ended_at:
            delta = self.ended_at - self.started_at
            return int(delta.total_seconds() / 60)
        return 0


class TeacherActivity(models.Model):
    """Activity feed for teacher dashboard"""
    ACTIVITY_TYPES = [
        ('lesson_completed', 'Completed Lesson'),
        ('assignment_submitted', 'Submitted Assignment'),
        ('course_started', 'Started Course'),
        ('comment_added', 'Added Comment'),
        ('material_downloaded', 'Downloaded Material'),
        ('session_attended', 'Attended Session'),
    ]
    
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='activity_feed')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='teacher_activities')
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    target_name = models.CharField(max_length=200)  # Name of lesson/course/assignment
    target_id = models.IntegerField(null=True, blank=True)
    target_type = models.CharField(max_length=50, null=True, blank=True)  # 'course', 'chapter', 'quiz', etc.
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "41. Teacher Activities"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.fullname} - {self.activity_type} - {self.target_name}"

    @property
    def time_ago(self):
        """Get human-readable time ago"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - self.created_at
        
        if diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff < timedelta(days=2):
            return "Yesterday"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"
        else:
            return self.created_at.strftime("%b %d, %Y")


class Lesson(models.Model):
    """Enhanced lesson model for lesson library"""
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='lessons')
    category = models.ForeignKey(CourseCategory, on_delete=models.SET_NULL, null=True, related_name='lessons')
    title = models.CharField(max_length=200)
    description = models.TextField()
    featured_img = models.ImageField(upload_to='lesson_imgs/', null=True, blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    duration_minutes = models.IntegerField(default=0)  # Total duration in minutes
    module_count = models.IntegerField(default=1)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "42. Lessons"
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def duration_formatted(self):
        """Get formatted duration"""
        hours = self.duration_minutes // 60
        minutes = self.duration_minutes % 60
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"


class LessonMaterial(models.Model):
    """Materials/files for lessons"""
    MATERIAL_TYPES = [
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('pdf', 'PDF Document'),
        ('image', 'Image'),
        ('other', 'Other'),
    ]
    
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=200)
    material_type = models.CharField(max_length=20, choices=MATERIAL_TYPES, default='video')
    file = models.FileField(upload_to='lesson_materials/')
    file_size = models.BigIntegerField(default=0)  # Size in bytes
    duration_seconds = models.IntegerField(default=0)  # For video/audio
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "43. Lesson Materials"
        ordering = ['order']

    def __str__(self):
        return f"{self.lesson.title} - {self.title}"

    @property
    def file_size_formatted(self):
        """Get human-readable file size"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class TeacherDashboardMetrics(models.Model):
    """Cached metrics for teacher dashboard performance"""
    teacher = models.OneToOneField(Teacher, on_delete=models.CASCADE, related_name='dashboard_metrics')
    total_students = models.IntegerField(default=0)
    active_lessons = models.IntegerField(default=0)
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    # Trend data
    students_change_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    lessons_change_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    completion_change_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    last_calculated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "45. Teacher Dashboard Metrics"

    def __str__(self):
        return f"{self.teacher.full_name} - Metrics"

    def calculate_metrics(self):
        """Recalculate all metrics"""
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Avg
        
        now = timezone.now()
        last_month = now - timedelta(days=30)
        last_week = now - timedelta(days=7)
        
        # Total students (via TeacherStudent relationship)
        current_students = TeacherStudent.objects.filter(teacher=self.teacher).count()
        previous_students = TeacherStudent.objects.filter(
            teacher=self.teacher,
            assigned_at__lte=last_month
        ).count()
        
        self.total_students = current_students
        if previous_students > 0:
            self.students_change_percent = ((current_students - previous_students) / previous_students) * 100
        else:
            self.students_change_percent = 100 if current_students > 0 else 0
        
        # Active lessons
        current_lessons = Lesson.objects.filter(teacher=self.teacher, is_published=True).count()
        new_lessons_this_week = Lesson.objects.filter(
            teacher=self.teacher,
            created_at__gte=last_week
        ).count()
        
        self.active_lessons = current_lessons
        if current_lessons > 0:
            self.lessons_change_percent = (new_lessons_this_week / current_lessons) * 100
        else:
            self.lessons_change_percent = 0
        
        # Completion rate
        total_assignments = LessonAssignment.objects.filter(teacher=self.teacher).count()
        completed_assignments = LessonAssignment.objects.filter(
            teacher=self.teacher,
            is_completed=True
        ).count()
        
        if total_assignments > 0:
            self.completion_rate = (completed_assignments / total_assignments) * 100
        else:
            self.completion_rate = 0
        
        # Previous completion rate for trend
        prev_total = LessonAssignment.objects.filter(
            teacher=self.teacher,
            assigned_at__lte=last_month
        ).count()
        prev_completed = LessonAssignment.objects.filter(
            teacher=self.teacher,
            is_completed=True,
            completed_at__lte=last_month
        ).count()
        
        if prev_total > 0:
            prev_rate = (prev_completed / prev_total) * 100
            self.completion_change_percent = float(self.completion_rate) - prev_rate
        else:
            self.completion_change_percent = 0
        
        self.save()


# ==================== SUBSCRIPTIONS MANAGEMENT ====================

class SubscriptionPlan(models.Model):
    """Subscription plan definitions with access control"""
    DURATION_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('semi_annual', 'Semi-Annual'),
        ('annual', 'Annual'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]
    
    ACCESS_LEVEL_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
        ('unlimited', 'Unlimited'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    duration = models.CharField(max_length=20, choices=DURATION_CHOICES, default='monthly')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Access Level - defines the tier of access
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVEL_CHOICES, default='basic',
                                     help_text="Access tier: free < basic < standard < premium < unlimited")
    
    # Course and Lesson limits
    max_courses = models.IntegerField(default=10, help_text="Maximum courses students can enroll in")
    max_lessons = models.IntegerField(default=100, help_text="Maximum lessons they can access")
    lessons_per_week = models.IntegerField(null=True, blank=True, help_text="Max lessons per week (None = unlimited)")
    lessons_per_day = models.IntegerField(null=True, blank=True, help_text="Max lessons per day (None = unlimited)")
    
    # Teacher access - which teachers' courses are included in this plan
    allowed_teachers = models.ManyToManyField(Teacher, blank=True, related_name='subscription_plans',
                                               help_text="Teachers whose courses are accessible with this plan. Empty = all teachers.")
    
    # Category access - which course categories are included
    allowed_categories = models.ManyToManyField(CourseCategory, blank=True, related_name='subscription_plans',
                                                 help_text="Categories accessible with this plan. Empty = all categories.")
    
    # Content access controls
    can_download = models.BooleanField(default=False, help_text="Can download lesson materials")
    can_access_live_sessions = models.BooleanField(default=False, help_text="Can access live teaching sessions")
    max_live_sessions_per_month = models.IntegerField(default=0, help_text="Max live video sessions per month (0 = none)")
    max_audio_messages_per_month = models.IntegerField(default=0, help_text="Max audio messages teacher can send per month (0 = none)")
    priority_support = models.BooleanField(default=False, help_text="Has priority customer support")
    
    features = models.TextField(null=True, blank=True, help_text="Comma-separated features")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "50. Subscription Plans"
        ordering = ['price']

    def __str__(self):
        return f"{self.name} ({self.duration}) - {self.access_level}"

    def get_features_list(self):
        """Return features as a list"""
        if not self.features:
            return []
        return [f.strip() for f in self.features.split(',') if f.strip()]

    def get_final_price(self):
        """Get final price (discount if available)"""
        return self.discount_price if self.discount_price else self.price
    
    def get_allowed_teacher_ids(self):
        """Return list of allowed teacher IDs, empty list means all teachers"""
        return list(self.allowed_teachers.values_list('id', flat=True))
    
    def get_allowed_category_ids(self):
        """Return list of allowed category IDs, empty list means all categories"""
        return list(self.allowed_categories.values_list('id', flat=True))
    
    def is_teacher_allowed(self, teacher_id):
        """Check if a specific teacher is allowed in this plan"""
        allowed_ids = self.get_allowed_teacher_ids()
        if not allowed_ids:  # Empty means all teachers allowed
            return True
        return teacher_id in allowed_ids
    
    def is_category_allowed(self, category_id):
        """Check if a specific category is allowed in this plan"""
        allowed_ids = self.get_allowed_category_ids()
        if not allowed_ids:  # Empty means all categories allowed
            return True
        return category_id in allowed_ids
    
    def get_access_level_rank(self):
        """Get numeric rank for access level comparison"""
        ranks = {'free': 0, 'basic': 1, 'standard': 2, 'premium': 3, 'unlimited': 4}
        return ranks.get(self.access_level, 0)


class Subscription(models.Model):
    """Student subscription records with access control"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('paused', 'Paused'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='subscriptions', null=True, blank=True)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Assigned Teacher - specific teacher assigned to this student's subscription
    assigned_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, 
                                          related_name='assigned_subscriptions',
                                          help_text="Primary teacher assigned to this subscription")
    
    # Pricing and payment
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateTimeField(null=True, blank=True)
    
    # Dates
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    last_reset_date = models.DateField(null=True, blank=True)
    last_daily_reset = models.DateField(null=True, blank=True, help_text="Last date daily lesson count was reset")
    last_weekly_reset = models.DateField(null=True, blank=True, help_text="Last date weekly lesson count was reset")
    activated_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    courses_accessed = models.IntegerField(default=0)
    lessons_accessed = models.IntegerField(default=0)
    lessons_used_this_month = models.IntegerField(default=0)
    lessons_used_today = models.IntegerField(default=0, help_text="Lessons accessed today")
    current_week_lessons = models.IntegerField(default=0, help_text="Lessons accessed in current week")
    live_sessions_used_this_month = models.IntegerField(default=0, help_text="Live sessions used this month")
    audio_messages_used_this_month = models.IntegerField(default=0, help_text="Audio messages sent this month")
    last_monthly_reset = models.DateField(null=True, blank=True, help_text="Last date monthly counters were reset")
    auto_renew = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "51. Subscriptions"
        ordering = ['-created_at']
        unique_together = ['student', 'plan', 'start_date']

    def __str__(self):
        plan_name = self.plan.name if self.plan else "No Plan"
        student_name = self.student.fullname if self.student else "No Student"
        return f"{student_name} - {plan_name} ({self.status})"

    def is_active_and_paid(self):
        """Check if subscription is currently active AND paid"""
        from django.utils import timezone
        today = timezone.now().date()
        if not self.start_date or not self.end_date:
            return False
        return (self.status == 'active' and 
                self.is_paid and
                self.start_date <= today <= self.end_date)
    
    def is_active(self):
        """Check if subscription is currently active (legacy compatibility)"""
        return self.is_active_and_paid()

    def days_remaining(self):
        """Calculate remaining days"""
        from django.utils import timezone
        if self.is_active_and_paid():
            return (self.end_date - timezone.now().date()).days
        return 0
    
    def reset_daily_limits(self):
        """Reset daily lesson count if needed"""
        from django.utils import timezone
        today = timezone.now().date()
        if self.last_daily_reset != today:
            self.lessons_used_today = 0
            self.last_daily_reset = today
            self.save(update_fields=['lessons_used_today', 'last_daily_reset'])
    
    def reset_weekly_limits(self):
        """Reset weekly lesson count if needed (resets on Monday)"""
        from django.utils import timezone
        today = timezone.now().date()
        # Get the Monday of the current week
        days_since_monday = today.weekday()
        current_monday = today - timezone.timedelta(days=days_since_monday)
        
        if not self.last_weekly_reset or self.last_weekly_reset < current_monday:
            self.current_week_lessons = 0
            self.last_weekly_reset = today
            self.save(update_fields=['current_week_lessons', 'last_weekly_reset'])
    
    def check_and_reset_limits(self):
        """Check and reset daily/weekly limits if needed"""
        self.reset_daily_limits()
        self.reset_weekly_limits()

    def can_access_course(self, course=None):
        """Check if student can access/enroll in a course"""
        if not self.plan or not self.is_active_and_paid():
            return False, "No active subscription"
        
        # Check if courses limit reached
        if self.courses_accessed >= self.plan.max_courses:
            return False, f"Course limit reached - Your plan allows {self.plan.max_courses} courses"
        
        if course:
            # Check if course's teacher is allowed
            if not self.plan.is_teacher_allowed(course.teacher_id):
                allowed_teachers = self.plan.get_allowed_teacher_ids()
                if allowed_teachers:
                    teacher_names = list(self.plan.allowed_teachers.values_list('full_name', flat=True))
                    return False, f"This course is taught by {course.teacher.full_name}, but your plan only allows courses from: {', '.join(teacher_names)}"
                return False, "This teacher's courses are not included in your plan"
            
            # Check if course's category is allowed
            if not self.plan.is_category_allowed(course.category_id):
                allowed_cats = self.plan.get_allowed_category_ids()
                if allowed_cats:
                    cat_names = list(self.plan.allowed_categories.values_list('title', flat=True))
                    return False, f"This course is in '{course.category.title}' category, but your plan includes: {', '.join(cat_names)}"
                return False, "This category is not included in your plan"
            
            # If assigned teacher is set, only allow their courses
            if self.assigned_teacher and course.teacher_id != self.assigned_teacher_id:
                return False, f"You can only access courses from your assigned teacher: {self.assigned_teacher.full_name}"
            
            # Check course's required access level against plan's access level
            if hasattr(course, 'required_access_level') and course.required_access_level:
                if not course.can_be_accessed_by_level(self.plan.access_level):
                    return False, f"This course requires '{course.required_access_level}' access level, but your plan provides '{self.plan.access_level}'"
        
        return True, "Access granted"

    def can_access_lesson(self, lesson=None):
        """Check if student can access a lesson"""
        if not self.plan or not self.is_active_and_paid():
            return False, "No active subscription"
        
        # Reset limits if needed
        self.check_and_reset_limits()
        
        # Check total lessons limit
        if self.lessons_accessed >= self.plan.max_lessons:
            return False, f"Total lesson limit reached ({self.plan.max_lessons} lessons)"
        
        # Check daily limit if set
        if self.plan.lessons_per_day:
            if self.lessons_used_today >= self.plan.lessons_per_day:
                return False, f"Daily lesson limit reached ({self.plan.lessons_per_day} lessons/day)"
        
        # Check weekly limit if set
        if self.plan.lessons_per_week:
            if self.current_week_lessons >= self.plan.lessons_per_week:
                return False, f"Weekly lesson limit reached ({self.plan.lessons_per_week} lessons/week)"
        
        if lesson:
            # Check lesson's required access level against plan's access level
            if hasattr(lesson, 'required_access_level') and lesson.required_access_level:
                if not lesson.can_be_accessed_by_level(self.plan.access_level):
                    return False, f"This lesson requires '{lesson.required_access_level}' access level, but your plan provides '{self.plan.access_level}'"
            
            # Check is_premium flag - only premium/unlimited plans can access premium lessons
            if hasattr(lesson, 'is_premium') and lesson.is_premium:
                plan_rank = self.plan.get_access_level_rank()
                if plan_rank < 3:  # Less than 'premium' rank
                    return False, "This is a premium lesson. Please upgrade your subscription to access premium content."
            
            # Check if lesson's course belongs to allowed teacher/category
            if hasattr(lesson, 'module') and lesson.module and hasattr(lesson.module, 'course'):
                course = lesson.module.course
                course_access, msg = self.can_access_course(course)
                if not course_access:
                    return False, msg
        
        return True, "Access granted"
    
    def record_lesson_access(self):
        """Record that a lesson was accessed"""
        self.check_and_reset_limits()
        self.lessons_accessed += 1
        self.lessons_used_today += 1
        self.current_week_lessons += 1
        self.lessons_used_this_month += 1
        self.save(update_fields=['lessons_accessed', 'lessons_used_today', 
                                  'current_week_lessons', 'lessons_used_this_month', 'updated_at'])
    
    def record_course_enrollment(self):
        """Record that a course was enrolled"""
        self.courses_accessed += 1
        self.save(update_fields=['courses_accessed', 'updated_at'])

    def reset_monthly_limits(self):
        """Reset monthly counters (live sessions, audio messages) on 1st of each month"""
        from django.utils import timezone
        today = timezone.now().date()
        if not self.last_monthly_reset or self.last_monthly_reset.month != today.month or self.last_monthly_reset.year != today.year:
            self.live_sessions_used_this_month = 0
            self.audio_messages_used_this_month = 0
            self.lessons_used_this_month = 0
            self.last_monthly_reset = today
            self.save(update_fields=['live_sessions_used_this_month', 'audio_messages_used_this_month',
                                      'lessons_used_this_month', 'last_monthly_reset'])

    def can_access_live_session(self):
        """Check if student can join a live session under their plan"""
        if not self.plan or not self.is_active_and_paid():
            return False, "No active subscription"
        if not self.plan.can_access_live_sessions:
            return False, "Your plan does not include live sessions. Please upgrade."
        self.reset_monthly_limits()
        if self.plan.max_live_sessions_per_month > 0 and self.live_sessions_used_this_month >= self.plan.max_live_sessions_per_month:
            return False, f"Monthly live session limit reached ({self.plan.max_live_sessions_per_month} sessions/month)"
        return True, "Access granted"

    def record_live_session(self):
        """Record that a live session was attended"""
        self.reset_monthly_limits()
        self.live_sessions_used_this_month += 1
        self.save(update_fields=['live_sessions_used_this_month', 'updated_at'])

    def can_send_audio_message(self):
        """Check if teacher/student plan allows audio messages"""
        if not self.plan or not self.is_active_and_paid():
            return False, "No active subscription"
        self.reset_monthly_limits()
        if self.plan.max_audio_messages_per_month > 0 and self.audio_messages_used_this_month >= self.plan.max_audio_messages_per_month:
            return False, f"Monthly audio message limit reached ({self.plan.max_audio_messages_per_month}/month)"
        return True, "Access granted"

    def record_audio_message(self):
        """Record that an audio message was sent"""
        self.reset_monthly_limits()
        self.audio_messages_used_this_month += 1
        self.save(update_fields=['audio_messages_used_this_month', 'updated_at'])

    def activate(self):
        """Activate the subscription"""
        from django.utils import timezone
        if self.status == 'pending':
            self.status = 'active'
            self.activated_at = timezone.now()
            self.is_paid = True
            self.payment_date = timezone.now()
            self.last_daily_reset = timezone.now().date()
            self.last_weekly_reset = timezone.now().date()
            self.save()
            
            # Log the activation
            SubscriptionHistory.objects.create(
                subscription=self,
                action='activated',
                old_status='pending',
                new_status='active',
                notes='Subscription activated after payment confirmation'
            )

    def cancel(self):
        """Cancel the subscription"""
        from django.utils import timezone
        old_status = self.status
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        self.save()
        
        # Log the cancellation
        SubscriptionHistory.objects.create(
            subscription=self,
            action='cancelled',
            old_status=old_status,
            new_status='cancelled',
            notes='Subscription cancelled'
        )
    
    def expire(self):
        """Mark subscription as expired"""
        from django.utils import timezone
        old_status = self.status
        self.status = 'expired'
        self.save()
        
        # Log the expiration
        SubscriptionHistory.objects.create(
            subscription=self,
            action='cancelled',  # Using cancelled action for expiry
            old_status=old_status,
            new_status='expired',
            notes='Subscription expired automatically'
        )
    
    def upgrade_plan(self, new_plan, price_difference=0):
        """Upgrade to a new plan"""
        from django.utils import timezone
        old_plan = self.plan
        self.plan = new_plan
        self.price_paid += price_difference
        self.save()
        
        # Log the upgrade
        SubscriptionHistory.objects.create(
            subscription=self,
            action='upgraded',
            old_plan=old_plan,
            new_plan=new_plan,
            notes=f'Upgraded from {old_plan.name if old_plan else "None"} to {new_plan.name}'
        )
    
    def downgrade_plan(self, new_plan):
        """Downgrade to a lower plan (takes effect at renewal)"""
        from django.utils import timezone
        old_plan = self.plan
        self.plan = new_plan
        self.save()
        
        # Log the downgrade
        SubscriptionHistory.objects.create(
            subscription=self,
            action='downgraded',
            old_plan=old_plan,
            new_plan=new_plan,
            notes=f'Downgraded from {old_plan.name if old_plan else "None"} to {new_plan.name}'
        )
    
    def get_accessible_teachers(self):
        """Get list of teachers whose courses this subscription can access"""
        if not self.plan:
            return Teacher.objects.none()
        
        # If assigned teacher is set, only return that teacher
        if self.assigned_teacher:
            return Teacher.objects.filter(id=self.assigned_teacher_id)
        
        # Otherwise, return teachers allowed by the plan
        allowed_ids = self.plan.get_allowed_teacher_ids()
        if not allowed_ids:  # Empty means all teachers
            return Teacher.objects.all()
        return Teacher.objects.filter(id__in=allowed_ids)
    
    def get_accessible_courses(self):
        """Get queryset of courses this subscription can access"""
        if not self.plan:
            return Course.objects.none()
        
        courses = Course.objects.all()
        
        # Filter by assigned teacher if set
        if self.assigned_teacher:
            courses = courses.filter(teacher=self.assigned_teacher)
        else:
            # Filter by allowed teachers from plan
            allowed_teacher_ids = self.plan.get_allowed_teacher_ids()
            if allowed_teacher_ids:
                courses = courses.filter(teacher_id__in=allowed_teacher_ids)
        
        # Filter by allowed categories
        allowed_category_ids = self.plan.get_allowed_category_ids()
        if allowed_category_ids:
            courses = courses.filter(category_id__in=allowed_category_ids)
        
        return courses
    
    def get_usage_summary(self):
        """Get a summary of subscription usage"""
        return {
            'courses_used': self.courses_accessed,
            'courses_limit': self.plan.max_courses if self.plan else 0,
            'courses_remaining': (self.plan.max_courses - self.courses_accessed) if self.plan else 0,
            'lessons_used': self.lessons_accessed,
            'lessons_limit': self.plan.max_lessons if self.plan else 0,
            'lessons_remaining': (self.plan.max_lessons - self.lessons_accessed) if self.plan else 0,
            'lessons_today': self.lessons_used_today,
            'lessons_per_day': self.plan.lessons_per_day if self.plan else None,
            'lessons_this_week': self.current_week_lessons,
            'lessons_per_week': self.plan.lessons_per_week if self.plan else None,
            'days_remaining': self.days_remaining(),
            'is_active': self.is_active_and_paid(),
            'access_level': self.plan.access_level if self.plan else 'none',
        }


class SubscriptionHistory(models.Model):
    """Track subscription changes and history"""
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('activated', 'Activated'),
        ('cancelled', 'Cancelled'),
        ('renewed', 'Renewed'),
        ('upgraded', 'Upgraded'),
        ('downgraded', 'Downgraded'),
        ('paused', 'Paused'),
        ('resumed', 'Resumed'),
    ]
    
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    old_status = models.CharField(max_length=20, null=True, blank=True)
    new_status = models.CharField(max_length=20, null=True, blank=True)
    old_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='old_subscriptions')
    new_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='new_subscriptions')
    notes = models.TextField(null=True, blank=True)
    changed_by = models.CharField(max_length=100, null=True, blank=True)  # Admin or system
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "52. Subscription History"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subscription.student.fullname} - {self.action}"


# ==================== AUDIT LOGGING MODELS ====================

class UploadLog(models.Model):
    """Track file uploads throughout the system"""
    UPLOAD_TYPE_CHOICES = [
        ('lesson_content', 'Lesson Content'),
        ('student_submission', 'Student Submission'),
        ('profile_image', 'Profile Image'),
        ('course_image', 'Course Image'),
        ('study_material', 'Study Material'),
        ('downloadable_resource', 'Downloadable Resource'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ]
    
    # User who uploaded
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='upload_logs')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='upload_logs')
    admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True, related_name='upload_logs')
    
    # File information
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)  # e.g., pdf, mp4, jpg
    file_size = models.BigIntegerField()  # Size in bytes
    upload_type = models.CharField(max_length=30, choices=UPLOAD_TYPE_CHOICES)
    
    # Related object (generic)
    content_type = models.CharField(max_length=100, null=True, blank=True)  # e.g., 'lesson', 'course'
    object_id = models.IntegerField(null=True, blank=True)  # ID of related object
    
    # Upload details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(null=True, blank=True)
    file_path = models.CharField(max_length=500, null=True, blank=True)
    
    # Network info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name_plural = "53. Upload Logs"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['upload_type']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        user = self.teacher or self.student or self.admin
        return f"{user} - {self.file_name} - {self.status}"
    
    def get_user_display(self):
        """Get the user who uploaded the file"""
        if self.teacher:
            return f"{self.teacher.full_name} (Teacher)"
        elif self.student:
            return f"{self.student.fullname} (Student)"
        elif self.admin:
            return f"{self.admin.username} (Admin)"
        return "Unknown User"


class PaymentLog(models.Model):
    """Track payment and subscription transactions"""
    PAYMENT_TYPE_CHOICES = [
        ('subscription_purchase', 'Subscription Purchase'),
        ('plan_upgrade', 'Plan Upgrade'),
        ('plan_downgrade', 'Plan Downgrade'),
        ('renewal', 'Renewal'),
        ('refund', 'Refund'),
        ('failed_attempt', 'Failed Attempt'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('wallet', 'Wallet'),
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('other', 'Other'),
    ]
    
    # Student information
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payment_logs')
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_logs')
    subscription_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_logs')
    
    # Payment information
    transaction_id = models.CharField(max_length=255, unique=True)
    payment_type = models.CharField(max_length=30, choices=PAYMENT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    
    # Amount details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment gateway details
    gateway_response = models.JSONField(null=True, blank=True)  # Response from Stripe/PayPal
    receipt_url = models.URLField(null=True, blank=True)
    invoice_number = models.CharField(max_length=100, null=True, blank=True)
    
    # Error tracking
    error_message = models.TextField(null=True, blank=True)
    error_code = models.CharField(max_length=100, null=True, blank=True)
    
    # User details at time of payment
    user_email = models.EmailField(null=True, blank=True)
    user_ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name_plural = "54. Payment Logs"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_type']),
            models.Index(fields=['transaction_id']),
        ]
    
    def __str__(self):
        return f"{self.student.fullname} - {self.payment_type} - {self.amount} {self.currency} - {self.status}"


# ==================== SCHOOL DASHBOARD MODELS ====================

class SchoolUser(models.Model):
    """Login user for a School - separate from School entity"""
    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='school_user')
    email = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "56. School Users"

    def __str__(self):
        return f"{self.school.name} - {self.email}"


class GroupClass(models.Model):
    """Group classes that a school can create"""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='group_classes')
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    schedule = models.CharField(max_length=200, null=True, blank=True, help_text="e.g. Mon/Wed 4:00 PM")
    max_students = models.IntegerField(default=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "57. Group Classes"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.school.name} - {self.name}"

    def total_teachers(self):
        return self.group_teachers.count()

    def total_students(self):
        return self.group_students.count()


class GroupClassTeacher(models.Model):
    """Teachers assigned to a group class"""
    group_class = models.ForeignKey(GroupClass, on_delete=models.CASCADE, related_name='group_teachers')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='group_teaching')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "58. Group Class Teachers"
        unique_together = ['group_class', 'teacher']

    def __str__(self):
        return f"{self.group_class.name} - {self.teacher.full_name}"


class GroupClassStudent(models.Model):
    """Students assigned to a group class"""
    group_class = models.ForeignKey(GroupClass, on_delete=models.CASCADE, related_name='group_students')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='group_memberships')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "59. Group Class Students"
        unique_together = ['group_class', 'student']

    def __str__(self):
        return f"{self.group_class.name} - {self.student.fullname}"


class LessonAssignment(models.Model):
    """Assignments created by school or teacher for individual students or group classes.
    Supports multiple submission types: audio, video, discussion, multiple choice, file upload."""
    ASSIGNMENT_TYPE_CHOICES = [
        ('individual', 'Individual Student'),
        ('group', 'Group Class'),
    ]

    SUBMISSION_TYPE_CHOICES = [
        ('audio', 'Audio Submission'),
        ('video', 'Video Submission'),
        ('discussion', 'Discussion Thread'),
        ('multiple_choice', 'Multiple Choice (Auto-Graded)'),
        ('file_upload', 'File Upload'),
    ]

    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('submitted', 'Submitted'),
        ('late', 'Late'),
        ('graded', 'Graded'),
    ]

    # Who created the assignment (school or teacher — at least one required)
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='lesson_assignments')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, null=True, blank=True, related_name='created_assignments',
                                help_text="Teacher who created this assignment (when not created by school)")
    lesson = models.ForeignKey(ModuleLesson, on_delete=models.CASCADE, null=True, blank=True, related_name='school_assignments',
                               help_text="Optional linked lesson")

    # Assignment metadata
    title = models.CharField(max_length=300, default='', blank=True,
                             help_text="Assignment title (falls back to lesson title if blank)")
    description = models.TextField(null=True, blank=True,
                                   help_text="Detailed description / instructions for students")
    submission_type = models.CharField(max_length=20, choices=SUBMISSION_TYPE_CHOICES, default='audio',
                                       help_text="What kind of submission students should provide")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned',
                              help_text="Overall assignment status")

    # Target (individual student or group)
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPE_CHOICES, default='individual')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True, related_name='school_lesson_assignments')
    group_class = models.ForeignKey(GroupClass, on_delete=models.CASCADE, null=True, blank=True, related_name='lesson_assignments')

    due_date = models.DateField(null=True, blank=True)
    audio_required = models.BooleanField(default=True)
    max_points = models.PositiveIntegerField(default=100)
    notes = models.TextField(null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "60. Lesson Assignments"
        ordering = ['-assigned_at']

    def __str__(self):
        label = self.title or (self.lesson.title if self.lesson else 'Untitled')
        target = self.student.fullname if self.student else (self.group_class.name if self.group_class else 'Unknown')
        source = self.school.name if self.school else (self.teacher.full_name if self.teacher else 'Unknown')
        return f"{source} - {label} -> {target}"

    @property
    def display_title(self):
        return self.title or (self.lesson.title if self.lesson else 'Untitled Assignment')

    def compute_status(self, student_id=None):
        """Compute the status for a specific student (or overall)."""
        from django.utils import timezone
        submissions = self.submissions.all()
        if student_id:
            submissions = submissions.filter(student_id=student_id)
        if not submissions.exists():
            if self.due_date and self.due_date < timezone.now().date():
                return 'late'
            return 'assigned'
        submission = submissions.first()
        if submission.points_awarded is not None:
            return 'graded'
        if self.due_date and submission.submitted_at and submission.submitted_at.date() > self.due_date:
            return 'late'
        return 'submitted'


class LessonAssignmentSubmission(models.Model):
    """Student submissions for assignments — supports audio, video, file, and text."""
    assignment = models.ForeignKey(LessonAssignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='lesson_assignment_submissions')

    # Submission files (at least one populated depending on assignment.submission_type)
    audio_file = models.FileField(upload_to='assignment_submissions/audio/', null=True, blank=True)
    video_file = models.FileField(upload_to='assignment_submissions/video/', null=True, blank=True)
    file = models.FileField(upload_to='assignment_submissions/files/', null=True, blank=True,
                            help_text="Generic file upload (PDF, image, etc.)")
    text_content = models.TextField(null=True, blank=True,
                                    help_text="Text response (used for discussion type)")

    submission_notes = models.TextField(null=True, blank=True)
    points_awarded = models.PositiveIntegerField(null=True, blank=True)
    teacher_feedback = models.TextField(null=True, blank=True)
    graded_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_assignment_submissions')
    graded_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "60a. Lesson Assignment Submissions"
        ordering = ['-submitted_at']
        unique_together = ['assignment', 'student']

    def __str__(self):
        label = self.assignment.display_title
        return f"{self.student.fullname} - {label}"


class AccessLog(models.Model):
    """Track user access to courses and lessons"""
    ACCESS_TYPE_CHOICES = [
        ('course_view', 'Course View'),
        ('lesson_view', 'Lesson View'),
        ('course_enroll', 'Course Enrollment'),
        ('course_unenroll', 'Course Unenrollment'),
        ('download_material', 'Download Material'),
        ('lesson_complete', 'Lesson Complete'),
    ]
    
    # User information
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='access_logs_teacher')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='access_logs_student')
    admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True, related_name='access_logs_admin')
    
    # Access details
    access_type = models.CharField(max_length=30, choices=ACCESS_TYPE_CHOICES)
    
    # Related objects
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='access_logs')
    lesson = models.ForeignKey(ModuleLesson, on_delete=models.SET_NULL, null=True, blank=True, related_name='access_logs')
    
    # Subscription context
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='access_logs')
    
    # Access control
    was_allowed = models.BooleanField(default=True)
    denial_reason = models.TextField(null=True, blank=True)
    
    # Session info
    duration_seconds = models.IntegerField(null=True, blank=True)  # How long user spent
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "55. Access Logs"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['access_type']),
            models.Index(fields=['was_allowed']),
        ]
    
    def __str__(self):
        user = self.teacher or self.student or self.admin
        resource = self.course or self.lesson or "Unknown"
        return f"{user} - {self.access_type} - {resource}"
    
    def get_user_display(self):
        """Get the user who accessed the resource"""
        if self.teacher:
            return f"{self.teacher.full_name} (Teacher)"
        elif self.student:
            return f"{self.student.fullname} (Student)"
        elif self.admin:
            return f"{self.admin.username} (Admin)"
        return "Unknown User"


# ==================== AUDIO MESSAGES ====================

class AudioMessage(models.Model):
    """Teacher can record and send audio messages to students"""
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='sent_audio_messages')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='received_audio_messages')
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='audio_messages',
                                help_text="Optional: associate message with a course")
    title = models.CharField(max_length=200)
    audio_file = models.FileField(upload_to='audio_messages/')
    duration_seconds = models.IntegerField(default=0)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "60. Audio Messages"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.teacher.full_name} → {self.student.fullname}: {self.title}"

    @property
    def duration_formatted(self):
        if self.duration_seconds <= 0:
            return "0:00"
        minutes = self.duration_seconds // 60
        seconds = self.duration_seconds % 60
        return f"{minutes}:{seconds:02d}"

    @property
    def file_size_formatted(self):
        try:
            size = self.audio_file.size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024:
                    return f"{size:.1f} {unit}"
                size /= 1024
            return f"{size:.1f} TB"
        except:
            return "Unknown"


class SessionParticipantLog(models.Model):
    """Track who joined/left live sessions for safety audit."""
    session = models.ForeignKey(TeacherSession, on_delete=models.CASCADE, related_name='participant_logs')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='session_participant_logs')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='session_participant_logs')
    participant_role = models.CharField(max_length=20, default='student')
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "60b. Session Participant Logs"
        ordering = ['-joined_at']

    def __str__(self):
        actor = self.teacher.full_name if self.teacher else (self.student.fullname if self.student else 'Unknown')
        return f"{actor} - Session {self.session_id}"


class SafetyReport(models.Model):
    """User safety reports for sessions/messages."""
    REPORT_TYPE_CHOICES = [
        ('session', 'Session'),
        ('audio_message', 'Audio Message'),
        ('text_message', 'Text Message'),
        ('group_message', 'Group Message'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_review', 'In Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]

    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES, default='session')
    session = models.ForeignKey(TeacherSession, on_delete=models.SET_NULL, null=True, blank=True, related_name='safety_reports')
    audio_message = models.ForeignKey(AudioMessage, on_delete=models.SET_NULL, null=True, blank=True, related_name='safety_reports')

    reported_by_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_safety_reports')
    reported_by_student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_safety_reports')
    reported_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_safety_reports')
    reported_student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_safety_reports')

    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    admin_notes = models.TextField(null=True, blank=True)
    reviewed_by = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_safety_reports')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "60c. Safety Reports"
        ordering = ['-created_at']

    def __str__(self):
        return f"SafetyReport #{self.id} - {self.report_type} - {self.status}"


# ==================== MESSAGING SYSTEM ====================

class Message(models.Model):
    """Text messaging between Parent <-> Teacher, Teacher <-> Student (18+), and Admin.
    Messages are permanently stored and cannot be deleted — only hidden per-user.
    Minors (students under 18) CANNOT send or receive direct messages — parent chats only.
    Adult students (18+) chat directly with their teacher via teacher_student link."""
    SENDER_TYPE_CHOICES = [
        ('parent', 'Parent'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
        ('student', 'Student'),
    ]

    # Sender
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPE_CHOICES)
    sender_parent = models.ForeignKey(ParentAccount, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name='sent_messages')
    sender_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='sent_messages')
    sender_admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='sent_messages')
    sender_student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='sent_messages')

    # Recipient
    recipient_type = models.CharField(max_length=20, choices=SENDER_TYPE_CHOICES)
    recipient_parent = models.ForeignKey(ParentAccount, on_delete=models.SET_NULL, null=True, blank=True,
                                          related_name='received_messages')
    recipient_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name='received_messages')
    recipient_admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True,
                                         related_name='received_messages')
    recipient_student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name='received_messages')

    # Link to the parent-student relationship (context for parent<->teacher chat — minors)
    parent_link = models.ForeignKey(StudentParentLink, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='messages',
                                     help_text="The parent-student link this conversation is about")

    # Link to the teacher-student assignment (context for teacher<->student chat — 18+ adults)
    teacher_student = models.ForeignKey(TeacherStudent, on_delete=models.SET_NULL, null=True, blank=True,
                                         related_name='messages',
                                         help_text="The teacher-student assignment this conversation is about (18+ only)")

    content = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Soft-hide per side (NOT deletion — messages are permanent)
    is_hidden_by_sender = models.BooleanField(default=False)
    is_hidden_by_recipient = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "61. Messages"
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['sender_type', 'created_at']),
            models.Index(fields=['recipient_type', 'created_at']),
            models.Index(fields=['parent_link', 'created_at']),
            models.Index(fields=['teacher_student', 'created_at']),
        ]

    def __str__(self):
        sender = self.sender_parent or self.sender_teacher or self.sender_admin or self.sender_student or 'Unknown'
        recipient = self.recipient_parent or self.recipient_teacher or self.recipient_admin or self.recipient_student or 'Unknown'
        return f"{sender} → {recipient} ({self.created_at:%Y-%m-%d %H:%M})"

    @property
    def sender_display(self):
        if self.sender_type == 'parent' and self.sender_parent:
            return self.sender_parent.fullname
        elif self.sender_type == 'teacher' and self.sender_teacher:
            return self.sender_teacher.full_name
        elif self.sender_type == 'admin' and self.sender_admin:
            return self.sender_admin.full_name
        elif self.sender_type == 'student' and self.sender_student:
            return self.sender_student.fullname
        return 'Unknown'

    @property
    def recipient_display(self):
        if self.recipient_type == 'parent' and self.recipient_parent:
            return self.recipient_parent.fullname
        elif self.recipient_type == 'teacher' and self.recipient_teacher:
            return self.recipient_teacher.full_name
        elif self.recipient_type == 'admin' and self.recipient_admin:
            return self.recipient_admin.full_name
        elif self.recipient_type == 'student' and self.recipient_student:
            return self.recipient_student.fullname
        return 'Unknown'


class ChatLockPolicy(models.Model):
    """Controls whether chat is locked or unlocked for a parent-teacher pair.
    Age-based defaults:
      Ages 4-12: Locked by default; unlocked only during sessions or by admin.
      Ages 13-17: Allowed only during approved hours (office hours / sessions).
      Ages 18+: Always available.
    """
    LOCK_REASON_CHOICES = [
        ('age_default', 'Age-based default lock'),
        ('admin_lock', 'Locked by admin'),
        ('policy', 'Policy violation'),
    ]

    UNLOCKED_BY_CHOICES = [
        ('admin', 'Admin manual unlock'),
        ('session', 'Active session auto-unlock'),
        ('office_hours', 'Teacher office hours'),
        ('system', 'System'),
    ]

    parent_link = models.OneToOneField(StudentParentLink, on_delete=models.CASCADE,
                                        related_name='chat_lock_policy')
    is_locked = models.BooleanField(default=True)
    lock_reason = models.CharField(max_length=30, choices=LOCK_REASON_CHOICES, default='age_default')
    unlocked_by = models.CharField(max_length=20, choices=UNLOCKED_BY_CHOICES, null=True, blank=True)
    unlock_expires_at = models.DateTimeField(null=True, blank=True,
                                              help_text="When the current unlock window expires")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "61a. Chat Lock Policies"

    def __str__(self):
        status = 'Locked' if self.is_locked else 'Unlocked'
        return f"{self.parent_link} - {status}"

    def get_student_age_tier(self):
        """Return the age tier for the student in this parent link."""
        student = self.parent_link.student
        if not student.date_of_birth:
            return '13_17'  # default to restricted if unknown
        from django.utils import timezone
        today = timezone.now().date()
        age = today.year - student.date_of_birth.year - (
            (today.month, today.day) < (student.date_of_birth.month, student.date_of_birth.day)
        )
        if age >= 18:
            return '18_plus'
        elif age >= 13:
            return '13_17'
        else:
            return '4_12'

    def is_chat_currently_allowed(self):
        """Determine if chat is allowed right now, considering age, sessions, and office hours."""
        from django.utils import timezone
        now = timezone.now()
        tier = self.get_student_age_tier()

        # 18+ always allowed
        if tier == '18_plus':
            return True, 'Adult student — chat always available'

        # Check if there's an active admin unlock that hasn't expired
        if not self.is_locked and self.unlock_expires_at and self.unlock_expires_at > now:
            return True, f'Unlocked by {self.unlocked_by} until {self.unlock_expires_at}'

        # Check active unlock requests
        active_unlock = ChatUnlockRequest.objects.filter(
            parent_link=self.parent_link,
            expires_at__gt=now
        ).first()
        if active_unlock:
            return True, f'Admin unlock active until {active_unlock.expires_at}'

        # Check if within a live session window (10 min before → 30 min after)
        import datetime
        teacher_ids = []
        # Get teachers from the parent link's student's enrolled courses
        if self.parent_link.student:
            from django.db.models import Q
            teacher_ids = list(
                TeacherStudent.objects.filter(
                    student=self.parent_link.student, status='active'
                ).values_list('teacher_id', flat=True)
            )
        if teacher_ids:
            session_window_start = now - datetime.timedelta(minutes=10)
            session_window_end = now + datetime.timedelta(minutes=30)
            active_session = TeacherSession.objects.filter(
                teacher_id__in=teacher_ids,
                student=self.parent_link.student,
                scheduled_date=now.date(),
            ).filter(
                models.Q(is_live=True) |
                models.Q(
                    scheduled_date=now.date(),
                    # Session time within window
                )
            ).first()
            if active_session:
                return True, 'Live session window — chat unlocked'

        # Ages 13-17: check teacher office hours
        if tier == '13_17':
            current_day = now.weekday()  # 0=Monday
            current_time = now.time()
            if teacher_ids:
                office_hour = TeacherOfficeHours.objects.filter(
                    teacher_id__in=teacher_ids,
                    day_of_week=current_day,
                    is_active=True,
                    start_time__lte=current_time,
                    end_time__gte=current_time
                ).first()
                if office_hour:
                    return True, f'Within office hours of {office_hour.teacher.full_name}'

        # Default: locked for 4-12 and outside approved windows for 13-17
        if tier == '4_12':
            return False, 'Chat locked for students aged 4-12 (unlocked only during sessions or by admin)'
        return False, 'Chat locked outside approved hours for students aged 13-17'


class TeacherOfficeHours(models.Model):
    """Weekly recurring office hours when a teacher is available for chat."""
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='office_hours')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    notes = models.CharField(max_length=200, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "61b. Teacher Office Hours"
        ordering = ['day_of_week', 'start_time']
        unique_together = ['teacher', 'day_of_week', 'start_time']

    def __str__(self):
        day_name = dict(self.DAY_CHOICES).get(self.day_of_week, '?')
        return f"{self.teacher.full_name} - {day_name} {self.start_time}-{self.end_time}"


class ChatUnlockRequest(models.Model):
    """Admin or school manual unlock of chat for a specific parent-teacher pair."""
    DURATION_CHOICES = [
        (24, '24 Hours'),
        (168, '7 Days'),
    ]

    parent_link = models.ForeignKey(StudentParentLink, on_delete=models.CASCADE,
                                     related_name='chat_unlock_requests')
    unlocked_by_admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name='chat_unlocks')
    unlocked_by_school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True,
                                            related_name='chat_unlocks')
    duration_hours = models.IntegerField(choices=DURATION_CHOICES, default=24)
    unlock_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "61c. Chat Unlock Requests"
        ordering = ['-created_at']

    def __str__(self):
        by = self.unlocked_by_admin or self.unlocked_by_school or 'System'
        return f"{self.parent_link} unlocked by {by} for {self.duration_hours}h"

    def is_active(self):
        from django.utils import timezone
        return self.expires_at > timezone.now()


# ==================== GROUP FEATURES ====================

class GroupMessage(models.Model):
    """Messages in a group class chat. Visible to all group students, instructor, and admin.
    No private student-to-student or teacher-to-minor messaging.
    Messages are permanently stored — no hard delete."""
    SENDER_TYPE_CHOICES = [
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
        ('parent', 'Parent'),
        ('student', 'Student'),  # Only 18+ students
        ('school', 'School'),
    ]

    group_class = models.ForeignKey(GroupClass, on_delete=models.CASCADE, related_name='group_messages')
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPE_CHOICES)
    sender_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='group_messages_sent')
    sender_admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='group_messages_sent')
    sender_parent = models.ForeignKey(ParentAccount, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name='group_messages_sent')
    sender_student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='group_messages_sent')
    sender_name = models.CharField(max_length=150, blank=True, default='',
                                    help_text="Cached display name for performance")

    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False, help_text="Admin can hide inappropriate messages")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "62. Group Messages"
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['group_class', 'created_at']),
        ]

    def __str__(self):
        return f"[{self.group_class.name}] {self.sender_name}: {self.content[:50]}"


class GroupAnnouncement(models.Model):
    """Instructor announcements and updates posted to a group."""
    group_class = models.ForeignKey(GroupClass, on_delete=models.CASCADE, related_name='announcements')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='group_announcements')
    admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='group_announcements')
    title = models.CharField(max_length=300)
    content = models.TextField()
    file = models.FileField(upload_to='group_announcements/', null=True, blank=True)
    is_pinned = models.BooleanField(default=False)
    priority = models.CharField(max_length=20, default='normal',
                                choices=[('low','Low'),('normal','Normal'),('high','High'),('urgent','Urgent')])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "62a. Group Announcements"
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        author = self.teacher.full_name if self.teacher else (self.admin.full_name if self.admin else 'Unknown')
        return f"[{self.group_class.name}] {author}: {self.title}"


class GroupResource(models.Model):
    """Files and resources shared with a group by the instructor."""
    FILE_TYPE_CHOICES = [
        ('pdf', 'PDF Document'),
        ('audio', 'Audio'),
        ('video', 'Video'),
        ('image', 'Image'),
        ('sheet_music', 'Sheet Music'),
        ('other', 'Other'),
    ]

    group_class = models.ForeignKey(GroupClass, on_delete=models.CASCADE, related_name='resources')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='group_resources')
    title = models.CharField(max_length=300)
    description = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to='group_resources/', null=True, blank=True)
    link_url = models.URLField(null=True, blank=True, help_text="External link (if no file upload)")
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default='other')
    download_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "62b. Group Resources"
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.group_class.name}] {self.title}"

    @property
    def file_size_formatted(self):
        try:
            size = self.file.size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024:
                    return f"{size:.1f} {unit}"
                size /= 1024
            return f"{size:.1f} TB"
        except:
            return "Unknown"


class GroupSession(models.Model):
    """Group live sessions — instructor schedules for entire group.
    Session logs saved: date, time, duration, participants."""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    SESSION_TYPE_CHOICES = [
        ('video_call', 'Video Call'),
        ('audio_call', 'Audio Call'),
    ]

    group_class = models.ForeignKey(GroupClass, on_delete=models.CASCADE, related_name='group_sessions')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='group_teaching_sessions')
    title = models.CharField(max_length=300)
    description = models.TextField(null=True, blank=True)
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.IntegerField(default=60)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='video_call')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    # Jitsi room
    room_name = models.CharField(max_length=200, null=True, blank=True, unique=True)
    meeting_link = models.URLField(null=True, blank=True)

    # Live state
    is_live = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    recording_url = models.URLField(null=True, blank=True)

    # Safety
    has_minor_participants = models.BooleanField(default=False)
    recording_enabled = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "62c. Group Sessions"
        ordering = ['scheduled_date', 'scheduled_time']

    def __str__(self):
        return f"[{self.group_class.name}] {self.title} - {self.scheduled_date}"

    def save(self, *args, **kwargs):
        # Auto-generate room name and meeting link
        if not self.room_name:
            import uuid
            self.room_name = f"kannari-group-{self.pk or 'new'}-{uuid.uuid4().hex[:8]}"
        if not self.meeting_link and self.session_type in ('video_call', 'audio_call'):
            self.meeting_link = f"https://meet.jit.si/{self.room_name}"
        # Check for minor participants
        if self.group_class_id:
            self.has_minor_participants = GroupClassStudent.objects.filter(
                group_class_id=self.group_class_id,
                student__date_of_birth__isnull=False
            ).exists()  # Will be refined in view logic
        super().save(*args, **kwargs)
        if self.room_name and 'new' in self.room_name:
            import uuid
            self.room_name = f"kannari-group-{self.pk}-{uuid.uuid4().hex[:8]}"
            self.meeting_link = f"https://meet.jit.si/{self.room_name}"
            super().save(update_fields=['room_name', 'meeting_link'])

    def go_live(self):
        from django.utils import timezone
        self.is_live = True
        self.started_at = timezone.now()
        self.status = 'live'
        self.save(update_fields=['is_live', 'started_at', 'status', 'updated_at'])

    def end_session(self):
        from django.utils import timezone
        self.is_live = False
        self.ended_at = timezone.now()
        self.status = 'completed'
        self.save(update_fields=['is_live', 'ended_at', 'status', 'updated_at'])

    @property
    def actual_duration_minutes(self):
        if self.started_at and self.ended_at:
            delta = self.ended_at - self.started_at
            return int(delta.total_seconds() / 60)
        return 0


class GroupSessionParticipantLog(models.Model):
    """Track who joined/left group live sessions."""
    session = models.ForeignKey(GroupSession, on_delete=models.CASCADE, related_name='participant_logs')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='group_session_logs')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='group_session_logs')
    participant_role = models.CharField(max_length=20, default='student')
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "62d. Group Session Participant Logs"
        ordering = ['-joined_at']

    def __str__(self):
        actor = self.teacher.full_name if self.teacher else (self.student.fullname if self.student else 'Unknown')
        return f"{actor} - Group Session {self.session_id}"


# ==================== DISCUSSION & MULTIPLE CHOICE ====================

class DiscussionThread(models.Model):
    """Thread-based discussion for discussion-type assignments."""
    AUTHOR_TYPE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    ]

    assignment = models.ForeignKey(LessonAssignment, on_delete=models.CASCADE, related_name='discussion_threads')
    author_type = models.CharField(max_length=20, choices=AUTHOR_TYPE_CHOICES)
    author_student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='discussion_posts')
    author_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='discussion_posts')
    author_admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='discussion_posts')
    content = models.TextField()
    parent_reply = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                                      related_name='replies', help_text="Reply to another post")
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "63. Discussion Threads"
        ordering = ['-is_pinned', 'created_at']

    def __str__(self):
        author = self.author_student or self.author_teacher or self.author_admin or 'Unknown'
        return f"Discussion on {self.assignment.display_title} by {author}"

    @property
    def author_display(self):
        if self.author_type == 'student' and self.author_student:
            return self.author_student.fullname
        elif self.author_type == 'teacher' and self.author_teacher:
            return self.author_teacher.full_name
        elif self.author_type == 'admin' and self.author_admin:
            return self.author_admin.full_name
        return 'Unknown'


class MultipleChoiceQuestion(models.Model):
    """Questions for multiple-choice type assignments. Auto-graded."""
    assignment = models.ForeignKey(LessonAssignment, on_delete=models.CASCADE, related_name='mc_questions')
    question_text = models.TextField()
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500, blank=True, default='')
    option_d = models.CharField(max_length=500, blank=True, default='')
    correct_option = models.CharField(max_length=1, choices=[
        ('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D')
    ])
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "63a. Multiple Choice Questions"
        ordering = ['order', 'id']

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:80]}"


class MultipleChoiceAnswer(models.Model):
    """Student answers for multiple-choice questions. Auto-graded on save."""
    question = models.ForeignKey(MultipleChoiceQuestion, on_delete=models.CASCADE, related_name='answers')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='mc_answers')
    selected_option = models.CharField(max_length=1, choices=[
        ('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D')
    ])
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "63b. Multiple Choice Answers"
        unique_together = ['question', 'student']

    def __str__(self):
        return f"{self.student.fullname} - Q{self.question.order}: {self.selected_option} ({'✓' if self.is_correct else '✗'})"

    def save(self, *args, **kwargs):
        # Auto-grade on save
        self.is_correct = (self.selected_option == self.question.correct_option)
        super().save(*args, **kwargs)


# ==================== PARENT POLICY ACCEPTANCE ====================

class ParentPolicyAcceptance(models.Model):
    """Tracks which policy documents a parent has accepted.
    Required: TOS + Child Safety Policy before minor account activation."""
    parent = models.ForeignKey(ParentAccount, on_delete=models.CASCADE, related_name='policy_acceptances')
    policy = models.ForeignKey(PolicyDocument, on_delete=models.CASCADE, related_name='parent_acceptances')
    accepted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "63c. Parent Policy Acceptances"
        unique_together = ['parent', 'policy']

    def __str__(self):
        return f"{self.parent.fullname} accepted '{self.policy.title}' on {self.accepted_at:%Y-%m-%d}"


# ==================== TEACHER COMMUNITY ====================

class TeacherCommunityMessage(models.Model):
    """Global teacher lounge — a single shared chat room for all teachers."""
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='community_messages')
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "64. Teacher Community Messages"
        ordering = ['created_at']

    def __str__(self):
        return f"{self.teacher.fullname}: {self.content[:50]}" 


# ==================== STUDENT GAMES & GAMIFICATION ====================

class GameDefinition(models.Model):
    GAME_TYPE_CHOICES = [
        ('note_ninja', 'Note Ninja'),
        ('rhythm_rush', 'Rhythm Rush'),
        ('music_challenge', '5-Second Music Challenge'),
    ]

    ACCESS_LEVEL_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]

    game_type = models.CharField(max_length=30, choices=GAME_TYPE_CHOICES, unique=True)
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    min_access_level = models.CharField(max_length=20, choices=ACCESS_LEVEL_CHOICES, default='free')
    max_level = models.PositiveIntegerField(default=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "65. Game Definitions"

    def __str__(self):
        return self.title


class GameQuestion(models.Model):
    game = models.ForeignKey(GameDefinition, on_delete=models.CASCADE, related_name='questions')
    level = models.PositiveIntegerField(default=1)
    prompt = models.TextField()
    question_payload = models.JSONField(default=dict, blank=True)
    choices = models.JSONField(default=list, blank=True)
    correct_answer = models.CharField(max_length=255, blank=True, default='')
    time_limit_seconds = models.PositiveIntegerField(default=5)
    points = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "66. Game Questions"
        ordering = ['game_id', 'level', 'order', 'id']

    def __str__(self):
        return f"{self.game.title} L{self.level} - Q{self.id}"


class StudentGameProfile(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='game_profiles')
    game = models.ForeignKey(GameDefinition, on_delete=models.CASCADE, related_name='student_profiles')
    total_attempts = models.PositiveIntegerField(default=0)
    correct_attempts = models.PositiveIntegerField(default=0)
    total_score = models.IntegerField(default=0)
    best_score = models.IntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    highest_level_unlocked = models.PositiveIntegerField(default=1)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    sonara_coins = models.PositiveIntegerField(default=0)
    last_played_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "67. Student Game Profiles"
        unique_together = ['student', 'game']

    @property
    def accuracy_percent(self):
        if self.total_attempts == 0:
            return 0
        return round((self.correct_attempts / self.total_attempts) * 100, 2)

    def __str__(self):
        return f"{self.student.fullname} - {self.game.title}"


class GameSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='game_sessions')
    game = models.ForeignKey(GameDefinition, on_delete=models.CASCADE, related_name='sessions')
    level = models.PositiveIntegerField(default=1)
    score = models.IntegerField(default=0)
    streak = models.PositiveIntegerField(default=0)
    max_streak = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveIntegerField(default=0)
    wrong_count = models.PositiveIntegerField(default=0)
    average_response_ms = models.PositiveIntegerField(default=0)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "68. Game Sessions"
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.student.fullname} - {self.game.game_type} ({self.status})"


class GameAttempt(models.Model):
    FEEDBACK_CHOICES = [
        ('perfect', 'Perfect'),
        ('good', 'Good'),
        ('try_again', 'Try Again'),
        ('correct', 'Correct'),
        ('incorrect', 'Incorrect'),
    ]

    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='attempts')
    question = models.ForeignKey(GameQuestion, on_delete=models.SET_NULL, null=True, blank=True, related_name='attempts')
    expected_payload = models.JSONField(default=dict, blank=True)
    submitted_payload = models.JSONField(default=dict, blank=True)
    response_time_ms = models.PositiveIntegerField(default=0)
    is_correct = models.BooleanField(default=False)
    accuracy_score = models.FloatField(default=0)
    points_earned = models.IntegerField(default=0)
    feedback = models.CharField(max_length=20, choices=FEEDBACK_CHOICES, default='try_again')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "69. Game Attempts"
        ordering = ['id']

    def __str__(self):
        return f"Session {self.session_id} Attempt {self.id}"


class GameBadge(models.Model):
    BADGE_KEY_CHOICES = [
        ('note_master', 'Note Master'),
        ('rhythm_king', 'Rhythm King'),
        ('theory_champion', 'Theory Champion'),
    ]

    badge_key = models.CharField(max_length=40, choices=BADGE_KEY_CHOICES, unique=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    criteria = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "70. Game Badges"

    def __str__(self):
        return self.title


class StudentGameBadge(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='game_badges')
    badge = models.ForeignKey(GameBadge, on_delete=models.CASCADE, related_name='student_badges')
    source_game = models.ForeignKey(GameDefinition, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='awarded_badges')
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "71. Student Game Badges"
        unique_together = ['student', 'badge']

    def __str__(self):
        return f"{self.student.fullname} - {self.badge.title}"


class WeeklyGameLeaderboard(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='weekly_game_rankings')
    game = models.ForeignKey(GameDefinition, on_delete=models.CASCADE, related_name='weekly_rankings')
    week_start = models.DateField()
    week_end = models.DateField()
    total_score = models.IntegerField(default=0)
    attempts_count = models.PositiveIntegerField(default=0)
    avg_accuracy = models.FloatField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    rank = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "72. Weekly Game Leaderboard"
        unique_together = ['student', 'game', 'week_start']
        ordering = ['week_start', 'game', 'rank']

    def __str__(self):
        return f"{self.game.title} {self.week_start} - {self.student.fullname}"