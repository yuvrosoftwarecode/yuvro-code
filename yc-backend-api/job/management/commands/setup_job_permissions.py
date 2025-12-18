from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, User


class Command(BaseCommand):
    help = 'Set up job application permissions and groups'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-groups',
            action='store_true',
            help='Create the required groups (recruiter, admin, instructor)',
        )
        parser.add_argument(
            '--assign-user',
            type=str,
            help='Username to assign to recruiter group',
        )
        parser.add_argument(
            '--list-users',
            action='store_true',
            help='List all users and their groups',
        )

    def handle(self, *args, **options):
        if options['create_groups']:
            self.create_groups()
        
        if options['assign_user']:
            self.assign_user_to_recruiter(options['assign_user'])
        
        if options['list_users']:
            self.list_users()

    def create_groups(self):
        """Create the required groups"""
        groups = ['recruiter', 'admin', 'instructor']
        
        for group_name in groups:
            group, created = Group.objects.get_or_create(name=group_name)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created group: {group_name}')
                )
            else:
                self.stdout.write(f'Group already exists: {group_name}')

    def assign_user_to_recruiter(self, username):
        """Assign a user to the recruiter group"""
        try:
            user = User.objects.get(username=username)
            recruiter_group, _ = Group.objects.get_or_create(name='recruiter')
            user.groups.add(recruiter_group)
            self.stdout.write(
                self.style.SUCCESS(f'Added user {username} to recruiter group')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User {username} does not exist')
            )

    def list_users(self):
        """List all users and their groups"""
        self.stdout.write('Users and their groups:')
        self.stdout.write('-' * 40)
        
        for user in User.objects.all():
            groups = [g.name for g in user.groups.all()]
            group_str = ', '.join(groups) if groups else 'No groups'
            self.stdout.write(f'{user.username}: {group_str}')