// src/services/courseService.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api'; // matches your setup

function getAuthHeader() {
  const token = localStorage.getItem('token') || localStorage.getItem('access'); // support both keys you used
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch all courses (optionally by category).
 * returns array of CourseBasicSerializer or CourseSerializer (if expanded)
 */
export async function fetchCourses(category?: string) {
  const url = new URL(`${API_BASE}/course/courses/`);
  if (category) url.searchParams.set('category', category);
  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.detail || err.message || 'Failed to fetch courses';
    const e: any = new Error(message);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

/**
 * Fetch single course by id (retrieve will include topics via your serializer)
 */
export async function fetchCourseById(courseId: string) {
  const url = `${API_BASE}/course/courses/${courseId}/`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.detail || err.message || 'Failed to fetch course';
    const e: any = new Error(message);
    e.status = res.status;
    throw e;
  }
  return res.json();
}
