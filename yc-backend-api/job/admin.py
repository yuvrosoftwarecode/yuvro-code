from django.contrib import admin
from .models import Job
import json

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        "title", "company", "location", "salary",
        "work_type", "job_type", "experience_level", "created_at"
    )
    search_fields = ("title", "company", "location", "skills")
    list_filter = ("location", "work_type", "job_type", "experience_level", "created_at")
    
    readonly_fields = ("posted_date", "created_at")
