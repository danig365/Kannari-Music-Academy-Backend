from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from main.models import (
    Admin, School, Teacher, Student, CourseCategory, Course, Chapter,
    StudentCourseEnrollment, CourseRating, StudentFavoriteCourse,
    StudentAssignment, Quiz, QuizQuestions, CourseQuiz,
    SchoolTeacher, SchoolStudent, SchoolCourse, Subscription,
    SystemSettings
)


class Command(BaseCommand):
    help = 'Seed the database with sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to seed data...'))

        try:
            # Clear existing data (optional)
            # Admin.objects.all().delete()
            
            # 1. Create System Settings
            settings, created = SystemSettings.objects.get_or_create(
                defaults={
                    'site_name': 'Kannari Music Academy',
                    'contact_email': 'support@kannarimusicacademy.com',
                    'contact_phone': '+91 9372575530',
                    'address': 'K.T Marg Road, Vasai Road, Maharashtra, India',
                    'maintenance_mode': False,
                    'allow_registration': True,
                    'default_language': 'en',
                    'timezone': 'Asia/Kolkata'
                }
            )
            self.stdout.write(self.style.SUCCESS(f'✓ System Settings created/updated'))

            # 2. Create Super Admin
            admin, created = Admin.objects.get_or_create(
                email='admin@kannarimusicacademy.com',
                defaults={
                    'full_name': 'Super Admin',
                    'password': 'admin123',
                    'role': 'super_admin',
                    'phone': '+91 9372575530',
                    'is_active': True
                }
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Admin user created: {admin.full_name}'))

            # 3. Create Schools
            schools = []
            school_data = [
                {
                    'name': 'Harmony Academy',
                    'email': 'harmony@school.com',
                    'phone': '+91 9876543210',
                    'city': 'Mumbai',
                    'state': 'Maharashtra',
                    'address': 'Bandra, Mumbai',
                    'status': 'active',
                    'max_teachers': 20,
                    'max_students': 500,
                    'max_courses': 50
                },
                {
                    'name': 'Westside Music',
                    'email': 'westside@school.com',
                    'phone': '+91 9876543211',
                    'city': 'Delhi',
                    'state': 'Delhi',
                    'address': 'New Delhi',
                    'status': 'active',
                    'max_teachers': 15,
                    'max_students': 300,
                    'max_courses': 30
                },
                {
                    'name': 'Tech Institute',
                    'email': 'tech@school.com',
                    'phone': '+91 9876543212',
                    'city': 'Bangalore',
                    'state': 'Karnataka',
                    'address': 'Bangalore',
                    'status': 'trial',
                    'max_teachers': 10,
                    'max_students': 200,
                    'max_courses': 20
                }
            ]

            for data in school_data:
                school, created = School.objects.get_or_create(
                    email=data['email'],
                    defaults={**data, 'admin': admin}
                )
                schools.append(school)
            self.stdout.write(self.style.SUCCESS(f'✓ Created {len(schools)} schools'))

            # 4. Create Teachers
            teachers = []
            teacher_data = [
                {
                    'full_name': 'John Smith',
                    'email': 'john.smith@teacher.com',
                    'password': 'teacher123',
                    'qualification': 'M.A. Music Theory',
                    'mobile_no': '+91 9876543220',
                    'skills': 'Piano,Guitar,Music Theory'
                },
                {
                    'full_name': 'Sarah Johnson',
                    'email': 'sarah.johnson@teacher.com',
                    'password': 'teacher123',
                    'qualification': 'B.Tech Computer Science',
                    'mobile_no': '+91 9876543221',
                    'skills': 'Python,Web Development,Data Science'
                },
                {
                    'full_name': 'Michael Brown',
                    'email': 'michael.brown@teacher.com',
                    'password': 'teacher123',
                    'qualification': 'MBA, Marketing',
                    'mobile_no': '+91 9876543222',
                    'skills': 'Digital Marketing,SEO,Business Strategy'
                },
                {
                    'full_name': 'Emily Davis',
                    'email': 'emily.davis@teacher.com',
                    'password': 'teacher123',
                    'qualification': 'M.A. English Literature',
                    'mobile_no': '+91 9876543223',
                    'skills': 'English,Writing,Literature'
                }
            ]

            for data in teacher_data:
                teacher, created = Teacher.objects.get_or_create(
                    email=data['email'],
                    defaults=data
                )
                teachers.append(teacher)
            self.stdout.write(self.style.SUCCESS(f'✓ Created {len(teachers)} teachers'))

            # 5. Create Course Categories
            categories = []
            category_data = [
                {
                    'title': 'Music',
                    'description': 'Learn various musical instruments and music theory'
                },
                {
                    'title': 'Programming',
                    'description': 'Master programming languages and web development'
                },
                {
                    'title': 'Business',
                    'description': 'Develop business and entrepreneurship skills'
                },
                {
                    'title': 'Language',
                    'description': 'Learn English and other languages'
                },
                {
                    'title': 'Design',
                    'description': 'Graphic design and UI/UX design courses'
                }
            ]

            for data in category_data:
                category, created = CourseCategory.objects.get_or_create(
                    title=data['title'],
                    defaults=data
                )
                categories.append(category)
            self.stdout.write(self.style.SUCCESS(f'✓ Created {len(categories)} course categories'))

            # 6. Create Courses
            courses = []
            course_data = [
                {
                    'category': categories[0],
                    'teacher': teachers[0],
                    'title': 'Piano Fundamentals',
                    'description': 'Learn the basics of piano playing from scratch',
                    'techs': 'Piano,Music Theory,Beginner'
                },
                {
                    'category': categories[0],
                    'teacher': teachers[0],
                    'title': 'Advanced Guitar',
                    'description': 'Master advanced guitar techniques and songs',
                    'techs': 'Guitar,Advanced,Music Theory'
                },
                {
                    'category': categories[1],
                    'teacher': teachers[1],
                    'title': 'Python for Beginners',
                    'description': 'Start your programming journey with Python',
                    'techs': 'Python,Programming,Beginner'
                },
                {
                    'category': categories[1],
                    'teacher': teachers[1],
                    'title': 'Web Development with Django',
                    'description': 'Build professional web applications using Django',
                    'techs': 'Django,Python,Web Development'
                },
                {
                    'category': categories[2],
                    'teacher': teachers[2],
                    'title': 'Digital Marketing Mastery',
                    'description': 'Complete guide to digital marketing strategies',
                    'techs': 'Marketing,SEO,Social Media'
                },
                {
                    'category': categories[3],
                    'teacher': teachers[3],
                    'title': 'English Grammar & Writing',
                    'description': 'Perfect your English grammar and writing skills',
                    'techs': 'English,Grammar,Writing'
                }
            ]

            for data in course_data:
                course, created = Course.objects.get_or_create(
                    title=data['title'],
                    defaults={**data, 'course_views': 0}
                )
                courses.append(course)
            self.stdout.write(self.style.SUCCESS(f'✓ Created {len(courses)} courses'))

            # 7. Create Chapters for each course
            for course in courses[:3]:
                for i in range(1, 4):
                    Chapter.objects.get_or_create(
                        course=course,
                        title=f'{course.title} - Chapter {i}',
                        defaults={
                            'description': f'Chapter {i} content for {course.title}',
                            'remarks': f'Important concepts in chapter {i}'
                        }
                    )
            self.stdout.write(self.style.SUCCESS(f'✓ Created chapters for courses'))

            # 8. Create Students
            students = []
            student_data = [
                {
                    'fullname': 'Alice Kumar',
                    'email': 'alice.kumar@student.com',
                    'password': 'student123',
                    'username': 'alice_kumar',
                    'interseted_categories': 'Music,Programming'
                },
                {
                    'fullname': 'Bob Sharma',
                    'email': 'bob.sharma@student.com',
                    'password': 'student123',
                    'username': 'bob_sharma',
                    'interseted_categories': 'Programming,Business'
                },
                {
                    'fullname': 'Carol Singh',
                    'email': 'carol.singh@student.com',
                    'password': 'student123',
                    'username': 'carol_singh',
                    'interseted_categories': 'Language,Design'
                },
                {
                    'fullname': 'David Patel',
                    'email': 'david.patel@student.com',
                    'password': 'student123',
                    'username': 'david_patel',
                    'interseted_categories': 'Music,Language'
                },
                {
                    'fullname': 'Eve Gupta',
                    'email': 'eve.gupta@student.com',
                    'password': 'student123',
                    'username': 'eve_gupta',
                    'interseted_categories': 'Programming,Design'
                }
            ]

            for data in student_data:
                student, created = Student.objects.get_or_create(
                    email=data['email'],
                    defaults=data
                )
                students.append(student)
            self.stdout.write(self.style.SUCCESS(f'✓ Created {len(students)} students'))

            # 9. Create Course Enrollments
            enrollment_count = 0
            for student in students:
                for course in courses[:4]:
                    StudentCourseEnrollment.objects.get_or_create(
                        student=student,
                        course=course
                    )
                    enrollment_count += 1
            self.stdout.write(self.style.SUCCESS(f'✓ Created {enrollment_count} course enrollments'))

            # 10. Create Course Ratings
            rating_count = 0
            ratings = [4, 5, 3, 4, 5, 3, 4]
            for idx, student in enumerate(students[:3]):
                for course_idx, course in enumerate(courses[:3]):
                    CourseRating.objects.get_or_create(
                        course=course,
                        student=student,
                        defaults={
                            'rating': ratings[(idx + course_idx) % len(ratings)],
                            'reviews': f'Great course! Very informative and well structured.'
                        }
                    )
                    rating_count += 1
            self.stdout.write(self.style.SUCCESS(f'✓ Created {rating_count} course ratings'))

            # 11. Create Favorite Courses
            fav_count = 0
            for student in students:
                for course in courses[::2]:
                    StudentFavoriteCourse.objects.get_or_create(
                        student=student,
                        course=course,
                        defaults={'status': True}
                    )
                    fav_count += 1
            self.stdout.write(self.style.SUCCESS(f'✓ Created {fav_count} favorite courses'))

            # 12. Create Quizzes
            quiz_count = 0
            for teacher in teachers[:2]:
                for i in range(1, 3):
                    quiz, created = Quiz.objects.get_or_create(
                        title=f'{teacher.full_name} Quiz {i}',
                        teacher=teacher,
                        defaults={
                            'detail': f'Test your knowledge on the course topics'
                        }
                    )
                    if created:
                        quiz_count += 1
                        # Add sample questions
                        for q in range(1, 4):
                            QuizQuestions.objects.create(
                                quiz=quiz,
                                questions=f'Question {q} for {quiz.title}?',
                                ans1='Option A',
                                ans2='Option B',
                                ans3='Option C',
                                ans4='Option D',
                                right_ans='Option A'
                            )
            self.stdout.write(self.style.SUCCESS(f'✓ Created {quiz_count} quizzes with questions'))

            # 13. Create Assignments
            assignment_count = 0
            for teacher in teachers:
                for student in students[:3]:
                    StudentAssignment.objects.get_or_create(
                        teacher=teacher,
                        student=student,
                        title=f'Assignment by {teacher.full_name} for {student.fullname}',
                        defaults={
                            'detail': 'Complete this assignment and submit by the due date',
                            'student_status': False
                        }
                    )
                    assignment_count += 1
            self.stdout.write(self.style.SUCCESS(f'✓ Created {assignment_count} assignments'))

            # 14. Create School Relationships
            # Assign teachers to schools
            for school in schools:
                for teacher in teachers[:2]:
                    SchoolTeacher.objects.get_or_create(
                        school=school,
                        teacher=teacher,
                        defaults={'is_active': True}
                    )

            # Assign students to schools
            for school in schools:
                for student in students[:3]:
                    SchoolStudent.objects.get_or_create(
                        school=school,
                        student=student,
                        defaults={'is_active': True}
                    )

            # Assign courses to schools
            for school in schools:
                for course in courses[:3]:
                    SchoolCourse.objects.get_or_create(
                        school=school,
                        course=course,
                        defaults={'is_featured': False}
                    )
            self.stdout.write(self.style.SUCCESS(f'✓ Created school relationships'))

            # 15. Create Subscriptions
            subscription_count = 0
            plans = ['free', 'basic', 'pro', 'enterprise']
            for idx, school in enumerate(schools):
                subscription, created = Subscription.objects.get_or_create(
                    school=school,
                    defaults={
                        'plan': plans[idx],
                        'status': 'active',
                        'price': [0, 99.99, 199.99, 499.99][idx],
                        'start_date': timezone.now().date(),
                        'end_date': (timezone.now() + timedelta(days=365)).date(),
                        'auto_renew': True
                    }
                )
                if created:
                    subscription_count += 1
            self.stdout.write(self.style.SUCCESS(f'✓ Created {subscription_count} subscriptions'))

            self.stdout.write(self.style.SUCCESS('='*50))
            self.stdout.write(self.style.SUCCESS('✓ Database seeding completed successfully!'))
            self.stdout.write(self.style.SUCCESS('='*50))
            
            # Summary
            self.stdout.write(self.style.WARNING('\nData Summary:'))
            self.stdout.write(f'  • Schools: {School.objects.count()}')
            self.stdout.write(f'  • Teachers: {Teacher.objects.count()}')
            self.stdout.write(f'  • Students: {Student.objects.count()}')
            self.stdout.write(f'  • Courses: {Course.objects.count()}')
            self.stdout.write(f'  • Categories: {CourseCategory.objects.count()}')
            self.stdout.write(f'  • Enrollments: {StudentCourseEnrollment.objects.count()}')
            self.stdout.write(f'  • Ratings: {CourseRating.objects.count()}')
            self.stdout.write(f'  • Assignments: {StudentAssignment.objects.count()}')
            self.stdout.write(f'  • Subscriptions: {Subscription.objects.count()}')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            raise
