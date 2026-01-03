"""
Pydantic models for the Code Executor Service
"""

from pydantic import BaseModel
from typing import List, Optional


class TestCase(BaseModel):
    input: str
    expected_output: str
    weight: int = 1


class PeerSubmission(BaseModel):
    user_id: str
    submission_id: str
    code: str


class CodeExecutionRequest(BaseModel):
    code: str
    language: str
    test_cases_basic: Optional[List[TestCase]] = []
    test_cases_advanced: Optional[List[TestCase]] = []
    test_cases_custom: Optional[List[TestCase]] = []
    peer_submissions: Optional[List[PeerSubmission]] = []
    timeout: int = 10


class ExecutionSummary(BaseModel):
    runtime_ms: int
    peak_memory_kb: int
    passed_test_cases: int
    total_test_cases: int
    score_percent: float


class PlagiarismReport(BaseModel):
    flagged: bool
    max_similarity: float
    matches: List[dict]


class CodeExecutionResponse(BaseModel):
    status: str
    language: str
    test_cases_basic: List[dict]
    test_cases_advanced: List[dict]
    test_cases_custom: List[dict]
    execution_summary: ExecutionSummary
    plagiarism_report: PlagiarismReport
    error: Optional[str] = None


class LanguageDetails(BaseModel):
    extension: str
    timeout: int
    template: str


class SupportedLanguagesResponse(BaseModel):
    languages: List[str]
    details: dict
    example_problems: dict