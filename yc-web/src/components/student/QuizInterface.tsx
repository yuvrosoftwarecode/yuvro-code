import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Code, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  RotateCcw, 
  Copy, 
  Maximize2,
  MessageCircle,
  Bot,
  User,
  Send
} from 'lucide-react';
import CodeEditor from '@/components/ui/code-editor';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface QuizInterfaceProps {
  selectedTopicTitle: string;
  courseName: string;
  onFinish?: () => void;
}

interface Question {
  id: number;
  title: string;
  text: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ selectedTopicTitle, courseName, onFinish }) => {
  const { toast } = useToast();
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [code, setCode] = useState('# Write your Python code here\n\n');
  const [language, setLanguage] = useState('python');
  const [activeQuizTab, setActiveQuizTab] = useState('statement');
  const [chatMessages, setChatMessages] = useState<Array<{id: number, text: string, isUser: boolean}>>([
    { id: 1, text: `Hello! I'm here to help you with this quiz. Ask me anything about the questions!`, isUser: false }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: number}>({});
  const [score, setScore] = useState(0);
  const [isPassed, setIsPassed] = useState(false);

  // Mock questions data
  const questions: Question[] = [
    {
      id: 1,
      title: 'MCQ - Variable Declaration',
      text: 'Which of the following is the correct way to declare a variable in Python?',
      codeSnippet: `# Example code\nx = 10\nprint(x)`,
      options: [
        'var x = 10',
        'int x = 10',
        'x = 10',
        'let x = 10'
      ],
      correctAnswer: 2,
      explanation: 'In Python, you can declare a variable simply by assigning a value to it without specifying the data type. The syntax "x = 10" is correct. Python is dynamically typed, so you don\'t need keywords like "var", "int", or "let".'
    },
    {
      id: 2,
      title: 'MCQ - Conditional Statements',
      text: 'What will be the output of the following if-else statement?',
      codeSnippet: `x = 5\nif x > 3:\n    print("Greater")\nelse:\n    print("Smaller")`,
      options: [
        'Greater',
        'Smaller',
        'Error',
        'None'
      ],
      correctAnswer: 0,
      explanation: 'Since x = 5 and 5 > 3 is True, the if condition is satisfied, and "Greater" will be printed. The else block only executes when the condition is False.'
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer('');
      setShowExplanation(false);
    }
  };

  const handleSubmit = () => {
    setShowExplanation(true);
    
    // Save the user's answer
    const answerIndex = Number(selectedAnswer);
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerIndex
    }));
    
    // If this is the last question, calculate score and mark quiz as completed
    if (currentQuestionIndex === totalQuestions - 1) {
      const finalAnswers = {
        ...userAnswers,
        [currentQuestion.id]: answerIndex
      };
      
      // Calculate score
      let correctCount = 0;
      questions.forEach(q => {
        if (finalAnswers[q.id] === q.correctAnswer) {
          correctCount++;
        }
      });
      
      const percentage = (correctCount / totalQuestions) * 100;
      setScore(percentage);
      
      const passed = percentage >= 80;
      setIsPassed(passed);
      setQuizCompleted(true);
      
      // Show toast notification
      setTimeout(() => {
        if (passed) {
          toast({
            title: "🎉 Congratulations! You Passed!",
            description: `You scored ${percentage.toFixed(0)}%. Great job!`,
            className: "bg-green-500 text-white border-green-600",
          });
        } else {
          toast({
            title: "Quiz Failed",
            description: `You scored ${percentage.toFixed(0)}%. You need 80% to pass. Please try again!`,
            variant: "destructive",
          });
        }
      }, 500);
    }
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowExplanation(false);
    setQuizCompleted(false);
    setUserAnswers({});
    setScore(0);
    setIsPassed(false);
  };

  const handleFinish = () => {
    toast({
      title: "Quiz Completed!",
      description: "Subtopic marked as completed!",
    });
    onFinish?.();
  };

  const handleRunCode = () => {
    alert('Code execution coming soon!');
  };

  const handleResetCode = () => {
    setCode('# Write your Python code here\n\n');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const handleFullScreen = () => {
    alert('Full screen mode coming soon!');
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage = { id: Date.now(), text: newMessage, isUser: true };
      const aiResponse = { 
        id: Date.now() + 1, 
        text: `Great question about "${newMessage}"! Let me help you understand this concept better.`, 
        isUser: false 
      };
      
      setChatMessages(prev => [...prev, userMessage, aiResponse]);
      setNewMessage('');
    }
  };

  const renderQuestionContent = () => (
    <div className="space-y-6">
      {/* Header - Selected Topic (Hidden in fullscreen) */}
      {!showCodeEditor && (
        <div className="p-4 bg-muted/30 rounded-2xl border border-border">
          <p className="text-sm text-muted-foreground mb-1">Selected Topic</p>
          <h3 className="text-lg font-semibold">{selectedTopicTitle || 'If Else Conditional Statements'}</h3>
        </div>
      )}

      {/* Card Container */}
      <Card className="border-border shadow-md rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <Tabs value={activeQuizTab} onValueChange={setActiveQuizTab} className="w-auto">
              <TabsList className="bg-muted">
                <TabsTrigger value="statement" className="data-[state=active]:bg-background">
                  Statement
                </TabsTrigger>
                <TabsTrigger value="ai-help" className="data-[state=active]:bg-background">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  AI Help
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {!showCodeEditor && (
              <Button 
                onClick={() => setShowCodeEditor(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Code className="h-4 w-4" />
                <span>Show Code Editor</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={activeQuizTab} className="w-full">
            <TabsContent value="statement" className="mt-0 space-y-6">
              {/* Question Area */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-semibold text-foreground">
                    {currentQuestion.title}
                  </h4>
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                </div>

                <p className="text-sm text-foreground leading-relaxed">
                  {currentQuestion.text}
                </p>

                {/* Code Snippet with Syntax Highlighting */}
                {currentQuestion.codeSnippet && (
                  <div className="bg-muted/50 rounded-xl p-4 border border-border">
                    <pre className="text-sm font-mono text-foreground overflow-x-auto">
                      <code>{currentQuestion.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Multiple Choice Options */}
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAnswer(String(index))}
                    >
                      <RadioGroupItem value={String(index)} id={`option-${index}`} />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmit} 
                  disabled={!selectedAnswer}
                  className="w-full"
                  size="lg"
                >
                  Submit Answer
                </Button>

                {/* Explanation Section */}
                {showExplanation && currentQuestion.explanation && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2 animate-fade-in">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        Number(selectedAnswer) === currentQuestion.correctAnswer 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`} />
                      <h5 className="font-semibold text-sm">
                        {Number(selectedAnswer) === currentQuestion.correctAnswer 
                          ? 'Correct Answer!' 
                          : 'Incorrect Answer'}
                      </h5>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ai-help" className="mt-0">
              <div className="flex flex-col h-[400px] border border-border rounded-2xl overflow-hidden">
                {/* Chat Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-2 ${
                          message.isUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!message.isUser && (
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] p-3 rounded-xl text-sm ${
                            message.isUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {message.text}
                        </div>
                        {message.isUser && (
                          <div className="flex-shrink-0 w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Chat Input */}
                <div className="p-4 border-t border-border bg-background">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask me about this question..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      size="sm" 
                      className="px-3"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            {!quizCompleted ? (
              <>
                <Button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {questions.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentQuestionIndex ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="w-full space-y-4">
                {/* Score Display */}
                <div className={`p-4 rounded-xl text-center ${
                  isPassed ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  <p className="text-2xl font-bold mb-1">
                    {isPassed ? '🎉 Passed!' : '❌ Failed'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your Score: <span className="font-semibold">{score.toFixed(0)}%</span> ({isPassed ? 'Pass' : 'Fail'} - Required: 80%)
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleRetake}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    Retake Quiz
                  </Button>
                  {isPassed && (
                    <Button
                      onClick={handleFinish}
                      variant="default"
                      size="lg"
                      className="flex-1 bg-black text-white hover:bg-black/90"
                    >
                      Finish
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!showCodeEditor) {
    return renderQuestionContent();
  }

  // Expanded View with Code Editor (Full Screen)
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Question Content */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            {/* Back to Normal View Button */}
            <div className="p-4 border-b border-border bg-background flex items-center space-x-4">
              <Button
                onClick={() => setShowCodeEditor(false)}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Normal View</span>
              </Button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {renderQuestionContent()}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Code Editor */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            {/* Code Editor Header */}
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Code className="h-5 w-5 text-primary" />
                <select 
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>

            {/* Code Editor Area */}
            <div className="flex-1 p-4">
              <CodeEditor
                initialCode={code}
                onCodeChange={setCode}
                language={language}
              />
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-border bg-background flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  onClick={handleRunCode}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Run</span>
                </Button>
                <Button 
                  onClick={handleResetCode}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleCopyCode}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </Button>
                <Button 
                  onClick={handleFullScreen}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>Full Screen</span>
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default QuizInterface;
