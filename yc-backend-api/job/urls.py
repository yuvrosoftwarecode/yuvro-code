from django.urls import path
from .views import JobViewSet, CompanyViewSet, JobApplicationViewSet

urlpatterns = [
    # Company endpoints
    path('companies/', CompanyViewSet.as_view({'get': 'list', 'post': 'create'}), name='company-list'),
    path('companies/<uuid:pk>/', CompanyViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='company-detail'),
    
    # Job endpoints
    path('', JobViewSet.as_view({'get': 'list', 'post': 'create'}), name='job-list'),
    path('<uuid:pk>/', JobViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='job-detail'),
    path('filter/', JobViewSet.as_view({'post': 'filter'}), name='job-filter'),
    path('<uuid:pk>/apply/', JobViewSet.as_view({'post': 'apply'}), name='job-apply'),
    path('<uuid:pk>/applications/', JobViewSet.as_view({'get': 'applications'}), name='job-applications'),
    path('with-applications/', JobViewSet.as_view({'get': 'with_applications'}), name='jobs-with-applications'),
    
    # Job Application endpoints
    path('applications/', JobApplicationViewSet.as_view({'get': 'list', 'post': 'create'}), name='application-list'),
    path('applications/<uuid:pk>/', JobApplicationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='application-detail'),
    path('applications/my-applications/', JobApplicationViewSet.as_view({'get': 'my_applications'}), name='my-applications'),
    path('applications/bookmarked/', JobApplicationViewSet.as_view({'get': 'bookmarked'}), name='bookmarked-jobs'),
    path('applications/bookmark/', JobApplicationViewSet.as_view({'post': 'bookmark'}), name='bookmark-job'),
    path('applications/remove-bookmark/', JobApplicationViewSet.as_view({'post': 'remove_bookmark'}), name='remove-bookmark'),
    path('applications/<uuid:pk>/update-status/', JobApplicationViewSet.as_view({'patch': 'update_status'}), name='update-application-status'),
]