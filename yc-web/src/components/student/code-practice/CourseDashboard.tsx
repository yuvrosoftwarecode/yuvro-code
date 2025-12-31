import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Code2, Database, Cpu, FileCode, Braces, Terminal,
  Trophy, Target, Brain, CheckCircle2
} from 'lucide-react';
import { fetchCourses } from '@/services/courseService';
import type { Course } from '@/pages/student/CodePractice';
import { toast } from 'sonner';

interface CourseDashboardProps {
  onCourseSelect: (course: Course) => void;
  onViewAnalytics: () => void;
}

const getIcon = (category: string) => {
  const icons = {
    databases: Database,
    programming_languages: Code2,
    fundamentals: Cpu,
    ai_tools: Brain,
    FileCode,
    Braces,
    Terminal,
  };
  return icons[category as keyof typeof icons] || Code2;
};

const getIconColor = (category: string) => {
  const colors = {
    databases: 'bg-blue-100 text-blue-600',
    programming_languages: 'bg-red-100 text-red-600',
    fundamentals: 'bg-purple-100 text-purple-600',
    ai_tools: 'bg-amber-100 text-amber-600',
  };
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-600';
};

const CourseDashboard = ({ onCourseSelect, onViewAnalytics }: CourseDashboardProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const fetchedCourses = await fetchCourses();

        const transformedCourses: Course[] = fetchedCourses.map(course => ({
          id: course.id.toString(),
          name: course.name || course.title || 'Untitled Course',
          icon: course.category,
          progress: Math.round(course.progress_percentage || 0),
          totalProblems: course.total_problems || 0,
          solvedProblems: course.solved_problems || 0,
          totalScore: course.total_score || 0,
          aiHelpUsed: course.ai_help_used || 0,
          iconColor: getIconColor(course.category),
          category: course.category,
        }));

        setCourses(transformedCourses);
      } catch (error) {
        console.error('Failed to load courses:', error);
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 py-8">
        <div className="max-w-[1600px] mx-auto animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Code Practice</h1>
            <p className="text-gray-600 text-sm mt-1">
              Sharpen your coding skills with hands-on practice
            </p>
          </div>

          <Button
            onClick={onViewAnalytics}
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white border-0 hover:opacity-90"
          >
            View Analytics
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Problems Solved */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Problems Solved</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {courses.reduce((sum, c) => sum + c.solvedProblems, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Score */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {courses.reduce((sum, c) => sum + (c.totalScore || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Help */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">AI Help Used</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {courses.reduce((sum, c) => sum + (c.aiHelpUsed || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Available */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Courses Available</p>
                  <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {courses.map(course => {
            const Icon = getIcon(course.category);
            const iconColor = course.iconColor;

            return (
              <Card
                key={course.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition hover:-translate-y-1 flex flex-col"
              >
                {/* Icon Section */}
                <div className="p-6 pb-4 bg-gray-50">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconColor}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                </div>

                {/* Content Section */}
                <CardContent className="p-6 pt-4 flex flex-col gap-3 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 min-h-[48px]">
                    {course.name}
                  </h3>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-amber-600" />
                      {course.totalProblems}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {course.solvedProblems} solved
                    </span>
                  </div>

                  {/* Spacer pushes button down */}
                  <div className="flex-1"></div>

                  <Button
                    onClick={() => onCourseSelect(course)}
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:opacity-90"
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