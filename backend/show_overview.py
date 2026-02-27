#!/usr/bin/env python
"""
Database Overview Script - Shows current state of seeded data
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lms_api.settings')
django.setup()

from main.models import *
from django.db.models import Count, Avg

print('\n🎵 HARMONY MUSIC ACADEMY - DATABASE OVERVIEW 🎵\n')
print('=' * 70)

# Schools
print('\n🏫 SCHOOLS:')
for school in School.objects.all():
    print(f'  • {school.name}')
    print(f'    Status: {school.status} | Teachers: {school.total_teachers()} | Students: {school.total_students()}')
    sub = school.subscriptions.first()
    if sub:
        print(f'    Subscription: {sub.plan} (${sub.price}) - {sub.status}')

# Course Categories
print('\n📚 COURSE CATEGORIES:')
for cat in CourseCategory.objects.all():
    count = Course.objects.filter(category=cat).count()
    print(f'  • {cat.title}: {count} courses')

# Top Rated Courses
print('\n⭐ TOP RATED COURSES:')
courses_with_ratings = []
for course in Course.objects.all():
    rating = course.course_rating()
    if rating:
        courses_with_ratings.append((course, rating, course.total_enrolled_students()))

courses_with_ratings.sort(key=lambda x: x[1], reverse=True)
for course, rating, enrollments in courses_with_ratings[:5]:
    print(f'  • {course.title}')
    print(f'    Rating: {rating:.1f}/5.0 | Enrollments: {enrollments} | Teacher: {course.teacher.full_name}')

# Teachers Overview
print('\n👨‍🏫 TEACHERS:')
for teacher in Teacher.objects.all()[:5]:
    print(f'  • {teacher.full_name}')
    print(f'    Courses: {teacher.total_teacher_course()} | Students: {teacher.total_teacher_students()}')

# Statistics
print('\n📊 OVERALL STATISTICS:')
print(f'  • Total Admins: {Admin.objects.count()}')
print(f'  • Total Teachers: {Teacher.objects.count()}')
print(f'  • Total Students: {Student.objects.count()}')
print(f'  • Total Courses: {Course.objects.count()}')
print(f'  • Total Enrollments: {StudentCourseEnrollment.objects.count()}')
print(f'  • Total Ratings: {CourseRating.objects.count()}')
print(f'  • Total Assignments: {StudentAssignment.objects.count()}')
print(f'  • Total Quizzes: {Quiz.objects.count()}')

print('\n' + '=' * 70)
print('✅ Database is fully populated and ready for testing!')
print('💡 Run: python show_credentials.py for login details')
print('=' * 70 + '\n')
