from django.urls import path
from . import views

app_name = "authentication"

urlpatterns = [
    # Authentication endpoints
    path("register/", views.UserRegistrationView.as_view(), name="register"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path(
        "token/refresh/", views.CustomTokenRefreshView.as_view(), name="token_refresh"
    ),
    # User profile endpoints
    path("profile/", views.UserProfileView.as_view(), name="user_profile"),
    path("profile/detail/", views.ProfileDetailView.as_view(), name="profile_detail"),
    path("user/", views.user_info_view, name="user_info"),
]
