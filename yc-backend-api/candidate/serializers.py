from rest_framework import serializers
from django.contrib.auth import get_user_model
from authentication.models import Profile, Skill, Experience, Education, Project
from .models import CandidateProfile, CandidateSkill

User = get_user_model()


class CandidateSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateSkill
        fields = ['skill_name', 'proficiency', 'years_of_experience']


class CandidateExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['company', 'role', 'duration', 'description_list', 'technologies']


class CandidateEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['institution', 'degree', 'field', 'duration', 'cgpa', 'start_year', 'end_year']


class CandidateProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['title', 'description', 'role', 'tech_stack', 'github_link', 'live_link']


class CandidateProfileSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    full_name = serializers.CharField(source='profile.full_name', read_only=True)
    title = serializers.CharField(source='profile.title', read_only=True)
    location = serializers.CharField(source='profile.location', read_only=True)
    about = serializers.CharField(source='profile.about', read_only=True)
    profile_image = serializers.URLField(source='profile.profile_image', read_only=True)
    
    skills = CandidateSkillSerializer(source='candidate_skills', many=True, read_only=True)
    experiences = CandidateExperienceSerializer(source='profile.experiences', many=True, read_only=True)
    education = CandidateEducationSerializer(source='profile.education', many=True, read_only=True)
    projects = CandidateProjectSerializer(source='profile.projects', many=True, read_only=True)
    
    total_experience_in_years = serializers.ReadOnlyField()
    skills_list = serializers.ReadOnlyField()
    experience_companies = serializers.ReadOnlyField()
    
    class Meta:
        model = CandidateProfile
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'title', 'location', 'about', 'profile_image',
            'current_ctc', 'expected_ctc', 'currency',
            'total_experience_years', 'total_experience_months', 'total_experience_in_years',
            'notice_period', 'available_from',
            'preferred_employment_types', 'preferred_locations', 'open_to_remote',
            'highest_education', 'domain', 'preferred_company_types',
            'last_active', 'is_actively_looking', 'resume_file',
            'skills', 'experiences', 'education', 'projects',
            'skills_list', 'experience_companies',
            'created_at', 'updated_at'
        ]


class CandidateSearchSerializer(serializers.Serializer):
    """
    Serializer for candidate search filters
    """
    skills = serializers.CharField(required=False, allow_blank=True)
    keywords = serializers.CharField(required=False, allow_blank=True)
    
    experience_from = serializers.IntegerField(required=False, min_value=0)
    experience_to = serializers.IntegerField(required=False, min_value=0)
    
    location = serializers.CharField(required=False, allow_blank=True)
    
    ctc_from = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, min_value=0)
    ctc_to = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, min_value=0)
    
    notice_period = serializers.ListField(
        child=serializers.ChoiceField(choices=CandidateProfile.NOTICE_PERIOD_CHOICES),
        required=False,
        allow_empty=True
    )
    
    education = serializers.ChoiceField(
        choices=CandidateProfile.EDUCATION_LEVEL_CHOICES,
        required=False,
        allow_blank=True
    )
    
    domain = serializers.CharField(required=False, allow_blank=True)
    
    employment_type = serializers.ListField(
        child=serializers.ChoiceField(choices=CandidateProfile.EMPLOYMENT_TYPE_CHOICES),
        required=False,
        allow_empty=True
    )
    
    company_type = serializers.ChoiceField(
        choices=CandidateProfile.COMPANY_TYPE_CHOICES,
        required=False,
        allow_blank=True
    )
    
    active_in_days = serializers.IntegerField(required=False, min_value=1)
    
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100, default=20)


class CandidateSearchResultSerializer(serializers.Serializer):
    candidates = CandidateProfileSerializer(many=True)
    total_count = serializers.IntegerField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    has_next = serializers.BooleanField()
    has_previous = serializers.BooleanField()