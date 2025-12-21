from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, F
from django.utils import timezone
from datetime import timedelta
from django.core.paginator import Paginator
from django.contrib.auth import get_user_model

from .models import CandidateProfile, CandidateSkill, CandidateSearchLog
from .serializers import (
    CandidateProfileSerializer, 
    CandidateSearchSerializer, 
    CandidateSearchResultSerializer
)
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class CandidateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for candidate management and search
    """
    queryset = CandidateProfile.objects.all()
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter candidates based on user role
        """
        user = self.request.user
        if user.role in ['recruiter', 'admin', 'instructor']:
            # Recruiters can see all active candidates
            return CandidateProfile.objects.filter(
                is_actively_looking=True,
                user__is_active=True
            ).select_related('user', 'profile').prefetch_related(
                'candidate_skills',
                'profile__experiences',
                'profile__education',
                'profile__projects'
            )
        else:
            # Students can only see their own profile
            return CandidateProfile.objects.filter(user=user)
    
    @action(detail=False, methods=['post'])
    def search(self, request):
        """
        Advanced candidate search with filters
        """
        # Check permissions
        if not request.user.role in ['recruiter', 'admin', 'instructor']:
            return Response({
                'error': 'Permission denied. Only recruiters can search candidates.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Validate search parameters
        search_serializer = CandidateSearchSerializer(data=request.data)
        if not search_serializer.is_valid():
            return Response(search_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        filters = search_serializer.validated_data
        logger.info(f"Candidate search by {request.user.email} with filters: {filters}")
        
        # Start with base queryset
        queryset = self.get_queryset()
        
        # Apply filters
        queryset = self._apply_search_filters(queryset, filters)
        
        # Pagination
        page = filters.get('page', 1)
        page_size = filters.get('page_size', 20)
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize results
        candidates_serializer = CandidateProfileSerializer(page_obj.object_list, many=True)
        
        # Log search
        self._log_search(request.user, filters, paginator.count)
        
        # Prepare response
        result_data = {
            'candidates': candidates_serializer.data,
            'total_count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous()
        }
        
        result_serializer = CandidateSearchResultSerializer(result_data)
        return Response(result_serializer.data, status=status.HTTP_200_OK)
    
    def _apply_search_filters(self, queryset, filters):
        """
        Apply search filters to queryset
        """
        # Skills and keywords
        skills = filters.get('skills', '').strip()
        keywords = filters.get('keywords', '').strip()
        
        if skills or keywords:
            search_terms = []
            if skills:
                search_terms.extend([term.strip() for term in skills.split(',') if term.strip()])
            if keywords:
                search_terms.extend([term.strip() for term in keywords.split(',') if term.strip()])
            
            if search_terms:
                skill_q = Q()
                for term in search_terms:
                    skill_q |= (
                        Q(candidate_skills__skill_name__icontains=term) |
                        Q(profile__skills__name__icontains=term) |
                        Q(profile__title__icontains=term) |
                        Q(profile__about__icontains=term) |
                        Q(profile__experiences__role__icontains=term) |
                        Q(profile__experiences__technologies__icontains=term)
                    )
                queryset = queryset.filter(skill_q).distinct()
        
        # Experience range
        experience_from = filters.get('experience_from')
        experience_to = filters.get('experience_to')
        
        if experience_from is not None:
            queryset = queryset.filter(
                total_experience_years__gte=experience_from
            )
        
        if experience_to is not None:
            queryset = queryset.filter(
                total_experience_years__lte=experience_to
            )
        
        # Location
        location = filters.get('location', '').strip()
        if location:
            queryset = queryset.filter(
                Q(profile__location__icontains=location) |
                Q(preferred_locations__icontains=location)
            )
        
        # CTC Range
        ctc_from = filters.get('ctc_from')
        ctc_to = filters.get('ctc_to')
        
        if ctc_from is not None:
            queryset = queryset.filter(expected_ctc__gte=ctc_from)
        
        if ctc_to is not None:
            queryset = queryset.filter(expected_ctc__lte=ctc_to)
        
        # Notice Period
        notice_periods = filters.get('notice_period', [])
        if notice_periods:
            queryset = queryset.filter(notice_period__in=notice_periods)
        
        # Education
        education = filters.get('education')
        if education:
            queryset = queryset.filter(highest_education=education)
        
        # Domain
        domain = filters.get('domain', '').strip()
        if domain:
            queryset = queryset.filter(domain__icontains=domain)
        
        # Employment Type
        employment_types = filters.get('employment_type', [])
        if employment_types:
            emp_q = Q()
            for emp_type in employment_types:
                emp_q |= Q(preferred_employment_types__icontains=emp_type)
            queryset = queryset.filter(emp_q)
        
        # Company Type
        company_type = filters.get('company_type')
        if company_type:
            queryset = queryset.filter(preferred_company_types__icontains=company_type)
        
        # Activity (active in last N days)
        active_in_days = filters.get('active_in_days')
        if active_in_days:
            cutoff_date = timezone.now() - timedelta(days=active_in_days)
            queryset = queryset.filter(last_active__gte=cutoff_date)
        
        return queryset.order_by('-last_active', '-created_at')
    
    def _log_search(self, user, filters, results_count):
        """
        Log search query for analytics
        """
        try:
            CandidateSearchLog.objects.create(
                recruiter=user,
                search_filters=filters,
                results_count=results_count
            )
        except Exception as e:
            logger.error(f"Failed to log search: {e}")
    
    @action(detail=False, methods=['get'])
    def search_stats(self, request):
        """
        Get search statistics for recruiters
        """
        if not request.user.role in ['recruiter', 'admin', 'instructor']:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get stats for the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        stats = {
            'total_candidates': CandidateProfile.objects.filter(is_actively_looking=True).count(),
            'active_candidates_7_days': CandidateProfile.objects.filter(
                is_actively_looking=True,
                last_active__gte=timezone.now() - timedelta(days=7)
            ).count(),
            'active_candidates_30_days': CandidateProfile.objects.filter(
                is_actively_looking=True,
                last_active__gte=thirty_days_ago
            ).count(),
            'recent_searches': CandidateSearchLog.objects.filter(
                recruiter=request.user,
                created_at__gte=thirty_days_ago
            ).count()
        }
        
        return Response(stats, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """
        Get available filter options for the search form
        """
        if not request.user.role in ['recruiter', 'admin', 'instructor']:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get unique values from database for dropdowns
        options = {
            'notice_periods': [
                {'value': choice[0], 'label': choice[1]} 
                for choice in CandidateProfile.NOTICE_PERIOD_CHOICES
            ],
            'education_levels': [
                {'value': choice[0], 'label': choice[1]} 
                for choice in CandidateProfile.EDUCATION_LEVEL_CHOICES
            ],
            'employment_types': [
                {'value': choice[0], 'label': choice[1]} 
                for choice in CandidateProfile.EMPLOYMENT_TYPE_CHOICES
            ],
            'company_types': [
                {'value': choice[0], 'label': choice[1]} 
                for choice in CandidateProfile.COMPANY_TYPE_CHOICES
            ],
            'popular_skills': self._get_popular_skills(),
            'popular_locations': self._get_popular_locations(),
            'popular_domains': self._get_popular_domains()
        }
        
        return Response(options, status=status.HTTP_200_OK)
    
    def _get_popular_skills(self):
        """Get most popular skills from candidates"""
        from django.db.models import Count
        
        skills = CandidateSkill.objects.values('skill_name').annotate(
            count=Count('skill_name')
        ).order_by('-count')[:20]
        
        return [skill['skill_name'] for skill in skills]
    
    def _get_popular_locations(self):
        """Get most popular locations from candidates"""
        from django.db.models import Count
        
        locations = CandidateProfile.objects.exclude(
            profile__location__isnull=True
        ).exclude(
            profile__location__exact=''
        ).values('profile__location').annotate(
            count=Count('profile__location')
        ).order_by('-count')[:20]
        
        return [loc['profile__location'] for loc in locations]
    
    def _get_popular_domains(self):
        """Get most popular domains from candidates"""
        from django.db.models import Count
        
        domains = CandidateProfile.objects.exclude(
            domain__isnull=True
        ).exclude(
            domain__exact=''
        ).values('domain').annotate(
            count=Count('domain')
        ).order_by('-count')[:20]
        
        return [domain['domain'] for domain in domains]