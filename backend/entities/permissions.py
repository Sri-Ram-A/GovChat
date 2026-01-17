from rest_framework.permissions import BasePermission

class IsAdminUserProfile(BasePermission):
    """Allows access only to users who have an AdminProfile."""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return hasattr(user, "admin_profile")

class IsCitizenUserProfile(BasePermission):
    """Allows access only to users who have a CitizenProfile."""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return hasattr(user, "citizen_profile")

