import React, { useEffect, useState } from "react";
import { fetchNotesBySubtopic, createNote, updateNote, deleteNote } from "@/services/courseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash, Edit, Plus, FileText } from "lucide-react";
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
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* NOTES LIST */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-medium text-slate-700 mb-2">No notes yet</h4>
            <p className="text-slate-500 mb-4">Create your first note to document this subtopic</p>
            <Button onClick={openCreateModal} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Note
            </Button>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">{note.content}</div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openEditModal(note)}
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeNote(note.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Note" : "Add Note"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Note Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your note content here..."
                rows={8}
                className="resize-none mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                You can use line breaks and formatting in your notes
              </p>
            </div>
          </div>

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
