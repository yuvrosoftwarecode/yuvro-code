import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, FileText, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Test {
  id: string;
  title: string;
  course: string;
  duration: number;
  totalQuestions: number;
}

interface TestThankYouProps {
  test: Test;
  answeredCount: number;
  totalQuestions: number;
  timeSpent: number;
  onViewResults: () => void;
}

const TestThankYou: React.FC<TestThankYouProps> = ({
  test,
  answeredCount,
  totalQuestions,
  timeSpent,
  onViewResults
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const completionPercentage = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-50/30 dark:to-emerald-950/10 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl rounded-2xl border-0 shadow-2xl overflow-hidden">
        {/* Success Header with Gradient */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-8 text-center text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white" />
          </div>

          <div className="relative z-10">
            <div className="mx-auto mb-4 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Test Submitted Successfully!
            </h1>
            <p className="text-emerald-100 text-sm md:text-base">
              Thank you for completing the test. Your responses have been recorded.
            </p>
          </div>
        </div>

        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-slate-900 dark:bg-slate-800 rounded-3xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                <FileText className="h-16 w-16 text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Skill Test</p>
                <p className="font-black text-xl text-white truncate leading-tight">{test.title}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-900 dark:bg-slate-800 rounded-3xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                <Sparkles className="h-16 w-16 text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Course</p>
                <p className="font-black text-xl text-white truncate leading-tight">{test.course}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div className="p-6 bg-slate-900 dark:bg-slate-800 rounded-3xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle2 className="h-16 w-16 text-emerald-500/20" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Answered</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-400">{answeredCount}</span>
                  <span className="text-sm text-slate-500 font-bold">/ {totalQuestions}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 dark:bg-slate-800 rounded-3xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="h-16 w-16 text-blue-500/20" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Time Spent</p>
                <p className="text-2xl font-black text-blue-400">{formatTime(timeSpent)}</p>
              </div>
            </div>
          </div>

          {/* Completion Bar */}
          <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className={cn(
                "text-sm font-bold",
                completionPercentage >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                  completionPercentage >= 50 ? "text-amber-600 dark:text-amber-400" :
                    "text-rose-600 dark:text-rose-400"
              )}>
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  completionPercentage >= 80 ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                    completionPercentage >= 50 ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                      "bg-gradient-to-r from-rose-500 to-pink-500"
                )}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <Sparkles className="h-20 w-20 text-white" />
            </div>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
              <Sparkles className="h-5 w-5 text-blue-400" />
              What's Next?
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-300 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Responses recorded</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Results available</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span>Get detailed feedback</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Track your progress</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={onViewResults}
              size="lg"
              className="px-8 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2 group"
            >
              <FileText className="h-4 w-4" />
              <span>View Results</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestThankYou;
