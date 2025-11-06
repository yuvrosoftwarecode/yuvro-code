"""
URL configuration for yc-backend-api project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "healthy", "service": "yc-backend-api"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/health/', health_check, name='health_check'),
    path('accounts/', include('allauth.urls')),
]
