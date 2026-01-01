import React, { useEffect, useState } from "react";
import { fetchNotesBySubtopic, createNote, deleteNote, Note } from "@/services/courseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Trash2, Plus, StickyNote, BookOpen } from "lucide-react";

const StudentNotes = ({ subtopicId }: { subtopicId: string }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [subtopicId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetchNotesBySubtopic(subtopicId);
      setNotes(res || []);
    } catch (err) {
      console.error("Failed to load notes", err);
      toast.error("Failed to load notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsCreating(true);
    try {
      await createNote({
        sub_topic: subtopicId,
        content: newNoteContent,
        // Backend handles user association
      });
      setNewNoteContent("");
      toast.success("Note added successfully");
      loadNotes(); // Refresh list
    } catch (err) {
      console.error("Failed to create note", err);
      toast.error("Failed to save note");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success("Note deleted");
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error("Failed to delete note", err);
      toast.error("Failed to delete note");
    }
  };

  if (loading)
    return <div className="text-muted-foreground p-4">Loading notes...</div>;

  // Filter notes
  // Materials: Created by instructors (or admins) - For now assuming user.role check or ID check
  // Since we updated the backend to return user ID, we check against current user ID
  const myNotes = notes.filter(n => n.user === user?.id);
  const materials = notes.filter(n => n.user !== user?.id);

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="materials" className="w-full flex-1 flex flex-col">
        <div className="px-6 pt-4 pb-2 border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="my-notes" className="flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              My Notes
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <TabsContent value="materials" className="mt-0 space-y-4">
            {materials.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No study materials available for this topic yet.</p>
              </div>
            ) : (
              materials.map((note) => (
                <Card key={note.id} className="border-l-4 border-l-blue-500 shadow-sm">
                  <CardContent className="p-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {note.content}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="my-notes" className="mt-0 space-y-6">
            {/* Create Note Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Add New Note</h3>
              <Textarea
                placeholder="Write your key takeaways here..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[100px] bg-gray-50 focus:bg-white transition-colors resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateNote}
                  disabled={!newNoteContent.trim() || isCreating}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {isCreating ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              {myNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">You haven't added any notes yet.</p>
                </div>
              ) : (
                myNotes.map((note) => (
                  <Card key={note.id} className="group hover:border-blue-200 transition-colors shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed flex-1">
                          {note.content}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 -mt-1 -mr-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-3 text-[10px] text-gray-400 font-medium border-t border-gray-50 pt-2">
                        {new Date(note.created_at || "").toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default StudentNotes;
