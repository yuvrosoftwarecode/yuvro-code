import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/common/Navigation';
import CourseDashboard from '@/components/student/code-practice/CourseDashboard';
import TopicSelection from '@/components/student/code-practice/TopicSelection';
import ProblemSolving from '@/components/student/code-practice/ProblemSolving';
import ScoreAnalytics from '@/components/student/code-practice/ScoreAnalytics';
import AIInsights from '@/components/student/code-practice/AIInsights';

export type ViewType = 'dashboard' | 'topics' | 'problem' | 'analytics' | 'insights';

export interface Course {
  id: string;
  name: string;
  icon: string;
  progress: number;
  totalProblems: number;
  solvedProblems: number;
  iconColor?: string;
  category: string;
}

export interface Topic {
  id: string;
  name: string;
  problemCount: number;
  order_index: number;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  score: number;
  description: string;
  test_cases_basic: Array<{
    input_data: string;
    expected_output: string;
    weight?: number;
  }>;
  test_cases_advanced: Array<{
    input_data: string;
    expected_output: string;
    weight?: number;
  }>;
}

const CodePractice = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('topics');
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleProblemSelect = (problem: CodingProblem) => {
    setSelectedProblem(problem);
    setCurrentView('problem');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedCourse(null);
    setSelectedTopic(null);
    setSelectedProblem(null);
  };

  const handleBackToTopics = () => {
    setCurrentView('topics');
    setSelectedProblem(null);
  };

  const handleViewAnalytics = () => {
    setCurrentView('analytics');
  };

  const handleViewInsights = () => {
    setCurrentView('insights');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="transition-all duration-300 ease-in-out">
        {currentView === 'dashboard' && (
          <CourseDashboard
            onCourseSelect={handleCourseSelect}
            onViewAnalytics={handleViewAnalytics}
          />
        )}

        {currentView === 'topics' && selectedCourse && (
          <TopicSelection
            course={selectedCourse}
            selectedTopic={selectedTopic}
            onTopicSelect={handleTopicSelect}
            onProblemSelect={handleProblemSelect}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === 'problem' && selectedProblem && selectedCourse && selectedTopic && (
          <ProblemSolving
            problem={selectedProblem}
            course={selectedCourse}
            topic={selectedTopic}
            onBack={handleBackToTopics}
            onViewAnalytics={handleViewAnalytics}
          />
        )}

        {currentView === 'analytics' && (
          <ScoreAnalytics
            onBack={handleBackToDashboard}
            onViewInsights={handleViewInsights}
          />
        )}

        {currentView === 'insights' && (
          <AIInsights
            onBack={() => setCurrentView('analytics')}
            onGeneratePracticeSet={() => setCurrentView('topics')}
          />
        )}
      </div>
    </div>
  );
};

export default CodePractice;