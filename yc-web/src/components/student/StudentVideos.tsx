import { useEffect, useState } from "react";
import { fetchVideosBySubtopic } from "@/services/courseService";
import { ChevronLeft, ChevronRight, Sparkles, Video as VideoIcon, MessageSquare } from "lucide-react";
import CodeEditor from "../CodeEditor";
import AIChatContainer from "./LearnCertify/AIChatWidget/AIChatContainer";

type Video = {
  id: string;
  title: string;
  video_link: string;
  ai_context?: string | null;
  sub_topic: string;
};

type StudentVideosProps = {
  subtopicId: string;
  courseName: string;
  topicName: string;
  subtopicName: string;
  subtopicContent?: string | null;
  sessionId: string;
  onNewSession: () => void;
};

const StudentVideos = ({
  subtopicId,
  courseName,
  topicName,
  subtopicName,
  subtopicContent,
  sessionId,
  onNewSession
}: StudentVideosProps) => {
  const [editorValue, setEditorValue] = useState("# Write your solution here\n");
  const [language, setLanguage] = useState("python");

  const [viewMode, setViewMode] = useState<"video" | "chat">("video");

  const handleEditorChange = (value: string | undefined) => {
    setEditorValue(value || "");
  };
  const handleRunCode = () => {
    alert("Run code: " + editorValue);
  };
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const [videoWidth, setVideoWidth] = useState(60); // % width of video panel
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [subtopicId]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await fetchVideosBySubtopic(subtopicId);
      setVideos(res);

      if (res.length > 0) setSelectedVideo(res[0]);
      else setSelectedVideo(null);
    } catch (err) {
      console.error("Failed to load videos", err);
    } finally {
      setLoading(false);
    }
  };

  const startDragging = () => setDragging(true);
  const stopDragging = () => setDragging(false);

  const onDrag = (e: MouseEvent) => {
    if (!dragging) return;

    const newWidth = (e.clientX / window.innerWidth) * 100;

    if (newWidth >= 30 && newWidth <= 80) {
      setVideoWidth(newWidth);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [dragging]);

  const renderVideoPlayer = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";

      if (url.includes("youtu.be")) {
        videoId = url.split("youtu.be/")[1];
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      }

      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full rounded-lg"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      );
    }

    if (url.endsWith(".mp4")) {
      return <video src={url} controls className="w-full h-full rounded-lg" />;
    }

    return (
      <iframe
        src={url}
        className="w-full h-full rounded-lg"
        allowFullScreen
      />
    );
  };

  const getVideoContext = () => {
    let ctx = `Course: ${courseName}.\n`;
    ctx += `Topic: ${topicName}.\n`;
    ctx += `Subtopic: ${subtopicName}.\n`;
    if (subtopicContent) ctx += `Content: ${subtopicContent}\n`;
    if (selectedVideo) {
      ctx += `Current Video: ${selectedVideo.title}.\n`;
      if (selectedVideo.ai_context) ctx += `Video Context: ${selectedVideo.ai_context}\n`;
    }
    return ctx;
  };

  return (
    <div className="flex h-full relative select-none">
      {/* LEFT PANEL (VIDEO or CHAT) */}
      <div
        className={`flex flex-col transition-all duration-75 ${dragging ? "pointer-events-none" : ""}`}
        style={{ width: isCodeEditorOpen ? `${videoWidth}%` : "100%" }}
      >
        {/* Tab Header */}
        <div className="flex items-center gap-1 p-2 px-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setViewMode("video")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${viewMode === "video" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
            `}
          >
            <VideoIcon className="w-4 h-4" />
            Video
          </button>
          <button
            onClick={() => setViewMode("chat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${viewMode === "chat" ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
            `}
          >
            <Sparkles className="w-4 h-4" />
            AI Buddy
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 overflow-hidden relative">
          {/* We use hidden to keep video state (playing/buffered) alive when switching to chat */}
          <div className={`w-full h-full flex flex-col ${viewMode === 'video' ? 'block' : 'hidden'}`}>
            {!selectedVideo ? (
              <div className="text-gray-500 text-center mt-10">No video selected</div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3 gap-4">
                  <h2 className="text-lg font-semibold m-0">{selectedVideo.title}</h2>
                </div>
                <div
                  className={`w-full h-[65vh] bg-black rounded-lg mb-4 ${dragging ? "pointer-events-none" : ""}`}
                >
                  {renderVideoPlayer(selectedVideo.video_link)}
                </div>
              </>
            )}
          </div>

          <div className={`w-full h-full transition-opacity duration-200 ${viewMode === 'chat' ? 'opacity-100 z-10' : 'opacity-0 -z-10 absolute inset-0'}`}>
            <AIChatContainer
              className="w-full h-full shadow-none border-none"
              welcomeMessage={`Hi! I can help you with understanding "${selectedVideo?.title || subtopicName}".`}
              persistenceKey={sessionId}
              chatTitle="AI Learning Buddy"
              contextGetter={getVideoContext}
              onNewChat={onNewSession}
              showHistory={true}
            />
          </div>
        </div>
      </div>

      {/* DRAGGABLE RESIZER */}
      {isCodeEditorOpen && (
        <div
          onMouseDown={startDragging}
          className={`w-1 h-full cursor-ew-resize bg-gray-300 hover:bg-gray-400 transition-colors duration-150 z-20 ${dragging ? "bg-blue-500" : ""}`}
        ></div>
      )}

      {/* CODE EDITOR PANEL & TOGGLE BUTTON */}
      {isCodeEditorOpen ? (
        <div
          className="p-2 pt-2 flex flex-col bg-white h-full rounded-xl"
          style={{ width: `${100 - videoWidth}%` }}
        >
          <div className="flex justify-end gap-2 mb-2">
            <button
              onClick={() => setIsCodeEditorOpen(false)}
              className="bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Hide Code Editor
            </button>
            <button
              onClick={handleRunCode}
              className="bg-green-100 text-green-900 font-semibold border border-green-300 px-3 py-1.5 rounded-lg shadow-sm hover:bg-green-200 transition-colors text-sm flex items-center gap-2"
            >
              Run Code
            </button>
          </div>
          <CodeEditor
            value={editorValue}
            onChange={setEditorValue}
            language={language}
            onLanguageChange={setLanguage}
            height="100%"
          />
        </div>
      ) : (
        <div className="absolute top-2 right-4 z-30 flex gap-2">

          <button
            onClick={() => setIsCodeEditorOpen(true)}
            className="bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            Show Code Editor
          </button>

        </div>
      )}
    </div>
  );
};

export default StudentVideos;

