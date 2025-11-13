import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  RotateCcw, 
  Bot,
  Send,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Test {
  id: string;
  title: string;
  course: string;
  duration: number;
  totalQuestions: number;
  marks: number;
  score?: number;
}

interface TestResultsProps {
  test: Test;
  onBackToList: () => void;
  onTryAgain: () => void;
}

interface QuestionResult {
  id: number;
  question: string;
  type: 'mcq' | 'coding' | 'descriptive';
  options?: string[];
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  explanation: string;
  points: number;
  maxPoints: number;
}

interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

const TestResults: React.FC<TestResultsProps> = ({
  test,
  onBackToList,
  onTryAgain
}) => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'ai',
      message: "Hello! I'm your AI assistant. I can help clarify doubts about any question or explain concepts you found challenging. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Mock test results data
  const testData = {
    ...test,
    score: test.score || Math.floor(Math.random() * 20) + 70,
    timeTaken: Math.floor(Math.random() * 30) + 45,
    completedOn: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  const questionResults: QuestionResult[] = [
    {
      id: 1,
      question: "What is the time complexity of binary search algorithm?",
      type: 'mcq',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      correctAnswer: 'O(log n)',
      studentAnswer: 'O(log n)',
      isCorrect: true,
      explanation: "Binary search has O(log n) time complexity because it eliminates half of the remaining elements in each iteration.",
      points: 2,
      maxPoints: 2
    },
    {
      id: 2,
      question: "Write a function to find the maximum element in an array.",
      type: 'coding',
      correctAnswer: 'function findMax(arr) { return Math.max(...arr); }',
      studentAnswer: 'function findMax(arr) { let max = arr[0]; for(let i = 1; i < arr.length; i++) { if(arr[i] > max) max = arr[i]; } return max; }',
      isCorrect: true,
      explanation: "Your solution correctly iterates through the array to find the maximum element. Both approaches are valid.",
      points: 8,
      maxPoints: 10
    },
    {
      id: 3,
      question: "Explain the concept of object-oriented programming and its four main principles.",
      type: 'descriptive',
      correctAnswer: 'OOP principles: Encapsulation, Inheritance, Polymorphism, Abstraction',
      studentAnswer: 'OOP is a programming paradigm based on objects. The four principles are: 1) Encapsulation - bundling data and methods, 2) Inheritance - creating new classes from existing ones, 3) Polymorphism - same interface different implementations.',
      isCorrect: false,
      explanation: "Good explanation but you missed Abstraction. Abstraction is hiding complex implementation details while showing only essential features.",
      points: 6,
      maxPoints: 8
    },
    {
      id: 4,
      question: "Which of the following are valid HTTP methods?",
      type: 'mcq',
      options: ['GET', 'POST', 'FETCH', 'DELETE', 'UPDATE', 'PUT'],
      correctAnswer: 'GET, POST, DELETE, PUT',
      studentAnswer: 'GET, POST, DELETE',
      isCorrect: false,
      explanation: "You correctly identified GET, POST, and DELETE, but missed PUT. FETCH and UPDATE are not valid HTTP methods.",
      points: 2,
      maxPoints: 3
    },
    {
      id: 5,
      question: "Implement a function to check if a string is a palindrome.",
      type: 'coding',
      correctAnswer: 'function isPalindrome(str) { const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, ""); return cleaned === cleaned.split("").reverse().join(""); }',
      studentAnswer: 'function isPalindrome(str) { return str === str.split("").reverse().join(""); }',
      isCorrect: false,
      explanation: "Your solution doesn't handle case insensitivity or non-alphanumeric characters as specified in the question.",
      points: 4,
      maxPoints: 8
    }
  ];

  const correctAnswers = questionResults.filter(q => q.isCorrect).length;
  const wrongAnswers = questionResults.filter(q => !q.isCorrect).length;
  const notAttempted = test.totalQuestions - questionResults.length;
  
  const totalScore = questionResults.reduce((sum, q) => sum + q.points, 0);
  const maxScore = test.marks;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const performanceMetrics = {
    accuracy: Math.round((correctAnswers / questionResults.length) * 100),
    speed: Math.round((testData.timeTaken / test.duration) * 100),
    completionRate: Math.round((questionResults.length / test.totalQuestions) * 100)
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 75) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 60) return { text: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Need Improvement', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const performance = getPerformanceLevel(percentage);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      message: newMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(newMessage);
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const generateAIResponse = (userMessage: string): ChatMessage => {
    const responses = [
      "I understand your concern about this question. Let me break it down for you...",
      "That's a great question! Here's how you can approach this concept...",
      "I can see why this might be confusing. The key point to remember is...",
      "Good observation! This topic often requires understanding the fundamentals of..."
    ];
    
    return {
      id: chatMessages.length + 2,
      type: 'ai',
      message: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date()
    };
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handlePreviousQuestion = () => {
    setSelectedQuestion(prev => Math.max(0, prev - 1));
  };

  const handleNextQuestion = () => {
    setSelectedQuestion(prev => Math.min(questionResults.length - 1, prev + 1));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBackToList}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onTryAgain}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Retake
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{test.title}</h1>
          <p className="text-sm text-muted-foreground">{test.course}</p>
        </div>

        {/* Compact Score Card */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-6">
              {/* Score Circle */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-8 border-primary/20 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{totalScore}</div>
                      <div className="text-xs text-muted-foreground">/ {maxScore}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <Badge className={`${performance.bg} ${performance.color} border-0 mb-2`}>
                    {performance.text}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {percentage}% • {formatTime(testData.timeTaken)}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-3">
                <div className="text-center px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <div className="text-lg font-bold text-green-600">{correctAnswers}</div>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="text-center px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
                  <div className="text-lg font-bold text-red-600">{wrongAnswers}</div>
                  <p className="text-xs text-muted-foreground">Wrong</p>
                </div>
                <div className="text-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-900">
                  <AlertCircle className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-lg font-bold text-gray-600">{notAttempted}</div>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
              </div>

              {/* Performance Bars */}
              <div className="flex-1 space-y-2 max-w-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-semibold">{performanceMetrics.accuracy}%</span>
                  </div>
                  <Progress value={performanceMetrics.accuracy} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-semibold">{performanceMetrics.completionRate}%</span>
                  </div>
                  <Progress value={performanceMetrics.completionRate} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Time Efficiency</span>
                    <span className="font-semibold">{performanceMetrics.speed}%</span>
                  </div>
                  <Progress value={performanceMetrics.speed} className="h-1.5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Question Analysis
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePreviousQuestion}
                  disabled={selectedQuestion === 0}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {selectedQuestion + 1} / {questionResults.length}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNextQuestion}
                  disabled={selectedQuestion === questionResults.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Question Pills */}
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {questionResults.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setSelectedQuestion(index)}
                    className={`flex-shrink-0 w-8 h-8 rounded-md border flex items-center justify-center font-semibold text-xs transition-all ${
                      selectedQuestion === index
                        ? 'bg-primary text-primary-foreground border-primary shadow-md scale-110'
                        : question.isCorrect
                        ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/20 dark:text-green-400 hover:bg-green-100'
                        : question.studentAnswer
                        ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/20 dark:text-red-400 hover:bg-red-100'
                        : 'bg-gray-50 text-gray-600 border-gray-300 dark:bg-gray-950/20 hover:bg-gray-100'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Question Details */}
            <div className="pt-2 border-t space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium flex-1">{questionResults[selectedQuestion].question}</p>
                <Badge 
                  variant={questionResults[selectedQuestion].isCorrect ? 'default' : 'destructive'}
                  className={`text-xs ${questionResults[selectedQuestion].isCorrect ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                >
                  {questionResults[selectedQuestion].isCorrect ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : questionResults[selectedQuestion].studentAnswer ? (
                    <XCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {questionResults[selectedQuestion].points}/{questionResults[selectedQuestion].maxPoints}
                </Badge>
              </div>

              {questionResults[selectedQuestion].type === 'mcq' && questionResults[selectedQuestion].options && (
                <div className="space-y-1.5">
                  {questionResults[selectedQuestion].options!.map((option, idx) => {
                    const isCorrect = option === questionResults[selectedQuestion].correctAnswer;
                    const isSelected = option === questionResults[selectedQuestion].studentAnswer;
                    
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-md border text-sm ${
                          isCorrect
                            ? 'bg-green-50 border-green-300 dark:bg-green-950/20'
                            : isSelected
                            ? 'bg-red-50 border-red-300 dark:bg-red-950/20'
                            : 'bg-background border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCorrect && <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />}
                          {!isCorrect && isSelected && <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />}
                          <span className={isCorrect || isSelected ? 'font-medium' : ''}>{option}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {questionResults[selectedQuestion].type === 'coding' && (
                <div className="space-y-2">
                  {questionResults[selectedQuestion].studentAnswer && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer:</p>
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                        <code>{questionResults[selectedQuestion].studentAnswer}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {questionResults[selectedQuestion].type === 'descriptive' && (
                <div className="space-y-2">
                  {questionResults[selectedQuestion].studentAnswer && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer:</p>
                      <div className="bg-muted p-2 rounded text-xs">
                        {questionResults[selectedQuestion].studentAnswer}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-2.5">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">Explanation:</p>
                <p className="text-xs text-blue-800 dark:text-blue-400">{questionResults[selectedQuestion].explanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        {!showChatbot && (
          <Button 
            onClick={() => setShowChatbot(true)} 
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            <Bot className="h-4 w-4" />
            Need Help? Ask AI Assistant
          </Button>
        )}

        {showChatbot && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  AI Assistant
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowChatbot(false)}
                  className="h-7 px-2 text-xs"
                >
                  Hide
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-48 pr-4">
                <div className="space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-2.5 text-sm ${
                          msg.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about any question..."
                  className="text-sm"
                />
                <Button 
                  onClick={handleSendMessage}
                  size="sm"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestResults;