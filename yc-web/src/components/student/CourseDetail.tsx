import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../../components/Navigation";
import StudentVideos from "./StudentVideos";
import StudentQuiz from "./StudentQuiz";
import StudentNotes  from "./StudentNotes";
import {
  fetchCourseById,
  fetchTopicsByCourse,
  fetchSubtopicsByTopic,
} from "@/services/courseService";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

// ------------------- Types -------------------
type Course = {
  id: string;
  name: string;
  category: string;
};

type Topic = {
  id: string;
  name: string;
  order_index: number;
};

type Subtopic = {
  id: string;
  name: string;
  order_index: number;
  topic: string;
  content?: string | null;
};

// ------------------- Placeholders -------------------
const StudentVideosPlaceholder = () => (
  <div className="text-center text-gray-500">🎥 Videos will appear here</div>
);

const StudentQuizPlaceholder = () => (
  <div className="text-center text-gray-500">📝 Quiz section coming soon</div>
);

const StudentCodingPlaceholder = () => (
  <div className="text-center text-gray-500">💻 Coding problems coming soon</div>
);

const StudentNotesPlaceholder = () => (
  <div className="text-center text-gray-500">📄 Notes will be shown here</div>
);

// ------------------- Main Page -------------------
const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopicsMap, setSubtopicsMap] = useState<Record<string, Subtopic[]>>(
    {}
  );

  // Only ONE expanded topic at a time
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    {}
  );

  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(
    null
  );

  const [rightTab, setRightTab] = useState<
    "videos" | "quizzes" | "coding" | "notes"
  >("videos");

  // ------------------- Load Data -------------------
  useEffect(() => {
    loadPage();
  }, [courseId]);

  const loadPage = async () => {
    if (!courseId) return;

    setLoading(true);

    try {
      const c = await fetchCourseById(courseId);
      setCourse(c);

      const t = await fetchTopicsByCourse(courseId);
      setTopics(t);

      // Initialize all collapsed
      const expanded: Record<string, boolean> = {};
      t.forEach((topic) => (expanded[topic.id] = false));
      setExpandedTopics(expanded);

      setSubtopicsMap({});
      setSelectedSubtopic(null);
    } catch (err) {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Toggle Topic Expand -------------------
  const toggleExpandTopic = async (topicId: string) => {
    const isOpen = expandedTopics[topicId];

    // Accordion behavior → close all others
    const newState: Record<string, boolean> = {};
    topics.forEach((t) => (newState[t.id] = false));
    newState[topicId] = !isOpen;

    setExpandedTopics(newState);

    // If opening and subtopics not loaded yet
    if (!isOpen && !subtopicsMap[topicId]) {
      try {
        const subs = await fetchSubtopicsByTopic(topicId);
        setSubtopicsMap((prev) => ({ ...prev, [topicId]: subs }));
      } catch (err) {
        toast.error("Failed to load subtopics");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading course...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Course not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 overflow-hidden h-[calc(100vh-64px)]">
        <div className="h-full w-full p-4 md:p-6 flex gap-6">

          {/* ---------------- Left Panel (Topics) ---------------- */}
          <div
            className="bg-white rounded-md shadow-sm flex flex-col"
            style={{ flexBasis: "30%", minWidth: 300, maxWidth: 560, height: "100%" }}
          >
            <div className="p-4 overflow-y-auto flex-1">
              <h2 className="text-lg font-semibold mb-4">{course.name}</h2>

              <h3 className="text-md font-semibold mb-2">Topics</h3>

              <div className="space-y-3">
                {topics.length === 0 && (
                  <div className="text-sm text-muted-foreground">No topics found</div>
                )}

                {topics.map((topic) => {
                  const expanded = expandedTopics[topic.id];
                  const subs = subtopicsMap[topic.id] || [];

                  return (
                    <div key={topic.id} className="border rounded p-3 bg-white">

                      {/* Topic Header Clickable Anywhere */}
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleExpandTopic(topic.id)}
                      >
                        <div>
                          <div className="font-medium">{topic.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Order: {topic.order_index}
                          </div>
                        </div>

                        {/* Arrow Icon */}
                        {expanded ? <ChevronUp /> : <ChevronDown />}
                      </div>

                      {/* Expanded Subtopics */}
                      {expanded && (
                        <div className="mt-3 space-y-2">
                          {subs.length === 0 && (
                            <div className="text-sm text-muted-foreground">
                              No subtopics
                            </div>
                          )}

                          {subs.map((s) => (
                            <div
                              key={s.id}
                              className={`p-2 rounded border cursor-pointer ${
                                selectedSubtopic?.id === s.id
                                  ? "bg-sky-50 border-sky-300"
                                  : "bg-white"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent closing parent
                                setSelectedSubtopic(s);
                                setRightTab("videos");
                              }}
                            >
                              <div className="font-medium">{s.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Order: {s.order_index}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ---------------- Right Panel ---------------- */}
          <div
            className="bg-white rounded-md shadow-sm overflow-auto flex flex-col"
            style={{ flexBasis: "70%", height: "100%", overflow: "hidden" }}
          >
            {/* Tabs */}
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                {["videos", "quizzes", "coding", "notes"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-3 py-1 rounded-md text-sm ${
                      rightTab === tab
                        ? "bg-black text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setRightTab(tab as any)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedSubtopic
                  ? `Selected: ${selectedSubtopic.name}`
                  : "No subtopic selected"}
              </div>
            </div>

            {/* Right Panel Content */}
              <div className="p-6 flex-1 overflow-y-auto min-h-0">
              {!selectedSubtopic && (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="text-lg font-medium mb-2">
                    Select a subtopic on the left
                  </div>
                  <div className="text-sm">
                    Then browse Videos / Quizzes / Coding / Notes
                  </div>
                </div>
              )}

              {selectedSubtopic && (
                <>
                  {rightTab === "videos" && selectedSubtopic && (
                    <StudentVideos subtopicId={selectedSubtopic.id} />
                  )}
                  {rightTab === "quizzes" && selectedSubtopic && (
                    <StudentQuiz subtopicId={selectedSubtopic.id} />
                  )}
                  {rightTab === "coding" && <StudentCodingPlaceholder />}
                  {rightTab === "notes" && selectedSubtopic && (
                    <StudentNotes subtopicId={selectedSubtopic.id} />
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
