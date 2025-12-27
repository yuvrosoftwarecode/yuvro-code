import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, RotateCcw, LogOut, User, Bot, Code } from 'lucide-react';
import CodeEditor from '@/components/code-editor/CodeEditor';
import { mockInterviewService } from '@/services/mockInterviewService';
import { aiAssistantService } from '@/services/aiAssistantService';

interface Role {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  interviewer_name?: string;
  interviewer_voice_id?: string;
  voice_speed?: number;
}

interface InterviewScreenProps {
  role: Role;
  difficulty: string;
  duration: string;
  interviewer: string;
  mediaStream: MediaStream;
  resume?: File;
  onExit: () => void;
  onInterviewComplete: (role: Role, difficulty: string, duration: string) => void;
}

interface Message {
  type: 'ai' | 'user';
  content: string;
  timestamp: string;
  questionType?: 'behavioral' | 'coding';
  codeSubmission?: string;
}

const InterviewScreen: React.FC<InterviewScreenProps> = ({
  role,
  difficulty,
  duration,
  interviewer,
  mediaStream,
  resume,
  onExit,
  onInterviewComplete
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentUserAnswer, setCurrentUserAnswer] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Real API State
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentCode, setCurrentCode] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Helper function to speak text
  const speakText = (text: string) => {
    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    speechRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    const targetVoiceName = role.interviewer_voice_id;

    if (targetVoiceName) {
      selectedVoice = voices.find(voice => voice.name === targetVoiceName);
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.name.includes(targetVoiceName));
      }
    }

    // Fallback logic
    if (!selectedVoice) {
      if (interviewer === 'Junnu') {
        // IN Male preference
        selectedVoice = voices.find(voice => voice.name.includes("Microsoft Ravi")) ||
          voices.find(voice => voice.lang === "en-IN" && voice.name.toLowerCase().includes("male")) ||
          voices.find(voice => voice.name.includes("Male") && (voice.lang.includes("en-IN") || voice.name.includes("India"))) ||
          voices.find(voice => voice.name.includes("Google UK English Male"));
      } else {
        // Munnu (Default) - US Female preference
        selectedVoice = voices.find(voice => voice.name.includes("Google US English")) ||
          voices.find(voice => voice.name.includes("Microsoft Zira")) ||
          voices.find(voice => voice.lang === "en-US" && !voice.name.toLowerCase().includes("male"));
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = role.voice_speed || 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  };

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    }
  }, []);

  // Convert duration to seconds
  const getDurationInSeconds = (durationStr: string): number => {
    const match = durationStr.match(/(\d+)\s*mins?/i);
    return match ? parseInt(match[1]) * 60 : 300;
  };

  // Initialize Interview & Timer
  useEffect(() => {
    const seconds = getDurationInSeconds(duration);
    setTimeLeft(seconds);

    const initInterview = async () => {
      try {
        setIsAITyping(true);
        // Start Interview API
        const response = await mockInterviewService.startInterview(
          role.id,
          difficulty,
          getDurationInSeconds(duration) / 60,
          resume
        );

        if (response.chat_session_id) {
          setChatSessionId(response.chat_session_id);

          // Send initial Trigger to AI to start the conversation
          // Using a hidden system instruction disguised as user prompt or just a prompt
          const initialPrompt = "The interview is starting now. Please introduce yourself and ask the first question.";
          const aiResponse = await aiAssistantService.sendMessage(response.chat_session_id, initialPrompt);

          const aiText = aiResponse.response;
          setConversation([{
            type: 'ai',
            content: aiText,
            timestamp: new Date().toLocaleTimeString(),
            questionType: 'behavioral' // Default
          }]);

          speakText(aiText);

          // Check if coding question (heuristic: contains "code" or "function")
          if (aiText.toLowerCase().includes("code") || aiText.toLowerCase().includes("function")) {
            setShowCodeEditor(true);
          } else {
            setShowCodeEditor(false);
          }
        }
        setIsAITyping(false);
      } catch (error) {
        console.error("Failed to start interview", error);
        setIsAITyping(false);
        // Handle error (alert or exit)
      }
    };

    initInterview();
  }, [role.id, difficulty, duration]); // dependency on role vars

  const handleEndInterview = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    window.speechSynthesis.cancel();
    onExit();
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Video feed
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented
          // Show a UI element to let the user manually start playback
          console.log("Video playback failed", error);
        });
      }
    }
  }, [mediaStream]);

  // Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        setCurrentUserAnswer(prev => {
          const base = prev.split(" [interim]")[0]; // remove previous interim
          return base + finalTranscript + (interimTranscript ? ` [interim]${interimTranscript}` : '');
        });
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          try { recognitionRef.current?.start(); } catch (e) { }
        }
      };
    }
    return () => {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }
    }
  }, [isRecording]);

  // Auto scroll
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isUserTyping, isAITyping]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = async () => {
    if (!chatSessionId) {
      alert("Interview not initialized yet.");
      return;
    }

    if (!isRecording) {
      window.speechSynthesis.cancel();
      setIsRecording(true);
      setIsUserTyping(true);
      setCurrentUserAnswer('');
      if (recognitionRef.current) try { recognitionRef.current.start(); } catch (e) { }
    } else {
      setIsRecording(false);
      setIsUserTyping(false);
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }

      // Clean Answer
      let cleanAnswer = currentUserAnswer.replace(/ \[interim\].*$/, '').trim();
      if (!cleanAnswer && showCodeEditor && currentCode) {
        cleanAnswer = "I have written the code in the editor.";
      }

      const combinedAnswer = cleanAnswer + (showCodeEditor && currentCode ? `\n\n[Code Submission]:\n${currentCode}` : "");

      const userMessage: Message = {
        type: 'user',
        content: cleanAnswer || "(No verbal answer)",
        timestamp: new Date().toLocaleTimeString(),
        codeSubmission: showCodeEditor ? currentCode : undefined
      };
      setConversation(prev => [...prev, userMessage]);
      setCurrentUserAnswer('');
      setCurrentCode('');

      // Send to AI
      setIsAITyping(true);
      try {
        const aiResp = await aiAssistantService.sendMessage(chatSessionId, combinedAnswer);
        const aiText = aiResp.response;

        const aiMessage: Message = {
          type: 'ai',
          content: aiText,
          timestamp: new Date().toLocaleTimeString(),
          questionType: 'behavioral' // In full AI, we deduce type or assume behavioral/mixed
        };
        setConversation(prev => [...prev, aiMessage]);
        speakText(aiText);

        // Heuristic for coding
        if (aiText.toLowerCase().includes("code") || aiText.toLowerCase().includes("function") || aiText.toLowerCase().includes("program")) {
          // Only switch if it explicitly looks like a coding request and we aren't already there? 
          // Or allow toggling.
          if (!showCodeEditor) setShowCodeEditor(true);
        }
      } catch (err) {
        console.error("AI Error", err);
      } finally {
        setIsAITyping(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute bottom-0 right-0 p-0.5 bg-black/50 text-[8px] text-white">You</div>
            </div>
            <div>
              <h1 className="text-xl font-semibold">Mock Interview - {role.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{difficulty}</Badge>
                <Badge variant="outline">{interviewer}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-lg font-mono">
              {formatTime(timeLeft)}
            </div>
            <Button variant="destructive" onClick={handleEndInterview}>
              <LogOut className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Conversation */}
        <div className={`flex flex-col bg-card m-4 rounded-lg border transition-all duration-300 ${showCodeEditor ? 'w-1/2' : 'flex-1 w-full'}`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Interview Conversation</h2>
              <Button variant="ghost" size="sm" onClick={() => speakText(conversation.length > 0 ? conversation[conversation.length - 1].content : "")}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${message.type === 'ai'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {message.type === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    <span className="text-xs opacity-70">
                      {message.type === 'ai' ? 'AI Interviewer' : 'You'} • {message.timestamp}
                    </span>
                  </div>
                  <p className="text-sm user-select-text whitespace-pre-wrap">{message.content}</p>

                  {message.codeSubmission && (
                    <div className="mt-2 p-2 bg-black/10 rounded border text-xs font-mono overflow-x-auto">
                      {message.codeSubmission.substring(0, 100)}...
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicators */}
            {isUserTyping && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg p-3 bg-primary text-primary-foreground">
                  <User className="h-4 w-4 mb-1" />
                  <div className="text-sm">
                    {currentUserAnswer.split(" [interim]")[0] || "Listening..."}
                    <span className="opacity-50">{currentUserAnswer.includes("[interim]") ? currentUserAnswer.split("[interim]")[1] : ""}</span>
                  </div>
                </div>
              </div>
            )}

            {isAITyping && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span className="animate-pulse">AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={conversationEndRef} />
          </div>

          <div className="p-4 border-t">
            <Button
              onClick={handleToggleRecording}
              className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
              size="lg"
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop & Submit Answer
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Answer
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        {showCodeEditor && (
          <div className="w-1/2 m-4 ml-0 flex flex-col bg-card rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
              <h4 className="font-semibold flex items-center">
                <Code className="h-4 w-4 mr-2" />
                Code Editor
              </h4>
              <Badge variant="outline">javascript</Badge>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                initialCode={currentCode}
                initialLanguage={'javascript'}
                onCodeChange={setCurrentCode}
                className="h-full"
                showFullscreenButton={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewScreen;