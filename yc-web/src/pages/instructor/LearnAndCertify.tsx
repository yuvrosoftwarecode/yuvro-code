import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
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
import Navigation from "../../components/Navigation";

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

const LearnAndCertify: React.FC = () => {
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


  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Courses</h1>
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
                      <h3 className="font-medium text-gray-800">{course.name}</h3>

                      {course.short_code && (
                        <p className="text-sm text-gray-500 mt-1">Code: {course.short_code}</p>
                      )}

                      <div className="mt-4 flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/learn/${course.id}`)}
                        >
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                ))}
              </div>
            </div>
          ))}
      </div>

    </div>
  );
};

export default LearnAndCertify;