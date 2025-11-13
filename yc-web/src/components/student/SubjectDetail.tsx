import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/common/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Play, FileText, Code2, Code, MessageCircle, Monitor, Send, Bot, User, Award, Trophy } from 'lucide-react';
import CustomContentSidebar from './CustomContentSidebar';
import CodeEditor from '@/components/ui/code-editor';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const SubjectDetail = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('video');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>('');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [code, setCode] = useState('');
  
  const subjectNames: Record<string, string> = {
    'python': 'Python',
    'data-structures': 'Data Structures',
    'javascript': 'JavaScript',
    'sql': 'SQL',
  };

  const subjectName = subjectNames[subjectId as string] || 'Subject';
  
  const [chatMessages, setChatMessages] = useState<Array<{id: number, text: string, isUser: boolean}>>([
    { id: 1, text: `Hello! I'm your AI learning assistant for ${subjectName}. How can I help you today?`, isUser: false }
  ]);
  const [newMessage, setNewMessage] = useState('');
  


  const handleBackClick = () => {
    navigate('/student/dashboard', { state: { activeMenu: 'notes' } });
  };

  const menuItems = [
    { label: 'Dashboard', onClick: () => navigate('/student/dashboard') },
    { label: 'Test', onClick: () => navigate('/student/test') },
    { label: 'Task', onClick: () => navigate('/student/task') },
    { label: 'Assessment', onClick: () => navigate('/student/dashboard', { state: { activeMenu: 'assessment' } }) },
    { label: 'Mock Interview', onClick: () => navigate('/student/dashboard', { state: { activeMenu: 'mock-interview' } }) },
    { 
      label: 'Notes', 
      onClick: () => navigate('/student/dashboard', { state: { activeMenu: 'notes' } }),
      active: true 
    },
  ];

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const handleTopicSelect = (topicId: string, title: string) => {
    setSelectedTopic(topicId);
    setSelectedTopicTitle(title);
  };

  const handleBackToNotes = () => {
    navigate('/student/dashboard', { state: { activeMenu: 'notes' } });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage = { id: Date.now(), text: newMessage, isUser: true };
      const aiResponse = { 
        id: Date.now() + 1, 
        text: `I understand you're asking about "${newMessage}". Let me help you with that concept in ${subjectName}.`, 
        isUser: false 
      };
      
      setChatMessages(prev => [...prev, userMessage, aiResponse]);
      setNewMessage('');
    }
  };

  const renderVideoContent = () => {
    const topicContent = selectedTopic && selectedTopicTitle ? (
      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">Selected Topic:</h4>
        <h3 className="font-semibold text-lg">{selectedTopicTitle}</h3>
      </div>
    ) : null;

    return (
      <div className="space-y-6">
        {topicContent}
        
        {/* Code Editor Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Learning Content</h2>
          <Button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Code className="h-4 w-4" />
            <span>{showCodeEditor ? 'Hide Code Editor' : 'Show Code Editor'}</span>
          </Button>
        </div>
        
        {/* Video Container - 30% smaller */}
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
                  <p className="text-xs">Learning: {subjectName}</p>
                  {selectedTopicTitle && <p className="text-xs mt-1">Topic: {selectedTopicTitle}</p>}
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
              
              {/* Chat Input */}
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Ask me about ${subjectName}...`}
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
                {selectedTopicTitle && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Currently focused on: {selectedTopicTitle}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTextContent = () => {
    const topicContent = selectedTopic && selectedTopicTitle ? (
      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">Selected Topic:</h4>
        <h3 className="font-semibold text-lg">{selectedTopicTitle}</h3>
      </div>
    ) : null;

    return (
      <div className="space-y-6">
        {topicContent}
        
        {/* Code Editor Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Study Materials</h2>
          <Button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Code className="h-4 w-4" />
            <span>{showCodeEditor ? 'Hide Code Editor' : 'Show Code Editor'}</span>
          </Button>
        </div>

        {/* Side by Side Resizable Layout */}
        <ResizablePanelGroup direction="horizontal" className="min-h-[500px] rounded-lg border border-border">
          {/* Notes Container */}
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
                    <h4 className="font-semibold text-base">Introduction to {subjectName}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Welcome to {subjectName} study materials. This comprehensive guide covers all the fundamental concepts you need to master.
                    </p>
                    
                    <h4 className="font-semibold text-base pt-4">Key Concepts</h4>
                    <ul className="text-sm text-muted-foreground space-y-2 pl-4">
                      <li>• Core principles and foundations</li>
                      <li>• Best practices and methodologies</li>
                      <li>• Practical applications and examples</li>
                      <li>• Advanced techniques and patterns</li>
                    </ul>

                    <h4 className="font-semibold text-base pt-4">Learning Objectives</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      By completing this course, you will have a solid understanding of {subjectName} fundamentals, 
                      be able to implement basic to intermediate concepts, and develop practical skills for real-world applications.
                    </p>

                    {selectedTopicTitle && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <h4 className="font-semibold text-base">Topic Focus: {selectedTopicTitle}</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          Detailed content and exercises specific to {selectedTopicTitle} will be displayed here.
                          This includes step-by-step explanations, code examples, and practice problems.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* AI Assistant Container with Chat */}
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
                  
                  {/* Chat Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Ask me about ${subjectName}...`}
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
                    {selectedTopicTitle && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Currently focused on: {selectedTopicTitle}
                      </p>
                    )}
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
    const topicContent = selectedTopic && selectedTopicTitle ? (
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">Selected Topic:</h4>
        <h3 className="font-semibold text-lg">{selectedTopicTitle}</h3>
      </div>
    ) : null;

    switch (tab) {
      case 'video':
        return renderVideoContent();
      case 'text':
        return renderTextContent();
      case 'practice':
        return (
          <div className="space-y-4">
            {topicContent}
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Code2 className="h-5 w-5" />
              <span>Practice exercises for {subjectName}</span>
            </div>
            <p className="text-foreground">
              Interactive coding exercises, quizzes, and hands-on practice problems 
              will be available in this section. Test your knowledge and improve your 
              {subjectName} skills through practical exercises.
              {selectedTopicTitle && ` Currently showing content for: ${selectedTopicTitle}`}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        showMenu={true} 
        menuItems={menuItems}
      />
      
      {/* Main Content Layout */}
      <div className="flex flex-1 min-h-0" style={{ height: 'calc(100vh - 64px)' }}>
        {!showCodeEditor ? (
          // Normal Layout - Sidebar + Content
          <>
            <CustomContentSidebar
              subjectName={subjectName}
              onTopicSelect={handleTopicSelect}
              selectedTopic={selectedTopic}
              onBackToNotes={handleBackToNotes}
            />
            
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
              <div className="flex-1 overflow-auto">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full">
                  <TabsContent value="video" className="h-full p-6 space-y-4 m-0">
                    {renderTabContent('video')}
                  </TabsContent>
                  
                  <TabsContent value="text" className="h-full p-6 space-y-4 m-0">
                    {renderTabContent('text')}
                  </TabsContent>
                  
                  <TabsContent value="practice" className="h-full p-6 space-y-4 m-0">
                    {renderTabContent('practice')}
                  </TabsContent>
                </Tabs>
              </div>
            </main>
          </>
        ) : (
          // Code Editor Mode - Resizable Layout
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Content + AI Assistant Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col">
                {/* Close Code Editor Button */}
                <div className="p-4 border-b border-border">
                  <Button
                    onClick={() => setShowCodeEditor(false)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Normal View</span>
                  </Button>
                </div>
                
                {/* Content based on active tab */}
                <div className="flex-1 overflow-auto p-4">
                  {activeTab === 'video' && renderVideoContent()}
                  {activeTab === 'text' && renderTextContent()}
                  {activeTab === 'practice' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Code2 className="h-5 w-5" />
                        <span>Practice exercises for {subjectName}</span>
                      </div>
                      <p className="text-foreground">
                        Interactive coding exercises, quizzes, and hands-on practice problems 
                        will be available in this section. Test your knowledge and improve your 
                        {subjectName} skills through practical exercises.
                        {selectedTopicTitle && ` Currently showing content for: ${selectedTopicTitle}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Code Editor Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full p-4">
                <CodeEditor
                  initialCode={code}
                  language="python"
                  onCodeChange={(newCode) => setCode(newCode)}
                  onRun={(code) => console.log('Running code:', code)}
                  showLanguageSelector={true}
                  showRunButton={true}
                  showCopyButton={true}
                  showResetButton={true}
                  showFullscreenToggle={false}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
};

export default SubjectDetail;