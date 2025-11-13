import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Code2, Database, Cpu, FileCode, Braces, Terminal, Trophy, Target, Brain, CheckCircle2 } from 'lucide-react';
import type { Course } from '@/pages/student/CodePractice';

interface CourseDashboardProps {
  onCourseSelect: (course: Course) => void;
  onViewAnalytics: () => void;
}

const courses: Course[] = [
  { id: 'ds', name: 'Data Structures', icon: 'Database', progress: 45, totalProblems: 85, solvedProblems: 38, iconColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'algo', name: 'Algorithms', icon: 'Cpu', progress: 30, totalProblems: 120, solvedProblems: 36, iconColor: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 'java', name: 'Java', icon: 'Code2', progress: 60, totalProblems: 95, solvedProblems: 57, iconColor: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  { id: 'c', name: 'C', icon: 'FileCode', progress: 25, totalProblems: 75, solvedProblems: 19, iconColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'cpp', name: 'C++', icon: 'Braces', progress: 50, totalProblems: 100, solvedProblems: 50, iconColor: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
  { id: 'python', name: 'Python', icon: 'Terminal', progress: 70, totalProblems: 110, solvedProblems: 77, iconColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
];

const getIcon = (iconName: string) => {
  const icons = {
    Database,
    Cpu,
    Code2,
    FileCode,
    Braces,
    Terminal,
  };
  return icons[iconName as keyof typeof icons] || Code2;
};

const CourseDashboard = ({ onCourseSelect, onViewAnalytics }: CourseDashboardProps) => {
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
