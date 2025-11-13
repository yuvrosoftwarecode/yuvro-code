import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Clock, Flag, CheckCircle, ChevronLeft, ChevronRight, RotateCcw, Play, Maximize, AlertTriangle, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CodeEditor from '@/components/ui/code-editor';

interface Topic {
  id: string;
  name: string;
  duration: number;
  questions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface Course {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface Question {
  id: string;
  type: 'mcq' | 'coding' | 'descriptive';
  question: string;
  options?: string[];
  multipleCorrect?: boolean;
  marks: number;
}

interface TestInterfaceProps {
  topic: Topic;
  course: Course;
  onComplete: () => void;
  onBack: () => void;
}

// Mock questions data
const mockQuestions: Question[] = [
  {
    id: '1',
    type: 'mcq',
    question: 'What is the time complexity of binary search?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    multipleCorrect: false,
    marks: 2
  },
  {
    id: '2',
    type: 'coding',
    question: 'Write a function to reverse a string in your preferred language.',
    marks: 5
  },
  {
    id: '3',
    type: 'descriptive',
    question: 'Explain the concept of object-oriented programming and its main principles.',
    marks: 3
  },
  {
    id: '4',
    type: 'mcq',
    question: 'Which of the following are valid HTTP methods? (Select all that apply)',
    options: ['GET', 'POST', 'FETCH', 'DELETE', 'UPDATE', 'PUT'],
    multipleCorrect: true,
    marks: 4
  }
];

const TestInterface: React.FC<TestInterfaceProps> = ({
  topic,
  course,
  onComplete,
  onBack
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(topic.duration * 60); // Convert to seconds
  const [answers, setAnswers] = useState<{[key: string]: any}>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [cameraAlert, setCameraAlert] = useState(false);
  const [tabSwitchAlert, setTabSwitchAlert] = useState(false);
  const [isCodeEditorFullscreen, setIsCodeEditorFullscreen] = useState(false);
  const [codeOutput, setCodeOutput] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasMediaAccess, setHasMediaAccess] = useState(true);
  const [videoTrackEnabled, setVideoTrackEnabled] = useState(true);
  const [audioTrackEnabled, setAudioTrackEnabled] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera and microphone access with alerts
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setHasMediaAccess(true);
        
        // Monitor track enabled state
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        if (videoTrack) {
          setVideoTrackEnabled(videoTrack.enabled);
          videoTrack.addEventListener('ended', () => setVideoTrackEnabled(false));
        }
        
        if (audioTrack) {
          setAudioTrackEnabled(audioTrack.enabled);
          audioTrack.addEventListener('ended', () => setAudioTrackEnabled(false));
        }
        
      } catch (error) {
        console.error('Error accessing camera/microphone:', error);
        setCameraAlert(true);
        setHasMediaAccess(false);
      }
    };

    initializeMedia();

    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchAlert(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Monitor track state changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        const audioTrack = streamRef.current.getAudioTracks()[0];
        
        if (videoTrack) {
          setVideoTrackEnabled(videoTrack.enabled);
        }
        
        if (audioTrack) {
          setAudioTrackEnabled(audioTrack.enabled);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Ensure video stream persists through sidebar changes
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isSidebarCollapsed]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleFlagQuestion = (questionId: string) => {
    setFlagged(prev => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return newFlagged;
    });
  };

  const handleSubmitTest = () => {
    // Turn off camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Process answers and submit test
    console.log('Test submitted:', { answers, timeSpent: (topic.duration * 60) - timeLeft });
    onComplete();
  };

  // Button handlers for coding interface
  const handleRunCode = () => {
    const code = answers[currentQ.id] || '';
    // Simulate code execution
    setCodeOutput(`Running ${selectedLanguage} code...\nCode executed successfully!\nOutput: Hello World`);
    setTimeout(() => {
      setCodeOutput('Code execution completed.');
    }, 2000);
  };

  const handleExpandEditor = () => {
    setIsCodeEditorFullscreen(!isCodeEditorFullscreen);
  };

  const handleResetCode = () => {
    const defaultCode = getDefaultCodeForLanguage(selectedLanguage);
    handleAnswerChange(currentQ.id, defaultCode);
    setCodeOutput('');
  };

  // Get default code template for language
  const getDefaultCodeForLanguage = (language: string) => {
    const templates = {
      javascript: '// Write your JavaScript code here\nfunction solution() {\n    // Your code\n}\n',
      python: '# Write your Python code here\ndef solution():\n    # Your code\n    pass\n',
      java: '// Write your Java code here\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code\n    }\n}\n',
      cpp: '// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code\n    return 0;\n}\n'
    };
    return templates[language as keyof typeof templates] || '// Write your code here\n';
  };

  const currentQ = mockQuestions[currentQuestion];

  // Language change handler
  useEffect(() => {
    if (currentQ.type === 'coding' && !answers[currentQ.id]) {
      handleAnswerChange(currentQ.id, getDefaultCodeForLanguage(selectedLanguage));
    }
  }, [selectedLanguage, currentQ.id, currentQ.type]);

  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;
  const totalTime = topic.duration * 60;
  const timePercentage = (timeLeft / totalTime) * 100;
  
  // Timer color logic
  const getTimerColor = () => {
    if (timePercentage < 15) return 'bg-red-100 text-red-700 border-red-200';
    if (timePercentage < 50) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const renderQuestion = () => {
    switch (currentQ.type) {
      case 'mcq':
        if (currentQ.multipleCorrect) {
          return (
            <div className="space-y-3">
              {currentQ.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`option-${index}`}
                    checked={answers[currentQ.id]?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const currentAnswers = answers[currentQ.id] || [];
                      if (checked) {
                        handleAnswerChange(currentQ.id, [...currentAnswers, option]);
                      } else {
                        handleAnswerChange(currentQ.id, currentAnswers.filter((a: string) => a !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          );
        } else {
          return (
            <RadioGroup
              value={answers[currentQ.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
            >
              {currentQ.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          );
        }

      case 'coding':
        return (
          <div className={`h-full flex flex-col ${isCodeEditorFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
            {/* Coding Controls */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRunCode}>
                  <Play className="h-4 w-4 mr-1" />
                  Run
                </Button>
                <Button variant="outline" size="sm" onClick={handleExpandEditor}>
                  <Maximize className="h-4 w-4 mr-1" />
                  {isCodeEditorFullscreen ? 'Exit' : 'Expand'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetCode}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                {isCodeEditorFullscreen && (
                  <Button variant="outline" size="sm" onClick={() => setIsCodeEditorFullscreen(false)}>
                    ✕
                  </Button>
                )}
              </div>
            </div>
            
            {/* Code Editor and Output */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0">
                <CodeEditor
                  initialCode={answers[currentQ.id] || getDefaultCodeForLanguage(selectedLanguage)}
                  language={selectedLanguage}
                  onCodeChange={(code) => handleAnswerChange(currentQ.id, code)}
                  showRunButton={false}
                  showLanguageSelector={false}
                  showCopyButton={false}
                  showResetButton={false}
                  showFullscreenToggle={false}
                />
              </div>
              
              {/* Output Panel */}
              {codeOutput && (
                <div className="border-t bg-muted/10 p-3 max-h-32 overflow-y-auto shrink-0">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Output:</div>
                  <pre className="text-xs font-mono whitespace-pre-wrap">{codeOutput}</pre>
                </div>
              )}
            </div>
          </div>
        );

      case 'descriptive':
        return (
          <Textarea
            placeholder="Enter your answer here..."
            value={answers[currentQ.id] || ''}
            onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
            className="min-h-32"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Alerts */}
      {cameraAlert && (
        <div className="mx-auto mt-4 w-[60%]">
          <Alert className="border-orange-200 bg-orange-50 relative">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-800 pr-8">
              Camera or microphone access is disabled. Please enable access for proper test monitoring.
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCameraAlert(false)}
              className="absolute top-2 right-2 h-6 w-6 p-0 text-orange-800 hover:text-orange-900"
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        </div>
      )}
      
      {tabSwitchAlert && (
        <div className="mx-auto mt-4 w-[60%]">
          <Alert className="border-red-200 bg-red-50 relative">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800 pr-8">
              Tab switching detected! Please stay on the test page to avoid violations.
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTabSwitchAlert(false)}
              className="absolute top-2 right-2 h-6 w-6 p-0 text-red-800 hover:text-red-900"
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        </div>
      )}

      {!videoTrackEnabled && hasMediaAccess && (
        <div className="mx-auto mt-4 w-[60%]">
          <Alert className="border-red-200 bg-red-50 relative">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800 pr-8">
              Video is disabled. Please enable your camera for proper test monitoring.
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVideoTrackEnabled(true)}
              className="absolute top-2 right-2 h-6 w-6 p-0 text-red-800 hover:text-red-900"
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        </div>
      )}

      {!audioTrackEnabled && hasMediaAccess && (
        <div className="mx-auto mt-4 w-[60%]">
          <Alert className="border-yellow-200 bg-yellow-50 relative">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800 pr-8">
              Audio is disabled. Please enable your microphone for proper test monitoring.
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAudioTrackEnabled(true)}
              className="absolute top-2 right-2 h-6 w-6 p-0 text-yellow-800 hover:text-yellow-900"
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-muted/20 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {course && (
              <>
                <div className={`w-4 h-4 rounded ${course.color}`} />
                <span className="text-sm text-muted-foreground">{course.name}</span>
                <span className="text-sm">•</span>
              </>
            )}
            <span className="font-medium">{topic.name}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getTimerColor()}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono text-sm font-medium">{formatTime(timeLeft)}</span>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Submit Test
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Test?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to submit your test? You cannot make changes after submission.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmitTest}>
                    Submit Test
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
        {/* Left Sidebar */}
        <div className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-80'
        } border-r bg-muted/10 flex flex-col shrink-0`}>
          
          {/* Sidebar Header with Toggle */}
          <div className="p-3 border-b flex items-center justify-between">
            {!isSidebarCollapsed && <h3 className="font-medium">Test Navigation</h3>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isSidebarCollapsed ? (
            /* Collapsed Sidebar - Only Question Numbers */
            <div className="flex-1 p-2 overflow-y-auto">
              <div className="space-y-2">
                {mockQuestions.map((q, index) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isFlagged = flagged.has(q.id);
                  const isActive = currentQuestion === index;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={`relative h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : isAnswered 
                            ? 'bg-green-100 text-green-700 border border-green-500'
                            : 'bg-background border border-muted-foreground/30 hover:border-primary/50'
                      }`}
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="absolute -top-1 -right-1 h-2.5 w-2.5 text-orange-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Expanded Sidebar - Questions + Monitoring */
            <>
              {/* Question Navigation */}
              <div className="flex-1 p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Questions</h3>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentQuestion + 1} of {mockQuestions.length}
                    </p>
                  </div>
                  
                  {/* Question Numbers Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {mockQuestions.map((q, index) => {
                      const isAnswered = answers[q.id] !== undefined;
                      const isFlagged = flagged.has(q.id);
                      const isActive = currentQuestion === index;
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestion(index)}
                          className={`relative h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                            isActive 
                              ? 'bg-primary text-primary-foreground' 
                              : isAnswered 
                                ? 'bg-green-100 text-green-700 border border-green-500'
                                : 'bg-background border border-muted-foreground/30 hover:border-primary/50'
                          }`}
                        >
                          {index + 1}
                          {isFlagged && (
                            <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-2 text-xs border-t pt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-orange-500" />
                      <span>Flagged</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monitoring Section */}
              <div className="p-4 border-t">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Monitor</h3>
                  <div className="relative bg-muted rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-32 object-cover"
                      key={`video-${isSidebarCollapsed}`}
                    />
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      hasMediaAccess && videoTrackEnabled ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                    {!videoTrackEnabled && hasMediaAccess && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs">Video Off</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentQ.type === 'coding' ? (
            // Coding Question with Resizable Panels
            <ResizablePanelGroup direction="horizontal" className="h-full min-w-0">
              {/* Question Panel */}
              <ResizablePanel defaultSize={35} minSize={30} className="min-w-0">
                <div className="h-full p-6 overflow-auto">
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg truncate">
                          Question {currentQuestion + 1}
                        </CardTitle>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline">{currentQ.marks} marks</Badge>
                          <Badge variant="default">CODING</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFlagQuestion(currentQ.id)}
                            className={flagged.has(currentQ.id) ? 'text-orange-500' : ''}
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="mb-4 text-foreground leading-relaxed">
                          {currentQ.question}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ResizablePanel>
              
              {/* Draggable Handle */}
              <ResizableHandle withHandle />
              
              {/* Code Editor Panel */}
              <ResizablePanel defaultSize={65} minSize={40} className="min-w-0">
                <div className="h-full min-w-0">
                  {renderQuestion()}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            // Non-coding questions
            <div className="flex-1 p-6 overflow-auto">
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      Question {currentQuestion + 1}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{currentQ.marks} marks</Badge>
                      <Badge 
                        variant={currentQ.type === 'mcq' ? 'default' : 'secondary'}
                      >
                        {currentQ.type === 'mcq' ? 
                          (currentQ.multipleCorrect ? 'MULTIPLE CHOICE' : 'SINGLE CHOICE') 
                          : currentQ.type.toUpperCase()}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFlagQuestion(currentQ.id)}
                        className={flagged.has(currentQ.id) ? 'text-orange-500' : ''}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-foreground leading-relaxed text-base">
                      {currentQ.question}
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    {renderQuestion()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Navigation Footer */}
          <div className="border-t bg-muted/20 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {currentQuestion + 1} of {mockQuestions.length}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.min(mockQuestions.length - 1, prev + 1))}
                disabled={currentQuestion === mockQuestions.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInterface;