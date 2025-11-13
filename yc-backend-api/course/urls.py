from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, TopicViewSet, SubtopicViewSet, VideoViewSet, QuizViewSet, CodingProblemViewSet, NoteViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'topics', TopicViewSet)
router.register(r'subtopics', SubtopicViewSet)
router.register(r'videos', VideoViewSet)
router.register(r'quizzes', QuizViewSet)
router.register(r'coding-problems', CodingProblemViewSet)
router.register(r'notes', NoteViewSet)

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]