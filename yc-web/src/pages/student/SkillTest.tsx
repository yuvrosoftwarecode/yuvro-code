// src/pages/student/SkillTest.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  progress?: number;
  completed?: boolean;
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
  totalQuestions: number; // Renamed from 'questions'
  duration: number; // minutes
  totalMarks: number; // New field
  topicId: string;
  course: string;
  maxAttempts: number;
  my_submissions?: any[];
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
  // -------------------- Routing --------------------
  const { courseId, testId } = useParams();
  const navigate = useNavigate();

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
  const [testSubmissions, setTestSubmissions] = useState<Record<string, string>>({});

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

  // -------------------- Handlers that trigger Navigation --------------------

  const handleCourseSelect = (course: Course) => {
    setCurrentView("tests");
    navigate(`/student/courses/${course.id}/skill-tests`);
  };

  const handleStartTest = (test: Test) => {
    // Navigate to specific test URL
    if (courseId) {
      navigate(`/student/courses/${courseId}/skill-tests/${test.id}`);
    }
  };

  const handleBackToCourses = () => {
    navigate("/student/skill-test");
  };

  const handleBackToTests = () => {
    setCurrentView("tests");
    if (courseId) {
      navigate(`/student/courses/${courseId}/skill-tests`);
    } else {
      navigate("/student/skill-test");
    }
  };

  // -------------------- URL Sync Logic --------------------

  // Sync Course ID
  useEffect(() => {
    if (loadingCourses || courses.length === 0) return;

    const syncCourse = async () => {
      if (courseId) {
        // Find coruse
        const foundCourse = courses.find(c => c.id === courseId);

        if (foundCourse) {
          // Check if topics loaded
          if (foundCourse.topics.length === 0) {
            // Load topics logic (borrowed from original handleCourseSelect)
            try {
              const backendTopics = await fetchTopicsByCourse(foundCourse.id);
              const uiTopics: Topic[] = backendTopics.map((t: any) => ({
                id: t.id,
                name: t.name,
                progress: 0,
                completed: false,
              }));

              // Update courses state immutably to persist topics
              setCourses(prev =>
                prev.map(c =>
                  c.id === foundCourse.id ? { ...c, topics: uiTopics } : c
                )
              );

              // We need to use the Updated Course object with topics
              const updatedCourse = { ...foundCourse, topics: uiTopics };
              setSelectedCourse(updatedCourse);
              setSelectedTopic(uiTopics[0] || null);

              // Load all tests for this course's topics
              const realTests: Test[] = [];
              for (const topic of uiTopics) {
                try {
                  const apiTests = await getSkillTestsByTopic(topic.id);
                  const activeTests = apiTests.filter(t => t.publish_status === 'active');
                  const mappedTests: Test[] = activeTests.map(t => ({
                    id: t.id,
                    title: t.title,
                    difficulty: t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1) as "Easy" | "Medium" | "Hard",
                    totalQuestions: t.total_questions || (t.questions_config.mcq_single.length +
                      t.questions_config.mcq_multiple.length +
                      t.questions_config.coding.length +
                      t.questions_config.descriptive.length),
                    totalMarks: t.total_marks,
                    duration: t.duration,
                    topicId: topic.id,
                    course: foundCourse.name,
                    maxAttempts: t.max_attempts || 3,
                    my_submissions: (t as any).my_submissions || []
                  }));
                  realTests.push(...mappedTests);
                } catch (e) {
                  // ignore error per topic
                }
              }
              setTests(realTests);

            } catch (err) {
              console.error("Failed to load topics", err);
            }
          } else {
            // Already has topics
            if (!selectedCourse || selectedCourse.id !== courseId) {
              setSelectedCourse(foundCourse);
              setSelectedTopic(foundCourse.topics[0] || null);
              // Also need to ensure tests are loaded? 
              // Using assumption: if topics loaded, tests likely loaded in previous navigation. 
              // But strictly, we should probably reload tests or check if 'tests' state is relevant.
              // For simplicity, if switching courses, we might need to reload tests.
              // But typically user flow is linear.
            }
          }

          if (!testId) {
            setCurrentView("tests");
          }
          setSidebarOpen(true);
        }
      } else {
        // Root path
        setSelectedCourse(null);
        setSelectedTopic(null);
        setTests([]);
        setCurrentView("courses");
      }
    };

    syncCourse();
  }, [courseId, courses, loadingCourses]);

  // Sync Test ID
  useEffect(() => {
    if (selectedCourse && tests.length > 0) {
      if (testId) {
        const foundTest = tests.find(t => t.id === testId);
        if (foundTest) {
          setSelectedTest(foundTest);

          // If already in 'test' (active) or 'results', don't override. 
          // But if just navigating, go to instructions.
          if (currentView !== 'test' && currentView !== 'results' && currentView !== 'thankyou') {
            setCurrentView("instructions");
          }

          // Also select the right topic
          const matchingTopic = selectedCourse.topics.find(t => t.id === foundTest.topicId);
          if (matchingTopic) setSelectedTopic(matchingTopic);
        }
      } else {
        // If no testId in URL, implies we are at the list view
        setSelectedTest(null);
        setCurrentView("tests");
      }
    }
  }, [testId, tests, selectedCourse, testCompleted]);

  // -------------------- Internal Handlers --------------------

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    // When topic selected, we filter view in TestCards.
    // Ensure we are in test list view
    if (testId) {
      // If handling topic select while looking at a test instructions?
      // Usually sidebar allows switching topics.
      // If we switch topic, we should probably clear the selected test (URL).
      // But keeping it simple for now. 
      navigate(`/student/courses/${selectedCourse?.id}/skill-tests`);
    } else {
      setCurrentView("tests");
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

      if (currentSubmissionId) {
        setTestSubmissions(prev => ({
          ...prev,
          [selectedTest.id]: currentSubmissionId
        }));
      }
    }

    if (stats) {
      setTestStats(stats);
    }

    setCurrentView("thankyou");
  };

  const handleViewResults = () => {
    setCurrentView("results");
  };

  const handleViewResult = (submissionId: string, test: Test) => {
    setSelectedTest(test);
    setCurrentSubmissionId(submissionId);
    setCurrentView("results");
  };

  const handleBackToInstructions = () => {
    // If actively taking test and going back? Usually "Quit".
    // But here used for standard back button in interface?
    setCurrentView("instructions");
  };

  const handleViewAllResults = (test: Test) => {
    setSelectedTest(test);
    setCurrentSubmissionId(null); // Force TestResults to pick the latest attempt
    setCurrentView("results");
  };


  // -------------------- Computed --------------------

  // Filter tests by selected topic
  const filteredTests: Test[] = selectedTopic
    ? tests.filter((t) => t.topicId === selectedTopic.id)
    : [];

  const hideNavigation =
    currentView === "instructions" ||
    currentView === "test" ||
    currentView === "thankyou" ||
    currentView === "results";

  // -------------------- Render --------------------

  // View: Instructions
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
            totalQuestions: selectedTest.totalQuestions,
            difficulty: selectedTest.difficulty,
            description: `${selectedTopic.name} - ${selectedTest.difficulty} level test`,
            marks: selectedTest.totalMarks,
          }}
          onStart={handleBeginTest}
          onBack={handleBackToTests}
        />
      </div>
    );
  }

  // View: Test Interface
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
            totalQuestions: selectedTest.totalQuestions,
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

  // View: Thank You
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
            totalQuestions: selectedTest.totalQuestions,
          }}
          answeredCount={testStats.answeredCount}
          totalQuestions={testStats.totalQuestions}
          timeSpent={testStats.timeSpent}
          onViewResults={handleViewResults}
        />
      </div>
    );
  }

  // View: Results
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
            totalQuestions: selectedTest.totalQuestions,
            marks: selectedTest.totalMarks,
          }}
          submissionId={testSubmissions[selectedTest.id] || currentSubmissionId || ""}
          onBackToList={handleBackToTests}
          onTryAgain={() => setCurrentView("instructions")}
        />
      </div>
    );
  }


  // View: Courses & Tests
  return (
    <div className="min-h-screen bg-background">
      {!hideNavigation && <Navigation />}

      <div className="flex h-[calc(100vh-64px)]">
        {/* Topic Sidebar */}
        {selectedCourse && (currentView === "tests" || testId) && (
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
              onViewResult={handleViewResult}
              onViewAllResults={handleViewAllResults}
              completedTests={testCompleted}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillTest;
