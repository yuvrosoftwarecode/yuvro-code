from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission class that allows access only to admin users.
    """

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated and request.user.is_admin()
        )


class IsInstructorOrAdmin(permissions.BasePermission):
    """
    Permission class that allows access to instructors and admins.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.can_manage_content()
        )


class IsStudentUser(permissions.BasePermission):
    """
    Permission class that allows access only to student users.
    """

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated and request.user.is_student()
        )


class IsRecruiterUser(permissions.BasePermission):
    """
    Permission class that allows access only to recruiter users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_recruiter()
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission class that allows access to the owner of the object or admin users.
    """

    def has_object_permission(self, request, view, obj):
        # Check if the object has a user field (for user-owned objects)
        if hasattr(obj, "user"):
            return obj.user == request.user or request.user.is_admin()

        # Check if the object is the user itself
        if hasattr(obj, "id") and hasattr(request.user, "id"):
            return obj.id == request.user.id or request.user.is_admin()

        return False


class CanManageContent(permissions.BasePermission):
    """
    Permission class for content management operations.
    Allows content admins and admins to create/update/delete content.
    Students can only read.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for instructors and admins
        return request.user.can_manage_content()


class CanManageUsers(permissions.BasePermission):
    """
    Permission class for user management operations.
    Only admins can manage users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.can_manage_users()
        )
