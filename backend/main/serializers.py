from rest_framework import serializers
from . import models
from django.contrib.flatpages.models import FlatPage


class TeacherSerializer(serializers.ModelSerializer):
    teacher_courses = serializers.SerializerMethodField(read_only=True)
    skill_list = serializers.SerializerMethodField(read_only=True)
    total_teacher_course = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model=models.Teacher
        fields=['id','full_name','email','password','qualification','mobile_no','skills','profile_img','teacher_courses','skill_list','total_teacher_course','face_url','insta_url','twit_url','web_url','you_url','is_verified','is_approved','verification_status','can_teach_minors']
        extra_kwargs = {
            'password': {'required': False, 'allow_blank': True},
            'skills': {'required': False, 'allow_blank': True},
            'face_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'insta_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'twit_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'web_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'you_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'profile_img': {'required': False},
        }
    
    def to_internal_value(self, data):
        """Convert empty strings and 'null' to None for URL fields before validation"""
        # QueryDict from multipart form data is immutable, so make a mutable copy
        from django.http import QueryDict
        if isinstance(data, QueryDict):
            data = data.copy()  # returns a mutable copy
        url_fields = ['face_url', 'insta_url', 'twit_url', 'web_url', 'you_url']
        for field in url_fields:
            if field in data and data[field] in ('', 'null', 'None', None):
                data[field] = ''
        return super().to_internal_value(data)
    
    def get_teacher_courses(self, obj):
        from . import models
        return obj.teacher_courses.all().count()
    
    def get_skill_list(self, obj):
        if obj.skills:
            return [s.strip() for s in obj.skills.split(',')]
        return []
    
    def get_total_teacher_course(self, obj):
        return obj.total_teacher_course()
    
    def validate_face_url(self, value):
        if value == '' or value is None:
            return None
        return value
    
    def validate_insta_url(self, value):
        if value == '' or value is None:
            return None
        return value
    
    def validate_twit_url(self, value):
        if value == '' or value is None:
            return None
        return value
    
    def validate_web_url(self, value):
        if value == '' or value is None:
            return None
        return value
    
    def validate_you_url(self, value):
        if value == '' or value is None:
            return None
        return value
    
    def __init__(self, *args, **kwargs):
            super(TeacherSerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model=models.CourseCategory
        fields=['id','title','description','total_courses']
    def __init__(self, *args, **kwargs):
            super(CategorySerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2

class CourseSerializer(serializers.ModelSerializer):
    course_chapters = serializers.SerializerMethodField()
    total_enrolled_students = serializers.SerializerMethodField()
    course_rating = serializers.SerializerMethodField()
    course_views = serializers.IntegerField(read_only=True)
    required_access_level = serializers.CharField(required=False, default='free')
    is_featured = serializers.BooleanField(required=False, default=False)
    
    class Meta:
        model=models.Course
        fields=['id','category','teacher','title','description','featured_img','techs','course_chapters','related_videos','teach_list','total_enrolled_students','course_rating','course_views','required_access_level','is_featured']
    
    def get_course_chapters(self, obj):
        chapters = obj.course_chapters.all().order_by('order', 'id')
        return ChapterSerializer(chapters, many=True, context=self.context).data
    
    def get_total_enrolled_students(self, obj):
        return obj.total_enrolled_students()
    
    def get_course_rating(self, obj):
        return obj.course_rating()
    
    def validate(self, data):
        """Validate and log errors"""
        print('=' * 50)
        print('COURSE SERIALIZER VALIDATION')
        print('=' * 50)
        print(f'Data being validated: {data}')
        return data
    
    def __init__(self, *args, **kwargs):
            super(CourseSerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2

class LessonDownloadableSerializer(serializers.ModelSerializer):
    """Serializer for lesson downloadable resources"""
    file_size_formatted = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    file_type_display = serializers.CharField(source='get_file_type_display', read_only=True)
    file_type_icon = serializers.CharField(source='get_file_type_icon', read_only=True)
    
    class Meta:
        model = models.LessonDownloadable
        fields = ['id', 'lesson', 'title', 'file_type', 'file_type_display', 
                  'file_type_icon', 'file', 'description', 'order', 
                  'download_count', 'file_size_formatted', 'file_extension', 'created_at']
    
    def __init__(self, *args, **kwargs):
        super(LessonDownloadableSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class ModuleLessonSerializer(serializers.ModelSerializer):
    """Serializer for individual lessons within a module"""
    duration_formatted = serializers.ReadOnlyField()
    file_size_formatted = serializers.ReadOnlyField()
    objectives_list = serializers.ReadOnlyField()
    downloadables = LessonDownloadableSerializer(many=True, read_only=True)
    required_access_level = serializers.CharField(required=False, default='free')
    
    class Meta:
        model = models.ModuleLesson
        fields = ['id', 'module', 'title', 'description', 'objectives', 'objectives_list',
                  'content_type', 'file', 'duration_seconds', 'duration_formatted', 
                  'file_size_formatted', 'order', 'is_preview', 'is_locked', 'is_premium',
                  'required_access_level',
                  'downloadables', 'created_at', 'updated_at']
    
    def __init__(self, *args, **kwargs):
        super(ModuleLessonSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class ChapterSerializer(serializers.ModelSerializer):
        """Module serializer (renamed from Chapter for clarity)"""
        module_lessons = ModuleLessonSerializer(many=True, read_only=True)
        total_lessons = serializers.SerializerMethodField()
        
        class Meta:
            model=models.Chapter
            fields=['id','course','title','description','video','remarks','order','module_lessons','total_lessons']
        
        def get_total_lessons(self, obj):
            return obj.total_lessons()
        
        def __init__(self, *args, **kwargs):
            super(ChapterSerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2


class ModuleLessonProgressSerializer(serializers.ModelSerializer):
    """Serializer for lesson progress tracking"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    
    class Meta:
        model = models.ModuleLessonProgress
        fields = ['id', 'student', 'lesson', 'lesson_title', 'is_completed', 
                  'last_position_seconds', 'viewed_at', 'completed_at']


class ModuleProgressSerializer(serializers.ModelSerializer):
    """Serializer for module progress tracking"""
    module_title = serializers.CharField(source='module.title', read_only=True)
    
    class Meta:
        model = models.ModuleProgress
        fields = ['id', 'student', 'module', 'module_title', 'is_completed', 
                  'started_at', 'completed_at']


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.Student
        fields=['id','fullname','email','password','username','interseted_categories','profile_img','date_of_birth','parent_account_required','parent_linked_at']
        extra_kwargs = {
            'password': {'required': False, 'allow_blank': True},
            'interseted_categories': {'required': False, 'allow_blank': True},
            'profile_img': {'required': False},
        }
    
    def __init__(self, *args, **kwargs):
            super(StudentSerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2

class StudentCourseEnrollSerializer(serializers.ModelSerializer):
        subscription_valid = serializers.SerializerMethodField()
        progress_percent = serializers.IntegerField(read_only=True)
        is_active = serializers.BooleanField(read_only=True)
        
        class Meta:
            model=models.StudentCourseEnrollment
            fields=['id', 'course', 'student', 'subscription', 'enrolled_time', 
                    'is_active', 'completed_at', 'last_accessed', 'progress_percent',
                    'subscription_valid']
        
        def get_subscription_valid(self, obj):
            if not obj.subscription:
                return {'valid': False, 'message': 'No subscription linked'}
            valid, msg = obj.check_subscription_validity()
            return {'valid': valid, 'message': msg}
        
        def __init__(self, *args, **kwargs):
            super(StudentCourseEnrollSerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2
        
        def create(self, validated_data):
            """Create enrollment with subscription validation and CourseProgress record"""
            from .access_control import SubscriptionAccessControl
            
            student = validated_data.get('student')
            course = validated_data.get('course')
            
            # Get active subscription for the student
            subscription = SubscriptionAccessControl.get_active_subscription(student.id) if student else None
            
            # Link subscription to enrollment
            if subscription:
                validated_data['subscription'] = subscription
            
            enrollment = super().create(validated_data)
            
            # Record course enrollment in subscription
            if subscription:
                subscription.record_course_enrollment()
            
            # Create CourseProgress record for this enrollment
            # Calculate total lessons from modules
            total_lessons = 0
            for chapter in course.course_chapters.all():
                total_lessons += chapter.module_lessons.count()
            
            # Create or update CourseProgress
            course_progress, created = models.CourseProgress.objects.get_or_create(
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
            
            if not created:
                course_progress.enrollment = enrollment
                course_progress.save()
            
            # Auto-create TeacherStudent relationship if not exists
            if course and course.teacher and student:
                teacher_student, ts_created = models.TeacherStudent.objects.get_or_create(
                    teacher=course.teacher,
                    student=student,
                    defaults={
                        'instrument': 'piano',
                        'level': 'beginner',
                        'status': 'active',
                        'progress_percentage': 0,
                    }
                )
                if not ts_created:
                    # Update last_active timestamp
                    from django.utils import timezone
                    teacher_student.last_active = timezone.now()
                    teacher_student.save(update_fields=['last_active'])
            
            return enrollment
            

class StudentFavoriteCourseSerializer(serializers.ModelSerializer):
        class Meta:
            model=models.StudentFavoriteCourse
            fields=['id','course','student','status']
        def __init__(self, *args, **kwargs):
            super(StudentFavoriteCourseSerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2

class CourseRatingSerializer(serializers.ModelSerializer):
        class Meta:
            model=models.CourseRating
            fields=['id','course','student','rating','reviews','review_time']
        def __init__(self, *args, **kwargs):
            super(CourseRatingSerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2

class TeacherDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.Teacher
        fields=['total_teacher_course','total_teacher_chapters','total_teacher_students']

class StudentDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.Student
        fields=['enrolled_courses','favorite_courses']
        def __init__(self, *args, **kwargs):
            super(StudentDashboardSerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2


class StudyMaterialSerializer(serializers.ModelSerializer):
        class Meta:
            model=models.StudyMaterial
            fields=['id','course','title','description','upload','remarks']

        def __init__(self, *args, **kwargs):
            super(StudyMaterialSerializer, self).__init__(*args, **kwargs)
            request = self.context.get('request')
            if request and request.method in ['POST', 'PUT', 'PATCH']:
                print('Method is POST/PUT/PATCH')
                self.Meta.depth = 0
                print(self.Meta.depth)
            else:
                print(f"Method is - {request.method if request else 'N/A'}")
                self.Meta.depth = 2

class FaqSerializer(serializers.ModelSerializer):
        class Meta:
            model=models.Faq
            fields=['question','answer']

class FlatPageSerializer(serializers.ModelSerializer):
    class Meta :
        model=FlatPage
        fields=['id','title','content','url']

# ==================== ADMIN DASHBOARD SERIALIZERS ====================

class AdminSerializer(serializers.ModelSerializer):
    total_managed_schools = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = models.Admin
        fields = ['id', 'full_name', 'email', 'password', 'role', 'profile_img', 
                  'phone', 'is_active', 'created_at', 'updated_at', 'last_login',
                  'total_managed_schools']
        extra_kwargs = {
            'password': {'write_only': True},
            'profile_img': {'required': False, 'allow_null': True}
        }

    def __init__(self, *args, **kwargs):
        super(AdminSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1
    
    def update(self, instance, validated_data):
        # Don't update password through the profile endpoint
        validated_data.pop('password', None)
        return super().update(instance, validated_data)

    def create(self, validated_data):
        import hashlib

        raw_password = validated_data.get('password')
        if raw_password:
            validated_data['password'] = hashlib.sha256(raw_password.encode()).hexdigest()
        return super().create(validated_data)


class AdminDashboardSerializer(serializers.ModelSerializer):
    total_managed_schools = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = models.Admin
        fields = ['id', 'full_name', 'email', 'role', 'profile_img', 
                  'total_managed_schools', 'last_login']


class SchoolSerializer(serializers.ModelSerializer):
    total_teachers = serializers.IntegerField(read_only=True)
    total_students = serializers.IntegerField(read_only=True)
    total_courses = serializers.IntegerField(read_only=True)
    school_user_id = serializers.SerializerMethodField()
    school_user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = models.School
        fields = ['id', 'name', 'email', 'phone', 'address', 'city', 'state', 
                  'country', 'logo', 'website', 'admin', 'status', 'max_teachers',
                  'max_students', 'max_courses', 'created_at', 'updated_at',
                  'total_teachers', 'total_students', 'total_courses',
                  'school_user_id', 'school_user_email']

    def get_school_user_id(self, obj):
        try:
            return obj.school_user.id
        except models.SchoolUser.DoesNotExist:
            return None

    def get_school_user_email(self, obj):
        try:
            return obj.school_user.email
        except models.SchoolUser.DoesNotExist:
            return None

    def __init__(self, *args, **kwargs):
        super(SchoolSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class SchoolTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SchoolTeacher
        fields = ['id', 'school', 'teacher', 'is_active', 'joined_at']

    def __init__(self, *args, **kwargs):
        super(SchoolTeacherSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2


class SchoolStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SchoolStudent
        fields = ['id', 'school', 'student', 'is_active', 'joined_at']

    def __init__(self, *args, **kwargs):
        super(SchoolStudentSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2


class SchoolCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SchoolCourse
        fields = ['id', 'school', 'course', 'is_featured', 'added_at']

    def __init__(self, *args, **kwargs):
        super(SchoolCourseSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2



            self.Meta.depth = 1


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ActivityLog
        fields = ['id', 'admin', 'teacher', 'student', 'action', 'model_name',
                  'object_id', 'description', 'ip_address', 'user_agent', 'created_at']

    def __init__(self, *args, **kwargs):
        super(ActivityLogSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SystemSettings
        fields = ['id', 'site_name', 'site_logo', 'favicon', 'contact_email',
                  'contact_phone', 'address', 'maintenance_mode', 'allow_registration',
                  'default_language', 'timezone', 'updated_at']


class AdminStatsSerializer(serializers.Serializer):
    """Serializer for admin dashboard statistics"""
    total_schools = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    total_students = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()
    active_subscriptions = serializers.IntegerField()
    recent_enrollments = serializers.ListField()
    popular_courses = serializers.ListField()
    monthly_stats = serializers.DictField()


# ==================== ENHANCED STUDENT DASHBOARD SERIALIZERS ====================


class WeeklyGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = models.WeeklyGoal
        fields = ['id', 'student', 'goal_type', 'target_value', 'current_value',
                  'week_start', 'week_end', 'is_achieved', 'progress_percentage', 'created_at']

    def __init__(self, *args, **kwargs):
        super(WeeklyGoalSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LessonProgress
        fields = ['id', 'student', 'chapter', 'course', 'is_completed', 
                  'progress_percentage', 'time_spent_seconds', 'last_position_seconds',
                  'started_at', 'completed_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super(LessonProgressSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2


class CourseProgressSerializer(serializers.ModelSerializer):
    time_spent_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = models.CourseProgress
        fields = ['id', 'student', 'course', 'enrollment', 'total_chapters', 
                  'completed_chapters', 'progress_percentage', 'total_time_spent_seconds',
                  'time_spent_formatted', 'is_completed', 'started_at', 'completed_at', 'last_accessed']

    def get_time_spent_formatted(self, obj):
        hours = obj.total_time_spent_seconds // 3600
        minutes = (obj.total_time_spent_seconds % 3600) // 60
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"

    def __init__(self, *args, **kwargs):
        super(CourseProgressSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2


class DailyLearningActivitySerializer(serializers.ModelSerializer):
    time_in_minutes = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = models.DailyLearningActivity
        fields = ['id', 'student', 'date', 'total_time_seconds', 'time_in_minutes',
                  'lessons_completed', 'quizzes_attempted', 'courses_accessed']

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Achievement
        fields = ['id', 'name', 'description', 'icon', 'achievement_type',
                  'requirement_value', 'points', 'is_active']


class StudentAchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.StudentAchievement
        fields = ['id', 'student', 'achievement', 'earned_at']

    def __init__(self, *args, **kwargs):
        super(StudentAchievementSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2


class EnhancedStudentDashboardSerializer(serializers.Serializer):
    """Comprehensive serializer for enhanced student dashboard"""
    # Basic stats
    enrolled_courses = serializers.IntegerField()
    favorite_courses = serializers.IntegerField()
    
    # Enhanced stats
    total_learning_time_seconds = serializers.IntegerField()
    total_learning_time_formatted = serializers.CharField()
    courses_completed = serializers.IntegerField()
    courses_in_progress = serializers.IntegerField()
    overall_progress_percentage = serializers.IntegerField()
    
    # Weekly goal
    weekly_goal = serializers.DictField()
    
    # Recent activity
    recent_courses = serializers.ListField()
    recent_achievements = serializers.ListField()
    
    # Learning path progress
    active_learning_paths = serializers.ListField()
    
    # Activity chart data (last 7 days)
    activity_chart_data = serializers.ListField()


# ==================== ENHANCED TEACHER DASHBOARD SERIALIZERS ====================

class TeacherStudentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_profile_img = serializers.ImageField(source='student.profile_img', read_only=True)
    time_ago = serializers.SerializerMethodField()
    enrolled_courses = serializers.SerializerMethodField()
    enrolled_course_count = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = models.TeacherStudent
        fields = ['id', 'teacher', 'student', 'student_name', 'student_email', 
                  'student_profile_img', 'instrument', 'level', 'status', 
                  'progress_percentage', 'last_active', 'time_ago', 'notes', 'assigned_at',
                  'enrolled_courses', 'enrolled_course_count']
    
    def get_progress_percentage(self, obj):
        """Calculate real average progress from the student's enrollments under this teacher"""
        enrollments = models.StudentCourseEnrollment.objects.filter(
            student=obj.student,
            course__teacher=obj.teacher
        )
        if not enrollments.exists():
            return 0
        
        total_progress = 0
        count = 0
        for enrollment in enrollments:
            # First try to get progress from CourseProgress (most accurate)
            course_progress = models.CourseProgress.objects.filter(
                student=obj.student,
                course=enrollment.course
            ).first()
            if course_progress:
                total_progress += course_progress.progress_percentage
            else:
                # Fallback to enrollment's progress_percent
                total_progress += enrollment.progress_percent
            count += 1
        
        return round(total_progress / count) if count > 0 else 0
    
    def get_enrolled_courses(self, obj):
        """Get courses this student is enrolled in under this teacher"""
        enrollments = models.StudentCourseEnrollment.objects.filter(
            student=obj.student,
            course__teacher=obj.teacher
        ).select_related('course')
        
        courses = []
        for e in enrollments:
            # Get real progress from CourseProgress
            course_progress = models.CourseProgress.objects.filter(
                student=obj.student,
                course=e.course
            ).first()
            real_progress = course_progress.progress_percentage if course_progress else e.progress_percent
            
            courses.append({
                'enrollment_id': e.id,
                'course_id': e.course.id,
                'course_title': e.course.title,
                'progress_percent': real_progress,
                'enrolled_time': e.enrolled_time.strftime('%Y-%m-%d'),
                'is_active': e.is_active,
            })
        return courses
    
    def get_enrolled_course_count(self, obj):
        return models.StudentCourseEnrollment.objects.filter(
            student=obj.student,
            course__teacher=obj.teacher
        ).count()

    def get_time_ago(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.last_active
        
        if diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff < timedelta(days=2):
            return "1 day ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days} days ago"
        else:
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"

    def __init__(self, *args, **kwargs):
        super(TeacherStudentSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class TeacherSessionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_profile_img = serializers.ImageField(source='student.profile_img', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    teacher_profile_img = serializers.ImageField(source='teacher.profile_img', read_only=True)
    formatted_time = serializers.SerializerMethodField()
    actual_duration_minutes = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = models.TeacherSession
        fields = ['id', 'teacher', 'student', 'student_name', 'student_profile_img',
                  'teacher_name', 'teacher_profile_img',
                  'title', 'description', 'scheduled_date', 'scheduled_time', 
                  'formatted_time', 'duration_minutes', 'status', 'meeting_link', 
                  'notes', 'session_type', 'room_name', 'is_live', 'started_at',
                  'ended_at', 'recording_url', 'actual_duration_minutes',
                  'created_at', 'updated_at']

    def get_formatted_time(self, obj):
        return obj.scheduled_time.strftime("%H:%M")

    def __init__(self, *args, **kwargs):
        super(TeacherSessionSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class AudioMessageSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    teacher_profile_img = serializers.ImageField(source='teacher.profile_img', read_only=True)
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_profile_img = serializers.ImageField(source='student.profile_img', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True, allow_null=True)
    duration_formatted = serializers.CharField(read_only=True)
    file_size_formatted = serializers.CharField(read_only=True)
    
    class Meta:
        model = models.AudioMessage
        fields = ['id', 'teacher', 'student', 'course', 'title', 'audio_file',
                  'duration_seconds', 'duration_formatted', 'file_size_formatted',
                  'is_read', 'read_at', 'teacher_name', 'teacher_profile_img',
                  'student_name', 'student_profile_img', 'course_title',
                  'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        # Ensure audio_file URL uses HTTPS if the request came via HTTPS (or via proxy)
        if request and data.get('audio_file'):
            forwarded_proto = request.META.get('HTTP_X_FORWARDED_PROTO', '')
            if forwarded_proto == 'https' or request.is_secure():
                data['audio_file'] = data['audio_file'].replace('http://', 'https://')
        return data


class TeacherActivitySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_profile_img = serializers.ImageField(source='student.profile_img', read_only=True)
    time_ago = serializers.CharField(read_only=True)
    icon_type = serializers.SerializerMethodField()
    
    class Meta:
        model = models.TeacherActivity
        fields = ['id', 'teacher', 'student', 'student_name', 'student_profile_img',
                  'activity_type', 'target_name', 'target_id', 'target_type',
                  'description', 'time_ago', 'icon_type', 'created_at']

    def get_icon_type(self, obj):
        icon_map = {
            'lesson_completed': 'check',
            'course_started': 'play',
            'comment_added': 'comment',
            'material_downloaded': 'download',
            'session_attended': 'calendar',
        }
        return icon_map.get(obj.activity_type, 'default')


class LessonSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.title', read_only=True)
    duration_formatted = serializers.CharField(read_only=True)
    materials_count = serializers.SerializerMethodField()
    
    class Meta:
        model = models.Lesson
        fields = ['id', 'teacher', 'category', 'category_name', 'title', 
                  'description', 'featured_img', 'difficulty', 'duration_minutes',
                  'duration_formatted', 'module_count', 'materials_count',
                  'is_published', 'created_at', 'updated_at']

    def get_materials_count(self, obj):
        return obj.materials.count()

    def __init__(self, *args, **kwargs):
        super(LessonSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class LessonMaterialSerializer(serializers.ModelSerializer):
    file_size_formatted = serializers.CharField(read_only=True)
    
    class Meta:
        model = models.LessonMaterial
        fields = ['id', 'lesson', 'title', 'material_type', 'file', 
                  'file_size', 'file_size_formatted', 'duration_seconds', 
                  'order', 'created_at']


class TeacherDashboardMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TeacherDashboardMetrics
        fields = ['total_students', 'active_lessons', 'completion_rate',
                  'students_change_percent', 'lessons_change_percent', 
                  'completion_change_percent', 'last_calculated']


class TeacherOverviewSerializer(serializers.Serializer):
    """Comprehensive serializer for teacher dashboard overview"""
    # Teacher info
    teacher_id = serializers.IntegerField()
    teacher_name = serializers.CharField()
    teacher_profile_img = serializers.CharField()
    
    # Metrics
    total_students = serializers.IntegerField()
    active_lessons = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    
    # Trends
    students_trend = serializers.FloatField()
    students_trend_direction = serializers.CharField()
    lessons_trend = serializers.FloatField()
    lessons_trend_direction = serializers.CharField()
    completion_trend = serializers.FloatField()
    completion_trend_direction = serializers.CharField()
    
    # Recent activity (last 10)
    recent_activities = TeacherActivitySerializer(many=True)
    
    # Upcoming sessions (next 5)
    upcoming_sessions = TeacherSessionSerializer(many=True)


# ==================== SUBSCRIPTION SERIALIZERS ====================

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features_list = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()
    allowed_teachers_details = serializers.SerializerMethodField()
    allowed_categories_details = serializers.SerializerMethodField()
    allowed_teachers = serializers.SerializerMethodField()
    
    class Meta:
        model = models.SubscriptionPlan
        fields = ['id', 'name', 'description', 'duration', 'price', 'discount_price', 
                  'access_level', 'max_courses', 'max_lessons', 'lessons_per_week', 
                  'lessons_per_day', 'features', 'features_list', 'final_price', 
                  'status', 'is_featured', 'can_download',
                  'can_access_live_sessions', 'max_live_sessions_per_month',
                  'max_audio_messages_per_month', 'priority_support',
                  'allowed_teachers', 'allowed_teachers_details',
                  'allowed_categories', 'allowed_categories_details',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'features_list', 'final_price',
                            'allowed_teachers_details', 'allowed_categories_details', 'allowed_teachers']
    
    def validate(self, data):
        """Validate and log validation errors"""
        print('=' * 50)
        print('SUBSCRIPTION PLAN VALIDATION')
        print('=' * 50)
        print(f'Data being validated: {data}')
        return data
    
    def get_features_list(self, obj):
        return obj.get_features_list()
    
    def get_final_price(self, obj):
        return str(obj.get_final_price())
    
    def get_allowed_teachers(self, obj):
        """Return full teacher details for allowed teachers"""
        teachers = obj.allowed_teachers.all()
        if not teachers.exists():
            return []  # Empty means all teachers allowed
        return [{'id': t.id, 'full_name': t.full_name, 'email': t.email} for t in teachers]
    
    def get_allowed_teachers_details(self, obj):
        teachers = obj.allowed_teachers.all()
        if not teachers.exists():
            return []  # Empty means all teachers allowed
        return [{'id': t.id, 'name': t.full_name} for t in teachers[:20]]
    
    def get_allowed_categories_details(self, obj):
        categories = obj.allowed_categories.all()
        if not categories.exists():
            return []  # Empty means all categories allowed
        return [{'id': c.id, 'title': c.title} for c in categories]


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    student_details = serializers.SerializerMethodField()
    assigned_teacher_details = serializers.SerializerMethodField()
    is_active_status = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    can_access_course_status = serializers.SerializerMethodField()
    can_access_lesson_status = serializers.SerializerMethodField()
    usage_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = models.Subscription
        fields = ['id', 'student', 'student_details', 'plan', 'plan_details', 
                  'assigned_teacher', 'assigned_teacher_details', 'status', 
                  'price_paid', 'is_paid', 'payment_date', 'start_date', 'end_date', 
                  'activated_at', 'cancelled_at', 'courses_accessed', 'lessons_accessed', 
                  'current_week_lessons', 'lessons_used_this_month', 'lessons_used_today',
                  'last_reset_date', 'last_daily_reset', 'last_weekly_reset',
                  'auto_renew', 'is_active_status', 'days_remaining', 
                  'can_access_course_status', 'can_access_lesson_status', 
                  'usage_summary', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'activated_at', 'cancelled_at']
    
    def get_student_details(self, obj):
        if not obj.student:
            return None
        return {
            'id': obj.student.id,
            'fullname': obj.student.fullname,
            'email': obj.student.email,
            'profile_img': obj.student.profile_img.url if obj.student.profile_img else None
        }
    
    def get_assigned_teacher_details(self, obj):
        if not obj.assigned_teacher:
            return None
        return {
            'id': obj.assigned_teacher.id,
            'full_name': obj.assigned_teacher.full_name,
            'email': obj.assigned_teacher.email,
            'profile_img': obj.assigned_teacher.profile_img.url if obj.assigned_teacher.profile_img else None
        }
    
    def get_is_active_status(self, obj):
        return obj.is_active_and_paid()
    
    def get_days_remaining(self, obj):
        return obj.days_remaining()
    
    def get_can_access_course_status(self, obj):
        can_access, msg = obj.can_access_course()
        return {'can_access': can_access, 'message': msg}
    
    def get_can_access_lesson_status(self, obj):
        can_access, msg = obj.can_access_lesson()
        return {'can_access': can_access, 'message': msg}
    
    def get_usage_summary(self, obj):
        return obj.get_usage_summary()


class SubscriptionHistorySerializer(serializers.ModelSerializer):
    old_plan_details = SubscriptionPlanSerializer(source='old_plan', read_only=True)
    new_plan_details = SubscriptionPlanSerializer(source='new_plan', read_only=True)
    
    class Meta:
        model = models.SubscriptionHistory
        fields = ['id', 'subscription', 'action', 'old_status', 'new_status', 
                  'old_plan', 'old_plan_details', 'new_plan', 'new_plan_details', 
                  'notes', 'changed_by', 'created_at']
        read_only_fields = ['created_at']


# ==================== AUDIT LOG SERIALIZERS ====================

class UploadLogSerializer(serializers.ModelSerializer):
    user_display = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = models.UploadLog
        fields = ['id', 'teacher', 'student', 'admin', 'user_display', 'file_name', 'file_type', 
                  'file_size', 'file_size_display', 'upload_type', 'content_type', 'object_id',
                  'status', 'error_message', 'file_path', 'ip_address', 'created_at', 'completed_at']
        read_only_fields = ['created_at', 'completed_at']
    
    def get_user_display(self, obj):
        return obj.get_user_display()
    
    def get_file_size_display(self, obj):
        """Convert bytes to human readable format"""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.2f} {unit}"
            size /= 1024
        return f"{size:.2f} TB"


class PaymentLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    subscription_plan_name = serializers.CharField(source='subscription_plan.name', read_only=True)
    subscription_details = SubscriptionSerializer(source='subscription', read_only=True)
    
    class Meta:
        model = models.PaymentLog
        fields = ['id', 'student', 'student_name', 'subscription', 'subscription_plan', 
                  'subscription_plan_name', 'subscription_details', 'transaction_id', 
                  'payment_type', 'status', 'payment_method', 'amount', 'currency', 
                  'tax_amount', 'discount_amount', 'final_amount', 'receipt_url', 
                  'invoice_number', 'error_message', 'error_code', 'user_email', 
                  'user_ip_address', 'created_at', 'completed_at']
        read_only_fields = ['created_at', 'completed_at']


class AccessLogSerializer(serializers.ModelSerializer):
    user_display = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course.title', read_only=True, allow_null=True)
    lesson_name = serializers.CharField(source='lesson.title', read_only=True, allow_null=True)
    student_name = serializers.CharField(source='student.fullname', read_only=True, allow_null=True)
    
    class Meta:
        model = models.AccessLog
        fields = ['id', 'teacher', 'student', 'admin', 'user_display', 'access_type', 
                  'course', 'course_name', 'lesson', 'lesson_name', 'subscription', 
                  'was_allowed', 'denial_reason', 'duration_seconds', 'ip_address', 
                  'student_name', 'created_at']
        read_only_fields = ['created_at']
    
    def get_user_display(self, obj):
        return obj.get_user_display()


# ==================== SCHOOL DASHBOARD SERIALIZERS ====================

class SchoolUserSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = models.SchoolUser
        fields = ['id', 'school', 'school_name', 'email', 'password', 'is_active', 
                  'last_login', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True},
        }


class SchoolDashboardStatsSerializer(serializers.Serializer):
    """Serializer for school dashboard statistics"""
    total_teachers = serializers.IntegerField()
    total_students = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_groups = serializers.IntegerField()
    total_lesson_assignments = serializers.IntegerField()
    school_name = serializers.CharField()
    school_status = serializers.CharField()


class GroupClassSerializer(serializers.ModelSerializer):
    total_teachers = serializers.IntegerField(read_only=True)
    total_students = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = models.GroupClass
        fields = ['id', 'school', 'name', 'description', 'schedule', 'max_students',
                  'is_active', 'total_teachers', 'total_students', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super(GroupClassSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class GroupClassTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.GroupClassTeacher
        fields = ['id', 'group_class', 'teacher', 'assigned_at']

    def __init__(self, *args, **kwargs):
        super(GroupClassTeacherSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2


class GroupClassStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.GroupClassStudent
        fields = ['id', 'group_class', 'student', 'assigned_at']

    def __init__(self, *args, **kwargs):
        super(GroupClassStudentSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2


class LessonAssignmentSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    student_name = serializers.CharField(source='student.fullname', read_only=True, allow_null=True)
    group_name = serializers.CharField(source='group_class.name', read_only=True, allow_null=True)
    
    class Meta:
        model = models.LessonAssignment
        fields = ['id', 'school', 'lesson', 'lesson_title', 'assignment_type',
                  'student', 'student_name', 'group_class', 'group_name',
                  'due_date', 'audio_required', 'max_points', 'notes', 'assigned_at']

    def __init__(self, *args, **kwargs):
        super(LessonAssignmentSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class LessonAssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignment_lesson_title = serializers.CharField(source='assignment.lesson.title', read_only=True)
    assignment_max_points = serializers.IntegerField(source='assignment.max_points', read_only=True)
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.full_name', read_only=True)

    class Meta:
        model = models.LessonAssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_lesson_title', 'assignment_max_points',
            'student', 'student_name', 'audio_file', 'submission_notes',
            'points_awarded', 'teacher_feedback', 'graded_by', 'graded_by_name',
            'graded_at', 'submitted_at', 'updated_at'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and data.get('audio_file'):
            forwarded_proto = request.META.get('HTTP_X_FORWARDED_PROTO', '')
            if forwarded_proto == 'https' or request.is_secure():
                data['audio_file'] = data['audio_file'].replace('http://', 'https://')
        return data


class StudentLessonAssignmentSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    submission = serializers.SerializerMethodField()

    class Meta:
        model = models.LessonAssignment
        fields = [
            'id', 'lesson', 'lesson_title', 'school_name',
            'assignment_type', 'due_date', 'audio_required', 'max_points',
            'notes', 'assigned_at', 'submission'
        ]

    def get_submission(self, obj):
        student_id = self.context.get('student_id')
        if not student_id:
            return None
        submission = obj.submissions.filter(student_id=student_id).first()
        if not submission:
            return None
        return LessonAssignmentSubmissionSerializer(submission, context=self.context).data