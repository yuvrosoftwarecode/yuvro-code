from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from authentication.models import Profile

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test users with different roles for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing test users before creating new ones',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(
                self.style.WARNING('Clearing existing test users...')
            )
            # Clear test users (keep superusers)
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(
                self.style.SUCCESS('Existing test users cleared.')
            )

        self.stdout.write('Creating test users with different roles...')
        
        try:
            # Create Admin User
            admin_user, created = User.objects.get_or_create(
                email='admin@example.com',
                defaults={
                    'username': 'admin_user',
                    'first_name': 'Admin',
                    'last_name': 'User',
                    'role': 'admin',
                    'is_staff': True,
                }
            )
            if created:
                admin_user.set_password('admin123')
                admin_user.save()
                self.stdout.write(f'✓ Created admin user: {admin_user.email}')
            else:
                self.stdout.write(f'- Admin user already exists: {admin_user.email}')
            
            # Create admin profile
            Profile.objects.get_or_create(
                user=admin_user,
                defaults={
                    'bio': 'System Administrator with full access to all features.',
                }
            )
            
            # Create Content Admin User
            content_admin_user, created = User.objects.get_or_create(
                email='content_admin@example.com',
                defaults={
                    'username': 'content_admin',
                    'first_name': 'Content',
                    'last_name': 'Admin',
                    'role': 'admin_content',
                }
            )
            if created:
                content_admin_user.set_password('content123')
                content_admin_user.save()
                self.stdout.write(f'✓ Created content admin user: {content_admin_user.email}')
            else:
                self.stdout.write(f'- Content admin user already exists: {content_admin_user.email}')
            
            # Create content admin profile
            Profile.objects.get_or_create(
                user=content_admin_user,
                defaults={
                    'bio': 'Content Administrator responsible for managing courses and educational content.',
                }
            )
            
            # Create Student Users
            students_data = [
                {
                    'email': 'student1@example.com',
                    'username': 'student1',
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'bio': 'Computer Science student interested in data structures and algorithms.',
                },
                {
                    'email': 'student2@example.com',
                    'username': 'student2',
                    'first_name': 'Jane',
                    'last_name': 'Smith',
                    'bio': 'Software Engineering student learning Python programming.',
                },
                {
                    'email': 'student3@example.com',
                    'username': 'student3',
                    'first_name': 'Mike',
                    'last_name': 'Johnson',
                    'bio': 'Data Science student exploring machine learning and AI.',
                }
            ]
            
            for student_data in students_data:
                student_user, created = User.objects.get_or_create(
                    email=student_data['email'],
                    defaults={
                        'username': student_data['username'],
                        'first_name': student_data['first_name'],
                        'last_name': student_data['last_name'],
                        'role': 'student',
                    }
                )
                if created:
                    student_user.set_password('student123')
                    student_user.save()
                    self.stdout.write(f'✓ Created student user: {student_user.email}')
                else:
                    self.stdout.write(f'- Student user already exists: {student_user.email}')
                
                # Create student profile
                Profile.objects.get_or_create(
                    user=student_user,
                    defaults={
                        'bio': student_data['bio'],
                    }
                )
            
            self.stdout.write(
                self.style.SUCCESS('\nSuccessfully created test users!')
            )
            
            # Display summary
            admin_count = User.objects.filter(role='admin').count()
            content_admin_count = User.objects.filter(role='admin_content').count()
            student_count = User.objects.filter(role='student').count()
            
            self.stdout.write(f'\nUser Summary:')
            self.stdout.write(f'- Admins: {admin_count}')
            self.stdout.write(f'- Content Admins: {content_admin_count}')
            self.stdout.write(f'- Students: {student_count}')
            
            self.stdout.write(f'\nTest Credentials:')
            self.stdout.write(f'Admin: admin@example.com / admin123')
            self.stdout.write(f'Content Admin: content_admin@example.com / content123')
            self.stdout.write(f'Students: student1@example.com / student123 (and student2, student3)')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating test users: {str(e)}')
            )