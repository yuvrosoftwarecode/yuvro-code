// src/services/courseService.ts

const API_BASE =
  import.meta.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8001/api";

// ------------------------------------------------------------
// Auth Header Helper
// ------------------------------------------------------------
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("token") || localStorage.getItem("access");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

function buildHeaders(extra?: Record<string, string>): HeadersInit {
  const auth = getAuthHeader();
  return { ...auth, ...(extra || {}) };
}

// ------------------------------------------------------------
// Types (Backend-matched)
// ------------------------------------------------------------
export interface Subtopic {
  id: string;
  topic: string;
  name: string;
  content: string | null;
  order_index: number;
  created_at: string;
}

export interface TopicBasic {
  id: string;
  course: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface TopicWithSubtopics extends TopicBasic {
  subtopics: Subtopic[];
}

export interface Module {
  id: number;
  title: string;
  duration: number;
  content?: string;
}

export interface Course {
  id: string | number;
  short_code?: string;
  name?: string;
  title?: string; // For compatibility with LearnAndCertify component
  category: string;
  level?: string;
  duration?: number;
  description?: string;
  price?: number;
  modules?: Module[];
  enrolled_count?: number;
  created_at: string;
  updated_at: string;
  topics: TopicBasic[];
}

// MARK VIDEO AS READ
export const markVideoAsRead = async (videoId: string) => {
  const res = await fetch(`${API_BASE}/course/videos/${videoId}/mark-read/`, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
  });
  if (!res.ok) throw new Error("Failed to mark video as read");
  return res.json();
};

// ------------------------------------------------------------
// Fetch All Courses
// ------------------------------------------------------------
export async function fetchCourses(category?: string): Promise<Course[]> {
  const url = new URL(`${API_BASE}/course/courses/`);
  if (category) url.searchParams.set("category", category);

  const res = await fetch(url.toString(), {
    headers: buildHeaders({ "Content-Type": "application/json" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to fetch courses");
  }

  return res.json();
}

// ------------------------------------------------------------
// Fetch Single Course (with nested topics)
// ------------------------------------------------------------
export async function fetchCourseById(courseId: string): Promise<Course> {
  const url = `${API_BASE}/course/courses/${courseId}/`;

  const res = await fetch(url, {
    headers: buildHeaders({ "Content-Type": "application/json" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to fetch course");
  }

  return res.json();
}

// ------------------------------------------------------------
// Fetch Topics by Course (basic topics only)
// ------------------------------------------------------------
export async function fetchTopicsByCourse(
  courseId: string
): Promise<TopicBasic[]> {
  const url = `${API_BASE}/course/topics/?course=${courseId}`;

  const res = await fetch(url, {
    headers: buildHeaders({ "Content-Type": "application/json" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to fetch topics");
  }

  return res.json();
}

// ------------------------------------------------------------
// Combined Course Structure (Uses nested serializer)
// ------------------------------------------------------------
export async function fetchCourseStructure(courseId: string) {
  const course = await fetchCourseById(courseId);
  return {
    course,
    topics: course.topics,
  };
}

// ------------------------------------------------------------
// Course CRUD
// ------------------------------------------------------------
export async function createCourse(courseData: any) {
  const res = await fetch(`${API_BASE}/course/courses/`, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(courseData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create course");
  }

  return res.json();
}

export async function updateCourse(
  courseId: string,
  payload: Partial<{ name: string; short_code: string | null; category: string }>
) {
  const res = await fetch(`${API_BASE}/course/courses/${courseId}/`, {
    method: "PATCH",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to update course");
  }

  return res.json();
}

export async function deleteCourse(courseId: string) {
  const res = await fetch(`${API_BASE}/course/courses/${courseId}/`, {
    method: "DELETE",
    headers: buildHeaders({ "Content-Type": "application/json" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to delete course");
  }

  return true;
}


// ------------------------------------------------------------
// Topic CRUD
// ------------------------------------------------------------
export async function createTopic(payload: {
  name: string;
  course: string;
  order_index?: number;
}) {
  const res = await fetch(`${API_BASE}/course/topics/`, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to create topic");
  }

  return res.json();
}

export async function updateTopic(
  topicId: string,
  payload: Partial<{ name: string; order_index: number }>
) {
  const res = await fetch(`${API_BASE}/course/topics/${topicId}/`, {
    method: "PUT",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to update topic");
  }

  return res.json();
}

export async function deleteTopic(topicId: string) {
  const res = await fetch(`${API_BASE}/course/topics/${topicId}/`, {
    method: "DELETE",
    headers: buildHeaders({ "Content-Type": "application/json" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to delete topic");
  }

  return true;
}

// ------------------------------------------------------------
// Subtopic CRUD
// ------------------------------------------------------------
export async function fetchSubtopicsByTopic(topicId: string) {
  const url = `${API_BASE}/course/subtopics/?topic=${topicId}`;

  const res = await fetch(url, {
    headers: buildHeaders({ "Content-Type": "application/json" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to fetch subtopics");
  }

  return res.json();
}

export async function createSubtopic(payload: {
  name: string;
  topic: string;
  order_index?: number;
  content?: string;
}) {
  const res = await fetch(`${API_BASE}/course/subtopics/`, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to create subtopic");
  }

  return res.json();
}

export async function updateSubtopic(
  subtopicId: string,
  payload: Partial<{ name: string; order_index: number; content?: string }>
) {
  const res = await fetch(`${API_BASE}/course/subtopics/${subtopicId}/`, {
    method: "PUT",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to update subtopic");
  }

  return res.json();
}

export async function deleteSubtopic(subtopicId: string) {
  const res = await fetch(`${API_BASE}/course/subtopics/${subtopicId}/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Failed to delete subtopic");
  }

  return true;
}
// -----------------------------
// VIDEO CRUD
// -----------------------------

export const fetchVideosBySubtopic = async (subtopicId: string) => {
  const res = await fetch(`${API_BASE}/course/videos/?sub_topic=${subtopicId}`, { 
    headers: getAuthHeader(), 
  });
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
};

export const createVideo = async (payload: any) => {
  const res = await fetch(`${API_BASE}/course/videos/`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create video");
  return res.json();
};

export const updateVideo = async (id: string, payload: any) => {
  const res = await fetch(`${API_BASE}/course/videos/${id}/`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update video");
  return res.json();
};

export const deleteVideo = async (id: string) => {
  const res = await fetch(`${API_BASE}/course/videos/${id}/`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete video");
  return true;
};


// QUIZZES ----------------------------
// --------------------------------
// QUIZ CRUD (same pattern as videos)
// --------------------------------

export const fetchQuizzesBySubtopic = async (subtopicId: string) => {
  const res = await fetch(`${API_BASE}/course/quizzes/?sub_topic=${subtopicId}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to fetch quizzes");
  return res.json();
};

export const createQuiz = async (payload: any) => {
  const res = await fetch(`${API_BASE}/course/quizzes/`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create quiz");
  return res.json();
};

export const updateQuiz = async (id: string, payload: any) => {
  const res = await fetch(`${API_BASE}/course/quizzes/${id}/`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update quiz");
  return res.json();
};

export const deleteQuiz = async (id: string) => {
  const res = await fetch(`${API_BASE}/course/quizzes/${id}/`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete quiz");
  return true;
};

// -----------------------------
// CODING PROBLEMS CRUD
// -----------------------------

// GET all problems for a subtopic
export const fetchCodingProblemsBySubtopic = async (subtopicId: string) => {
  const res = await fetch(`${API_BASE}/course/coding-problems/?sub_topic=${subtopicId}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to fetch coding problems");
  return res.json();
};

// CREATE a new coding problem
export const createCodingProblem = async (payload: any) => {
  const res = await fetch(`${API_BASE}/course/coding-problems/`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create coding problem");
  return res.json();
};

// UPDATE a coding problem
export const updateCodingProblem = async (id: string, payload: any) => {
  const res = await fetch(`${API_BASE}/course/coding-problems/${id}/`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update coding problem");
  return res.json();
};

// DELETE a coding problem
export const deleteCodingProblem = async (id: string) => {
  const res = await fetch(`${API_BASE}/course/coding-problems/${id}/`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete coding problem");
  return true;
};

// NOTES CRUD
export const fetchNotesBySubtopic = async (subtopicId: string) => {
  const res = await fetch(`${API_BASE}/course/notes/?sub_topic=${subtopicId}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
};

export const createNote = async (payload: any) => {
  const res = await fetch(`${API_BASE}/course/notes/`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
};

export const updateNote = async (id: string, payload: any) => {
  const res = await fetch(`${API_BASE}/course/notes/${id}/`, {
    method: "PATCH",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
};

export const deleteNote = async (id: string) => {
  const res = await fetch(`${API_BASE}/course/notes/${id}/`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete note");
  return true;
};

// Default export with commonly used functions
const courseService = {
  getCourses: fetchCourses,
  getCourse: fetchCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getTopics: fetchTopicsByCourse,
  createTopic,
  updateTopic,
  deleteTopic,
  getSubtopics: fetchSubtopicsByTopic,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
  getCourseStructure: fetchCourseStructure,
  getVideos: fetchVideosBySubtopic,
  createVideo,
  updateVideo,
  deleteVideo,
  getQuizzes: fetchQuizzesBySubtopic,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getCodingProblems: fetchCodingProblemsBySubtopic,
  createCodingProblem,
  updateCodingProblem,
  deleteCodingProblem,
  getNotes: fetchNotesBySubtopic,
  createNote,
  updateNote,
  deleteNote,
};

export default courseService;

// ------------------------------------------------------------
// SKILL TEST — QUIZZES (Topic Level + category=skill_test)
// ------------------------------------------------------------

// Fetch MCQs for Skill Test (category=skill_test)
export const fetchSkillTestQuizzesByTopic = async (topicId: string) => {
  const url = `${API_BASE}/course/quizzes/?topic=${topicId}&category=skill_test`;

  const res = await fetch(url, {
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error("Failed to fetch skill test quizzes");
  return res.json();
};

// Create Skill Test MCQ
export const createSkillTestQuiz = async (payload: any) => {
  const res = await fetch(`${API_BASE}/course/quizzes/`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create skill test quiz");
  return res.json();
};

// Update Skill Test MCQ
export const updateSkillTestQuiz = async (id: string, payload: any) => {
  const res = await fetch(`${API_BASE}/course/quizzes/${id}/`, {
    method: "PATCH",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update skill test quiz");
  return res.json();
};

// Delete Skill Test MCQ
export const deleteSkillTestQuiz = async (id: string) => {
  const res = await fetch(`${API_BASE}/course/quizzes/${id}/`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error("Failed to delete skill test quiz");
  return true;
};


// ------------------------------------------------------------
// SKILL TEST — CODING PROBLEMS (Topic Level + category=skill_test)
// ------------------------------------------------------------

// Fetch Coding Problems (Skill Test)
export const fetchSkillTestCodingProblemsByTopic = async (topicId: string) => {
  const url = `${API_BASE}/course/coding-problems/?topic=${topicId}&category=skill_test`;

  const res = await fetch(url, {
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error("Failed to fetch skill test coding problems");
  return res.json();
};

// Create Skill Test Coding Problem
export const createSkillTestCodingProblem = async (payload: any) => {
  const res = await fetch(`${API_BASE}/course/coding-problems/`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create skill test coding problem");
  return res.json();
};

// Update Skill Test Coding Problem
export const updateSkillTestCodingProblem = async (id: string, payload: any) => {
  const res = await fetch(`${API_BASE}/course/coding-problems/${id}/`, {
    method: "PATCH",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update skill test coding problem");
  return res.json();
};

// Delete Skill Test Coding Problem
export const deleteSkillTestCodingProblem = async (id: string) => {
  const res = await fetch(`${API_BASE}/course/coding-problems/${id}/`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error("Failed to delete skill test coding problem");
  return true;
};


// ---------------------------------------------
// PRACTICE QUESTIONS —  CODING
// ---------------------------------------------

// Fetch coding problems filtered by topic & category=practice
export async function fetchPracticeCodingProblemsByTopic(topicId: string) {
  const res = await fetch(
    `${API_BASE}/course/coding-problems/?topic=${topicId}&category=practice`,
    { headers: getAuthHeader() }
  );
  if (!res.ok) throw new Error("Failed to fetch practice coding problems");
  return res.json();
}

// Create new practice coding problem
export async function createPracticeCodingProblem(payload: any) {
  const res = await fetch(`${API_BASE}/course/coding-problems/`, {
    method: "POST",
    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create practice problem");
  return res.json();
}

// Update practice coding problem
export async function updatePracticeCodingProblem(id: string, payload: any) {
  const res = await fetch(`${API_BASE}/course/coding-problems/${id}/`, {
    method: "PUT",
    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update practice problem");
  return res.json();
}

// Delete practice problem
export async function deletePracticeCodingProblem(id: string) {
  const res = await fetch(`${API_BASE}/course/coding-problems/${id}/`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete practice problem");
  return true;
}

// Fetch instructors of a course
export async function fetchCourseInstructors(courseId: string) {
  const res = await fetch(`${API_BASE}/course/courses/${courseId}/instructors/`, {
    headers: getAuthHeader()
  });

  if (!res.ok) throw new Error("Failed to fetch instructors");
  return res.json();
}

// Add instructor to course
export async function addInstructorToCourse(courseId: string, instructorId: string) {
  const res = await fetch(`${API_BASE}/course/courses/${courseId}/add_instructor/`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ instructor_id: instructorId }),
  });

  if (!res.ok) throw new Error("Failed to add instructor");
  return res.json();
}

// Remove instructor
export async function removeInstructorFromCourse(courseId: string, instructorId: string) {
  const res = await fetch(`${API_BASE}/course/courses/${courseId}/remove_instructor/`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ instructor_id: instructorId }),
  });

  if (!res.ok) throw new Error("Failed to remove instructor");
  return res.json();
}

export async function fetchAllInstructors() {
  const res = await fetch(`${API_BASE}/auth/users/?role=instructor`, {
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error("Failed to fetch instructors");
  return res.json();
}
