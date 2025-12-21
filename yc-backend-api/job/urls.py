from django.urls import path
from .views import JobViewSet, CompanyViewSet, JobApplicationViewSet

urlpatterns = [
    # Company endpoints
    path('companies/', CompanyViewSet.as_view({'get': 'list', 'post': 'create'}), name='company-list'),
    path('companies/<uuid:pk>/', CompanyViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='company-detail'),
    
    # Job Application endpoints (must come before generic job endpoints)
    path('applications/my-applications/', JobApplicationViewSet.as_view({'get': 'my_applications'}), name='my-applications'),
    path('applications/bookmarked/', JobApplicationViewSet.as_view({'get': 'bookmarked'}), name='bookmarked-jobs'),
    path('applications/bookmark/', JobApplicationViewSet.as_view({'post': 'bookmark'}), name='bookmark-job'),
    path('applications/remove-bookmark/', JobApplicationViewSet.as_view({'post': 'remove_bookmark'}), name='remove-bookmark'),
    path('applications/user-job-status/', JobApplicationViewSet.as_view({'get': 'user_job_status'}), name='user-job-status'),
    path('applications/<uuid:pk>/update-status/', JobApplicationViewSet.as_view({'patch': 'update_status'}), name='update-application-status'),
    path('applications/<uuid:pk>/', JobApplicationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='application-detail'),
    path('applications/', JobApplicationViewSet.as_view({'get': 'list', 'post': 'create'}), name='application-list'),
    
    # Job endpoints
    path('with-applications/', JobViewSet.as_view({'get': 'with_applications'}), name='jobs-with-applications'),
    path('filter/', JobViewSet.as_view({'post': 'filter'}), name='job-filter'),
    path('<uuid:pk>/applications/', JobViewSet.as_view({'get': 'applications'}), name='job-applications'),
    path('<uuid:pk>/apply/', JobViewSet.as_view({'post': 'apply'}), name='job-apply'),
    path('<uuid:pk>/', JobViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='job-detail'),
    path('', JobViewSet.as_view({'get': 'list', 'post': 'create'}), name='job-list'),
]