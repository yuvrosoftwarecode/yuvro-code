import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import courseService, { Course } from '../../services/courseService';

interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface Test {
  id: number;
  title: string;
  description: string;
  duration: number;
  questions: TestQuestion[];
  category: string;
}

const SAMPLE_TESTS: Test[] = [
  {
    id: 1,
    title: 'JavaScript Fundamentals',
    description: 'Test your knowledge of JavaScript basics including variables, functions, and objects.',
    duration: 30,
    category: 'Programming',
    questions: [
      {
        id: 1,
        question: 'What is the correct way to declare a variable in JavaScript?',
        options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
        correct_answer: 0,
        difficulty: 'easy',
        category: 'JavaScript'
      }
    ]
  },
  {
    id: 2,
    title: 'Python Data Structures',
    description: 'Assess your understanding of Python lists, dictionaries, and sets.',
    duration: 45,
    category: 'Programming',
    questions: []
  },
  {
    id: 3,
    title: 'Web Development Basics',
    description: 'Test your HTML, CSS, and basic web development knowledge.',
    duration: 25,
    category: 'Web Development',
    questions: []
  }
];

const SkillTest: React.FC = () => {
  const { user } = useAuth();
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState(0);
  
  // Course-related state
  const [view, setView] = useState<'courses' | 'tests' | 'test'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0 && testStarted) {
      completeTest();
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, testStarted, testCompleted]);

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const courseList = await courseService.getCourses();
      setCourses(courseList);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const startTest = (test: Test) => {
    setSelectedTest(test);
    setTestStarted(true);
    setTimeRemaining(test.duration * 60); // Convert minutes to seconds
    setCurrentQuestion(0);
    setAnswers({});
    setTestCompleted(false);
  };

  const selectAnswer = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (selectedTest && currentQuestion < selectedTest.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeTest = () => {
    if (!selectedTest) return;

    let correctAnswers = 0;
    selectedTest.questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / selectedTest.questions.length) * 100);
    setScore(finalScore);
    setTestCompleted(true);
    setTestStarted(false);
  };

  const resetTest = () => {
    setSelectedTest(null);
    setTestStarted(false);
    setTestCompleted(false);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeRemaining(0);
    setScore(0);
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

  if (testCompleted) {
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h2>
              <p className="text-gray-600">You have successfully completed the {selectedTest?.title} test.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{score}%</div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.keys(answers).length}/{selectedTest?.questions.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Questions Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.floor(((selectedTest?.duration || 0) * 60 - timeRemaining) / 60)}m
                  </div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={resetTest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Take Another Test
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium"
              >
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testStarted && selectedTest) {
    const currentQ = selectedTest.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedTest.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Test Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{selectedTest.title}</h1>
              <div className="flex items-center space-x-4">
                <div className="text-lg font-semibold text-red-600">
                  {formatTime(timeRemaining)}
                </div>
                <button
                  onClick={completeTest}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Submit Test
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
              Question {currentQuestion + 1} of {selectedTest.questions.length}
            </div>
          </div>

          {/* Question */}
          {currentQ && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${getDifficultyColor(currentQ.difficulty)}
                  `}>
                    {currentQ.difficulty}
                  </span>
                  <span className="text-sm text-gray-500">{currentQ.category}</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQ.question}</h2>
              </div>

              <div className="space-y-3 mb-8">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(currentQ.id, index)}
                    className={`
                      w-full text-left p-4 rounded-lg border transition-colors
                      ${answers[currentQ.id] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <div className={`
                        w-4 h-4 rounded-full border-2 mr-3
                        ${answers[currentQ.id] === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                        }
                      `}>
                        {answers[currentQ.id] === index && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                      <span className="text-gray-900">{option}</span>
                    </div>
                  </button>
                ))}
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
                  disabled={currentQuestion === selectedTest.questions.length - 1}
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
          <h1 className="text-3xl font-bold text-gray-900">Skill Tests</h1>
          <p className="text-gray-600 mt-2">Test your knowledge and earn certifications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_TESTS.map((test) => (
            <div key={test.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{test.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{test.description}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {test.duration} minutes
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {test.questions.length} questions
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{test.category}</span>
                <button
                  onClick={() => startTest(test)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Start Test
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillTest;