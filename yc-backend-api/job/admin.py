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
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "company", "location", "work_type", "job_type", "experience_level", "salary", "logo")
        }),
        ("Job Details", {
            "fields": ("description", "skills", "responsibilities", "required_skills", "preferred_skills", "benefits")
        }),
        ("Company Information", {
            "fields": ("company_info", "company_size"),
            "description": "Enter company information as JSON, e.g., {\"name\": \"AppCraft Studio\", \"about\": \"A great company\", \"size\": \"50-100\", \"domain\": \"Software\", \"website\": \"https://example.com\"}"
        }),
        ("Meta", {
            "fields": ("posted_date", "created_at"),
            "classes": ("collapse",)
        }),
    )
    
    readonly_fields = ("posted_date", "created_at")
