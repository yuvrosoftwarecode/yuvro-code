import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Code2 } from 'lucide-react';
import { fetchTopicsByCourse, fetchSubtopicsByTopic, fetchCodingProblemsBySubtopic } from '@/services/courseService';
import type { Course, Topic, CodingProblem } from '@/pages/student/CodePractice';
import { toast } from 'sonner';

interface TopicSelectionProps {
  course: Course;
  selectedTopic: Topic | null;
  onTopicSelect: (topic: Topic) => void;
  onProblemSelect: (problem: CodingProblem) => void;
  onBack: () => void;
}

interface BackendTopic {
  id: string;
  name: string;
  order_index: number;
}

interface BackendCodingProblem {
  id: string;
  title: string;
  description: string;
  test_cases_basic: any[];
  test_cases_advanced: any[];
}

const TopicSelection = ({
  course,
  selectedTopic,
  onTopicSelect,
  onProblemSelect,
  onBack,
}: TopicSelectionProps) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const fetchedTopics = await fetchTopicsByCourse(course.id);
        
        // Transform backend topics to match our Topic interface
        const transformedTopics: Topic[] = fetchedTopics.map((topic: BackendTopic) => ({
          id: topic.id,
          name: topic.name,
          problemCount: Math.floor(Math.random() * 30) + 10, // TODO: Calculate actual count
          order_index: topic.order_index,
        }));
        
        setTopics(transformedTopics.sort((a, b) => a.order_index - b.order_index));
      } catch (error) {
        console.error('Failed to load topics:', error);
        toast.error('Failed to load topics');
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, [course.id]);

  useEffect(() => {
    if (selectedTopic) {
      loadProblemsForTopic(selectedTopic.id);
    }
  }, [selectedTopic]);

  const loadProblemsForTopic = async (topicId: string) => {
    setProblemsLoading(true);
    try {
      // First get subtopics for this topic
      const subtopics = await fetchSubtopicsByTopic(topicId);
      
      // Then get coding problems for each subtopic
      const allProblems: CodingProblem[] = [];
      
      for (const subtopic of subtopics) {
        try {
          const subtopicProblems = await fetchCodingProblemsBySubtopic(subtopic.id);
          
          // Transform backend problems to match our CodingProblem interface
          const transformedProblems: CodingProblem[] = subtopicProblems.map((problem: BackendCodingProblem) => ({
            id: problem.id,
            title: problem.title,
            difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as 'Easy' | 'Medium' | 'Hard', // TODO: Add difficulty field to backend
            score: Math.floor(Math.random() * 30) + 10, // TODO: Add score field to backend
            description: problem.description,
            test_cases_basic: problem.test_cases_basic || [],
            test_cases_advanced: problem.test_cases_advanced || [],
          }));
          
          allProblems.push(...transformedProblems);
        } catch (error) {
          console.error(`Failed to load problems for subtopic ${subtopic.id}:`, error);
        }
      }
      
      setProblems(allProblems);
    } catch (error) {
      console.error('Failed to load problems:', error);
      toast.error('Failed to load problems');
    } finally {
      setProblemsLoading(false);
    }
  };

  const filteredProblems = difficulty === 'All'
    ? problems
    : problems.filter(p => p.difficulty === difficulty);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'Hard':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="lg:col-span-3 space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Code Practice
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">{course.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Topics List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onTopicSelect(topic)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedTopic?.id === topic.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="font-medium">{topic.name}</div>
                <div className={`text-xs ${
                  selectedTopic?.id === topic.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {topic.problemCount} problems
                </div>
              </button>
            ))}
            
            {topics.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Code2 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No topics available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Problems Grid */}
        <div className="lg:col-span-3 space-y-4">
          {selectedTopic ? (
            <>
              {/* Difficulty Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedTopic.name} - Difficulty Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap">
                  {(['All', 'Easy', 'Medium', 'Hard'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={difficulty === level ? 'default' : 'outline'}
                      onClick={() => setDifficulty(level)}
                      size="sm"
                    >
                      {level}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Problems List */}
              {problemsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProblems.map((problem) => (
                    <Card key={problem.id} className="hover:shadow-lg transition-all duration-200">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{problem.title}</CardTitle>
                          <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {problem.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Score: {problem.score}</span>
                          <Button onClick={() => onProblemSelect(problem)} size="sm">
                            Solve Problem
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredProblems.length === 0 && !problemsLoading && (
                    <div className="col-span-full text-center py-12">
                      <Code2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No Problems Available
                      </h3>
                      <p className="text-muted-foreground">
                        No coding problems are available for this topic and difficulty level.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {filteredProblems.length > 0 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Code2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select a Topic
                </h3>
                <p className="text-muted-foreground">
                  Choose a topic from the left sidebar to view available coding problems.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicSelection;