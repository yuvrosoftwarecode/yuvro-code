from rest_framework import serializers
from .models import CodeSubmission


class TestCaseSerializer(serializers.Serializer):
    input = serializers.CharField()
    expected_output = serializers.CharField()
    weight = serializers.IntegerField(default=1)


class PeerSubmissionSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    submission_id = serializers.UUIDField()
    code = serializers.CharField()


class CodeExecutionRequestSerializer(serializers.Serializer):
    QUESTION_SUBMISSION_TYPES = [
        ("learn", "Learn"),
        ("practice", "Practice Questions"),
        ("skill_test", "Skill Test"),
        ("contest", "Contest"),
        ("mock_interview", "Mock Interview")
    ]
    
    code = serializers.CharField()
    language = serializers.CharField()
    question_id = serializers.UUIDField(required=False, allow_null=True)
    question_submission_type = serializers.ChoiceField(
        choices=QUESTION_SUBMISSION_TYPES,
        default="practice"
    )
    test_cases_basic = TestCaseSerializer(many=True, required=False, default=list)
    test_cases_advanced = TestCaseSerializer(many=True, required=False, default=list)
    test_cases_custom = TestCaseSerializer(many=True, required=False, default=list)
    peer_submissions = PeerSubmissionSerializer(many=True, required=False, default=list)
    timeout = serializers.IntegerField(default=10)


class TestCaseResultSerializer(serializers.Serializer):
    input = serializers.CharField()
    expected_output = serializers.CharField()
    actual_output = serializers.CharField()
    status = serializers.CharField()
    runtime_ms = serializers.FloatField()
    memory_kb = serializers.FloatField(required=False)
    peak_memory_kb = serializers.FloatField(required=False)
    scoring = serializers.CharField(required=False)


class ExecutionSummarySerializer(serializers.Serializer):
    runtime_ms = serializers.FloatField()
    peak_memory_kb = serializers.FloatField()
    passed_test_cases = serializers.IntegerField()
    total_test_cases = serializers.IntegerField()
    score_percent = serializers.FloatField()


class PlagiarismMatchSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    submission_id = serializers.UUIDField()
    similarity_score = serializers.FloatField()


class PlagiarismReportSerializer(serializers.Serializer):
    flagged = serializers.BooleanField()
    max_similarity = serializers.FloatField()
    matches = PlagiarismMatchSerializer(many=True)


class CodeExecutionResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    language = serializers.CharField()
    test_cases_basic = TestCaseResultSerializer(many=True)
    test_cases_advanced = TestCaseResultSerializer(many=True)
    test_cases_custom = TestCaseResultSerializer(many=True)
    execution_summary = ExecutionSummarySerializer()
    plagiarism_report = PlagiarismReportSerializer()


class CodeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeSubmission
        fields = [
            'id', 'user', 'code', 'language', 'question',
            'total_test_cases', 'passed_test_cases',
            'execution_time_ms', 'peak_memory_kb', 'score_percent',
            'plagiarism_flagged', 'max_similarity',
            'test_results_basic', 'test_results_advanced', 'test_results_custom',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']