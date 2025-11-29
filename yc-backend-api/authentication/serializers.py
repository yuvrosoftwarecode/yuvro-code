from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    User,
    Profile,
    SocialLinks,
    Skill,
    Experience,
    Project,
    Education,
    Certification,
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user role and additional user info in the token.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["role"] = user.role
        token["username"] = user.username
        token["email"] = user.email
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name

        return token


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "date_joined", "last_login"]


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate

        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(username=email, password=password)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("User account is disabled.")
                attrs["user"] = user
                return attrs
            else:
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Must include email and password.")


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "role",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def validate_role(self, value):
        # Only allow certain roles during registration
        allowed_roles = ["student"]  # By default, only students can self-register
        if value not in allowed_roles:
            raise serializers.ValidationError(
                f"Invalid role. Allowed roles for registration: {', '.join(allowed_roles)}"
            )
        return value

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user information.
    """

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "role"]

    def validate_role(self, value):
        # Only admins can change roles
        request = self.context.get("request")
        if request and request.user:
            if not request.user.can_manage_users():
                # If not admin, don't allow role changes
                if self.instance and self.instance.role != value:
                    raise serializers.ValidationError(
                        "You don't have permission to change user roles."
                    )
        return value


class SocialLinksSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLinks
        fields = [
            "id",
            "github",
            "linkedin",
            "portfolio",
            "email",
            "website",
        ]
        read_only_fields = ["id"]


# ----- Skills -----
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = [
            "id",
            "name",
            "level",
            "percentage",
        ]
        read_only_fields = ["id"]


# ----- Experience -----
class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = [
            "id",
            "company",
            "role",
            "duration",
            "description_list",
            "technologies",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ----- Projects -----
class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "description",
            "role",
            "tech_stack",
            "github_link",
            "live_link",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# ----- Education -----
class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = [
            "id",
            "institution",
            "degree",
            "field",
            "duration",
            "cgpa",
            "start_year",
            "end_year",
        ]
        read_only_fields = ["id"]


# ----- Certifications -----
class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = [
            "id",
            "name",
            "issuer",
            "completion_date",
            "certificate_file",
        ]
        read_only_fields = ["id"]


# ------------------------------------------------------------
# PROFILE SERIALIZER (NESTED READ)
# ------------------------------------------------------------
class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    # Allow editing user’s first and last name
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)

    links = SocialLinksSerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    experiences = ExperienceSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    education = EducationSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id",
            "user",
            "first_name",
            "last_name",
            "full_name",
            "title",
            "location",
            "about",
            "gender",
            "profile_image",
            "cover_image",
            "google_id",
            "created_at",
            "updated_at",
            "links",
            "skills",
            "experiences",
            "projects",
            "education",
            "certifications",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "full_name"]

    def update(self, instance, validated_data):
        user = instance.user

        # 1. Extract user fields
        first_name = validated_data.pop("first_name", None)
        last_name = validated_data.pop("last_name", None)

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        user.save()

        # 2. Update profile fields normally
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 3. Always regenerate full_name
        instance.full_name = f"{user.first_name} {user.last_name}".strip()

        # 4. Save profile
        instance.save()

        return instance
