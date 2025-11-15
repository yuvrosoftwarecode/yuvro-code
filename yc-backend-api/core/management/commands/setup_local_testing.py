from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction


class Command(BaseCommand):
    help = "Setup all mandatory data for local testing environment"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before setting up (WARNING: This will delete existing data)",
        )
        parser.add_argument(
            "--skip-migrations",
            action="store_true",
            help="Skip running migrations",
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS("🚀 Setting up local testing environment...\n")
        )

        try:
            # Run migrations first (unless skipped)
            if not options["skip_migrations"]:
                self.stdout.write("📦 Running database migrations...")
                call_command("migrate", verbosity=0)
                self.stdout.write(
                    self.style.SUCCESS("✓ Database migrations completed\n")
                )

            # Setup test users
            self.stdout.write("👥 Setting up test users...")
            if options["clear"]:
                call_command("create_test_users", "--clear", verbosity=1)
            else:
                call_command("create_test_users", verbosity=1)
            self.stdout.write("")

            # Load sample courses
            self.stdout.write("📚 Loading sample course data...")
            if options["clear"]:
                call_command("load_sample_courses", "--clear", verbosity=1)
            else:
                call_command("load_sample_courses", verbosity=1)
            self.stdout.write("")

            # Add any future setup commands here
            # Example:
            # self.stdout.write('🔧 Running additional setup...')
            # call_command('your_future_command', verbosity=1)

            self.stdout.write(
                self.style.SUCCESS(
                    "🎉 Local testing environment setup completed successfully!"
                )
            )

            # Display helpful information
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS("📋 SETUP SUMMARY"))
            self.stdout.write("=" * 60)
            self.stdout.write("✓ Database migrations applied")
            self.stdout.write("✓ Test users created:")
            self.stdout.write("  - admin@yuvro.com (password: admin123)")
            self.stdout.write("  - instructor_ds@yuvro.com (password: instructor123)")
            self.stdout.write(
                "  - instructor_python@yuvro.com (password: instructor123)"
            )
            self.stdout.write("  - recruiter@yuvro.com (password: recruiter123)")
            self.stdout.write("  - student1@gmail.com - Shilpa (password: student123)")
            self.stdout.write("  - student2@gmail.com - Rohith (password: student123)")
            self.stdout.write("✓ Sample courses loaded:")
            self.stdout.write("  - Data Structures and Algorithms Fundamentals (DS101)")
            self.stdout.write("  - Python Programming Complete Course (PY101)")
            self.stdout.write("\n🌐 Your development server is ready!")
            self.stdout.write("   Frontend: http://localhost:3000")
            self.stdout.write("   Backend API: http://localhost:8001")
            self.stdout.write("   Admin Panel: http://localhost:8001/admin")
            self.stdout.write("=" * 60)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error during setup: {str(e)}"))
            raise e
