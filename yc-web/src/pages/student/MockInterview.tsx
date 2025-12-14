import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/common/Navigation';

interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'technical' | 'behavioral' | 'coding';
}

interface MockInterview {
  id: number;
  title: string;
  description: string;
  duration: number;
  questions: InterviewQuestion[];
  category: string;
}

const SAMPLE_INTERVIEWS: MockInterview[] = [
  {
    id: 1,
    title: 'Frontend Developer Interview',
    description: 'Practice common frontend development interview questions including React, JavaScript, and CSS.',
    duration: 45,
    category: 'Frontend',
    questions: [
      {
        id: 1,
        question: 'Explain the difference between let, const, and var in JavaScript.',
        category: 'JavaScript',
        difficulty: 'medium',
        type: 'technical'
      },
      {
        id: 2,
        question: 'Tell me about a challenging project you worked on and how you overcame the difficulties.',
        category: 'General',
        difficulty: 'medium',
        type: 'behavioral'
      },
      {
        id: 3,
        question: 'Write a function to reverse a string without using built-in methods.',
        category: 'Coding',
        difficulty: 'easy',
        type: 'coding'
      }
    ]
  },
  {
    id: 2,
    title: 'Backend Developer Interview',
    description: 'Practice backend development questions covering APIs, databases, and system design.',
    duration: 60,
    category: 'Backend',
    questions: []
  },
  {
    id: 3,
    title: 'Full Stack Developer Interview',
    description: 'Comprehensive interview covering both frontend and backend technologies.',
    duration: 90,
    category: 'Full Stack',
    questions: []
  }
];

const MockInterview: React.FC = () => {
  const { user } = useAuth();
  const [selectedInterview, setSelectedInterview] = useState<MockInterview | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (interviewStarted && timeRemaining > 0 && !interviewCompleted) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0 && interviewStarted) {
      completeInterview();
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, interviewStarted, interviewCompleted]);

  const startInterview = (interview: MockInterview) => {
    setSelectedInterview(interview);
    setInterviewStarted(true);
    setTimeRemaining(interview.duration * 60);
    setCurrentQuestion(0);
    setAnswers({});
    setInterviewCompleted(false);
  };

  const nextQuestion = () => {
    if (selectedInterview && currentQuestion < selectedInterview.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const saveAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const completeInterview = () => {
    setInterviewCompleted(true);
    setInterviewStarted(false);
    setIsRecording(false);
  };

  const resetInterview = () => {
    setSelectedInterview(null);
    setInterviewStarted(false);
    setInterviewCompleted(false);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeRemaining(0);
    setIsRecording(false);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'text-blue-600 bg-blue-100';
      case 'behavioral': return 'text-purple-600 bg-purple-100';
      case 'coding': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (interviewCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Interview Completed!</h2>
              <p className="text-gray-600">You have successfully completed the {selectedInterview?.title} mock interview.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(answers).length}/{selectedInterview?.questions.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Questions Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.floor(((selectedInterview?.duration || 0) * 60 - timeRemaining) / 60)}m
                  </div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </div>
              </div>
            </div>

            <div className="text-left mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Feedback</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Great job completing the mock interview! Here are some tips for improvement:
                </p>
                <ul className="list-disc list-inside text-blue-700 text-sm mt-2 space-y-1">
                  <li>Practice explaining technical concepts in simple terms</li>
                  <li>Prepare specific examples for behavioral questions</li>
                  <li>Work on coding problems under time pressure</li>
                  <li>Practice speaking clearly and confidently</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={resetInterview}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Take Another Interview
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium"
              >
                Save Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (interviewStarted && selectedInterview) {
    const currentQ = selectedInterview.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedInterview.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Interview Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{selectedInterview.title}</h1>
              <div className="flex items-center space-x-4">
                <div className="text-lg font-semibold text-blue-600">
                  {formatTime(timeRemaining)}
                </div>
                <button
                  onClick={toggleRecording}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2
                    ${isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }
                  `}
                >
                  <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></div>
                  <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                </button>
                <button
                  onClick={completeInterview}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  End Interview
                </button>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {selectedInterview.questions.length}
            </div>
          </div>

          {/* Question */}
          {currentQ && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${getDifficultyColor(currentQ.difficulty)}
                  `}>
                    {currentQ.difficulty}
                  </span>
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${getTypeColor(currentQ.type)}
                  `}>
                    {currentQ.type}
                  </span>
                  <span className="text-sm text-gray-500">{currentQ.category}</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQ.question}</h2>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer:
                </label>
                <textarea
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => saveAnswer(currentQ.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="text-xs text-gray-500 mt-2">
                  Tip: Speak your answer out loud as you type to practice your verbal communication.
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestion === 0}
                  className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-6 py-2 rounded-lg font-medium"
                >
                  Previous
                </button>
                <button
                  onClick={nextQuestion}
                  disabled={currentQuestion === selectedInterview.questions.length - 1}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mock Interviews</h1>
          <p className="text-gray-600 mt-2">Practice interview questions and improve your communication skills</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_INTERVIEWS.map((interview) => (
            <div key={interview.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{interview.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{interview.description}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {interview.duration} minutes
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 3.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM4 13a1 1 0 011-1v-1a1 1 0 011-1V9a1 1 0 011-1V6a1 1 0 011-1V3a1 1 0 011-1h3a1 1 0 011 1v2a1 1 0 011 1v1a1 1 0 011 1v1a1 1 0 011 1v1a1 1 0 01-1 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                  {interview.questions.length} questions
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{interview.category}</span>
                <button
                  onClick={() => startInterview(interview)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Start Interview
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Before the Interview</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Research the company and role</li>
                <li>• Prepare specific examples using STAR method</li>
                <li>• Practice common technical questions</li>
                <li>• Test your audio/video setup</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">During the Interview</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Speak clearly and at a moderate pace</li>
                <li>• Ask clarifying questions when needed</li>
                <li>• Think out loud during coding problems</li>
                <li>• Show enthusiasm and ask questions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockInterview;