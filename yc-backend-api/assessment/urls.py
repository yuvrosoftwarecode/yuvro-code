from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContestViewSet, SkillTestViewSet, MockInterviewViewSet,
)

router = DefaultRouter()
router.register(r'contests', ContestViewSet)
router.register(r'skill-tests', SkillTestViewSet)
router.register(r'mock-interviews', MockInterviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
]