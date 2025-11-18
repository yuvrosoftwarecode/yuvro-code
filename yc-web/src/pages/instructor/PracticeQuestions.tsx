// src/pages/instructor/PracticeQuestions.tsx
import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Plus, Edit, Trash } from "lucide-react";
import { toast } from "sonner";

import {
  fetchCourses,
  fetchTopicsByCourse,
  createTopic,
  updateTopic,
  deleteTopic
} from "@/services/courseService";

import PracticeCoding from "@/components/instructor/practice/PracticeCoding";

type Course = {
  id: string;
  name: string;
  short_code?: string | null;
  category: string;
};

type Topic = {
  id: string;
  name: string;
  order_index: number;
  course: string;
};

const PracticeQuestions: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [topicsMap, setTopicsMap] = useState<Record<string, Topic[]>>({});
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Modal state for topics
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicModalMode, setTopicModalMode] = useState<"create" | "edit">("create");
  const [topicEditing, setTopicEditing] = useState<Topic | null>(null);
  const [topicNameValue, setTopicNameValue] = useState("");
  const [topicOrderValue, setTopicOrderValue] = useState<number | null>(null);
  const [savingTopic, setSavingTopic] = useState(false);

  const [confirmDeleteTopicId, setConfirmDeleteTopicId] = useState<string | null>(null);
  const [deletingTopic, setDeletingTopic] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await fetchCourses();
      setCourses(data);

      const expandState: Record<string, boolean> = {};
      data.forEach((c) => (expandState[c.id] = false));
      setExpandedCourses(expandState);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  const toggleCourse = async (courseId: string) => {
  const isOpen = expandedCourses[courseId];

  // If opening this course → close all others
  const newState: Record<string, boolean> = {};
  courses.forEach((c) => {
    newState[c.id] = c.id === courseId ? !isOpen : false;
  });

  // Load topics only when expanding
  if (!isOpen && !topicsMap[courseId]) {
    setLoadingTopics(true);
    try {
      const t = await fetchTopicsByCourse(courseId);
      setTopicsMap((prev) => ({ ...prev, [courseId]: t }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load topics");
    } finally {
      setLoadingTopics(false);
    }
  }

  setExpandedCourses(newState);
};


  // ---------------------------
  // Topic CRUD
  // ---------------------------
  const openCreateTopicModal = (courseId: string) => {
    setTopicModalMode("create");
    setTopicEditing({ id: "", course: courseId, name: "", order_index: 0 });
    setTopicNameValue("");
    setTopicOrderValue(null);
    setIsTopicModalOpen(true);
  };

  const openEditTopicModal = (topic: Topic) => {
    setTopicModalMode("edit");
    setTopicEditing(topic);
    setTopicNameValue(topic.name);
    setTopicOrderValue(topic.order_index);
    setIsTopicModalOpen(true);
  };

  const saveTopic = async () => {
    if (!topicEditing) return;
    if (!topicNameValue.trim()) return toast.error("Topic name required");

    setSavingTopic(true);
    try {
      if (topicModalMode === "create") {
        const payload = {
          name: topicNameValue.trim(),
          course: (topicEditing as any).course,
          order_index: topicOrderValue ?? 0,
        };
        const created = await createTopic(payload);

        setTopicsMap((prev) => {
          const courseId = (topicEditing as any).course;
          const arr = prev[courseId] || [];
          return { ...prev, [courseId]: [...arr, created] };
        });

        toast.success("Topic added");

      } else if (topicModalMode === "edit") {
        const payload = {
          name: topicNameValue.trim(),
          order_index: topicOrderValue ?? topicEditing.order_index,
        };

        const updated = await updateTopic(topicEditing.id, payload);

        setTopicsMap((prev) => {
          const arr = prev[topicEditing.course] || [];
          return {
            ...prev,
            [topicEditing.course]: arr.map((t) => (t.id === updated.id ? updated : t)),
          };
        });

        if (selectedTopic?.id === updated.id) {
          setSelectedTopic(updated);
        }

        toast.success("Topic updated");
      }

      setIsTopicModalOpen(false);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save topic");
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: string, courseId: string) => {
    setDeletingTopic(true);
    try {
      await deleteTopic(topicId);

      setTopicsMap((prev) => ({
        ...prev,
        [courseId]: prev[courseId].filter((t) => t.id !== topicId),
      }));

      if (selectedTopic?.id === topicId) setSelectedTopic(null);

      toast.success("Topic deleted");

    } catch (err) {
      console.error(err);
      toast.error("Failed to delete topic");
    } finally {
      setDeletingTopic(false);
      setConfirmDeleteTopicId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <div className="flex-1 overflow-hidden h-[calc(100vh-64px)]">
        <div className="flex h-full p-4 gap-6">

          {/* ---------------- LEFT PANEL ---------------- */}
          <div className="bg-white rounded-md shadow-sm flex flex-col"
               style={{ flexBasis: "30%", minWidth: 300 }}>

            <div className="p-4 overflow-auto flex-1">

              <h3 className="text-md font-semibold mb-3">Practice Questions</h3>

              {loadingCourses ? (
                <div className="text-sm text-muted-foreground">Loading courses...</div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => {
                    const expanded = expandedCourses[course.id];
                    const topics = topicsMap[course.id] || [];

                    return (
                      <Card key={course.id} className="border">
                        <CardHeader
                          className="cursor-pointer"
                          onClick={() => toggleCourse(course.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{course.name}</CardTitle>
                              {course.short_code && (
                                <p className="text-xs text-muted-foreground">
                                  Code: {course.short_code}
                                </p>
                              )}
                            </div>

                            {expanded ? <ChevronUp /> : <ChevronDown />}
                          </div>
                        </CardHeader>

                        {expanded && (
                          <CardContent className="pt-2 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">Topics</h4>
                              <Button
                                size="sm"
                                onClick={() => openCreateTopicModal(course.id)}
                                className="flex items-center gap-1"
                              >
                                <Plus size={14} /> Add
                              </Button>
                            </div>

                            <div className="space-y-2">
                              {loadingTopics && (
                                <p className="text-xs text-muted-foreground">Loading topics...</p>
                              )}

                              {!loadingTopics && topics.length === 0 && (
                                <p className="text-xs text-muted-foreground">No topics</p>
                              )}

                              {!loadingTopics &&
                                topics.map((t) => (
                                  <div
                                    key={t.id}
                                    className={`p-2 rounded border flex items-center justify-between cursor-pointer ${
                                      selectedTopic?.id === t.id
                                        ? "bg-sky-50 border-sky-300"
                                        : "bg-white"
                                    }`}
                                    onClick={() => setSelectedTopic(t)}
                                  >
                                    <div>
                                      <div className="font-medium text-sm">{t.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Order: {t.order_index}
                                      </div>
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditTopicModal(t);
                                        }}
                                      >
                                        <Edit size={16} />
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmDeleteTopicId(t.id);
                                        }}
                                      >
                                        <Trash size={16} />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

          {/* ---------------- RIGHT PANEL ---------------- */}
          <div className="bg-white rounded-md shadow-sm flex-1 p-6 overflow-auto">
            {!selectedTopic ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-lg font-medium">Select a topic to manage Practice Questions</p>
                <p className="text-sm">Then add or edit coding problems</p>
              </div>
            ) : (
              <PracticeCoding topic={selectedTopic} />
            )}
          </div>
        </div>
      </div>

      {/* Topic Modal */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {topicModalMode === "create" ? "Add Topic" : "Edit Topic"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Topic Name</Label>
              <Input
                value={topicNameValue}
                onChange={(e) => setTopicNameValue(e.target.value)}
              />
            </div>

            <div>
              <Label>Order Index (optional)</Label>
              <Input
                type="number"
                value={topicOrderValue ?? ""}
                onChange={(e) =>
                  setTopicOrderValue(e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTopicModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTopic} disabled={savingTopic}>
              {savingTopic
                ? "Saving..."
                : topicModalMode === "create"
                ? "Create Topic"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Topic Modal */}
      <Dialog open={!!confirmDeleteTopicId} onOpenChange={() => setConfirmDeleteTopicId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
          </DialogHeader>

          <p className="py-2">Are you sure you want to delete this topic?</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteTopicId(null)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={deletingTopic}
              onClick={() => {
                if (confirmDeleteTopicId && topicEditing) {
                  handleDeleteTopic(confirmDeleteTopicId, topicEditing.course);
                }
              }}
            >
              {deletingTopic ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PracticeQuestions;
