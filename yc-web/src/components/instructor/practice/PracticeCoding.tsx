import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash } from "lucide-react";
import { toast } from "sonner";

import {
  fetchPracticeCodingProblemsByTopic,
  createPracticeCodingProblem,
  updatePracticeCodingProblem,
  deletePracticeCodingProblem,
} from "@/services/courseService";

type Topic = {
  id: string;
  name: string;
};

type Problem = {
  id: string;
  title: string;
  description: string;
  test_cases_basic?: any[];
  test_cases_advanced?: any[];
};

const PracticeCoding: React.FC<{ topic: Topic }> = ({ topic }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Problem | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basic, setBasic] = useState("[]");
  const [advanced, setAdvanced] = useState("[]");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [topic]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPracticeCodingProblemsByTopic(topic.id);
      setProblems(data);
    } catch {
      toast.error("Failed to load practice questions");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setTitle("");
    setDescription("");
    setBasic("[]");
    setAdvanced("[]");
    setModalOpen(true);
  };

  const openEdit = (p: Problem) => {
    setMode("edit");
    setEditing(p);
    setTitle(p.title);
    setDescription(p.description);
    setBasic(JSON.stringify(p.test_cases_basic ?? [], null, 2));
    setAdvanced(JSON.stringify(p.test_cases_advanced ?? [], null, 2));
    setModalOpen(true);
  };

  const save = async () => {
    if (!title.trim()) return toast.error("Title is required");

    let basicCases = [];
    let advancedCases = [];

    try {
      basicCases = JSON.parse(basic);
      if (!Array.isArray(basicCases)) throw "";
    } catch {
      return toast.error("Invalid basic test cases JSON");
    }

    try {
      advancedCases = JSON.parse(advanced);
      if (!Array.isArray(advancedCases)) throw "";
    } catch {
      return toast.error("Invalid advanced test cases JSON");
    }

    const payload = {
      category: "practice",
      topic: topic.id,
      sub_topic: null,
      title,
      description,
      test_cases_basic: basicCases,
      test_cases_advanced: advancedCases,
    };

    try {
      if (mode === "create") {
        const created = await createPracticeCodingProblem(payload);
        setProblems((prev) => [...prev, created]);
      } else if (editing) {
        const updated = await updatePracticeCodingProblem(editing.id, payload);
        setProblems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await deletePracticeCodingProblem(deleteId);
      setProblems((p) => p.filter((x) => x.id !== deleteId));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Practice Coding Problems</h3>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus /> Add Problem
        </Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : problems.length === 0 ? (
        <div className="text-sm text-muted-foreground">No practice questions yet</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Problems</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="max-h-[60vh] p-4 space-y-3">
              {problems.map((p) => (
                <div key={p.id} className="border rounded p-3 flex justify-between">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => openEdit(p)}><Edit /></Button>
                    <Button variant="destructive" onClick={() => setDeleteId(p.id)}>
                      <Trash />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Add Problem" : "Edit Problem"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <Label>Basic Test Cases</Label>
              <textarea className="w-full border rounded p-2" value={basic} onChange={(e) => setBasic(e.target.value)} />
            </div>

            <div>
              <Label>Advanced Test Cases</Label>
              <textarea className="w-full border rounded p-2" value={advanced} onChange={(e) => setAdvanced(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Problem?</DialogTitle>
          </DialogHeader>

          <div className="py-2">This action cannot be undone.</div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PracticeCoding;
