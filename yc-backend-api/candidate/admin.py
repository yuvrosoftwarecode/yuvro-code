from django.contrib import admin
from .models import CandidateProfile, CandidateSkill, CandidateSearchLog


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_experience_years', 'expected_ctc', 'notice_period', 'is_actively_looking', 'last_active']
    list_filter = ['notice_period', 'is_actively_looking', 'highest_education', 'domain', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'profile__title']
    readonly_fields = ['created_at', 'updated_at', 'last_active']
    
    fieldsets = (
        ('User Info', {
            'fields': ('user', 'profile')
        }),
        ('Experience & Salary', {
            'fields': ('total_experience_years', 'total_experience_months', 'current_ctc', 'expected_ctc', 'currency')
        }),
        ('Availability', {
            'fields': ('notice_period', 'available_from', 'is_actively_looking')
        }),
        ('Preferences', {
            'fields': ('preferred_employment_types', 'preferred_locations', 'open_to_remote', 'preferred_company_types')
        }),
        ('Education & Domain', {
            'fields': ('highest_education', 'domain')
        }),
        ('Files', {
            'fields': ('resume_file',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_active'),
            'classes': ('collapse',)
        })
    )


@admin.register(CandidateSkill)
class CandidateSkillAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'skill_name', 'proficiency', 'years_of_experience']
    list_filter = ['proficiency', 'created_at']
    search_fields = ['candidate__user__email', 'skill_name']


@admin.register(CandidateSearchLog)
class CandidateSearchLogAdmin(admin.ModelAdmin):
    list_display = ['recruiter', 'results_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['recruiter__email']
    readonly_fields = ['created_at']