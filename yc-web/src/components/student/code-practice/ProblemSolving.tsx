import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Play, Send, BarChart3, Minimize2, Maximize2 } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import { PerformanceMetrics } from '@/components/code-execution';
import codeExecutorService from '@/services/codeExecutorService';
import type { Course, Topic, CodingProblem } from '@/pages/student/CodePractice';
import { toast } from 'sonner';

interface ProblemSolvingProps {
  problem: CodingProblem;
  course: Course;
  topic: Topic;
  onBack: () => void;
  onViewAnalytics: () => void;
}

const ProblemSolving = ({
  problem,
  course,
  topic,
  onBack,
  onViewAnalytics,
}: ProblemSolvingProps) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [executionMetrics, setExecutionMetrics] = useState<any>(null);
  const [isEditorMinimized, setIsEditorMinimized] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditorFullscreen) {
        setIsEditorFullscreen(false);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        setIsEditorFullscreen(!isEditorFullscreen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditorFullscreen]);

  // Sample solution templates for different languages
  const getSampleSolution = (lang: string) => {
    const templates = {
      python: `# Python Solution Template
def solution():
    # Read input
    # Process the data
    # Return or print the result
    pass

# Example usage:
# result = solution()
# print(result)`,
      javascript: `// JavaScript Solution Template
function solution() {
    // Read input
    // Process the data
    // Return the result
}

// Example usage:
// const result = solution();
// console.log(result);`,
      java: `// Java Solution Template
public class Solution {
    public static void main(String[] args) {
        // Read input
        // Process the data
        // Print the result
    }
    
    public static int solve() {
        // Your solution logic here
        return 0;
    }
}`,
      cpp: `// C++ Solution Template
#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Read input
    // Process the data
    // Print the result
    return 0;
}`,
      c: `// C Solution Template
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Read input
    // Process the data
    // Print the result
    return 0;
}`
    };
    return templates[lang as keyof typeof templates] || templates.python;
  };

  // Initialize with template on component mount
  useEffect(() => {
    const template = getSampleSolution(language);
    setCode(template);
  }, []); // Only run on mount

  // Auto-populate code when language changes
  useEffect(() => {
    const template = getSampleSolution(language);
    setCode(template);
    toast.success(`Switched to ${language} template`);
  }, [language]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'Hard':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setIsRunning(true);
    setOutput('');
    setTestResults(null);
    setExecutionMetrics(null);

    try {
      // Transform test cases to ensure they are strings
      const transformedTestCases = problem.test_cases_basic.map(testCase => ({
        input_data: typeof testCase.input_data === 'string' 
          ? testCase.input_data 
          : JSON.stringify(testCase.input_data),
        expected_output: typeof testCase.expected_output === 'string' 
          ? testCase.expected_output 
          : JSON.stringify(testCase.expected_output),
        weight: testCase.weight || 1
      }));

      const result = await codeExecutorService.runCode({
        code,
        language,
        test_cases: transformedTestCases,
        problem_title: problem.title,
      });

      setOutput(result.output || result.error_message || 'No output');
      setTestResults(result.test_results);
      setExecutionMetrics({
        execution_time: result.execution_time,
        memory_usage: result.memory_usage,
        status: result.status,
      });

      if (result.status === 'completed') {
        toast.success(`Code executed successfully! ${result.test_results.passed}/${result.test_results.total} test cases passed`);
      } else {
        toast.error('Code execution failed');
      }
    } catch (error) {
      console.error('Code execution failed:', error);
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine basic and advanced test cases for submission
      const allTestCases = [
        ...problem.test_cases_basic,
        ...problem.test_cases_advanced,
      ];

      // Transform test cases to ensure they are strings
      const transformedTestCases = allTestCases.map(testCase => ({
        input_data: typeof testCase.input_data === 'string' 
          ? testCase.input_data 
          : JSON.stringify(testCase.input_data),
        expected_output: typeof testCase.expected_output === 'string' 
          ? testCase.expected_output 
          : JSON.stringify(testCase.expected_output),
        weight: testCase.weight || 1
      }));

      const result = await codeExecutorService.submitSolution({
        code,
        language,
        coding_problem_id: problem.id,
        test_cases: transformedTestCases,
      });

      setTestResults(result.test_results);
      setExecutionMetrics({
        execution_time: result.execution_time,
        memory_usage: result.memory_usage,
        status: result.status,
      });

      if (result.status === 'completed') {
        const passRate = (result.test_results.passed / result.test_results.total) * 100;
        toast.success(`Solution submitted! ${result.test_results.passed}/${result.test_results.total} test cases passed (${passRate.toFixed(1)}%)`);
        
        if (result.plagiarism_flagged) {
          toast.warning('Plagiarism detected in your submission');
        }
      } else {
        toast.error('Solution submission failed');
      }
    } catch (error) {
      console.error('Solution submission failed:', error);
      toast.error('Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${isEditorFullscreen ? 'h-screen' : 'container mx-auto px-4 py-6 max-w-7xl'}`}>
      {/* Breadcrumb */}
      {!isEditorFullscreen && (
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            {topic.name}
          </Button>
          <span>/</span>
          <span className="text-foreground font-medium">{problem.title}</span>
        </div>
      )}

      <div className={`${isEditorFullscreen ? 'h-full' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]'}`}>
        {/* Problem Description */}
        {!isEditorFullscreen && (
          <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-xl">{problem.title}</CardTitle>
              <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
                {problem.difficulty}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Score: {problem.score}</span>
              <span>•</span>
              <span>{course.name} - {topic.name}</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Tabs defaultValue="description" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="testcases">Test Cases</TabsTrigger>
                <TabsTrigger value="constraints">Constraints</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{problem.description}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="testcases" className="mt-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Test Cases</h3>
                  <Badge variant="outline" className="text-xs">
                    {problem.test_cases_basic.length} visible cases
                  </Badge>
                </div>
                {problem.test_cases_basic.slice(0, 5).map((testCase, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-card">
                    <h4 className="font-semibold mb-3 text-primary">Test Case {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">Input:</span>
                          <Badge variant="secondary" className="text-xs">stdin</Badge>
                        </div>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto border">
                          {typeof testCase.input_data === 'string' 
                            ? testCase.input_data 
                            : JSON.stringify(testCase.input_data, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">Expected Output:</span>
                          <Badge variant="secondary" className="text-xs">stdout</Badge>
                        </div>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto border">
                          {typeof testCase.expected_output === 'string' 
                            ? testCase.expected_output 
                            : JSON.stringify(testCase.expected_output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
                {problem.test_cases_basic.length > 5 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">... and {problem.test_cases_basic.length - 5} more test cases</p>
                  </div>
                )}
              </TabsContent>


              
              <TabsContent value="constraints" className="mt-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Constraints:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Time limit: 2 seconds</li>
                    <li>Memory limit: 256 MB</li>
                    <li>Test cases: {problem.test_cases_basic.length + problem.test_cases_advanced.length} total</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        )}

        {/* Code Editor and Results */}
        <div className={`flex flex-col gap-4 ${isEditorFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
          {/* Fullscreen indicator */}
          {isEditorFullscreen && (
            <div className="flex items-center justify-between py-2 px-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBack} 
                  className="gap-1 h-6 px-2"
                >
                  <ChevronLeft className="h-3 w-3" />
                  {topic.name}
                </Button>
                <span>/</span>
                <span className="text-foreground font-medium">{problem.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Fullscreen Mode • Press <kbd className="px-2 py-1 bg-background rounded text-xs">Esc</kbd> to exit
                </p>
                <Button
                  onClick={() => setIsEditorFullscreen(false)}
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <Maximize2 className="h-4 w-4" />
                  Exit Fullscreen
                </Button>
              </div>
            </div>
          )}
          {/* Test Cases in Fullscreen */}
          {isEditorFullscreen && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Test Cases</CardTitle>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {problem.test_cases_basic.slice(0, 3).map((testCase, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-card">
                      <h5 className="font-semibold mb-2 text-sm">Test Case {index + 1}</h5>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-xs">Input:</span>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            {typeof testCase.input_data === 'string' 
                              ? testCase.input_data 
                              : JSON.stringify(testCase.input_data, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="font-medium text-xs">Expected:</span>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            {typeof testCase.expected_output === 'string' 
                              ? testCase.expected_output 
                              : JSON.stringify(testCase.expected_output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Code Editor */}
          <Card className={`${isEditorMinimized ? 'h-16' : 'flex-1'} transition-all duration-300`}>
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Solution</CardTitle>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {language}
                    </Badge>
                </div>
                <div className="flex gap-2">
                  {/* Editor Controls */}
                  <Button
                    onClick={() => setIsEditorMinimized(!isEditorMinimized)}
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    title={isEditorMinimized ? 'Expand Editor' : 'Minimize Editor'}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setIsEditorFullscreen(!isEditorFullscreen)}
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    title={isEditorFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Editor (F11)'}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  
                  {/* Action Buttons */}
                  <div className="border-l pl-2 ml-2 flex gap-2">
                    <Button
                      onClick={handleRunCode}
                      disabled={isRunning || isSubmitting}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <Play className="h-4 w-4" />
                      {isRunning ? 'Running...' : 'Run'}
                    </Button>
                    <Button
                      onClick={handleSubmitSolution}
                      disabled={isRunning || isSubmitting}
                      size="sm"
                      className="gap-1"
                    >
                      <Send className="h-4 w-4" />
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                    {!isEditorFullscreen && (
                      <Button
                        onClick={onViewAnalytics}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            {!isEditorMinimized && (
              <CardContent className="flex-1 p-0">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  onLanguageChange={(newLanguage) => {
                    setLanguage(newLanguage);
                  }}
                  height={isEditorFullscreen ? "calc(100vh - 200px)" : "400px"}
                />
              </CardContent>
            )}
          </Card>

          {/* Results */}
          {(output || testResults || executionMetrics) && !isEditorMinimized && (
            <Card className={isEditorFullscreen ? 'mt-4' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                {executionMetrics && testResults && (
                  <PerformanceMetrics
                    result={{
                      id: 0,
                      coding_problem: problem.id,
                      problem_title: problem.title,
                      problem_description: problem.description,
                      code: code,
                      language: language,
                      status: executionMetrics.status,
                      output: output,
                      error_message: '',
                      execution_time: executionMetrics.execution_time,
                      memory_usage: executionMetrics.memory_usage,
                      test_cases_passed: testResults.passed,
                      total_test_cases: testResults.total,
                      plagiarism_score: 0,
                      plagiarism_details: null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      test_results: testResults,
                      plagiarism_flagged: false
                    }}
                  />
                )}

                {/* Test Results */}
                {testResults && (
                  <div>
                    <h4 className="font-semibold mb-2">Test Cases</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-medium ${
                        testResults.passed === testResults.total 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {testResults.passed}/{testResults.total} Passed
                      </span>
                      <span className="text-muted-foreground">
                        Success Rate: {((testResults.passed / testResults.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Output */}
                {output && (
                  <div>
                    <h4 className="font-semibold mb-2">Output</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto max-h-32">
                      {output}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemSolving;