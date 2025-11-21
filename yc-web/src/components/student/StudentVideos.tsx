import { useEffect, useState } from "react";
import { fetchVideosBySubtopic } from "@/services/courseService";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CodeEditor from "../CodeEditor";


type Video = {
  id: string;
  title: string;
  video_link: string;
  ai_context?: string | null;
  sub_topic: string;
};

const StudentVideos = ({ subtopicId }: { subtopicId: string }) => {
  const [editorValue, setEditorValue] = useState("# Write your solution here\n");
  const [language, setLanguage] = useState("python");
  const handleEditorChange = (value: string | undefined) => {
    setEditorValue(value || "");
  };
  const handleRunCode = () => {
    // Implement code execution logic here
    alert("Run code: " + editorValue);
  };
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // 👇 For draggable resizer
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

  // 👇 Draggable handlers
  const startDragging = () => setDragging(true);
  const stopDragging = () => setDragging(false);

  const onDrag = (e: MouseEvent) => {
    if (!dragging) return;

    const newWidth = (e.clientX / window.innerWidth) * 100;

    // clamp to avoid crazy resizing
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

  return (
  <div className="flex h-full relative select-none">
    {/* LEFT VIDEO PANEL */}
    <div
      className={`p-4 flex flex-col transition-all duration-75 ${dragging ? "pointer-events-none" : ""}`}
      style={{ width: isCodeEditorOpen ? `${videoWidth}%` : "100%" }}
    >
      {!selectedVideo ? (
        <div className="text-gray-500 text-center">No video selected</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 gap-4">
            <h2 className="text-lg font-semibold m-0">{selectedVideo.title}</h2>
          </div>
          {/* Video wrapper prevents iframe mouse capture */}
          <div
            className={`w-full h-[65vh] bg-black rounded-lg mb-4 ${dragging ? "pointer-events-none" : ""}`}
          >
            {renderVideoPlayer(selectedVideo.video_link)}
          </div>
        </>
      )}
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

