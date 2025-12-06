import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    FileQuestion,
    Code,
    FileText,
    Filter,
    X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
    id: string;
    name: string;
}

interface Topic {
    id: string;
    name: string;
    course: string;
}

interface Subtopic {
    id: string;
    name: string;
    topic: string;
}

interface Question {
    id: string;
    type: "mcq" | "coding" | "descriptive";
    title: string;
    content: string;
    level: "course" | "topic" | "subtopic";
    course?: string;
    topic?: string;
    subtopic?: string;
    difficulty: "easy" | "medium" | "hard";
    marks: number;
    categories: string[];
    mcq_options?: string[];
    mcq_correct_answer_index?: number;
    test_cases_basic?: any[];
    test_cases_advanced?: any[];
    created_at: string;
}

interface QuestionBankManagerProps {
    course: Course | null;
    selectedTopic: Topic | null;
    selectedSubtopic: Subtopic | null;
    topics: Topic[];
}

const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
    course,
    selectedTopic,
    selectedSubtopic,
    topics,
}) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [filterLevel, setFilterLevel] = useState<"all" | "course" | "topic" | "subtopic">("all");
    const [filterDifficulty, setFilterDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
    const [filterCategory, setFilterCategory] = useState<"all" | "learn" | "practice" | "skill_test" | "contest">("all");

    // View states - replace modal with inline view
    const [currentView, setCurrentView] = useState<"list" | "create" | "edit">("list");
    const [selectedQuestionType, setSelectedQuestionType] = useState<"mcq" | "coding" | "descriptive">("mcq");
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        type: "mcq" as "mcq" | "coding" | "descriptive",
        title: "",
        content: "",
        level: "subtopic" as "course" | "topic" | "subtopic",
        course: "",
        topic: "",
        subtopic: "",
        difficulty: "easy" as "easy" | "medium" | "hard",
        marks: 2,
        categories: [] as string[],
        mcq_options: ["", "", "", ""],
        mcq_correct_answer_index: 0,
        test_cases_basic: [],
        test_cases_advanced: [],
    });

    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadQuestions();
    }, [course, selectedTopic, selectedSubtopic]);

    const loadQuestions = async () => {
        if (!course) return;

        setLoading(true);
        try {
            const { fetchQuestionsByLevel } = await import("@/services/courseService");
            const promises = [];
            
            // Always load course-level questions
            promises.push(fetchQuestionsByLevel("course", course.id));
            
            // Load topic-level questions if topic is selected
            if (selectedTopic) {
                promises.push(fetchQuestionsByLevel("topic", selectedTopic.id));
            }
            
            // Load subtopic-level questions if subtopic is selected
            if (selectedSubtopic) {
                promises.push(fetchQuestionsByLevel("subtopic", selectedSubtopic.id));
            }
            
            const questionArrays = await Promise.all(promises);
            const allQuestions = questionArrays.flat();
            setQuestions(allQuestions);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load questions",
                variant: "destructive",
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateView = () => {
        setCurrentView("create");
        setEditingQuestion(null);

        // Smart level selection logic
        let defaultLevel: "course" | "topic" | "subtopic" = "course";
        if (selectedSubtopic) {
            defaultLevel = "subtopic";
        } else if (selectedTopic) {
            defaultLevel = "topic";
        }

        setFormData({
            type: selectedQuestionType,
            title: "",
            content: "",
            level: defaultLevel,
            course: course?.id || "",
            topic: selectedTopic?.id || "",
            subtopic: selectedSubtopic?.id || "",
            difficulty: "easy",
            marks: selectedQuestionType === "coding" ? 10 : 2,
            categories: [],
            mcq_options: ["", "", "", ""],
            mcq_correct_answer_index: 0,
            test_cases_basic: [],
            test_cases_advanced: [],
        });
    };

    const openEditView = (question: Question) => {
        setCurrentView("edit");
        setEditingQuestion(question);
        setSelectedQuestionType(question.type);
        setFormData({
            type: question.type,
            title: question.title,
            content: question.content,
            level: question.level,
            course: question.course || "",
            topic: question.topic || "",
            subtopic: question.subtopic || "",
            difficulty: question.difficulty,
            marks: question.marks,
            categories: question.categories || [],
            mcq_options: question.mcq_options || ["", "", "", ""],
            mcq_correct_answer_index: question.mcq_correct_answer_index || 0,
            test_cases_basic: question.test_cases_basic || [],
            test_cases_advanced: question.test_cases_advanced || [],
        });
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            toast({
                title: "Validation Error",
                description: "Title and content are required",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const { createQuestion, updateQuestion } = await import("@/services/courseService");

            if (currentView === "create") {
                const newQuestion = await createQuestion(formData);
                setQuestions(prev => [newQuestion, ...prev]);
                toast({
                    title: "Success",
                    description: "Question created successfully",
                });
            } else if (editingQuestion) {
                const updatedQuestion = await updateQuestion(editingQuestion.id, formData);
                setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
                toast({
                    title: "Success",
                    description: "Question updated successfully",
                });
            }

            setCurrentView("list");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save question",
                variant: "destructive",
            });
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (questionId: string) => {
        try {
            const { deleteQuestion } = await import("@/services/courseService");
            await deleteQuestion(questionId);
            setQuestions(prev => prev.filter(q => q.id !== questionId));
            toast({
                title: "Success",
                description: "Question deleted successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete question",
                variant: "destructive",
            });
            console.error(error);
        }
    };

    const filteredQuestions = questions.filter(question => {
        const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            question.content.toLowerCase().includes(searchTerm.toLowerCase());
        // Use selectedQuestionType for filtering instead of filterType
        const matchesType = question.type === selectedQuestionType;
        const matchesLevel = filterLevel === "all" || question.level === filterLevel;
        const matchesDifficulty = filterDifficulty === "all" || question.difficulty === filterDifficulty;
        const matchesCategory = filterCategory === "all" || question.categories.includes(filterCategory);

        return matchesSearch && matchesType && matchesLevel && matchesDifficulty && matchesCategory;
    });

    const getQuestionIcon = (type: string) => {
        switch (type) {
            case "mcq": return <FileQuestion className="w-4 h-4" />;
            case "coding": return <Code className="w-4 h-4" />;
            case "descriptive": return <FileText className="w-4 h-4" />;
            default: return <FileQuestion className="w-4 h-4" />;
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy": return "text-green-600 bg-green-50";
            case "medium": return "text-yellow-600 bg-yellow-50";
            case "hard": return "text-red-600 bg-red-50";
            default: return "text-gray-600 bg-gray-50";
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Question Bank</h3>

                </div>
                {currentView === "list" && (
                    <Button onClick={openCreateView} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                    </Button>
                )}
                {(currentView === "create" || currentView === "edit") && (
                    <Button onClick={() => setCurrentView("list")} variant="outline">
                        Back to List
                    </Button>
                )}
            </div>

            {/* Question Type Selection - Always visible */}
            <div className="bg-slate-50 p-4 rounded-lg">
                <Label className="text-base font-medium mb-3 block">Question Type</Label>
                <div className="flex gap-6">
                    {[
                        { value: "mcq", label: "MCQ", icon: <FileQuestion className="w-4 h-4" /> },
                        { value: "coding", label: "Coding", icon: <Code className="w-4 h-4" /> },
                        { value: "descriptive", label: "Descriptive", icon: <FileText className="w-4 h-4" /> }
                    ].map((type) => (
                        <label key={type.value} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                name="questionType"
                                value={type.value}
                                checked={selectedQuestionType === type.value}
                                onChange={(e) => {
                                    setSelectedQuestionType(e.target.value as "mcq" | "coding" | "descriptive");
                                    if (currentView === "create" || currentView === "edit") {
                                        setFormData(prev => ({
                                            ...prev,
                                            type: e.target.value as "mcq" | "coding" | "descriptive",
                                            marks: e.target.value === "coding" ? 10 : 2
                                        }));
                                    }
                                }}
                                className="w-4 h-4 text-blue-600"
                            />
                            <div className="flex items-center gap-2">
                                {type.icon}
                                <span className="font-medium">{type.label}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Inline Question Form */}
            {(currentView === "create" || currentView === "edit") && (
                <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div>
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter question title"
                            />
                        </div>

                        {/* Level */}
                        <div>
                            <Label>Level</Label>
                            <Select
                                value={formData.level}
                                onValueChange={(value: any) => setFormData(prev => ({ ...prev, level: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="course">Course Level</SelectItem>
                                    {selectedTopic && (
                                        <SelectItem value="topic">Topic Level</SelectItem>
                                    )}
                                    {selectedSubtopic && (
                                        <SelectItem value="subtopic">Subtopic Level</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <Label>Difficulty</Label>
                            <Select
                                value={formData.difficulty}
                                onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Marks */}
                        <div>
                            <Label>Marks</Label>
                            <Input
                                type="number"
                                value={formData.marks}
                                onChange={(e) => setFormData(prev => ({ ...prev, marks: parseInt(e.target.value) || 0 }))}
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <Label>Content</Label>
                        <Textarea
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Enter question content/description"
                            rows={4}
                        />
                    </div>

                    {/* Categories */}
                    <div>
                        <Label>Categories</Label>
                        <div className="flex flex-wrap gap-4 mt-2">
                            {["learn", "practice", "skill_test", "contest"].map((category) => (
                                <label key={category} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.categories.includes(category)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData(prev => ({ ...prev, categories: [...prev.categories, category] }));
                                            } else {
                                                setFormData(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }));
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* MCQ Options */}
                    {selectedQuestionType === "mcq" && (
                        <div>
                            <Label>Options</Label>
                            <div className="space-y-3 mt-2">
                                {formData.mcq_options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <Input
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...formData.mcq_options];
                                                newOptions[index] = e.target.value;
                                                setFormData(prev => ({ ...prev, mcq_options: newOptions }));
                                            }}
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={formData.mcq_correct_answer_index === index ? "default" : "outline"}
                                            onClick={() => setFormData(prev => ({ ...prev, mcq_correct_answer_index: index }))}
                                            className="whitespace-nowrap"
                                        >
                                            {formData.mcq_correct_answer_index === index ? "✓ Correct" : "Mark Correct"}
                                        </Button>
                                        {formData.mcq_options.length > 2 && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    const newOptions = formData.mcq_options.filter((_, i) => i !== index);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        mcq_options: newOptions,
                                                        mcq_correct_answer_index: prev.mcq_correct_answer_index === index ? 0 :
                                                            prev.mcq_correct_answer_index > index ? prev.mcq_correct_answer_index - 1 : prev.mcq_correct_answer_index
                                                    }));
                                                }}
                                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setFormData(prev => ({ ...prev, mcq_options: [...prev.mcq_options, ""] }))}
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Option
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Coding Test Cases */}
                    {selectedQuestionType === "coding" && (
                        <div className="space-y-6">
                            <div>
                                <Label>Basic Test Cases (Visible to Students)</Label>
                                <div className="space-y-3 mt-2">
                                    {formData.test_cases_basic.map((testCase, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Test Case {index + 1}</span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const newTestCases = formData.test_cases_basic.filter((_, i) => i !== index);
                                                        setFormData(prev => ({ ...prev, test_cases_basic: newTestCases }));
                                                    }}
                                                    className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs">Input</Label>
                                                    <Textarea
                                                        value={testCase.input || ""}
                                                        onChange={(e) => {
                                                            const newTestCases = [...formData.test_cases_basic];
                                                            newTestCases[index] = { ...newTestCases[index], input: e.target.value };
                                                            setFormData(prev => ({ ...prev, test_cases_basic: newTestCases }));
                                                        }}
                                                        placeholder="Input data"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Expected Output</Label>
                                                    <Textarea
                                                        value={testCase.expected_output || ""}
                                                        onChange={(e) => {
                                                            const newTestCases = [...formData.test_cases_basic];
                                                            newTestCases[index] = { ...newTestCases[index], expected_output: e.target.value };
                                                            setFormData(prev => ({ ...prev, test_cases_basic: newTestCases }));
                                                        }}
                                                        placeholder="Expected output"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            test_cases_basic: [...prev.test_cases_basic, { input: "", expected_output: "" }]
                                        }))}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Basic Test Case
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label>Advanced Test Cases (Hidden from Students)</Label>
                                <div className="space-y-3 mt-2">
                                    {formData.test_cases_advanced.map((testCase, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-3 bg-slate-50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Advanced Test Case {index + 1}</span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const newTestCases = formData.test_cases_advanced.filter((_, i) => i !== index);
                                                        setFormData(prev => ({ ...prev, test_cases_advanced: newTestCases }));
                                                    }}
                                                    className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs">Input</Label>
                                                    <Textarea
                                                        value={testCase.input || ""}
                                                        onChange={(e) => {
                                                            const newTestCases = [...formData.test_cases_advanced];
                                                            newTestCases[index] = { ...newTestCases[index], input: e.target.value };
                                                            setFormData(prev => ({ ...prev, test_cases_advanced: newTestCases }));
                                                        }}
                                                        placeholder="Input data"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Expected Output</Label>
                                                    <Textarea
                                                        value={testCase.expected_output || ""}
                                                        onChange={(e) => {
                                                            const newTestCases = [...formData.test_cases_advanced];
                                                            newTestCases[index] = { ...newTestCases[index], expected_output: e.target.value };
                                                            setFormData(prev => ({ ...prev, test_cases_advanced: newTestCases }));
                                                        }}
                                                        placeholder="Expected output"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            test_cases_advanced: [...prev.test_cases_advanced, { input: "", expected_output: "" }]
                                        }))}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Advanced Test Case
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? "Saving..." : currentView === "create" ? "Create Question" : "Save Changes"}
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView("list")}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Filters - Only show in list view */}
            {currentView === "list" && (
                <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Search questions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>



                    <Select value={filterLevel} onValueChange={(value: any) => setFilterLevel(value)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="course">Course</SelectItem>
                            <SelectItem value="topic">Topic</SelectItem>
                            <SelectItem value="subtopic">Subtopic</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterDifficulty} onValueChange={(value: any) => setFilterDifficulty(value)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Difficulty</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterCategory} onValueChange={(value: any) => setFilterCategory(value)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="learn">Learn</SelectItem>
                            <SelectItem value="practice">Practice</SelectItem>
                            <SelectItem value="skill_test">Skill Test</SelectItem>
                            <SelectItem value="contest">Contest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

            )}

            {/* Questions List - Only show in list view */}
            {currentView === "list" && (
                <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-slate-500 mt-2">Loading questions...</p>
                            </div>
                        ) : filteredQuestions.length === 0 ? (
                            <div className="text-center py-12">
                                <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No questions found</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    {searchTerm || filterLevel !== "all" || filterDifficulty !== "all"
                                        ? "Try adjusting your filters or select a different question type"
                                        : "Create your first question to get started"
                                    }
                                </p>
                            </div>
                        ) : (
                            filteredQuestions.map((question) => (
                                <div
                                    key={question.id}
                                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getQuestionIcon(question.type)}
                                                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                                                        {question.type}
                                                    </span>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(question.difficulty)}`}>
                                                    {question.difficulty}
                                                </span>
                                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                                    {question.marks} marks
                                                </span>
                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                    {question.level}
                                                </span>
                                                {question.categories.map((category) => (
                                                    <span key={category} className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                                        {category.replace('_', ' ')}
                                                    </span>
                                                ))}
                                            </div>

                                            <h4 className="font-semibold text-slate-900 mb-2">{question.title}</h4>
                                            <p className="text-sm text-slate-600 line-clamp-2">{question.content}</p>

                                            {question.type === "mcq" && question.mcq_options && (
                                                <div className="mt-3 text-xs text-slate-500">
                                                    Options: {question.mcq_options.filter(opt => opt.trim()).length} choices
                                                </div>
                                            )}

                                            {question.type === "coding" && question.test_cases_basic && (
                                                <div className="mt-3 text-xs text-slate-500">
                                                    Basic test cases: {question.test_cases_basic.length}
                                                    {question.test_cases_advanced && question.test_cases_advanced.length > 0 &&
                                                        `, Advanced: ${question.test_cases_advanced.length}`
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openEditView(question)}
                                                className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(question.id)}
                                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            )}

        </div>
    );
};

export default QuestionBankManager;