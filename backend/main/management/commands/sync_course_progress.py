"""
Management command to sync CourseProgress records with existing enrollments and lesson progress.
This fixes data inconsistency where enrollments exist but CourseProgress records are missing.
"""
from django.core.management.base import BaseCommand
from main import models


class Command(BaseCommand):
    help = 'Sync CourseProgress records with existing enrollments and calculate correct progress'

    def handle(self, *args, **options):
        self.stdout.write('Starting CourseProgress sync...\n')
        
        enrollments = models.StudentCourseEnrollment.objects.all()
        created_count = 0
        updated_count = 0
        
        for enrollment in enrollments:
            student = enrollment.student
            course = enrollment.course
            
            if not student or not course:
                continue
            
            # Calculate total lessons for this course
            total_lessons = 0
            for chapter in course.course_chapters.all():
                total_lessons += chapter.module_lessons.count()
            
            # Count completed lessons for this student in this course
            completed_lessons = models.ModuleLessonProgress.objects.filter(
                student=student,
                lesson__module__course=course,
                is_completed=True
            ).count()
            
            # Calculate progress percentage
            progress_percentage = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
            is_completed = progress_percentage >= 100
            
            # Get or create CourseProgress
            course_progress, created = models.CourseProgress.objects.get_or_create(
                student=student,
                course=course,
                defaults={
                    'enrollment': enrollment,
                    'total_chapters': total_lessons,
                    'completed_chapters': completed_lessons,
                    'progress_percentage': progress_percentage,
                    'is_completed': is_completed
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'  Created: {student.fullname} - {course.title} ({progress_percentage}%)')
            else:
                # Update existing record
                course_progress.enrollment = enrollment
                course_progress.total_chapters = total_lessons
                course_progress.completed_chapters = completed_lessons
                course_progress.progress_percentage = progress_percentage
                course_progress.is_completed = is_completed
                
                if is_completed and not course_progress.completed_at:
                    from django.utils import timezone
                    course_progress.completed_at = timezone.now()
                
                course_progress.save()
                updated_count += 1
                self.stdout.write(f'  Updated: {student.fullname} - {course.title} ({progress_percentage}%)')
        
        self.stdout.write(self.style.SUCCESS(
            f'\nSync complete! Created: {created_count}, Updated: {updated_count}'
        ))
