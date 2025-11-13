import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Brain, TrendingUp, TrendingDown, Target, Sparkles } from 'lucide-react';

interface AIInsightsProps {
  onBack: () => void;
  onGeneratePracticeSet: () => void;
}

const AIInsights = ({ onBack, onGeneratePracticeSet }: AIInsightsProps) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Analytics
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Insights & Personalized Feedback</h1>
        <p className="text-muted-foreground">
          AI-powered analysis of your coding performance and personalized recommendations
        </p>
      </div>

      {/* Strength Areas */}
      <Card className="mb-6 border-green-500/20 bg-green-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-700 dark:text-green-400">Strength Areas</CardTitle>
          </div>
          <CardDescription>Topics where you excel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { topic: 'Arrays', proficiency: 95, problems: 45 },
              { topic: 'Recursion', proficiency: 88, problems: 32 },
              { topic: 'Sorting Algorithms', proficiency: 92, problems: 28 },
              { topic: 'String Manipulation', proficiency: 85, problems: 38 },
            ].map((strength) => (
              <div key={strength.topic} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div>
                  <p className="font-medium">{strength.topic}</p>
                  <p className="text-xs text-muted-foreground">{strength.problems} problems solved</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  {strength.proficiency}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weak Areas */}
      <Card className="mb-6 border-orange-500/20 bg-orange-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-700 dark:text-orange-400">Areas for Improvement</CardTitle>
          </div>
          <CardDescription>Topics that need more practice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { topic: 'Graph Algorithms', proficiency: 45, problems: 12, recommendation: 'Focus on BFS/DFS' },
              { topic: 'Dynamic Programming', proficiency: 52, problems: 15, recommendation: 'Practice memoization' },
              { topic: 'Binary Trees', proficiency: 58, problems: 18, recommendation: 'Master tree traversals' },
              { topic: 'Linked Lists', proficiency: 62, problems: 20, recommendation: 'Work on edge cases' },
            ].map((weak) => (
              <div key={weak.topic} className="p-3 bg-background rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{weak.topic}</p>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500/20">
                    {weak.proficiency}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{weak.problems} problems solved</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  💡 {weak.recommendation}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Help Ratio */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Assistance Analysis</CardTitle>
          </div>
          <CardDescription>Your dependency on AI help over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Average AI Hints per Problem</p>
                <p className="text-sm text-muted-foreground mt-1">Based on last 50 problems</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">0.8</p>
                <p className="text-xs text-green-600">↓ 15% from last month</p>
              </div>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Great Progress!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You're becoming more independent in problem-solving. Keep up the excellent work!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Next Topics */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Suggested Next Topics</CardTitle>
          </div>
          <CardDescription>Curated based on your learning path</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { topic: 'Graph Traversal (BFS/DFS)', reason: 'Low proficiency area', priority: 'High' },
              { topic: 'Advanced Dynamic Programming', reason: 'Natural progression', priority: 'Medium' },
              { topic: 'Heap and Priority Queue', reason: 'Commonly appears in interviews', priority: 'High' },
            ].map((suggestion, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{suggestion.topic}</p>
                  <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    suggestion.priority === 'High'
                      ? 'bg-red-500/10 text-red-700 border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                  }
                >
                  {suggestion.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate Practice Set */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Ready for a Challenge?</h3>
              <p className="text-sm text-muted-foreground">
                Generate a personalized practice set tailored to your weaknesses and learning goals
              </p>
            </div>
            <Button onClick={onGeneratePracticeSet} size="lg" className="gap-2">
              <Brain className="h-4 w-4" />
              Generate Personalized Practice Set
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
