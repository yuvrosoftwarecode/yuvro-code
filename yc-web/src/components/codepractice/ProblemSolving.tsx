import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronLeft, Brain, Loader2, Code } from "lucide-react";
import { CodeEditor } from "@/components/ui/code-editor";
import { executeCodeOnBackend, formatTestResults } from "@/services/codeExecutor";
import { toast } from "sonner";
import type { Course, Topic, Problem } from "@/pages/CodePractice";

interface ProblemSolvingProps {
  course: Course;
  topic: Topic;
  subtopic: any;
  onBack: () => void;
  onViewAnalytics: () => void;
}

const ProblemSolving = ({
  course,
  topic,
  subtopic,
  onBack,
  onViewAnalytics,
}: ProblemSolvingProps) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [aiHelpUsed, setAiHelpUsed] = useState(0);
  const [showEditor, setShowEditor] = useState(false);

  // Fetch coding problem(s) for this subtopic
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://127.0.0.1:8001/api/course/coding-problems/?subtopic=${subtopic.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const problemsList = Array.isArray(res.data) ? res.data : res.data.results ||[];

        if (problemsList.length > 0) {
          const prob = problemsList[0];
          setProblem({
            id: prob.id,
            title: prob.title,
            description: prob.description,
            difficulty: prob.difficulty ||"Easy",
            score: prob.score || 10,
            inputFormat: prob.input,
            outputFormat: "Expected output as per test cases",
            constraints: [],
            examples: prob.test_cases?.map((t: any) => ({
              input: JSON.stringify(t.input),
              output: JSON.stringify(t.expected_output),
              explanation: t.description,
            })),
            testCases: prob.test_cases || [],
          });
        } else {
          setProblem({
            id: "no-prob",
            title: "No problems found",
            description: "This subtopic currently has no coding problems.",
            difficulty: "Easy",
            score: 0,
            inputFormat: "-",
            outputFormat: "-",
            constraints: [],
            examples: [],
            testCases: [],
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load coding problems.");

        setProblem({
          id: "error",
          title: "Error loading problem",
          description: "Failed to load coding problems.",
          difficulty: "Easy",
          score: 0,
          inputFormat: "-",
          outputFormat: "-",
          constraints: [],
          examples: [],
          testCases: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [subtopic.id]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "Hard":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleRunCode = async () => {
    if (!problem || problem.id === "no-prob" || problem.id === "error") {
      toast.error("No problem to test.");
      return;
    }

    if (!code.trim()) {
      toast.error("Please write some code.");
      return;
    }

    setExecuting(true);
    setOutput("Running test cases...");

    try {
      const token = localStorage.getItem("token");

      const result = await executeCodeOnBackend(
        code,
        selectedLanguage,
        problem.testCases as any,
        token!
      );

      setTestResults(result);
      const formatted = formatTestResults(result);
      setOutput(formatted);

      if (result.success) {
        if (result.totalPassed === result.totalTests) {
          toast.success("🎉 All tests passed!");
        } else {
          toast.warning(
            `${result.totalPassed}/${result.totalTests} tests passed.`
          );
        }
      } else {
        toast.error("Execution failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Execution error.");
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success(`+${problem?.score} points`);
    setTimeout(onViewAnalytics, 2000);
  };

  const handleAIHelp = () => {
    setAiHelpUsed((prev) => prev + 1);
    toast.info("AI hint used — 1 point deducted");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading Problem...
      </div>
    );

  if (!problem)
    return (
      <div className="text-center py-10 text-gray-600">
        ❌ No problem found.
      </div>
    );

  // Problem Content
  const ProblemContent = (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-2">{problem.title}</CardTitle>
            <Badge
              variant="outline"
              className={getDifficultyColor(problem.difficulty)}
            >
              {problem.difficulty}
            </Badge>
          </div>

          {!showEditor && (
            <Button onClick={() => setShowEditor(true)} variant="outline">
              Open Editor
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="statement">
          <TabsList>
            <TabsTrigger value="statement">Statement</TabsTrigger>
            <TabsTrigger value="ai-help">AI Help</TabsTrigger>
          </TabsList>

          <TabsContent value="statement" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">
                {problem.description}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Input Format</h3>
              <p className="text-sm text-muted-foreground">
                {problem.inputFormat}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Output Format</h3>
              <p className="text-sm text-muted-foreground">
                {problem.outputFormat}
              </p>
            </div>

            {problem.examples?.length > 0 &&
              problem.examples.map((example, idx) => (
                <Card className="p-4" key={idx}>
                  <div>
                    <strong>Input:</strong>{" "}
                    <code>{example.input}</code>
                  </div>
                  <div>
                    <strong>Output:</strong>{" "}
                    <code>{example.output}</code>
                  </div>
                  {example.explanation && (
                    <div className="text-xs mt-2">
                      <strong>Explanation:</strong> {example.explanation}
                    </div>
                  )}
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="ai-help">
            <Card className="p-4 bg-muted/50">
              <p className="text-sm">
                💡 Try using a hash map to reduce complexity.
              </p>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={handleAIHelp}
              >
                <Brain className="mr-1 h-4 w-4" /> Get Another Hint
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button onClick={onBack} variant="outline">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleSubmit} disabled={submitted}>
            {submitted ? "✓ Submitted" : "Submit Solution"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // 🔹 Editor View
  if (showEditor)
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">

        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => setShowEditor(false)}>
            ← Back
          </Button>
          <span className="text-sm text-muted-foreground">
            Score: {problem.score} | AI Help: {aiHelpUsed}
          </span>
        </div>

        {/* Split View */}
        <div className="flex-1 h-full overflow-hidden">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full"
          >
            {/* LEFT SIDE */}
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full w-full overflow-y-auto p-4">
                {ProblemContent}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* RIGHT SIDE */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full w-full flex flex-col p-4 overflow-hidden">

                {/* Editor */}
                <div className="flex-1 min-h-0">
                    <CodeEditor
                      initialCode={code}
                      onCodeChange={setCode}
                      onRun={handleRunCode}
                      showLanguageSelector
                    />

                </div>

                {/* Output */}
                {output && (
                  <Card className="mt-4 h-48 overflow-auto">
                    <CardHeader>
                      <CardTitle className="text-sm">Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm whitespace-pre-wrap">
                        {output}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ResizablePanel>

          </ResizablePanelGroup>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {course.name}
        </Button>
        <span>/</span>
        <span>{topic.name}</span>
        <span>/</span>
        <span className="font-medium">{subtopic.name}</span>
      </div>

      {ProblemContent}
    </div>
  );
};

export default ProblemSolving;
