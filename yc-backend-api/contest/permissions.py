from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrAdmin(BasePermission):
    """
    Allow admins full access.
    Allow recruiters or instructors to access only their own contests.
    Read-only access for others.
    """
    def has_object_permission(self, request, view, obj):
        # safe methods: GET, HEAD, OPTIONS
        if request.method in SAFE_METHODS:
            return True
        
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        return obj.created_by == request.user