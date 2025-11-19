from django.contrib import admin
from .models import Course, Topic, Subtopic, Video, CodingProblem, Quiz, Note


class TopicInline(admin.TabularInline):
    """
    Inline admin for Topic model within Course admin.
    """

    model = Topic
    extra = 0
    fields = ["name", "order_index"]
    ordering = ["order_index"]


class SubtopicInline(admin.TabularInline):
    """
    Inline admin for Subtopic model within Topic admin.
    """

    model = Subtopic
    extra = 0
    fields = ["name", "content", "order_index"]
    ordering = ["order_index"]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """
    Admin interface for Course model.
    """

    list_display = ["name", "short_code", "category", "created_at", "updated_at"]
    list_filter = ["category", "created_at", "updated_at"]
    search_fields = ["name", "short_code"]
    readonly_fields = ["id", "created_at", "updated_at"]
    fields = [
        "name",
        "short_code",
        "category",
        "id",
        "created_at",
        "updated_at",
        "assigned_admin",
    ]
    inlines = [TopicInline]
    ordering = ["category", "-created_at"]


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    """
    Admin interface for Topic model.
    """

    list_display = ["name", "course", "order_index", "created_at"]
    list_filter = ["course", "created_at"]
    search_fields = ["name", "course__name"]
    readonly_fields = ["id", "created_at"]
    fields = ["name", "course", "order_index", "id", "created_at"]
    inlines = [SubtopicInline]
    ordering = ["course", "order_index"]


@admin.register(Subtopic)
class SubtopicAdmin(admin.ModelAdmin):
    """
    Admin interface for Subtopic model.
    """

    list_display = ["name", "topic", "order_index", "created_at"]
    list_filter = ["topic__course", "topic", "created_at"]
    search_fields = ["name", "topic__name", "topic__course__name"]
    readonly_fields = ["id", "created_at"]
    fields = ["name", "topic", "content", "order_index", "id", "created_at"]
    ordering = ["topic", "order_index"]


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """
    Admin interface for Video model.
    """

    list_display = ["title", "sub_topic", "created_at", "updated_at"]
    list_filter = ["sub_topic__topic__course", "sub_topic__topic", "created_at"]
    search_fields = ["title", "sub_topic__name", "sub_topic__topic__name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    fields = [
        "title",
        "sub_topic",
        "video_link",
        "ai_context",
        "id",
        "created_at",
        "updated_at",
    ]
    ordering = ["sub_topic", "created_at"]


@admin.register(CodingProblem)
class CodingProblemAdmin(admin.ModelAdmin):
    """
    Admin interface for CodingProblem model.
    """

    list_display = ["title", "sub_topic", "created_at", "updated_at"]
    list_filter = ["sub_topic__topic__course", "sub_topic__topic", "created_at"]
    search_fields = [
        "title",
        "description",
        "sub_topic__name",
        "sub_topic__topic__name",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]
    fields = [
        "title",
        "sub_topic",
        "description",
        "test_cases_basic",
        "test_cases_advanced",
        "id",
        "created_at",
        "updated_at",
    ]
    ordering = ["sub_topic", "created_at"]


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    """
    Admin interface for Quiz model.
    """

    list_display = [
        "question_preview",
        "sub_topic",
        "correct_answer_display",
        "created_at",
        "updated_at",
    ]
    list_filter = ["sub_topic__topic__course", "sub_topic__topic", "created_at"]
    search_fields = ["question", "sub_topic__name", "sub_topic__topic__name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    fields = [
        "question",
        "sub_topic",
        "options",
        "correct_answer_index",
        "id",
        "created_at",
        "updated_at",
    ]
    ordering = ["sub_topic", "created_at"]

    def question_preview(self, obj):
        """Return a truncated version of the question for list display."""
        return obj.question[:50] + "..." if len(obj.question) > 50 else obj.question

    question_preview.short_description = "Question"

    def correct_answer_display(self, obj):
        """Display the correct answer text with index."""
        correct_text = obj.correct_answer
        if correct_text:
            return f"[{obj.correct_answer_index}] {correct_text}"
        return f"Index: {obj.correct_answer_index}"

    correct_answer_display.short_description = "Correct Answer"


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    """
    Admin interface for Note model.
    """

    list_display = ["content_preview", "user", "sub_topic", "created_at", "updated_at"]
    list_filter = ["sub_topic__topic__course", "sub_topic__topic", "user", "created_at"]
    search_fields = [
        "content",
        "user__username",
        "user__email",
        "sub_topic__name",
        "sub_topic__topic__name",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]
    fields = ["content", "user", "sub_topic", "id", "created_at", "updated_at"]
    ordering = ["sub_topic", "user", "created_at"]

    def content_preview(self, obj):
        """Return a truncated version of the content for list display."""
        return obj.content[:30] + "..." if len(obj.content) > 30 else obj.content

    content_preview.short_description = "Content"
