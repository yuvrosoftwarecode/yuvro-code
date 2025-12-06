from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.db import transaction
from django.conf import settings
from .models import CodeSubmission, PlagiarismReport
from .serializers import (
    CodeSubmissionSerializer,
    CodeExecutionRequestSerializer,
    PlagiarismReportSerializer,
)
from .services import CodeExecutorService, TestCaseService, PlagiarismService
from course.models import Question


class CodeExecutorViewSet(viewsets.ModelViewSet):
    """ViewSet for code execution and submission management"""

    serializer_class = CodeSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CodeSubmission.objects.filter(user=self.request.user)

    @extend_schema(
        request=CodeExecutionRequestSerializer,
        responses={200: CodeSubmissionSerializer},
        description="Execute code and run test cases",
    )
    @action(detail=False, methods=["post"])
    def execute(self, request):
        """Execute code, run test cases, check plagiarism, and save submission"""
        serializer = CodeExecutionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            question = Question.objects.get(id=data["question_id"], type='coding')
        except Question.DoesNotExist:
            return Response(
                {"error": "Coding question not found"}, status=status.HTTP_404_NOT_FOUND
            )

        with transaction.atomic():
            # Create submission
            submission = CodeSubmission.objects.create(
                user=request.user,
                question=question,
                code=data["code"],
                language=data["language"],
                status="running",
            )

            try:
                # Run test cases using FastAPI (this includes code execution)
                test_cases_data = data.get("test_cases", [])
                test_results = TestCaseService.run_test_cases(
                    submission, test_cases_data
                )

                if not test_results["success"]:
                    raise Exception(test_results.get("error", "Test execution failed"))

                # Check plagiarism
                plagiarism_results = PlagiarismService.check_plagiarism(submission)

                # Update submission with results
                submission.status = "completed" if test_results["success"] else "error"
                submission.output = test_results.get("output", "")
                submission.error_message = test_results.get("error", "")
                submission.execution_time = test_results.get("execution_time", 0)
                submission.memory_usage = test_results.get("memory_usage", 0)
                submission.test_cases_passed = test_results["passed"]
                submission.total_test_cases = test_results["total"]
                submission.plagiarism_score = plagiarism_results["similarity_score"]
                submission.plagiarism_details = plagiarism_results
                submission.save()

                # Return detailed results without exposing test case details
                response_data = CodeSubmissionSerializer(submission).data

                # Create sanitized test results for submission (hide test case details)
                sanitized_test_results = {
                    "passed": test_results["passed"],
                    "total": test_results["total"],
                    "success": test_results["success"],
                    "execution_time": test_results.get("execution_time", 0),
                    "memory_usage": test_results.get("memory_usage", 0),
                    # Don't include individual test case results or expected/actual values
                    "summary": f"{test_results['passed']} out of {test_results['total']} test cases passed",
                }

                # Also ensure the main response has the execution stats
                response_data["execution_time"] = test_results.get("execution_time", 0)
                response_data["memory_usage"] = test_results.get("memory_usage", 0)

                response_data.update(
                    {
                        "test_results": sanitized_test_results,
                        "plagiarism_flagged": plagiarism_results["flagged"],
                    }
                )

                return Response(response_data, status=status.HTTP_200_OK)

            except Exception as e:
                submission.status = "error"
                submission.error_message = str(e)
                submission.save()

                return Response(
                    {"error": "Code execution failed", "details": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

    @extend_schema(
        request=CodeExecutionRequestSerializer,
        responses={200: dict},
        description="Run code with test cases without saving to database",
    )
    @action(detail=False, methods=["post"], url_path="run")
    def run_code(self, request):
        """Run code with test cases without saving submission to database"""
        serializer = CodeExecutionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            question = Question.objects.get(id=data["question_id"], type='coding')
        except Question.DoesNotExist:
            return Response(
                {"error": "Coding question not found"}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Create a temporary submission object (not saved to DB)
            temp_submission = CodeSubmission(
                user=request.user,
                question=question,
                code=data["code"],
                language=data["language"],
            )

            # Run test cases using FastAPI
            test_cases_data = data.get("test_cases", [])
            test_results = TestCaseService.run_test_cases(
                temp_submission, test_cases_data
            )

            if not test_results["success"]:
                return Response(
                    {
                        "error": "Code execution failed",
                        "details": test_results.get("error", "Unknown error"),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Return results without saving to database
            return Response(
                {
                    "problem_title": question.title,
                    "code": data["code"],
                    "language": data["language"],
                    "status": "completed" if test_results["success"] else "error",
                    "output": test_results.get("output", ""),
                    "error_message": test_results.get("error", ""),
                    "execution_time": test_results.get("execution_time", 0),
                    "memory_usage": test_results.get("memory_usage", 0),
                    "test_cases_passed": test_results["passed"],
                    "total_test_cases": test_results["total"],
                    "test_results": test_results,
                    "plagiarism_flagged": False,  # No plagiarism check for run-only
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": "Code execution failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "question_id", str, description="Filter by coding question ID"
            )
        ],
        description="Get user's code submissions",
    )
    def list(self, request):
        """List user's submissions with optional filtering"""
        queryset = self.get_queryset()

        question_id = request.query_params.get("question_id")
        if question_id:
            queryset = queryset.filter(question_id=question_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(description="Get detailed submission results")
    def retrieve(self, request, pk=None):
        """Get detailed submission with test results"""
        submission = self.get_object()
        serializer = self.get_serializer(submission)
        return Response(serializer.data)


# TestCaseViewSet removed - test cases now come from course API


class PlagiarismViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for plagiarism reports (instructors only)"""

    serializer_class = PlagiarismReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only instructors can view plagiarism reports
        if not self.request.user.groups.filter(name="instructors").exists():
            return PlagiarismReport.objects.none()
        return PlagiarismReport.objects.all().order_by("-similarity_score")

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "min_similarity", float, description="Minimum similarity score"
            )
        ],
        description="Get plagiarism reports",
    )
    def list(self, request):
        """List plagiarism reports with filtering"""
        queryset = self.get_queryset()

        min_similarity = request.query_params.get("min_similarity")
        if min_similarity:
            try:
                min_similarity = float(min_similarity)
                queryset = queryset.filter(similarity_score__gte=min_similarity)
            except ValueError:
                pass

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
