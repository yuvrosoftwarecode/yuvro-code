from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Job, Company, JobApplication
from .serializers import (
    JobSerializer, CompanySerializer, JobApplicationSerializer,
    JobApplicationListSerializer, JobWithApplicationsSerializer
)
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
        """Apply to a job"""
        job = self.get_object()
        user = request.user
        
        logger.info(f"User {user.username} applying to job: {job.title}")
        
        # Check if user already applied
        if JobApplication.objects.filter(job=job, applicant=user).exists():
            return Response({
                'error': 'You have already applied to this job'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create application data
        application_data = {
            'job_id': job.id,
            'cover_letter': request.data.get('cover_letter', ''),
            'portfolio_url': request.data.get('portfolio_url', ''),
            'expected_salary': request.data.get('expected_salary'),
            'expected_currency': request.data.get('expected_currency', 'USD'),
            'available_from': request.data.get('available_from'),
            'notice_period_days': request.data.get('notice_period_days'),
            'screening_responses': request.data.get('screening_responses', {})
        }
        
        serializer = JobApplicationSerializer(data=application_data, context={'request': request})
        if serializer.is_valid():
            application = serializer.save()
            logger.info(f"Job application created successfully with ID: {application.id}")
            return Response({
                'message': f'Successfully applied to {job.title}',
                'application_id': application.id,
                'job_id': job.id,
                'job_title': job.title
            }, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Job application validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        """Get applications for a specific job (recruiter only)"""
        job = self.get_object()
        
        # Check if user has permission to view applications
        if not request.user.groups.filter(name__in=['recruiter', 'admin', 'instructor']).exists():
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        applications = JobApplication.objects.filter(job=job).exclude(status='bookmarked').order_by('-applied_at')
        serializer = JobApplicationListSerializer(applications, many=True)
        
        return Response({
            'job_title': job.title,
            'company_name': job.company.name,
            'applications_count': applications.count(),
            'applications': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def with_applications(self, request):
        """Get jobs with application counts (recruiter only)"""
        if not request.user.groups.filter(name__in=['recruiter', 'admin', 'instructor']).exists():
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        queryset = self.get_queryset()
        serializer = JobWithApplicationsSerializer(queryset, many=True)
        return Response(serializer.data)


class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name__in=['recruiter', 'admin', 'instructor']).exists():
            # Recruiters can see all applications
            return JobApplication.objects.all()
        else:
            # Students can only see their own applications
            return JobApplication.objects.filter(applicant=user)
    
    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_applications(self, request):
        """Get current user's job applications"""
        applications = JobApplication.objects.filter(
            applicant=request.user
        ).exclude(status='bookmarked').order_by('-applied_at')
        serializer = JobApplicationListSerializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def bookmarked(self, request):
        """Get current user's bookmarked jobs"""
        bookmarked_apps = JobApplication.objects.filter(
            applicant=request.user, 
            status='bookmarked'
        ).order_by('-created_at')
        serializer = JobApplicationListSerializer(bookmarked_apps, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bookmark(self, request):
        """Bookmark a job"""
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({'error': 'job_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if record already exists
        existing_app = JobApplication.objects.filter(job=job, applicant=request.user).first()
        if existing_app:
            if existing_app.status == 'bookmarked':
                return Response({'message': 'Job already bookmarked'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'You have already applied to this job'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new bookmark record
        application = JobApplication.objects.create(
            job=job,
            applicant=request.user,
            status='bookmarked'
        )
        
        return Response({
            'message': 'Job bookmarked successfully',
            'application_id': application.id
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def remove_bookmark(self, request):
        """Remove bookmark from a job"""
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({'error': 'job_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            application = JobApplication.objects.get(
                job_id=job_id,
                applicant=request.user,
                status='bookmarked'
            )
            application.delete()
            return Response({'message': 'Bookmark removed successfully'}, status=status.HTTP_200_OK)
        except JobApplication.DoesNotExist:
            return Response({'error': 'Bookmark not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def user_job_status(self, request):
        """Get user's bookmark and application status for all jobs"""
        applications = JobApplication.objects.filter(applicant=request.user)
        
        job_status = {}
        for app in applications:
            job_status[str(app.job.id)] = {
                'is_bookmarked': app.is_bookmarked,
                'is_applied': app.is_applied,
                'status': app.status,
                'applied_at': app.applied_at
            }
        
        return Response(job_status)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update application status (recruiter only)"""
        if not request.user.groups.filter(name__in=['recruiter', 'admin', 'instructor']).exists():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        application = self.get_object()
        new_status = request.data.get('status')
        
        if new_status and new_status not in dict(JobApplication.APPLICATION_STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_status:
            application.status = new_status
        application.recruiter_notes = request.data.get('recruiter_notes', application.recruiter_notes)
        application.feedback = request.data.get('feedback', application.feedback)
        application.save()
        
        serializer = JobApplicationSerializer(application)
        return Response(serializer.data)