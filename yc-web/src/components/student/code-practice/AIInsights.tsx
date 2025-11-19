import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Brain, TrendingUp, Target, Lightbulb, BookOpen, Zap } from 'lucide-react';
import codeExecutorService from '@/services/codeExecutorService';
import { toast } from 'sonner';

interface AIInsightsProps {
  onBack: () => void;
  onGeneratePracticeSet: () => void;
}

interface Insight {
  type: 'strength' | 'weakness' | 'recommendation' | 'trend';
  title: string;
  description: string;
  icon: any;
  color: string;
}

const AIInsights = ({ onBack, onGeneratePracticeSet }: AIInsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPractice, setGeneratingPractice] = useState(false);

  useEffect(() => {
    const generateInsights = async () => {
      try {
        const submissions = await codeExecutorService.getSubmissions();
        
        const generatedInsights: Insight[] = [];

        // Analyze language usage
        const languageStats: Record<string, number> = {};
        submissions.forEach(s => {
          languageStats[s.language] = (languageStats[s.language] || 0) + 1;
        });

        const mostUsedLanguage = Object.entries(languageStats)
          .sort(([,a], [,b]) => b - a)[0];

        if (mostUsedLanguage) {
          generatedInsights.push({
            type: 'strength',
            title: `${mostUsedLanguage[0]} Proficiency`,
            description: `You've shown strong consistency with ${mostUsedLanguage[0]}, completing ${mostUsedLanguage[1]} submissions. Consider exploring advanced ${mostUsedLanguage[0]} concepts.`,
            icon: TrendingUp,
            color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          });
        }

        // Analyze success rate
        const successRate = submissions.length > 0 
          ? (submissions.filter(s => s.status === 'completed').length / submissions.length) * 100 
          : 0;

        if (successRate > 70) {
          generatedInsights.push({
            type: 'strength',
            title: 'High Success Rate',
            description: `Excellent work! You have a ${successRate.toFixed(1)}% success rate. You're demonstrating strong problem-solving skills.`,
            icon: Target,
            color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          });
        } else if (successRate < 50) {
          generatedInsights.push({
            type: 'weakness',
            title: 'Focus on Fundamentals',
            description: `Your current success rate is ${successRate.toFixed(1)}%. Consider reviewing basic algorithms and data structures to improve your problem-solving approach.`,
            icon: BookOpen,
            color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          });
        }

        // Analyze execution time
        const executionTimes = submissions.filter(s => s.execution_time > 0).map(s => s.execution_time);
        const avgExecutionTime = executionTimes.length > 0 
          ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
          : 0;

        if (avgExecutionTime > 1.5) {
          generatedInsights.push({
            type: 'recommendation',
            title: 'Optimize for Performance',
            description: `Your average execution time is ${avgExecutionTime.toFixed(2)}s. Focus on algorithm optimization and time complexity to improve performance.`,
            icon: Zap,
            color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          });
        } else if (avgExecutionTime < 0.5) {
          generatedInsights.push({
            type: 'strength',
            title: 'Efficient Solutions',
            description: `Great job! Your solutions run efficiently with an average execution time of ${avgExecutionTime.toFixed(2)}s. You understand algorithm optimization well.`,
            icon: Zap,
            color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          });
        }

        // General recommendations
        generatedInsights.push({
          type: 'recommendation',
          title: 'Diversify Your Practice',
          description: 'Try solving problems in different categories like dynamic programming, graph algorithms, and system design to broaden your skills.',
          icon: Lightbulb,
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        });

        generatedInsights.push({
          type: 'trend',
          title: 'Consistent Practice',
          description: 'Maintain regular coding practice. Aim to solve at least 2-3 problems daily to keep your skills sharp and build momentum.',
          icon: TrendingUp,
          color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        });

        setInsights(generatedInsights);
      } catch (error) {
        console.error('Failed to generate insights:', error);
        toast.error('Failed to generate AI insights');
      } finally {
        setLoading(false);
      }
    };

    generateInsights();
  }, []);

  const handleGeneratePracticeSet = async () => {
    setGeneratingPractice(true);
    
    // Simulate AI practice set generation
    setTimeout(() => {
      toast.success('AI-powered practice set generated! Redirecting to topics...');
      setGeneratingPractice(false);
      onGeneratePracticeSet();
    }, 2000);
  };

  const getInsightTypeInfo = (type: string) => {
    switch (type) {
      case 'strength':
        return { label: 'Strength', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' };
      case 'weakness':
        return { label: 'Area to Improve', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' };
      case 'recommendation':
        return { label: 'Recommendation', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' };
      case 'trend':
        return { label: 'Trend', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' };
      default:
        return { label: 'Insight', color: 'bg-muted text-muted-foreground' };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Analytics
          </Button>
          <span>/</span>
          <span className="text-foreground font-medium">AI Insights</span>
        </div>
        <Button 
          onClick={handleGeneratePracticeSet}
          disabled={generatingPractice}
          className="gap-1"
        >
          <Brain className="h-4 w-4" />
          {generatingPractice ? 'Generating...' : 'Generate Practice Set'}
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          AI-Powered Insights
        </h1>
        <p className="text-muted-foreground">
          Personalized recommendations based on your coding practice patterns and performance.
        </p>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const typeInfo = getInsightTypeInfo(insight.type);
          
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${insight.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <Badge variant="outline" className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Practice Set Generation */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">AI-Powered Practice Recommendations</CardTitle>
              <p className="text-muted-foreground">
                Get personalized problem sets based on your strengths and areas for improvement
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Adaptive Difficulty</h4>
              <p className="text-sm text-muted-foreground">
                Problems tailored to your current skill level with gradual progression
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Weakness Focus</h4>
              <p className="text-sm text-muted-foreground">
                Extra practice in areas where you need improvement
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Skill Reinforcement</h4>
              <p className="text-sm text-muted-foreground">
                Strengthen your existing skills with challenging variations
              </p>
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleGeneratePracticeSet}
              disabled={generatingPractice}
              size="lg"
              className="gap-2"
            >
              <Brain className="h-5 w-5" />
              {generatingPractice ? 'Generating Your Practice Set...' : 'Generate My Practice Set'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {insights.length === 0 && !loading && (
        <div className="text-center py-12">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Insights Available</h3>
          <p className="text-muted-foreground">
            Complete more coding problems to receive personalized AI insights and recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;