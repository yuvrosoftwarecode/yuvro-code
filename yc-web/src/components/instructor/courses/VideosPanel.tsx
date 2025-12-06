import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash, Edit, Plus } from "lucide-react";

import {
  fetchVideosBySubtopic,
  createVideo,
  updateVideo,
  deleteVideo,
} from "@/services/courseService";

type Video = {
  id: string;
  title: string;
  video_link: string;
  ai_context?: string | null;
  sub_topic: string;
};

const VideosPanel = ({ subtopic }: { subtopic: any }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [context, setContext] = useState("");

  // Delete Confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, [subtopic]);

  const loadVideos = async () => {
    if (!subtopic) return;
    setLoading(true);

    try {
      const res = await fetchVideosBySubtopic(subtopic.id);
      setVideos(res);
    } catch {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  // OPEN CREATE
  const openCreateModal = () => {
    setMode("create");
    setEditingVideo(null);
    setTitle("");
    setLink("");
    setContext("");
    setIsModalOpen(true);
  };

  // OPEN EDIT
  const openEditModal = (v: Video) => {
    setMode("edit");
    setEditingVideo(v);
    setTitle(v.title);
    setLink(v.video_link);
    setContext(v.ai_context || "");
    setIsModalOpen(true);
  };

  // SAVE (Create or Update)
  const saveVideo = async () => {
    if (!title.trim() || !link.trim()) {
      toast.error("Title and link are required");
      return;
    }

    try {
      const payload = {
        title,
        video_link: link,
        ai_context: context,
        sub_topic: subtopic.id,
      };

      if (mode === "create") {
        const newVid = await createVideo(payload);
        setVideos((prev) => [...prev, newVid]);
        toast.success("Video created");
      } else if (editingVideo) {
        const updated = await updateVideo(editingVideo.id, payload);
        setVideos((prev) =>
          prev.map((v) => (v.id === updated.id ? updated : v))
        );
        toast.success("Video updated");
      }

      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  // DELETE VIDEO
  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      await deleteVideo(confirmDeleteId);
      setVideos((prev) => prev.filter((v) => v.id !== confirmDeleteId));
      toast.success("Video deleted");
    } catch {
      toast.error("Failed to delete");
    }

    setConfirmDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Videos</h3>
        <Button 
          onClick={openCreateModal} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500">Loading videos...</div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-medium text-slate-700 mb-2">No videos yet</h4>
          <p className="text-slate-500 mb-4">Start by adding your first video to this subtopic</p>
          <Button onClick={openCreateModal} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add First Video
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 mb-2">{v.title}</h4>
                  <a
                    href={v.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {v.video_link}
                  </a>
                  {v.ai_context && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                      <span className="font-medium">AI Context:</span> {v.ai_context}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(v)}
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDeleteId(v.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add Video" : "Edit Video"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Video URL</Label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">AI Context <span className="text-slate-500">(optional)</span></Label>
              <Input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Additional context for AI processing"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveVideo}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={() => setConfirmDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video</DialogTitle>
          </DialogHeader>

          <p className="py-3">Are you sure you want to delete this video?</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideosPanel;
