from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Contest, MockInterview, JobTest, SkillTest, 
    ContestSubmission, MockInterviewSubmission, 
    JobTestSubmission, SkillTestSubmission
)

User = get_user_model()


class ContestSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Contest
        fields = [
            'id', 'title', 'organizer', 'type', 'status', 'start_datetime', 'end_datetime',
            'duration', 'prize', 'difficulty', 'description', 'participants_count',
            'questions_config', 'questions_random_config', 'instructions', 'total_marks', 'passing_marks', 
            'enable_proctoring', 'publish_status',
            'created_by', 'created_at', 'updated_at',
        ]
        
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_participants_count(self, obj):
        return obj.contest_submissions.count()


class SkillTestSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SkillTest
        fields = [
            'id', 'title', 'description', 'instructions', 'difficulty', 'duration',
            'total_marks', 'passing_marks', 'enable_proctoring', 'questions_config', 'questions_random_config',
            'publish_status', 'course', 'topic', 'participants_count',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_participants_count(self, obj):
        return obj.skill_test_submissions.count()


class MockInterviewSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MockInterview
        fields = [
            'id', 'title', 'description', 'instructions', 'difficulty', 'duration',
            'total_marks', 'passing_marks', 'enable_proctoring', 'questions_config', 'questions_random_config',
            'publish_status', 'type', 'status', 'scheduled_datetime',
            'participants_count', 'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_participants_count(self, obj):
        return obj.mock_interview_submissions.count()


class JobTestSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobTest
        fields = [
            'id', 'title', 'description', 'instructions', 'difficulty', 'duration',
            'total_marks', 'passing_marks', 'enable_proctoring', 'questions_config', 'questions_random_config',
            'publish_status', 'company_name', 'position_title',
            'start_datetime', 'end_datetime', 'participants_count',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_participants_count(self, obj):
        return obj.job_test_submissions.count()


# Submission Serializers
class ContestSubmissionSerializer(serializers.ModelSerializer):
    contest_title = serializers.CharField(source='contest.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = ContestSubmission
        fields = [
            'id', 'contest', 'contest_title', 'user', 'user_name', 'status',
            'started_at', 'submitted_at', 'completed_at', 'marks',
            'proctoring_events', 'browser_info', 'ip_address', 'user_agent',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SkillTestSubmissionSerializer(serializers.ModelSerializer):
    skill_test_title = serializers.CharField(source='skill_test.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SkillTestSubmission
        fields = [
            'id', 'skill_test', 'skill_test_title', 'user', 'user_name', 'status',
            'started_at', 'submitted_at', 'completed_at', 'marks',
            'proctoring_events', 'browser_info', 'ip_address', 'user_agent',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MockInterviewSubmissionSerializer(serializers.ModelSerializer):
    mock_interview_title = serializers.CharField(source='mock_interview.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = MockInterviewSubmission
        fields = [
            'id', 'mock_interview', 'mock_interview_title', 'user', 'user_name', 'status',
            'started_at', 'submitted_at', 'completed_at', 'marks',
            'proctoring_events', 'browser_info', 'ip_address', 'user_agent',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JobTestSubmissionSerializer(serializers.ModelSerializer):
    job_test_title = serializers.CharField(source='job_test.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = JobTestSubmission
        fields = [
            'id', 'job_test', 'job_test_title', 'user', 'user_name', 'status',
            'started_at', 'submitted_at', 'completed_at', 'marks',
            'proctoring_events', 'browser_info', 'ip_address', 'user_agent',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
