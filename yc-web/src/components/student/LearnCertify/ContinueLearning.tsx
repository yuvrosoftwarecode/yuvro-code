// src/features/LearnCertify/components/ContinueLearningCard.tsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Code } from "lucide-react";
import type { ContinueProgress } from "../LearnCertify/types";

interface Props {
  continueProgress: ContinueProgress;
  onContinue: (courseId: string) => void;
}

const ContinueLearningCard: React.FC<Props> = ({ continueProgress, onContinue }) => {
  return (
    <Card className="border border-blue-100 overflow-hidden bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 backdrop-blur-sm shadow-lg">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 text-blue-700">Continue Where You Left Off</h3>
            <p className="text-base text-gray-700 mb-4">Resume your <span className="font-semibold text-blue-600">{continueProgress.course}</span> learning journey</p>

            <div className="flex items-center gap-4 text-sm mb-2">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-800">{continueProgress.course}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Lesson <span className="font-semibold text-blue-600">{continueProgress.lesson}</span> of {continueProgress.total_lessons}</span>
            </div>

            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs font-semibold text-blue-600">{continueProgress.percent}%</span>
            </div>
            <div className="w-full bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full h-3 mb-6 shadow-inner">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300" style={{ width: `${continueProgress.percent || 50}%` }} />
            </div>
          </div>

          <Button
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md px-6 py-2 rounded-full font-semibold text-base tracking-wide hover:opacity-90 transition-opacity"
            onClick={() => onContinue(continueProgress.course.toLowerCase())}
          >
            Continue Learning
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ContinueLearningCard;
