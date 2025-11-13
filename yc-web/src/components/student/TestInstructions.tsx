import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, AlertCircle, CheckCircle, FileText, Code, PenTool } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  duration: number;
  questions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface Course {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface TestInstructionsProps {
  topic: Topic;
  course?: Course | null;
  onStart: () => void;
  onBack: () => void;
}

const TestInstructions: React.FC<TestInstructionsProps> = ({
  topic,
  course,
  onStart,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          {course && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`w-4 h-4 rounded ${course.color}`} />
              <span className="text-sm text-muted-foreground">{course.name}</span>
            </div>
          )}
          <CardTitle className="text-2xl">{topic.name}</CardTitle>
          <CardDescription>Test Instructions</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Test Details */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium">{topic.duration} minutes</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            <div className="text-center">
              <FileText className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium">{topic.questions} questions</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <Badge variant={
                topic.difficulty === 'Easy' ? 'secondary' : 
                topic.difficulty === 'Medium' ? 'default' : 'destructive'
              }>
                {topic.difficulty}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Difficulty</div>
            </div>
          </div>

          <Separator />

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Test Instructions
            </h3>
            
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">1.</span>
                <span>The test contains multiple question types: Multiple Choice, Coding, and Descriptive answers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">2.</span>
                <span>You have <strong>{topic.duration} minutes</strong> to complete all {topic.questions} questions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">3.</span>
                <span>Once started, the timer cannot be paused or stopped.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">4.</span>
                <span>You can navigate between questions, but make sure to answer all of them.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">5.</span>
                <span>For coding questions, you can write and test your code in the provided editor.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">6.</span>
                <span>The test will auto-submit when time runs out.</span>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Question Types */}
          <div className="space-y-4">
            <h3 className="font-semibold">Question Types</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium text-sm">Multiple Choice</div>
                  <div className="text-xs text-muted-foreground">Select correct option(s)</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Code className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium text-sm">Coding</div>
                  <div className="text-xs text-muted-foreground">Write and test code</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <PenTool className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="font-medium text-sm">Descriptive</div>
                  <div className="text-xs text-muted-foreground">Written answers</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={onBack}>
              Back to Topics
            </Button>
            
            <Button onClick={onStart} size="lg">
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestInstructions;