from rest_framework import serializers
from .models import CodeSubmission, PlagiarismReport
from course.models import Question


class CodeSubmissionSerializer(serializers.ModelSerializer):
    problem_title = serializers.CharField(source="question.title", read_only=True)
    problem_description = serializers.CharField(
        source="question.content", read_only=True
    )

    class Meta:
        model = CodeSubmission
        fields = [
            "id",
            "question",
            "problem_title",
            "problem_description",
            "code",
            "language",
            "status",
            "output",
            "error_message",
            "execution_time",
            "memory_usage",
            "test_cases_passed",
            "total_test_cases",
            "plagiarism_score",
            "plagiarism_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "problem_title",
            "problem_description",
            "status",
            "output",
            "error_message",
            "execution_time",
            "memory_usage",
            "test_cases_passed",
            "total_test_cases",
            "plagiarism_score",
            "plagiarism_details",
            "created_at",
            "updated_at",
        ]


class CodeExecutionRequestSerializer(serializers.Serializer):
    code = serializers.CharField()
    language = serializers.ChoiceField(choices=CodeSubmission.LANGUAGE_CHOICES)
    question_id = serializers.UUIDField()
    test_cases = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="List of test case objects with input_data, expected_output, is_hidden, weight",
    )


class PlagiarismReportSerializer(serializers.ModelSerializer):
    submission1_user = serializers.CharField(
        source="submission1.user.username", read_only=True
    )
    submission2_user = serializers.CharField(
        source="submission2.user.username", read_only=True
    )

    class Meta:
        model = PlagiarismReport
        fields = [
            "id",
            "submission1",
            "submission2",
            "submission1_user",
            "submission2_user",
            "similarity_score",
            "similarity_details",
            "created_at",
        ]
