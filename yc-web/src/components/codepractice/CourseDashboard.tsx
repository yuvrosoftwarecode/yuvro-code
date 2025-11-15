import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Code2,
  Database,
  Cpu,
  FileCode,
  Braces,
  Terminal,
  Trophy,
  Target,
  Brain,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Course } from "@/pages/CodePractice";

// Configure axios with the API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

interface CourseDashboardProps {
  onCourseSelect: (course: Course) => void;
  onViewAnalytics: () => void;
}

// Icon map for dynamic rendering
const getIcon = (iconName: string | undefined) => {
  const icons = {
    Database,
    Cpu,
    Code2,
    FileCode,
    Braces,
    Terminal,
  };
  return icons[(iconName || "Code2") as keyof typeof icons] || Code2;
};

const CourseDashboard = ({
  onCourseSelect,
  onViewAnalytics,
}: CourseDashboardProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const response = await fetch("http://127.0.0.1:8001/api/course/courses/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle both paginated and non-paginated responses
        const courseList = Array.isArray(data) ? data : data.results || [];
        
        console.log("API Response:", data);
        console.log("Course list extracted:", courseList);
        console.log("Number of courses:", courseList.length);

        // Map backend courses into frontend Course type
        const formattedCourses = courseList.map((course: any) => ({
          id: course.id,
          name: course.name,
          category: course.category,
          short_code: course.short_code,
          icon:
            course.category === "fundamentals"
              ? "Database"
              : course.category === "programming_languages"
              ? "Terminal"
              : "Code2",
          progress: Math.floor(Math.random() * 80) + 10, // fake progress for now
          totalProblems: Math.floor(Math.random() * 100) + 50,
          solvedProblems: Math.floor(Math.random() * 50),
          iconColor:
            course.category === "fundamentals"
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        }));

        setCourses(formattedCourses);
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        console.error("Error response data:", err.response?.data);
        console.error("Error response status:", err.response?.status);
        setError("Failed to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading courses...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
        <p className="text-gray-600">{error}</p>
        <Button
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Code Practice
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sharpen your coding skills with hands-on practice
            </p>
          </div>
          <Button
            onClick={onViewAnalytics}
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white border-0 hover:opacity-90 transition-opacity duration-300"
          >
            View Analytics
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Problems Solved</p>
                  <p className="text-3xl font-bold text-foreground">156</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-3xl font-bold text-foreground">1,580</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Brain className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Help Used</p>
                  <p className="text-3xl font-bold text-foreground">23</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leaderboard Rank</p>
                  <p className="text-3xl font-bold text-foreground">#4</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const Icon = getIcon(course.icon);
            const iconColorClass = course.iconColor || "text-foreground";
            return (
              <Card
                key={course.id}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border border-border overflow-hidden"
              >
                <div className="bg-gradient-to-br from-muted/80 to-muted/40 p-6 pb-4">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconColorClass} transition-transform group-hover:scale-110 duration-300`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
                <CardContent className="p-6 pt-4 space-y-3">
                  {/* Course Name */}
                  <h3 className="text-lg font-semibold text-foreground">
                    {course.name}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      {course.totalProblems}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      {course.solvedProblems} Solved
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={course.progress} className="h-2" />

                  {/* Button */}
                  <Button
                    onClick={() => onCourseSelect(course)}
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white border-0 hover:opacity-90 transition-opacity duration-300"
                  >
                    Start Practice
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;