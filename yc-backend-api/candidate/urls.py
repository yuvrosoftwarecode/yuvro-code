from django.urls import path
from .views import CandidateViewSet

urlpatterns = [
    # Candidate search endpoints
    path('search/', CandidateViewSet.as_view({'post': 'search'}), name='candidate-search'),
    path('stats/', CandidateViewSet.as_view({'get': 'search_stats'}), name='candidate-stats'),
    path('filter-options/', CandidateViewSet.as_view({'get': 'filter_options'}), name='candidate-filter-options'),
    
    # CRUD endpoints
    path('<uuid:pk>/', CandidateViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='candidate-detail'),
    path('', CandidateViewSet.as_view({'get': 'list', 'post': 'create'}), name='candidate-list'),
]