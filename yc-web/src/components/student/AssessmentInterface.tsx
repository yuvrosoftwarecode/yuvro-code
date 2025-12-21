import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  Camera,
  Mic,
  CameraOff,
  MicOff,
  Eye,
  EyeOff,
  Maximize,
  Minimize2,
  Code
} from 'lucide-react';
import CodeExecutionPanel from '@/components/code-editor/CodeExecutionPanel';
import { submitSkillTest } from "@/services/skillTestService";
import { toast } from "sonner";
import { useProctoring } from '@/hooks/useProctoring';
import ExampleCodeGallery from '../code-editor/ExampleCodeGallery';

interface Assessment {
  id: string;
  title: string;
  course: string;
  duration: number;
  totalQuestions: number;
  topicId: string;
}

interface Question {
  id: string;
  type: 'mcq_single' | 'mcq_multiple' | 'coding' | 'descriptive';
  title: string;
  content: string;
  mcq_options?: { text: string; is_correct: boolean }[];
  marks: number;
  test_cases_basic?: any;
  test_cases_advanced?: any;
}

interface AssessmentInterfaceProps {
  assessment: Assessment;
  questions: Question[];
  submissionId: string;
  onComplete: (answers: any, stats: { answeredCount: number; totalQuestions: number; timeSpent: number }) => Promise<void> | void;
  onBack: () => void;
}

const AssessmentInterface: React.FC<AssessmentInterfaceProps> = ({
  assessment,
  questions: propQuestions,
  submissionId,
  onComplete,
  onBack
}) => {

  // --------------------- REAL QUESTIONS ---------------------
  const [questions, setQuestions] = useState<Question[]>(propQuestions);

  useEffect(() => {
    setQuestions(propQuestions);
  }, [propQuestions]);

  // --------------------- STATES ---------------------

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(assessment.duration * 60);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});

  // Derived state for Proctoring
  const currentQuestionData = questions[currentQuestion];
  const isCodingQuestion = currentQuestionData?.type === 'coding';
  const proctoringQuestionId = isCodingQuestion ? currentQuestionData?.id : undefined;

  // --------------------- PROCTORING ---------------------

  // 1. General Proctoring (Always active, logs to Submission)
  useProctoring({
    assessmentId: assessment.id,
    assessmentType: 'skill-tests',
    enabled: true,
    questionId: undefined
  });

  // 2. Question Proctoring (Coding only, logs to Question)
  useProctoring({
    assessmentId: assessment.id,
    assessmentType: 'skill-tests',
    enabled: isCodingQuestion,
    questionId: proctoringQuestionId // has value only if isCodingQuestion
  });


  const [explanations, setExplanations] = useState<{ [key: string]: string }>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showExamples, setShowExamples] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [cameraAlert, setCameraAlert] = useState(false);
  const [tabSwitchAlert, setTabSwitchAlert] = useState(false);
  const [showTabSwitchDialog, setShowTabSwitchDialog] = useState(false);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [isCodeEditorFullscreen, setIsCodeEditorFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasMediaAccess, setHasMediaAccess] = useState(true);
  const [videoTrackEnabled, setVideoTrackEnabled] = useState(true);
  const [audioTrackEnabled, setAudioTrackEnabled] = useState(true);

  const [questionPage, setQuestionPage] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // -------------------- MEDIA + MONITORING (UNCHANGED UI) --------------------
  // (YOUR ENTIRE CAMERA MICROPHONE LOGIC — LEFT EXACTLY AS IT IS)

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        streamRef.current = stream;
        setHasMediaAccess(true);
        setVideoTrackEnabled(true);
        setAudioTrackEnabled(true);
        setCameraAlert(false);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }

      } catch (err) {
        console.error("Media init error", err);
        setHasMediaAccess(false);
        setVideoTrackEnabled(false);
        setAudioTrackEnabled(false);
        setCameraAlert(true);
      }
    };

    initializeMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // -------------------- TIMER (UNCHANGED) --------------------

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // -------------------- ANSWER & FLAG HANDLERS --------------------

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleExplanationChange = (questionId: string, explanation: string) => {
    setExplanations(prev => ({ ...prev, [questionId]: explanation }));
  };

  const handleFlagQuestion = (questionId: string) => {
    setFlagged(prev => {
      const n = new Set(prev);
      n.has(questionId) ? n.delete(questionId) : n.add(questionId);
      return n;
    });
  };

  // -------------------- SUBMIT ASSESSMENT --------------------

  const handleSubmitAssessment = async () => {
    const answeredCount = questions.filter(q => {
      if (q.type === "descriptive") {
        return answers[q.id]?.trim();
      } else {
        return answers[q.id] && explanations[q.id]?.trim();
      }
    }).length;

    const timeSpent = (assessment.duration * 60) - timeLeft;

    // Delegate to Parent (Contest or SkillTest)
    try {
      await onComplete(answers, {
        answeredCount,
        totalQuestions: questions.length,
        timeSpent
      });
    } catch (err) {
      console.error("Submit error passed to parent failed", err);
    }
  };

  // -------------------- NAVIGATION --------------------

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      const n = currentQuestion + 1;
      setCurrentQuestion(n);
      const newPage = Math.floor(n / 10);
      if (newPage !== questionPage) setQuestionPage(newPage);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      const n = currentQuestion - 1;
      setCurrentQuestion(n);
      const newPage = Math.floor(n / 10);
      if (newPage !== questionPage) setQuestionPage(newPage);
    }
  };

  // -------------------- PAGINATION --------------------

  const questionsPerPage = 10;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startQuestion = questionPage * questionsPerPage;
  const endQuestion = Math.min(startQuestion + questionsPerPage, questions.length);
  const paginatedQuestions = questions.slice(startQuestion, endQuestion);

  const handleQuestionClick = (index: number) => {
    const actualIndex = startQuestion + index;
    setCurrentQuestion(actualIndex);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setQuestionPage(newPage);
    }
  };

  // -------------------- STATUS COLORS --------------------

  const getQuestionStatus = (index: number, questionId: string) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return 'unanswered';

    if (q.type === 'descriptive') {
      if (answers[q.id]?.trim()) return 'answered';
    } else {
      if (answers[q.id] && explanations[q.id]?.trim()) return 'answered';
    }

    if (flagged.has(questionId)) return 'flagged';
    if (index === currentQuestion) return 'current';
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-500 text-white';
      case 'flagged': return 'bg-yellow-500 text-white';
      case 'current': return 'bg-primary text-white';
      default: return 'bg-muted text-muted-foreground border';
    }
  };

  // -------------------- RENDER QUESTION (UNCHANGED UI) --------------------

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'mcq_single':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={answers[question.id] || ''}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {question.mcq_options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.text} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Explanation */}
            <div className="mt-4">
              <Label htmlFor={`explanation-${question.id}`} className="text-sm font-medium">
                Explain your answer (required)
              </Label>
              <Textarea
                id={`explanation-${question.id}`}
                placeholder="Explain why you chose this answer..."
                value={explanations[question.id] || ''}
                onChange={(e) => handleExplanationChange(question.id, e.target.value)}
                className="mt-2 min-h-20"
              />
            </div>
          </div>
        );

      case 'mcq_multiple':
        return (
          <div className="space-y-3">
            <div className="space-y-3">
              {question.mcq_options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    id={`option-${index}`}
                    checked={answers[question.id]?.includes(option.text) || false}
                    onCheckedChange={(checked) => {
                      const current = answers[question.id] || [];
                      const newAns = checked
                        ? [...current, option.text]
                        : current.filter((a: string) => a !== option.text);
                      handleAnswerChange(question.id, newAns);
                    }}
                  />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="mt-4">
              <Label htmlFor={`explanation-${question.id}`} className="text-sm font-medium">
                Explain your answer (required)
              </Label>
              <Textarea
                id={`explanation-${question.id}`}
                placeholder="Explain why you chose this answer..."
                value={explanations[question.id] || ''}
                onChange={(e) => handleExplanationChange(question.id, e.target.value)}
                className="mt-2 min-h-20"
              />
            </div>
          </div>
        );

      case 'coding':
        return (
          <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Code className="w-4 h-4" />
                <span>Write your solution below</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCodeEditorFullscreen(!isCodeEditorFullscreen)}
                className="text-slate-500 hover:text-indigo-600 border-slate-200"
              >
                {isCodeEditorFullscreen ? <Minimize2 className="w-4 h-4 mr-1" /> : <Maximize className="w-4 h-4 mr-1" />}
                {isCodeEditorFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
            </div>

            <div className={`transition-all duration-300 ${isCodeEditorFullscreen ? 'fixed inset-0 z-[100] bg-white p-4' : 'w-full'}`}>
              {isCodeEditorFullscreen && (
                <div className="flex justify-between items-center mb-2 px-2">
                  <h2 className="font-bold text-lg">{question.title}</h2>
                  <Button size="sm" variant="ghost" onClick={() => setIsCodeEditorFullscreen(false)}>Close</Button>
                </div>
              )}

              <CodeExecutionPanel
                problem={{
                  id: question.id,
                  title: question.title || 'Coding Question',
                  description: question.content || '',
                  test_cases_basic: question.test_cases_basic || []
                }}
                initialCode={answers[question.id] || ''}
                onCodeChange={(code) => handleAnswerChange(question.id, code)}
                onLanguageChange={setSelectedLanguage}

                // Allow "Run" (shows test results tab) but "Submit" is global
                showRunButton={true}
                showSubmitButton={false}

                mode="exam"
                showTestCases={true}
                allowCustomTestCases={false}

                className={`h-full border border-slate-200 shadow-sm overflow-hidden ${isCodeEditorFullscreen ? 'h-[90vh]' : ''} p-0`}
                editorHeight={isCodeEditorFullscreen ? '80vh' : '500px'}
              />
            </div>

            {/* Explanation - Optional for Coding but kept if strict requirement */}
            <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Explain your approach (Optional)</Label>
              <Textarea
                placeholder="Briefly explain your algorithm or logic..."
                value={explanations[question.id] || ''}
                onChange={(e) => handleExplanationChange(question.id, e.target.value)}
                className="min-h-[100px] bg-white border-slate-200 focus:border-indigo-300 focus:ring-indigo-100"
              />
            </div>
          </div>
        );

      case 'descriptive':
        return (
          <Textarea
            placeholder="Type your answer here..."
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="min-h-32"
          />
        );

      default:
        return null;
    }
  };

  // -------------------- CURRENT QUESTION --------------------


  const progress = questions.length ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const answeredCount = questions.filter(q => {
    if (q.type === 'descriptive') return answers[q.id]?.trim();
    return answers[q.id] && explanations[q.id]?.trim();
  }).length;

  const flaggedCount = flagged.size;

  // -------------------- RENDER UI (REVAMPED) --------------------

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">

      {/* 1. Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-90">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">

          {/* Left: Title & Info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-lg">
                <span className="text-lg">{assessment.course?.[0] || 'A'}</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">{assessment.title}</h1>
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
                  <span>{assessment.course}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span>{assessment.totalQuestions} Questions</span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex h-8 w-px bg-gray-200 mx-4"></div>

            {/* Camera Feed Mini-View */}
            <div className="relative group overflow-hidden rounded-lg shadow-md border border-gray-200 w-32 h-12 bg-black transition-all hover:scale-105">
              {hasMediaAccess && streamRef.current ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <CameraOff className="w-4 h-4" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1 space-x-2">
                {videoTrackEnabled ? <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> : <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                {audioTrackEnabled ? <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> : <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
              </div>
            </div>
          </div>

          {/* Right: Timer & Actions */}
          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-full border ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono text-xl font-bold tracking-widest">{formatTime(timeLeft)}</span>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 px-6 rounded-full transition-all hover:scale-105 active:scale-95">
                  Finish Test
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you ready to submit?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered <span className="font-bold text-slate-900">{answeredCount}</span> out of <span className="font-bold text-slate-900">{questions.length}</span> questions.
                    {flaggedCount > 0 && <div className="mt-2 text-yellow-600">Note: You have flagged {flaggedCount} questions for review.</div>}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Working</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmitAssessment} className="bg-indigo-600 hover:bg-indigo-700">Submit Assessment</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Progress Bar Loader */}
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* 2. Main Workspace */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar: Navigation Grid */}
        <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative z-40 ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            {!isSidebarCollapsed && <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Navigation</h3>}
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="ml-auto text-slate-400 hover:text-indigo-600">
              {isSidebarCollapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!isSidebarCollapsed ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase">Question Grid</h4>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handlePageChange(questionPage - 1)} disabled={questionPage === 0}><ChevronLeft className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handlePageChange(questionPage + 1)} disabled={questionPage === totalPages - 1}><ChevronRight className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {paginatedQuestions.map((q, index) => {
                      const actualIndex = startQuestion + index;
                      const status = getQuestionStatus(actualIndex, q.id);
                      let baseClasses = "h-10 w-full rounded-lg text-sm font-semibold transition-all duration-200 border-2";
                      if (status === 'current') baseClasses += " border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm scale-105";
                      else if (status === 'answered') baseClasses += " border-transparent bg-green-500 text-white shadow-green-200";
                      else if (status === 'flagged') baseClasses += " border-yellow-400 bg-yellow-50 text-yellow-700";
                      else baseClasses += " border-slate-100 bg-white text-slate-400 hover:border-slate-300";

                      return (
                        <button
                          key={q.id}
                          onClick={() => handleQuestionClick(index)}
                          className={baseClasses}
                        >
                          {actualIndex + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Answered</span>
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{answeredCount}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Flagged</span>
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{flaggedCount}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Remaining</span>
                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{questions.length - answeredCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                {/* Mini Sidebar view logic if needed, or just keep icons */}
                <div className="text-xs font-bold text-slate-400 text-center mb-2">{currentQuestion + 1}</div>
                <Progress value={progress} className="w-1 h-24 rounded-full" orientation="vertical" />
                <div className="text-xs font-bold text-indigo-600 mt-2">{Math.round(progress)}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 relative">

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">

              {questions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                  {/* Question Header */}
                  <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Question {currentQuestion + 1}</span>
                        <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-sm border border-blue-200">{currentQuestionData.type.replace('_', ' ')}</div>
                        <div className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded-sm border border-orange-200">{currentQuestionData.marks} Marks</div>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 leading-snug">{currentQuestionData.title}</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${flagged.has(currentQuestionData.id) ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' : 'text-slate-400 hover:text-slate-600'}`}
                      onClick={() => handleFlagQuestion(currentQuestionData.id)}
                    >
                      <Flag className={`w-5 h-5 ${flagged.has(currentQuestionData.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  {/* Question Body */}
                  <div className="px-8 py-8 md:px-10">
                    <div className="prose prose-slate max-w-none text-slate-700 text-lg mb-8">
                      <div dangerouslySetInnerHTML={{ __html: currentQuestionData.content }} />
                    </div>

                    <div className="mt-8">
                      {renderQuestion(currentQuestionData)}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bottom Bar Controls for Mobile/Tablet or ease of access */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-4 flex justify-between items-center z-30">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              className="space-x-2 border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-300"
            >
              <ChevronLeft className="w-4 h-4" /> <span>Previous</span>
            </Button>

            <div className="hidden md:block text-slate-400 text-sm font-medium">
              Use <span className="kbd bg-slate-100 px-1 rounded border border-slate-300">Ctrl</span> + <span className="kbd bg-slate-100 px-1 rounded border border-slate-300">Enter</span> to run code if applicable.
            </div>

            <Button
              onClick={handleNextQuestion}
              disabled={currentQuestion === questions.length - 1}
              className="space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
            >
              <span>Next Question</span> <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>

      {/* Alerts */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col space-y-2 w-full max-w-lg px-4 pointer-events-none">
        {cameraAlert && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between pointer-events-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <p className="text-sm font-medium">Camera access lost! Please check your permissions.</p>
            </div>
            <button onClick={() => setCameraAlert(false)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        )}
        {tabSwitchAlert && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between pointer-events-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-orange-600" />
              <p className="text-sm font-medium">Tab switching detected! Warning {tabSwitchCount}/3.</p>
            </div>
            <button onClick={() => setTabSwitchAlert(false)} className="text-orange-500 hover:text-orange-700"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Tab Switch Dialog */}
      <AlertDialog open={showTabSwitchDialog} onOpenChange={() => { }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Assessment Terminated</AlertDialogTitle>
            <AlertDialogDescription>
              We detected excessive tab switching during the assessment. As per the proctoring rules, your test has been automatically submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSubmitAssessment} className="bg-red-600 hover:bg-red-700">Acknowledge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Navigation Confirm Dialog */}
      <AlertDialog open={showNavigationDialog} onOpenChange={setShowNavigationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              You are attempting to leave the assessment page. If you leave now, your progress will be lost and the test will be submitted as-is.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitAssessment} className="bg-red-600 hover:bg-red-700">Leave & Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Style helper for custom scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        `}} />

      {showExamples && (
        <ExampleCodeGallery
          currentLanguage={selectedLanguage}
          onClose={() => setShowExamples(false)}
          onApplyCode={(exampleCode) => {
            handleAnswerChange(currentQuestionData.id, exampleCode);
            setShowExamples(false);
          }}
        />
      )}
    </div>
  );
};

export default AssessmentInterface;
