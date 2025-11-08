# Role-Based Authentication System

This authentication system provides three user roles with different permission levels for the learning management system.

## User Roles

### 1. Student (`student`)
- **Default role** for new user registrations
- Can view courses, topics, and subtopics
- Can create personal notes
- Can take quizzes and solve coding problems
- Cannot create or modify course content

### 2. Content Administrator (`admin_content`)
- Can do everything a student can do
- Can create, update, and delete courses, topics, and subtopics
- Can manage videos, coding problems, and quizzes
- Cannot manage other users or system settings

### 3. Administrator (`admin`)
- **Full system access**
- Can do everything content administrators can do
- Can manage users and assign roles
- Can access admin interface
- Can manage system settings

## JWT Token Claims

JWT tokens include the following custom claims:
- `role`: User's role (student, admin_content, admin)
- `username`: User's username
- `email`: User's email address
- `first_name`: User's first name
- `last_name`: User's last name
- `avatar_url`: Profile avatar URL (if available)

## API Endpoints

### Authentication
- `POST /api/auth/token/` - Obtain JWT token pair (login)
- `POST /api/auth/token/refresh/` - Refresh access token
- `POST /api/auth/register/` - Register new user (student role only)
- `POST /api/auth/logout/` - Logout and blacklist token

### User Management
- `GET /api/auth/user/` - Get current user info
- `GET /api/auth/profile/` - Get/update user profile
- `GET /api/auth/profile/detail/` - Get/update detailed profile

## Permission Classes

The system includes custom permission classes:

### `IsAdminUser`
Allows access only to users with `admin` role.

### `IsContentAdminOrAdmin`
Allows access to users with `admin_content` or `admin` roles.

### `IsStudentUser`
Allows access only to users with `student` role.

### `IsOwnerOrAdmin`
Allows access to the owner of an object or admin users.

### `CanManageContent`
- Read access: All authenticated users
- Write access: Content admins and admins only

### `CanManageUsers`
Allows access only to admin users for user management operations.

## Usage Examples

### Frontend Token Handling
```javascript
// Login and store tokens
const response = await fetch('/api/auth/token/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { access, refresh, user } = await response.json();

// Store tokens and user info
localStorage.setItem('access_token', access);
localStorage.setItem('refresh_token', refresh);
localStorage.setItem('user_role', user.role);

// Use token in requests
const apiResponse = await fetch('/api/courses/', {
  headers: {
    'Authorization': `Bearer ${access}`,
    'Content-Type': 'application/json'
  }
});
```

### Backend Permission Usage
```python
from authentication.permissions import CanManageContent, IsAdminUser

class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManageContent]  # Read for all, write for content admins+
    
class UserManagementView(APIView):
    permission_classes = [IsAdminUser]  # Admin only
```

### Role Checking in Views
```python
def my_view(request):
    user = request.user
    
    if user.is_admin():
        # Admin-specific logic
        pass
    elif user.can_manage_content():
        # Content admin or admin logic
        pass
    elif user.is_student():
        # Student-specific logic
        pass
```

## Test Users

Use the management command to create test users:

```bash
python manage.py create_test_users
```

This creates:
- **Admin**: admin@example.com / admin123
- **Content Admin**: content_admin@example.com / content123
- **Students**: student1@example.com / student123 (and student2, student3)

## Role Assignment

### During Registration
- New users are automatically assigned the `student` role
- Only students can self-register through the API

### Admin Assignment
- Admins can change user roles through:
  - Django admin interface
  - Custom user management endpoints
  - Direct database updates

### Programmatic Assignment
```python
from authentication.models import User

# Change user role
user = User.objects.get(email='user@example.com')
user.role = 'admin_content'
user.save()

# Check permissions
if user.can_manage_content():
    print("User can manage content")
```

## Security Considerations

1. **Role Validation**: All role changes should be validated server-side
2. **Token Security**: Store JWT tokens securely (httpOnly cookies recommended for production)
3. **Permission Checks**: Always verify permissions on the backend, never trust frontend role checks
4. **Token Expiration**: Access tokens expire in 15 minutes by default, refresh tokens in 7 days
5. **Token Blacklisting**: Logout properly blacklists refresh tokens

## Migration Notes

When adding this role system to existing users:
1. All existing users will default to `student` role
2. Manually assign appropriate roles to existing administrators
3. Update any existing permission checks to use the new role system