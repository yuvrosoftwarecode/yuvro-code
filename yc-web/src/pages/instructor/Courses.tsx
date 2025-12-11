import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, BookOpen, Users } from "lucide-react";

import {
  fetchCourses,
  createCourse,
  deleteCourse,
  updateCourse,
  fetchAllInstructors,
  fetchCourseInstructors,
  addInstructorToCourse,
  removeInstructorFromCourse,
} from "@/services/courseService";

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
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";

type Course = {
  id: string;
  short_code: string | null;
  name: string;
  category: "fundamentals" | "programming_languages" | "databases" | "ai_tools";
};

type Instructor = {
  id: string;
  username: string;
  email: string;
};

const CATEGORY_LABELS: Record<Course["category"], string> = {
  fundamentals: "Fundamentals",
  programming_languages: "Programming Languages",
  databases: "Databases",
  ai_tools: "AI Tools",
};

const CATEGORY_GRADIENTS: Record<Course["category"], string> = {
  fundamentals: "from-blue-900 to-blue-700",
  programming_languages: "from-purple-900 to-purple-700",
  databases: "from-green-900 to-green-700",
  ai_tools: "from-orange-900 to-orange-700",
};

const Courses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Course Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    short_code: "",
    category: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete Confirmation
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit Course Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);

  // Instructor-related state
  const [availableInstructors, setAvailableInstructors] = useState<Instructor[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]); // for Add
  const [editSelectedInstructors, setEditSelectedInstructors] = useState<string[]>([]); // for Edit
  const [editInitialInstructors, setEditInitialInstructors] = useState<string[]>([]); // to compute diff

  // --------------------------------------------------
  // Load Courses
  // --------------------------------------------------
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await fetchCourses();

      if (user?.role === "instructor") {
        // Filter only assigned courses
        const myCourses = [];

        for (const c of data) {
          const instructors = await fetchCourseInstructors(c.id);
          const isAssigned = instructors.some(
            (ci: any) => ci.id === user.id
          );

          if (isAssigned) myCourses.push(c);
        }

        setCourses(myCourses);
      } else {
        // Admin sees everything
        setCourses(data);
      }

    } catch (err) {
      console.error("Failed to load courses", err);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };


  // --------------------------------------------------
  // Load Instructors (once)
  // --------------------------------------------------
  const loadInstructors = async () => {
    try {
      if (availableInstructors.length === 0) {
        const data = await fetchAllInstructors();
        setAvailableInstructors(data);
      }
    } catch (err) {
      console.error("Failed to load instructors", err);
      toast.error("Failed to load instructors");
    }
  };

  // Load instructors when Add modal opens
  useEffect(() => {
    if (isAddOpen) {
      loadInstructors();
    }
  }, [isAddOpen]);

  // --------------------------------------------------
  // Group Courses by Category
  // --------------------------------------------------
  const groupedCourses = courses.reduce((acc: any, course) => {
    if (!acc[course.category]) acc[course.category] = [];
    acc[course.category].push(course);
    return acc;
  }, {});

  // --------------------------------------------------
  // DELETE COURSE
  // --------------------------------------------------
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);

    try {
      await deleteCourse(confirmDelete);

      toast.success("Course deleted successfully");
      setConfirmDelete(null);
      loadCourses();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // CREATE COURSE (with instructors)
  // --------------------------------------------------
  const handleCreateCourse = async () => {
    if (!newCourse.name.trim()) {
      toast.error("Course name is required");
      return;
    }

    if (!newCourse.category) {
      toast.error("Please select a category");
      return;
    }

    try {
      setSaving(true);

      // 1) Create the course
      const created = await createCourse(newCourse);

      // 2) Assign selected instructors
      if (selectedInstructors.length > 0) {
        for (const instructorId of selectedInstructors) {
          try {
            await addInstructorToCourse(created.id, instructorId);
          } catch (e) {
            console.error("Failed to assign instructor", e);
          }
        }
      }

      toast.success("Course created successfully");

      // Reset
      setNewCourse({ name: "", short_code: "", category: "" });
      setSelectedInstructors([]);
      setIsAddOpen(false);

      loadCourses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // OPEN EDIT MODAL (load instructors for course)
  // --------------------------------------------------
  const openEditCourseModal = async (course: Course) => {
    setEditCourseId(course.id);
    setNewCourse({
      name: course.name,
      short_code: course.short_code || "",
      category: course.category,
    });
    setIsEditOpen(true);

    try {
      // Ensure we have all available instructors
      await loadInstructors();

      // Fetch instructors for this course
      const mappings = await fetchCourseInstructors(course.id);
      console.log("Course instructors response:", mappings);  // 🔥 ADD THIS

      // mappings: [{ id, instructor: {...}, created_at }]
      const instructorIds = mappings.map((m: any) => m.id) as string[];

      setEditSelectedInstructors(instructorIds);
      setEditInitialInstructors(instructorIds);
    } catch (err) {
      console.error("Failed to  load course instructors", err);
      toast.error("Failed to load course instructors");
    }
  };

  // --------------------------------------------------
  // UPDATE COURSE (with instructor add/remove)
  // --------------------------------------------------
  const handleUpdateCourse = async () => {
    if (!editCourseId) return;

    try {
      setSaving(true);

      // 1) Update the course basic info
      await updateCourse(editCourseId, newCourse);

      // 2) Compute instructor changes
      const toAdd = editSelectedInstructors.filter(
        (id) => !editInitialInstructors.includes(id)
      );
      const toRemove = editInitialInstructors.filter(
        (id) => !editSelectedInstructors.includes(id)
      );

      // 3) Apply additions
      for (const id of toAdd) {
        try {
          await addInstructorToCourse(editCourseId, id);
        } catch (e) {
          console.error("Failed to add instructor", e);
        }
      }

      // 4) Apply removals
      for (const id of toRemove) {
        try {
          await removeInstructorFromCourse(editCourseId, id);
        } catch (e) {
          console.error("Failed to remove instructor", e);
        }
      }

      toast.success("Course updated successfully");

      setIsEditOpen(false);
      setEditCourseId(null);
      setEditSelectedInstructors([]);
      setEditInitialInstructors([]);

      loadCourses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
              <p className="text-gray-600 mt-2">
                {user?.role === "admin"
                  ? "Create, edit, and manage all courses in the system"
                  : "Manage your assigned courses and content"
                }
              </p>
            </div>

            {user?.role === "admin" && (
              <Button
                className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-2"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Add Course
              </Button>
            )}
          </div>
        </div>

        {loading && (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-12">
                <div className="flex items-center mb-6">
                  <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="ml-3 h-6 bg-gray-100 rounded-full w-20 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Header skeleton */}
                      <div className="bg-gray-200 p-4">
                        <div className="h-3 bg-gray-300 rounded w-20 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                      </div>

                      {/* Content skeleton */}
                      <div className="p-4">
                        <div className="flex gap-4 mb-4">
                          <div className="h-3 bg-gray-100 rounded w-16 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-12 animate-pulse"></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                          <div className="flex gap-1">
                            <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && Object.keys(groupedCourses).length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No courses available</h3>
            <p className="text-gray-500">
              {user?.role === "admin"
                ? "Get started by creating your first course"
                : "No courses have been assigned to you yet"
              }
            </p>
          </div>
        )}

        {!loading &&
          Object.keys(groupedCourses).map((category) => (
            <div key={category} className="mb-12">
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {CATEGORY_LABELS[category as Course["category"]]}
                </h2>
                <div className="ml-3 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                  {groupedCourses[category].length} course{groupedCourses[category].length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groupedCourses[category].map((course: Course) => (
                  <Card
                    key={course.id}
                    className="group relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 hover:border-gray-300 bg-white rounded-xl"
                  >
                    <CardContent className="p-0">
                      {/* Course Header with gradient */}
                      <div className={`bg-gradient-to-r ${CATEGORY_GRADIENTS[course.category]} p-4 text-white relative overflow-hidden`}>
                        {/* Subtle pattern overlay */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                          }} />
                        </div>

                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-4 w-4 text-white/70" />
                              <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                                {CATEGORY_LABELS[course.category]}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg leading-tight mb-2 text-white">
                              {course.name}
                            </h3>
                          </div>

                          {course.short_code && (
                            <div className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/30">
                              <span className="text-xs font-bold text-white">
                                {course.short_code}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="p-5">
                        {/* Stats section */}
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-5">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                            <span className="font-medium">Active</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            <span>Multi-instructor</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                          {/* Manage Button - Left Side */}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/instructor/courses/${course.id}/manage`)}
                            className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                          >
                            Manage
                          </Button>

                          {/* Edit/Delete Icons - Right Side */}
                          {user?.role === "admin" && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCourseModal(course)}
                                className="h-9 w-9 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Edit course"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDelete(course.id)}
                                className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Delete course"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* ---------------- Add Course Modal ---------------- */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setNewCourse({ name: "", short_code: "", category: "" });
            setSelectedInstructors([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Course Name</Label>
              <Input
                placeholder="Enter course name"
                value={newCourse.name}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Short Code (optional)</Label>
              <Input
                placeholder="EX: PY101"
                value={newCourse.short_code}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, short_code: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                onValueChange={(value) =>
                  setNewCourse({ ...newCourse, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="fundamentals">Fundamentals</SelectItem>
                  <SelectItem value="programming_languages">
                    Programming Languages
                  </SelectItem>
                  <SelectItem value="databases">Databases</SelectItem>
                  <SelectItem value="ai_tools">AI Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Instructors (optional)</Label>
              <MultiSelect
                options={availableInstructors.map((inst) => ({
                  value: inst.id,
                  label: `${inst.username} (${inst.email})`,
                }))}
                selected={selectedInstructors}
                onChange={setSelectedInstructors}
                placeholder="Select instructors"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setNewCourse({ name: "", short_code: "", category: "" });
                setSelectedInstructors([]);
              }}
            >
              Cancel
            </Button>

            <Button disabled={saving} onClick={handleCreateCourse}>
              {saving ? "Saving..." : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Delete Confirmation Modal ---------------- */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>

          <p>Are you sure you want to delete this course?</p>
          <p className="text-sm text-muted-foreground mt-2">
            This action cannot be undone.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Edit Course Modal ---------------- */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditCourseId(null);
            setEditSelectedInstructors([]);
            setEditInitialInstructors([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Course Name</Label>
              <Input
                value={newCourse.name}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Short Code</Label>
              <Input
                value={newCourse.short_code}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, short_code: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={newCourse.category}
                onValueChange={(val) =>
                  setNewCourse({ ...newCourse, category: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="fundamentals">Fundamentals</SelectItem>
                  <SelectItem value="programming_languages">
                    Programming Languages
                  </SelectItem>
                  <SelectItem value="databases">Databases</SelectItem>
                  <SelectItem value="ai_tools">AI Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Instructors</Label>
              <MultiSelect
                options={availableInstructors.map((inst) => ({
                  value: inst.id,
                  label: `${inst.username} (${inst.email})`,
                }))}
                selected={editSelectedInstructors}
                onChange={setEditSelectedInstructors}
                placeholder="Select instructors"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setEditCourseId(null);
                setEditSelectedInstructors([]);
                setEditInitialInstructors([]);
              }}
            >
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleUpdateCourse}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;
