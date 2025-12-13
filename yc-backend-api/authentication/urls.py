from django.urls import path
from . import views
from .views import admin_users

app_name = "authentication"

urlpatterns = [
    path("register/", views.UserRegistrationView.as_view(), name="register"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("token/", views.CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", views.CustomTokenRefreshView.as_view(), name="token_refresh"),

    path("profile/", views.UserProfileView.as_view(), name="user_profile"),
    path("profile/detail/", views.ProfileDetailView.as_view(), name="profile_detail"),
    path("user/", views.user_info_view, name="user_info"),
    path(
        "forgot-password/", views.ForgotPasswordView.as_view(), name="forgot_password"
    ),
    path(
        "reset-password/<uidb64>/<token>/",
        views.ResetPasswordView.as_view(),
        name="reset_password",
    ),
    path("admin-users/", admin_users, name="admin_users"),
    path("users/", views.UsersListCreateView.as_view(), name="users_list"),
    path("users/<uuid:pk>/", views.UserDetailView.as_view(), name="user_detail"),
    path("users/<uuid:pk>/toggle-status/", views.UserToggleStatusView.as_view(), name="user_toggle_status"),
    path("profile/links/", views.SocialLinksUpdateView.as_view(), name="social_links"),
    path("skills/add/", views.SkillCreateView.as_view(), name="skill_add"),
    path(
        "skills/<uuid:pk>/",
        views.SkillUpdateDeleteView.as_view(),
        name="skill_edit_delete",
    ),
    path(
        "experience/add/", views.ExperienceCreateView.as_view(), name="experience_add"
    ),
    path(
        "experience/<uuid:pk>/",
        views.ExperienceUpdateDeleteView.as_view(),
        name="experience_edit_delete",
    ),
    path("projects/add/", views.ProjectCreateView.as_view(), name="project_add"),
    path(
        "projects/<uuid:pk>/",
        views.ProjectUpdateDeleteView.as_view(),
        name="project_edit_delete",
    ),
    path("education/add/", views.EducationCreateView.as_view(), name="education_add"),
    path(
        "education/<uuid:pk>/",
        views.EducationUpdateDeleteView.as_view(),
        name="education_edit_delete",
    ),
    path(
        "certification/add/",
        views.CertificationCreateView.as_view(),
        name="certification_add",
    ),
    path(
        "certification/<uuid:pk>/",
        views.CertificationUpdateDeleteView.as_view(),
        name="certification_edit_delete",
    ),
]
