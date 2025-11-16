import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code2, Database, Cpu, FileCode, Braces, Terminal, Trophy, Target, Brain, CheckCircle2 } from 'lucide-react';
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
  };
  return icons[category as keyof typeof icons] || Code2;
};

const getIconColor = (category: string) => {
  const colors = {
    databases: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    programming_languages: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    fundamentals: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    ai_tools: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
};

const CourseDashboard = ({ onCourseSelect, onViewAnalytics }: CourseDashboardProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const fetchedCourses = await fetchCourses();
        
        // Transform backend courses to match our Course interface
        const transformedCourses: Course[] = fetchedCourses.map(course => ({
          id: course.id.toString(),
          name: course.name || course.title || 'Untitled Course',
          icon: course.category,
          progress: Math.floor(Math.random() * 100), // TODO: Calculate actual progress
          totalProblems: Math.floor(Math.random() * 50) + 20, // TODO: Get actual count
          solvedProblems: Math.floor(Math.random() * 30) + 5, // TODO: Get actual count
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
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
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
                  <p className="text-3xl font-bold text-foreground">
                    {courses.reduce((sum, course) => sum + course.solvedProblems, 0)}
                  </p>
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
                  <p className="text-sm text-muted-foreground">Courses Available</p>
                  <p className="text-3xl font-bold text-foreground">{courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const Icon = getIcon(course.category);
            const iconColorClass = course.iconColor || 'text-foreground';
            return (
              <Card
                key={course.id}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border border-border overflow-hidden"
              >
                <div className="bg-gradient-to-br from-muted/80 to-muted/40 p-6 pb-4">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconColorClass} transition-transform group-hover:scale-110 duration-300`}>
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
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>

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

        {courses.length === 0 && !loading && (
          <div className="text-center py-12">
            <Code2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Courses Available</h3>
            <p className="text-muted-foreground">
              No coding courses are currently available for practice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDashboard;