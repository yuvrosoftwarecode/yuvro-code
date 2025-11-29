"""
URL configuration for yc-backend-api project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import ( SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView, ) # type: ignore

def health_check(request):
    return JsonResponse({"status": "healthy", "service": "yc-backend-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/auth/", include("authentication.urls")),
    path("api/course/", include("course.urls")),
    path("api/ai/", include("ai_assistant.urls")),
    path("api/code/", include("code_executor.urls")),
    path("api/health/", health_check, name="health_check"),
    path("accounts/", include("allauth.urls")),
    path("api/contests/", include("contest.urls")),
]
