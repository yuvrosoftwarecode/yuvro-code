from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet,
    TopicViewSet,
    SubtopicViewSet,
    VideoViewSet,
    NoteViewSet,
    QuestionViewSet,
    StudentViewSet,
)

router = DefaultRouter()
router.register(r"courses", CourseViewSet)
router.register(r"topics", TopicViewSet)
router.register(r"subtopics", SubtopicViewSet)
router.register(r"videos", VideoViewSet)
router.register(r"notes", NoteViewSet)
router.register(r"questions", QuestionViewSet)
router.register(r"std", StudentViewSet, basename="student")


# The API URLs are now determined automatically by the router
urlpatterns = [
    path("", include(router.urls)),
]
