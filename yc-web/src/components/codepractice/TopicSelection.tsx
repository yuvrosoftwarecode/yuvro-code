import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { Course, Topic, Problem } from "@/pages/CodePractice";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api';

interface TopicSelectionProps {
  course: Course;
  selectedTopic: Topic | null;
  onTopicSelect: (topic: Topic) => void;
  onProblemSelect: (problem: Problem) => void;
  onBack: () => void;
}

const TopicSelection = ({
  course,
  selectedTopic,
  onTopicSelect,
  onProblemSelect,
  onBack,
}: TopicSelectionProps) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [difficulty, setDifficulty] = useState<"All" | "Easy" | "Medium" | "Hard">("All");

  // 🔹 Fetch all topics for selected course
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoadingTopics(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://127.0.0.1:8001/api/course/topics/?course=${course.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // API returns array directly (not paginated)
        const topicsData = Array.isArray(res.data) ? res.data : [];
        console.log("Topics fetched:", topicsData);
        setTopics(topicsData);
      } catch (err) {
        console.error("Error fetching topics:", err);
        setTopics([]);
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, [course.id]);

  // 🔹 When a topic is selected, fetch its subtopics
  const handleTopicSelect = async (topic: Topic) => {
    onTopicSelect(topic);
    setLoadingSubtopics(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://127.0.0.1:8001/api/course/subtopics/?topic=${topic.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // API returns array directly (not paginated)
      const subtopicsData = Array.isArray(res.data) ? res.data : [];
      console.log("Subtopics fetched:", subtopicsData);
      setSubtopics(subtopicsData);
    } catch (err) {
      console.error("Error fetching subtopics:", err);
      setSubtopics([]);
    } finally {
      setLoadingSubtopics(false);
    }
  };

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
            {loadingTopics ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : topics.length === 0 ? (
              <p className="text-sm text-gray-500">No topics available</p>
            ) : (
              topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedTopic?.id === topic.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{topic.name}</div>
                  <div
                    className={`text-xs ${
                      selectedTopic?.id === topic.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {topic.subtopics?.length || 0} subtopics
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Problems/Subtopics Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Difficulty Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Difficulty Level</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              {(["All", "Easy", "Medium", "Hard"] as const).map((level) => (
                <Button
                  key={level}
                  variant={difficulty === level ? "default" : "outline"}
                  onClick={() => setDifficulty(level)}
                  size="sm"
                >
                  {level}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Subtopics Display */}
          {loadingSubtopics ? (
            <div className="flex justify-center items-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading subtopics...
            </div>
          ) : selectedTopic && subtopics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subtopics.map((sub) => (
                <Card
                  key={sub.id}
                  className="hover:shadow-lg transition-all duration-200"
                >
                  <CardHeader>
                    <CardTitle className="text-base">{sub.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {sub.content || "No description available."}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {sub.created_at?.slice(0, 10)}
                      </span>
                      <Button
                        onClick={() =>
                          onProblemSelect(sub)
                        }
                        size="sm"
                      >
                        Start Practice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : selectedTopic ? (
            <p className="text-gray-500 text-sm">
              No subtopics found for <strong>{selectedTopic.name}</strong>
            </p>
          ) : (
            <p className="text-gray-500 text-sm">
              Select a topic to view its subtopics.
            </p>
          )}

          {/* Pagination Placeholder */}
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