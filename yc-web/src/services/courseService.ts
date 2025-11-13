// src/services/courseService.ts

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001/api";

// ---------------------------------------------------------------------------
// Auth Header Helper
// ---------------------------------------------------------------------------
function getAuthHeader() {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Types (matches your backend serializers)
// ---------------------------------------------------------------------------
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
  topics: TopicBasic[]; // from CourseSerializer
}

// ---------------------------------------------------------------------------
// Fetch All Courses
// ---------------------------------------------------------------------------
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
    throw new Error(
      err.detail || err.message || "Failed to fetch courses"
    );
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Fetch Single Course (includes topics, but NOT subtopics)
// ---------------------------------------------------------------------------
export async function fetchCourseById(
  courseId: string
): Promise<Course> {
  const url = `${API_BASE}/course/courses/${courseId}/`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail || err.message || "Failed to fetch course"
    );
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Fetch Topics by CourseId (basic serializer, NO subtopics)
// GET /api/course/topics/?course=<courseId>
// ---------------------------------------------------------------------------
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
    throw new Error(
      err.detail || err.message || "Failed to fetch topics"
    );
  }

  return res.json();
}


// ---------------------------------------------------------------------------
// COMBINED FUNCTION - Get full course structure (topics + subtopics)
// ---------------------------------------------------------------------------
export async function fetchCourseStructure(courseId: string) {
  // Fetch full course with nested topics + subtopics
  const course = await fetchCourseById(courseId);

  return {
    course,
    topics: course.topics, // already includes subtopics now
  };
}
