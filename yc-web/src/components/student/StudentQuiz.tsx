import React, { useEffect, useState } from "react";
import { fetchQuizzesBySubtopic } from "@/services/courseService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { set } from "date-fns";

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
  const [userAnswers, setUserAnswers] = useState<{ [k: number]: number }>({});
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    loadQuizzes();
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScore(0);
    setUserAnswers({});
    setIsPassed(false);
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
      <Card className="p-6 text-center border border-gray-300">
        <h2 className="text-2xl font-bold mb-3">Quiz Completed 🎉</h2>
        <p className="text-lg mb-3">
          You scored{" "}
          <span className="font-bold">
            {score} / {quizzes.length}
          </span>
        </p>

        <p
          className={`text-xl font-semibold ${
            isPassed ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPassed ? "Congratulations! You passed the quiz." : "Unfortunately, you did not pass. Please try again."}
        </p>

        <Button
          className="mt-4"
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setSubmitted(false);
            setSelectedOption(null);
            setUserAnswers({});
            setIsPassed(false);
          }}
        >
          Retake Quiz
        </Button>
      </Card>
    );
  }

  const currentQuiz = quizzes[currentIndex];

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === currentQuiz.correct_answer_index;

    const updatedScore = isCorrect ? score + 1 : score;
    setScore(updatedScore);

    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: selectedOption,
    }));

    setSubmitted(true);

    const percentage = (updatedScore / quizzes.length) * 100;
    if (percentage >= 70) {
      setIsPassed(true);
    }
  };

  const handleNext = () => {
    if (currentIndex === quizzes.length - 1) {
      setCurrentIndex(quizzes.length);
      return;
    }

    const nextIndex = currentIndex + 1;

    setCurrentIndex(nextIndex);
    setSelectedOption(userAnswers[nextIndex] ?? null);
    setSubmitted(userAnswers[nextIndex] !== undefined);
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return ;
    
    const previousIndex = currentIndex - 1;

    setCurrentIndex(previousIndex);
    setSelectedOption(userAnswers[previousIndex] ?? null);
    setSubmitted(userAnswers[previousIndex] !== undefined);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Question {currentIndex + 1} / {quizzes.length}
      </h3>

      <Card className="border border-gray-300">
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
                  className={`w-full justify-start text-left border border-gray-300 ${
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
          {!submitted && (
            <Button
              className="w-full mt-3 border border-gray-300 bg-gray-400 text-white hover:bg-gray-200 hover:text-black"
              disabled={selectedOption === null}
              onClick={handleSubmit}
            >
              Submit Answer
            </Button>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200 gap-4">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={handlePrevious}
              className="border border-gray-300 flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            <span className="text-sm text-gray-600">
              Score: {score} / {quizzes.length}
            </span>

            <Button
              onClick={handleNext}
              disabled={!submitted}
              variant="outline"
              className="flex items-center bg-black text-white hover:bg-gray-800 gap-2 mt-4 ml-auto"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

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
