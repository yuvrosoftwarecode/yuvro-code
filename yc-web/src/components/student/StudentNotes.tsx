import React, { useEffect, useState } from "react";
import { fetchNotesBySubtopic, Note } from "@/services/courseService";
import { Card, CardContent } from "@/components/ui/card";

const StudentNotes = ({ subtopicId }: { subtopicId: string }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

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
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-muted-foreground">Loading notes...</div>;

  if (notes.length === 0)
    return <div className="text-muted-foreground">No notes available.</div>;

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id}>
          <CardContent className="p-4 whitespace-pre-wrap">
            {note.content}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudentNotes;
