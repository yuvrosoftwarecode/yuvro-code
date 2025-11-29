from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User,
    Profile,
    SocialLinks,
    Skill,
    Experience,
    Project,
    Education,
    Certification,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""

    list_display = (
        "email",
        "username",
        "first_name",
        "last_name",
        "role",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = ("role", "is_staff", "is_active", "date_joined")
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("-date_joined",)

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name")}),
        ("Role", {"fields": ("role",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important Dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "role", "password1", "password2"),
            },
        ),
    )


# ------------------------------------------------------------
# PROFILE ADMIN
# ------------------------------------------------------------


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """Admin configuration for Profile model."""

    list_display = ("user", "full_name", "title", "location", "gender", "created_at")
    search_fields = ("user__email", "user__username", "full_name", "title", "location")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("user",)}),
        ("Profile Media", {"fields": ("profile_image", "cover_image")}),
        (
            "Personal Info",
            {"fields": ("full_name", "title", "location", "about", "gender")},
        ),
        ("OAuth Info", {"fields": ("google_id",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(SocialLinks)
class SocialLinksAdmin(admin.ModelAdmin):
    list_display = ("profile", "github", "linkedin", "portfolio", "website", "email")
    search_fields = ("profile__user__email", "github", "linkedin", "portfolio")


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("profile", "name", "level", "percentage")
    search_fields = ("name", "profile__user__email")
    list_filter = ("level",)


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ("profile", "company", "role", "duration", "created_at")
    search_fields = ("company", "role", "profile__user__email")
    list_filter = ("created_at",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("profile", "title", "role", "created_at")
    search_fields = ("title", "role", "profile__user__email")
    list_filter = ("created_at",)


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = (
        "profile",
        "institution",
        "degree",
        "field",
        "start_year",
        "end_year",
    )
    search_fields = ("institution", "degree", "field", "profile__user__email")
    list_filter = ("start_year", "end_year")


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ("profile", "name", "issuer", "completion_date")
    search_fields = ("name", "issuer", "profile__user__email")
