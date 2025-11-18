// src/pages/instructor/CourseEdit.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, User } from "../../../contexts/AuthContext";
import VideosPanel from "./VideosPanel";
import QuizComponent from "./QuizComponent";
import CodingProblemsManager from "@/components/instructor/courses/CodingProblemsManager";
import NotesManager from "@/components/instructor/courses/NotesManager";
import { fetchAdmins } from "@/services/courseService";
import Navigation from "../../Navigation";

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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash, Edit, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import {
  fetchCourseById,
  updateCourse,
  deleteCourse,
  fetchTopicsByCourse,
  createTopic,
  updateTopic,
  deleteTopic,
  fetchSubtopicsByTopic,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
} from "@/services/courseService";




type Category = "fundamentals" | "programming_languages" | "databases" | "ai_tools";

const CATEGORY_LABELS: Record<Category, string> = {
  fundamentals: "Fundamentals",
  programming_languages: "Programming Languages",
  databases: "Databases",
  ai_tools: "AI Tools",
};

type Course = {
  id: string;
  short_code: string | null;
  name: string;
  category: Category;
};

type Topic = {
  id: string;
  name: string;
  order_index: number;
  course: string;
};

type Subtopic = {
  id: string;
  name: string;
  order_index: number;
  topic: string;
  content?: string | null;
};

const CourseEdit: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: courseId } = useParams<{ id: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [subtopicsMap, setSubtopicsMap] = useState<Record<string, Subtopic[]>>({});

  const [isAssignAdminOpen, setIsAssignAdminOpen] = useState(false);
  const [admins, setAdmins] = useState<User[]>([]);


  useEffect(() => {
  fetchAdmins()
    .then(setAdmins)
    .catch(() => toast.error("Failed to load admins"));
}, []);



  // Course edit
  const [editCourseValues, setEditCourseValues] = useState({
  name: "",
  short_code: "",
  category: "" as Category | "",
  assigned_admin: null as string | null,
});

  const [savingCourse, setSavingCourse] = useState(false);

  // Topic modal
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicModalMode, setTopicModalMode] = useState<"create" | "edit">("create");
  const [topicEditing, setTopicEditing] = useState<Topic | null>(null);
  const [topicNameValue, setTopicNameValue] = useState("");
  const [topicOrderValue, setTopicOrderValue] = useState<number | null>(null);
  const [savingTopic, setSavingTopic] = useState(false);

  // Subtopic modal
  const [isSubtopicModalOpen, setIsSubtopicModalOpen] = useState(false);
  const [subtopicModalMode, setSubtopicModalMode] = useState<"create" | "edit">("create");
  const [subtopicEditing, setSubtopicEditing] = useState<Subtopic | null>(null);
  const [subtopicNameValue, setSubtopicNameValue] = useState("");
  const [subtopicOrderValue, setSubtopicOrderValue] = useState<number | null>(null);
  const [subtopicContentValue, setSubtopicContentValue] = useState("");
  const [savingSubtopic, setSavingSubtopic] = useState(false);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "course" | "topic" | "subtopic";
    id?: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Selected subtopic (for right panel)
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);

  // Right-panel tab state
  const [rightTab, setRightTab] = useState<"videos" | "quizzes" | "coding" | "notes">("videos");

  // Load data
  useEffect(() => {
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleAssignAdmin = async () => {
  if (!course) return;
  setSavingCourse(true);

  try {
    const payload = {
      assigned_admin_id: editCourseValues.assigned_admin || null,
    };

    await updateCourse(course.id, payload);

    toast.success("Admin updated successfully");

    setIsAssignAdminOpen(false);  // CLOSE MODAL
    await loadCourse();           // REFRESH DATA
  } catch (err) {
    toast.error("Failed to assign admin");
    console.error(err);
  } finally {
    setSavingCourse(false);
  }
};


  const loadCourse = async () => {
    if (!courseId) return;
    setLoading(true);

    try {
      const c = await fetchCourseById(courseId);
      setCourse(c);

      setEditCourseValues({
        name: c.name,
        short_code: c.short_code ?? "",
        category: c.category,
        assigned_admin: c.assigned_admin ? c.assigned_admin.id : null,
      });


      const t = await fetchTopicsByCourse(courseId);
      setTopics(t);

      const expanded: Record<string, boolean> = {};
      t.forEach((topic) => (expanded[topic.id] = false));
      setExpandedTopics(expanded);

      setSubtopicsMap({});
      setSelectedSubtopic(null);
    } catch (err) {
      toast.error("Failed to load course");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandTopic = async (topicId: string) => {
    const currentlyExpanded = !!expandedTopics[topicId];

    if (!currentlyExpanded && !subtopicsMap[topicId]) {
      try {
        const subs = await fetchSubtopicsByTopic(topicId);
        setSubtopicsMap((prev) => ({ ...prev, [topicId]: subs }));
      } catch (err) {
        toast.error("Failed to load subtopics");
        console.error(err);
      }
    }

    setExpandedTopics((prev) => ({ ...prev, [topicId]: !currentlyExpanded }));
  };

  // Save course
  const handleSaveCourse = async () => {
  if (!course) return;
  setSavingCourse(true);

  try {
    const payload = {
      name: editCourseValues.name,
      short_code: editCourseValues.short_code || null,
      category: editCourseValues.category,
      assigned_admin: editCourseValues.assigned_admin || null,   // ✅ IMPORTANT FIX
    };

    await updateCourse(course.id, payload);

    toast.success("Course updated successfully");

    setIsAssignAdminOpen(false);  // ✅ CLOSE THE MODAL
    await loadCourse();           // ✅ REFRESH COURSE STATE
  } catch (err) {
    toast.error("Failed to update course");
    console.error(err);
  } finally {
    setSavingCourse(false);
  }
};


  const handleDeleteCourse = async () => {
    if (!course) return;

    setDeleting(true);
    try {
      await deleteCourse(course.id);
      toast.success("Course deleted");
      navigate("/admin/courses");
    } catch (err) {
      toast.error("Failed to delete course");
      console.error(err);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  // Topic CRUD
  const openCreateTopicModal = () => {
    setTopicModalMode("create");
    setTopicEditing(null);
    setTopicNameValue("");
    setTopicOrderValue(null);
    setIsTopicModalOpen(true);
  };

  const openEditTopicModal = (topic: Topic) => {
    setTopicModalMode("edit");
    setTopicEditing(topic);
    setTopicNameValue(topic.name);
    setTopicOrderValue(topic.order_index ?? null);
    setIsTopicModalOpen(true);
  };

  const saveTopic = async () => {
    if (!course) return;
    if (!topicNameValue.trim()) {
      toast.error("Topic name is required");
      return;
    }

    setSavingTopic(true);

    try {
      if (topicModalMode === "create") {
        const payload = {
          name: topicNameValue,
          course: course.id,
          order_index: topicOrderValue ?? 0,
        };

        const created = await createTopic(payload);
        setTopics((prev) => [...prev, created]);
        toast.success("Topic added");
      } else if (topicEditing) {
        const payload = {
          name: topicNameValue,
          order_index: topicOrderValue ?? topicEditing.order_index,
        };

        const updated = await updateTopic(topicEditing.id, payload);
        setTopics((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Topic updated");
      }

      setIsTopicModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save topic");
      console.error(err);
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId?: string) => {
    if (!topicId) return;

    setDeleting(true);

    try {
      await deleteTopic(topicId);
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
      setSubtopicsMap((prev) => {
        const copy = { ...prev };
        delete copy[topicId];
        return copy;
      });
      // if selected subtopic belonged to deleted topic, clear selection
      if (selectedSubtopic && selectedSubtopic.topic === topicId) {
        setSelectedSubtopic(null);
      }
      toast.success("Topic deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete topic");
      console.error(err);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  // Subtopic CRUD
  const openCreateSubtopicModal = (topicId: string) => {
    setSubtopicModalMode("create");
    setSubtopicEditing({
      id: "",
      name: "",
      order_index: 0,
      topic: topicId,
    });
    setSubtopicNameValue("");
    setSubtopicOrderValue(null);
    setSubtopicContentValue("");
    setIsSubtopicModalOpen(true);
  };

  const openEditSubtopicModal = (sub: Subtopic) => {
    setSubtopicModalMode("edit");
    setSubtopicEditing(sub);
    setSubtopicNameValue(sub.name);
    setSubtopicOrderValue(sub.order_index ?? null);
    setSubtopicContentValue(sub.content ?? "");
    setIsSubtopicModalOpen(true);
  };

  const saveSubtopic = async () => {
    if (!subtopicEditing) return;
    if (!subtopicNameValue.trim()) {
      toast.error("Subtopic name required");
      return;
    }

    setSavingSubtopic(true);

    try {
      if (subtopicModalMode === "create") {
        const payload = {
          name: subtopicNameValue,
          topic: subtopicEditing.topic,
          order_index: subtopicOrderValue ?? 0,
          content: subtopicContentValue || "",
        };

        const created = await createSubtopic(payload);

        setSubtopicsMap((prev) => {
          const arr = prev[subtopicEditing.topic] || [];
          return { ...prev, [subtopicEditing.topic]: [...arr, created] };
        });

        toast.success("Subtopic created");
      } else {
        const payload = {
          name: subtopicNameValue,
          order_index: subtopicOrderValue ?? subtopicEditing.order_index,
          content: subtopicContentValue,
        };

        const updated = await updateSubtopic(subtopicEditing.id, payload);

        setSubtopicsMap((prev) => {
          const arr = prev[updated.topic] || [];
          return {
            ...prev,
            [updated.topic]: arr.map((s) =>
              s.id === updated.id ? updated : s
            ),
          };
        });

        // if the updated subtopic is currently selected, refresh selection
        if (selectedSubtopic && selectedSubtopic.id === updated.id) {
          setSelectedSubtopic(updated);
        }

        toast.success("Subtopic updated");
      }

      setIsSubtopicModalOpen(false);
    } catch (err) {
      toast.error("Failed to save subtopic");
      console.error(err);
    } finally {
      setSavingSubtopic(false);
    }
  };

  const handleDeleteSubtopic = async (subtopicId?: string) => {
    if (!subtopicId) return;

    setDeleting(true);

    try {
      await deleteSubtopic(subtopicId);

      setSubtopicsMap((prev) => {
        const copy: any = { ...prev };
        for (const key of Object.keys(copy)) {
          copy[key] = copy[key].filter((s: Subtopic) => s.id !== subtopicId);
        }
        return copy;
      });

      if (selectedSubtopic && selectedSubtopic.id === subtopicId) {
        setSelectedSubtopic(null);
      }

      toast.success("Subtopic deleted");
    } catch (err) {
      toast.error("Failed to delete subtopic");
      console.error(err);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  if (!courseId) return <div className="min-h-screen flex items-center justify-center">No course selected</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      {/* Main content — full height remaining */}
      <div className="flex-1 overflow-hidden h-[calc(100vh-64px)]">
        {/* Container centers width but full height used */}
        <div className="h-full w-full p-4 md:p-6 flex gap-6" style={{ height: "100%" }}>
          {/* Left column (30%) */}
          <div
            className="bg-white rounded-md shadow-sm flex flex-col"
            style={{ flexBasis: "30%", minWidth: 300, maxWidth: 560, height: "100%" }}
          >
  
            <div className="p-4" style={{ flexBasis: "70%", overflowY: "auto" }}>
              {/* ADMIN ASSIGNMENT HEADER */}
<div className="mb-4 flex items-center justify-between bg-gray-100 p-2 rounded">
  <div className="text-sm font-medium text-gray-700">
    {course?.assigned_admin
      ? `Admin: ${course.assigned_admin.username}`
      : "No admin assigned"}
  </div>

  <Button
    size="sm"
    onClick={() => setIsAssignAdminOpen(true)}   // <-- create this modal handler
    className="flex items-center gap-2"
  >
    {course?.assigned_admin ? "Change Admin" : "Assign Admin"}
  </Button>
</div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-semibold">Topics</h3>
                <Button onClick={openCreateTopicModal} className="flex items-center gap-2">
                  <Plus /> Add
                </Button>
              </div>

              <div className="space-y-3">
                {topics.length === 0 && (
                  <div className="text-sm text-muted-foreground">No topics yet</div>
                )}

                {topics.map((topic) => {
                  const expanded = !!expandedTopics[topic.id];
                  const subs = subtopicsMap[topic.id] || [];
                  return (
                    <div key={topic.id} className="border rounded p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{topic.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Order: {topic.order_index}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => toggleExpandTopic(topic.id)}>
                            {expanded ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEditTopicModal(topic)}>
                            <Edit />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setConfirmDelete({ type: "topic", id: topic.id })}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">Subtopics ({subs.length})</div>
                            <Button
                              size="sm"
                              onClick={() => openCreateSubtopicModal(topic.id)}
                              className="flex items-center gap-2"
                            >
                              <Plus /> Add
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {subs.length === 0 && (
                              <div className="text-sm text-muted-foreground">No subtopics yet</div>
                            )}

                            {subs.map((s) => (
                              <div
                                key={s.id}
                                className={`p-2 rounded border flex items-center justify-between cursor-pointer ${selectedSubtopic?.id === s.id
                                  ? "bg-sky-50 border-sky-300"
                                  : "bg-white"
                                  }`}
                                onClick={() => {
                                  setSelectedSubtopic(s);
                                  setRightTab("videos");
                                }}
                              >
                                <div>
                                  <div className="font-medium">{s.name}</div>
                                  <div className="text-xs text-muted-foreground">Order: {s.order_index}</div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditSubtopicModal(s);
                                    }}
                                  >
                                    <Edit />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDelete({ type: "subtopic", id: s.id });
                                    }}
                                  >
                                    <Trash />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Right column (70%) */}
          <div
            className="bg-white rounded-md shadow-sm overflow-auto flex flex-col"
            style={{ flexBasis: "70%" }}
          >
            {/* Nav-2 (tabs) */}
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-md text-sm ${rightTab === "videos" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setRightTab("videos")}
                >
                  Videos
                </button>
                <button
                  className={`px-3 py-1 rounded-md text-sm ${rightTab === "quizzes" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setRightTab("quizzes")}
                >
                  Quizzes
                </button>
                <button
                  className={`px-3 py-1 rounded-md text-sm ${rightTab === "coding" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setRightTab("coding")}
                >
                  Coding Problems
                </button>
                <button
                  className={`px-3 py-1 rounded-md text-sm ${rightTab === "notes" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setRightTab("notes")}
                >
                  Notes
                </button>
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedSubtopic ? `Selected: ${selectedSubtopic.name}` : "No subtopic selected"}
              </div>
            </div>

            {/* Right panel content area (placeholder for now) */}
            <div className="p-6 flex-1 overflow-auto">
              {/* If selectedSubtopic is null, show a hint */}
              {!selectedSubtopic && (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="text-lg font-medium mb-2">Select a subtopic on the left</div>
                  <div className="text-sm">Then use these tabs to manage Videos / Quizzes / Coding Problems / Notes</div>
                </div>
              )}

              {selectedSubtopic && (
                <div>
                  {/* Placeholder boxes per tab — replace with real components later */}
                  {rightTab === "videos" && selectedSubtopic && (
                    <VideosPanel subtopic={selectedSubtopic} />
                  )}


                  {rightTab === "quizzes" && selectedSubtopic && (
                    <QuizComponent subtopic={selectedSubtopic} />
                  )}


                  { rightTab === "coding" && selectedSubtopic && (
                    <CodingProblemsManager subtopicId={selectedSubtopic.id} />
                  )}

                  {rightTab === "notes" && (
                    <NotesManager subtopicId={selectedSubtopic.id} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Topic Modal */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{topicModalMode === "create" ? "Add Topic" : "Edit Topic"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Topic Name</Label>
              <Input value={topicNameValue} onChange={(e) => setTopicNameValue(e.target.value)} />
            </div>

            <div>
              <Label>Order Index (optional)</Label>
              <Input type="number" value={topicOrderValue ?? ""} onChange={(e) => setTopicOrderValue(e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTopicModalOpen(false)}>Cancel</Button>
            <Button onClick={saveTopic} disabled={savingTopic}>{savingTopic ? "Saving..." : (topicModalMode === "create" ? "Create Topic" : "Save Changes")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subtopic Modal */}
      <Dialog open={isSubtopicModalOpen} onOpenChange={setIsSubtopicModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{subtopicModalMode === "create" ? "Add Subtopic" : "Edit Subtopic"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Subtopic Name</Label>
              <Input value={subtopicNameValue} onChange={(e) => setSubtopicNameValue(e.target.value)} />
            </div>

            <div>
              <Label>Order Index (optional)</Label>
              <Input type="number" value={subtopicOrderValue ?? ""} onChange={(e) => setSubtopicOrderValue(e.target.value ? Number(e.target.value) : null)} />
            </div>

            <div>
              <Label>Content (optional)</Label>
              <Input value={subtopicContentValue} onChange={(e) => setSubtopicContentValue(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubtopicModalOpen(false)}>Cancel</Button>
            <Button onClick={saveSubtopic} disabled={savingSubtopic}>{savingSubtopic ? "Saving..." : (subtopicModalMode === "create" ? "Create Subtopic" : "Save Changes")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p>Are you sure you want to delete this {confirmDelete?.type}?</p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>

            {confirmDelete?.type === "course" && (
              <Button variant="destructive" onClick={handleDeleteCourse} disabled={deleting}>{deleting ? "Deleting..." : "Delete Course"}</Button>
            )}
            {confirmDelete?.type === "topic" && (
              <Button variant="destructive" onClick={() => handleDeleteTopic(confirmDelete.id)} disabled={deleting}>{deleting ? "Deleting..." : "Delete Topic"}</Button>
            )}
            {confirmDelete?.type === "subtopic" && (
              <Button variant="destructive" onClick={() => handleDeleteSubtopic(confirmDelete.id)} disabled={deleting}>{deleting ? "Deleting..." : "Delete Subtopic"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAssignAdminOpen} onOpenChange={setIsAssignAdminOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Assign Admin</DialogTitle>
    </DialogHeader>

    <div className="space-y-4 py-2">
      <Label>Select Admin</Label>

      <Select
        onValueChange={(adminId) => setEditCourseValues(v => ({ ...v, assigned_admin: adminId }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose admin" />
        </SelectTrigger>

        <SelectContent>
          {admins.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsAssignAdminOpen(false)}>
        Cancel
      </Button>

      <Button onClick={handleAssignAdmin}>Save</Button>

    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
};

export default CourseEdit;