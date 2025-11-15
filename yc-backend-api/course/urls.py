from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CodingProblemViewSet, CourseViewSet, TopicViewSet, SubtopicViewSet, execute_code

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'topics', TopicViewSet)
router.register(r'subtopics', SubtopicViewSet)
router.register(r'coding-problems', CodingProblemViewSet)

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    path('execute/', execute_code, name='execute_code'),
]