import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

export interface Subtopic {
  id: string;
  name: string;
  completed: boolean;
  description?: string;
}

interface SubtopicTimelineProps {
  subtopics: Subtopic[];
  onSubtopicSelect: (subtopic: Subtopic) => void;
  selectedSubtopic: Subtopic | null;
  allCompleted: boolean;
  onTakeTest?: () => void;
}

const SubtopicTimeline = ({
  subtopics,
  onSubtopicSelect,
  selectedSubtopic,
  allCompleted,
  onTakeTest
}: SubtopicTimelineProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "relative flex flex-col h-full bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-80"
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-border bg-background shadow-md hover:bg-accent"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {!isCollapsed && (
        <>
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Topic Progress
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {subtopics.filter(s => s.completed).length} of {subtopics.length} completed
            </p>
          </div>

      {/* Timeline */}
      <ScrollArea className="flex-1 p-6">
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />

          {/* Subtopic items */}
          <div className="space-y-6">
            {subtopics.map((subtopic, index) => (
              <button
                key={subtopic.id}
                onClick={() => onSubtopicSelect(subtopic)}
                className={cn(
                  "flex items-start gap-4 w-full text-left transition-all group relative",
                  selectedSubtopic?.id === subtopic.id && "opacity-100"
                )}
              >
                {/* Circle indicator */}
                <div className="relative flex-shrink-0 z-10">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                      subtopic.completed
                        ? "bg-primary border-primary"
                        : selectedSubtopic?.id === subtopic.id
                        ? "bg-background border-primary"
                        : "bg-background border-border group-hover:border-primary/50"
                    )}
                  >
                    {subtopic.completed ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        selectedSubtopic?.id === subtopic.id
                          ? "bg-primary"
                          : "bg-border group-hover:bg-primary/50"
                      )} />
                    )}
                  </div>
                </div>

                {/* Subtopic content */}
                <div className="flex-1 pt-0.5">
                  <h4
                    className={cn(
                      "text-sm font-medium transition-colors",
                      subtopic.completed
                        ? "text-foreground"
                        : selectedSubtopic?.id === subtopic.id
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {subtopic.name}
                  </h4>
                  {subtopic.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {subtopic.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Take Test Button */}
        {allCompleted && onTakeTest && (
          <div className="mt-8 pt-6 border-t border-border">
            <Button
              onClick={onTakeTest}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
              size="lg"
            >
              Take Test
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              All subtopics completed! Ready to test your knowledge?
            </p>
          </div>
        )}
      </ScrollArea>
        </>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="text-xs font-medium text-muted-foreground writing-mode-vertical rotate-180">
            Progress
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            {subtopics.map((subtopic) => (
              <button
                key={subtopic.id}
                onClick={() => onSubtopicSelect(subtopic)}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  subtopic.completed
                    ? "bg-primary"
                    : selectedSubtopic?.id === subtopic.id
                    ? "bg-primary/50 ring-2 ring-primary"
                    : "bg-muted hover:bg-muted-foreground/20"
                )}
                title={subtopic.name}
              >
                {subtopic.completed && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtopicTimeline;
