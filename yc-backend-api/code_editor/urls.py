from django.urls import path
from . import views

urlpatterns = [
    path('submit_code/', views.submit_code, name='submit_code'),
    path('submissions/', views.get_user_submissions, name='user_submissions'),
]