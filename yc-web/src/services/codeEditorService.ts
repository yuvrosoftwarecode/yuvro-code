import restApiAuthUtil from '../utils/RestApiAuthUtil';
import restApiUtilCodeExecuter from '../utils/RestApiUtilCodeExecuter';

export interface CodeSubmission {
  id: number;
  question: string;
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
  question_difficulty?: string;
}

export interface CodeExecutionRequest {
  code: string;
  language: string;
  question_id: string;
  course_id?: string;
  topic_id?: string;
  submission_type?: 'code_practice' | 'skill_test' | 'contest' | 'mock_interview';
}

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
    summary?: string;
    results?: Array<{
      test_case_id: number;
      passed: boolean;
      input: string;
      expected_output: string;
      actual_output: string;
      error: string;
      execution_time: number;
    }>;
  };
  plagiarism_flagged: boolean;
}

class CodeEditorService {
  // Run Code - calls code executor service directly for quick testing (no database storage)
  async runCode(request: {
    code: string;
    language: string;
    test_cases: any[];
    test_cases_custom?: any[];
    problem_title?: string;
  }): Promise<ExecutionResult> {
    try {
      // Call code executor service directly
      const data: any = await restApiUtilCodeExecuter.post('/execute-code-with-plagiarism-checks', {
        code: request.code,
        language: request.language,
        test_cases_basic: (request.test_cases || []).map(tc => ({
          input: tc.input || '',
          expected_output: tc.expected_output || '',
          weight: tc.weight || 1
        })),
        test_cases_advanced: [], // Run only uses basic test cases
        test_cases_custom: (request.test_cases_custom || []).map(tc => ({
          input: tc.input || '',
          expected_output: tc.expected_output || '',
          weight: 1
        })),
        peer_submissions: [], // No peer submissions for quick run
        timeout: 10
      });

      const executionSummary = data.execution_summary || {};
      const plagiarismReport = data.plagiarism_report || {};

      return {
        id: 0,
        question: '',
        problem_title: request.problem_title || 'Quick Run',
        problem_description: '',
        code: request.code,
        language: request.language,
        status: data.status === 'success' ? 'completed' : 'error',
        output: data.test_cases_basic?.[0]?.actual_output || '',
        error_message: data.error || '',
        execution_time: executionSummary.runtime_ms || 0,
        memory_usage: executionSummary.peak_memory_kb || 0,
        test_cases_passed: executionSummary.passed_test_cases || 0,
        total_test_cases: executionSummary.total_test_cases || 0,
        plagiarism_score: plagiarismReport.max_similarity || 0,
        plagiarism_details: plagiarismReport,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        test_results: {
          passed: executionSummary.passed_test_cases || 0,
          total: executionSummary.total_test_cases || 0,
          results: [
            ...(data.test_cases_basic || []).map((result: any, index: number) => ({
              test_case_id: index,
              passed: result.status === 'passed',
              input: result.input || '',
              expected_output: result.expected_output || '',
              actual_output: result.actual_output || '',
              error: result.status === 'failed' ? 'Test failed' : '',
              execution_time: result.runtime_ms || 0
            })),
            ...(data.test_cases_custom || []).map((result: any, index: number) => ({
              test_case_id: index + (data.test_cases_basic?.length || 0),
              passed: result.status === 'passed',
              input: 'Hidden',
              expected_output: 'Hidden',
              actual_output: 'Hidden',
              error: result.status === 'failed' ? 'Test failed' : '',
              execution_time: result.runtime_ms || 0
            }))
          ],
          success: data.status === 'success'
        },
        plagiarism_flagged: plagiarismReport.flagged || false
      };
    } catch (error) {
      console.error('Code execution failed:', error);
      throw new Error(`Code execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Submit Code to Editor - calls Django backend with question_id for storage and tracking
  async submitCodeToEditor(request: {
    code: string;
    language: string;
    question_id?: string;
    test_cases_basic?: any[];
    test_cases_advanced?: any[];
    test_cases_custom?: any[];
    question_submission_type?: 'learn' | 'practice' | 'skill_test' | 'contest' | 'mock_interview';
    timeout?: number;
  }): Promise<ExecutionResult> {
    try {
      // Call Django backend code editor submit endpoint
      const data: any = await restApiAuthUtil.post('/code-editor/submit_code/', {
        code: request.code,
        language: request.language,
        question_id: request.question_id,
        question_submission_type: request.question_submission_type || 'practice',
        test_cases_basic: request.test_cases_basic || [],
        test_cases_advanced: request.test_cases_advanced || [],
        test_cases_custom: request.test_cases_custom || [],
        peer_submissions: [], // Will be populated by backend
        timeout: request.timeout || 10
      });

      const executionSummary = data.execution_summary || {};
      const plagiarismReport = data.plagiarism_report || {};

      return {
        id: 0, // Backend doesn't return submission ID for this endpoint
        question: request.question_id || '',
        problem_title: 'Code Submission',
        problem_description: '',
        code: request.code,
        language: request.language,
        status: data.status === 'success' ? 'completed' : 'error',
        output: data.test_cases_basic?.[0]?.actual_output || '',
        error_message: data.error || '',
        execution_time: executionSummary.runtime_ms || 0,
        memory_usage: executionSummary.peak_memory_kb || 0,
        test_cases_passed: executionSummary.passed_test_cases || 0,
        total_test_cases: executionSummary.total_test_cases || 0,
        plagiarism_score: plagiarismReport.max_similarity || 0,
        plagiarism_details: plagiarismReport,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        test_results: {
          passed: executionSummary.passed_test_cases || 0,
          total: executionSummary.total_test_cases || 0,
          results: [
            ...(data.test_cases_basic || []).map((result: any, index: number) => ({
              test_case_id: index,
              passed: result.status === 'passed',
              input: result.input || '',
              expected_output: result.expected_output || '',
              actual_output: result.actual_output || '',
              error: result.status === 'failed' ? 'Test failed' : '',
              execution_time: result.runtime_ms || 0
            })),
            ...(data.test_cases_advanced || []).map((result: any, index: number) => ({
              test_case_id: index + (data.test_cases_basic?.length || 0),
              passed: result.status === 'passed',
              input: 'Hidden',
              expected_output: 'Hidden',
              actual_output: 'Hidden',
              error: result.status === 'failed' ? 'Test failed' : '',
              execution_time: result.runtime_ms || 0
            })),
            ...(data.test_cases_custom || []).map((result: any, index: number) => ({
              test_case_id: index + (data.test_cases_basic?.length || 0) + (data.test_cases_advanced?.length || 0),
              passed: result.status === 'passed',
              input: result.input || '',
              expected_output: result.expected_output || '',
              actual_output: result.actual_output || '',
              error: result.status === 'failed' ? 'Test failed' : '',
              execution_time: result.runtime_ms || 0
            }))
          ],
          success: data.status === 'success'
        },
        plagiarism_flagged: plagiarismReport.flagged || false
      };
    } catch (error) {
      console.error('Code editor submission failed:', error);
      throw new Error(`Code editor submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Legacy method for other submission types (learn, practice via different endpoints)
  async submitSolution(request: {
    code: string;
    language: string;
    question_id: string;
    course_id?: string;
    topic_id?: string;
    subtopic_id?: string;
    test_cases_basic?: any[];
    test_cases_advanced?: any[];
    test_cases_custom?: any[];
    submission_id?: string;
    contest_id?: string;
    skill_test_id?: string;
    mock_interview_id?: string;
    submissionType?: 'learn' | 'practice' | 'skill_test' | 'contest' | 'mock_interview';
  }): Promise<ExecutionResult> {
    try {
      const submissionType = request.submissionType || 'practice';
      let endpoint = '';

      const payload = {
        subtopic_id: request.subtopic_id,
        question_id: request.question_id,
        language: request.language,
        code: request.code,
        test_cases_basic: request.test_cases_basic || [],
        test_cases_advanced: request.test_cases_advanced || [],
        test_cases_custom: request.test_cases_custom || [],
        coding_status: {},
        course_id: request.course_id,
        topic_id: request.topic_id,
        submission_id: request.submission_id,
        contest_id: request.contest_id,
        skill_test_id: request.skill_test_id,
        mock_interview_id: request.mock_interview_id
      };

      switch (submissionType) {
        case 'learn':
          endpoint = '/course/student-course-progress/submit_coding/';
          break;
        case 'practice':
          endpoint = '/course/student-code-practices/submit/';
          break;
        case 'skill_test':
          endpoint = '/assessment/skill-tests/submit/';
          break;
        case 'contest':
          endpoint = '/assessment/contests/submit/';
          break;
        case 'mock_interview':
          endpoint = '/assessment/mock-interviews/submit/';
          break;
        default:
          endpoint = '/course/student-code-practices/submit/';
      }

      const response: any = await restApiAuthUtil.post(endpoint, payload);

      return {
        id: response.id || 0,
        question: response.question || '',
        problem_title: response.problem_title || 'Code Practice',
        problem_description: response.problem_description || '',
        code: response.code || request.code,
        language: response.language || request.language,
        status: response.status || 'completed',
        output: response.output || '',
        error_message: response.error_message || '',
        execution_time: response.execution_time || 0,
        memory_usage: response.memory_usage || 0,
        test_cases_passed: response.test_cases_passed || 0,
        total_test_cases: response.total_test_cases || 0,
        plagiarism_score: response.plagiarism_score || 0,
        plagiarism_details: response.plagiarism_details || null,
        created_at: response.created_at || new Date().toISOString(),
        updated_at: response.updated_at || new Date().toISOString(),
        test_results: {
          passed: response.test_cases_passed || 0,
          total: response.total_test_cases || 0,
          results: response.test_results?.test_results || response.test_results?.results || [],
          success: response.status === 'completed'
        },
        plagiarism_flagged: response.plagiarism_flagged || false
      };
    } catch (error) {
      console.error('Code submission failed:', error);
      throw new Error(`Solution submission failed: ${error instanceof Error ? error.message : 'No response received from submission service'}`);
    }
  }

  async executeCode(request: CodeExecutionRequest & { test_cases: any[] }): Promise<ExecutionResult> {
    return this.submitSolution({
      ...request,
      question_id: request.coding_problem_id
    });
  }

<<<<<<< Updated upstream
  async getSubmissions(codingProblemId?: string, submissionType: string = 'code_practice'): Promise<CodeSubmission[]> {
    const params = codingProblemId ? { coding_problem_id: codingProblemId } : undefined;

=======
  async getSubmissions(questionId?: string, submissionType: string = 'code_practice'): Promise<CodeSubmission[]> {
    const params = questionId ? { question_id: questionId } : undefined;
    
>>>>>>> Stashed changes
    let endpoint = '';
    switch (submissionType) {
      case 'code_practice':
        endpoint = '/course/student-code-practices/';
        break;
      case 'skill_test':
        endpoint = '/assessment/skill-test/submissions/';
        break;
      case 'contest':
        endpoint = '/assessment/contests/submissions/';
        break;
      case 'mock_interview':
        endpoint = '/assessment/mock-interviews/submissions/';
        break;
    }

    return restApiAuthUtil.get(endpoint, { params });
  }

  async getSubmission(id: number, submissionType: string = 'code_practice'): Promise<CodeSubmission> {
    let endpoint = '';
    switch (submissionType) {
      case 'code_practice':
        endpoint = `/course/student-code-practices/${id}/`;
        break;
      case 'skill_test':
        endpoint = `/assessment/skill-test/submissions/${id}/`;
        break;
      case 'contest':
        endpoint = `/assessment/contests/submissions/${id}/`;
        break;
      case 'mock_interview':
        endpoint = `/assessment/mock-interviews/submissions/${id}/`;
        break;
      default:
        endpoint = `/course/student-code-practices/${id}/`;
    }

    return restApiAuthUtil.get(endpoint);
  }

  async getSupportedLanguagesAndTemplates(): Promise<any> {
    // Since we removed the languages endpoint, we'll provide a static response
    // or this could be moved to a configuration file
    return {
      languages: ['python', 'javascript', 'java', 'cpp', 'c'],
      details: {
        python: {
          extension: '.py',
          timeout: 10,
          template: `class Solution:
    def solve(self, *args):
        # Competitive Programming Template - Python
        # Each line of your test case input is passed as an argument in *args.
        # Arguments are automatically parsed as JSON/Numbers if possible.

        # Example: If your input lines are: "Hello", 42, [1, 2, 3]
        # You can access them like this:
        # input_str = args[0] if len(args) > 0 else ""
        # num = args[1] if len(args) > 1 else 0
        # list_data = args[2] if len(args) > 2 else []

        # Start your logic below:
        return None`
        },
        javascript: {
          extension: '.js',
          timeout: 10,
          template: `"use strict";

const fs = require('fs');

/**
 * Competitive Programming Template - Node.js
 * Reads stdin and parses lines. Often inputs are JSON strings.
 */
function solve() {
    const lines = fs.readFileSync(0, 'utf8').split('\\n').filter(line => line.trim());
    if (lines.length === 0) return;

    // Example: parse first line as a JSON array
    try {
        const data = JSON.parse(lines[0]);
        // Your logic here
    } catch (e) {
        // Fallback for non-JSON input
        const data = lines[0];
    }
}

solve();`
        },
        java: {
          extension: '.java',
          timeout: 15,
          template: `import java.util.*;

/**
 * Competitive Programming Template - Java
 */
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // For array inputs, the platform provides [count] followed by [elements]
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int[] arr = new int[n];
            for(int i = 0; i < n; i++) {
                arr[i] = sc.nextInt();
            }
            // Your logic here
        }
    }
}`
        },
        cpp: {
          extension: '.cpp',
          timeout: 15,
          template: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

/**
 * Competitive Programming Template - C++
 */
int main() {
    // Faster I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    // For array inputs, the platform provides [count] followed by [elements]
    if (cin >> n) {
        vector<int> arr(n);
        for(int i = 0; i < n; i++) {
            cin >> arr[i];
        }
        // Your logic here
    }

    return 0;
}`
        },
        c: {
          extension: '.c',
          timeout: 15,
          template: `#include <stdio.h>
#include <stdlib.h>

/**
 * Competitive Programming Template - C
 */
int main() {
    int n;
    // For array inputs, the platform provides [count] followed by [elements]
    if (scanf("%d", &n) == 1) {
        int* arr = (int*)malloc(n * sizeof(int));
        for(int i = 0; i < n; i++) {
            scanf("%d", &arr[i]);
        }
        
        // Your logic here
        
        free(arr);
    }
    return 0;
}`
        }
      }
    };
  }
}

export default new CodeEditorService();