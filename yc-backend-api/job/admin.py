from django.contrib import admin
from .models import Job, Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'domain', 'size', 'location', 'created_at']
    list_filter = ['size', 'created_at']
    search_fields = ['name', 'domain', 'location']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'domain', 'website')
        }),
        ('Details', {
            'fields': ('size', 'description', 'location')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'employment_type', 'status', 'is_remote', 'posted_at', 'created_at']
    list_filter = ['employment_type', 'status', 'is_remote', 'currency', 'education_level', 'created_at']
    search_fields = ['title', 'company__name', 'locations', 'skills']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('company', 'title', 'description')
        }),
        ('Employment Details', {
            'fields': ('employment_type', 'experience_min_years', 'experience_max_years')
        }),
        ('Location & Remote', {
            'fields': ('locations', 'is_remote')
        }),
        ('Compensation', {
            'fields': ('min_salary', 'max_salary', 'currency')
        }),
        ('Requirements', {
            'fields': ('skills', 'notice_period', 'education_level')
        }),
        ('Status & Dates', {
            'fields': ('status', 'posted_at', 'expires_at')
        }),
        ('Screening Questions', {
            'fields': ('screening_questions_config', 'screening_questions_random_config'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('company')