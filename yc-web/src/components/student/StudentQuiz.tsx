import React, { useEffect, useState } from "react";
import { fetchQuizzesBySubtopic } from "@/services/courseService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Quiz = {
  id: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  sub_topic: string;
};

const StudentQuiz = ({ subtopicId }: { subtopicId: string }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadQuizzes();

    // reset on subtopic change
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScore(0);
  }, [subtopicId]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetchQuizzesBySubtopic(subtopicId);
      setQuizzes(res);
    } catch (err) {
      console.error("Failed to load quizzes", err);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-muted-foreground">Loading quiz...</div>;

  if (quizzes.length === 0)
    return <div className="text-muted-foreground">No quizzes available.</div>;

  // Quiz completed summary
  if (currentIndex >= quizzes.length) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-3">Quiz Completed 🎉</h2>
        <p className="text-lg">
          You scored{" "}
          <span className="font-bold">
            {score} / {quizzes.length}
          </span>
        </p>

        <Button
          className="mt-4"
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setSubmitted(false);
            setSelectedOption(null);
          }}
        >
          Restart Quiz
        </Button>
      </Card>
    );
  }

  const currentQuiz = quizzes[currentIndex];

  const handleSubmit = () => {
    if (selectedOption === null) return;

    if (selectedOption === currentQuiz.correct_answer_index) {
      setScore((prev) => prev + 1);
    }

    setSubmitted(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setSubmitted(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Question {currentIndex + 1} / {quizzes.length}
      </h3>

      <Card>
        <CardContent className="p-5 space-y-4">

          {/* Question */}
          <p className="font-medium text-lg">{currentQuiz.question}</p>

          {/* Options */}
          <div className="space-y-2">
            {currentQuiz.options.map((opt, index) => {
              const isCorrect = index === currentQuiz.correct_answer_index;
              const isSelected = selectedOption === index;

              let variant: "outline" | "default" | "secondary" =
                "outline";

              if (submitted) {
                if (isCorrect) {
                  variant = "default"; // green-ish button
                } else if (isSelected) {
                  variant = "secondary"; // wrong selected answer
                }
              }

              return (
                <Button
                  key={index}
                  variant={variant}
                  className={`w-full justify-start text-left ${
                    isSelected && !submitted
                      ? "border-blue-500 bg-blue-50"
                      : ""
                  }`}
                  onClick={() =>
                    !submitted && setSelectedOption(index)
                  }
                >
                  {opt}
                </Button>
              );
            })}
          </div>

          {/* Submit or Next */}
          {!submitted ? (
            <Button
              className="w-full mt-3"
              disabled={selectedOption === null}
              onClick={handleSubmit}
            >
              Submit Answer
            </Button>
          ) : (
            <Button className="w-full mt-3" onClick={handleNext}>
              Next Question
            </Button>
          )}

          {/* Feedback */}
          {submitted && (
            <div className="text-center mt-2">
              {selectedOption === currentQuiz.correct_answer_index ? (
                <p className="text-green-600 font-semibold">Correct! 🎉</p>
              ) : (
                <p className="text-red-600 font-semibold">
                  Incorrect ❌ <br />
                  <span className="text-muted-foreground text-sm">
                    Correct Answer:{" "}
                    {
                      currentQuiz.options[
                        currentQuiz.correct_answer_index
                      ]
                    }
                  </span>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentQuiz;
