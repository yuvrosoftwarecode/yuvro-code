#!/usr/bin/env python3
"""
Manual test runner for the code executor service
Run this script to test the execute-code-with-plagiarism-checks endpoint
"""

import asyncio
import httpx
import json
from typing import Dict, List

BASE_URL = "http://localhost:8002"

def create_test_cases():
    """Create test cases for maximum element problem"""
    return {
        "basic": [
            {"input": "[1, 3, 2, 5, 4]", "expected_output": "5", "weight": 1},
            {"input": "[10, 20, 30, 5]", "expected_output": "30", "weight": 1},
            {"input": "[7]", "expected_output": "7", "weight": 1}
        ],
        "advanced": [
            {"input": "[-1, -5, -3, -2]", "expected_output": "-1", "weight": 2},
            {"input": "[100, 200, 150, 300, 250]", "expected_output": "300", "weight": 2},
            {"input": "[0, 0, 0, 1, 0]", "expected_output": "1", "weight": 3}
        ],
        "custom": [
            {"input": "[999, 1000, 998]", "expected_output": "1000", "weight": 1}
        ]
    }

def get_solutions():
    """Get solution code for different languages"""
    return {
        "python": """
def find_max(arr):
    return max(arr)

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = find_max(arr)
    print(result)
""",
        "c": """
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
""",
        "cpp": """
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
""",
        "java": """
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
    }

def create_peer_submissions(language: str) -> List[Dict]:
    """Create peer submissions for plagiarism testing"""
    if language == "python":
        return [
            {
                "user_id": "user1",
                "submission_id": "sub1",
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
            },
            {
                "user_id": "user2",
                "submission_id": "sub2", 
                "code": """
def get_max_element(data):
    maximum = data[0]
    for i in range(1, len(data)):
        if data[i] > maximum:
            maximum = data[i]
    return maximum

import json
if __name__ == "__main__":
    line = input().strip()
    arr = json.loads(line)
    result = get_max_element(arr)
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

int find_maximum(int arr[], int size) {
    int max = arr[0];
    for (int i = 1; i < size; i++) {
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
    int result = find_maximum(arr, n);
    printf("%d", result);
    free(arr);
    return 0;
}
"""
            }
        ]
    return []

async def test_language(language: str, test_cases: Dict, solutions: Dict):
    """Test a specific language solution"""
    print(f"\n🧪 Testing {language.upper()} solution...")
    
    peer_submissions = create_peer_submissions(language)
    
    request_data = {
        "code": solutions[language],
        "language": language,
        "test_cases_basic": test_cases["basic"],
        "test_cases_advanced": test_cases["advanced"], 
        "test_cases_custom": test_cases["custom"],
        "peer_submissions": peer_submissions,
        "timeout": 15 if language in ["c", "cpp", "java"] else 10
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        if response.status_code == 200:
            result = response.json()
            
            print(f"✅ {language.upper()} test PASSED!")
            print(f"   Status: {result['status']}")
            print(f"   Passed tests: {result['execution_summary']['passed_test_cases']}/{result['execution_summary']['total_test_cases']}")
            print(f"   Score: {result['execution_summary']['score_percent']}%")
            print(f"   Runtime: {result['execution_summary']['runtime_ms']}ms")
            print(f"   Memory: {result['execution_summary']['peak_memory_kb']}KB")
            
            plagiarism = result['plagiarism_report']
            print(f"   Plagiarism flagged: {plagiarism['flagged']}")
            print(f"   Max similarity: {plagiarism['max_similarity']:.2f}")
            if plagiarism['matches']:
                print(f"   Matches found: {len(plagiarism['matches'])}")
                
            return True
            
        else:
            print(f"❌ {language.upper()} test FAILED!")
            print(f"   Status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ {language.upper()} test ERROR!")
        print(f"   Error: {e}")
        return False

async def test_plagiarism_detection():
    """Test high plagiarism detection"""
    print(f"\n🔍 Testing plagiarism detection...")
    
    test_cases = create_test_cases()
    solutions = get_solutions()
    
    # Create identical peer submission for high plagiarism
    peer_submissions = [
        {
            "user_id": "plagiarist",
            "submission_id": "copied_sub",
            "code": solutions["python"]  # Exact same code
        }
    ]
    
    request_data = {
        "code": solutions["python"],
        "language": "python",
        "test_cases_basic": test_cases["basic"][:2],  # Just 2 test cases
        "test_cases_advanced": [],
        "test_cases_custom": [],
        "peer_submissions": peer_submissions,
        "timeout": 10
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        if response.status_code == 200:
            result = response.json()
            plagiarism = result['plagiarism_report']
            
            print(f"✅ Plagiarism detection test PASSED!")
            print(f"   Max similarity: {plagiarism['max_similarity']:.2f}")
            print(f"   Flagged: {plagiarism['flagged']}")
            print(f"   Expected: High similarity (>0.8)")
            
            if plagiarism['max_similarity'] > 0.8:
                print(f"   ✅ High plagiarism correctly detected!")
            else:
                print(f"   ⚠️  Expected higher similarity score")
                
            return True
            
        else:
            print(f"❌ Plagiarism test FAILED!")
            print(f"   Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Plagiarism test ERROR!")
        print(f"   Error: {e}")
        return False

async def test_compilation_error():
    """Test compilation error handling"""
    print(f"\n💥 Testing compilation error handling...")
    
    broken_c_code = """
#include <stdio.h>

int main() {
    // Missing semicolons and syntax errors
    int n
    scanf("%d", &n)
    printf("broken code")
    return 0
}
"""
    
    test_cases = create_test_cases()
    
    request_data = {
        "code": broken_c_code,
        "language": "c",
        "test_cases_basic": test_cases["basic"][:1],
        "test_cases_advanced": [],
        "test_cases_custom": [],
        "peer_submissions": create_peer_submissions("c"),
        "timeout": 15
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/execute-code-with-plagiarism-checks",
                json=request_data,
                timeout=30.0
            )
            
        if response.status_code == 200:
            result = response.json()
            
            print(f"✅ Compilation error test PASSED!")
            print(f"   Status: {result['status']}")
            print(f"   Score: {result['execution_summary']['score_percent']}%")
            print(f"   Error handled: {'error' in result}")
            print(f"   Plagiarism still checked: {'plagiarism_report' in result}")
            
            return True
            
        else:
            print(f"❌ Compilation error test FAILED!")
            print(f"   Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Compilation error test ERROR!")
        print(f"   Error: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting Code Executor Tests")
    print("=" * 50)
    
    # Check if service is running
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health", timeout=5.0)
            if response.status_code != 200:
                print("❌ Code executor service is not running!")
                print(f"   Please start the service with: python main.py")
                return
    except Exception as e:
        print("❌ Cannot connect to code executor service!")
        print(f"   Error: {e}")
        print(f"   Please start the service with: python main.py")
        return
    
    print("✅ Code executor service is running")
    
    test_cases = create_test_cases()
    solutions = get_solutions()
    
    # Test each language
    languages = ["python", "c", "cpp", "java"]
    results = []
    
    for language in languages:
        success = await test_language(language, test_cases, solutions)
        results.append((language, success))
    
    # Test plagiarism detection
    plagiarism_success = await test_plagiarism_detection()
    results.append(("plagiarism", plagiarism_success))
    
    # Test compilation error handling
    error_success = await test_compilation_error()
    results.append(("compilation_error", error_success))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name.upper():20} {status}")
        if success:
            passed += 1
    
    print("-" * 50)
    print(f"TOTAL: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the output above.")

if __name__ == "__main__":
    asyncio.run(main())