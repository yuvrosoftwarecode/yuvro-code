// src/pages/instructor/SkillTest.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SkillTestMCQs from "./../../components/instructor/skilltest/SkillTestMCQs";
import SkillTestCoding from "./../../components/instructor/skilltest/SkillTestCoding";
import Navigation from "@/components/Navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  fetchCourses,
  fetchTopicsByCourse,
  createTopic,
  updateTopic,
  deleteTopic,
  fetchCourseInstructors, // ✅ for role-based filtering
} from "@/services/courseService";

type Course = {
  id: string;
  short_code?: string | null;
  name: string;
  category: string;
};

type Topic = {
  id: string;
  name: string;
  order_index: number;
  course: string;
};

const SkillTest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Topic modal (CRUD)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicModalMode, setTopicModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [topicEditing, setTopicEditing] = useState<Topic | null>(null);
  const [topicNameValue, setTopicNameValue] = useState("");
  const [topicOrderValue, setTopicOrderValue] = useState<number | null>(null);
  const [savingTopic, setSavingTopic] = useState(false);

  // Delete confirmation
  const [confirmDeleteTopicId, setConfirmDeleteTopicId] = useState<
    string | null
  >(null);
  const [deletingTopic, setDeletingTopic] = useState(false);

  // right-panel tab
  const [rightTab, setRightTab] = useState<"mcqs" | "coding">("mcqs");

  useEffect(() => {
    loadCourses();
  }, []);

  // -------------------------------------------------------
  // ROLE-BASED COURSE FILTERING (Admin vs Instructor)
  // -------------------------------------------------------
  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await fetchCourses();

      // ADMIN → sees ALL courses
      if (user?.role === "admin") {
        setCourses(data);
      }
      // INSTRUCTOR → sees ONLY assigned courses
      else if (user?.role === "instructor") {
        const myCourses: Course[] = [];

        for (const c of data) {
          const instructors = await fetchCourseInstructors(c.id);
          // API shape: [{ id, name, email }]
          const isAssigned = instructors.some(
            (inst: any) => inst.id === user.id
          );
          if (isAssigned) myCourses.push(c);
        }

        setCourses(myCourses);
      } else {
        // other roles: no courses
        setCourses([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSelectCourse = async (course: Course) => {
    setSelectedCourse(course);
    setSelectedTopic(null);
    setTopics([]);
    setLoadingTopics(true);
    try {
      const t = await fetchTopicsByCourse(course.id);
      setTopics(t);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load topics");
    } finally {
      setLoadingTopics(false);
    }
  };

  // Topic CRUD helpers
  const openCreateTopicModal = () => {
    if (!selectedCourse) {
      toast.error("Select a course first");
      return;
    }
    setTopicModalMode("create");
    setTopicEditing(null);
    setTopicNameValue("");
    setTopicOrderValue(null);
    setIsTopicModalOpen(true);
  };

  const openEditTopicModal = (t: Topic) => {
    setTopicModalMode("edit");
    setTopicEditing(t);
    setTopicNameValue(t.name);
    setTopicOrderValue(t.order_index ?? null);
    setIsTopicModalOpen(true);
  };

  const saveTopic = async () => {
    if (!selectedCourse) return toast.error("No course selected");
    if (!topicNameValue.trim()) return toast.error("Topic name required");

    setSavingTopic(true);
    try {
      if (topicModalMode === "create") {
        const payload = {
          name: topicNameValue.trim(),
          course: selectedCourse.id,
          order_index: topicOrderValue ?? 0,
        };
        const created = await createTopic(payload);
        setTopics((prev) => [...prev, created]);
        toast.success("Topic added");
      } else if (topicEditing) {
        const payload = {
          name: topicNameValue.trim(),
          order_index: topicOrderValue ?? topicEditing.order_index,
        };
        const updated = await updateTopic(topicEditing.id, payload);
        setTopics((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        toast.success("Topic updated");
      }
      setIsTopicModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save topic");
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId?: string) => {
    if (!topicId) return;
    setDeletingTopic(true);
    try {
      await deleteTopic(topicId);
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
      if (selectedTopic?.id === topicId) setSelectedTopic(null);
      toast.success("Topic deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to delete topic");
    } finally {
      setDeletingTopic(false);
      setConfirmDeleteTopicId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <div className="flex-1 overflow-hidden h-[calc(100vh-64px)]">
        <div className="h-full w-full p-4 md:p-6 flex gap-6">
          {/* LEFT: Courses -> Topics */}
          <div
            className="bg-white rounded-md shadow-sm flex flex-col"
            style={{ flexBasis: "30%", minWidth: 300, maxWidth: 560 }}
          >
            <div className="p-4 flex-1 overflow-auto">
              <h3 className="text-md font-semibold mb-4">Courses</h3>

              {loadingCourses ? (
                <div className="text-sm text-muted-foreground">
                  Loading courses...
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No courses found
                    </div>
                  )}

                  {courses.map((course) => {
                    const expanded = selectedCourse?.id === course.id;

                    return (
                      <div
                        key={course.id}
                        className="border rounded bg-white"
                      >
                        {/* Course Header */}
                        <div
                          className={`p-3 flex items-center justify-between cursor-pointer ${
                            expanded
                              ? "bg-sky-50 border-sky-300"
                              : ""
                          }`}
                          onClick={() =>
                            expanded
                              ? setSelectedCourse(null)
                              : handleSelectCourse(course)
                          }
                        >
                          <div>
                            <div className="font-medium">
                              {course.name}
                            </div>
                            {course.short_code && (
                              <div className="text-xs text-muted-foreground">
                                Code: {course.short_code}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {course.category}
                          </div>
                        </div>

                        {/* Topics List — visible only if course expanded */}
                        {expanded && (
                          <div className="p-3 border-t bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium">
                                Topics
                              </h4>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCreateTopicModal();
                                }}
                                className="flex items-center gap-2"
                              >
                                <Plus size={14} /> Add
                              </Button>
                            </div>

                            {loadingTopics ? (
                              <div className="text-sm text-muted-foreground">
                                Loading topics...
                              </div>
                            ) : topics.length === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                No topics
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {topics.map((topic) => (
                                  <div
                                    key={topic.id}
                                    className={`p-2 rounded border flex items-center justify-between cursor-pointer ${
                                      selectedTopic?.id === topic.id
                                        ? "bg-white border-sky-300"
                                        : "bg-white"
                                    }`}
                                    onClick={() =>
                                      setSelectedTopic(topic)
                                    }
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {topic.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Order: {topic.order_index}
                                      </div>
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditTopicModal(topic);
                                        }}
                                      >
                                        <Edit size={16} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmDeleteTopicId(
                                            topic.id
                                          );
                                        }}
                                      >
                                        <Trash size={16} />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Tabs (MCQs / Coding) */}
          <div
            className="bg-white rounded-md shadow-sm overflow-auto flex flex-col"
            style={{ flexBasis: "70%" }}
          >
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-md text-sm ${
                    rightTab === "mcqs"
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setRightTab("mcqs")}
                >
                  MCQs
                </button>
                <button
                  className={`px-3 py-1 rounded-md text-sm ${
                    rightTab === "coding"
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setRightTab("coding")}
                >
                  Coding Problems
                </button>
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedTopic
                  ? `Selected Topic: ${selectedTopic.name}`
                  : "No topic selected"}
              </div>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              {!selectedTopic ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="text-lg font-medium mb-2">
                    Select a topic on the left
                  </div>
                  <div className="text-sm">
                    Then use these tabs to manage MCQs and Skill Test coding
                    problems
                  </div>
                </div>
              ) : (
                <div>
                  {rightTab === "mcqs" && (
                    <SkillTestMCQs topic={selectedTopic} />
                  )}
                  {rightTab === "coding" && (
                    <SkillTestCoding topic={selectedTopic} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Topic Modal */}
      <Dialog
        open={isTopicModalOpen}
        onOpenChange={setIsTopicModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {topicModalMode === "create"
                ? "Add Topic"
                : "Edit Topic"}
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
                  setTopicOrderValue(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTopicModalOpen(false)}
            >
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

      {/* Delete confirmation for topic */}
      <Dialog
        open={!!confirmDeleteTopicId}
        onOpenChange={() => setConfirmDeleteTopicId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p>Are you sure you want to delete this topic?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteTopicId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                confirmDeleteTopicId &&
                handleDeleteTopic(confirmDeleteTopicId)
              }
              disabled={deletingTopic}
            >
              {deletingTopic ? "Deleting..." : "Delete Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillTest;
