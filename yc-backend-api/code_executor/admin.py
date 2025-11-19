from django.contrib import admin
from .models import CodeSubmission, PlagiarismReport


@admin.register(CodeSubmission)
class CodeSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "get_problem_title",
        "language",
        "status",
        "test_cases_passed",
        "total_test_cases",
        "plagiarism_score",
        "created_at",
    ]
    list_filter = ["status", "language", "created_at"]
    search_fields = ["user__username", "coding_problem__title"]
    readonly_fields = ["created_at", "updated_at"]

    def get_problem_title(self, obj):
        return obj.coding_problem.title if obj.coding_problem else "N/A"

    get_problem_title.short_description = "Problem Title"
    get_problem_title.admin_order_field = "coding_problem__title"


@admin.register(PlagiarismReport)
class PlagiarismReportAdmin(admin.ModelAdmin):
    list_display = ["submission1", "submission2", "similarity_score", "created_at"]
    list_filter = ["similarity_score", "created_at"]
    readonly_fields = ["created_at"]
