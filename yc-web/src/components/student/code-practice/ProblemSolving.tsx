import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ChevronLeft, ChevronRight, Brain, Play, RotateCcw, Copy, Maximize2 } from 'lucide-react';
import { CodeEditor } from '@/components/ui/code-editor';
import { toast } from 'sonner';
import type { Course, Topic, Problem } from '@/pages/student/CodePractice';

interface ProblemSolvingProps {
  problem: Problem;
  course: Course;
  topic: Topic;
  onBack: () => void;
  onViewAnalytics: () => void;
}

const ProblemSolving = ({ problem, course, topic, onBack, onViewAnalytics }: ProblemSolvingProps) => {
  const [showEditor, setShowEditor] = useState(false);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [aiHelpUsed, setAiHelpUsed] = useState(0);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleRunCode = () => {
    setOutput('Running test cases...\n\nTest Case 1: ✓ Passed\nTest Case 2: ✓ Passed\n\nAll test cases passed!');
    toast.success('Code executed successfully!');
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success(`Problem solved! +${problem.score} points earned`);
    setTimeout(() => {
      onViewAnalytics();
    }, 2000);
  };

  const handleAIHelp = () => {
    setShowAIPanel(true);
    setAiHelpUsed(prev => prev + 1);
    toast.info('AI Hint used — 1 point deducted');
  };

  const renderProblemContent = () => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{problem.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
                {problem.difficulty}
              </Badge>
              <span className="text-sm text-muted-foreground">Score: {problem.score}</span>
            </div>
          </div>
          {!showEditor && (
            <Button onClick={() => setShowEditor(true)} variant="outline">
              Show Code Editor
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="statement" className="w-full">
          <TabsList>
            <TabsTrigger value="statement">Statement</TabsTrigger>
            <TabsTrigger value="ai-help">AI Help</TabsTrigger>
          </TabsList>

          <TabsContent value="statement" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{problem.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Input Format</h3>
              <p className="text-sm text-muted-foreground">{problem.inputFormat}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Output Format</h3>
              <p className="text-sm text-muted-foreground">{problem.outputFormat}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Constraints</h3>
              <ul className="list-disc list-inside space-y-1">
                {problem.constraints.map((constraint, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">{constraint}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Examples</h3>
              {problem.examples.map((example, idx) => (
                <div key={idx} className="bg-muted p-4 rounded-lg space-y-2 mb-2">
                  <div>
                    <span className="font-medium text-sm">Input: </span>
                    <code className="text-sm">{example.input}</code>
                  </div>
                  <div>
                    <span className="font-medium text-sm">Output: </span>
                    <code className="text-sm">{example.output}</code>
                  </div>
                  {example.explanation && (
                    <div>
                      <span className="font-medium text-sm">Explanation: </span>
                      <span className="text-sm text-muted-foreground">{example.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai-help" className="space-y-4 mt-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm">
                      💡 <strong>Hint:</strong> Try using a hash map to store the values you've seen so far. 
                      This will allow you to check in constant time whether the complement exists.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Each hint deducts 1 point from your final score.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button onClick={handleAIHelp} variant="outline" className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Get Another Hint
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onBack} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Problem
          </Button>
          <Button variant="outline" disabled>
            Next Problem
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button onClick={handleSubmit} className="ml-auto" disabled={submitted}>
            {submitted ? '✓ Submitted' : 'Submit Solution'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (showEditor) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <Button onClick={() => setShowEditor(false)} variant="ghost" size="sm">
            ← Back to Normal View
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Score: {problem.score} | AI Help: {aiHelpUsed}
            </span>
          </div>
        </div>

        {/* Split View */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-auto p-6">
                {renderProblemContent()}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col">
                <div className="flex-1 p-6">
                  <CodeEditor
                    initialCode={code}
                    onCodeChange={setCode}
                    onRun={handleRunCode}
                    showLanguageSelector
                  />
                  
                  {/* Output Console */}
                  {output && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-sm">Output</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm font-mono whitespace-pre-wrap">{output}</pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
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
          {course.name}
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">{topic.name}</span>
        <span>/</span>
        <span className="text-foreground font-medium">{problem.title}</span>
      </div>

      {renderProblemContent()}
    </div>
  );
};

export default ProblemSolving;
