import React from "react";
import CourseCard from "./CourseCard";
import type { Course } from "../Learn/types";

interface Props {
  title: string;
  icon: React.ReactNode;
  courses: Course[];
  progressMap: { [k: string]: number };
  onStartLearning: (id: string) => void;
}

const CategorySection: React.FC<Props> = ({ title, icon, courses, progressMap, onStartLearning }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          {icon}
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-50">
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            id={c.id}
            title={c.name}
            description={
              c.topics?.length
                ? c.topics.slice(0, 3).map(t => t.name).join(", ")
                : ""
            }
            progress={Math.max(0, Math.min(100, progressMap[c.id] ?? 0))}
            icon={icon}
            onStartLearning={onStartLearning}
          />
        ))}
      </div>
    </div>
  );
};

export default CategorySection;