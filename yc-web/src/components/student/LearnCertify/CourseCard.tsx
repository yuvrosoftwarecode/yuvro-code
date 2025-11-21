// src/features/LearnCertify/components/CourseCard.tsx
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Props {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  progress: number;
  onStartLearning: (id: string) => void;
}

const CourseCard: React.FC<Props> = ({ id, icon, title, description, progress, onStartLearning }) => {
  const hasStarted = progress > 0;

  return (
  <Card className="group w-[400px] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-200 py-4">
      <CardHeader className="pt-2 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-200 group-hover:from-blue-200 group-hover:to-blue-400">
              {icon}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <span className="text-xs text-muted-foreground block">{progress}% complete</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-2 pb-2">
        <p className="text-base text-gray-700 font-medium mb-4">{description}</p>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-semibold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full h-3 mb-6 shadow-inner">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progress || 50}%` }} />
        </div>

        <Button
          size="sm"
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-md mt-2 font-semibold tracking-wide"
          onClick={() => onStartLearning(id)}
        >
          {hasStarted ? "Continue Learning" : "Start Learning"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
