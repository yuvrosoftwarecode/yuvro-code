from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
import subprocess
import json
import tempfile
import os
from .models import Course, Topic, Subtopic, CodingProblem
from .serializers import (
    CourseSerializer, CourseBasicSerializer,
    TopicSerializer, TopicBasicSerializer,
    SubtopicSerializer, CodingProblemSerializer
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


class CourseViewSet(viewsets.ModelViewSet): # type: ignore
    """
    ViewSet for Course model with CRUD operations.
    """
    queryset = Course.objects.all()
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):  # type: ignore
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'retrieve':
            return CourseSerializer  # Include nested topics
        return CourseBasicSerializer

    def get_queryset(self):  # type: ignore
        """
        Optionally filter courses by category.
        """
        queryset = Course.objects.all()
        category = self.request.query_params.get('category', None)  # type: ignore
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


class TopicViewSet(viewsets.ModelViewSet): # type: ignore
    """
    ViewSet for Topic model with CRUD operations.
    """
    queryset = Topic.objects.select_related('course').all()
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):  # type: ignore
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'retrieve':
            return TopicSerializer  # Include nested subtopics
        return TopicBasicSerializer

    def get_queryset(self):  # type: ignore
        """
        Optionally filter topics by course.
        """
        queryset = Topic.objects.select_related('course').all()
        course_id = self.request.query_params.get('course', None)  # type: ignore
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


class SubtopicViewSet(viewsets.ModelViewSet): # type: ignore
    """
    ViewSet for Subtopic model with CRUD operations.
    """
    queryset = Subtopic.objects.select_related('topic__course').all()
    serializer_class = SubtopicSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):  # type: ignore
        """
        Optionally filter subtopics by topic.
        """
        queryset = Subtopic.objects.select_related('topic__course').all()
        topic_id = self.request.query_params.get('topic', None)  # type: ignore
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

class CodingProblemViewSet(viewsets.ModelViewSet): # type: ignore
    """
    ViewSet for CodingProblem model with CRUD and filtering by subtopic.
    """
    queryset = CodingProblem.objects.select_related('sub_topic__topic__course').all()
    serializer_class = CodingProblemSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):  # type: ignore
        """
        Optionally filter coding problems by subtopic.
        """
        queryset = CodingProblem.objects.select_related('sub_topic__topic__course').all()
        subtopic_id = self.request.query_params.get('subtopic', None)  # type: ignore
        if subtopic_id is not None:
            queryset = queryset.filter(sub_topic_id=subtopic_id)
        return queryset


def execute_python_code(code: str, test_cases: list) -> dict:
    """
    Executes Python user code safely against test cases.
    User must define:
        def solution(input_data):
    """
    results = []

    for idx, test_case in enumerate(test_cases):
        input_data = test_case.get("input", {})
        expected_output = test_case.get("expected_output")

        wrapped = f"""
import json

input_data = {json.dumps(input_data)}

{code}

result = solution(input_data)
print(json.dumps(result))
"""

        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
                f.write(wrapped)
                f.flush()
                file_path = f.name

            proc = subprocess.run(
                ["python3", file_path],
                capture_output=True,
                text=True,
                timeout=5,
            )

            stdout = proc.stdout.strip()
            stderr = proc.stderr.strip()

            # Use ONLY last printed line (avoid debug prints)
            actual_output = None

            if stdout:
                last_line = stdout.split("\n")[-1]
                try:
                    actual_output = json.loads(last_line)
                except:
                    actual_output = last_line

            passed = actual_output == expected_output

            results.append({
                "testId": f"test-{idx}",
                "passed": passed,
                "actualOutput": actual_output,
                "expectedOutput": expected_output,
                "error": stderr or None,
            })

        except subprocess.TimeoutExpired:
            results.append({
                "testId": f"test-{idx}",
                "passed": False,
                "error": "Execution timed out",
            })
        except Exception as e:
            results.append({
                "testId": f"test-{idx}",
                "passed": False,
                "error": str(e),
            })
        finally:
            try:
                os.unlink(file_path)
            except:
                pass

    total_passed = sum(1 for r in results if r['passed'])

    return {
        "success": total_passed == len(results),
        "results": results,
        "totalPassed": total_passed,
        "totalTests": len(results),
    }


#   EXECUTE CODE API ENDPOINT
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def execute_code(request):
    """
    POST /api/execute/
    Execute code against Python, C, C++, Java test cases.
    Currently only Python is supported.
    """

    code = request.data.get("code", "")
    language = request.data.get("language", "python").lower()
    test_cases = request.data.get("test_cases", [])

    if not code:
        return Response({"error": "Missing code"}, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(test_cases, list) or len(test_cases) == 0:
        return Response({"error": "Invalid or missing test cases"}, status=status.HTTP_400_BAD_REQUEST)

    if language == "python":
        result = execute_python_code(code, test_cases)
        return Response(result)

    return Response({"error": f"Language '{language}' not supported yet"}, status=400)
