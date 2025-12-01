// src/features/LearnCertify/LearnCertifyDashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import restApiAuthUtil from "../../utils/RestApiAuthUtil";
import { fetchTopicsByCourse } from '@/services/courseService';

import ContinueLearningCard from "@/components/student/LearnCertify/ContinueLearning";
import StatsGrid from "@/components/student/LearnCertify/StatsGrid";
import SearchBar from "@/components/common/SearchBar";
import CategorySection from "@/components/student/LearnCertify/CatergorySection";

import { Binary, Code, Database, Sparkles, FileText, Flame, Award } from "lucide-react";

import type { Course, Stats, ContinueProgress, CourseProgressMap } from "@/components/student/LearnCertify/types";

const LearnCertifyDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<CourseProgressMap>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ lessons_completed: 0, time_spent: "0h", avg_progress: 0 });
  const [continueProgress, setContinueProgress] = useState<ContinueProgress>({
    course_id: "",
    course_name: "Python",
    lesson: 0,
    total_lessons: 0,
    percent: 0,
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courseList = await restApiAuthUtil.get<Course[]>("/course/courses/");
        const withTopics = await Promise.all(
          courseList.map(async (c) => {
            try {
              const topics = await fetchTopicsByCourse(String(c.id));
              return { ...c, topics };
            } catch {
              return { ...c, topics: [] };
            }
          })
        );
        setCourses(withTopics);
      } catch (err) {
        console.error("Failed to fetch courses", err);
        setCourses([]);
      }
    };

    const fetchStats = async () => {
      try {
        const s = await restApiAuthUtil.get("/course/std/stats/");
        setStats(s as Stats);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    const fetchContinue = async () => {
      try {
        const c = await restApiAuthUtil.get("/course/std/continue_learning/");
        const cp = c as ContinueProgress;
        setContinueProgress({
          course_id: cp.course_id || "",
          course_name: cp.course_name || "Python",
          lesson: cp.lesson || 0,
          total_lessons: cp.total_lessons || 0,
          percent: cp.percent || 0,
        });
      } catch (err) {
        console.error("Failed to fetch continue progress", err);
      }
    };

    const fetchProgressMap = async () => {
      try {
        const list = await restApiAuthUtil.get<{ course_id: string; percent: number }[]>("/course/std/progress/");
        const map: CourseProgressMap = {};
        if (Array.isArray(list)) {
          list.forEach((p) => { map[p.course_id] = p.percent ?? 0; });
        }
        setProgressMap(map);
      } catch (err) {
        console.warn("Progress endpoint missing or failed - using defaults", err);
        setProgressMap({});
      }
    };

    const refetchData = async () => {
      await Promise.all([fetchStats(), fetchContinue(), fetchProgressMap()]);
    };

    const loadAll = async () => {
      try {
        await Promise.all([fetchCourses(), fetchStats(), fetchContinue(), fetchProgressMap()]);
        setContinueProgress((prev) => {
          const course = courses.find((c) => c.id === prev.course_id);
          return {
            ...prev,
            course_name: course?.name || prev.course_name || "Python",
          };
        });
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();

    const handleFocus = () => {
      refetchData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleStartLearning = (courseId: string) => {
    navigate(`/student/learn/${courseId}`);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCourses = normalizedQuery
    ? courses.filter((c) => {
        if (c.name && c.name.toLowerCase().includes(normalizedQuery)) return true;
        if ((c as any).description && (c as any).description.toLowerCase().includes(normalizedQuery)) return true;
        if (Array.isArray((c as any).topics)) {
          const topics: any[] = (c as any).topics;
          if (topics.some((t) => (t.name || '').toLowerCase().includes(normalizedQuery))) return true;
        }
        return false;
      })
    : courses;

  const groupedFiltered = {
    fundamentals: filteredCourses.filter((c) => c.category === "fundamentals"),
    programming_languages: filteredCourses.filter((c) => c.category === "programming_languages"),
    databases: filteredCourses.filter((c) => c.category === "databases"),
    ai_tools: filteredCourses.filter((c) => c.category === "ai_tools"),
  };

  const getIconFor = (category: string) => {
    switch (category) {
      case "fundamentals": return <Binary className="w-5 h-5 text-blue-600" />;
      case "programming_languages": return <Code className="w-5 h-5 text-green-600" />;
      case "databases": return <Database className="w-5 h-5 text-orange-600" />;
      case "ai_tools": return <Sparkles className="w-5 h-5 text-purple-600" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
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
    <div className="min-h-screen bg-white px-8 py-1 pb-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header + badges */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Learn & Certify</h1>
              <p className="text-gray-600 py-2 text-sm">Continue your learning journey — unlock badges and grow your streak.</p>
            </div>

            <div className="flex gap-3">
              {/* Search bar */}
              <div className="group relative">
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              </div>

              <div className="group relative">
                <div className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-100/60 to-orange-100/40 rounded-full border border-yellow-200 shadow-sm">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-200 text-yellow-700 text-lg shadow">
                    <Flame className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-bold text-gray-800">7-day streak</span>
                </div>
                <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  🔥 7-day streak
                </div>
              </div>

              <div className="group relative">
                <div className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-100/60 to-cyan-100/40 rounded-full border border-blue-200 shadow-sm">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-200 text-blue-700 text-lg shadow">
                    <Award className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-bold text-gray-800">12 badges</span>
                </div>
                <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  🏅 12 badges earned
                </div>
              </div>
            </div>
          </div>

          <StatsGrid stats={stats} />

          <ContinueLearningCard continueProgress={continueProgress} onContinue={handleStartLearning} />
        </div>


        {/* Category sections */}
        {normalizedQuery && filteredCourses.length === 0 ? (
          <div className="py-8 text-center text-gray-600">No courses match "{searchQuery}"</div>
        ) : (
          Object.entries(groupedFiltered).map(([key, list]) =>
            list.length > 0 ? (
              <div key={key} className="flex mb-8 gap-6">
                <CategorySection
                  title={key.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  icon={getIconFor(key)}
                  courses={list}
                  progressMap={progressMap}
                  onStartLearning={handleStartLearning}
                />
              </div>
            ) : null
          )
        )}

        <div className="mt-8 p-0 bg-gradient-to-r from-yellow-100/60 via-orange-100/40 to-blue-100/30 border border-yellow-200 rounded-2xl shadow flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 py-4">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-yellow-200 text-yellow-700 text-xl shadow">
              🔥
            </span>
            <span className="font-bold text-lg text-gray-800">7-day streak</span>
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-gray-700 text-xl shadow">
              🥈
            </span>
          </div>
          <p className="text-base text-center text-gray-700 pb-4">
            Complete <span className="font-semibold text-blue-600">1 more lesson today</span> to earn a <span className="font-semibold text-yellow-700">silver badge!</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearnCertifyDashboard;