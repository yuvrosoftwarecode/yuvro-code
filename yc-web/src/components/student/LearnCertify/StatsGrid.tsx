import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, History, Table } from "lucide-react";
import type { Stats } from "../LearnCertify/types";

const StatsGrid: React.FC<{ stats: Stats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="border border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.lessons_completed}</p>
              <p className="text-xs text-muted-foreground">Lessons Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.time_spent}</p>
              <p className="text-xs text-muted-foreground">Time Invested</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
              <Table className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avg_progress}%</p>
              <p className="text-xs text-muted-foreground">Avg. Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsGrid;
