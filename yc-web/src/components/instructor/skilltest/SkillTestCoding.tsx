// src/pages/instructor/SkillTestCoding.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash } from "lucide-react";
import { toast } from "sonner";

import {
  fetchSkillTestCodingProblemsByTopic,
  createSkillTestCodingProblem,
  updateSkillTestCodingProblem,
  deleteSkillTestCodingProblem,
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

const SkillTestCoding: React.FC<{ topic: Topic }> = ({ topic }) => {
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basicText, setBasicText] = useState("[]");
  const [advancedText, setAdvancedText] = useState("[]");

  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProblems();
  }, [topic]);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await fetchSkillTestCodingProblemsByTopic(topic.id);
      setProblems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Coding Problems");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setEditingProblem(null);
    setTitle("");
    setDescription("");
    setBasicText("[]");
    setAdvancedText("[]");
    setIsModalOpen(true);
  };

  const openEdit = (p: Problem) => {
    setModalMode("edit");
    setEditingProblem(p);
    setTitle(p.title || "");
    setDescription(p.description || "");
    setBasicText(JSON.stringify(p.test_cases_basic ?? [], null, 2));
    setAdvancedText(JSON.stringify(p.test_cases_advanced ?? [], null, 2));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title is required");

    let parsedBasic: any[] = [];
    let parsedAdvanced: any[] = [];

    try {
      parsedBasic = JSON.parse(basicText || "[]");
      if (!Array.isArray(parsedBasic)) return toast.error("Basic test cases must be an array");
    } catch {
      return toast.error("Invalid JSON in Basic test cases");
    }

    try {
      parsedAdvanced = JSON.parse(advancedText || "[]");
      if (!Array.isArray(parsedAdvanced)) return toast.error("Advanced test cases must be an array");
    } catch {
      return toast.error("Invalid JSON in Advanced test cases");
    }

    const payload = {
      category: "skill_test",
      topic: topic.id,
      sub_topic: null,
      title: title.trim(),
      description: description.trim(),
      test_cases_basic: parsedBasic,
      test_cases_advanced: parsedAdvanced,
    };

    setSaving(true);
    try {
      if (modalMode === "create") {
        const created = await createSkillTestCodingProblem(payload);
        setProblems((p) => [...p, created]);
        toast.success("Problem created");
      } else if (editingProblem) {
        const updated = await updateSkillTestCodingProblem(
          editingProblem.id,
          payload
        );
        setProblems((p) =>
          p.map((x) => (x.id === updated.id ? updated : x))
        );
        toast.success("Problem updated");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save problem");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteSkillTestCodingProblem(id);
      setProblems((p) => p.filter((x) => x.id !== id));
      toast.success("Deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete problem");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Skill Test — Coding Problems</h3>
        <Button onClick={openCreate} className="flex gap-2">
          <Plus size={16} /> Add Problem
        </Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : problems.length === 0 ? (
        <div className="text-sm text-muted-foreground">No coding problems yet</div>
      ) : (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Problems</CardTitle>
          </CardHeader>

          <CardContent className="p-0 h-full flex flex-col">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {problems.map((p) => (
                  <div
                    key={p.id}
                    className="border rounded p-3 flex items-start justify-between"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {p.description}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(p)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmDeleteId(p.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Add Problem" : "Edit Problem"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sum of Two Numbers"
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                className="w-full border rounded px-3 py-2 min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a program to add two integers..."
              />
            </div>

            <div>
              <Label>Basic Test Cases (JSON array)</Label>
              <textarea
                className="w-full border rounded px-3 py-2 min-h-[120px]"
                value={basicText}
                onChange={(e) => setBasicText(e.target.value)}
                placeholder='[{"input_data":"1 2","expected_output":"3"}]'
              />
            </div>

            <div>
              <Label>Advanced Test Cases (JSON array)</Label>
              <textarea
                className="w-full border rounded px-3 py-2 min-h-[120px]"
                value={advancedText}
                onChange={(e) => setAdvancedText(e.target.value)}
                placeholder='[{"input_data":"1000 2000","expected_output":"3000"}]'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : modalMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Problem</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p>Are you sure you want to delete this problem?</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillTestCoding;
