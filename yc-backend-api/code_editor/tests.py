from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, AsyncMock
import json

from .models import CodeSubmission
from .services import CodeExecutorService, CodeSubmissionService

User = get_user_model()


class CodeSubmissionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_code_submission(self):
        submission = CodeSubmission.objects.create(
            user=self.user,
            code='print("Hello World")',
            language='python',
            problem_id='test-problem',
            status='completed',
            total_test_cases=2,
            passed_test_cases=2,
            marks=100.0
        )
        
        self.assertEqual(submission.user, self.user)
        self.assertEqual(submission.language, 'python')
        self.assertEqual(submission.status, 'completed')
        self.assertEqual(submission.marks, 100.0)
        self.assertFalse(submission.plagiarism_flagged)


class CodeSubmissionServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_submission(self):
        submission = CodeSubmissionService.create_submission(
            user=self.user,
            code='print("Hello")',
            language='python',
            problem_id='test'
        )
        
        self.assertEqual(submission.user, self.user)
        self.assertEqual(submission.code, 'print("Hello")')
        self.assertEqual(submission.language, 'python')
        self.assertEqual(submission.status, 'pending')

    def test_update_submission_results(self):
        submission = CodeSubmissionService.create_submission(
            user=self.user,
            code='print("Hello")',
            language='python'
        )
        
        execution_result = {
            "status": "success",
            "language": "python",
            "execution_summary": {
                "runtime_ms": 100,
                "peak_memory_kb": 512,
                "passed_test_cases": 2,
                "total_test_cases": 2,
                "marks": 100.0
            },
            "plagiarism_report": {
                "flagged": False,
                "max_similarity": 0.1,
                "matches": []
            },
            "test_cases_basic": [],
            "test_cases_advanced": [],
            "test_cases_custom": []
        }
        
        updated_submission = CodeSubmissionService.update_submission_results(
            submission, execution_result
        )
        
        self.assertEqual(updated_submission.status, 'success')
        self.assertEqual(updated_submission.total_test_cases, 2)
        self.assertEqual(updated_submission.passed_test_cases, 2)
        self.assertEqual(updated_submission.marks, 100.0)
        self.assertFalse(updated_submission.plagiarism_flagged)

    def test_get_peer_submissions(self):
        # Create some submissions
        CodeSubmission.objects.create(
            user=self.user,
            code='print("Hello")',
            language='python',
            problem_id='test'
        )
        
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        
        CodeSubmission.objects.create(
            user=other_user,
            code='print("World")',
            language='python',
            problem_id='test'
        )
        
        peer_submissions = CodeSubmissionService.get_peer_submissions(
            language='python',
            problem_id='test',
            exclude_user=self.user,
            limit=5
        )
        
        self.assertEqual(len(peer_submissions), 1)
        self.assertEqual(peer_submissions[0]['code'], 'print("World")')


class CodeExecutorAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    @patch('code_editor.services.CodeExecutorService.execute_code_with_tests')
    def test_execute_code_endpoint(self, mock_execute):
        mock_execute.return_value = {
            "status": "success",
            "language": "python",
            "test_cases_basic": [],
            "test_cases_advanced": [],
            "test_cases_custom": [],
            "execution_summary": {
                "runtime_ms": 100,
                "peak_memory_kb": 512,
                "passed_test_cases": 2,
                "total_test_cases": 2,
                "marks": 100.0
            },
            "plagiarism_report": {
                "flagged": False,
                "max_similarity": 0.0,
                "matches": []
            }
        }
        
        data = {
            "code": "print('Hello World')",
            "language": "python",
            "test_cases_basic": [
                {
                    "input": "",
                    "expected_output": "Hello World",
                    "weight": 1
                }
            ],
            "timeout": 10
        }
        
        response = self.client.post('/api/code-editor/execute/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['language'], 'python')

    def test_get_user_submissions(self):
        # Create a submission
        CodeSubmission.objects.create(
            user=self.user,
            code='print("Hello")',
            language='python',
            status='completed'
        )
        
        response = self.client.get('/api/code-editor/submissions/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['language'], 'python')

    def test_get_user_submissions_with_filters(self):
        # Create submissions with different languages
        CodeSubmission.objects.create(
            user=self.user,
            code='print("Hello")',
            language='python',
            status='completed'
        )
        
        CodeSubmission.objects.create(
            user=self.user,
            code='console.log("Hello")',
            language='javascript',
            status='completed'
        )
        
        # Test language filter
        response = self.client.get('/api/code-editor/submissions/?language=python')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['language'], 'python')

    def test_unauthorized_access(self):
        self.client.force_authenticate(user=None)
        
        data = {
            "code": "print('Hello')",
            "language": "python"
        }
        
        response = self.client.post('/api/code-editor/execute/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)