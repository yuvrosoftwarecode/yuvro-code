import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Play, Send, Maximize2 } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import codeExecutorService from '@/services/codeExecutorService';
import type { Course, Topic, CodingProblem } from '@/pages/student/CodePractice';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { toast } from 'sonner';
import { Sparkles, X } from 'lucide-react';
import AIChatContainer from '@/components/student/LearnCertify/AIChatWidget/AIChatContainer';

interface ProblemSolvingProps {
  problem: CodingProblem;
  course: Course;
  topic: Topic;
  onBack: () => void;
}

const ProblemSolving = ({ problem, course, topic, onBack }: ProblemSolvingProps) => {
  // Editor & code state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');

  // Execution state
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [executionMetrics, setExecutionMetrics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI state
  const [editorOpen, setEditorOpen] = useState(false);
  const [isEditorMinimized, setIsEditorMinimized] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  // Generate a unique session key every time the problem is loaded to start fresh
  const [chatSessionId, setChatSessionId] = useState(() => `chat-${problem.id}-${crypto.randomUUID()}`);

  useEffect(() => {
    setChatSessionId(`chat-${problem.id}-${crypto.randomUUID()}`);
  }, [problem.id]);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditorFullscreen) setIsEditorFullscreen(false);
      if (e.key === 'F11') {
        e.preventDefault();
        setIsEditorFullscreen((s) => !s);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isEditorFullscreen]);

  // templates for new files
  const templates: Record<string, string> = {
    python: `# Python solution template\n\nif __name__ == "__main__":\n    pass\n`,
    javascript: `// JavaScript solution template\n\nfunction solution() {\n  // ...\n}\n`,
    java: `// Java solution template\npublic class Solution {\n  public static void main(String[] args) {\n  }\n}\n`,
    cpp: `// C++ template\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  return 0;\n}\n`,
  };

  const mounted = useRef(false);

  useEffect(() => {
    // Initialize or update code template
    setCode(templates[language] ?? templates.python);

    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    toast.success(`Switched to ${language} template`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // difficulty badge style (pure Tailwind)
  const difficultyBadgeClass =
    problem.difficulty === 'Easy'
      ? 'bg-green-50 text-green-700 border border-green-200'
      : problem.difficulty === 'Medium'
        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        : problem.difficulty === 'Hard'
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-gray-50 text-gray-700 border border-gray-200';

  const runCode = async () => {
    if (!code.trim()) return toast.error('Please write some code first');
    setIsRunning(true);
    setOutput('');
    setTestResults(null);
    setExecutionMetrics(null);
    setShowOutput(true); // show output area while running

    try {
      const transformed = (problem.test_cases_basic || []).map((t: any) => ({
        input_data: typeof t.input_data === 'string' ? t.input_data : JSON.stringify(t.input_data),
        expected_output: typeof t.expected_output === 'string' ? t.expected_output : JSON.stringify(t.expected_output),
        weight: t.weight || 1,
      }));

      const res = await codeExecutorService.runCode({
        code,
        language,
        test_cases: transformed,
        problem_title: problem.title,
      });

      setOutput(res.output ?? res.error_message ?? '');
      setTestResults(res.test_results ?? null);
      setExecutionMetrics({
        execution_time: res.execution_time,
        memory_usage: res.memory_usage,
        status: res.status,
      });

      if (res.status === 'completed') {
        const passed = res.test_results?.passed ?? 0;
        const total = res.test_results?.total ?? 0;
        toast.success(`${passed}/${total} tests passed`);
      } else {
        toast.error('Code execution failed');
      }
    } catch (err) {
      console.error('runCode error', err);
      toast.error('Error running code');
      setOutput(typeof err === 'string' ? err : err instanceof Error ? err.message : 'Unknown error');
      setShowOutput(true);
    } finally {
      setIsRunning(false);
    }
  };

  const submitSolution = async () => {
    if (!code.trim()) return toast.error('Please write some code first');
    setIsSubmitting(true);
    setShowOutput(true);

    try {
      const all = [
        ...(problem.test_cases_basic || []),
        ...(problem.test_cases_advanced || []),
      ].map((t: any) => ({
        input_data: typeof t.input_data === 'string' ? t.input_data : JSON.stringify(t.input_data),
        expected_output: typeof t.expected_output === 'string' ? t.expected_output : JSON.stringify(t.expected_output),
        weight: t.weight || 1,
      }));

      const res = await codeExecutorService.submitSolution({
        code,
        language,
        coding_problem_id: problem.id,
        test_cases: all,
      });

      setTestResults(res.test_results ?? null);
      setExecutionMetrics({
        execution_time: res.execution_time,
        memory_usage: res.memory_usage,
        status: res.status,
      });

      if (res.status === 'completed') {
        const passed = res.test_results?.passed ?? 0;
        const total = res.test_results?.total ?? 0;
        const passRate = total ? ((passed / total) * 100).toFixed(1) : '0.0';
        toast.success(`Solution submitted: ${passed}/${total} passed (${passRate}%)`);
      } else {
        toast.error('Submission failed');
      }
    } catch (err) {
      console.error('submitSolution error', err);
      toast.error('Error submitting solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showTestsCount = (arr?: any[]) => (Array.isArray(arr) ? arr.length : 0);

  useEffect(() => {
    if (!output && !testResults && !executionMetrics && !isRunning && !isSubmitting) {
    }
  }, []);

  const getProblemContext = () => {
    return `
Problem: ${problem.title}
Difficulty: ${problem.difficulty}
Score: ${problem.score}

Description:
${problem.description}

Current Code (${language}):
${code}
    `.trim();
  };

  return (
    <div className={`${isEditorFullscreen ? 'h-screen bg-white' : 'container mx-auto px-4 py-3 max-w-9xl'}`}>
      {/* Breadcrumb */}
      {!isEditorFullscreen && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            {topic.name}
          </Button>
          <span>/</span>
          <span className="text-gray-800 font-medium">{problem.title}</span>
        </div>
      )}

      {/* 1) Problem-only view (editor hidden) */}
      {!editorOpen && !isEditorFullscreen && (
        <Card className="pt-1 border border-gray-200 shadow-sm bg-white">
          <CardHeader className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">{problem.title}</CardTitle>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                  <Badge className={`px-2 py-1 rounded ${difficultyBadgeClass}`}>{problem.difficulty}</Badge>
                  <span>Score: {problem.score}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowAiChat(!showAiChat)}
                  className={`border border-gray-200 ${showAiChat ? 'bg-purple-50 text-purple-700 border-purple-200' : 'text-gray-700 hover:bg-gray-100'}`}
                  variant="outline"
                >
                  {showAiChat ? <X className="h-4 w-4 mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  {showAiChat ? 'Close AI Help' : 'AI Help'}
                </Button>
                <Button
                  onClick={() => setEditorOpen(true)}
                  className="border border-gray-200 text-gray-700 hover:bg-gray-100"
                  variant="outline"
                >
                  Open Code Editor
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-6">
            {showAiChat ? (
              <AIChatContainer className="w-full h-[600px] border-none shadow-none" contextGetter={getProblemContext} />
            ) : (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <div className="text-gray-700 text-sm whitespace-pre-wrap">{problem.description}</div>
                </div>

                {/* Test cases (lovable style - no harsh borders) */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Test Cases</h3>
                  <div className="space-y-4">
                    {(problem.test_cases_basic || []).map((tc: any, i: number) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Input:</div>
                          <pre className="bg-gray-100 p-3 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto">
                            {typeof tc.input_data === 'string' ? tc.input_data : JSON.stringify(tc.input_data, null, 2)}
                          </pre>
                        </div>

                        <div className="mt-4">
                          <div className="text-sm font-medium text-gray-700 mb-1">Expected Output:</div>
                          <pre className="bg-gray-100 p-3 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto">
                            {typeof tc.expected_output === 'string'
                              ? tc.expected_output
                              : JSON.stringify(tc.expected_output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div >
            )}
          </CardContent >
        </Card >
      )}

      {/* 2) Split view when editor is open (horizontal resizable) */}
      {
        editorOpen && !isEditorFullscreen && (
          <div className="h-[calc(100vh-140px)]">
            <ResizablePanelGroup direction="horizontal" className="w-full h-full flex">
              {/* LEFT PANEL — Problem */}
              <ResizablePanel defaultSize={50} minSize={25}>
                <div className="h-full overflow-y-auto pr-1">
                  <Card className="border border-gray-200 shadow-sm bg-white flex flex-col h-full">
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl text-gray-900">{problem.title}</CardTitle>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <Badge className={`px-2 py-1 rounded ${difficultyBadgeClass}`}>{problem.difficulty}</Badge>
                            <span>Score: {problem.score}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowAiChat(!showAiChat)}
                            size="sm"
                            className={`border border-gray-200 ${showAiChat ? 'bg-purple-50 text-purple-700 border-purple-200' : 'text-gray-700 hover:bg-gray-100'}`}
                            variant="outline"
                          >
                            {showAiChat ? <X className="h-4 w-4 mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                            {showAiChat ? 'Problem' : 'AI Buddy'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditorOpen(false)} className="gap-1 !border-none text-gray-700 hover:bg-gray-100">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4">
                      {showAiChat ? (
                        <AIChatContainer
                          className="w-full h-full"
                          contextGetter={getProblemContext}
                          welcomeMessage="I can help you understand this problem or debug your code."
                          persistenceKey={chatSessionId}
                          chatTitle={problem.title}
                          onNewChat={() => setChatSessionId(`chat-${problem.id}-${crypto.randomUUID()}`)}
                        />
                      ) : (
                        <div className="space-y-6">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{problem.description}</p>

                          {problem.examples && problem.examples.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Examples</h4>
                              <div className="space-y-3">
                                {problem.examples.map((ex: any, idx: number) => (
                                  <div key={idx} className="bg-gray-50 p-3 rounded-lg shadow-sm">
                                    <p><strong>Input:</strong> <code>{ex.input}</code></p>
                                    <p><strong>Output:</strong> <code>{ex.output}</code></p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Visible Test Cases</h4>
                            <div className="space-y-3">
                              {(problem.test_cases_basic || []).map((tc: any, i: number) => (
                                <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Input:</p>
                                  <pre className="bg-gray-100 p-2 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                                    {typeof tc.input_data === 'string' ? tc.input_data : JSON.stringify(tc.input_data, null, 2)}
                                  </pre>

                                  <p className="text-sm mt-3 font-medium text-gray-700 mb-1">Expected Output:</p>
                                  <pre className="bg-gray-100 p-2 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                                    {typeof tc.expected_output === 'string' ? tc.expected_output : JSON.stringify(tc.expected_output, null, 2)}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ResizablePanel>

              {/* Draggable Handle (six-dot grip) */}
              <ResizableHandle className="w-1 flex items-center justify-center px-1 cursor-col-resize select-none">
                <div className="flex flex-col items-center justify-center gap-1 h-22">
                  <span className="block w-1 h-1 bg-gray-400 rounded-full transition-colors hover:bg-gray-600" />
                  <span className="block w-1 h-1 bg-gray-400 rounded-full transition-colors hover:bg-gray-600" />
                  <span className="block w-1 h-1 bg-gray-400 rounded-full transition-colors hover:bg-gray-600" />
                  <span className="block w-1 h-1 bg-gray-400 rounded-full transition-colors hover:bg-gray-600" />
                  <span className="block w-1 h-1 bg-gray-400 rounded-full transition-colors hover:bg-gray-600" />
                  <span className="block w-1 h-1 bg-gray-400 rounded-full transition-colors hover:bg-gray-600" />
                </div>
              </ResizableHandle>

              {/* RIGHT PANEL — Editor + Output inside ONE rounded card */}
              <ResizablePanel defaultSize={50} minSize={25}>
                <div className="h-full overflow-hidden pl-1">
                  <Card className="border border-gray-200 shadow-sm bg-white flex flex-col h-full overflow-hidden">

                    {/* Header */}
                    <CardHeader className="p-4 py-1 flex justify-between">
                      <CardTitle className="text-lg text-left text-gray-900">Solution
                        <Button size="sm" variant="ghost" className="!border-none text-gray-700"
                          onClick={() => setIsEditorFullscreen(true)}>
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>

                    {/* VERTICAL RESIZE GROUP (editor + output) */}
                    <ResizablePanelGroup direction="vertical" className="flex-1 overflow-hidden">

                      {/* EDITOR PANEL */}
                      <ResizablePanel defaultSize={65} minSize={30} maxSize={85}>
                        <div className="h-full flex flex-col">

                          {/* Editor */}
                          <div className="flex-1 overflow-hidden">
                            <CodeEditor
                              value={code}
                              onChange={setCode}
                              language={language}
                              onLanguageChange={setLanguage}
                              height="100%"
                            />
                          </div>

                          {/* Controls */}
                          <div className="p-4 border-t border-gray-200 bg-white flex items-center gap-3">
                            <Button onClick={runCode} size="sm" variant="outline" className="!border-gray-300 text-gray-700"
                              disabled={isRunning || isSubmitting}>
                              <Play className="h-4 w-4 mr-1" /> {isRunning ? 'Running…' : 'Run'}
                            </Button>

                            <Button onClick={submitSolution} size="sm"
                              className="bg-gray-900 text-white hover:bg-gray-800"
                              disabled={isSubmitting || isRunning}>
                              <Send className="h-4 w-4 mr-1" /> {isSubmitting ? 'Submitting…' : 'Submit'}
                            </Button>
                          </div>
                        </div>
                      </ResizablePanel>

                      {/* DIVIDER */}
                      {showOutput && (
                        <ResizableHandle className="h-3 cursor-row-resize flex items-center justify-center bg-gray-100 hover:bg-gray-200">
                          <div className="w-10 h-1 bg-gray-400 rounded-full" />
                        </ResizableHandle>
                      )}

                      {/* OUTPUT PANEL */}
                      {showOutput && (
                        <ResizablePanel defaultSize={35} minSize={15} maxSize={70}>
                          <div className="h-full overflow-auto p-4">
                            {output && (
                              <>
                                <h4 className="font-semibold text-gray-900 mb-2">Output</h4>
                                <pre className="bg-gray-100 p-3 rounded-lg text-sm whitespace-pre-wrap overflow-auto">
                                  {output}
                                </pre>
                              </>
                            )}

                            {testResults && Array.isArray(testResults.results) && (
                              <>
                                <h4 className="font-semibold text-gray-900 mb-2">Test Results</h4>
                                <div className="space-y-4">
                                  {testResults.results.map((result: any, idx: number) => (
                                    <div key={idx} className={`p-4 rounded-lg border ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                      <div className="flex flex-wrap gap-4 mb-2">
                                        <span className="font-medium text-gray-700">Test #{idx + 1}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{result.passed ? 'Passed' : 'Failed'}</span>
                                        {result.execution_time !== undefined && (
                                          <span className="text-xs text-gray-500">Time: {result.execution_time} ms</span>
                                        )}
                                      </div>
                                      <div className="mb-2">
                                        <span className="font-semibold text-gray-800">Input:</span>
                                        <pre className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap overflow-x-auto mt-1">{result.input_data}</pre>
                                      </div>
                                      <div className="mb-2">
                                        <span className="font-semibold text-gray-800">Expected Output:</span>
                                        <pre className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap overflow-x-auto mt-1">{result.expected_output}</pre>
                                      </div>
                                      <div className="mb-2">
                                        <span className="font-semibold text-gray-800">Actual Output:</span>
                                        <pre className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap overflow-x-auto mt-1">{result.actual_output}</pre>
                                      </div>
                                      <div className="mb-2">
                                        <span className="font-semibold text-gray-800">Error Message:</span>
                                        <pre className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap overflow-x-auto mt-1">{result.error_message || 'N/A'}</pre>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {executionMetrics && (
                              <>
                                <h4 className="font-semibold text-gray-900 mb-2">Execution Metrics</h4>
                                <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 mb-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {executionMetrics.execution_time !== undefined && (
                                      <div>
                                        <span className="font-semibold text-gray-800">Execution Time:</span>
                                        <span className="ml-2 text-sm text-gray-700">{executionMetrics.execution_time} ms</span>
                                      </div>
                                    )}
                                    {executionMetrics.memory_usage !== undefined && (
                                      <div>
                                        <span className="font-semibold text-gray-800">Memory Usage:</span>
                                        <span className="ml-2 text-sm text-gray-700">{executionMetrics.memory_usage} KB</span>
                                      </div>
                                    )}
                                    {executionMetrics.status && (
                                      <div>
                                        <span className="font-semibold text-gray-800">Status:</span>
                                        <span className="ml-2 text-sm text-gray-700">{executionMetrics.status}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </ResizablePanel>
                      )}
                    </ResizablePanelGroup>
                  </Card>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )
      }

      {/* 3) Fullscreen editor mode */}
      {
        isEditorFullscreen && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-700">Fullscreen Editor • press Esc to exit</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditorFullscreen(false)} className="!border-gray-300 text-gray-700">
                  Exit Fullscreen
                </Button>
                <Button onClick={runCode} variant="outline" size="sm" className="!border-gray-300 text-gray-700">
                  <Play className="h-4 w-4 mr-1" /> Run
                </Button>
                <Button onClick={submitSolution} size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                  <Send className="h-4 w-4 mr-1" /> Submit
                </Button>
              </div>
            </div>

            <div className="flex-1">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                onLanguageChange={(l) => setLanguage(l)}
                height="calc(100vh - 160px)"
              />
            </div>

            <div className="mt-3 flex gap-3">
              <Button onClick={runCode} variant="outline" className="!border-gray-300 text-gray-700">
                <Play className="h-4 w-4 mr-1" /> Run
              </Button>
              <Button onClick={submitSolution} className="bg-gray-900 text-white hover:bg-gray-800">
                <Send className="h-4 w-4 mr-1" /> Submit
              </Button>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default ProblemSolving;