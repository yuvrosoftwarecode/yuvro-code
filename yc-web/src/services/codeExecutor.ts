/**
 * Code Executor Service
 * Handles code execution against test cases.
 * 
 * Strategy:
 * - Python, Java, C, C++ require backend execution (post to /api/course/execute/)
 * - For now, we'll send code + test cases to backend for safe execution
 */

export interface TestCase {
  input: any;
  expected_output: any;
  description?: string;
}

export interface ExecutionResult {
  testId: string;
  passed: boolean;
  actualOutput?: any;
  expectedOutput?: any;
  error?: string;
}

export interface CodeExecutionResponse {
  success: boolean;
  results: ExecutionResult[];
  totalPassed: number;
  totalTests: number;
}

export const executeCodeOnBackend = async (
  code: string,
  language: string,
  testCases: TestCase[],
  token: string
): Promise<CodeExecutionResponse> => {
  try {
    const response = await fetch('http://127.0.0.1:8001/api/course/execute/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        code,
        language,
        test_cases: testCases,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || `Backend returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    return {
      success: data.success,
      results: data.results,
      totalPassed: data.totalPassed,
      totalTests: data.totalTests,
    };
  } catch (error) {
    console.error('Code execution error:', error);
    return {
      success: false,
      results: [],
      totalPassed: 0,
      totalTests: testCases.length,
    };
  }
};

export const formatTestResults = (result: CodeExecutionResponse): string => {
  const { results, totalPassed, totalTests } = result;
  
  if (!results || results.length === 0) {
    return 'Execution failed. No results returned from server.';
  }
  
  let output = `Test Results: ${totalPassed}/${totalTests} passed\n\n`;
  
  results.forEach((result, idx) => {
    const status = result.passed ? '✓' : '✗';
    output += `Test ${idx + 1}: ${status}`;
    
    if (!result.passed) {
      if (result.error) {
        output += `  Error: ${result.error}\n`;
      } else if (result.actualOutput !== undefined) {
        output += `  Expected: ${JSON.stringify(result.expectedOutput)}\n`;
        output += `  Got: ${JSON.stringify(result.actualOutput)}\n`;
      }
    }
    output += '\n';
  });

  return output;
};

export type CodeExecutionResult = ExecutionResult;
