import { useEffect, useState, useRef } from "react";
import { fetchQuestions, Question } from "@/services/questionService";
import { submitCoding } from "@/services/courseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Play, CheckCircle, ArrowLeft, Terminal, Sparkles, X } from "lucide-react";
import CodeEditor from "../CodeEditor";
import { toast } from "sonner";
import AIChatContainer from '@/components/student/LearnCertify/AIChatWidget/AIChatContainer';

interface StudentCodingEmbedProps {
  subtopicId: string;
  onComplete?: (status: boolean) => void;
}

const PaneWrapper = ({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div
    className={`w-full h-full bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 ${className}`}
    style={style}
  >
    {children}
  </div>
);

const StudentCodingEmbed = ({ subtopicId, onComplete }: StudentCodingEmbedProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // View State
  const [viewMode, setViewMode] = useState<'list' | 'workspace'>('list');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Resize State
  const [leftWidth, setLeftWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // AI Chat State
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatSessionId, setChatSessionId] = useState("");

  // Editor State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");

  // Track solved questions IDs
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSolvedMap({});
    setViewMode('list');
    setSelectedQuestion(null);
    setShowAiChat(false);
    setChatSessionId(`chat-${subtopicId}-${crypto.randomUUID()}`);
  }, [subtopicId]);

  useEffect(() => {
    loadCodingQuestions();
  }, [subtopicId]);

  useEffect(() => {
    if (questions.length > 0) {
      const allSolved = questions.every(q => solvedMap[q.id]);
      if (allSolved) {
        setIsCompleted(true);
        if (onComplete) onComplete(true);
      }
    } else if (!loading && questions.length === 0) {
      if (onComplete) onComplete(true);
    }
  }, [solvedMap, questions, loading, onComplete]);

  // Resize Handlers
  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const handleResize = (e: React.MouseEvent) => {
    if (!isResizing) return;

    const container = e.currentTarget.getBoundingClientRect();
    const newWidth = ((e.clientX - container.left) / container.width) * 100;

    if (newWidth > 20 && newWidth < 80) { // Limits
      setLeftWidth(newWidth);
    }
  };

  const loadCodingQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetchQuestions({
        subtopic: subtopicId,
        type: 'coding'
      });

      setQuestions(res);
    } catch (err) {
      console.error("Failed to load coding questions", err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (q: Question) => {
    setSelectedQuestion(q);
    // Determine starter code based on language (could be dynamic later)
    setCode(`# Write your solution for: ${q.title}\n\ndef solution():\n    pass`);
    setViewMode('workspace');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedQuestion(null);
  };

  const handleSimulateSubmit = () => {
    if (!selectedQuestion) return;

    // Simulate success for now (Real execution would usually happen via an API)
    const newSolved = { ...solvedMap, [selectedQuestion.id]: true };
    setSolvedMap(newSolved);
    toast.success("Solution Submitted Successfully!");

    const allSolved = questions.every(q => q.id === selectedQuestion.id ? true : newSolved[q.id]);

    submitCoding(subtopicId, newSolved)
      .then(() => {
        if (allSolved) {
          setIsCompleted(true);
          if (onComplete) onComplete(true);
        } else {
          if (onComplete) onComplete(false); // Update progress even if partial
        }
      })
      .catch(err => {
        console.error("Backend submit failed", err);
        toast.error("Failed to save progress");
      });
  };

  const getProblemContext = () => {
    if (!selectedQuestion) return "";
    return `
Problem: ${selectedQuestion.title}
Difficulty: ${selectedQuestion.difficulty}

Description:
${selectedQuestion.content}

Current Code (${language}):
${code}
    `.trim();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-muted-foreground p-4">Loading coding questions...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 bg-gray-50 rounded-lg border border-dashed">
        <Code className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No coding questions available for this subtopic.</p>
        <p className="text-sm mt-2">Requirement automatically met.</p>
      </div>
    );
  }

  // ===================== LIST VIEW =====================
  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Coding Practice ({Object.keys(solvedMap).length} / {questions.length} solved)
            </h3>
          </div>
          <Badge variant={isCompleted ? "default" : "outline"} className={isCompleted ? "bg-green-600" : ""}>
            {isCompleted ? "All Completed" : "In Progress"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className={`cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-indigo-300 group`}
              onClick={() => handleSelectQuestion(question)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-indigo-50 p-2 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <Terminal className="h-5 w-5 text-indigo-600" />
                  </div>
                  {(solvedMap[question.id]) && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>

                <h5 className="font-semibold text-base mb-2 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                  {index + 1}. {question.title}
                </h5>

                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(question.difficulty)}>
                    {question.difficulty}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ===================== WORKSPACE VIEW =====================
  const gapSize = 24; // 1.5rem gap
  const halfGap = gapSize / 2;

  // Calculate widths accounting for gap
  const styles = {
    left: { width: `calc(${leftWidth}% - ${halfGap}px)` },
    right: { width: `calc(${100 - leftWidth}% - ${halfGap}px)` }
  };

  return (
    <div className="flex flex-col h-full relative select-none bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-1 pl-0 sm:pl-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="h-5 w-px bg-gray-300" />
          <h3 className="font-semibold text-base text-gray-900 line-clamp-1">
            {selectedQuestion?.title}
          </h3>
          <Badge className={getDifficultyColor(selectedQuestion?.difficulty || 'easy')}>
            {selectedQuestion?.difficulty}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSimulateSubmit}
          >
            {solvedMap[selectedQuestion!.id] ? "Solved ✓" : "Submit"}
          </Button>
        </div>
      </div>

      {/* Split Pane Content */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden p-4 gap-6 box-border relative"
        onMouseMove={handleResize}
        onMouseUp={stopResizing}
        onMouseLeave={stopResizing}
      >

        {/* Left: Problem Description */}
        <PaneWrapper className="flex flex-col" style={styles.left}>
          {/* Header with Icon and Toggle */}
          <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded shadow-sm border border-gray-100">
                <Code className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold text-sm text-gray-700">Problem Description</span>
            </div>

            <Button
              onClick={() => setShowAiChat(!showAiChat)}
              size="sm"
              className={`h-7 text-xs border ${showAiChat ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'} transition-all`}
              variant="outline"
            >
              {showAiChat ? <X className="h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
              {showAiChat ? 'Close AI' : 'AI Help'}
            </Button>
          </div>

          {showAiChat ? (
            <AIChatContainer
              className="w-full h-full border-none shadow-none rounded-none"
              contextGetter={getProblemContext}
              welcomeMessage={`I can help you understand "${selectedQuestion?.title || 'this problem'}". Ask me anything!`}
              persistenceKey={chatSessionId}
              chatTitle={selectedQuestion?.title || "Coding Help"}
              onNewChat={() => setChatSessionId(`chat-${selectedQuestion?.id}-${crypto.randomUUID()}`)}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-8 animate-fade-in">
              <div className="prose prose-sm prose-slate max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-600">
                  {selectedQuestion?.content}
                </pre>
              </div>

              {/* Test Cases */}
              {selectedQuestion?.test_cases_basic && selectedQuestion.test_cases_basic.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-4 text-gray-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-gray-500" />
                    Sample Test Cases
                  </h4>
                  <div className="space-y-4">
                    {selectedQuestion.test_cases_basic.map((testCase, index) => (
                      <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                          <div>
                            <span className="font-semibold text-slate-500 block mb-2 uppercase tracking-wider text-[10px]">Input</span>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 overflow-x-auto shadow-sm">
                              {testCase.input}
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500 block mb-2 uppercase tracking-wider text-[10px]">Expected Output</span>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 overflow-x-auto shadow-sm">
                              {testCase.expected_output}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </PaneWrapper>

        {/* Resizer Handle */}
        <div
          className="w-4 flex items-center justify-center cursor-col-resize hover:bg-indigo-100/50 active:bg-indigo-100 rounded-full group z-10 -ml-6 -mr-6 relative transition-colors"
          onMouseDown={startResizing}
        >
          <div className="w-1 h-8 bg-gray-300 rounded-full group-hover:bg-indigo-500 transition-colors shadow-sm" />
        </div>

        {/* Right: Code Editor */}
        <PaneWrapper className="flex flex-col" style={styles.right}>
          <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center gap-2 backdrop-blur-sm">
            <div className="p-1.5 bg-white rounded shadow-sm border border-gray-100">
              <Terminal className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="font-semibold text-sm text-gray-700">Solution</span>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              height="100%"
            />
          </div>
        </PaneWrapper>

      </div>
    </div>
  );
};

export default StudentCodingEmbed;