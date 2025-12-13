from django.urls import path
from .views import JobViewSet, CompanyViewSet

urlpatterns = [
    # Company endpoints
    path('companies/', CompanyViewSet.as_view({'get': 'list', 'post': 'create'}), name='company-list'),
    path('companies/<uuid:pk>/', CompanyViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='company-detail'),
    
    # Job endpoints
    path('', JobViewSet.as_view({'get': 'list', 'post': 'create'}), name='job-list'),
    path('<uuid:pk>/', JobViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='job-detail'),
    path('filter/', JobViewSet.as_view({'post': 'filter'}), name='job-filter'),
    path('<uuid:pk>/apply/', JobViewSet.as_view({'post': 'apply'}), name='job-apply'),
]