from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContestViewSet, SkillTestViewSet,
)

router = DefaultRouter()
router.register(r'contests', ContestViewSet)
router.register(r'skill-tests', SkillTestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]