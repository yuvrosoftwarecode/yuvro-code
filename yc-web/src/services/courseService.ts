// src/services/courseService.ts

const API_BASE =
  import.meta.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8001/api";

// ------------------------------------------------------------
// Auth Header Helper
// ------------------------------------------------------------
function getAuthHeader() {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
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

export interface Course {
  id: string;
  short_code?: string;
  name: string;
  category: string;
  created_at: string;
  updated_at: string;
  topics: TopicBasic[];
}

// ------------------------------------------------------------
// Fetch All Courses
// ------------------------------------------------------------
export async function fetchCourses(category?: string): Promise<Course[]> {
  const url = new URL(`${API_BASE}/course/courses/`);
  if (category) url.searchParams.set("category", category);

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
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
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
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
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
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
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
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

export const fetchAdmins = async () => {
  const res = await fetch(`${API_BASE}/auth/admin-users/`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to load admins");
  return res.json();
};
