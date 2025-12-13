from rest_framework import serializers
from .models import Job, Company
import logging

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