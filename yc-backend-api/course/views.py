from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from .models import Course, Topic, Subtopic
from .serializers import (
    CourseSerializer, CourseBasicSerializer,
    TopicSerializer, TopicBasicSerializer,
    SubtopicSerializer
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to create, update, or delete.
    Regular authenticated users can only read.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.is_staff


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course model with CRUD operations.
    """
    queryset = Course.objects.all()
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'retrieve':
            return CourseSerializer  # Include nested topics
        return CourseBasicSerializer

    def get_queryset(self):
        """
        Optionally filter courses by category.
        """
        queryset = Course.objects.all()
        category = self.request.query_params.get('category', None)
        if category is not None:
            queryset = queryset.filter(category=category)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy to handle cascade deletion gracefully.
        """
        try:
            instance = self.get_object()
            # Check if course has topics
            if instance.topics.exists():
                return Response(
                    {
                        "error": "Constraint violation",
                        "message": "Cannot delete course with existing topics"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except IntegrityError as e:
            return Response(
                {
                    "error": "Constraint violation",
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class TopicViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Topic model with CRUD operations.
    """
    queryset = Topic.objects.select_related('course').all()
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'retrieve':
            return TopicSerializer  # Include nested subtopics
        return TopicBasicSerializer

    def get_queryset(self):
        """
        Optionally filter topics by course.
        """
        queryset = Topic.objects.select_related('course').all()
        course_id = self.request.query_params.get('course', None)
        if course_id is not None:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Override create to handle validation and auto-ordering.
        """
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            if 'unique constraint' in str(e).lower():
                return Response(
                    {
                        "error": "Constraint violation",
                        "message": "A topic with this order index already exists for this course"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {
                    "error": "Database error",
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy to handle cascade deletion gracefully.
        """
        try:
            instance = self.get_object()
            # Check if topic has subtopics
            if instance.subtopics.exists():
                return Response(
                    {
                        "error": "Constraint violation",
                        "message": "Cannot delete topic with existing subtopics"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except IntegrityError as e:
            return Response(
                {
                    "error": "Constraint violation",
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class SubtopicViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Subtopic model with CRUD operations.
    """
    queryset = Subtopic.objects.select_related('topic__course').all()
    serializer_class = SubtopicSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """
        Optionally filter subtopics by topic.
        """
        queryset = Subtopic.objects.select_related('topic__course').all()
        topic_id = self.request.query_params.get('topic', None)
        if topic_id is not None:
            queryset = queryset.filter(topic_id=topic_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Override create to handle validation and auto-ordering.
        """
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            if 'unique constraint' in str(e).lower():
                return Response(
                    {
                        "error": "Constraint violation",
                        "message": "A subtopic with this order index already exists for this topic"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {
                    "error": "Database error",
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )