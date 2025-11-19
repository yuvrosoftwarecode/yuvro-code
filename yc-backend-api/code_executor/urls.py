from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CodeExecutorViewSet, PlagiarismViewSet

router = DefaultRouter()
router.register(r"submissions", CodeExecutorViewSet, basename="submissions")
router.register(r"plagiarism", PlagiarismViewSet, basename="plagiarism")

urlpatterns = [
    path("", include(router.urls)),
]
