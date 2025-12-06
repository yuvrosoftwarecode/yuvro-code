import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, BookOpen, Code, Database, Sparkles, Users, Calendar, Edit, Trash2 } from "lucide-react";

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

const CATEGORY_ICONS: Record<Course["category"], any> = {
  fundamentals: BookOpen,
  programming_languages: Code,
  databases: Database,
  ai_tools: Sparkles,
};

const CATEGORY_COLORS: Record<Course["category"], string> = {
  fundamentals: "bg-blue-50 border-blue-200 text-blue-700",
  programming_languages: "bg-green-50 border-green-200 text-green-700",
  databases: "bg-orange-50 border-orange-200 text-orange-700",
  ai_tools: "bg-purple-50 border-purple-200 text-purple-700",
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600 mt-1">Manage your course content and structure</p>
          </div>

          {user?.role === "admin" && (
            <Button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Course
            </Button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Loading courses...</span>
            </div>
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first course</p>
            {user?.role === "admin" && (
              <Button
                onClick={() => setIsAddOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            )}
          </div>
        )}

        {!loading &&
          Object.keys(groupedCourses).map((category) => {
            const CategoryIcon = CATEGORY_ICONS[category as Course["category"]];
            return (
              <div key={category} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${CATEGORY_COLORS[category as Course["category"]]}`}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {CATEGORY_LABELS[category as Course["category"]]}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {groupedCourses[category].length} course{groupedCourses[category].length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedCourses[category].map((course: Course) => {
                    const CategoryIcon = CATEGORY_ICONS[course.category];
                    return (
                      <Card
                        key={course.id}
                        className="group relative hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-0 shadow-sm bg-white overflow-hidden"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`p-2 rounded-lg ${CATEGORY_COLORS[course.category]} group-hover:scale-110 transition-transform duration-200`}>
                              <CategoryIcon className="w-4 h-4" />
                            </div>
                            {course.short_code && (
                              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                {course.short_code}
                              </span>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {course.name}
                          </h3>

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>0 students</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>0 topics</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3"
                              onClick={() => navigate(`/instructor/courses/${course.id}/manage`)}
                            >
                              <BookOpen className="w-3 h-3 mr-1" />
                              Manage
                            </Button>

                            {user?.role === "admin" && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2"
                                  onClick={() => openEditCourseModal(course)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-red-600 hover:bg-red-50 p-2"
                                  onClick={() => setConfirmDelete(course.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
