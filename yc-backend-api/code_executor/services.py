import requests
import json
import difflib
from typing import Dict, List, Tuple, Any
from django.conf import settings
from .models import CodeSubmission, PlagiarismReport
import logging

logger = logging.getLogger(__name__)


class CodeExecutorService:
    """Service for executing code using FastAPI service"""

    def __init__(self):
        self.fastapi_url = getattr(
            settings, "CODE_EXECUTOR_SERVICE_URL", "http://code-executor:8002"
        )

    @classmethod
    def execute_code(
        cls, code: str, language: str, input_data: str = ""
    ) -> Dict[str, Any]:
        """Execute code using FastAPI service"""
        service = cls()

        try:
            # Call FastAPI service
            response = requests.post(
                f"{service.fastapi_url}/execute",
                json={
                    "code": code,
                    "language": language,
                    "input_data": input_data,
                    "timeout": 15,
                },
                timeout=30,
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "success": result.get("success", False),
                    "output": result.get("output", ""),
                    "error": result.get("error", ""),
                    "execution_time": result.get("execution_time", 0),
                    "memory_usage": result.get("memory_usage", 0),
                }
            else:
                return {
                    "success": False,
                    "error": f"FastAPI service error: {response.status_code}",
                    "output": "",
                    "execution_time": 0,
                    "memory_usage": 0,
                }

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to FastAPI service: {str(e)}")
            return {
                "success": False,
                "error": f"Code execution service unavailable: {str(e)}",
                "output": "",
                "execution_time": 0,
                "memory_usage": 0,
            }


class TestCaseService:
    """Service for running test cases against code submissions using FastAPI"""

    def __init__(self):
        self.fastapi_url = getattr(
            settings, "CODE_EXECUTOR_SERVICE_URL", "http://code-executor:8002"
        )

    @classmethod
    def run_test_cases(
        cls, submission: CodeSubmission, test_cases_data: List[Dict] = None
    ) -> Dict[str, Any]:
        """Run all test cases for a problem using FastAPI service"""
        service = cls()

        # Use provided test cases or get from CodingProblem
        if test_cases_data:
            test_cases = test_cases_data
        else:
            # Combine basic and advanced test cases for submission evaluation
            basic_test_cases = submission.coding_problem.test_cases_basic or []
            advanced_test_cases = submission.coding_problem.test_cases_advanced or []
            test_cases = basic_test_cases + advanced_test_cases

        if not test_cases:
            return {"passed": 0, "total": 0, "results": [], "success": True}

        try:
            # Prepare test cases for FastAPI
            test_cases_data = []
            for test_case in test_cases:
                # Handle different test case formats
                input_data = ""
                expected_output = ""

                # Handle different test case formats
                if "input" in test_case:
                    # New format from course API
                    input_data = str(test_case["input"])
                elif "input_data" in test_case:
                    # Old format
                    input_data = test_case["input_data"]
                else:
                    input_data = ""

                # Handle expected output
                if "expected" in test_case:
                    # New format from course API
                    expected_output = str(test_case["expected"])
                elif "expected_output" in test_case:
                    # Old format
                    expected_out = test_case["expected_output"]
                    if isinstance(expected_out, (list, dict)):
                        expected_output = json.dumps(expected_out)
                    else:
                        expected_output = str(expected_out)
                else:
                    expected_output = ""

                test_cases_data.append(
                    {
                        "input_data": input_data,
                        "expected_output": expected_output,
                        "weight": test_case.get("weight", 1),
                    }
                )

            # Call FastAPI service
            response = requests.post(
                f"{service.fastapi_url}/execute-with-tests",
                json={
                    "code": submission.code,
                    "language": submission.language,
                    "test_cases": test_cases_data,
                    "timeout": 15,
                },
                timeout=60,  # Allow more time for multiple test cases
            )

            if response.status_code == 200:
                result = response.json()

                # Convert FastAPI response to our format
                results = []
                for i, test_result in enumerate(result.get("test_results", [])):
                    results.append(
                        {
                            "test_case_id": i,
                            "passed": test_result.get("passed", False),
                            "input_data": test_result.get("input_data", ""),
                            "expected_output": test_result.get("expected_output", ""),
                            "actual_output": test_result.get("actual_output", ""),
                            "error": test_result.get("error", ""),
                            "execution_time": test_result.get("execution_time", 0),
                        }
                    )

                # Extract execution details from FastAPI response
                execution_result = result.get("execution_result", {})

                return {
                    "passed": result.get("total_passed", 0),
                    "total": result.get("total_tests", 0),
                    "results": results,
                    "success": True,
                    "output": execution_result.get("output", ""),
                    "error": execution_result.get("error", ""),
                    "execution_time": execution_result.get("execution_time", 0),
                    "memory_usage": execution_result.get("memory_usage", 0),
                }
            else:
                logger.error(f"FastAPI service error: {response.status_code}")
                return {
                    "passed": 0,
                    "total": len(test_cases),
                    "results": [],
                    "success": False,
                    "error": f"Test execution service error: {response.status_code}",
                }

        except requests.exceptions.RequestException as e:
            logger.error(
                f"Failed to connect to FastAPI service for test cases: {str(e)}"
            )
            return {
                "passed": 0,
                "total": len(test_cases),
                "results": [],
                "success": False,
                "error": f"Test execution service unavailable: {str(e)}",
            }


class PlagiarismService:
    """Service for detecting code plagiarism using FastAPI service"""

    def __init__(self):
        self.fastapi_url = getattr(
            settings, "CODE_EXECUTOR_SERVICE_URL", "http://code-executor:8002"
        )

    @classmethod
    def check_plagiarism(cls, submission: CodeSubmission) -> Dict[str, Any]:
        """Check plagiarism against other submissions using FastAPI service"""
        service = cls()
        similar_submissions = CodeSubmission.objects.filter(
            coding_problem=submission.coding_problem, language=submission.language
        ).exclude(id=submission.id)

        plagiarism_results = []
        max_similarity = 0

        try:
            for other_submission in similar_submissions:
                # Call FastAPI plagiarism check
                response = requests.post(
                    f"{service.fastapi_url}/plagiarism-check",
                    json={
                        "code1": submission.code,
                        "code2": other_submission.code,
                        "language": submission.language,
                    },
                    timeout=10,
                )

                if response.status_code == 200:
                    result = response.json()
                    similarity = result.get("similarity_score", 0)

                    if similarity > 0.3:  # Only store significant similarities
                        plagiarism_results.append(
                            {
                                "submission_id": other_submission.id,
                                "user": other_submission.user.username,
                                "similarity": similarity,
                                "created_at": other_submission.created_at.isoformat(),
                            }
                        )

                        # Create plagiarism report
                        PlagiarismReport.objects.get_or_create(
                            submission1=submission,
                            submission2=other_submission,
                            defaults={
                                "similarity_score": similarity,
                                "similarity_details": {
                                    "method": "fastapi_service",
                                    "threshold": 0.3,
                                    "flagged": result.get("flagged", False),
                                },
                            },
                        )

                    max_similarity = max(max_similarity, similarity)
                else:
                    logger.warning(
                        f"Plagiarism check failed for submission {other_submission.id}"
                    )

        except requests.exceptions.RequestException as e:
            logger.error(
                f"Failed to connect to FastAPI service for plagiarism check: {str(e)}"
            )
            # Fallback to local similarity check
            max_similarity = cls._fallback_similarity_check(
                submission, similar_submissions
            )

        return {
            "similarity_score": max_similarity,
            "similar_submissions": plagiarism_results,
            "flagged": max_similarity > 0.7,  # Flag if >70% similar
        }

    @classmethod
    def _fallback_similarity_check(
        cls, submission: CodeSubmission, similar_submissions
    ) -> float:
        """Fallback similarity check using local difflib"""
        max_similarity = 0

        for other_submission in similar_submissions:
            similarity = cls._calculate_similarity(
                submission.code, other_submission.code
            )
            max_similarity = max(max_similarity, similarity)

        return max_similarity

    @classmethod
    def _calculate_similarity(cls, code1: str, code2: str) -> float:
        """Calculate similarity between two code snippets using difflib"""
        normalized_code1 = cls._normalize_code(code1)
        normalized_code2 = cls._normalize_code(code2)

        matcher = difflib.SequenceMatcher(None, normalized_code1, normalized_code2)
        return matcher.ratio()

    @classmethod
    def _normalize_code(cls, code: str) -> str:
        """Normalize code for plagiarism detection"""
        lines = []
        for line in code.split("\n"):
            # Remove comments
            if "//" in line:
                line = line[: line.index("//")]
            if "#" in line and not line.strip().startswith("#"):
                line = line[: line.index("#")]

            # Remove extra whitespace
            line = " ".join(line.split())
            if line:
                lines.append(line)

        return "\n".join(lines)
