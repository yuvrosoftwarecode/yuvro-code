import React, { useState, useEffect } from 'react';
import CodeEditor from '../CodeEditor';
import ExecutionResults from './ExecutionResults';
import TestCaseViewer from './TestCaseViewer';
import CustomTestCaseManager from './CustomTestCaseManager';
import codeExecutorService, {
  CodeExecutionRequest,
  ExecutionResult
} from '../../services/codeExecutorService';

export interface CodingProblem {
  id: string;
  title: string;
  description: string;
  test_cases_basic?: any[];
}

export interface CodeExecutionPanelProps {
  problem?: CodingProblem;
  initialCode?: string;
  onSubmissionComplete?: (result: ExecutionResult) => void;
  showSubmitButton?: boolean;
  showRunButton?: boolean;
  showTestCases?: boolean;
  allowCustomTestCases?: boolean;
  mode?: 'practice' | 'exam' | 'learn' | 'editor';
  className?: string;
}

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' }
];

const SAMPLE_CODE = {
  python: `def solution():
    # Write your solution here
    pass

# Test your solution
result = solution()
print(result)`,
  javascript: `function solution() {
    // Write your solution here
    return null;
}

// Test your solution
const result = solution();
console.log(result);`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Solution sol = new Solution();
        
        // Read input and solve
        // Example: int n = sc.nextInt();
        // System.out.println(sol.solve(n));
        
        sc.close();
    }
    
    public int solve(int n) {
        // Write your solution here
        return 0;
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    // Write your solution here
    
    return 0;
}`
};

const CodeExecutionPanel: React.FC<CodeExecutionPanelProps> = ({
  problem,
  initialCode,
  onSubmissionComplete,
  showSubmitButton = true,
  showRunButton = true,
  showTestCases = true,
  allowCustomTestCases = false,
  mode = 'practice',
  className = ''
}) => {
  const [code, setCode] = useState(initialCode || '');
  const [language, setLanguage] = useState('python');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'output' | 'tests' | 'custom-tests'>('editor');
  const [customTestCases, setCustomTestCases] = useState<any[]>([]);

  // Get test cases from the problem and combine with custom test cases
  const problemTestCases = problem?.test_cases_basic || [];
  const allTestCases = [...problemTestCases, ...customTestCases];

  useEffect(() => {
    if (!initialCode) {
      setCode(SAMPLE_CODE[language as keyof typeof SAMPLE_CODE] || '');
    }
  }, [language, initialCode]);

  const handleExecute = async () => {
    if (!code.trim()) {
      alert('Please write some code first!');
      return;
    }

    if (!problem) {
      alert('Problem not loaded yet. Please wait...');
      return;
    }

    setIsExecuting(true);
    setActiveTab('output');

    try {
      // Run code directly with FastAPI (no saving to database)
      const executionResult = await codeExecutorService.runCode({
        code,
        language,
        test_cases: allTestCases,
        problem_title: problem?.title || 'Unknown Problem'
      });
      console.log('Run Code Result:', executionResult);
      setResult(executionResult);
    } catch (error: any) {
      console.error('Code execution failed:', error);
      setResult({
        id: 0,
        coding_problem: '',
        problem_title: 'Error',
        problem_description: '',
        code,
        language,
        status: 'error',
        output: '',
        error_message: error.message || 'Execution failed',
        execution_time: 0,
        memory_usage: 0,
        test_cases_passed: 0,
        total_test_cases: 0,
        plagiarism_score: 0,
        plagiarism_details: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        test_results: { passed: 0, total: 0, success: false },
        plagiarism_flagged: false
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code first!');
      return;
    }

    if (!problem) {
      alert('Problem not loaded yet. Please wait...');
      return;
    }

    setIsExecuting(true);
    setActiveTab('output');

    try {
      const request: CodeExecutionRequest & { test_cases: any[] } = {
        code,
        language,
        coding_problem_id: problem?.id || '',
        test_cases: allTestCases
      };

      console.log('Submitting request:', request);
      
      // Submit solution via Django API (saves to database)
      const executionResult = await codeExecutorService.submitSolution(request);
      console.log('Submit Solution Result:', executionResult);
      setResult(executionResult);
      onSubmissionComplete?.(executionResult);
    } catch (error: any) {
      console.error('Code submission failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Set an error result so something shows up
      const errorResult = {
        id: 0,
        coding_problem: '',
        problem_title: 'Error',
        problem_description: '',
        code,
        language,
        status: 'error' as const,
        output: '',
        error_message: error.message || 'Submission failed',
        execution_time: 0,
        memory_usage: 0,
        test_cases_passed: 0,
        total_test_cases: 0,
        plagiarism_score: 0,
        plagiarism_details: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        test_results: { 
          passed: 0, 
          total: 0, 
          success: false,
          summary: 'Submission failed due to error'
        },
        plagiarism_flagged: false
      };
      
      setResult(errorResult);
    } finally {
      setIsExecuting(false);
    }
  };

  const getModeInfo = () => {
    switch (mode) {
      case 'exam':
        return {
          title: 'Skill Assessment',
          description: 'Complete this coding challenge within the time limit.',
          showHint: false
        };
      case 'learn':
        return {
          title: 'Learning Exercise',
          description: 'Practice and learn with detailed feedback.',
          showHint: true
        };
      default:
        return {
          title: 'Code Practice',
          description: 'Test and submit your solution.',
          showHint: true
        };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{problem?.title || modeInfo.title}</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="flex space-x-2">
            {showRunButton && (
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className={`
                  px-4 py-2 rounded-md font-medium transition-colors
                  ${isExecuting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
                title="Test your code with visible test cases for debugging"
              >
                {isExecuting ? 'Running...' : 'Run Code'}
              </button>
            )}
            
            {showSubmitButton && (
              <button
                onClick={handleSubmit}
                disabled={isExecuting}
                className={`
                  px-4 py-2 rounded-md font-medium transition-colors
                  ${isExecuting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  }
                `}
                title="Submit your final solution for evaluation"
              >
                {isExecuting ? 'Submitting...' : 'Submit Solution'}
              </button>
            )}
          </div>
        </div>
        
        {/* Mode-specific info */}
        {modeInfo.showHint && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="text-blue-600 mt-0.5">💡</div>
              <div className="text-blue-800">
                <strong>Run Code:</strong> Test with visible test cases for debugging. 
                {showSubmitButton && (
                  <>
                    <strong className="ml-2">Submit Solution:</strong> Final evaluation with hidden test cases - shows only execution stats and score.
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-4">
        <nav className="flex space-x-8">
          {['editor', 'output', ...(showTestCases ? ['tests'] : []), ...(allowCustomTestCases ? ['custom-tests'] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab === 'custom-tests' ? 'Custom Tests' : tab}
              {tab === 'tests' && problemTestCases && problemTestCases.length > 0 && (
                <span className="ml-1 bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {problemTestCases.length}
                </span>
              )}
              {tab === 'custom-tests' && customTestCases.length > 0 && (
                <span className="ml-1 bg-blue-200 text-blue-600 px-2 py-1 rounded-full text-xs">
                  {customTestCases.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'editor' && (
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          height="500px"
        />
      )}

      {activeTab === 'output' && (
        <ExecutionResults result={result} isExecuting={isExecuting} />
      )}

      {activeTab === 'tests' && showTestCases && (
        <TestCaseViewer testCases={problemTestCases} result={result} />
      )}

      {activeTab === 'custom-tests' && allowCustomTestCases && (
        <CustomTestCaseManager
          customTestCases={customTestCases}
          onTestCasesChange={setCustomTestCases}
        />
      )}
    </div>
  );
};

export default CodeExecutionPanel;