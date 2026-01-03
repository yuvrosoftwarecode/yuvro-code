from django.contrib import admin
from .models import CodeSubmission


@admin.register(CodeSubmission)
class CodeSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'language', 
        'passed_test_cases', 'total_test_cases', 
        'plagiarism_flagged', 'created_at'
    ]
    list_filter = ['language', 'plagiarism_flagged', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {
            'fields': ('id', 'user', 'language')
        }),
        ('Test Results', {
            'fields': ('total_test_cases', 'passed_test_cases')
        }),
        ('Performance', {
            'fields': ('execution_time_ms', 'peak_memory_kb')
        }),
        ('Plagiarism', {
            'fields': ('plagiarism_flagged', 'max_similarity')
        }),
        ('Code', {
            'fields': ('code',),
            'classes': ('collapse', 'wide')
        }),
        ('Test Results Data', {
            'fields': ('test_results_basic', 'test_results_advanced', 'test_results_custom'),
            'classes': ('collapse', 'wide')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )