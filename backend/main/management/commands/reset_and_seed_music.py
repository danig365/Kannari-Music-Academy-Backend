from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import random
from main.models import (
    Admin, School, Teacher, Student, CourseCategory, Course, Chapter,
    StudentCourseEnrollment, CourseRating, StudentFavoriteCourse,
    StudentAssignment, Quiz, QuizQuestions, CourseQuiz, SystemSettings,
    SchoolTeacher, SchoolStudent, SchoolCourse, Subscription, Announcement,
    StudyMaterial, Faq, ModuleLesson, ModuleProgress, ModuleLessonProgress
)


class Command(BaseCommand):
    help = 'Reset database and seed with Music Academy sample data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('🎵 Starting Music Academy Database Reset & Seed...'))

        try:
            # Clear all existing data
            self.stdout.write('Clearing existing data...')
            models_to_clear = [
                ModuleLessonProgress, ModuleProgress, ModuleLesson,
                StudentCourseEnrollment, CourseRating, StudentFavoriteCourse,
                StudentAssignment, CourseQuiz, QuizQuestions, Quiz,
                Chapter, Course, StudyMaterial, CourseCategory,
                SchoolCourse, SchoolStudent, SchoolTeacher,
                Student, Teacher, Announcement, Subscription,
                School, Admin, SystemSettings, Faq
            ]
            
            for model in models_to_clear:
                count = model.objects.all().delete()[0]
                self.stdout.write(f'  ✓ Cleared {count} {model.__name__} records')

            self.stdout.write(self.style.SUCCESS('\n✓ Database cleared!\n'))

            # ==================== SYSTEM SETTINGS ====================
            settings = SystemSettings.objects.create(
                site_name='Harmony Music Academy',
                contact_email='info@harmonymusic.com',
                contact_phone='+1 (555) 123-4567',
                address='123 Melody Lane, Music City, CA 90210',
                maintenance_mode=False,
                allow_registration=True,
                default_language='en',
                timezone='America/Los_Angeles'
            )
            self.stdout.write(self.style.SUCCESS('✓ System Settings created'))

            # ==================== ADMINS ====================
            admin1 = Admin.objects.create(
                full_name='Sarah Anderson',
                email='sarah.anderson@harmonymusic.com',
                password='admin123',
                role='super_admin',
                phone='+1 (555) 123-4567',
                is_active=True
            )
            
            admin2 = Admin.objects.create(
                full_name='Michael Roberts',
                email='michael.roberts@harmonymusic.com',
                password='admin123',
                role='school_admin',
                phone='+1 (555) 123-4568',
                is_active=True
            )
            
            admin3 = Admin.objects.create(
                full_name='Emily Chen',
                email='emily.chen@harmonymusic.com',
                password='admin123',
                role='content_admin',
                phone='+1 (555) 123-4569',
                is_active=True
            )
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {Admin.objects.count()} Admins'))

            # ==================== SCHOOLS ====================
            school1 = School.objects.create(
                name='Harmony Music Academy - Downtown Campus',
                email='downtown@harmonymusic.com',
                phone='+1 (555) 200-1000',
                address='123 Melody Lane, Suite 100',
                city='Los Angeles',
                state='California',
                country='USA',
                website='https://downtown.harmonymusic.com',
                admin=admin2,
                status='active',
                max_teachers=20,
                max_students=200,
                max_courses=50
            )
            
            school2 = School.objects.create(
                name='Harmony Music Academy - Westside Branch',
                email='westside@harmonymusic.com',
                phone='+1 (555) 200-2000',
                address='456 Symphony Drive',
                city='Santa Monica',
                state='California',
                country='USA',
                website='https://westside.harmonymusic.com',
                admin=admin2,
                status='active',
                max_teachers=15,
                max_students=150,
                max_courses=40
            )
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {School.objects.count()} Schools'))

            # ==================== SUBSCRIPTIONS ====================
            Subscription.objects.create(
                school=school1,
                plan='pro',
                status='active',
                price=5999.00,
                start_date=(timezone.now() - timedelta(days=90)).date(),
                end_date=(timezone.now() + timedelta(days=275)).date(),
                auto_renew=True
            )
            
            Subscription.objects.create(
                school=school2,
                plan='basic',
                status='active',
                price=3999.00,
                start_date=(timezone.now() - timedelta(days=60)).date(),
                end_date=(timezone.now() + timedelta(days=305)).date(),
                auto_renew=True
            )
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {Subscription.objects.count()} Subscriptions'))

            # ==================== TEACHERS ====================
            teachers_data = [
                {
                    'full_name': 'Dr. James Harrison',
                    'email': 'james.harrison@harmonymusic.com',
                    'qualification': 'PhD in Music Theory, Julliard School of Music',
                    'mobile_no': '+1 (555) 301-0001',
                    'skills': 'Piano,Music Theory,Composition,Classical Music',
                    'face_url': 'https://facebook.com/jharrison',
                    'insta_url': 'https://instagram.com/jharrison_piano',
                },
                {
                    'full_name': 'Maria Rodriguez',
                    'email': 'maria.rodriguez@harmonymusic.com',
                    'qualification': 'Master of Music in Vocal Performance, Berklee College',
                    'mobile_no': '+1 (555) 301-0002',
                    'skills': 'Vocals,Opera,Jazz,Singing Techniques',
                    'insta_url': 'https://instagram.com/maria_vocals',
                    'you_url': 'https://youtube.com/@mariarodriguez',
                },
                {
                    'full_name': 'David Thompson',
                    'email': 'david.thompson@harmonymusic.com',
                    'qualification': 'Bachelor of Music, Contemporary Guitar Specialist',
                    'mobile_no': '+1 (555) 301-0003',
                    'skills': 'Guitar,Rock,Blues,Music Production',
                    'you_url': 'https://youtube.com/@davidguitar',
                    'web_url': 'https://davidthompsonmusic.com',
                },
                {
                    'full_name': 'Lisa Chen',
                    'email': 'lisa.chen@harmonymusic.com',
                    'qualification': 'Master of Music in Violin Performance, Curtis Institute',
                    'mobile_no': '+1 (555) 301-0004',
                    'skills': 'Violin,Chamber Music,Orchestra,Classical',
                    'insta_url': 'https://instagram.com/lisachen_violin',
                },
                {
                    'full_name': 'Robert Davis',
                    'email': 'robert.davis@harmonymusic.com',
                    'qualification': 'Professional Drummer, 20+ years experience',
                    'mobile_no': '+1 (555) 301-0005',
                    'skills': 'Drums,Percussion,Rhythm,Jazz',
                    'you_url': 'https://youtube.com/@robertdrums',
                },
                {
                    'full_name': 'Sophie Williams',
                    'email': 'sophie.williams@harmonymusic.com',
                    'qualification': 'Master of Music Education, Specialist in Music for Children',
                    'mobile_no': '+1 (555) 301-0006',
                    'skills': 'Music Education,Piano,Theory,Kids Classes',
                },
                {
                    'full_name': 'Carlos Martinez',
                    'email': 'carlos.martinez@harmonymusic.com',
                    'qualification': 'Bachelor of Music in Saxophone, Latin Jazz Expert',
                    'mobile_no': '+1 (555) 301-0007',
                    'skills': 'Saxophone,Jazz,Latin Music,Improvisation',
                    'insta_url': 'https://instagram.com/carlossax',
                },
                {
                    'full_name': 'Amanda Foster',
                    'email': 'amanda.foster@harmonymusic.com',
                    'qualification': 'MA in Music Technology, Certified Audio Engineer',
                    'mobile_no': '+1 (555) 301-0008',
                    'skills': 'Music Production,Audio Engineering,DAW,Mixing',
                    'web_url': 'https://amandafosteraudio.com',
                },
            ]

            teachers = []
            for data in teachers_data:
                teacher = Teacher.objects.create(password='teacher123', **data)
                teachers.append(teacher)
                
                # Assign teachers to schools
                if len(teachers) <= 5:
                    SchoolTeacher.objects.create(school=school1, teacher=teacher)
                else:
                    SchoolTeacher.objects.create(school=school2, teacher=teacher)
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {Teacher.objects.count()} Teachers'))

            # ==================== COURSE CATEGORIES ====================
            categories_data = [
                {
                    'title': 'Piano & Keyboard',
                    'description': 'Learn to play piano from beginner to advanced levels. Master classical pieces, modern songs, and music theory.'
                },
                {
                    'title': 'Guitar',
                    'description': 'Acoustic and electric guitar lessons covering various styles including rock, blues, classical, and jazz.'
                },
                {
                    'title': 'Vocals & Singing',
                    'description': 'Develop your voice with proper techniques, breath control, and performance skills across multiple genres.'
                },
                {
                    'title': 'Drums & Percussion',
                    'description': 'Master rhythm and timing with comprehensive drum lessons from basic beats to advanced techniques.'
                },
                {
                    'title': 'String Instruments',
                    'description': 'Violin, cello, and other string instruments taught by experienced orchestral musicians.'
                },
                {
                    'title': 'Wind Instruments',
                    'description': 'Saxophone, trumpet, flute, and clarinet lessons for all skill levels.'
                },
                {
                    'title': 'Music Theory',
                    'description': 'Understanding the fundamentals of music including notation, harmony, composition, and analysis.'
                },
                {
                    'title': 'Music Production',
                    'description': 'Learn digital audio workstations, mixing, mastering, and modern music production techniques.'
                },
                {
                    'title': 'Jazz Studies',
                    'description': 'Explore the world of jazz including improvisation, composition, and performance.'
                },
                {
                    'title': 'Music for Kids',
                    'description': 'Fun and engaging music lessons specially designed for children ages 4-12.'
                },
            ]

            categories = []
            for data in categories_data:
                category = CourseCategory.objects.create(**data)
                categories.append(category)
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {CourseCategory.objects.count()} Course Categories'))

            # ==================== COURSES ====================
            courses_data = [
                # Piano Courses
                {
                    'category': categories[0],
                    'teacher': teachers[0],
                    'title': 'Piano Fundamentals for Beginners',
                    'description': 'Start your musical journey with this comprehensive piano course. Learn proper hand position, basic notes, scales, and simple songs.',
                    'techs': 'Piano,Music Reading,Scales,Finger Exercises',
                    'course_views': random.randint(500, 2000),
                },
                {
                    'category': categories[0],
                    'teacher': teachers[0],
                    'title': 'Advanced Classical Piano Techniques',
                    'description': 'Master complex classical pieces and advanced techniques. Study works by Bach, Beethoven, Chopin, and more.',
                    'techs': 'Classical Piano,Advanced Technique,Repertoire,Performance',
                    'course_views': random.randint(300, 1500),
                },
                {
                    'category': categories[0],
                    'teacher': teachers[5],
                    'title': 'Jazz Piano Improvisation',
                    'description': 'Learn to improvise on piano with jazz standards, chord voicings, and creative expression.',
                    'techs': 'Jazz Piano,Improvisation,Chord Theory,Standards',
                    'course_views': random.randint(400, 1200),
                },
                
                # Guitar Courses
                {
                    'category': categories[1],
                    'teacher': teachers[2],
                    'title': 'Acoustic Guitar Mastery',
                    'description': 'Complete guitar course from basic chords to fingerstyle techniques and songwriting.',
                    'techs': 'Acoustic Guitar,Chords,Fingerstyle,Strumming',
                    'course_views': random.randint(800, 2500),
                },
                {
                    'category': categories[1],
                    'teacher': teachers[2],
                    'title': 'Electric Guitar - Rock & Blues',
                    'description': 'Shred like a pro! Learn electric guitar techniques, solos, and iconic rock/blues riffs.',
                    'techs': 'Electric Guitar,Rock,Blues,Soloing,Effects',
                    'course_views': random.randint(600, 1800),
                },
                {
                    'category': categories[1],
                    'teacher': teachers[2],
                    'title': 'Classical Guitar Repertoire',
                    'description': 'Study beautiful classical guitar pieces and refine your technique with traditional methods.',
                    'techs': 'Classical Guitar,Fingerpicking,Repertoire,Technique',
                    'course_views': random.randint(300, 1000),
                },
                
                # Vocals Courses
                {
                    'category': categories[2],
                    'teacher': teachers[1],
                    'title': 'Vocal Techniques for Beginners',
                    'description': 'Discover your voice! Learn proper breathing, pitch control, and basic vocal exercises.',
                    'techs': 'Singing,Breathing,Pitch,Warm-ups,Posture',
                    'course_views': random.randint(700, 2200),
                },
                {
                    'category': categories[2],
                    'teacher': teachers[1],
                    'title': 'Opera & Classical Singing',
                    'description': 'Master the art of classical and operatic singing with professional techniques.',
                    'techs': 'Opera,Classical Singing,Bel Canto,Arias',
                    'course_views': random.randint(200, 800),
                },
                {
                    'category': categories[2],
                    'teacher': teachers[1],
                    'title': 'Contemporary Vocal Styles',
                    'description': 'Learn pop, rock, R&B, and contemporary singing techniques for modern performers.',
                    'techs': 'Pop Singing,Rock Vocals,R&B,Modern Techniques',
                    'course_views': random.randint(900, 2800),
                },
                
                # Drums Courses
                {
                    'category': categories[3],
                    'teacher': teachers[4],
                    'title': 'Drumming 101 - Complete Beginner Course',
                    'description': 'Start drumming today! Learn basic beats, rudiments, and coordination exercises.',
                    'techs': 'Drums,Beats,Rudiments,Coordination,Timing',
                    'course_views': random.randint(600, 1900),
                },
                {
                    'category': categories[3],
                    'teacher': teachers[4],
                    'title': 'Advanced Jazz Drumming',
                    'description': 'Take your drumming to the next level with complex jazz patterns and improvisation.',
                    'techs': 'Jazz Drums,Improvisation,Polyrhythms,Swing',
                    'course_views': random.randint(300, 1100),
                },
                {
                    'category': categories[3],
                    'teacher': teachers[4],
                    'title': 'Rock Drumming Power Techniques',
                    'description': 'Master powerful rock beats, fills, and double bass techniques.',
                    'techs': 'Rock Drums,Power,Double Bass,Fills',
                    'course_views': random.randint(500, 1600),
                },
                
                # String Instruments
                {
                    'category': categories[4],
                    'teacher': teachers[3],
                    'title': 'Violin for Beginners',
                    'description': 'Learn proper violin technique, posture, bow control, and your first pieces.',
                    'techs': 'Violin,Bowing,Scales,Posture,Technique',
                    'course_views': random.randint(400, 1300),
                },
                {
                    'category': categories[4],
                    'teacher': teachers[3],
                    'title': 'Advanced Violin Repertoire',
                    'description': 'Study challenging violin concertos and sonatas from the classical repertoire.',
                    'techs': 'Violin,Classical,Concertos,Advanced Technique',
                    'course_views': random.randint(200, 700),
                },
                
                # Wind Instruments
                {
                    'category': categories[5],
                    'teacher': teachers[6],
                    'title': 'Saxophone Fundamentals',
                    'description': 'Learn to play saxophone from scratch including proper embouchure and breath control.',
                    'techs': 'Saxophone,Breathing,Embouchure,Technique',
                    'course_views': random.randint(350, 1100),
                },
                {
                    'category': categories[5],
                    'teacher': teachers[6],
                    'title': 'Jazz Saxophone Improvisation',
                    'description': 'Master jazz improvisation on saxophone with scales, patterns, and creative expression.',
                    'techs': 'Jazz Sax,Improvisation,Bebop,Standards',
                    'course_views': random.randint(300, 900),
                },
                
                # Music Theory
                {
                    'category': categories[6],
                    'teacher': teachers[0],
                    'title': 'Music Theory Essentials',
                    'description': 'Understand the language of music: notes, scales, chords, and harmonic progression.',
                    'techs': 'Theory,Scales,Chords,Harmony,Notation',
                    'course_views': random.randint(1000, 3000),
                },
                {
                    'category': categories[6],
                    'teacher': teachers[0],
                    'title': 'Advanced Music Composition',
                    'description': 'Learn to compose your own music with advanced harmonic concepts and orchestration.',
                    'techs': 'Composition,Orchestration,Harmony,Form',
                    'course_views': random.randint(250, 800),
                },
                
                # Music Production
                {
                    'category': categories[7],
                    'teacher': teachers[7],
                    'title': 'Music Production with Ableton Live',
                    'description': 'Create professional tracks using Ableton Live. Learn recording, mixing, and mastering.',
                    'techs': 'Ableton,Production,Mixing,Mastering,DAW',
                    'course_views': random.randint(800, 2400),
                },
                {
                    'category': categories[7],
                    'teacher': teachers[7],
                    'title': 'Audio Engineering Masterclass',
                    'description': 'Professional audio engineering techniques for recording and mixing music.',
                    'techs': 'Audio Engineering,Recording,Mixing,Compression,EQ',
                    'course_views': random.randint(500, 1500),
                },
                {
                    'category': categories[7],
                    'teacher': teachers[7],
                    'title': 'Electronic Music Production',
                    'description': 'Create electronic music from scratch. Learn synthesis, sampling, and arrangement.',
                    'techs': 'Electronic Music,Synthesis,Sampling,Arrangement',
                    'course_views': random.randint(700, 2100),
                },
                
                # Kids Courses
                {
                    'category': categories[9],
                    'teacher': teachers[5],
                    'title': 'Music Adventures for Kids (Ages 4-7)',
                    'description': 'Fun introduction to music for young children through games, songs, and simple instruments.',
                    'techs': 'Kids Music,Games,Rhythm,Singing,Fun',
                    'course_views': random.randint(600, 1800),
                },
                {
                    'category': categories[9],
                    'teacher': teachers[5],
                    'title': 'Junior Piano Program (Ages 8-12)',
                    'description': 'Structured piano learning program designed specifically for children.',
                    'techs': 'Kids Piano,Learning,Theory,Songs,Practice',
                    'course_views': random.randint(500, 1500),
                },
            ]

            courses = []
            for data in courses_data:
                course = Course.objects.create(**data)
                courses.append(course)
                
                # Assign courses to schools
                if courses.index(course) % 2 == 0:
                    SchoolCourse.objects.create(school=school1, course=course)
                else:
                    SchoolCourse.objects.create(school=school2, course=course)
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {Course.objects.count()} Courses'))

            # ==================== MODULES & LESSONS ====================
            # Add modules and lessons to courses using new structure
            # Structure: Course → Module (Chapter) → ModuleLesson
            
            module_lesson_sets = [
                # Piano Fundamentals - 4 Modules with multiple lessons each
                {
                    'course_index': 0,
                    'modules': [
                        {
                            'title': 'Module 1: Getting Started with Piano',
                            'description': 'Learn the basics of piano including keyboard layout and posture.',
                            'lessons': [
                                {'title': 'Welcome to Piano', 'description': 'Introduction to the course and what you will learn.', 'type': 'video', 'duration': 300},
                                {'title': 'Parts of the Piano', 'description': 'Understanding the keyboard, pedals, and anatomy.', 'type': 'video', 'duration': 420},
                                {'title': 'Proper Sitting Posture', 'description': 'How to sit correctly for optimal playing.', 'type': 'video', 'duration': 360},
                                {'title': 'Piano Basics PDF Guide', 'description': 'Downloadable guide with diagrams.', 'type': 'pdf', 'duration': 0},
                            ]
                        },
                        {
                            'title': 'Module 2: First Notes and Scales',
                            'description': 'Start playing your first notes and learn the C major scale.',
                            'lessons': [
                                {'title': 'Finding Middle C', 'description': 'Locate and play middle C confidently.', 'type': 'video', 'duration': 480},
                                {'title': 'The White Keys', 'description': 'Learn all the white key names and positions.', 'type': 'video', 'duration': 540},
                                {'title': 'C Major Scale', 'description': 'Play your first complete scale.', 'type': 'video', 'duration': 600},
                                {'title': 'Scale Practice Track', 'description': 'Audio backing track for scale practice.', 'type': 'audio', 'duration': 180},
                            ]
                        },
                        {
                            'title': 'Module 3: Reading Music',
                            'description': 'Introduction to music notation and reading sheet music.',
                            'lessons': [
                                {'title': 'The Musical Staff', 'description': 'Understanding lines and spaces.', 'type': 'video', 'duration': 420},
                                {'title': 'Treble and Bass Clef', 'description': 'Learn both clefs used in piano.', 'type': 'video', 'duration': 480},
                                {'title': 'Note Values and Rhythm', 'description': 'Whole, half, quarter notes and more.', 'type': 'video', 'duration': 540},
                                {'title': 'Music Notation Cheat Sheet', 'description': 'Quick reference PDF.', 'type': 'pdf', 'duration': 0},
                            ]
                        },
                        {
                            'title': 'Module 4: Your First Songs',
                            'description': 'Put it all together and play complete songs.',
                            'lessons': [
                                {'title': 'Mary Had a Little Lamb', 'description': 'Your first complete song!', 'type': 'video', 'duration': 600},
                                {'title': 'Twinkle Twinkle Little Star', 'description': 'A beloved classic melody.', 'type': 'video', 'duration': 540},
                                {'title': 'Both Hands Together', 'description': 'Coordinating left and right hands.', 'type': 'video', 'duration': 720},
                                {'title': 'Practice Tips', 'description': 'How to practice effectively.', 'type': 'video', 'duration': 360},
                            ]
                        },
                    ]
                },
                # Acoustic Guitar Mastery
                {
                    'course_index': 3,
                    'modules': [
                        {
                            'title': 'Module 1: Guitar Fundamentals',
                            'description': 'Getting started with your acoustic guitar.',
                            'lessons': [
                                {'title': 'Parts of the Guitar', 'description': 'Learn every part of your instrument.', 'type': 'video', 'duration': 360},
                                {'title': 'How to Hold the Guitar', 'description': 'Proper posture and hand position.', 'type': 'video', 'duration': 420},
                                {'title': 'Tuning Your Guitar', 'description': 'Using a tuner and tuning by ear.', 'type': 'video', 'duration': 480},
                            ]
                        },
                        {
                            'title': 'Module 2: Essential Chords',
                            'description': 'Learn the most important chords for beginners.',
                            'lessons': [
                                {'title': 'C Major Chord', 'description': 'Your first chord shape.', 'type': 'video', 'duration': 420},
                                {'title': 'G Major Chord', 'description': 'One of the most used chords.', 'type': 'video', 'duration': 420},
                                {'title': 'D Major Chord', 'description': 'Complete the three-chord trick.', 'type': 'video', 'duration': 420},
                                {'title': 'Chord Transition Practice', 'description': 'Switching between chords smoothly.', 'type': 'video', 'duration': 600},
                                {'title': 'Chord Chart PDF', 'description': 'Printable chord diagrams.', 'type': 'pdf', 'duration': 0},
                            ]
                        },
                        {
                            'title': 'Module 3: Strumming Patterns',
                            'description': 'Master rhythm and strumming techniques.',
                            'lessons': [
                                {'title': 'Basic Downstrokes', 'description': 'The foundation of strumming.', 'type': 'video', 'duration': 360},
                                {'title': 'Up and Down Strumming', 'description': 'Adding upstrokes to your playing.', 'type': 'video', 'duration': 480},
                                {'title': 'Popular Strumming Patterns', 'description': 'Patterns used in hit songs.', 'type': 'video', 'duration': 540},
                                {'title': 'Strumming Practice Tracks', 'description': 'Play along audio tracks.', 'type': 'audio', 'duration': 300},
                            ]
                        },
                    ]
                },
                # Vocal Techniques
                {
                    'course_index': 6,
                    'modules': [
                        {
                            'title': 'Module 1: Understanding Your Voice',
                            'description': 'Learn how your voice works and discover your range.',
                            'lessons': [
                                {'title': 'Vocal Anatomy', 'description': 'How your voice produces sound.', 'type': 'video', 'duration': 480},
                                {'title': 'Finding Your Range', 'description': 'Discover your vocal range and type.', 'type': 'video', 'duration': 420},
                                {'title': 'Vocal Health Tips', 'description': 'Keeping your voice healthy.', 'type': 'video', 'duration': 360},
                            ]
                        },
                        {
                            'title': 'Module 2: Breathing Techniques',
                            'description': 'Master the breathing that powers great singing.',
                            'lessons': [
                                {'title': 'Diaphragmatic Breathing', 'description': 'The proper way to breathe for singing.', 'type': 'video', 'duration': 540},
                                {'title': 'Breath Control Exercises', 'description': 'Build your lung capacity and control.', 'type': 'video', 'duration': 480},
                                {'title': 'Breathing Practice Audio', 'description': 'Guided breathing exercises.', 'type': 'audio', 'duration': 600},
                            ]
                        },
                        {
                            'title': 'Module 3: Warm-ups and Exercises',
                            'description': 'Essential daily vocal exercises.',
                            'lessons': [
                                {'title': 'Daily Warm-up Routine', 'description': 'Start every practice session right.', 'type': 'video', 'duration': 600},
                                {'title': 'Scales and Arpeggios', 'description': 'Vocal agility exercises.', 'type': 'video', 'duration': 480},
                                {'title': 'Warm-up Audio Track', 'description': 'Follow along with piano.', 'type': 'audio', 'duration': 480},
                                {'title': 'Vocal Exercise PDF', 'description': 'Sheet music for exercises.', 'type': 'pdf', 'duration': 0},
                            ]
                        },
                    ]
                },
            ]

            modules_created = 0
            lessons_created = 0
            
            for course_modules in module_lesson_sets:
                if course_modules['course_index'] < len(courses):
                    course = courses[course_modules['course_index']]
                    
                    for module_order, module_data in enumerate(course_modules['modules']):
                        module = Chapter.objects.create(
                            course=course,
                            title=module_data['title'],
                            description=module_data['description'],
                            order=module_order
                        )
                        modules_created += 1
                        
                        for lesson_order, lesson_data in enumerate(module_data['lessons']):
                            ModuleLesson.objects.create(
                                module=module,
                                title=lesson_data['title'],
                                description=lesson_data['description'],
                                content_type=lesson_data['type'],
                                file='lesson_content/sample.mp4',  # Placeholder file path
                                duration_seconds=lesson_data['duration'],
                                order=lesson_order
                            )
                            lessons_created += 1
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {modules_created} Modules with {lessons_created} Lessons'))

            # ==================== STUDENTS ====================
            students_data = [
                ('Emma Thompson', 'emma.thompson@email.com', 'emmathompson', 'Piano,Classical Music'),
                ('Noah Williams', 'noah.williams@email.com', 'noahwilliams', 'Guitar,Rock Music'),
                ('Olivia Martinez', 'olivia.martinez@email.com', 'oliviamartinez', 'Vocals,Pop Music'),
                ('Liam Johnson', 'liam.johnson@email.com', 'liamjohnson', 'Drums,Jazz'),
                ('Ava Brown', 'ava.brown@email.com', 'avabrown', 'Violin,Classical Music'),
                ('Ethan Davis', 'ethan.davis@email.com', 'ethandavis', 'Guitar,Blues'),
                ('Sophia Garcia', 'sophia.garcia@email.com', 'sophiagarcia', 'Piano,Jazz'),
                ('Mason Rodriguez', 'mason.rodriguez@email.com', 'masonrodriguez', 'Saxophone,Jazz'),
                ('Isabella Wilson', 'isabella.wilson@email.com', 'isabellawilson', 'Vocals,Opera'),
                ('Lucas Anderson', 'lucas.anderson@email.com', 'lucasanderson', 'Drums,Rock'),
                ('Mia Taylor', 'mia.taylor@email.com', 'miataylor', 'Piano,Music Theory'),
                ('Alexander Thomas', 'alex.thomas@email.com', 'alexthomas', 'Guitar,Classical'),
                ('Charlotte Lee', 'charlotte.lee@email.com', 'charlottelee', 'Vocals,Contemporary'),
                ('Benjamin White', 'ben.white@email.com', 'benwhite', 'Music Production'),
                ('Amelia Harris', 'amelia.harris@email.com', 'ameliaharris', 'Violin,Chamber Music'),
                ('James Clark', 'james.clark@email.com', 'jamesclark', 'Piano,Rock'),
                ('Harper Lewis', 'harper.lewis@email.com', 'harperlewis', 'Vocals,Jazz'),
                ('Logan Walker', 'logan.walker@email.com', 'loganwalker', 'Drums,Metal'),
                ('Evelyn Hall', 'evelyn.hall@email.com', 'evelynhall', 'Music Theory,Composition'),
                ('Sebastian Young', 'sebastian.young@email.com', 'sebastianyoung', 'Guitar,Fingerstyle'),
            ]

            students = []
            for fullname, email, username, interests in students_data:
                student = Student.objects.create(
                    fullname=fullname,
                    email=email,
                    username=username,
                    password='student123',
                    interseted_categories=interests
                )
                students.append(student)
                
                # Assign students to schools
                if len(students) <= 12:
                    SchoolStudent.objects.create(school=school1, student=student)
                else:
                    SchoolStudent.objects.create(school=school2, student=student)
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {Student.objects.count()} Students'))

            # ==================== ENROLLMENTS ====================
            enrollment_count = 0
            for student in students:
                # Each student enrolls in 2-5 courses
                num_courses = random.randint(2, 5)
                enrolled_courses = random.sample(courses, num_courses)
                
                for course in enrolled_courses:
                    StudentCourseEnrollment.objects.create(
                        course=course,
                        student=student,
                        enrolled_time=timezone.now() - timedelta(days=random.randint(1, 90))
                    )
                    enrollment_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {enrollment_count} Course Enrollments'))

            # ==================== RATINGS ====================
            rating_count = 0
            for enrollment in StudentCourseEnrollment.objects.all():
                # 70% of enrolled students leave a rating
                if random.random() < 0.7:
                    reviews = [
                        "Excellent course! Very clear explanations.",
                        "Great instructor, learned so much!",
                        "Perfect for beginners like me.",
                        "Amazing course content and structure.",
                        "Highly recommend this course!",
                        "The instructor is very knowledgeable.",
                        "Good pace and well organized.",
                        "Love the practical exercises!",
                        "This course exceeded my expectations.",
                        "Clear, concise, and comprehensive.",
                    ]
                    CourseRating.objects.create(
                        course=enrollment.course,
                        student=enrollment.student,
                        rating=random.randint(4, 5),
                        reviews=random.choice(reviews),
                        review_time=timezone.now() - timedelta(days=random.randint(1, 60))
                    )
                    rating_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {rating_count} Course Ratings'))

            # ==================== FAVORITE COURSES ====================
            favorite_count = 0
            for student in students:
                # Each student favorites 1-3 courses
                num_favorites = random.randint(1, 3)
                enrollments = StudentCourseEnrollment.objects.filter(student=student)
                if enrollments.exists():
                    favorite_enrollments = random.sample(list(enrollments), min(num_favorites, enrollments.count()))
                    for enrollment in favorite_enrollments:
                        StudentFavoriteCourse.objects.create(
                            course=enrollment.course,
                            student=student,
                            status=True
                        )
                        favorite_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {favorite_count} Favorite Courses'))

            # ==================== QUIZZES ====================
            quiz_data = [
                ('Music Theory Basics Quiz', 'Test your knowledge of basic music theory concepts.', teachers[0]),
                ('Piano Technique Assessment', 'Evaluate your understanding of piano techniques.', teachers[0]),
                ('Guitar Chord Knowledge', 'Test your guitar chord recognition and progressions.', teachers[2]),
                ('Rhythm and Timing Quiz', 'Check your understanding of rhythm and time signatures.', teachers[4]),
                ('Vocal Technique Assessment', 'Test your knowledge of proper vocal techniques.', teachers[1]),
                ('Jazz Theory Quiz', 'Evaluate your jazz theory knowledge.', teachers[6]),
                ('Music Production Basics', 'Test your understanding of music production concepts.', teachers[7]),
            ]

            quizzes = []
            for title, detail, teacher in quiz_data:
                quiz = Quiz.objects.create(
                    teacher=teacher,
                    title=title,
                    detail=detail
                )
                quizzes.append(quiz)
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {Quiz.objects.count()} Quizzes'))

            # ==================== QUIZ QUESTIONS ====================
            # Add questions to music theory quiz
            theory_questions = [
                ('What is the time signature of a waltz?', '4/4', '3/4', '2/4', '6/8', '3/4'),
                ('How many sharps are in the key of D major?', 'One', 'Two', 'Three', 'Four', 'Two'),
                ('What is a treble clef also known as?', 'Bass clef', 'G clef', 'F clef', 'C clef', 'G clef'),
                ('Which interval consists of 8 semitones?', 'Perfect fifth', 'Minor sixth', 'Major sixth', 'Perfect fourth', 'Minor sixth'),
                ('What does "forte" mean?', 'Soft', 'Loud', 'Medium', 'Very soft', 'Loud'),
            ]
            
            for question_data in theory_questions:
                QuizQuestions.objects.create(
                    quiz=quizzes[0],
                    questions=question_data[0],
                    ans1=question_data[1],
                    ans2=question_data[2],
                    ans3=question_data[3],
                    ans4=question_data[4],
                    right_ans=question_data[5]
                )
            
            # Add questions to guitar quiz
            guitar_questions = [
                ('How many strings does a standard guitar have?', 'Five', 'Six', 'Seven', 'Eight', 'Six'),
                ('What is the open string tuning of a guitar (low to high)?', 'EADGBE', 'DADGAD', 'EBGDAE', 'GDGDGD', 'EADGBE'),
                ('What is a barre chord?', 'Open chord', 'Power chord', 'Chord using one finger across multiple strings', 'Drop D chord', 'Chord using one finger across multiple strings'),
            ]
            
            for question_data in guitar_questions:
                QuizQuestions.objects.create(
                    quiz=quizzes[2],
                    questions=question_data[0],
                    ans1=question_data[1],
                    ans2=question_data[2],
                    ans3=question_data[3],
                    ans4=question_data[4],
                    right_ans=question_data[5]
                )
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {QuizQuestions.objects.count()} Quiz Questions'))

            # ==================== COURSE QUIZZES ====================
            # Assign quizzes to courses
            CourseQuiz.objects.create(teacher=teachers[0], course=courses[0], quiz=quizzes[0])
            CourseQuiz.objects.create(teacher=teachers[0], course=courses[1], quiz=quizzes[1])
            CourseQuiz.objects.create(teacher=teachers[2], course=courses[3], quiz=quizzes[2])
            CourseQuiz.objects.create(teacher=teachers[4], course=courses[9], quiz=quizzes[3])
            CourseQuiz.objects.create(teacher=teachers[1], course=courses[6], quiz=quizzes[4])
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {CourseQuiz.objects.count()} Course-Quiz Assignments'))

            # ==================== ASSIGNMENTS ====================
            assignments_data = [
                ('Practice Major Scales', 'Practice all major scales (C, D, E, F, G, A, B) for 15 minutes daily.'),
                ('Chord Progression Exercise', 'Create a 4-chord progression and practice transitioning smoothly.'),
                ('Vocal Warm-up Routine', 'Complete the vocal warm-up routine demonstrated in class.'),
                ('Rhythm Dictation', 'Transcribe the rhythm patterns from the provided audio files.'),
                ('Compose a Short Melody', 'Write a 16-bar melody using the C major scale.'),
                ('Record a Cover Song', 'Record yourself playing/singing a cover of your favorite song.'),
                ('Analyze a Song Structure', 'Break down the structure of a popular song (verse, chorus, bridge, etc.)'),
            ]
            
            assignment_count = 0
            for student in students[:10]:  # First 10 students get assignments
                # Each student gets 2-4 assignments
                num_assignments = random.randint(2, 4)
                for _ in range(num_assignments):
                    title, detail = random.choice(assignments_data)
                    # Find a teacher from student's enrolled courses
                    enrollments = StudentCourseEnrollment.objects.filter(student=student)
                    if enrollments.exists():
                        teacher = enrollments.first().course.teacher
                        StudentAssignment.objects.create(
                            teacher=teacher,
                            student=student,
                            title=title,
                            detail=detail,
                            student_status=random.choice([True, False]),
                            add_time=timezone.now() - timedelta(days=random.randint(1, 30))
                        )
                        assignment_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {assignment_count} Student Assignments'))

            # ==================== STUDY MATERIALS ====================
            materials_data = [
                ('Piano Finger Exercise Sheet', 'Hanon exercises for daily practice'),
                ('Guitar Chord Chart', 'Complete reference chart of common guitar chords'),
                ('Music Theory Workbook', 'Exercises for understanding scales, chords, and progressions'),
                ('Sight Reading Practice', 'Progressive sight reading exercises for all instruments'),
                ('Jazz Standards Fake Book', 'Lead sheets for popular jazz standards'),
                ('Drum Rudiments Guide', 'Complete guide to basic drum rudiments'),
            ]
            
            material_count = 0
            for i, (title, desc) in enumerate(materials_data):
                if i < len(courses):
                    StudyMaterial.objects.create(
                        course=courses[i],
                        title=title,
                        description=desc,
                        remarks='Download and print for best results'
                    )
                    material_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {material_count} Study Materials'))

            # ==================== ANNOUNCEMENTS ====================
            announcements_data = [
                ('Welcome to Harmony Music Academy!', 'We\'re excited to have you join our musical community. Check out our course offerings and start your musical journey today!', 'all'),
                ('Spring Recital - Save the Date!', 'Our annual spring recital will be held on May 15th at the Downtown Campus. All students are invited to perform!', 'all'),
                ('New Jazz Workshop Added', 'We\'re thrilled to announce a new weekend jazz workshop series starting next month. Limited spots available!', 'all'),
                ('Campus Closure - Holiday', 'Both campuses will be closed for the Thanksgiving holiday from Nov 25-27. Online courses remain available.', 'all'),
                ('Student Showcase Winners', 'Congratulations to our Student Showcase winners! Check out their amazing performances on our YouTube channel.', 'students'),
            ]
            
            for title, content, audience in announcements_data:
                Announcement.objects.create(
                    title=title,
                    content=content,
                    audience=audience,
                    is_active=True,
                    created_by=admin1
                )
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {Announcement.objects.count()} Announcements'))

            # ==================== FAQs ====================
            faqs_data = [
                ('Do I need my own instrument to take lessons?', 'While having your own instrument is beneficial for practice, we have instruments available for use during lessons at both campuses.'),
                ('What age groups do you teach?', 'We offer programs for all ages, from children as young as 4 years old to adult learners. Each program is tailored to the age group.'),
                ('Can I switch teachers if needed?', 'Yes, we understand that finding the right teacher is important. Please contact our admin team to discuss teacher changes.'),
                ('How long are the lessons?', 'Standard lessons are 30, 45, or 60 minutes depending on your program and level. We recommend 45-60 minutes for intermediate and advanced students.'),
                ('Do you offer online lessons?', 'Yes! All our courses are available online, and many of our instructors offer live virtual lessons in addition to pre-recorded content.'),
                ('What if I need to cancel a lesson?', 'We require 24 hours notice for cancellations. With proper notice, you can reschedule your lesson. Our full policy is available in your student portal.'),
                ('Are there performance opportunities?', 'Absolutely! We host recitals twice a year, student showcases quarterly, and informal performance workshops monthly.'),
                ('What payment methods do you accept?', 'We accept credit cards, debit cards, PayPal, and bank transfers. Monthly payment plans are available for annual enrollments.'),
            ]
            
            for question, answer in faqs_data:
                Faq.objects.create(
                    question=question,
                    answer=answer
                )
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created {Faq.objects.count()} FAQs'))

            # ==================== SUMMARY ====================
            self.stdout.write(self.style.SUCCESS('\n' + '='*60))
            self.stdout.write(self.style.SUCCESS('🎵 DATABASE SUCCESSFULLY SEEDED! 🎵'))
            self.stdout.write(self.style.SUCCESS('='*60))
            self.stdout.write(self.style.SUCCESS(f'\n📊 Summary:'))
            self.stdout.write(f'   • {Admin.objects.count()} Admins')
            self.stdout.write(f'   • {School.objects.count()} Schools')
            self.stdout.write(f'   • {Subscription.objects.count()} Subscriptions')
            self.stdout.write(f'   • {Teacher.objects.count()} Teachers')
            self.stdout.write(f'   • {Student.objects.count()} Students')
            self.stdout.write(f'   • {CourseCategory.objects.count()} Course Categories')
            self.stdout.write(f'   • {Course.objects.count()} Courses')
            self.stdout.write(f'   • {Chapter.objects.count()} Chapters')
            self.stdout.write(f'   • {StudentCourseEnrollment.objects.count()} Enrollments')
            self.stdout.write(f'   • {CourseRating.objects.count()} Ratings')
            self.stdout.write(f'   • {StudentFavoriteCourse.objects.count()} Favorites')
            self.stdout.write(f'   • {Quiz.objects.count()} Quizzes')
            self.stdout.write(f'   • {QuizQuestions.objects.count()} Quiz Questions')
            self.stdout.write(f'   • {StudentAssignment.objects.count()} Assignments')
            self.stdout.write(f'   • {StudyMaterial.objects.count()} Study Materials')
            self.stdout.write(f'   • {Announcement.objects.count()} Announcements')
            self.stdout.write(f'   • {Faq.objects.count()} FAQs')
            
            self.stdout.write(self.style.SUCCESS('\n🔐 Login Credentials:'))
            self.stdout.write(f'   Super Admin:')
            self.stdout.write(f'     Email: sarah.anderson@harmonymusic.com')
            self.stdout.write(f'     Password: admin123')
            self.stdout.write(f'\n   Teacher (example):')
            self.stdout.write(f'     Email: james.harrison@harmonymusic.com')
            self.stdout.write(f'     Password: teacher123')
            self.stdout.write(f'\n   Student (example):')
            self.stdout.write(f'     Email: emma.thompson@email.com')
            self.stdout.write(f'     Password: student123')
            
            self.stdout.write(self.style.SUCCESS('\n✅ Database is ready for testing!\n'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error occurred: {str(e)}'))
            raise e
