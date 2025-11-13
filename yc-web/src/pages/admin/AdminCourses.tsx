import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Navigation from "../../components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Pencil } from "lucide-react";

import {
  fetchCourses,
  createCourse,
  deleteCourse,
  updateCourse,
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

// ✅ Correct Sonner import
import { toast } from "sonner";

type Course = {
  id: string;
  short_code: string | null;
  name: string;
  category: "fundamentals" | "programming_languages" | "databases" | "ai_tools";
};

const CATEGORY_LABELS: Record<Course["category"], string> = {
  fundamentals: "Fundamentals",
  programming_languages: "Programming Languages",
  databases: "Databases",
  ai_tools: "AI Tools",
};

const AdminCourses: React.FC = () => {
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

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);


  const openEditCourseModal = (course: Course) => {
    setEditCourseId(course.id);

    setNewCourse({
      name: course.name,
      short_code: course.short_code || "",
      category: course.category,
    });

    setIsEditOpen(true);
  };

  const handleUpdateCourse = async () => {
    if (!editCourseId) return;

    try {
      setSaving(true);
      await updateCourse(editCourseId, newCourse);

      toast.success("Course updated successfully");

      setSaving(false);
      setIsEditOpen(false);

      loadCourses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update course");
      setSaving(false);
    }
  };



  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await fetchCourses();
      setCourses(data);
    } catch (err) {
      console.error("Failed to load courses", err);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // Group by category
  const groupedCourses = courses.reduce((acc: any, course) => {
    if (!acc[course.category]) acc[course.category] = [];
    acc[course.category].push(course);
    return acc;
  }, {});

  // ------------------- DELETE COURSE -------------------
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

  // ------------------- CREATE COURSE -------------------
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
      await createCourse(newCourse);

      toast.success("Course created successfully");

      setSaving(false);
      setIsAddOpen(false);

      // Reset fields
      setNewCourse({ name: "", short_code: "", category: "" });

      loadCourses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create course");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Courses</h1>

          <Button
            className="flex items-center gap-2"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Course
          </Button>
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
                    {/* EDIT ICON – absolute to card */}
                    <button
                      onClick={() => openEditCourseModal(course)}
                      className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
                    >
                      <Pencil className="w-4 h-4 text-gray-600" />
                    </button>

                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-800">{course.name}</h3>

                      {course.short_code && (
                        <p className="text-sm text-gray-500 mt-1">Code: {course.short_code}</p>
                      )}

                      <div className="mt-4 flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/courses/${course.id}`)}
                        >
                          Manage
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmDelete(course.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                ))}
              </div>
            </div>
          ))}
      </div>

      {/* ---------------- Add Course Modal ---------------- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>

            <Button disabled={saving} onClick={handleCreateCourse}>
              {saving ? "Saving..." : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Delete Confirmation Modal ---------------- */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
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
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
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

export default AdminCourses;
