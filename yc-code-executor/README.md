# Code Executor Tests

This directory contains comprehensive tests for the code executor service, specifically testing the "maximum element in array" problem with multiple programming languages and plagiarism detection.

## Test Coverage

### Languages Tested
- **Python**: Using built-in `max()` function and manual iteration
- **C**: Manual iteration with malloc/free memory management
- **C++**: Using STL `max_element` algorithm
- **Java**: Manual iteration with Scanner input

### Test Categories
- **Basic Test Cases**: Simple arrays with positive numbers
- **Advanced Test Cases**: Negative numbers, larger arrays, edge cases
- **Custom Test Cases**: Hidden test cases for final evaluation
- **Plagiarism Detection**: Tests similarity detection between submissions
- **Error Handling**: Compilation errors and runtime failures

## Running Tests

### Prerequisites
1. Start the code executor service:
   ```bash
   cd yc-code-executor
   python main.py
   ```

2. Install test dependencies:
   ```bash
   pip install -r requirements_test.txt
   ```

### Option 1: Manual Test Runner (Recommended)
```bash
python run_tests.py
```

This will run all tests and provide detailed output including:
- Execution results for each language
- Plagiarism detection scores
- Performance metrics (runtime, memory)
- Error handling verification

### Option 2: Pytest
```bash
pytest tests/test_max_element.py -v
```

## Test Cases

### Basic Test Cases
```json
[
  {"input": "[1, 3, 2, 5, 4]", "expected_output": "5", "weight": 1},
  {"input": "[10, 20, 30, 5]", "expected_output": "30", "weight": 1},
  {"input": "[7]", "expected_output": "7", "weight": 1}
]
```

### Advanced Test Cases
```json
[
  {"input": "[-1, -5, -3, -2]", "expected_output": "-1", "weight": 2},
  {"input": "[100, 200, 150, 300, 250]", "expected_output": "300", "weight": 2},
  {"input": "[0, 0, 0, 1, 0]", "expected_output": "1", "weight": 3}
]
```

### Custom Test Cases
```json
[
  {"input": "[999, 1000, 998]", "expected_output": "1000", "weight": 1}
]
```

## Expected Results

### Successful Execution
- **Status**: `success`
- **Score**: `100.0%` (all test cases pass)
- **Test Results**: All test cases marked as `passed`
- **Plagiarism**: Varies based on peer submissions

### Plagiarism Detection
- **Low Similarity** (< 0.5): Different algorithmic approaches
- **Medium Similarity** (0.5-0.8): Similar structure, different variable names
- **High Similarity** (> 0.8): Nearly identical code, flagged for review

### Performance Expectations
- **Python**: ~10-50ms execution time
- **C/C++**: ~5-30ms execution time (after compilation)
- **Java**: ~50-200ms execution time (including JVM startup)

## Sample Output

```
🚀 Starting Code Executor Tests
==================================================
✅ Code executor service is running

🧪 Testing PYTHON solution...
✅ PYTHON test PASSED!
   Status: success
   Passed tests: 7/7
   Score: 100.0%
   Runtime: 25ms
   Memory: 512KB
   Plagiarism flagged: False
   Max similarity: 0.65

🧪 Testing C solution...
✅ C test PASSED!
   Status: success
   Passed tests: 7/7
   Score: 100.0%
   Runtime: 15ms
   Memory: 640KB
   Plagiarism flagged: True
   Max similarity: 0.85
   Matches found: 1

==================================================
📊 TEST SUMMARY
==================================================
PYTHON               ✅ PASS
C                    ✅ PASS
CPP                  ✅ PASS
JAVA                 ✅ PASS
PLAGIARISM           ✅ PASS
COMPILATION_ERROR    ✅ PASS
--------------------------------------------------
TOTAL: 6/6 tests passed
🎉 All tests passed!
```

## Troubleshooting

### Service Not Running
```
❌ Cannot connect to code executor service!
   Error: ConnectError
   Please start the service with: python main.py
```
**Solution**: Start the code executor service first.

### Compilation Errors
If C/C++/Java tests fail, ensure you have the required compilers:
- **C**: `gcc` compiler
- **C++**: `g++` compiler  
- **Java**: `javac` and `java` (JDK 8+)

### Timeout Issues
If tests timeout, increase the timeout values in the test configuration or check system performance.

## Adding New Test Cases

To add new test cases, modify the `create_test_cases()` function in `run_tests.py`:

```python
def create_test_cases():
    return {
        "basic": [
            {"input": "[your_input]", "expected_output": "expected", "weight": 1}
        ],
        "advanced": [
            {"input": "[complex_input]", "expected_output": "expected", "weight": 2}
        ],
        "custom": [
            {"input": "[hidden_input]", "expected_output": "expected", "weight": 1}
        ]
    }
```

## API Endpoint

The tests use the following endpoint:
```
POST /execute-code-with-plagiarism-checks
```

Request format:
```json
{
  "code": "solution code",
  "language": "python|c|cpp|java",
  "test_cases_basic": [...],
  "test_cases_advanced": [...],
  "test_cases_custom": [...],
  "peer_submissions": [...],
  "timeout": 10
}
```

Response format:
```json
{
  "status": "success|failed|error",
  "language": "python",
  "test_cases_basic": [...],
  "test_cases_advanced": [...],
  "test_cases_custom": [...],
  "execution_summary": {
    "runtime_ms": 25,
    "peak_memory_kb": 512,
    "passed_test_cases": 7,
    "total_test_cases": 7,
    "score_percent": 100.0
  },
  "plagiarism_report": {
    "flagged": false,
    "max_similarity": 0.65,
    "matches": []
  }
}
```