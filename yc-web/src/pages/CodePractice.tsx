import React, { useEffect, useState } from "react";
import { apiClient } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import Navigation from "../components/Navigation";

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  created_by: number;
}

export const CodePractice: React.FC = () => {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState("easy");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProblems = async (level: string) => {
    setLoading(true);
    try {
      const data = await apiClient.request<Problem[]>(
        `/problems/?category=code_practice&difficulty=${level}`
      );
      setProblems(data);
    } catch (error) {
      console.error("Error fetching problems:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems(difficulty);
  }, [difficulty]);

  // Helper for role-based edit visibility
  const canEdit = (problem: Problem): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "admin_content" && user.id === problem.created_by)
      return true;
    return false;
  };

  return (
    <div className="minimum-h-screen bg-background">
      <Navigation />
      <h1 className="text-2xl font-bold text-indigo-600 mb-4">
        Code Practice ({difficulty.toUpperCase()})
      </h1>

      {/* Difficulty Toggle */}
      <div className="flex gap-3 mb-6">
        {["easy", "medium", "hard"].map((level) => (
          <button
            key={level}
            onClick={() => setDifficulty(level)}
            className={`px-4 py-2 rounded-md ${
              difficulty === level
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Problems Section */}
      {loading ? (
        <p>Loading problems...</p>
      ) : problems.length === 0 ? (
        <p className="text-gray-500">No problems found for this level.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition relative"
            >
              <h2 className="font-semibold text-gray-800">{p.title}</h2>
              <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                {p.description}
              </p>
              <p className="text-xs text-gray-400 mt-2 capitalize">
                Difficulty: {p.difficulty}
              </p>

              {/* Role-based edit buttons */}
              {canEdit(p) && (
                <div className="mt-2 flex gap-2">
                  <button className="px-3 py-1 text-sm bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200">
                    ✏️ Edit
                  </button>
                  <button className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-md hover:bg-red-200">
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodePractice;