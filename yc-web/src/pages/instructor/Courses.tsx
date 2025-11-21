import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

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
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Courses</h1>

          {user?.role === "admin" && (
            <Button
              className="flex items-center gap-2"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Course
            </Button>
          )}

        </div>

        {loading && <p className="text-gray-500">Loading courses...</p>}

        {!loading &&
          Object.keys(groupedCourses).map((category) => (
            <div key={category} className="mb-10">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                {CATEGORY_LABELS[category as Course["category"]]}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedCourses[category].map((course: Course) => (
                  <Card
                    key={course.id}
                    className="relative hover:shadow-md transition border border-gray-200"
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-800">
                        {course.name}
                      </h3>

                      {course.short_code && (
                        <p className="text-sm text-gray-500 mt-1">
                          Code: {course.short_code}
                        </p>
                      )}

                      {user?.role === "admin" && (
                        <div className="mt-4 flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCourseModal(course)}
                          >
                            Edit
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmDelete(course.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}

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
