// src/pages/student/SkillTest.tsx
import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";

import CourseSelection from "@/components/student/skill-test/CourseSelection";
import TopicSidebar from "@/components/student/skill-test/TopicSidebar";
import TestCards from "@/components/student/skill-test/TestCards";
import TestInstructions from "@/components/student/skill-test/TestInstructions";
import TestThankYou from "@/components/student/skill-test/TestThankYou";
import TestResults from "@/components/student/skill-test/TestResults";
import AssessmentInterface from "@/components/student/AssessmentInterface";

import {
  fetchCourses,
  fetchTopicsByCourse,
} from "@/services/courseService";
import { fetchQuestions } from "@/services/questionService";
import { toast } from "sonner";

// -------------------- Types for this page --------------------

export interface Topic {
  id: string;
  name: string;
  // Progress-related fields (not yet calculated, kept for UI compatibility)
  progress: number;
  completed: boolean;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  topics: Topic[];
}

export interface Test {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: number;
  duration: number; // minutes
  topicId: string;
}

// Stats reported by AssessmentInterface when test completes
interface TestStats {
  answeredCount: number;
  totalQuestions: number;
  timeSpent: number; // seconds
}

type View =
  | "courses"
  | "tests"
  | "instructions"
  | "test"
  | "thankyou"
  | "results";

const ICONS = ["🧠", "🗂️", "⚙️", "🐍", "⚡", "⚛️", "📘", "💻"];
const COLORS = [
  "blue",
  "green",
  "orange",
  "yellow",
  "purple",
  "cyan",
  "pink",
  "indigo",
];

const SkillTest: React.FC = () => {
  // -------------------- State --------------------

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<View>("courses");

  const [tests, setTests] = useState<Test[]>([]);
  const [testCompleted, setTestCompleted] = useState<Set<string>>(new Set());
  const [testStats, setTestStats] = useState<TestStats | null>(null);

  // -------------------- Load courses from backend --------------------

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCourses(true);
        const backendCourses = await fetchCourses();

        // Map backend courses → UI courses
        const mapped: Course[] = backendCourses.map(
          (c: any, index: number): Course => ({
            id: c.id,
            name: c.name,
            description: `Skill tests for ${c.name}`,
            icon: ICONS[index % ICONS.length],
            color: COLORS[index % COLORS.length],
            topics: [], // topics will be loaded lazily per-course
          })
        );

        setCourses(mapped);
      } catch (err) {
        console.error("Failed to load courses", err);
        toast.error("Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };

    load();
  }, []);

  // -------------------- Helper: load tests for a topic (dynamic) --------------------

  const loadTestsForTopic = async (topic: Topic) => {
    try {
      // Optional: you could add a separate loading state for tests
      setTests([]);

      // Fetch all skill test MCQs + coding problems for this topic using question service
      const [quizzes, codingProblems] = await Promise.all([
        fetchQuestions({
          topic: topic.id,
          categories: 'skill_test',
          type: 'mcq_single'
        }),
        fetchQuestions({
          topic: topic.id,
          categories: 'skill_test',
          type: 'coding'
        })
      ]);

      const quizCount = Array.isArray(quizzes) ? quizzes.length : 0;
      const codingCount = Array.isArray(codingProblems)
        ? codingProblems.length
        : 0;
      const totalQuestions = quizCount + codingCount;

      // If no questions → no tests available
      if (totalQuestions === 0) {
        setTests([]);
        return;
      }

      // Simple duration logic: 2 mins per question, at least 15 mins
      const duration = Math.max(15, totalQuestions * 2);

      const uiTest: Test = {
        id: `${topic.id}-skill-test`,
        title: `${topic.name} Skill Test`,
        difficulty: "Medium",
        questions: totalQuestions,
        duration,
        topicId: topic.id,
      };

      setTests([uiTest]);
    } catch (err) {
      console.error("Failed to load skill test questions", err);
      toast.error("Failed to load skill test questions");
      setTests([]);
    }
  };

  // -------------------- Handlers --------------------

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    setSelectedTopic(null);
    setSelectedTest(null);
    setSidebarOpen(true);
    setCurrentView("tests");

    try {
      // Fetch topics
      const backendTopics = await fetchTopicsByCourse(course.id);

      const uiTopics: Topic[] = backendTopics.map((t: any) => ({
        id: t.id,
        name: t.name,
        progress: 0,
        completed: false,
      }));

      // Update course topics
      setCourses(prev =>
        prev.map(c =>
          c.id === course.id ? { ...c, topics: uiTopics } : c
        )
      );

      setSelectedCourse(prev =>
        prev ? { ...prev, topics: uiTopics } : prev
      );

      setSelectedTopic(uiTopics[0] || null);

      // ***** NOW BUILD DYNAMIC SKILL TESTS *****
      const dynamicTests: Test[] = [];

      for (const topic of uiTopics) {
        const [quizzes, coding] = await Promise.all([
          fetchQuestions({
            topic: topic.id,
            categories: 'skill_test',
            type: 'mcq_single'
          }),
          fetchQuestions({
            topic: topic.id,
            categories: 'skill_test',
            type: 'coding'
          })
        ]);

        const totalQuestions = quizzes.length + coding.length;

        // If a topic has no skill test questions, skip it
        if (totalQuestions === 0) continue;

        dynamicTests.push({
          id: `${course.id}-${topic.id}-skilltest`,
          title: `${topic.name} Skill Test`,
          difficulty: "Medium",
          questions: totalQuestions,
          duration: 45,
          topicId: topic.id,
        });
      }

      setTests(dynamicTests);
    } catch (err) {
      console.error("Failed to load topics or tests", err);
      toast.error("Failed to load topics or tests");
    }
  };
  ;

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setSelectedTest(null);
    setCurrentView("tests");
    loadTestsForTopic(topic);
  };

  const handleStartTest = (test: Test) => {
    setSelectedTest(test);

    // If test already completed → view results directly
    if (testCompleted.has(test.id)) {
      setCurrentView("results");
    } else {
      setCurrentView("instructions");
    }
  };

  const handleBeginTest = () => {
    setCurrentView("test");
  };

  const handleTestComplete = (
    stats?: { answeredCount: number; totalQuestions: number; timeSpent: number }
  ) => {
    if (selectedTest) {
      setTestCompleted((prev) => {
        const updated = new Set(prev);
        updated.add(selectedTest.id);
        return updated;
      });
    }

    if (stats) {
      setTestStats(stats);
    }

    setCurrentView("thankyou");
  };

  const handleViewResults = () => {
    setCurrentView("results");
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedTopic(null);
    setSelectedTest(null);
    setTests([]);
    setCurrentView("courses");
  };

  const handleBackToTests = () => {
    setSelectedTest(null);
    setCurrentView("tests");
  };

  const handleBackToInstructions = () => {
    setCurrentView("instructions");
  };

  // Currently we only ever store tests for the selected topic,
  // but keep this filter for safety/extensibility.
  const filteredTests: Test[] = selectedTopic
    ? tests.filter((t) => t.topicId === selectedTopic.id)
    : [];

  // Hide Navigation when full-screen test views?
  const hideNavigation =
    currentView === "instructions" ||
    currentView === "test" ||
    currentView === "thankyou" ||
    currentView === "results";

  // -------------------- View: Instructions --------------------
  if (currentView === "instructions" && selectedTest && selectedTopic) {
    return (
      <div className="min-h-screen bg-background">
        {!hideNavigation && <Navigation />}
        <TestInstructions
          test={{
            id: selectedTest.id,
            title: selectedTest.title,
            course: selectedCourse?.name || "",
            duration: selectedTest.duration,
            totalQuestions: selectedTest.questions,
            difficulty: selectedTest.difficulty,
            description: `${selectedTopic.name} - ${selectedTest.difficulty} level test`,
            marks: selectedTest.questions * 1,
          }}
          onStart={handleBeginTest}
          onBack={handleBackToTests}
        />
      </div>
    );
  }

  // -------------------- View: Test Interface --------------------
  if (currentView === "test" && selectedTest && selectedTopic) {
    return (
      <div className="min-h-screen bg-background">
        {!hideNavigation && <Navigation />}
        <AssessmentInterface
          assessment={{
            id: selectedTest.id,
            title: selectedTest.title,
            course: selectedCourse?.name || "",
            duration: selectedTest.duration,
            totalQuestions: selectedTest.questions,
            // passes topicId so AssessmentInterface can fetch real questions if needed
            topicId: selectedTopic.id,
          }}
          onComplete={handleTestComplete}
          onBack={handleBackToInstructions}
        />
      </div>
    );
  }

  // -------------------- View: Thank You --------------------
  if (currentView === "thankyou" && selectedTest && selectedTopic && testStats) {
    return (
      <div className="min-h-screen bg-background">
        {!hideNavigation && <Navigation />}
        <TestThankYou
          test={{
            id: selectedTest.id,
            title: selectedTest.title,
            course: selectedCourse?.name || "",
            duration: selectedTest.duration,
            totalQuestions: selectedTest.questions,
          }}
          answeredCount={testStats.answeredCount}
          totalQuestions={testStats.totalQuestions}
          timeSpent={testStats.timeSpent}
          onViewResults={handleViewResults}
        />
      </div>
    );
  }

  // -------------------- View: Results --------------------
  if (currentView === "results" && selectedTest && selectedTopic) {
    return (
      <div className="min-h-screen bg-background">
        {!hideNavigation && <Navigation />}
        <TestResults
          test={{
            id: selectedTest.id,
            title: selectedTest.title,
            course: selectedCourse?.name || "",
            duration: selectedTest.duration,
            totalQuestions: selectedTest.questions,
            marks: selectedTest.questions * 1,
            // placeholder score – later replace with real score from backend
            score: Math.floor(Math.random() * 20) + 70,
          }}
          onBackToList={handleBackToTests}
          onTryAgain={() => handleStartTest(selectedTest)}
        />
      </div>
    );
  }

  // -------------------- View: Courses & Tests --------------------
  return (
    <div className="min-h-screen bg-background">
      {!hideNavigation && <Navigation />}

      <div className="flex h-[calc(100vh-64px)]">
        {/* Topic Sidebar – only show when course selected & on tests view */}
        {selectedCourse && currentView === "tests" && (
          <TopicSidebar
            course={selectedCourse}
            selectedTopic={selectedTopic}
            onTopicSelect={handleTopicSelect}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {currentView === "courses" ? (
            <CourseSelection
              courses={courses}
              onCourseSelect={handleCourseSelect}
            />
          ) : (
            <TestCards
              tests={filteredTests}
              courseName={selectedCourse?.name || ""}
              topicName={selectedTopic?.name || ""}
              onBack={handleBackToCourses}
              onStartTest={handleStartTest}
              completedTests={testCompleted}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillTest;
