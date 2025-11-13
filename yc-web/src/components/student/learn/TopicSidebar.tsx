import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Topic {
  id: string;
  name: string;
  progress: number;
  completed: boolean;
  subtopicsCompleted: number;
  totalSubtopics: number;
}

interface TopicSidebarProps {
  courseName: string;
  courseIcon: string;
  topics: Topic[];
  selectedTopic: Topic | null;
  onTopicSelect: (topic: Topic) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const TopicSidebar = ({
  courseName,
  courseIcon,
  topics,
  selectedTopic,
  onTopicSelect,
  isOpen,
  onToggle,
}: TopicSidebarProps) => {
  return (
    <div
      className={cn(
        'relative bg-card border-r border-border transition-all duration-300 flex flex-col',
        isOpen ? 'w-80' : 'w-16'
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-border bg-background shadow-md hover:bg-accent"
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <>
          {/* Course Header */}
          <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{courseIcon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {courseName}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {topics.length} Topics
                </p>
              </div>
            </div>
          </div>

          {/* Topics List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Topics
              </p>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => onTopicSelect(topic)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-all duration-200 group',
                    selectedTopic?.id === topic.id
                      ? 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20'
                      : 'hover:bg-accent border border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        selectedTopic?.id === topic.id
                          ? 'text-primary'
                          : 'text-foreground'
                      )}
                    >
                      {topic.name}
                    </span>
                    {topic.completed && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Progress value={topic.progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {topic.subtopicsCompleted}/{topic.totalSubtopics} Subtopics • {topic.progress}% Complete
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {!isOpen && (
        <div className="flex flex-col items-center py-6 space-y-4">
          <span className="text-2xl">{courseIcon}</span>
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onTopicSelect(topic)}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                selectedTopic?.id === topic.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground'
              )}
              title={topic.name}
            >
              {topic.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicSidebar;
