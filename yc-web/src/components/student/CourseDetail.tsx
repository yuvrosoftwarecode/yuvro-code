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
import { PlayCircle, HelpCircle, StickyNote, Code, Sparkles, X } from "lucide-react";
import AIChatContainer from "./LearnCertify/AIChatWidget/AIChatContainer";
import { v4 as uuidv4 } from 'uuid';

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
    "videos" | "quizzes" | "coding" | "notes"
  >("videos");


  const [chatSessionId, setChatSessionId] = useState<string>("");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (courseId) {
      setChatSessionId(`course-chat-${courseId}-${uuidv4()}`);
    }
  }, [courseId]);

  const getCourseContext = () => {
    let ctx = `Course: ${course?.name || 'Unknown'}.\n`;
    const currentTopic = topics.find(t => expandedTopics[t.id]);
    if (currentTopic) {
      ctx += `Current Topic: ${currentTopic.name}.\n`;
    }
    if (selectedSubtopic) {
      ctx += `Current Subtopic: ${selectedSubtopic.name}.\n`;
      if (selectedSubtopic.content) ctx += `Content: ${selectedSubtopic.content}\n`;
    }
    ctx += `Current View: ${rightTab}.\n`;
    return ctx;
  };

  const handleMarkAsRead = async () => {
    if (!selectedSubtopic || marking) return;
    setMarking(true);
    try {
      await restApiAuthUtil.post("/course/std/mark_complete/", {
        subtopic_id: selectedSubtopic.id,
      });

      setReadMap((prev) => ({ ...prev, [selectedSubtopic.id]: true }));
      toast.success(`Marked '${selectedSubtopic.name}' as read!`);
    } catch (err) {
      toast.error("Failed to mark as read");
      console.error(err);
    } finally {
      setMarking(false);
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
          className={`bg-white shadow-sm transition-all duration-300 ease-in-out flex flex-col relative z-20 border-r border-gray-200`}
          style={{
            width: collapsed ? "70px" : "355px",
            minWidth: collapsed ? "70px" : "355px",
            overflow: "hidden", // Changed to hidden to prevent scrollbar flicker during transition
          }}
        >
          {/* Scrollable content container */}
          <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
            {/* CONTENT AREA */}
            {collapsed ? (
              <div className="flex flex-col items-center h-full py-6 gap-6 animate-fade-in">
                <div className="w-10 h-10 flex items-center justify-center text-2xl font-bold mb-2 bg-gray-50 rounded-xl" title={course.name}>
                  🗂️
                </div>
                <div className="flex flex-col items-center gap-3 w-full px-2">
                  {topics.map((topic) => {
                    const progress = getTopicProgress(topic.id);
                    const isCompleted = progress === 100;
                    return (
                      <div
                        key={topic.id}
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold cursor-pointer border-2 shadow-sm transition-all
                          ${isCompleted
                            ? "bg-green-500 text-white border-gray-600 hover:bg-green-600"
                            : "bg-white text-gray-700 border-transparent hover:border-gray-200 hover:bg-gray-50"
                          }`}
                        title={topic.name}
                        onClick={() => {
                          setCollapsed(false);
                          if (!expandedTopics[topic.id]) {
                            toggleExpandTopic(topic.id);
                          }
                        }}
                      >
                        {topic.name.charAt(0)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-5 animate-fade-in opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 flex items-center justify-center text-xl bg-gray-100 rounded-lg">
                    🗂️
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">{course.name}</h2>
                </div>

                <p className="text-sm text-gray-500 mb-5 ml-1">Track your learning progress</p>

                <div className="h-px bg-gray-100 w-full mb-5" />

                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 ml-1">Course Topics</h3>

                <div className="space-y-3 pb-4">
                  {topics.map((topic) => {
                    const expanded = expandedTopics[topic.id];
                    const subs = subtopicsMap[topic.id] || [];
                    const allRead = subs.length > 0 && subs.every((s) => readMap[s.id]);
                    const progress = getTopicProgress(topic.id);
                    return (
                      <div key={topic.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                        {/* Topic header */}
                        <div
                          className={`flex items-center justify-between cursor-pointer w-full p-3 transition-colors ${expanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
                          onClick={() => toggleExpandTopic(topic.id)}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-1 rounded-full transition-transform duration-300 ${expanded ? 'bg-gray-200 rotate-90' : 'bg-transparent rotate-0'}`}>
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="font-semibold text-gray-800 truncate text-sm">{topic.name}</span>
                          </div>
                          {allRead && (
                            <span className="flex items-center justify-center rounded-full bg-green-500 text-white w-5 h-5 shadow-sm">
                              <Check className="w-3 h-3" strokeWidth={4} />
                            </span>
                          )}
                        </div>

                        <div className="px-3 pb-3 pt-0">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1 mt-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <ProgressBar
                            value={progress}
                            height={6}
                            trackClassName="bg-gray-100 rounded-full"
                            barClassName="bg-green-500 rounded-full"
                          />
                        </div>

                        <div
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                          <div className="bg-gray-50 border-t border-gray-100 pb-2 pt-2">
                            <div className="px-2 space-y-1">
                              {subs.map((s) => (
                                <div
                                  key={s.id}
                                  className={`group p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-all duration-200 ${selectedSubtopic?.id === s.id
                                    ? "bg-white text-blue-700 shadow-sm border border-blue-100 ring-1 ring-blue-50"
                                    : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent"
                                    }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSubtopic(s);
                                    setRightTab("videos");
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedSubtopic?.id === s.id ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-gray-400'}`} />
                                    <span className="font-medium text-sm">{s.name}</span>
                                  </div>
                                  {readMap[s.id] && (
                                    <Check className="text-green-500 w-4 h-4" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Divider chevron button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-13 z-30 w-6 h-6 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out"
          style={{
            left: collapsed ? "58px" : "343px", // Sidebar width (70/355) - button width/2 (12)
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
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
                { key: "notes", label: "Notes", icon: <StickyNote /> }
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

            <div className="flex items-center gap-4 ml-4 mr-6">
              {selectedSubtopic && (
                <button
                  onClick={handleMarkAsRead}
                  disabled={readMap[selectedSubtopic.id] || marking}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all
                      ${readMap[selectedSubtopic.id]
                      ? "bg-green-100 text-green-700 border border-green-200 cursor-default"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    }
                    `}
                >
                  {readMap[selectedSubtopic.id] ? (
                    <>
                      <Check size={16} strokeWidth={2.5} />
                      Completed
                    </>
                  ) : (
                    <>
                      {marking ? 'Marking...' : 'Mark as Read'}
                    </>
                  )}
                </button>
              )}
              <div className="flex items-center gap-2 text-sm bg-white border border-gray-300 shadow-sm rounded-full px-4 py-1 font-medium text-gray-700">
                <span>
                  {selectedSubtopic ? selectedSubtopic.name : "No subtopic selected"}
                </span>
              </div>
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
                {rightTab === "videos" &&
                  <StudentVideos
                    subtopicId={selectedSubtopic.id}
                    courseName={course?.name || "Unknown"}
                    topicName={topics.find(t => expandedTopics[t.id])?.name || "Topic"}
                    subtopicName={selectedSubtopic.name}
                    subtopicContent={selectedSubtopic.content}
                    sessionId={chatSessionId}
                    onNewSession={() => setChatSessionId(`course-chat-${courseId}-${uuidv4()}`)}
                  />
                }
                {rightTab === "quizzes" && <StudentQuizEmbed subtopicId={selectedSubtopic.id} />}
                {rightTab === "coding" && <StudentCodingEmbed subtopicId={selectedSubtopic.id} />}
                {rightTab === "notes" && <StudentNotes subtopicId={selectedSubtopic.id} />}

              </>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default CourseDetail;