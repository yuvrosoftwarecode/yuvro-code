import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../../components/common/Navigation";
import StudentVideos, { LayoutMode } from "./StudentVideos";
import StudentQuizEmbed from "./StudentQuizEmbed";
import StudentCodingEmbed from "./StudentCodingEmbed";
import StudentNotes from "./StudentNotes";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  fetchCourseById,
  fetchTopicsByCourse,
  fetchSubtopicsByTopic,

  markSubtopicVideoWatched,
  fetchUserCourseProgress,
  Course as CourseType
} from "@/services/courseService";
import { fetchQuestions } from "@/services/questionService";
import { Check } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import { PlayCircle, HelpCircle, StickyNote, Code, Sparkles, Video as VideoIcon } from "lucide-react";

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
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<CourseType | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [collapsed, setCollapsed] = useState(false);

  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [subtopicsMap, setSubtopicsMap] = useState<Record<string, Subtopic[]>>({});

  // Progress Map: Stores { subtopicId: progressPercent } (0 - 100)
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  // Keep readMap for backward compatibility (stores is_completed)
  const [readMap, setReadMap] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [chatSessionId, setChatSessionId] = useState(`course-chat-${courseId}-${crypto.randomUUID()}`);
  const [rightTab, setRightTab] = useState<'videos' | 'quizzes' | 'coding' | 'notes'>('videos');

  // Track requirements state (Quiz/Coding presence)
  const [requirements, setRequirements] = useState<{ hasQuiz: boolean; hasCoding: boolean; loaded: boolean }>({
    hasQuiz: false, hasCoding: false, loaded: false
  });

  const [activeProgress, setActiveProgress] = useState<{
    quiz: boolean;
    coding: boolean;
    video: boolean
  }>({ quiz: false, coding: false, video: false });

  // Layout for Videos
  const [videoLayout, setVideoLayout] = useState<LayoutMode>('video');

  // Auto-collapse sidebar for non-video layouts
  useEffect(() => {
    if (videoLayout !== 'video') {
      setCollapsed(true);
    }
  }, [videoLayout]);

  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(
    null
  );






  // Ref to prevent duplicate API calls
  const markingRef = React.useRef<boolean>(false);

  // Reset progress and Check Requirements when subtopic changes
  useEffect(() => {
    setActiveProgress({ quiz: false, coding: false, video: false });
    setRequirements({ hasQuiz: false, hasCoding: false, loaded: false });
    markingRef.current = false; // Reset lock on subtopic change

    if (selectedSubtopic) {
      checkRequirements(selectedSubtopic.id);
    }
  }, [selectedSubtopic?.id]);

  const checkRequirements = async (subtopicId: string) => {
    try {
      // Check for Quiz Existence
      const quizzes = await fetchQuestions({ subtopic: subtopicId, level: 'subtopic', type: 'mcq_single' });
      const hasQuiz = quizzes.length > 0;

      // Check for Coding Existence
      const coding = await fetchQuestions({ subtopic: subtopicId, level: 'subtopic', type: 'coding' });
      const hasCoding = coding.length > 0;

      setRequirements({ hasQuiz, hasCoding, loaded: true });

    } catch (err) {
      console.error("Failed to check requirements", err);
      // Safer to assume nothing and let components drive it.
      setRequirements({ hasQuiz: false, hasCoding: false, loaded: true });
    }
  };



  const handleProgressUpdate = useCallback(async () => {
    if (!selectedSubtopic) return;

    await loadProgress();
  }, [selectedSubtopic, requirements]);

  /* PROGRESS CALCULATION */
  const getTopicProgress = (topicId: string): number => {
    const subs = subtopicsMap[topicId] || [];
    if (subs.length === 0) return 0;

    // Sum of all subtopic percentages
    const totalProgress = subs.reduce((acc, s) => acc + (progressMap[s.id] || 0), 0);

    // Average progress for the topic (0 to 100)
    return Math.round(totalProgress / subs.length);
  };

  useEffect(() => {
    loadPage();
  }, [courseId]);

  const overallProgress = React.useMemo(() => {
    const allSubs = Object.values(subtopicsMap).flat();
    if (allSubs.length === 0) return 0;
    const total = allSubs.reduce((acc, s) => acc + (progressMap[s.id] || 0), 0);
    return Math.round(total / allSubs.length);
  }, [subtopicsMap, progressMap]);

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
        const subtopicPromises = t.map(async (topic) => {
          const subs = await fetchSubtopicsByTopic(topic.id);
          return { topicId: topic.id, subs: subs as Subtopic[] };
        });

        const results = await Promise.all(subtopicPromises);

        results.forEach(({ topicId, subs }) => {
          allSubtopics[topicId] = subs;
        });

        // Find first subtopic for selection
        const firstWithSubs = results.find(r => r.subs.length > 0);

        if (firstWithSubs) {
          firstSubtopic = firstWithSubs.subs[0];
          firstTopicId = firstWithSubs.topicId;
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

      setSubtopicsMap(allSubtopics);

      await loadProgress();
    } catch (err) {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!courseId) return;
    try {
      const progressData = await fetchUserCourseProgress(courseId) as any;
      // console.log("Progress Data", progressData);

      const newProgressMap: Record<string, number> = {};
      const newReadMap: Record<string, boolean> = {};

      // progressData is { subtopicId: { progress_percent: 20.0, is_completed: false, is_videos_watched: boolean... } }
      Object.entries(progressData).forEach(([subId, data]: [string, any]) => {
        newProgressMap[subId] = data.progress_percent || 0;
        newReadMap[subId] = data.is_completed || false;

        // Update active progress if currently selected
        if (selectedSubtopic && selectedSubtopic.id === subId) {
          setActiveProgress({
            quiz: data.is_quiz_completed,
            coding: data.is_coding_completed,
            video: data.is_videos_watched
          });
        }
      });

      setProgressMap(newProgressMap);
      setReadMap(newReadMap);
    } catch (err) {
      console.warn("Could not fetch progress map", err);
    }
  };

  // refresh progress when subtopic changes to ensure activeProgress is correct
  useEffect(() => {
    if (selectedSubtopic && !loading) {
      loadProgress();
    }
  }, [selectedSubtopic, loading]);

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
                <div className="mb-5 px-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>{overallProgress}% Completed</span>
                  </div>
                  <ProgressBar
                    value={overallProgress}
                    height={8}
                    trackClassName="bg-gray-100 rounded-full"
                    barClassName="bg-blue-600 rounded-full"
                  />
                </div>

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
            <div className="ml-4 flex items-center gap-2 text-sm bg-white border border-gray-300 shadow-sm rounded-full px-4 py-1 font-medium text-gray-700 max-w-[30%] min-w-0">
              {selectedSubtopic && (
                <>
                  <span className="text-gray-500 truncate hidden md:block max-w-[120px]" title={topics.find(t => t.id === selectedSubtopic.topic)?.name}>
                    {collapsed
                      ? topics.find(t => t.id === selectedSubtopic.topic)?.name
                      : topics.find(t => t.id === selectedSubtopic.topic)?.name.charAt(0)
                    }
                  </span>
                  <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 hidden md:block" />
                </>
              )}
              <span className="truncate" title={selectedSubtopic ? selectedSubtopic.name : ""}>
                {selectedSubtopic ? selectedSubtopic.name : "No subtopic selected"}
              </span>
            </div>

            <div className="flex gap-2 justify-center flex-1 min-w-0">
              {[
                { key: "videos", label: "Videos", icon: <PlayCircle /> },
                { key: "notes", label: "Notes", icon: <StickyNote /> },
                { key: "quizzes", label: "Quiz", icon: <HelpCircle /> },
                { key: "coding", label: "Coding", icon: <Code /> }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`relative px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2.5 transition-all duration-300 ${rightTab === tab.key
                    ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-100 ring-offset-2"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200"
                    }`}
                  onClick={() => setRightTab(tab.key as any)}
                >
                  {tab.icon}
                  {tab.label}
                  {rightTab === tab.key && (
                    <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 pointer-events-none" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 ml-4 mr-6">


              {/* Layout Selector (Visible only on Videos tab) */}
              {rightTab === "videos" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (selectedSubtopic) {
                        try {
                          await markSubtopicVideoWatched(selectedSubtopic.id);
                          toast.success("Videos marked as watched");
                          // Refresh progress to update UI
                          loadProgress();
                        } catch (e) {
                          toast.error("Failed to mark video watched");
                        }
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors 
                        ${activeProgress.video
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"}`}
                  >
                    {activeProgress.video ? <Check className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                    {activeProgress.video ? "Watched" : "Mark as Watched"}
                  </button>
                  <div className="h-4 w-px bg-gray-300 mx-1" />
                </div>
              )}


            </div>
          </div>

          {/* Content */}
          <div className={rightTab === "coding" ? "flex-1 overflow-hidden" : "p-6 flex-1 overflow-y-auto"}>
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
                    onNewSession={() => setChatSessionId(`course-chat-${courseId}-${crypto.randomUUID()}`)}
                    layout={videoLayout}
                    onLayoutChange={setVideoLayout}
                  />
                }
                {rightTab === "quizzes" && (
                  <StudentQuizEmbed
                    subtopicId={selectedSubtopic.id}
                    onComplete={() => handleProgressUpdate()}
                  />
                )}
                {rightTab === "coding" && (
                  <StudentCodingEmbed
                    subtopicId={selectedSubtopic.id}
                    onComplete={() => handleProgressUpdate()}
                  />
                )}
                {rightTab === "notes" && <StudentNotes subtopicId={selectedSubtopic.id} />}

              </>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default CourseDetail;