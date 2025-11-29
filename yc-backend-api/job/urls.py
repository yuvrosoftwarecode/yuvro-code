from django.urls import path
from .views import (
    JobListCreateAPIView,
    JobDetailAPIView,
    JobFilterAPIView,
)

urlpatterns = [
    path('', JobListCreateAPIView.as_view(), name='job-list-create'),
    path('<int:pk>/', JobDetailAPIView.as_view(), name='job-detail'),
    path('filter/', JobFilterAPIView.as_view(), name='job-filter'),
]
