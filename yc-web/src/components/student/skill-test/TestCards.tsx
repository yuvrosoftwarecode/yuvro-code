import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Test } from '@/pages/student/SkillTest';
import { Clock, FileQuestion, ArrowLeft, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestCardsProps {
  tests: Test[];
  courseName: string;
  topicName: string;
  onBack: () => void;
  onStartTest: (test: Test) => void;
  completedTests: Set<string>;
}

const TestCards = ({ tests, courseName, topicName, onBack, onStartTest, completedTests }: TestCardsProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Medium':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Hard':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const groupedTests = {
    Easy: tests.filter((t) => t.difficulty === 'Easy'),
    Medium: tests.filter((t) => t.difficulty === 'Medium'),
    Hard: tests.filter((t) => t.difficulty === 'Hard'),
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Courses</span>
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{courseName}</span>
        <span>/</span>
        <span className="text-foreground font-medium">{topicName}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {topicName} Tests
        </h1>
        <p className="text-muted-foreground">
          Choose a test based on your skill level
        </p>
      </div>

      {/* Tests by Difficulty */}
      <div className="space-y-8">
        {(Object.keys(groupedTests) as Array<keyof typeof groupedTests>).map((difficulty) => {
          const difficultyTests = groupedTests[difficulty];
          if (difficultyTests.length === 0) return null;

          return (
            <div key={difficulty}>
              <div className="flex items-center gap-3 mb-4">
                <Badge
                  variant="outline"
                  className={cn('px-3 py-1', getDifficultyColor(difficulty))}
                >
                  {difficulty}
                </Badge>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {difficultyTests.map((test) => (
                  <Card
                    key={test.id}
                    className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border border-border overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      {/* Test Title */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-blue-600 transition-colors">
                          {test.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getDifficultyColor(test.difficulty))}
                        >
                          {test.difficulty}
                        </Badge>
                      </div>

                      {/* Test Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <FileQuestion className="h-4 w-4" />
                          <span>{test.questions} questions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{test.duration} mins</span>
                        </div>
                      </div>

                      {/* Start Test / View Results Button */}
                      {completedTests.has(test.id) ? (
                        <Button
                          onClick={() => onStartTest(test)}
                          variant="outline"
                          className="w-full transition-all duration-300 gap-2"
                        >
                          <FileQuestion className="h-4 w-4" />
                          View Results
                        </Button>
                      ) : (
                        <Button
                          onClick={() => onStartTest(test)}
                          className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white transition-all duration-300 gap-2"
                        >
                          <Play className="h-4 w-4" />
                          Start Test
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {tests.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No tests available</p>
              <p className="text-sm">Tests for this topic will be available soon.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestCards;
