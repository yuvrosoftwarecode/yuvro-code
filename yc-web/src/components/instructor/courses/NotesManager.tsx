import React, { useEffect, useState } from "react";
import { fetchNotesBySubtopic, createNote, updateNote, deleteNote } from "@/services/courseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash, Edit, Plus } from "lucide-react";
import { toast } from "sonner";

const NotesManager = ({ subtopicId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!subtopicId) return;
    loadNotes();
  }, [subtopicId]);

  const loadNotes = async () => {
    try {
      const data = await fetchNotesBySubtopic(subtopicId);
      setNotes(data);
    } catch {
      toast.error("Failed to fetch notes");
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentNote(null);
    setContent("");
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setEditMode(true);
    setCurrentNote(note);
    setContent(note.content);
    setIsModalOpen(true);
  };

  const saveNote = async () => {
    if (!content.trim()) return toast.error("Content required");

    try {
      if (editMode && currentNote) {
        const updated = await updateNote(currentNote.id, { content });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        toast.success("Note updated");
      } else {
        const created = await createNote({
          sub_topic: subtopicId,
          content,
        });
        setNotes((prev) => [...prev, created]);
        toast.success("Note created");
      }
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to save note");
    }
  };

  const removeNote = async (id) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  if (loading) return <div>Loading notes...</div>;

  return (
    <div className="space-y-4">
      <Button onClick={openCreateModal} className="flex items-center gap-2">
        <Plus size={16} /> Add Note
      </Button>

      <div className="space-y-3">
        {notes.length === 0 && (
          <div className="text-sm text-muted-foreground">No notes available.</div>
        )}

        {notes.map((note) => (
          <div key={note.id} className="border rounded p-3 flex justify-between items-center">
            <div className="whitespace-pre-wrap">{note.content}</div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => openEditModal(note)}>
                <Edit size={16} />
              </Button>

              <Button variant="destructive" size="sm" onClick={() => removeNote(note.id)}>
                <Trash size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Note" : "Add Note"}
            </DialogTitle>
          </DialogHeader>

          <textarea
            className="border rounded w-full p-2 h-40"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNote}>
              {editMode ? "Save Changes" : "Create Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesManager;
