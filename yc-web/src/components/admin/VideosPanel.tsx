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
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Videos</h3>
        <Button onClick={openCreateModal} className="flex gap-2">
          <Plus size={16} /> Add Video
        </Button>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="text-sm text-muted-foreground">No videos yet</div>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => (
            <div
              key={v.id}
              className="border p-3 rounded flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{v.title}</div>
                <a
                  href={v.video_link}
                  target="_blank"
                  className="text-xs text-blue-600 underline"
                >
                  {v.video_link}
                </a>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditModal(v)}
                >
                  <Edit size={16} />
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setConfirmDeleteId(v.id)}
                >
                  <Trash size={16} />
                </Button>
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

          <div className="space-y-3 py-2">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label>Video URL</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} />
            </div>

            <div>
              <Label>AI Context (optional)</Label>
              <Input
                value={context}
                onChange={(e) => setContext(e.target.value)}
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
