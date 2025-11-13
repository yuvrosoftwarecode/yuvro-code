import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/common/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  FileText, 
  Code2, 
  Code, 
  MessageCircle, 
  Monitor, 
  Send, 
  Bot, 
  User,
  Award
} from 'lucide-react';
import CodeEditor from '@/components/ui/code-editor';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import studentNavigationConfig from '@/config/studentNavigation';
import QuizInterface from './QuizInterface';
import { Topic } from './learn/TopicSidebar';
import { Subtopic } from './learn/SubtopicTimeline';
import UnifiedProgressSidebar from './learn/UnifiedProgressSidebar';
import TestInstructions from './skill-test/TestInstructions';
import AssessmentInterface from './AssessmentInterface';
import TestThankYou from './skill-test/TestThankYou';
import TestResults from './skill-test/TestResults';

// NEW: service to fetch course structure
import { fetchCourseStructure } from '@/services/courseService';

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [activeTab, setActiveTab] = useState('video');

  // Keep your Topic and Subtopic types as-is (from imported files)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [code, setCode] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<'content' | 'test-instructions' | 'test' | 'test-thankyou' | 'test-results'>('content');
  const [completedSubtopics, setCompletedSubtopics] = useState<Set<string>>(new Set());
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [testStats, setTestStats] = useState<{ answeredCount: number; totalQuestions: number; timeSpent: number } | null>(null);

  // --- New dynamic state (replaces mock data)
  const [courseName, setCourseName] = useState<string>('Course');
  const [courseIcon, setCourseIcon] = useState<string>('📚');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [allSubtopics, setAllSubtopics] = useState<Record<string, Subtopic[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state (unchanged)
  const [chatMessages, setChatMessages] = useState<Array<{id: number | string, text: string, isUser: boolean}>>([
    { id: 1, text: `Hello! I'm your AI learning assistant for ${courseName}. How can I help you today?`, isUser: false }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Load course structure (topics + subtopics) from backend
  useEffect(() => {
    let mounted = true;
    async function loadCourse() {
      if (!courseId) {
        setError('Course ID missing from URL');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const resp = await fetchCourseStructure(courseId);

        // fetchCourseStructure returns { course, topics }
        const course = resp.course;
        const fetchedTopics = resp.topics || [];

        if (!mounted) return;

        setCourseName(course?.name || 'Course');

        // optional: map course.category to an emoji icon, fallback to 📚
        const categoryIconMap: Record<string, string> = {
          fundamentals: '📘',
          programming_languages: '💻',
          databases: '🗄️',
          ai_tools: '🤖'
        };
        const category = (course && (course as any).category) || '';
        setCourseIcon(categoryIconMap[category] || '📚');

        // Build subtopic map and frontend-compatible topics array
        const subtopicMap: Record<string, Subtopic[]> = {};
        const frontendTopics: Topic[] = fetchedTopics.map((t: any) => {
          const subs: any[] = Array.isArray(t.subtopics) ? t.subtopics : (t.subtopics || []);
          // map backend subtopic -> frontend Subtopic type
          const mappedSubs: Subtopic[] = subs.map((s: any) => ({
            id: s.id,
            name: s.name,
            // backend doesn't track completion by user — default false; frontend will merge with completedSubtopics
            completed: !!s.completed || false,
            description: s.content || undefined
          }));

          subtopicMap[t.id] = mappedSubs;

          // compute initial progress values (based on fetched subtopics and current completedSubtopics)
          const total = mappedSubs.length;
          const subCompletedInitial = mappedSubs.filter(s => s.completed).length;
          const progressPercent = total > 0 ? Math.round((subCompletedInitial / total) * 100) : 0;
          const topicCompletedFlag = total > 0 ? (subCompletedInitial === total) : false;

          const frontendTopic: Topic = {
            id: t.id,
            name: t.name,
            progress: progressPercent,
            completed: topicCompletedFlag,
            subtopicsCompleted: subCompletedInitial,
            totalSubtopics: total,
          };
          return frontendTopic;
        });

        setAllSubtopics(subtopicMap);
        setTopics(frontendTopics);

        // initialize selected topic/subtopic if none selected
        if (frontendTopics.length > 0 && !selectedTopic) {
          const first = frontendTopics[0];
          setSelectedTopic(first);
          const subArr = subtopicMap[first.id] || [];
          if (subArr.length > 0) {
            setSelectedSubtopic(subArr[0]);
          } else {
            setSelectedSubtopic(null);
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading course structure', err);
        if (!mounted) return;
        setError(err?.message || 'Failed to load course data');
        setLoading(false);
      }
    }

    loadCourse();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Recompute topics' progress and completion whenever completedSubtopics changes
  useEffect(() => {
    // Recalculate using current allSubtopics map
    setTopics(prevTopics => {
      return prevTopics.map((topic) => {
        const subs = allSubtopics[topic.id] || [];
        const total = subs.length;
        // count completed = backend completed OR in local completedSubtopics set
        const subCompleted = subs.filter(s => s.completed || completedSubtopics.has(s.id)).length;
        const progress = total > 0 ? Math.round((subCompleted / total) * 100) : 0;
        const topicCompleted = total > 0 ? (subCompleted === total) : false;

        return {
          ...topic,
          progress,
          completed: topicCompleted,
          subtopicsCompleted: subCompleted,
          totalSubtopics: total,
        };
      });
    });
  }, [completedSubtopics, allSubtopics]);

  // Initialize with first topic if available (also triggers when topics update)
  React.useEffect(() => {
    if (topics.length > 0 && !selectedTopic) {
      const firstTopic = topics[0];
      setSelectedTopic(firstTopic);
      const subtopicsArr = allSubtopics[firstTopic.id] || [];
      if (subtopicsArr.length > 0) {
        setSelectedSubtopic(subtopicsArr[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, allSubtopics]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    const subtopics = allSubtopics[topic.id] || [];
    setSelectedSubtopic(subtopics[0] || null);
  };

  const handleSubtopicSelect = (subtopic: Subtopic) => {
    setSelectedSubtopic(subtopic);
  };

  const handleBackToCourses = () => {
    navigate('/student/learn-certify');
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage = { id: Date.now(), text: newMessage, isUser: true };
      const aiResponse = { 
        id: Date.now() + 1, 
        text: `I understand you're asking about "${newMessage}". Let me help you with that concept in ${courseName}.`, 
        isUser: false 
      };
      
      setChatMessages(prev => [...prev, userMessage, aiResponse]);
      setNewMessage('');
    }
  };

  const handleQuizFinish = () => {
    if (selectedSubtopic) {
      setCompletedSubtopics(prev => {
        const next = new Set(prev);
        next.add(selectedSubtopic.id);
        return next;
      });
    }
  };

  const handleTakeTest = () => {
    setCurrentView('test-instructions');
  };

  const handleStartTest = () => {
    setCurrentView('test');
  };

  const handleTestComplete = (stats?: { answeredCount: number; totalQuestions: number; timeSpent: number }) => {
    if (stats) {
      setTestStats(stats);
    }
    // Mark topic as completed
    if (selectedTopic) {
      setCompletedTopics(prev => {
        const next = new Set(prev);
        next.add(selectedTopic.id);
        return next;
      });
    }
    setCurrentView('test-thankyou');
  };

  const handleViewResults = () => {
    setCurrentView('test-results');
  };

  const handleBackToContent = () => {
    setCurrentView('content');
  };

  // Calculate if all subtopics are completed for currently selectedTopic
  const currentSubtopics = selectedTopic ? allSubtopics[selectedTopic.id] || [] : [];
  const updatedSubtopics = currentSubtopics.map(s => ({
    ...s,
    completed: s.completed || completedSubtopics.has(s.id)
  }));
  const allSubtopicsCompleted = updatedSubtopics.length > 0 && updatedSubtopics.every(s => s.completed);

  // Loading / error fallback: preserve UI but show simple messages in content area if needed
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          showMenu={true} 
          menuItems={studentNavigationConfig.getMenuItems(navigate, 'learn-certify')}
        />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div>Loading course content...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          showMenu={true} 
          menuItems={studentNavigationConfig.getMenuItems(navigate, 'learn-certify')}
        />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  // Test instructions view
  if (currentView === 'test-instructions' && selectedTopic) {
    return (
      <div className="min-h-screen bg-background">
        <TestInstructions
          test={{
            id: selectedTopic.id,
            title: `${selectedTopic.name} Test`,
            course: courseName,
            duration: 60,
            totalQuestions: 20,
            difficulty: 'Medium',
            description: `Comprehensive test on ${selectedTopic.name}`,
            marks: 200
          }}
          onStart={handleStartTest}
          onBack={handleBackToContent}
        />
      </div>
    );
  }

  // Test interface view
  if (currentView === 'test' && selectedTopic) {
    return (
      <div className="min-h-screen bg-background">
        <AssessmentInterface
          assessment={{
            id: selectedTopic.id,
            title: `${selectedTopic.name} Test`,
            course: courseName,
            duration: 60,
            totalQuestions: 20
          }}
          onComplete={handleTestComplete}
          onBack={() => setCurrentView('test-instructions')}
        />
      </div>
    );
  }

  // Thank you view
  if (currentView === 'test-thankyou' && selectedTopic && testStats) {
    return (
      <div className="min-h-screen bg-background">
        <TestThankYou
          test={{
            id: selectedTopic.id,
            title: `${selectedTopic.name} Test`,
            course: courseName,
            duration: 60,
            totalQuestions: 20
          }}
          answeredCount={testStats.answeredCount}
          totalQuestions={testStats.totalQuestions}
          timeSpent={testStats.timeSpent}
          onViewResults={handleViewResults}
        />
      </div>
    );
  }

  // Results view
  if (currentView === 'test-results' && selectedTopic) {
    return (
      <div className="min-h-screen bg-background">
        <TestResults
          test={{
            id: selectedTopic.id,
            title: `${selectedTopic.name} Test`,
            course: courseName,
            duration: 60,
            totalQuestions: 20,
            marks: 200,
            score: Math.floor(Math.random() * 40) + 160
          }}
          onBackToList={handleBackToContent}
          onTryAgain={handleTakeTest}
        />
      </div>
    );
  }

  // Main content rendering
  const renderVideoContent = () => {
    if (showCodeEditor) {
      // Split view with video/chat on left and code editor on right
      return (
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full overflow-y-auto pr-4">
              <div className="space-y-6">
                {selectedSubtopic && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Subtopic:</h4>
                    <h3 className="font-semibold text-lg">{selectedSubtopic.name}</h3>
                  </div>
                )}
                
                {/* Video Container */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Monitor className="h-5 w-5" />
                      <span>Video Content</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
                      <div className="text-center text-muted-foreground">
                        <Play className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">Video player will be integrated here</p>
                        <p className="text-xs">Learning: {courseName}</p>
                        {selectedSubtopic && <p className="text-xs mt-1">Topic: {selectedSubtopic.name}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Assistant Container with Chat */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <MessageCircle className="h-5 w-5" />
                      <span>AI Learning Assistant</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col h-[400px]">
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
                                className={`max-w-[70%] p-3 rounded-lg text-sm ${
                                  message.isUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
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
                      
                      <div className="p-4 border-t border-border">
                        <div className="flex space-x-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Ask me about ${courseName}...`}
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Code Practice
                </h3>
                <Button
                  onClick={() => setShowCodeEditor(false)}
                  variant="outline"
                  size="sm"
                >
                  Close Editor
                </Button>
              </div>
              <div className="flex-1 p-4">
                <CodeEditor
                  initialCode={code}
                  onCodeChange={setCode}
                  onRun={() => console.log('Running code...')}
                  showLanguageSelector={true}
                  showRunButton={true}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    // Normal view without code editor
    return (
      <div className="space-y-6">
        {selectedSubtopic && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Subtopic:</h4>
            <h3 className="font-semibold text-lg">{selectedSubtopic.name}</h3>
          </div>
        )}
        
        {/* Code Editor Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Learning Content</h2>
          <Button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Code className="h-4 w-4" />
            <span>Show Code Editor</span>
          </Button>
        </div>
        
        {/* Video Container */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Monitor className="h-5 w-5" />
              <span>Video Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-[70%] mx-auto">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
                <div className="text-center text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Video player will be integrated here</p>
                  <p className="text-xs">Learning: {courseName}</p>
                  {selectedSubtopic && <p className="text-xs mt-1">Topic: {selectedSubtopic.name}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant Container with Chat */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <MessageCircle className="h-5 w-5" />
              <span>AI Learning Assistant</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col h-[400px]">
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
                        className={`max-w-[70%] p-3 rounded-lg text-sm ${
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
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
              
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Ask me about ${courseName}...`}
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
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTextContent = () => {
    if (showCodeEditor) {
      // Split view with text/chat on left and code editor on right
      return (
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full overflow-y-auto pr-4">
              <div className="space-y-6">
                {selectedSubtopic && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Subtopic:</h4>
                    <h3 className="font-semibold text-lg">{selectedSubtopic.name}</h3>
                  </div>
                )}
                
                <ResizablePanelGroup direction="horizontal" className="min-h-[500px] rounded-lg border border-border">
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <Card className="border-0 h-full rounded-l-lg rounded-r-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                          <FileText className="h-5 w-5" />
                          <span>Study Notes</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-base">Introduction to {courseName}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Welcome to {courseName} study materials. This comprehensive guide covers all the fundamental concepts you need to master.
                            </p>
                            
                            {selectedSubtopic && (
                              <div className="mt-6 pt-4 border-t border-border">
                                <h4 className="font-semibold text-base">Current Focus: {selectedSubtopic.name}</h4>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Detailed content and exercises specific to {selectedSubtopic.name} will be displayed here.
                                </p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  <ResizablePanel defaultSize={50} minSize={30}>
                    <Card className="border-0 h-full rounded-r-lg rounded-l-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                          <MessageCircle className="h-5 w-5" />
                          <span>AI Learning Assistant</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="flex flex-col h-[400px]">
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
                                    className={`max-w-[70%] p-3 rounded-lg text-sm ${
                                      message.isUser
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
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
                          
                          <div className="p-4 border-t border-border">
                            <div className="flex space-x-2">
                              <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={`Ask me about ${courseName}...`}
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
                      </CardContent>
                    </Card>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Code Practice
                </h3>
                <Button
                  onClick={() => setShowCodeEditor(false)}
                  variant="outline"
                  size="sm"
                >
                  Close Editor
                </Button>
              </div>
              <div className="flex-1 p-4">
                <CodeEditor
                  initialCode={code}
                  onCodeChange={setCode}
                  onRun={() => console.log('Running code...')}
                  showLanguageSelector={true}
                  showRunButton={true}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    // Normal view without code editor
    return (
      <div className="space-y-6">
        {selectedSubtopic && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Subtopic:</h4>
            <h3 className="font-semibold text-lg">{selectedSubtopic.name}</h3>
          </div>
        )}
        
        {/* Code Editor Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Code className="h-4 w-4" />
            <span>Show Code Editor</span>
          </Button>
        </div>
        
        <ResizablePanelGroup direction="horizontal" className="min-h-[500px] rounded-lg border border-border">
          <ResizablePanel defaultSize={50} minSize={30}>
            <Card className="border-0 h-full rounded-l-lg rounded-r-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="h-5 w-5" />
                  <span>Study Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-base">Introduction to {courseName}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Welcome to {courseName} study materials. This comprehensive guide covers all the fundamental concepts you need to master.
                    </p>
                    
                    {selectedSubtopic && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <h4 className="font-semibold text-base">Current Focus: {selectedSubtopic.name}</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          Detailed content and exercises specific to {selectedSubtopic.name} will be displayed here.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <Card className="border-0 h-full rounded-r-lg rounded-l-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <MessageCircle className="h-5 w-5" />
                  <span>AI Learning Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col h-[400px]">
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
                            className={`max-w-[70%] p-3 rounded-lg text-sm ${
                              message.isUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
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
                  
                  <div className="p-4 border-t border-border">
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Ask me about ${courseName}...`}
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
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  };

  const renderTabContent = (tab: string) => {
    switch (tab) {
      case 'video':
        return renderVideoContent();
      case 'text':
        return renderTextContent();
      case 'practice':
        return (
          <QuizInterface 
            selectedTopicTitle={selectedSubtopic?.name || selectedTopic?.name || ''} 
            courseName={courseName}
            onFinish={handleQuizFinish}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        showMenu={true} 
        menuItems={studentNavigationConfig.getMenuItems(navigate, 'learn-certify')}
      />
      
      {/* Main Content Layout */}
      <div className="flex flex-1 min-h-0" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Unified Progress Sidebar */}
        <UnifiedProgressSidebar
          courseName={courseName}
          courseIcon={courseIcon}
          topics={topics}
          selectedTopic={selectedTopic}
          onTopicSelect={handleTopicSelect}
          subtopics={updatedSubtopics}
          selectedSubtopic={selectedSubtopic}
          onSubtopicSelect={handleSubtopicSelect}
          allCompleted={allSubtopicsCompleted && !completedTopics.has(selectedTopic?.id || '')}
          onTakeTest={handleTakeTest}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Modern Vertical Tabs Navigation */}
          <div className="bg-background border-b border-border p-6">
            <div className="flex gap-4 max-w-4xl">
              <div 
                onClick={() => handleTabChange('video')}
                className="flex-1"
              >
                <Card className={`w-full cursor-pointer transition-all hover:scale-105 ${
                  activeTab === 'video' 
                    ? 'bg-primary/10 border-primary shadow-lg' 
                    : 'bg-card hover:bg-muted/50'
                }`}>
                  <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                    <div className={`p-4 rounded-lg ${
                      activeTab === 'video' 
                        ? 'bg-primary/20' 
                        : 'bg-muted'
                    }`}>
                      <Play className={`h-6 w-6 ${
                        activeTab === 'video' 
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      activeTab === 'video' 
                        ? 'text-primary' 
                        : 'text-foreground'
                    }`}>Videos</span>
                  </CardContent>
                </Card>
              </div>

              <div 
                onClick={() => handleTabChange('text')}
                className="flex-1"
              >
                <Card className={`w-full cursor-pointer transition-all hover:scale-105 ${
                  activeTab === 'text' 
                    ? 'bg-green-500/10 border-green-500 shadow-lg' 
                    : 'bg-card hover:bg-muted/50'
                }`}>
                  <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                    <div className={`p-4 rounded-lg ${
                      activeTab === 'text' 
                        ? 'bg-green-500/20' 
                        : 'bg-muted'
                    }`}>
                      <Code2 className={`h-6 w-6 ${
                        activeTab === 'text' 
                          ? 'text-green-500' 
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      activeTab === 'text' 
                        ? 'text-green-500' 
                        : 'text-foreground'
                    }`}>Problems</span>
                  </CardContent>
                </Card>
              </div>

              <div 
                onClick={() => handleTabChange('practice')}
                className="flex-1"
              >
                <Card className={`w-full cursor-pointer transition-all hover:scale-105 ${
                  activeTab === 'practice' 
                    ? 'bg-amber-500/10 border-amber-500 shadow-lg' 
                    : 'bg-card hover:bg-muted/50'
                }`}>
                  <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                    <div className={`p-4 rounded-lg ${
                      activeTab === 'practice' 
                        ? 'bg-amber-500/20' 
                        : 'bg-muted'
                    }`}>
                      <FileText className={`h-6 w-6 ${
                        activeTab === 'practice' 
                          ? 'text-amber-500' 
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      activeTab === 'practice' 
                        ? 'text-amber-500' 
                        : 'text-foreground'
                    }`}>Quiz</span>
                  </CardContent>
                </Card>
              </div>

              <div className="flex-1">
                <Card className="w-full cursor-pointer transition-all hover:scale-105 bg-card hover:bg-muted/50 opacity-60">
                  <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                    <div className="p-4 rounded-lg bg-muted">
                      <Award className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Contest</span>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent(activeTab)}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CourseDetail;
