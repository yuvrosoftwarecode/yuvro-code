from django.contrib import admin
from .models import Course, Topic, Subtopic, Video, CodingProblem, Quiz, Note, CourseInstructor


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 0
    fields = ["name", "order_index"]
    ordering = ["order_index"]


class SubtopicInline(admin.TabularInline):
    model = Subtopic
    extra = 0
    fields = ["name", "content", "order_index"]
    ordering = ["order_index"]


class CourseInstructorInline(admin.TabularInline):
    model = CourseInstructor
    extra = 1
    fields = ["instructor", "created_at", "updated_at"]
    readonly_fields = ["created_at", "updated_at"]

# ------------------ COURSE ADMIN ------------------
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
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
    ]
    ordering = ["category", "-created_at"]
    inlines = [TopicInline, CourseInstructorInline]  # ⭐ Add here



# ------------------ TOPIC ADMIN ------------------
@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ["name", "course", "order_index", "created_at"]
    list_filter = ["course", "created_at"]
    search_fields = ["name", "course__name"]
    readonly_fields = ["id", "created_at"]
    fields = ["name", "course", "order_index", "id", "created_at"]
    ordering = ["course", "order_index"]
    inlines = [SubtopicInline]


# ------------------ SUBTOPIC ADMIN ------------------
@admin.register(Subtopic)
class SubtopicAdmin(admin.ModelAdmin):
    list_display = ["name", "topic", "order_index", "created_at"]
    list_filter = ["topic__course", "topic", "created_at"]
    search_fields = ["name", "topic__name", "topic__course__name"]
    readonly_fields = ["id", "created_at"]
    fields = ["name", "topic", "content", "order_index", "id", "created_at"]
    ordering = ["topic", "order_index"]


# ------------------ VIDEO ADMIN ------------------
@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
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


# ------------------ CODING PROBLEM ADMIN ------------------
@admin.register(CodingProblem)
class CodingProblemAdmin(admin.ModelAdmin):

    list_display = ["title", "category", "topic", "sub_topic", "created_at", "updated_at"]

    list_filter = [
        "category",
        "topic",
        "sub_topic__topic__course",
        "sub_topic__topic",
        "created_at",
    ]

    search_fields = [
        "title",
        "description",
        "category",
        "topic__name",
        "sub_topic__name",
    ]

    readonly_fields = ["id", "created_at", "updated_at"]

    fields = [
        "title",
        "category",
        "topic",
        "sub_topic",
        "description",
        "test_cases_basic",
        "test_cases_advanced",
        "id",
        "created_at",
        "updated_at",
    ]

    ordering = ["created_at"]


# ------------------ QUIZ ADMIN ------------------
@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):

    list_display = [
        "question_preview",
        "category",
        "topic",
        "sub_topic",
        "correct_answer_display",
        "created_at",
        "updated_at",
    ]

    list_filter = [
        "category",
        "topic",
        "sub_topic__topic__course",
        "sub_topic__topic",
        "created_at",
    ]

    search_fields = [
        "question",
        "category",
        "topic__name",
        "sub_topic__name",
        "sub_topic__topic__name",
    ]

    readonly_fields = ["id", "created_at", "updated_at"]

    fields = [
        "question",
        "category",
        "topic",
        "sub_topic",
        "options",
        "correct_answer_index",
        "id",
        "created_at",
        "updated_at",
    ]

    ordering = ["created_at"]

    def question_preview(self, obj):
        return obj.question[:50] + "..." if len(obj.question) > 50 else obj.question

    question_preview.short_description = "Question"

    def correct_answer_display(self, obj):
        correct_text = obj.correct_answer
        if correct_text:
            return f"[{obj.correct_answer_index}] {correct_text}"
        return f"Index: {obj.correct_answer_index}"

    correct_answer_display.short_description = "Correct Answer"


# ------------------ NOTE ADMIN ------------------
@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
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
        return obj.content[:30] + "..." if len(obj.content) > 30 else obj.content

    content_preview.short_description = "Content"


@admin.register(CourseInstructor)
class CourseInstructorAdmin(admin.ModelAdmin):
    list_display = ["course", "instructor", "created_at", "updated_at"]
    list_filter = ["course", "instructor", "created_at"]
    search_fields = ["course__name", "instructor__email", "instructor__username"]
    readonly_fields = ["id", "created_at", "updated_at"]
    fields = ["course", "instructor", "id", "created_at", "updated_at"]
    ordering = ["-created_at"]