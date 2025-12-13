from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Job, Company
from .serializers import JobSerializer, CompanySerializer
import logging

logger = logging.getLogger(__name__)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    
    def get_queryset(self):
        queryset = Company.objects.all()
        search = self.request.query_params.get('search', None)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(domain__icontains=search) |
                Q(website__icontains=search)
            )
        
        return queryset.order_by('name')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Creating company with data: {request.data}")
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        logger.info(f"Updating company {kwargs.get('pk')} with data: {request.data}")
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        logger.info(f"Partially updating company {kwargs.get('pk')} with data: {request.data}")
        return super().partial_update(request, *args, **kwargs)


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    
    def get_queryset(self):
        queryset = Job.objects.all()
        search = self.request.query_params.get('search', None)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(company__icontains=search) |
                Q(location__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Creating job with data: {request.data}")
        response = super().create(request, *args, **kwargs)
        logger.info(f"Job creation response: {response.data}")
        return response
    
    def list(self, request, *args, **kwargs):
        logger.info("Fetching jobs list")
        response = super().list(request, *args, **kwargs)
        logger.info(f"Returning {len(response.data)} jobs")
        return response
    
    @action(detail=False, methods=['post'])
    def filter(self, request):
        """Filter jobs based on provided criteria"""
        logger.info(f"Filtering jobs with criteria: {request.data}")
        
        queryset = self.get_queryset()
        filters = request.data
        
        # Apply filters
        if filters.get('title'):
            queryset = queryset.filter(title__icontains=filters['title'])
        if filters.get('company'):
            queryset = queryset.filter(company__icontains=filters['company'])
        if filters.get('location'):
            queryset = queryset.filter(location__icontains=filters['location'])
        if filters.get('work_type'):
            queryset = queryset.filter(work_type=filters['work_type'])
        if filters.get('job_type'):
            queryset = queryset.filter(job_type=filters['job_type'])
        if filters.get('experience_level'):
            queryset = queryset.filter(experience_level=filters['experience_level'])
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Apply to a job (placeholder implementation)"""
        job = self.get_object()
        logger.info(f"User applying to job: {job.title}")
        
        # TODO: Implement actual job application logic
        # This could involve creating an Application model, sending emails, etc.
        
        return Response({
            'message': f'Successfully applied to {job.title}',
            'job_id': job.id,
            'job_title': job.title
        }, status=status.HTTP_201_CREATED)