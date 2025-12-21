from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache
from .models import Job, Company, JobApplication
import logging

User = get_user_model()

logger = logging.getLogger(__name__)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'domain', 'website', 'size', 'description', 'benefits', 'location', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class JobSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True)
    screening_questions_config = serializers.JSONField(required=False)
    screening_questions_random_config = serializers.JSONField(required=False)
    
    class Meta:
        model = Job
        fields = [
            'id', 'company', 'company_id', 'title', 'description', 'employment_type',
            'experience_min_years', 'experience_max_years', 'locations', 'is_remote',
            'min_salary', 'max_salary', 'currency', 'skills', 'notice_period',
            'education_level', 'status', 'posted_at', 'expires_at', 'created_at',
            'updated_at', 'screening_questions_config', 'screening_questions_random_config'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        logger.info(f"Creating job with data: {validated_data}")
        try:
            job = Job.objects.create(**validated_data)
            logger.info(f"Job created successfully with ID: {job.id}")
            return job
        except Exception as e:
            logger.error(f"Error creating job: {str(e)}")
            raise
    
    def update(self, instance, validated_data):
        logger.info(f"Updating job {instance.id} with data: {validated_data}")
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            logger.info(f"Job {instance.id} updated successfully")
            return instance
        except Exception as e:
            logger.error(f"Error updating job {instance.id}: {str(e)}")
            raise

class JobApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    job_id = serializers.UUIDField(write_only=True)
    applicant = serializers.StringRelatedField(read_only=True)
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.SerializerMethodField()
    portfolio_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    expected_salary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    available_from = serializers.DateField(required=False, allow_null=True)
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'job_id', 'applicant', 'applicant_name', 'applicant_email',
            'is_bookmarked', 'is_applied', 'cover_letter', 'resume_file', 'portfolio_url', 
            'status', 'applied_at', 'screening_responses', 'recruiter_notes', 'feedback', 
            'interview_scheduled_at', 'interview_feedback', 'expected_salary', 
            'expected_currency', 'available_from', 'notice_period_days', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'applied_at', 'applicant']
    
    def get_applicant_name(self, obj):
        if obj.applicant.first_name and obj.applicant.last_name:
            return f"{obj.applicant.first_name} {obj.applicant.last_name}"
        return obj.applicant.username
    
    def get_applicant_email(self, obj):
        return obj.applicant.email
    
    def validate(self, data):
        """Validate and clean the application data"""
        # Convert empty strings to None for optional URL and decimal fields
        if 'portfolio_url' in data and data['portfolio_url'] == '':
            data['portfolio_url'] = None
        if 'expected_salary' in data and not data['expected_salary']:
            data['expected_salary'] = None
        if 'available_from' in data and data['available_from'] == '':
            data['available_from'] = None
        if 'notice_period_days' in data and data['notice_period_days'] == '':
            data['notice_period_days'] = None
            
        logger.info(f"Validated application data: {data}")
        return data
    
    def create(self, validated_data):
        # Set the applicant to the current user
        validated_data['applicant'] = self.context['request'].user
        
        logger.info(f"Creating application for user {validated_data['applicant'].username} to job {validated_data['job_id']}")
        
        # Check if user has already interacted with this job
        existing_app = JobApplication.objects.filter(
            job_id=validated_data['job_id'],
            applicant=validated_data['applicant']
        ).first()
        
        if existing_app:
            logger.info(f"Found existing application: is_applied={existing_app.is_applied}, is_bookmarked={existing_app.is_bookmarked}")
            if not existing_app.is_applied:
                # Update existing (e.g. bookmarked) to applied status
                for key, value in validated_data.items():
                    if key != 'applicant':  # Don't overwrite applicant
                        setattr(existing_app, key, value)
                existing_app.is_applied = True
                existing_app.applied_at = timezone.now()
                # Ensure status is not set to invalid 'bookmarked' value if it was
                if existing_app.status == 'bookmarked' or existing_app.status is None: 
                    existing_app.status = 'under_review'
                existing_app.save()
                
                # Invalidate cache for job application count
                cache_key = f"job_applications_count_{validated_data['job_id']}"
                cache.delete(cache_key)
                
                logger.info(f"Updated existing record to application with ID: {existing_app.id}, status: {existing_app.status}")
                return existing_app
            else:
                raise serializers.ValidationError("You have already applied to this job")
        
        # Set is_applied for new applications
        validated_data['is_applied'] = True
        validated_data['applied_at'] = timezone.now()
        
        # Set default status if not provided
        if 'status' not in validated_data or validated_data['status'] is None:
            validated_data['status'] = 'under_review'
        
        logger.info(f"Creating job application with data: {validated_data}")
        try:
            application = JobApplication.objects.create(**validated_data)
            
            # Invalidate cache for job application count
            cache_key = f"job_applications_count_{validated_data['job_id']}"
            cache.delete(cache_key)
            
            logger.info(f"Job application created successfully with ID: {application.id}, status: {application.status}")
            return application
        except Exception as e:
            logger.error(f"Error creating job application: {str(e)}")
            raise


class JobApplicationListSerializer(serializers.ModelSerializer):
    """Serializer for listing applications with full job data"""
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.SerializerMethodField()
    job = JobSerializer(read_only=True)
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 'applicant_name', 'applicant_email', 'job',
            'status', 'applied_at', 'expected_salary', 'expected_currency',
            'cover_letter', 'portfolio_url', 'available_from', 'notice_period_days',
            'created_at', 'updated_at'
        ]
    
    def get_applicant_name(self, obj):
        if obj.applicant.first_name and obj.applicant.last_name:
            return f"{obj.applicant.first_name} {obj.applicant.last_name}"
        return obj.applicant.username
    
    def get_applicant_email(self, obj):
        return obj.applicant.email


class JobWithApplicationsSerializer(JobSerializer):
    """Job serializer that includes application count and recent applications"""
    applications_count = serializers.SerializerMethodField()
    recent_applications = serializers.SerializerMethodField()
    
    class Meta(JobSerializer.Meta):
        fields = JobSerializer.Meta.fields + ['applications_count', 'recent_applications']
    
    def get_applications_count(self, obj):
        # Use caching for better performance
        cache_key = f"job_applications_count_{obj.id}"
        count = cache.get(cache_key)
        
        if count is None:
            count = obj.applications.filter(is_applied=True).count()
            cache.set(cache_key, count, timeout=300)  # Cache for 5 minutes
            
        return count
    
    def get_recent_applications(self, obj):
        recent_apps = obj.applications.filter(is_applied=True).order_by('-applied_at')[:5]
        return JobApplicationListSerializer(recent_apps, many=True).data