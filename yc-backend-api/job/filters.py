import django_filters
from django.db.models import Q
from .models import Job

class JobFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    location = django_filters.CharFilter(field_name="location", lookup_expr="icontains")
    work_type = django_filters.CharFilter(field_name="work_type", lookup_expr="iexact")
    experience_level = django_filters.CharFilter(field_name="experience_level", lookup_expr="icontains")
    job_type = django_filters.CharFilter(field_name="job_type", lookup_expr="icontains")
    skills = django_filters.CharFilter(method="filter_skills")
    company_size = django_filters.CharFilter(method="filter_company_size")
    salary_min = django_filters.NumberFilter(method="filter_salary_min")
    salary_max = django_filters.NumberFilter(method="filter_salary_max")
    posted_date = django_filters.CharFilter(method="filter_posted_date")

    class Meta:
        model = Job
        fields = []

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) |
            Q(company__icontains=value) |
            Q(skills__icontains=value)
        )

    def filter_skills(self, queryset, name, value):
        skills = [s.strip() for s in value.split(",") if s.strip()]
        if not skills:
            return queryset
        q = Q()
        for s in skills:
            q &= Q(skills__icontains=s)
        return queryset.filter(q)

    def filter_company_size(self, queryset, name, value):
        return queryset.filter(company_info__icontains=value)

    def filter_salary_min(self, queryset, name, value):
        try:
            return queryset.filter(salary_range__iregex=rf"\b({value})\b|(\d{{1,3}})\s*-\s*\d{{1,3}}")
        except:
            return queryset

    def filter_salary_max(self, queryset, name, value):
        try:
            return queryset.filter(salary_range__iregex=rf"\b({value})\b|(\d{{1,3}})\s*-\s*\d{{1,3}}")
        except:
            return queryset

    def filter_posted_date(self, queryset, name, value):
        value_lower = value.lower()
        import datetime
        now = datetime.date.today()
        if "24" in value_lower:
            cutoff = now - datetime.timedelta(days=1)
        elif "7" in value_lower:
            cutoff = now - datetime.timedelta(days=7)
        elif "30" in value_lower:
            cutoff = now - datetime.timedelta(days=30)
        else:
            return queryset
        return queryset.filter(posted_date__gte=cutoff)