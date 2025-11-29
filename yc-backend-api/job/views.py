from datetime import timedelta
from typing import Any, Iterable, List

from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import FieldDoesNotExist

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Job
from .serializers import JobSerializer
import json
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)



def safe_list(value: Any) -> List[str]:
    """Convert a value into a list of strings safely."""
    if value is None:
        return []

    if isinstance(value, (list, tuple, set)):
        return [str(v).strip() for v in value if str(v).strip()]

    if isinstance(value, str):
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(v).strip() for v in parsed if str(v).strip()]
            except Exception:
                pass
        return [v.strip() for v in value.split(",") if v.strip()]

    return [str(value).strip()]



def normalize_job(job: Job) -> dict:
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "work_type": job.work_type,
        "job_type": job.job_type,
        "experience_level": job.experience_level,
        "description": job.description,
        "skills": safe_list(job.skills),
        "responsibilities": safe_list(job.responsibilities),
        "required_skills": safe_list(job.required_skills),
        "preferred_skills": safe_list(job.preferred_skills),
        "benefits": safe_list(job.benefits),
        "company_info": job.get_company_info(),  
        "salary": job.salary or 0,
        "created_at": job.created_at,
    }


class JobListCreateAPIView(APIView):
    permission_classes = []  

    def get(self, request):
        queryset = Job.objects.all().order_by("-created_at")
        normalized = [normalize_job(job) for job in queryset]
        return Response(normalized)

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied("You must be logged in to create a job.")
        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            job = serializer.save()
            return Response(normalize_job(job), status=201)
        return Response(serializer.errors, status=400)



class JobDetailAPIView(APIView):
    permission_classes = []  

    def get_object(self, pk):
        return get_object_or_404(Job, pk=pk)

    def get(self, request, pk):
        return Response(normalize_job(self.get_object(pk)))

    def put(self, request, pk):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied("You must be logged in to edit a job.")
        job = self.get_object(pk)
        serializer = JobSerializer(job, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(normalize_job(job))
        return Response(serializer.errors, status=400)

    def patch(self, request, pk):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied("You must be logged in to edit a job.")
        job = self.get_object(pk)
        serializer = JobSerializer(job, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(normalize_job(job))
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied("You must be logged in to delete a job.")
        self.get_object(pk).delete()
        return Response({"message": "Job deleted"}, status=204)



class JobFilterAPIView(APIView):
    """
    Filters jobs based on frontend payload.
    Allows unauthenticated access for public job browsing.
    """
    permission_classes = []  

    def build_queryset(self, params: dict) -> Iterable[Job]:
        queryset = Job.objects.all().order_by("-created_at")

        try:
            logger.debug("JobFilter.build_queryset params=%s", params)
        except Exception:
            pass
        try:
            print("JobFilter.build_queryset params=", params)
        except Exception:
            pass

        search = params.get("search") or params.get("q") or ""
        locations = safe_list(params.get("location"))
        experience_levels = safe_list(params.get("experience_level"))
        job_types = safe_list(params.get("job_type"))
        skills = safe_list(params.get("skills"))
        salary_min = params.get("salary_min")
        salary_max = params.get("salary_max")

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(company__icontains=search) |
                Q(required_skills__icontains=search) |
                Q(preferred_skills__icontains=search) |
                Q(skills__icontains=search)
            )

        if locations:
            logger.debug("Applying location filter: %s", locations)
            print("Applying location filter:", locations)
            q_loc = Q()
            for loc in locations:
                q_loc |= Q(location__icontains=loc)
            queryset = queryset.filter(q_loc)

        if experience_levels:
            logger.debug("Applying experience_level filter: %s", experience_levels)
            print("Applying experience_level filter:", experience_levels)
            queryset = queryset.filter(experience_level__in=experience_levels)

        if job_types:
            queryset = queryset.filter(job_type__in=job_types)


        if skills:
            logger.debug("Applying skills filter: %s", skills)
            print("Applying skills filter:", skills)
            for skill in skills:
                queryset = queryset.filter(
                    Q(skills__icontains=skill) |
                    Q(required_skills__icontains=skill) |
                    Q(preferred_skills__icontains=skill)
                )

        company_sizes = safe_list(params.get("company_size"))
        if company_sizes:
            logger.debug("Applying company_size filter: %s", company_sizes)
            print("Applying company_size filter:", company_sizes)
            q_size = Q()
            for cs in company_sizes:
                q_size |= Q(company_size__icontains=cs)
            queryset = queryset.filter(q_size)

        posted_dates = safe_list(params.get("posted_date"))
        if posted_dates:
            logger.debug("Applying posted_date filter: %s", posted_dates)
            print("Applying posted_date filter:", posted_dates)
            now = timezone.now()
            q_post = Q()
            if any("24" in pd for pd in posted_dates):
                q_post |= Q(created_at__gte=now - timedelta(hours=24))
            if any("7" in pd for pd in posted_dates):
                q_post |= Q(created_at__gte=now - timedelta(days=7))
            if any("30" in pd for pd in posted_dates):
                q_post |= Q(created_at__gte=now - timedelta(days=30))
            if q_post:
                queryset = queryset.filter(q_post)


        try:
            has_salary_field = True
            field = Job._meta.get_field("salary")
        except FieldDoesNotExist:
            has_salary_field = False

        try:
            if has_salary_field:
                min_s = float(salary_min) if salary_min not in (None, "") else None
                max_s = float(salary_max) if salary_max not in (None, "") else None

                if min_s is not None and max_s is not None and not (min_s == 0 and max_s == 30):
                    internal = getattr(field, "get_internal_type", lambda: "")( )
                    if internal in ("DecimalField", "FloatField", "IntegerField"):
                        queryset = queryset.filter(salary__gte=min_s, salary__lte=max_s)
        except (ValueError, TypeError):
            pass

        return queryset

    def get(self, request):
        queryset = self.build_queryset(request.GET)
        normalized = [normalize_job(job) for job in queryset]
        logger.debug("JobFilter GET payload=%s results=%d", dict(request.GET), len(normalized))
        return Response(normalized)

    def post(self, request):
        try:
            content_type = getattr(request, 'content_type', None)
            body = request.body
        except Exception:
            content_type = None
            body = None
        print("JobFilter.POST content_type=", content_type)
        try:
            print("JobFilter.POST raw body=", body.decode() if hasattr(body, 'decode') else body)
        except Exception:
            print("JobFilter.POST raw body (binary)", body)

        payload = request.data or {}
        logger.debug("JobFilter POST payload=%s", payload)
        queryset = self.build_queryset(payload)
        normalized = [normalize_job(job) for job in queryset]
        logger.debug("JobFilter POST results_count=%d", len(normalized))
        return Response(normalized)
