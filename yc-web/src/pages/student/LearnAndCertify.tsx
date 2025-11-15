import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Navigation from "../../components/Navigation";
import { apiClient } from "../../services/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

import {
  Search,
  Flame,
  Award,
  Database,
  Binary,
  Code,
  Sparkles,
  FileText,
  History,
  Table,
} from "lucide-react";

// ---------------------------
// Interfaces
// ---------------------------
interface Topic {
  id: string;
  name: string;
  order_index: number;
}

interface Course {
  id: string;
  name: string;
  category: string;
  short_code?: string;
  topics?: Topic[];
}

interface CourseCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  topics: Topic[];
  progress: number;
  id: string;
  onStartLearning: (id: string) => void;
}

// ---------------------------
// Course Card Component
// ---------------------------
const CourseCard = ({
  icon,
  title,
  description,
  topics,
  progress,
  id,
  onStartLearning,
}: CourseCardProps) => {
  const hasStarted = progress > 0;

  const topicText = topics
    .slice(0, 3)
    .map((t) => t.name)
    .join(", ");

  const extraCount = topics.length > 3 ? `, +${topics.length - 3} more...` : "";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                {progress}% complete
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        {/* 🧩 Topics inline, comma separated */}
        {topics && topics.length > 0 && (
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {topicText}
            {extraCount}
          </p>
        )}

        <Progress value={progress} className="h-1.5" />
        <Button
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-sm"
          size="sm"
          onClick={() => onStartLearning(id)}
        >
          {hasStarted ? "Continue Learning" : "Start Learning"}
        </Button>
      </CardContent>
    </Card>
  );
};

// ---------------------------
// Main Page
// ---------------------------
const LearnAndCertify: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch courses + first 3 topics each
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courseList = await apiClient["request"]<Course[]>("/course/courses/", {
          method: "GET",
        });

        // Fetch topics for each course
        const withTopics = await Promise.all(
          courseList.map(async (course) => {
            try {
              const topics = await apiClient["request"]<Topic[]>(
                `/course/topics/?course=${course.id}`,
                { method: "GET" }
              );
              return { ...course, topics };
            } catch {
              return { ...course, topics: [] };
            }
          })
        );

        setCourses(withTopics);
      } catch (error) {
        console.error("❌ Failed to fetch courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [token]);

  const handleStartLearning = (courseId: string) => {
    navigate(`/student/learn/${courseId}`);
  };

  // Categorize
  const groupedCourses = {
    fundamentals: courses.filter((c) => c.category === "fundamentals"),
    programming_languages: courses.filter((c) => c.category === "programming_languages"),
    databases: courses.filter((c) => c.category === "databases"),
    ai_tools: courses.filter((c) => c.category === "ai_tools"),
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "fundamentals":
        return <Binary className="w-5 h-5 text-blue-600" />;
      case "programming_languages":
        return <Code className="w-5 h-5 text-green-600" />;
      case "databases":
        return <Database className="w-5 h-5 text-orange-600" />;
      case "ai_tools":
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading courses...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Learn & Certify
          </h1>
          <p className="text-muted-foreground text-sm">
            Continue your learning journey — unlock badges and grow your streak.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search for courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Dynamic Sections */}
        {Object.entries(groupedCourses).map(([category, categoryCourses]) =>
          categoryCourses.length > 0 ? (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  {getCategoryIcon(category)}
                </div>
                <h2 className="text-2xl font-bold capitalize text-foreground">
                  {category.replace("_", " ")}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.name}
                    description={course.short_code || ""}
                    progress={Math.floor(Math.random() * 100)}
                    icon={getCategoryIcon(category)}
                    topics={course.topics || []}
                    onStartLearning={handleStartLearning}
                  />
                ))}
              </div>
            </div>
          ) : null
        )}
      </main>
    </div>
  );
};

export default LearnAndCertify;
