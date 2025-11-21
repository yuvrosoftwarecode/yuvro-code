from django.contrib import admin
from .models import Job

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'location', 'job_type')
    search_fields = ('title', 'company', 'skills')
    list_filter = ('location', 'job_type', 'experience_level')
