from django.core.management.base import BaseCommand
from django.db import transaction
from main import models


class Command(BaseCommand):
    help = 'Delete all courses and their related data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion without prompt',
        )

    def handle(self, *args, **options):
        # Ask for confirmation unless --confirm flag is used
        if not options['confirm']:
            response = input(
                "Are you sure you want to delete ALL courses and their related data? "
                "This action cannot be undone. Type 'yes' to confirm: "
            )
            if response.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Operation cancelled.'))
                return

        try:
            with transaction.atomic():
                # Count courses before deletion
                course_count = models.Course.objects.count()
                
                if course_count == 0:
                    self.stdout.write(self.style.WARNING('No courses found to delete.'))
                    return

                self.stdout.write(f'Deleting {course_count} courses and all related data...')

                # Delete in order of dependencies
                enrollment_count = models.StudentCourseEnrollment.objects.count()
                if enrollment_count > 0:
                    self.stdout.write(f'  - Deleting {enrollment_count} course enrollments...')
                    models.StudentCourseEnrollment.objects.all().delete()

                rating_count = models.CourseRating.objects.count()
                if rating_count > 0:
                    self.stdout.write(f'  - Deleting {rating_count} course ratings...')
                    models.CourseRating.objects.all().delete()

                favorite_count = models.StudentFavoriteCourse.objects.count()
                if favorite_count > 0:
                    self.stdout.write(f'  - Deleting {favorite_count} favorite courses...')
                    models.StudentFavoriteCourse.objects.all().delete()

                school_course_count = models.SchoolCourse.objects.count()
                if school_course_count > 0:
                    self.stdout.write(f'  - Deleting {school_course_count} school courses...')
                    models.SchoolCourse.objects.all().delete()

                lesson_progress_count = models.LessonProgress.objects.count()
                if lesson_progress_count > 0:
                    self.stdout.write(f'  - Deleting {lesson_progress_count} lesson progress records...')
                    models.LessonProgress.objects.all().delete()

                course_progress_count = models.CourseProgress.objects.count()
                if course_progress_count > 0:
                    self.stdout.write(f'  - Deleting {course_progress_count} course progress records...')
                    models.CourseProgress.objects.all().delete()

                module_progress_count = models.ModuleProgress.objects.count()
                if module_progress_count > 0:
                    self.stdout.write(f'  - Deleting {module_progress_count} module progress records...')
                    models.ModuleProgress.objects.all().delete()

                module_lesson_progress_count = models.ModuleLessonProgress.objects.count()
                if module_lesson_progress_count > 0:
                    self.stdout.write(f'  - Deleting {module_lesson_progress_count} module lesson progress records...')
                    models.ModuleLessonProgress.objects.all().delete()

                chapter_count = models.Chapter.objects.count()
                if chapter_count > 0:
                    self.stdout.write(f'  - Deleting {chapter_count} chapters...')
                    models.Chapter.objects.all().delete()

                self.stdout.write(f'  - Deleting {course_count} courses...')
                models.Course.objects.all().delete()

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully deleted {course_count} courses and all related data!'
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'Error deleting courses: {str(e)}'
                )
            )
