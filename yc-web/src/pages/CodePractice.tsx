import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import CourseDashboard from "@/components/codepractice/CourseDashboard";
import TopicSelection from "@/components/codepractice/TopicSelection";
import ProblemSolving from "@/components/codepractice/ProblemSolving";

export interface Course {
  id: string;
  name: string;
  category?: string;
  short_code?: string;
  icon?: string;
  progress?: number;
  totalProblems?: number;
  solvedProblems?: number;
  iconColor?: string;
}

export interface Topic {
  id: string;
  name: string;
  problemCount?: number;
  subtopics?: any[];
}

export interface Problem {
  id: string;
  title: string;
  difficulty: string;
  score: number;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  testCases: {
    input: string;
    expectedOutput: string;
  }[];
}

const CodePractice: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<any | null>(null);
  const [view, setView] = useState<
    "dashboard" | "topics" | "problem-solving"
  >("dashboard");

  // ✅ Called when a user selects a course from CourseDashboard
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setView("topics");
  };

  // ✅ Called when a topic is selected from TopicSelection
  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  // ✅ Called when a subtopic (problem) is selected for solving
  const handleProblemSelect = (subtopic: any) => {
    setSelectedSubtopic(subtopic);
    setView("problem-solving");
  };

  // ✅ Called when user presses "Back"
  const handleBack = () => {
    if (view === "problem-solving") {
      setView("topics");
      setSelectedSubtopic(null);
    } else if (view === "topics") {
      setView("dashboard");
      setSelectedTopic(null);
      setSelectedCourse(null);
    }
  };

  const handleViewAnalytics = () => {
    alert("Analytics feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {view === "dashboard" && (
          <CourseDashboard
            onCourseSelect={handleCourseSelect}
            onViewAnalytics={handleViewAnalytics}
          />
        )}

        {view === "topics" && selectedCourse && (
          <TopicSelection
            course={selectedCourse}
            selectedTopic={selectedTopic}
            onTopicSelect={handleTopicSelect}
            onProblemSelect={handleProblemSelect}
            onBack={handleBack}
          />
        )}

        {view === "problem-solving" &&
          selectedCourse &&
          selectedTopic &&
          selectedSubtopic && (
            <ProblemSolving
              course={selectedCourse}
              topic={selectedTopic}
              subtopic={selectedSubtopic}
              onBack={handleBack}
              onViewAnalytics={handleViewAnalytics}
            />
          )}
      </div>
    </div>
  );
};

export default CodePractice;