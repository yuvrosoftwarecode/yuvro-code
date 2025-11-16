import api from './api';

export interface CodeSubmission {
  id: number;
  coding_problem: string;
  problem_title: string;
  problem_description: string;
  code: string;
  language: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'timeout';
  output: string;
  error_message: string;
  execution_time: number;
  memory_usage: number;
  test_cases_passed: number;
  total_test_cases: number;
  plagiarism_score: number;
  plagiarism_details: any;
  created_at: string;
  updated_at: string;
}

export interface CodeExecutionRequest {
  code: string;
  language: string;
  coding_problem_id: string;
}

// TestCase interface removed - using plain objects from course API

export interface PlagiarismReport {
  id: number;
  submission1: number;
  submission2: number;
  submission1_user: string;
  submission2_user: string;
  similarity_score: number;
  similarity_details: any;
  created_at: string;
}

export interface ExecutionResult extends CodeSubmission {
  test_results: {
    passed: number;
    total: number;
    success: boolean;
    execution_time?: number;
    memory_usage?: number;
    summary?: string; // For submissions - sanitized summary without test case details
    results?: Array<{  // For run-only - detailed test case results
      test_case_id: number;
      passed: boolean;
      expected: string;
      actual: string;
      error: string;
      execution_time: number;
    }>;
  };
  plagiarism_flagged: boolean;
}

class CodeExecutorService {
  private codeExecutorBaseURL = import.meta.env.VITE_CODE_EXECUTOR_URL || 'http://localhost:8002';

  // Run code directly via FastAPI service (no saving to database)
  async runCode(request: { code: string; language: string; test_cases: any[]; problem_title?: string }): Promise<ExecutionResult> {
    try {
      const response = await fetch(`${this.codeExecutorBaseURL}/execute-with-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: request.code,
          language: request.language,
          test_cases: request.test_cases.map(tc => ({
            input_data: tc.input_data || tc.input || '',
            expected_output: tc.expected_output || tc.expected || '',
            weight: tc.weight || 1
          })),
          timeout: 10
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      // Transform FastAPI response to match Django ExecutionResult format
      const executionResult = data.execution_result || {};
      const testResults = data.test_results || [];
      
      return {
        id: 0, // Temporary ID since not saved to database
        coding_problem: '',
        problem_title: request.problem_title || 'Quick Run',
        problem_description: '',
        code: request.code,
        language: request.language,
        status: executionResult.success ? 'completed' : 'error',
        output: executionResult.output || '',
        error_message: executionResult.error || '',
        execution_time: executionResult.execution_time || 0,
        memory_usage: executionResult.memory_usage || 0,
        test_cases_passed: data.total_passed || 0,
        total_test_cases: data.total_tests || 0,
        plagiarism_score: 0,
        plagiarism_details: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        test_results: {
          passed: data.total_passed || 0,
          total: data.total_tests || 0,
          results: testResults.map((result: any, index: number) => ({
            test_case_id: index,
            passed: result.passed || false,
            expected: result.expected || '',
            actual: result.actual || '',
            error: result.error || '',
            execution_time: result.execution_time || 0
          })),
          success: executionResult.success || false
        },
        plagiarism_flagged: false
      };
    } catch (error) {
      console.error('Code execution failed:', error);
      throw new Error(`Code execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Submit solution via Django API (saves to database and calls FastAPI)
  async submitSolution(request: CodeExecutionRequest & { test_cases: any[] }): Promise<ExecutionResult> {
    try {
      const response = await api.post('/code/submissions/execute/', request);
      return response; // The response IS the data, not response.data
    } catch (error) {
      console.error('Django submission failed:', error);
      throw new Error(`Solution submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Legacy method for backward compatibility
  async executeCode(request: CodeExecutionRequest): Promise<ExecutionResult> {
    return this.submitSolution(request);
  }

  async getSubmissions(codingProblemId?: string): Promise<CodeSubmission[]> {
    const params = codingProblemId ? { coding_problem_id: codingProblemId } : {};
    const response = await api.get('/code/submissions/', { params });
    return response;
  }

  async getSubmission(id: number): Promise<CodeSubmission> {
    const response = await api.get(`/code/submissions/${id}/`);
    return response;
  }

  // Remove getTestCases method - test cases now come from course API

  async getPlagiarismReports(minSimilarity?: number): Promise<PlagiarismReport[]> {
    const params = minSimilarity ? { min_similarity: minSimilarity } : {};
    const response = await api.get('/code/plagiarism/', { params });
    return response;
  }
}

export default new CodeExecutorService();