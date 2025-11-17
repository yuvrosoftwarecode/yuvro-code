from django.db import models
from .models import Job

class JobFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    min_salary = filters.NumberFilter(field_name='salary_min', lookup_expr='gte')
    max_salary = filters.NumberFilter(field_name='salary_max', lookup_expr='lte')
    location = filters.CharFilter(lookup_expr='iexact')
    experience_level = filters.CharFilter(lookup_expr='iexact')
    job_type = filters.CharFilter(lookup_expr='iexact')
    company_size = filters.CharFilter(lookup_expr='iexact')

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            models.Q(title__icontains=value) |
            models.Q(company__icontains=value) |
            models.Q(description__icontains=value) |
            models.Q(skills__icontains=value)
        )

    class Meta:
        model = Job
        fields = [
            'location', 'experience_level', 'job_type',
            'company_size', 'min_salary', 'max_salary'
        ]
