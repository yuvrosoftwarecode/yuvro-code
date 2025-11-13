import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Trophy, Target, Brain, TrendingUp, Award, Calendar } from 'lucide-react';

interface ScoreAnalyticsProps {
  onBack: () => void;
  onViewInsights: () => void;
}

const ScoreAnalytics = ({ onBack, onViewInsights }: ScoreAnalyticsProps) => {
  const achievements = [
    { id: 1, title: '10 Problems Solved', icon: Trophy, unlocked: true },
    { id: 2, title: 'No AI Help Streak (5)', icon: Target, unlocked: true },
    { id: 3, title: 'Fast Solver', icon: TrendingUp, unlocked: false },
    { id: 4, title: 'Master of Arrays', icon: Award, unlocked: true },
  ];

  const recentHistory = [
    { id: 1, title: 'Two Sum', date: '2025-10-05', score: 10, hintsUsed: 0 },
    { id: 2, title: 'Reverse Array', date: '2025-10-05', score: 10, hintsUsed: 1 },
    { id: 3, title: 'Find Maximum', date: '2025-10-04', score: 20, hintsUsed: 0 },
    { id: 4, title: 'Merge Arrays', date: '2025-10-04', score: 30, hintsUsed: 2 },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button onClick={onViewInsights} variant="outline">
          <Brain className="h-4 w-4 mr-2" />
          View AI Insights
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Score & Analytics Dashboard</h1>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Problems Solved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">142</div>
            <p className="text-xs text-muted-foreground mt-1">+12 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3,420</div>
            <p className="text-xs text-muted-foreground mt-1">Top 15% globally</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg AI Help</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0.8</div>
            <p className="text-xs text-muted-foreground mt-1">per problem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Success Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground mt-1">on first attempt</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Charts Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Topic-wise Progress</CardTitle>
            <CardDescription>Problems solved by topic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { topic: 'Arrays', solved: 45, total: 60, color: 'bg-blue-500' },
                { topic: 'Trees', solved: 32, total: 50, color: 'bg-green-500' },
                { topic: 'Graphs', solved: 28, total: 45, color: 'bg-purple-500' },
                { topic: 'Dynamic Programming', solved: 15, total: 40, color: 'bg-orange-500' },
              ].map((item) => (
                <div key={item.topic} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.topic}</span>
                    <span className="text-muted-foreground">{item.solved}/{item.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${(item.solved / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Difficulty Distribution</CardTitle>
            <CardDescription>Problems by difficulty level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { level: 'Easy', count: 68, color: 'bg-green-500' },
                { level: 'Medium', count: 52, color: 'bg-yellow-500' },
                { level: 'Hard', count: 22, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.level} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">{item.level}</div>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${item.color} flex items-center justify-end pr-2`}
                      style={{ width: `${(item.count / 142) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-white">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Achievements & Badges</CardTitle>
          <CardDescription>Your milestones and accomplishments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 text-center ${
                    achievement.unlocked
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted border-muted opacity-50'
                  }`}
                >
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${
                    achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm font-medium">{achievement.title}</p>
                  {achievement.unlocked && (
                    <Badge variant="outline" className="mt-2">Unlocked</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detailed History</CardTitle>
              <CardDescription>Your recent problem-solving activity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{entry.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">+{entry.score} pts</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.hintsUsed} {entry.hintsUsed === 1 ? 'hint' : 'hints'} used
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreAnalytics;
