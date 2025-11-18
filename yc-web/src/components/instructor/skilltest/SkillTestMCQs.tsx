// src/pages/instructor/SkillTestMCQs.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash, Edit, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  fetchSkillTestQuizzesByTopic,
  createSkillTestQuiz,
  updateSkillTestQuiz,
  deleteSkillTestQuiz,
} from "@/services/courseService";

type Topic = {
  id: string;
  name: string;
};

const SkillTestMCQs: React.FC<{ topic: Topic }> = ({ topic }) => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<any | null>(null);

  // Form fields
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  useEffect(() => {
    loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await fetchSkillTestQuizzesByTopic(topic.id);
      setQuizzes(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load MCQs");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setMode("add");
    setEditing(null);
    setQuestion("");
    setOptions(["", ""]);
    setCorrectIndex(null);
    setOpen(true);
  };

  const openEdit = (q: any) => {
    setMode("edit");
    setEditing(q);
    setQuestion(q.question);
    setOptions(q.options);
    setCorrectIndex(q.correct_answer_index);
    setOpen(true);
  };

  const addOption = () => setOptions((prev) => [...prev, ""]);

  const removeOption = (index: number) => {
    if (options.length <= 2) return toast.error("At least 2 options required");
    const updated = [...options];
    updated.splice(index, 1);
    setOptions(updated);
    if (correctIndex === index) setCorrectIndex(null);
  };

  const save = async () => {
    if (!question.trim()) return toast.error("Enter a question");
    if (options.length < 2) return toast.error("At least 2 options required");
    if (options.some((o) => !o.trim()))
      return toast.error("Options cannot be empty");
    if (correctIndex === null)
      return toast.error("Select the correct answer");

    const payload = {
      category: "skill_test",
      topic: topic.id,
      sub_topic: null,
      question: question.trim(),
      options,
      correct_answer_index: correctIndex,
    };

    try {
      if (mode === "add") {
        const created = await createSkillTestQuiz(payload);
        setQuizzes((p) => [...p, created]);
        toast.success("MCQ added");
      } else if (editing) {
        const updated = await updateSkillTestQuiz(editing.id, payload);
        setQuizzes((p) =>
          p.map((x) => (x.id === updated.id ? updated : x))
        );
        toast.success("MCQ updated");
      }

      setOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save MCQ");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteSkillTestQuiz(id);
      setQuizzes((p) => p.filter((q) => q.id !== id));
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete MCQ");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">MCQs (Skill Test)</h3>
        <Button onClick={openAdd} className="flex gap-2">
          <Plus size={16} /> Add MCQ
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : quizzes.length === 0 ? (
        <p className="text-muted-foreground">No MCQs for this topic</p>
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{q.question}</div>
                    <ul className="list-disc ml-5 text-sm mt-1">
                      {q.options.map((opt: string, idx: number) => (
                        <li
                          key={idx}
                          className={
                            idx === q.correct_answer_index
                              ? "text-green-600 font-semibold"
                              : ""
                          }
                        >
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => openEdit(q)}>
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => remove(q.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Add MCQ" : "Edit MCQ"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Question</Label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div>
              <Label>Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[i] = e.target.value;
                      setOptions(updated);
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeOption(i)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              ))}
              <Button className="mt-2" onClick={addOption}>
                + Add Option
              </Button>
            </div>

            <div>
              <Label>Correct Answer</Label>
              <select
                className="border rounded p-2 w-full"
                value={correctIndex ?? ""}
                onChange={(e) =>
                  setCorrectIndex(Number(e.target.value))
                }
              >
                <option value="">Select correct answer</option>
                {options.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Option {idx + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>
              {mode === "add" ? "Create MCQ" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillTestMCQs;
