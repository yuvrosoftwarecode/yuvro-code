import React, { useEffect, useState } from "react";
import { fetchVideosBySubtopic } from "@/services/courseService";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Video = {
  id: string;
  title: string;
  video_link: string;
  ai_context?: string | null;
  sub_topic: string;
};

const StudentVideos = ({ subtopicId }: { subtopicId: string }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isListOpen, setIsListOpen] = useState(true);

  useEffect(() => {
    loadVideos();
  }, [subtopicId]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await fetchVideosBySubtopic(subtopicId);
      setVideos(res);

if (res.length > 0) {
  setSelectedVideo(res[0]);
} else {
  setSelectedVideo(null); // 💡 FIX: Clear previous video
}
    } catch (err) {
      console.error("Failed to load videos", err);
    } finally {
      setLoading(false);
    }
  };

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
          className="w-full h-full rounded-lg border"
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
        className="w-full h-full rounded-lg border"
        allowFullScreen
      />
    );
  };

  return (
    <div className="flex h-full relative">

      {/* ---------------- LEFT: VIDEO PLAYER ---------------- */}
      <div
        className="p-4 flex flex-col transition-all duration-300"
        style={{
          flex: isListOpen ? "1 1 70%" : "1 1 100%",
        }}
      >
        {!selectedVideo ? (
          <div className="text-gray-500 text-center">No video selected</div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-3">{selectedVideo.title}</h2>

            <div className="w-full h-[65vh] bg-black rounded-lg mb-4">
              {renderVideoPlayer(selectedVideo.video_link)}
            </div>

            <Button className="w-full" variant="secondary">
              Mark as Read
            </Button>
          </>
        )}
      </div>

      {/* ---------------- RIGHT: COLLAPSIBLE VIDEO LIST ---------------- */}
      <div
        className="border-l bg-white h-full overflow-y-auto transition-all duration-300"
        style={{
          width: isListOpen ? "300px" : "0px",
        }}
      >
        <div
          className={`p-4 transition-opacity duration-200 ${
            isListOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">Videos</h3>

          {loading ? (
            <div className="text-gray-500">Loading videos...</div>
          ) : videos.length === 0 ? (
            <div className="text-gray-500">No videos available.</div>
          ) : (
            <div className="space-y-3">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className={`p-3 border rounded cursor-pointer hover:bg-gray-100 ${
                    selectedVideo?.id === v.id ? "bg-blue-50 border-blue-300" : "bg-white"
                  }`}
                  onClick={() => setSelectedVideo(v)}
                >
                  <div className="font-medium">{v.title}</div>
                  <div className="text-xs text-blue-600 truncate">
                    {v.video_link}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- TOGGLE BUTTON ---------------- */}
      <Button
        variant="outline"
        size="sm"
        className="absolute right-[310px] top-4 z-10 transition-all duration-300"
        style={{
          right: isListOpen ? "310px" : "10px",
        }}
        onClick={() => setIsListOpen(!isListOpen)}
      >
        {isListOpen ? (
          <>
            <ChevronRight className="w-4 h-4 mr-1" />
            Hide
          </>
        ) : (
          <>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Videos
          </>
        )}
      </Button>
    </div>
  );
};

export default StudentVideos;
