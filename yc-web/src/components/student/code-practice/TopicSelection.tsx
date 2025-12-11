import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Code2, Target, CheckCircle2 } from 'lucide-react';
import {
  fetchTopicsByCourse,
  fetchSubtopicsByTopic,
  fetchCodingProblemsBySubtopic,
} from '@/services/courseService';
import { fetchQuestions } from '@/services/questionService';
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

  // Load topics
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const fetchedTopics = await fetchTopicsByCourse(course.id);

        // Get problem counts for each topic
        const topicsWithCounts = await Promise.all(
          fetchedTopics.map(async (topic: BackendTopic) => {
            try {
              const questions = await fetchQuestions({
                topic: topic.id,
                categories: 'practice',
                type: 'coding'
              });
              return {
                id: topic.id,
                name: topic.name,
                problemCount: questions.length,
                order_index: topic.order_index,
              };
            } catch (error) {
              console.error(`Failed to load problem count for topic ${topic.id}:`, error);
              return {
                id: topic.id,
                name: topic.name,
                problemCount: 0,
                order_index: topic.order_index,
              };
            }
          })
        );

        setTopics(
          topicsWithCounts.sort((a, b) => a.order_index - b.order_index)
        );
      } catch (error) {
        toast.error('Failed to load topics');
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, [course.id]);

  // Load problems when topic or difficulty changes
  useEffect(() => {
    if (selectedTopic) loadProblems(selectedTopic.id);
  }, [selectedTopic, difficulty]);

  const loadProblems = async (topicId: string) => {
    setProblemsLoading(true);
    try {
      // Prepare filters for question service
      const filters: any = {
        topic: topicId,
        categories: 'practice',
        type: 'coding'
      };

      // Add difficulty filter if not 'All'
      if (difficulty !== 'All') {
        filters.difficulty = difficulty.toLowerCase();
      }

      // Load questions from question service with category 'practice' and type 'coding'
      const questions = await fetchQuestions(filters);

      // Transform questions to CodingProblem format
      const transformedProblems: CodingProblem[] = questions.map((q) => ({
        id: q.id,
        title: q.title,
        difficulty: q.difficulty === 'easy' ? 'Easy' : 
                   q.difficulty === 'medium' ? 'Medium' : 'Hard',
        score: q.marks,
        description: q.content,
        test_cases_basic: q.test_cases_basic?.map(tc => ({
          input_data: tc.input,
          expected_output: tc.expected_output,
          weight: 1
        })) || [],
        test_cases_advanced: q.test_cases_advanced?.map(tc => ({
          input_data: tc.input,
          expected_output: tc.expected_output,
          weight: 1
        })) || [],
      }));

      setProblems(transformedProblems);
    } catch (error) {
      console.error('Failed to load problems:', error);
      toast.error('Failed to load problems');
    } finally {
      setProblemsLoading(false);
    }
  };

  // Problems are already filtered by the server based on difficulty
  const filteredProblems = problems;

  // Difficulty badge colors (pure Tailwind)
  const difficultyColors = {
    Easy: 'bg-green-100 text-green-700 border border-green-300',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    Hard: 'bg-red-100 text-red-700 border border-red-300',
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 w-1/4 rounded"></div>
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
    <div className="container mx-auto px-4 py-3 max-w-9xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Code Practice
        </Button>
        <span>/</span>
        <span className="text-gray-700 font-medium">{course.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Topics */}
        <Card className="lg:col-span-1 border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Topics</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onTopicSelect(topic)}
                className={`w-full text-left p-3 rounded-lg transition ${
                  selectedTopic?.id === topic.id
                    ? 'bg-black text-white'
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                <div className="font-medium">{topic.name}</div>
                <div
                  className={`text-xs ${
                    selectedTopic?.id === topic.id
                      ? 'text-white'
                      : 'text-gray-500'
                  }`}
                >
                  {topic.problemCount} problems
                </div>
              </button>
            ))}

            {topics.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Code2 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No topics available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Problems Section */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedTopic ? (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <Code2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Topic
                </h3>
                <p className="text-gray-500">
                  Choose a topic from the left to view available problems.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Difficulty Filter */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">
                    {selectedTopic.name} · Difficulty
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex gap-2 flex-wrap ">
                  {(['All', 'Easy', 'Medium', 'Hard'] as const).map((level) => (
                    <Button
                      key={level}
                      variant="ghost"
                      size="sm"
                      className={
                        difficulty === level
                          ? 'bg-black text-white !border-none shadow-sm'
                          : 'hover:bg-gray-100 text-gray-800'
                      }
                      onClick={() => setDifficulty(level)}
                    >
                      {level}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Problems Grid */}
              {problemsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-48 bg-gray-200 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProblems.map((problem) => (
                    <Card
                      key={problem.id}
                      className="border border-gray-200 shadow-sm hover:shadow-md transition"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base text-gray-900">
                            {problem.title}
                          </CardTitle>

                          <Badge
                            variant="outline"
                            className={`px-2 py-1 rounded-md text-xs font-medium ${difficultyColors[problem.difficulty]}`}
                          >
                            {problem.difficulty}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {problem.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Score: {problem.score}
                          </span>

                          <Button
                            size="sm"
                            className="bg-black text-white hover:bg-gray-800"
                            onClick={() => onProblemSelect(problem)}
                          >
                            Solve Problem
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredProblems.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Code2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Problems Available
                      </h3>
                      <p className="text-gray-500">
                        No problems match this difficulty level.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {filteredProblems.length > 0 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-gray-300 text-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-gray-300 text-gray-600"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicSelection;
