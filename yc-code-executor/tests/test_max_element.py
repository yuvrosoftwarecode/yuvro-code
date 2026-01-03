import asyncio
import pytest
import httpx
from typing import Dict, List
import sys
import os

# Add the parent directory to the path so we can import from services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8002"

class TestMaskingLogic:
    """Test the masking logic for different test case categories"""
    
    def test_partial_masking_function(self):
        """Test the partial masking function directly"""
        from services.code_executer import CodeExecutionService
        
        # Test short string
        short_result = CodeExecutionService._mask_data_partially("hello", "test1")
        assert "he" in short_result  # Should keep first 2 chars
        assert "o" in short_result   # Should keep last char
        assert "***" in short_result # Should have masking
        assert "#" in short_result   # Should have hash
        print(f"Short string 'hello' -> '{short_result}'")
        
        # Test medium string
        medium_result = CodeExecutionService._mask_data_partially("[1, 2, 3, 4, 5]", "test2")
        assert medium_result.startswith("[")  # Should keep first char
        assert medium_result.count("*") > 0  # Should have some masking
        assert "#" in medium_result          # Should have hash
        print(f"Medium string '[1, 2, 3, 4, 5]' -> '{medium_result}'")
        
        # Test long string
        long_input = "This is a longer test string with multiple words"
        long_result = CodeExecutionService._mask_data_partially(long_input, "test3")
        assert long_result.startswith("T")   # Should keep first char
        assert long_result.count("*") > 5   # Should have significant masking
        assert "#" in long_result            # Should have hash
        print(f"Long string -> '{long_result}'")
        
        # Test empty string
        empty_result = CodeExecutionService._mask_data_partially("", "test4")
        assert empty_result == "***#test4"
        print(f"Empty string -> '{empty_result}'")
        
        print("✅ Partial masking function tests passed!")
    
    @pytest.mark.asyncio
    async def test_basic_tests_no_masking(self):
        """Test that basic test cases are not masked"""
        test_cases_basic = [
            {"input": "[1, 3, 2, 5, 4]", "expected_output": "5", "weight": 1}
        ]
        
        python_code = """
def find_max(arr):
    return max(arr)

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_max(arr)
    print(result)
"""
        
        request_data = {
            "code": python_code,
            "language": "python",
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": [],
            "test_cases_custom": [],
            "peer_submissions": [],
            "timeout": 10
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        # Check that basic test cases are NOT masked
        basic_result = result["test_cases_basic"][0]
        assert basic_result["input"] == "[1, 3, 2, 5, 4]"  # Should be unmasked
        assert basic_result["expected_output"] == "5"       # Should be unmasked
        assert basic_result["actual_output"] == "5"         # Should be unmasked
        
        print("✅ Basic test cases are not masked")
    
    @pytest.mark.asyncio
    async def test_advanced_tests_masked(self):
        """Test that advanced test cases are masked"""
        test_cases_advanced = [
            {"input": "[-1, -5, -3, -2]", "expected_output": "-1", "weight": 2}
        ]
        
        python_code = """
def find_max(arr):
    return max(arr)

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_max(arr)
    print(result)
"""
        
        request_data = {
            "code": python_code,
            "language": "python",
            "test_cases_basic": [],
            "test_cases_advanced": test_cases_advanced,
            "test_cases_custom": [],
            "peer_submissions": [],
            "timeout": 10
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        # Check that advanced test cases ARE masked
        advanced_result = result["test_cases_advanced"][0]
        assert advanced_result["input"] != "[-1, -5, -3, -2]"  # Should be masked
        assert advanced_result["expected_output"] != "-1"       # Should be masked
        assert advanced_result["actual_output"] != "-1"         # Should be masked
        
        # Should contain masking indicators
        assert "*" in advanced_result["input"]
        assert "*" in advanced_result["expected_output"]
        assert "*" in advanced_result["actual_output"]
        assert "#" in advanced_result["input"]
        
        print(f"✅ Advanced test cases are masked:")
        print(f"  Input: {advanced_result['input']}")
        print(f"  Expected: {advanced_result['expected_output']}")
        print(f"  Actual: {advanced_result['actual_output']}")
    
    @pytest.mark.asyncio
    async def test_custom_tests_hidden(self):
        """Test that custom test cases are completely hidden"""
        test_cases_custom = [
            {"input": "[999, 1000, 998]", "expected_output": "1000", "weight": 1}
        ]
        
        python_code = """
def find_max(arr):
    return max(arr)

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_max(arr)
    print(result)
"""
        
        request_data = {
            "code": python_code,
            "language": "python",
            "test_cases_basic": [],
            "test_cases_advanced": [],
            "test_cases_custom": test_cases_custom,
            "peer_submissions": [],
            "timeout": 10
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        # Check that custom test cases are completely hidden
        custom_result = result["test_cases_custom"][0]
        assert custom_result["input"] == "***#hidden"
        assert custom_result["expected_output"] == "***#hidden"
        assert custom_result["actual_output"] == "***#hidden"
        assert custom_result["scoring"] == "ignored"
        
        print("✅ Custom test cases are completely hidden")
    
    @pytest.mark.asyncio
    async def test_custom_tests_not_counted_in_score(self):
        """Test that custom test cases don't affect the score calculation"""
        test_cases_basic = [
            {"input": "[1, 3, 2, 5, 4]", "expected_output": "5", "weight": 1}
        ]
        test_cases_custom = [
            {"input": "[999, 1000, 998]", "expected_output": "1000", "weight": 5}  # High weight
        ]
        
        python_code = """
def find_max(arr):
    return max(arr)

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_max(arr)
    print(result)
"""
        
        request_data = {
            "code": python_code,
            "language": "python",
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": [],
            "test_cases_custom": test_cases_custom,
            "peer_submissions": [],
            "timeout": 10
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        # Score should be 100% based only on basic tests (weight 1)
        # Custom test weight (5) should be ignored
        execution_summary = result["execution_summary"]
        assert execution_summary["score_percent"] == 100.0
        assert execution_summary["total_test_cases"] == 1  # Only basic test counted
        assert execution_summary["passed_test_cases"] == 1  # Only basic test counted
        
        print("✅ Custom test cases don't affect score calculation")
    
    @pytest.mark.asyncio
    async def test_mixed_test_categories_masking(self):
        """Test masking behavior with all three test categories"""
        test_cases_basic = [
            {"input": "[1, 2, 3]", "expected_output": "3", "weight": 1}
        ]
        test_cases_advanced = [
            {"input": "[10, 20, 30]", "expected_output": "30", "weight": 2}
        ]
        test_cases_custom = [
            {"input": "[100, 200, 300]", "expected_output": "300", "weight": 1}
        ]
        
        python_code = """
def find_max(arr):
    return max(arr)

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_max(arr)
    print(result)
"""
        
        request_data = {
            "code": python_code,
            "language": "python",
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": test_cases_advanced,
            "test_cases_custom": test_cases_custom,
            "peer_submissions": [],
            "timeout": 10
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        # Basic: not masked
        basic_result = result["test_cases_basic"][0]
        assert basic_result["input"] == "[1, 2, 3]"
        assert basic_result["expected_output"] == "3"
        assert basic_result["actual_output"] == "3"
        
        # Advanced: partially masked
        advanced_result = result["test_cases_advanced"][0]
        assert "*" in advanced_result["input"]
        assert "*" in advanced_result["expected_output"]
        assert "#" in advanced_result["input"]
        
        # Custom: completely hidden
        custom_result = result["test_cases_custom"][0]
        assert custom_result["input"] == "***#hidden"
        assert custom_result["expected_output"] == "***#hidden"
        assert custom_result["actual_output"] == "***#hidden"
        
        # Score calculation: only basic (1) + advanced (2) = 3 total weight
        execution_summary = result["execution_summary"]
        assert execution_summary["score_percent"] == 100.0
        assert execution_summary["total_test_cases"] == 2  # Basic + Advanced only
        
        print("✅ Mixed test categories masking works correctly")
        print(f"  Basic (unmasked): {basic_result['input']}")
        print(f"  Advanced (masked): {advanced_result['input']}")
        print(f"  Custom (hidden): {custom_result['input']}")


class TestMaxElementProblem:
    
    @pytest.fixture
    def test_cases_basic(self):
        return [
            {
                "input": "[1, 3, 2, 5, 4]",
                "expected_output": "5",
                "weight": 1
            },
            {
                "input": "[10, 20, 30, 5]",
                "expected_output": "30",
                "weight": 1
            },
            {
                "input": "[7]",
                "expected_output": "7",
                "weight": 1
            }
        ]
    
    @pytest.fixture
    def test_cases_advanced(self):
        return [
            {
                "input": "[-1, -5, -3, -2]",
                "expected_output": "-1",
                "weight": 2
            },
            {
                "input": "[100, 200, 150, 300, 250]",
                "expected_output": "300",
                "weight": 2
            },
            {
                "input": "[0, 0, 0, 1, 0]",
                "expected_output": "1",
                "weight": 3
            }
        ]
    
    @pytest.fixture
    def test_cases_custom(self):
        return [
            {
                "input": "[999, 1000, 998]",
                "expected_output": "1000",
                "weight": 1
            }
        ]
    
    @pytest.fixture
    def python_solution_correct(self):
        return """
def find_max(arr):
    return max(arr)

import json
import sys

if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_max(arr)
    print(result)
"""
    
    @pytest.fixture
    def python_solution_variant1(self):
        return """
def find_maximum(numbers):
    max_val = numbers[0]
    for num in numbers:
        if num > max_val:
            max_val = num
    return max_val

import json
import sys

if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_maximum(arr)
    print(result)
"""
    
    @pytest.fixture
    def python_solution_variant2(self):
        return """
def get_max_element(data):
    maximum = data[0]
    for i in range(1, len(data)):
        if data[i] > maximum:
            maximum = data[i]
    return maximum

import json
import sys

if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = get_max_element(arr)
    print(result)
"""
    
    @pytest.fixture
    def c_solution_correct(self):
        return """
#include <stdio.h>
#include <stdlib.h>

int find_max(int arr[], int n) {
    int max = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

int main() {
    int n;
    scanf("%d", &n);
    int* arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    
    int result = find_max(arr, n);
    printf("%d", result);
    
    free(arr);
    return 0;
}
"""
    
    @pytest.fixture
    def cpp_solution_correct(self):
        return """
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int find_max(vector<int>& arr) {
    return *max_element(arr.begin(), arr.end());
}

int main() {
    int n;
    cin >> n;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    int result = find_max(arr);
    cout << result;
    
    return 0;
}
"""
    
    @pytest.fixture
    def java_solution_correct(self):
        return """
import java.util.*;

public class Solution {
    public static int findMax(int[] arr) {
        int max = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        return max;
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        
        int result = findMax(arr);
        System.out.print(result);
    }
}
"""
    
    def create_peer_submissions(self, language: str) -> List[Dict]:
        """Create peer submissions for plagiarism testing"""
        if language == "python":
            return [
                {
                    "user_id": "user1",
                    "submission_id": "sub1",
                    "code": """
def find_max(arr):
    return max(arr)

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_max(arr)
    print(result)
"""
                },
                {
                    "user_id": "user2", 
                    "submission_id": "sub2",
                    "code": """
def find_maximum(numbers):
    max_val = numbers[0]
    for num in numbers:
        if num > max_val:
            max_val = num
    return max_val

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_maximum(arr)
    print(result)
"""
                }
            ]
        elif language == "c":
            return [
                {
                    "user_id": "user3",
                    "submission_id": "sub3", 
                    "code": """
#include <stdio.h>
#include <stdlib.h>

int find_max(int arr[], int n) {
    int max = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

int main() {
    int n;
    scanf("%d", &n);
    int* arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    int result = find_max(arr, n);
    printf("%d", result);
    free(arr);
    return 0;
}
"""
                }
            ]
        return []
    
    @pytest.mark.asyncio
    async def test_python_solution_with_plagiarism(self, test_cases_basic, test_cases_advanced, test_cases_custom, python_solution_correct):
        """Test Python solution with plagiarism detection and verify masking behavior"""
        peer_submissions = self.create_peer_submissions("python")
        
        request_data = {
            "code": python_solution_correct,
            "language": "python",
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": test_cases_advanced,
            "test_cases_custom": test_cases_custom,
            "peer_submissions": peer_submissions,
            "timeout": 10
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        # Check execution results
        assert result["status"] == "success"
        assert result["language"] == "python"
        
        # Check test case results
        assert len(result["test_cases_basic"]) == 3
        assert len(result["test_cases_advanced"]) == 3
        assert len(result["test_cases_custom"]) == 1
        
        # Verify masking behavior
        # Basic tests should NOT be masked
        for basic_result in result["test_cases_basic"]:
            assert "***" not in basic_result["input"]
            assert "***" not in basic_result["expected_output"]
            assert "***" not in basic_result["actual_output"]
        
        # Advanced tests should be partially masked
        for advanced_result in result["test_cases_advanced"]:
            assert "*" in advanced_result["input"] or "#" in advanced_result["input"]
            assert "*" in advanced_result["expected_output"] or "#" in advanced_result["expected_output"]
            assert "*" in advanced_result["actual_output"] or "#" in advanced_result["actual_output"]
        
        # Custom tests should be completely hidden
        for custom_result in result["test_cases_custom"]:
            assert custom_result["input"] == "***#hidden"
            assert custom_result["expected_output"] == "***#hidden"
            assert custom_result["actual_output"] == "***#hidden"
            assert custom_result["scoring"] == "ignored"
        
        # Check execution summary - custom tests should not count towards total
        execution_summary = result["execution_summary"]
        assert execution_summary["passed_test_cases"] == 6  # Only basic + advanced
        assert execution_summary["total_test_cases"] == 6   # Only basic + advanced
        assert execution_summary["score_percent"] == 100.0
        
        # Check plagiarism report
        plagiarism_report = result["plagiarism_report"]
        assert "flagged" in plagiarism_report
        assert "max_similarity" in plagiarism_report
        assert "matches" in plagiarism_report
        
        print(f"✅ Python test passed with masking verification")
        print(f"   Plagiarism score: {plagiarism_report['max_similarity']}")
        print(f"   Score calculation excludes custom tests: {execution_summary['score_percent']}%")
    
    @pytest.mark.asyncio
    async def test_c_solution_with_plagiarism(self, test_cases_basic, test_cases_advanced, test_cases_custom, c_solution_correct):
        """Test C solution with plagiarism detection and verify masking behavior"""
        peer_submissions = self.create_peer_submissions("c")
        
        request_data = {
            "code": c_solution_correct,
            "language": "c",
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": test_cases_advanced,
            "test_cases_custom": test_cases_custom,
            "peer_submissions": peer_submissions,
            "timeout": 15
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        assert result["status"] == "success"
        assert result["language"] == "c"
        
        # Verify masking behavior for C language
        # Basic tests should NOT be masked
        for basic_result in result["test_cases_basic"]:
            # Check that original input values are preserved (not masked)
            assert any(char.isdigit() for char in basic_result["input"])
            assert "***#hidden" not in basic_result["input"]
        
        # Advanced tests should be partially masked
        for advanced_result in result["test_cases_advanced"]:
            # Should have some masking indicators
            assert "*" in advanced_result["input"] or "#" in advanced_result["input"]
        
        # Custom tests should be completely hidden
        for custom_result in result["test_cases_custom"]:
            assert custom_result["input"] == "***#hidden"
            assert custom_result["expected_output"] == "***#hidden"
            assert custom_result["actual_output"] == "***#hidden"
            assert custom_result["scoring"] == "ignored"
        
        execution_summary = result["execution_summary"]
        assert execution_summary["passed_test_cases"] == 6  # Only basic + advanced
        assert execution_summary["total_test_cases"] == 6   # Only basic + advanced
        assert execution_summary["score_percent"] == 100.0
        
        plagiarism_report = result["plagiarism_report"]
        print(f"✅ C test passed with masking verification")
        print(f"   Plagiarism score: {plagiarism_report['max_similarity']}")
        print(f"   Custom tests excluded from scoring")
    
    @pytest.mark.asyncio
    async def test_cpp_solution_with_plagiarism(self, test_cases_basic, test_cases_advanced, test_cases_custom, cpp_solution_correct):
        """Test C++ solution and verify masking behavior"""
        request_data = {
            "code": cpp_solution_correct,
            "language": "cpp",
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": test_cases_advanced,
            "test_cases_custom": test_cases_custom,
            "peer_submissions": [],  # No peer submissions for this test
            "timeout": 15
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        assert result["status"] == "success"
        assert result["language"] == "cpp"
        
        # Verify masking behavior
        # Basic tests should NOT be masked
        basic_inputs = [tc["input"] for tc in test_cases_basic]
        for i, basic_result in enumerate(result["test_cases_basic"]):
            # Should contain recognizable parts of original input
            assert any(char.isdigit() for char in basic_result["input"])
        
        # Advanced tests should be partially masked
        for advanced_result in result["test_cases_advanced"]:
            assert "*" in advanced_result["input"] or "#" in advanced_result["input"]
        
        # Custom tests should be completely hidden
        for custom_result in result["test_cases_custom"]:
            assert custom_result["input"] == "***#hidden"
            assert custom_result["scoring"] == "ignored"
        
        execution_summary = result["execution_summary"]
        assert execution_summary["passed_test_cases"] == 6  # Only basic + advanced
        assert execution_summary["total_test_cases"] == 6   # Only basic + advanced
        assert execution_summary["score_percent"] == 100.0
        
        plagiarism_report = result["plagiarism_report"]
        assert plagiarism_report["flagged"] == False  # No peer submissions
        print(f"✅ C++ test passed with masking verification")
        print(f"   No plagiarism check (no peer submissions)")
        print(f"   Score excludes custom tests: {execution_summary['score_percent']}%")
    
    @pytest.mark.asyncio
    async def test_java_solution_with_plagiarism(self, test_cases_basic, test_cases_advanced, test_cases_custom, java_solution_correct):
        """Test Java solution and verify masking behavior"""
        request_data = {
            "code": java_solution_correct,
            "language": "java",
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": test_cases_advanced,
            "test_cases_custom": test_cases_custom,
            "peer_submissions": [],
            "timeout": 15
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        assert result["status"] == "success"
        assert result["language"] == "java"
        
        # Verify masking behavior for Java
        # Basic tests should NOT be masked
        for basic_result in result["test_cases_basic"]:
            assert "***#hidden" not in basic_result["input"]
            assert any(char.isdigit() for char in basic_result["input"])
        
        # Advanced tests should be partially masked
        for advanced_result in result["test_cases_advanced"]:
            assert "*" in advanced_result["input"] or "#" in advanced_result["input"]
        
        # Custom tests should be completely hidden
        for custom_result in result["test_cases_custom"]:
            assert custom_result["input"] == "***#hidden"
            assert custom_result["expected_output"] == "***#hidden"
            assert custom_result["actual_output"] == "***#hidden"
            assert custom_result["scoring"] == "ignored"
        
        execution_summary = result["execution_summary"]
        assert execution_summary["passed_test_cases"] == 6  # Only basic + advanced
        assert execution_summary["total_test_cases"] == 6   # Only basic + advanced
        assert execution_summary["score_percent"] == 100.0
        
        print(f"✅ Java test passed with masking verification")
        print(f"   Custom tests properly excluded from scoring")
    
    @pytest.mark.asyncio
    async def test_high_plagiarism_detection(self, test_cases_basic, python_solution_correct):
        """Test high plagiarism detection with nearly identical code"""
        # Create a nearly identical peer submission
        peer_submissions = [
            {
                "user_id": "plagiarist",
                "submission_id": "copied_sub",
                "code": python_solution_correct  # Exact same code
            }
        ]
        
        request_data = {
            "code": python_solution_correct,
            "language": "python",
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": [],
            "test_cases_custom": [],
            "peer_submissions": peer_submissions,
            "timeout": 10
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        plagiarism_report = result["plagiarism_report"]
        assert plagiarism_report["max_similarity"] > 0.8  # Should detect high similarity
        assert plagiarism_report["flagged"] == True
        assert len(plagiarism_report["matches"]) > 0
        
        print(f"High plagiarism detected: {plagiarism_report['max_similarity']}")
    
    @pytest.mark.asyncio
    async def test_compilation_error_with_plagiarism(self, test_cases_basic):
        """Test compilation error handling with plagiarism check and verify masking in error response"""
        broken_c_code = """
#include <stdio.h>

int main() {
    // Missing semicolon and other syntax errors
    int n
    scanf("%d", &n)
    printf("broken code")
    return 0
}
"""
        
        test_cases_advanced = [
            {"input": "[-1, -5, -3, -2]", "expected_output": "-1", "weight": 2}
        ]
        test_cases_custom = [
            {"input": "[999, 1000, 998]", "expected_output": "1000", "weight": 1}
        ]
        
        peer_submissions = self.create_peer_submissions("c")
        
        request_data = {
            "code": broken_c_code,
            "language": "c",
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": test_cases_advanced,
            "test_cases_custom": test_cases_custom,
            "peer_submissions": peer_submissions,
            "timeout": 15
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        assert response.status_code == 200
        result = response.json()
        
        assert result["status"] == "error"
        assert "error" in result
        assert result["execution_summary"]["score_percent"] == 0.0
        
        # Verify masking behavior in error response
        # Basic tests should NOT be masked even in error
        for basic_result in result["test_cases_basic"]:
            assert basic_result["input"] in [tc["input"] for tc in test_cases_basic]
            assert basic_result["expected_output"] in [tc["expected_output"] for tc in test_cases_basic]
        
        # Advanced tests should be partially masked even in error
        for advanced_result in result["test_cases_advanced"]:
            assert "*" in advanced_result["input"] or "#" in advanced_result["input"]
            assert "*" in advanced_result["expected_output"] or "#" in advanced_result["expected_output"]
        
        # Custom tests should be completely hidden even in error
        for custom_result in result["test_cases_custom"]:
            assert custom_result["input"] == "***#hidden"
            assert custom_result["expected_output"] == "***#hidden"
            assert custom_result["actual_output"] == "***#hidden"
            assert custom_result["scoring"] == "ignored"
        
        # Total test count should exclude custom tests even in error
        assert result["execution_summary"]["total_test_cases"] == len(test_cases_basic) + len(test_cases_advanced)
        
        # Plagiarism check should still run even with compilation error
        plagiarism_report = result["plagiarism_report"]
        assert "flagged" in plagiarism_report
        
        print(f"✅ Compilation error handled correctly with proper masking")
        print(f"   Custom tests excluded from total count even in error")

if __name__ == "__main__":
    # Run a simple test
    import asyncio
    
    async def run_simple_test():
        test_instance = TestMaxElementProblem()
        
        test_cases_basic = [
            {"input": "[1, 3, 2, 5, 4]", "expected_output": "5", "weight": 1},
            {"input": "[10, 20, 30, 5]", "expected_output": "30", "weight": 1}
        ]
        
        python_code = """
def find_max(arr):
    return max(arr)

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_max(arr)
    print(result)
"""
        
        peer_submissions = test_instance.create_peer_submissions("python")
        
        request_data = {
            "code": python_code,
            "language": "python", 
            "test_cases_basic": test_cases_basic,
            "test_cases_advanced": [],
            "test_cases_custom": [],
            "peer_submissions": peer_submissions,
            "timeout": 10
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{BASE_URL}/execute-code-with-plagiarism-checks",
                    json=request_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print("✅ Test passed!")
                    print(f"Status: {result['status']}")
                    print(f"Score: {result['execution_summary']['score_percent']}%")
                    print(f"Passed/Total: {result['execution_summary']['passed_test_cases']}/{result['execution_summary']['total_test_cases']}")
                    print(f"Plagiarism flagged: {result['plagiarism_report']['flagged']}")
                    print(f"Max similarity: {result['plagiarism_report']['max_similarity']}")
                    
                    # Verify masking behavior in simple test
                    print("\n🔍 Masking verification:")
                    for i, basic_result in enumerate(result["test_cases_basic"]):
                        print(f"  Basic test {i+1}: {basic_result['input']} -> {basic_result['actual_output']} (unmasked)")
                    
                    if result.get("test_cases_advanced"):
                        for i, adv_result in enumerate(result["test_cases_advanced"]):
                            print(f"  Advanced test {i+1}: {adv_result['input']} (masked)")
                    
                    if result.get("test_cases_custom"):
                        for i, custom_result in enumerate(result["test_cases_custom"]):
                            print(f"  Custom test {i+1}: {custom_result['input']} (hidden, scoring: {custom_result.get('scoring', 'N/A')})")
                    
                else:
                    print(f"❌ Test failed with status: {response.status_code}")
                    print(f"Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Test failed with error: {e}")
    
    asyncio.run(run_simple_test())