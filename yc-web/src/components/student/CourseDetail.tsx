import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../../components/Navigation";
import StudentVideos from "./StudentVideos";
import StudentQuizEmbed from "./StudentQuizEmbed";
import StudentCodingEmbed from "./StudentCodingEmbed";
import StudentNotes from "./StudentNotes";
import restApiAuthUtil from "../../utils/RestApiAuthUtil";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import {
  fetchCourseById,
  fetchTopicsByCourse,
  fetchSubtopicsByTopic,
  Course as CourseType
} from "@/services/courseService";
import { Check } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import { PlayCircle, HelpCircle, StickyNote, Code } from "lucide-react";

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

const CourseDetail: React.FC = () => {
  const [readMap, setReadMap] = useState<Record<string, boolean>>({});
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<CourseType | null>(null);
  const [loading, setLoading] = useState(true);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopicsMap, setSubtopicsMap] = useState<Record<string, Subtopic[]>>(
    {}
  );

  const [collapsed, setCollapsed] = useState(false);

  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    {}
  );

  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(
    null
  );

  const [rightTab, setRightTab] = useState<
    "videos" | "quizzes" | "coding" | "notes" | "markAsRead"
  >("videos");

  const handleMarkAsRead = async () => {
    if (!selectedSubtopic) return;

    try {
      await restApiAuthUtil.post("/course/std/mark_complete/", {
        subtopic_id: selectedSubtopic.id,
      });

      setReadMap((prev) => ({ ...prev, [selectedSubtopic.id]: true }));
      toast.success(`Marked '${selectedSubtopic.name}' as read!`);
    } catch (err) {
      toast.error("Failed to mark as read");
      console.error(err);
    }
  };

  const getTopicProgress = (topicId: string): number => {
    const subs = subtopicsMap[topicId] || [];
    if (subs.length === 0) return 0;
    const completed = subs.filter((s) => readMap[s.id]).length;
    return Math.round((completed / subs.length) * 100);
  };

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

      // Fetch all subtopics upfront for progress calculation
      const allSubtopics: Record<string, Subtopic[]> = {};
      let firstSubtopic: Subtopic | null = null;
      let firstTopicId: string | null = null;

      try {
        for (const topic of t) {
          const subs = await fetchSubtopicsByTopic(topic.id);
          allSubtopics[topic.id] = subs as Subtopic[];

          // Set first topic and subtopic
          if (!firstSubtopic && Array.isArray(subs) && subs.length > 0) {
            firstSubtopic = subs[0] as Subtopic;
            firstTopicId = topic.id;
          }
        }
        setSubtopicsMap(allSubtopics);

        // Auto-expand first topic and select first subtopic
        if (firstTopicId && firstSubtopic) {
          const newExpanded: Record<string, boolean> = {};
          t.forEach((topic) => (newExpanded[topic.id] = topic.id === firstTopicId));
          setExpandedTopics(newExpanded);
          setSelectedSubtopic(firstSubtopic);
        }
      } catch (err) {
        console.warn("Could not fetch subtopics", err);
        setSubtopicsMap({});
      }

      try {
        const response = await restApiAuthUtil.get<{ completed_subtopic_ids: string[] }>(
          `/course/std/completed_subtopics/?course_id=${courseId}`
        );
        const completedIds = response.completed_subtopic_ids || [];
        const newReadMap: Record<string, boolean> = {};
        completedIds.forEach((id) => {
          newReadMap[id] = true;
        });
        setReadMap(newReadMap);
      } catch (err) {
        console.warn("Could not fetch completed subtopics", err);
        setReadMap({});
      }
    } catch (err) {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandTopic = async (topicId: string) => {
    const isOpen = expandedTopics[topicId];
    const newState: Record<string, boolean> = {};
    topics.forEach((t) => (newState[t.id] = false));
    newState[topicId] = !isOpen;

    setExpandedTopics(newState);

    if (!isOpen && !subtopicsMap[topicId]) {
      try {
        const subs = await fetchSubtopicsByTopic(topicId);
        setSubtopicsMap((prev) => {
          const updated: Record<string, Subtopic[]> = { ...prev, [topicId]: subs as Subtopic[] };
          return updated;
        });
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
      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative">
        {/* LEFT PANEL */}
        <div
          className={`bg-white shadow-sm transition-all duration-300 flex flex-col relative`}
          style={{
            width: collapsed ? "70px" : "355px",
            minWidth: collapsed ? "70px" : "355px",
            overflow: "auto",
          }}
        >
          {/* CONTENT AREA */}
          {collapsed ? (
            <div className="flex flex-col items-center h-full py-4 gap-4">
              <div className="w-8 h-8 flex items-center justify-center text-2xl font-bold mb-2" title={course.name}>
                🗂️
              </div>
              <div className="flex flex-col items-center gap-2 w-full">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-sm font-bold cursor-pointer border border-gray-300"
                    title={topic.name}
                    onClick={() => toggleExpandTopic(topic.id)}
                  >
                    {topic.name.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="opacity-100 transition-opacity duration-200 px-4">
              <div className="flex items-center gap-3 mb-4 py-2">
                <span style={{ fontSize: "2em" }}>🗂️</span>
                <span className="text-md font-semibold">{course.name}</span>
              </div>

              <p className="pt-0 text-gray-600 mt-[-15px]">Track your learning progress</p>
              <hr className="my-4 border-gray-200" />

              <h3 className="text-md font-semibold mb-2">Topics</h3>

              <div className="space-y-3">
                {topics.map((topic) => {
                  const expanded = expandedTopics[topic.id];
                  const subs = subtopicsMap[topic.id] || [];
                  const allRead = subs.length > 0 && subs.every((s) => readMap[s.id]);
                  const progress = getTopicProgress(topic.id);
                  return (
                    <div key={topic.id} className="border border-gray-200 rounded p-4 bg-white">
                      {/* Topic header */}
                      <div
                        className="flex items-center justify-between cursor-pointer w-full"
                        onClick={() => toggleExpandTopic(topic.id)}
                      >
                        <div className="flex items-center">
                          {expanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                          <span className="font-medium truncate">{topic.name}</span>
                        </div>
                        {allRead && (
                          <span className="flex items-center justify-center rounded-full bg-green-100 border border-green-400 w-6 h-6">
                            <Check className="text-green-600 w-4 h-4" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="mt-2 w-full">
                        <ProgressBar
                          value={progress}
                          height={10}
                          trackClassName="bg-gray-200"
                          barClassName={`bg-green-400`}
                        />
                        <div className="text-xs text-gray-500 mt-1">Progress: {progress}%</div>
                      </div>

                      {/* Subtopics */}
                      {expanded && (
                        <div className="mt-3 space-y-2">
                          {subs.map((s) => (
                            <div
                              key={s.id}
                              className={`p-2 rounded border border-gray-200 cursor-pointer flex items-center justify-between ${selectedSubtopic?.id === s.id
                                ? "bg-sky-50 border-sky-300"
                                : "bg-white"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubtopic(s);
                                setRightTab("videos");
                              }}
                            >
                              <span className="font-medium">{s.name}</span>
                              {readMap[s.id] && (
                                <span className="flex items-center justify-center rounded-full bg-green-100 border border-green-400 w-6 h-6">
                                  <Check className="text-green-600 w-4 h-4" strokeWidth={3} />
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Divider chevron button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="fixed top-24 transform -translate-y-1/2 bg-white border border-gray-300 shadow rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-100 z-30"
          style={{
            left: `calc(${collapsed ? '70px' : '355px'} - 10px)`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            position: "fixed"
          }}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white shadow-sm overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="border-b border-gray-200 py-3 flex items-center justify-between">
            <div className="flex gap-2 justify-center flex-1">
              {[
                { key: "videos", label: "Videos", icon: <PlayCircle /> },
                { key: "quizzes", label: "Quizzes", icon: <HelpCircle /> },
                { key: "coding", label: "Coding", icon: <Code /> },
                { key: "notes", label: "Notes", icon: <StickyNote /> },
                { key: "markAsRead", label: "Mark as Read" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${rightTab === tab.key
                    ? "bg-gray-300 text-black"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                  onClick={() => setRightTab(tab.key as any)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm bg-white border border-gray-300 shadow-sm rounded-full ml-4 mr-6 px-4 py-1 font-medium text-gray-700">
              <span>
                {selectedSubtopic ? selectedSubtopic.name : "No subtopic selected"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {!selectedSubtopic ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <div className="text-lg font-medium mb-2">Select a subtopic on the left</div>
                <div className="text-sm">Then browse Videos / Quizzes / Notes</div>
              </div>
            ) : (
              <>
                {rightTab === "videos" && <StudentVideos subtopicId={selectedSubtopic.id} />}
                {rightTab === "quizzes" && <StudentQuizEmbed subtopicId={selectedSubtopic.id} />}
                {rightTab === "coding" && <StudentCodingEmbed subtopicId={selectedSubtopic.id} />}
                {rightTab === "notes" && <StudentNotes subtopicId={selectedSubtopic.id} />}
                {rightTab === "markAsRead" && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <button
                      className="bg-green-100 text-green-900 font-semibold border border-green-300 px-6 py-3 rounded-lg shadow hover:bg-green-200 transition-colors"
                      onClick={handleMarkAsRead}
                      disabled={!selectedSubtopic}
                    >
                      Mark '{selectedSubtopic?.name}' as Read
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;