from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, TopicViewSet, SubtopicViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'topics', TopicViewSet)
router.register(r'subtopics', SubtopicViewSet)

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]