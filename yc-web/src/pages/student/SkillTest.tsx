import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Clock, Trophy, BookOpen, Code, CheckCircle, Play, Users, Target } from 'lucide-react';
import courseService from '../../services/courseService';
import { useToast } from '../../hooks/use-toast';
import AssessmentInterface from '../../components/student/AssessmentInterface';

interface Question {
  id: string;
  type: 'mcq' | 'coding' | 'descriptive';
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  categories: string[];
  mcq_options?: string[];
  mcq_correct_answer_index?: number;
  test_cases_basic?: Array<{
    input: string;
    expected_output: string;
    description?: string;
  }>;
  course?: string;
  topic?: string;
  subtopic?: string;
}

interface SkillTestSession {
  id: string;
  title: string;
  course: string;
  questions: Question[];
  duration: number; // in minutes
  totalMarks: number;
  totalQuestions: number;
  topicId: string;
  startTime?: Date;
  endTime?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  description?: string;
}

const SkillTest: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableTests, setAvailableTests] = useState<SkillTestSession[]>([]);
  const [selectedTest, setSelectedTest] = useState<SkillTestSession | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  const fetchAvailableTests = async () => {
    try {
      setLoading(true);

      // Fetch all courses to create skill tests for each
      const coursesResponse = await courseService.getCourses();
      const allCourses = coursesResponse || [];
      setCourses(allCourses);

      // Create skill test sessions for each course
      const skillTestSessions: SkillTestSession[] = [];

      for (const course of allCourses) {
        try {
          // Fetch skill test questions for this course
          const questionsResponse = await courseService.getQuestions({
            categories: 'skill_test',
            course: course.id
          });

          const questions: Question[] = questionsResponse || [];

          if (questions.length > 0) {
            // Limit to 15 questions and mix different types
            const selectedQuestions = selectBalancedQuestions(questions, 15);

            const skillTestSession: SkillTestSession = {
              id: `skill-test-${course.id}`,
              title: `${course.name} - Skill Assessment`,
              course: course.name,
              topicId: course.id,
              questions: selectedQuestions,
              duration: 90, // 90 minutes
              totalQuestions: selectedQuestions.length,
              totalMarks: selectedQuestions.reduce((sum: number, q: Question) => sum + q.marks, 0),
              status: 'not_started',
              description: `Comprehensive skill assessment covering ${course.name} concepts including MCQs, coding problems, and descriptive questions.`
            };
            skillTestSessions.push(skillTestSession);
          }
        } catch (error) {
          console.error(`Error fetching questions for course ${course.id}:`, error);
        }
      }

      setAvailableTests(skillTestSessions);
    } catch (error) {
      console.error('Error fetching skill tests:', error);
      toast({
        title: "Error",
        description: "Failed to load skill tests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectBalancedQuestions = (questions: Question[], maxCount: number): Question[] => {
    // Separate questions by type
    const mcqQuestions = questions.filter(q => q.type === 'mcq');
    const codingQuestions = questions.filter(q => q.type === 'coding');
    const descriptiveQuestions = questions.filter(q => q.type === 'descriptive');

    // Try to get a balanced mix: 60% MCQ, 30% Coding, 10% Descriptive
    const mcqCount = Math.min(Math.floor(maxCount * 0.6), mcqQuestions.length);
    const codingCount = Math.min(Math.floor(maxCount * 0.3), codingQuestions.length);
    const descriptiveCount = Math.min(maxCount - mcqCount - codingCount, descriptiveQuestions.length);

    const selectedQuestions = [
      ...mcqQuestions.slice(0, mcqCount),
      ...codingQuestions.slice(0, codingCount),
      ...descriptiveQuestions.slice(0, descriptiveCount)
    ];

    // Shuffle the questions
    return selectedQuestions.sort(() => Math.random() - 0.5);
  };

  const startTest = (test: SkillTestSession) => {
    setSelectedTest({
      ...test,
      startTime: new Date(),
      status: 'in_progress'
    });
    setTestStarted(true);
  };

  const handleTestComplete = (stats?: { answeredCount: number; totalQuestions: number; timeSpent: number }) => {
    if (stats) {
      toast({
        title: "Test Completed!",
        description: `You answered ${stats.answeredCount} out of ${stats.totalQuestions} questions in ${Math.floor(stats.timeSpent / 60)} minutes.`,
      });
    }

    // Reset state
    setSelectedTest(null);
    setTestStarted(false);

    // Refresh available tests
    fetchAvailableTests();
  };

  const handleBackToTests = () => {
    setSelectedTest(null);
    setTestStarted(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq': return <Target className="w-4 h-4" />;
      case 'coding': return <Code className="w-4 h-4" />;
      case 'descriptive': return <BookOpen className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading skill tests...</div>
          </div>
        </div>
      </div>
    );
  }

  if (testStarted && selectedTest) {
    return (
      <AssessmentInterface
        assessment={{
          id: selectedTest.id,
          title: selectedTest.title,
          course: selectedTest.course,
          duration: selectedTest.duration,
          totalQuestions: selectedTest.totalQuestions,
          topicId: selectedTest.topicId
        }}
        onComplete={handleTestComplete}
        onBack={handleBackToTests}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Skill Tests</h1>
            <p className="text-lg text-gray-600">
              Test your programming skills with our comprehensive skill assessments
            </p>
          </div>

          {availableTests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Skill Tests Available</h3>
                <p className="text-gray-600">
                  There are currently no skill tests available. Skill tests are automatically generated based on course content.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Please check back later or contact your instructor to add skill test questions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {availableTests.map((test) => (
                <Card key={test.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">{test.title}</CardTitle>
                        <p className="text-gray-600 text-sm">{test.description}</p>
                      </div>
                      <Badge variant="secondary" className="ml-4">
                        {test.status === 'completed' ? 'Completed' : 'Available'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="font-medium">{test.duration} min</div>
                          <div className="text-xs text-gray-500">Duration</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <div>
                          <div className="font-medium">{test.totalMarks}</div>
                          <div className="text-xs text-gray-500">Total Marks</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-medium">{test.totalQuestions}</div>
                          <div className="text-xs text-gray-500">Questions</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-500" />
                        <div>
                          <div className="font-medium">{test.course}</div>
                          <div className="text-xs text-gray-500">Course</div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Question Breakdown:</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {['mcq', 'coding', 'descriptive'].map(type => {
                          const count = test.questions.filter(q => q.type === type).length;
                          const percentage = test.questions.length > 0 ? Math.round((count / test.questions.length) * 100) : 0;
                          return (
                            <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-center mb-2">
                                {getTypeIcon(type)}
                                <span className="ml-2 font-medium capitalize">{type}</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-600">{count}</div>
                              <div className="text-xs text-gray-500">{percentage}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Difficulty Distribution:</h4>
                      <div className="flex gap-2 flex-wrap">
                        {['easy', 'medium', 'hard'].map(difficulty => {
                          const count = test.questions.filter(q => q.difficulty === difficulty).length;
                          if (count === 0) return null;
                          return (
                            <Badge key={difficulty} className={getDifficultyColor(difficulty)}>
                              {difficulty}: {count}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• Comprehensive assessment covering {test.course}</p>
                        <p>• Mix of theoretical and practical questions</p>
                        <p>• Auto-submit when time expires</p>
                        <p>• Proctored environment with monitoring</p>
                      </div>
                      <Button
                        onClick={() => startTest(test)}
                        disabled={test.status === 'completed'}
                        className="ml-4 bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        {test.status === 'completed' ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start Assessment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillTest;