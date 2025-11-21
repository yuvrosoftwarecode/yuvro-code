from django.urls import path
from .views import JobListCreateAPIView, JobDetailAPIView

urlpatterns = [
    path('', JobListCreateAPIView.as_view(), name='job_list_create'),
    path('<int:pk>/', JobDetailAPIView.as_view(), name='job_detail'),
]
