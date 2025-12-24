import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Course } from '@/pages/student/SkillTest';

interface CourseSelectionProps {
  courses: Course[];
  onCourseSelect: (course: Course) => void;
}

const CourseSelection = ({ courses, onCourseSelect }: CourseSelectionProps) => {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Skill Test
        </h1>
        <p className="text-muted-foreground">
          Choose a course to start testing your knowledge
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border border-border overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {/* Course Icon */}
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 text-4xl">
                {course.icon}
              </div>

              {/* Course Info */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-blue-600 transition-colors">
                  {course.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              </div>

              {/* Topics Count */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  📚 {course.topics.length} Topics
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  ✅ {course.topics.filter(t => t.completed).length} Completed
                </span>
              </div>

              {/* Select Button */}
              <Button
                onClick={() => onCourseSelect(course)}
                className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white transition-all duration-300"
              >
                Select Course
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourseSelection;
