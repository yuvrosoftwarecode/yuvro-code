import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Course, Topic, Problem } from '@/pages/student/CodePractice';

interface TopicSelectionProps {
  course: Course;
  selectedTopic: Topic | null;
  onTopicSelect: (topic: Topic) => void;
  onProblemSelect: (problem: Problem) => void;
  onBack: () => void;
}

const topics: Topic[] = [
  { id: 'arrays', name: 'Arrays', problemCount: 45 },
  { id: 'linked-list', name: 'Linked List', problemCount: 32 },
  { id: 'stack', name: 'Stack', problemCount: 28 },
  { id: 'queue', name: 'Queue', problemCount: 25 },
  { id: 'tree', name: 'Tree', problemCount: 38 },
  { id: 'graph', name: 'Graph', problemCount: 42 },
  { id: 'hashmap', name: 'HashMap', problemCount: 30 },
  { id: 'sorting', name: 'Sorting', problemCount: 35 },
];

const mockProblems: Problem[] = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    score: 10,
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    inputFormat: 'Array of integers and target integer',
    outputFormat: 'Array of two indices',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists'],
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' }
    ],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]' }
    ]
  },
  {
    id: '2',
    title: 'Reverse Array',
    difficulty: 'Easy',
    score: 10,
    description: 'Given an array of integers, reverse the array in-place.',
    inputFormat: 'Array of integers',
    outputFormat: 'Reversed array',
    constraints: ['1 <= nums.length <= 10^5'],
    examples: [
      { input: 'nums = [1,2,3,4,5]', output: '[5,4,3,2,1]' }
    ],
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' }
    ]
  },
  {
    id: '3',
    title: 'Find Maximum Subarray',
    difficulty: 'Medium',
    score: 20,
    description: 'Find the contiguous subarray which has the largest sum.',
    inputFormat: 'Array of integers',
    outputFormat: 'Maximum sum',
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has the largest sum = 6' }
    ],
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' }
    ]
  },
  {
    id: '4',
    title: 'Merge Sorted Arrays',
    difficulty: 'Hard',
    score: 30,
    description: 'Merge two sorted arrays into one sorted array.',
    inputFormat: 'Two sorted arrays',
    outputFormat: 'Single merged sorted array',
    constraints: ['0 <= nums1.length, nums2.length <= 10^5'],
    examples: [
      { input: 'nums1 = [1,3,5], nums2 = [2,4,6]', output: '[1,2,3,4,5,6]' }
    ],
    testCases: [
      { input: '[1,3,5]\n[2,4,6]', expectedOutput: '[1,2,3,4,5,6]' }
    ]
  },
];

const TopicSelection = ({
  course,
  selectedTopic,
  onTopicSelect,
  onProblemSelect,
  onBack,
}: TopicSelectionProps) => {
  const [difficulty, setDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  const filteredProblems = difficulty === 'All'
    ? mockProblems
    : mockProblems.filter(p => p.difficulty === difficulty);

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
          </CardContent>
        </Card>

        {/* Problems Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Difficulty Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Difficulty Level</CardTitle>
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
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicSelection;
