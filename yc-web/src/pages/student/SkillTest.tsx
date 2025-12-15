// src/pages/student/SkillTest.tsx
import React, { useEffect, useState } from "react";
import Navigation from "@/components/common/Navigation";

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
import { getSkillTestsByTopic, startSkillTest } from "@/services/skillTestService";
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

  // New State for Real Logic
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);

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

      const apiTests = await getSkillTestsByTopic(topic.id);

      // Filter only active tests
      const activeTests = apiTests.filter(t => t.publish_status === 'active');

      // Map to UI Test format
      const mappedTests: Test[] = activeTests.map(t => ({
        id: t.id,
        title: t.title,
        difficulty: t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1) as "Easy" | "Medium" | "Hard",
        questions: (t.questions_config.mcq_single.length +
          t.questions_config.mcq_multiple.length +
          t.questions_config.coding.length +
          t.questions_config.descriptive.length),
        duration: t.duration,
        topicId: topic.id
      }));

      setTests(mappedTests);
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

      // ***** NOW LOAD REAL SKILL TESTS *****
      const realTests: Test[] = [];

      for (const topic of uiTopics) {
        try {
          const apiTests = await getSkillTestsByTopic(topic.id);

          // Filter only active tests
          const activeTests = apiTests.filter(t => t.publish_status === 'active');

          // Map to UI Test format
          const mappedTests: Test[] = activeTests.map(t => ({
            id: t.id,
            title: t.title,
            difficulty: t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1) as "Easy" | "Medium" | "Hard",
            questions: (t.questions_config.mcq_single.length +
              t.questions_config.mcq_multiple.length +
              t.questions_config.coding.length +
              t.questions_config.descriptive.length),
            duration: t.duration,
            topicId: topic.id
          }));

          realTests.push(...mappedTests);
        } catch (e) {
          console.error(`Failed to load tests for topic ${topic.name}`, e);
        }
      }

      setTests(realTests);
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

  const handleBeginTest = async () => {
    if (!selectedTest) return;

    try {
      const loadingToast = toast.loading("Starting test...");
      const res = await startSkillTest(selectedTest.id);
      toast.dismiss(loadingToast);

      if (res.status === 'started' || res.status === 'in_progress') {
        setQuestions(res.questions);
        setCurrentSubmissionId(res.submission_id);
        setCurrentView("test");
        toast.success("Test started successfully");
      } else if (res.status === 'completed' || res.status === 'submitted') {
        toast.info("You have already completed this test.");
        // Maybe fetch results? For now just go to results
        // setTestCompleted(prev => new Set(prev).add(selectedTest.id));
        // setCurrentView("results");
      }
    } catch (err: any) {
      console.error("Failed to start test", err);
      toast.error(err.response?.data?.error || "Failed to start test");
    }
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
          questions={questions}
          submissionId={currentSubmissionId || ""}
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
