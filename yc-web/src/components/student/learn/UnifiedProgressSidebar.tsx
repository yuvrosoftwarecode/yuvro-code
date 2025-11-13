import { Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Topic } from './TopicSidebar';
import { Subtopic } from './SubtopicTimeline';

interface UnifiedProgressSidebarProps {
  courseName: string;
  courseIcon: string;
  topics: Topic[];
  selectedTopic: Topic | null;
  onTopicSelect: (topic: Topic) => void;
  subtopics: Subtopic[];
  selectedSubtopic: Subtopic | null;
  onSubtopicSelect: (subtopic: Subtopic) => void;
  allCompleted: boolean;
  onTakeTest?: () => void;
}

const UnifiedProgressSidebar = ({
  courseName,
  courseIcon,
  topics,
  selectedTopic,
  onTopicSelect,
  subtopics,
  selectedSubtopic,
  onSubtopicSelect,
  allCompleted,
  onTakeTest
}: UnifiedProgressSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

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

      {!isCollapsed ? (
        <>
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{courseIcon}</span>
              <h2 className="text-lg font-semibold text-foreground">{courseName}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Track your learning progress
            </p>
          </div>

          <ScrollArea className="flex-1">
            {/* Topics Section with Nested Subtopics */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                TOPICS
              </h3>
              <div className="space-y-2">
                {topics.map((topic) => {
                  const isExpanded = expandedTopics.has(topic.id);
                  const topicSubtopics = selectedTopic?.id === topic.id ? subtopics : [];
                  
                  return (
                    <div key={topic.id} className="space-y-2">
                      {/* Topic Button */}
                      <button
                        onClick={() => {
                          onTopicSelect(topic);
                          toggleTopic(topic.id);
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all hover:bg-accent/50",
                          selectedTopic?.id === topic.id
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-muted/30 border border-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {topicSubtopics.length > 0 && (
                              isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )
                            )}
                            <span className={cn(
                              "font-medium text-sm",
                              selectedTopic?.id === topic.id ? "text-primary" : "text-foreground"
                            )}>
                              {topic.name}
                            </span>
                          </div>
                          {topic.completed && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${topic.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {topic.subtopicsCompleted}/{topic.totalSubtopics}
                          </span>
                        </div>
                      </button>

                      {/* Nested Subtopics */}
                      {isExpanded && topicSubtopics.length > 0 && (
                        <div className="ml-6 pl-4 border-l-2 border-border space-y-3 py-2">
                          <p className="text-xs text-muted-foreground mb-2">
                            {topicSubtopics.filter(s => s.completed).length} of {topicSubtopics.length} completed
                          </p>
                          
                          {topicSubtopics.map((subtopic) => (
                            <button
                              key={subtopic.id}
                              onClick={() => onSubtopicSelect(subtopic)}
                              className={cn(
                                "flex items-start gap-3 w-full text-left transition-all group p-2 rounded-lg hover:bg-accent/30",
                                selectedSubtopic?.id === subtopic.id && "bg-accent/50"
                              )}
                            >
                              {/* Circle indicator */}
                              <div className="relative flex-shrink-0">
                                <div
                                  className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    subtopic.completed
                                      ? "bg-primary border-primary"
                                      : selectedSubtopic?.id === subtopic.id
                                      ? "bg-background border-primary"
                                      : "bg-background border-border group-hover:border-primary/50"
                                  )}
                                >
                                  {subtopic.completed ? (
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                  ) : (
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full",
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

                          {/* Take Test Button */}
                          {allCompleted && onTakeTest && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <Button
                                onClick={onTakeTest}
                                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                                size="sm"
                              >
                                Take Test
                              </Button>
                              <p className="text-xs text-center text-muted-foreground mt-2">
                                All subtopics completed!
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="text-2xl mb-2" title={courseName}>
            {courseIcon}
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => {
                  onTopicSelect(topic);
                  setIsCollapsed(false);
                }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs font-bold",
                  topic.completed
                    ? "bg-primary text-primary-foreground"
                    : selectedTopic?.id === topic.id
                    ? "bg-primary/50 ring-2 ring-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
                )}
                title={topic.name}
              >
                {topic.name.substring(0, 1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedProgressSidebar;
