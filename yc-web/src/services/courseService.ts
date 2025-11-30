import restApiAuthUtil from '../utils/RestApiAuthUtil';
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
  title?: string;
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

export const markVideoAsRead = async (videoId: string) => {
  return restApiAuthUtil.post(`/course/videos/${videoId}/mark-read/`);
};

export async function fetchCourses(category?: string): Promise<Course[]> {
  const params = category ? { category } : undefined;
  return restApiAuthUtil.get('/course/courses/', { params });
}

export async function fetchCourseById(courseId: string): Promise<Course> {
  return restApiAuthUtil.get(`/course/courses/${courseId}/`);
}

export async function fetchTopicsByCourse(courseId: string): Promise<TopicBasic[]> {
  return restApiAuthUtil.get('/course/topics/', { params: { course: courseId } });
}

export async function fetchCourseStructure(courseId: string) {
  const course = await fetchCourseById(courseId);
  return {
    course,
    topics: course.topics,
  };
}

export async function createCourse(courseData: any) {
  return restApiAuthUtil.post('/course/courses/', courseData);
}

export async function updateCourse(
  courseId: string,
  payload: Partial<{ name: string; short_code: string | null; category: string }>
) {
  return restApiAuthUtil.patch(`/course/courses/${courseId}/`, payload);
}

export async function deleteCourse(courseId: string) {
  await restApiAuthUtil.delete(`/course/courses/${courseId}/`);
  return true;
}

export async function createTopic(payload: {
  name: string;
  course: string;
  order_index?: number;
}) {
  return restApiAuthUtil.post('/course/topics/', payload);
}

export async function updateTopic(
  topicId: string,
  payload: Partial<{ name: string; order_index: number }>
) {
  return restApiAuthUtil.put(`/course/topics/${topicId}/`, payload);
}

export async function deleteTopic(topicId: string) {
  await restApiAuthUtil.delete(`/course/topics/${topicId}/`);
  return true;
}

export async function fetchSubtopicsByTopic(topicId: string) {
  return restApiAuthUtil.get('/course/subtopics/', { params: { topic: topicId } });
}

export async function createSubtopic(payload: {
  name: string;
  topic: string;
  order_index?: number;
  content?: string;
}) {
  return restApiAuthUtil.post('/course/subtopics/', payload);
}

export async function updateSubtopic(
  subtopicId: string,
  payload: Partial<{ name: string; order_index: number; content?: string }>
) {
  return restApiAuthUtil.put(`/course/subtopics/${subtopicId}/`, payload);
}

export async function deleteSubtopic(subtopicId: string) {
  await restApiAuthUtil.delete(`/course/subtopics/${subtopicId}/`);
  return true;
}

export const fetchVideosBySubtopic = async (subtopicId: string) => {
  return restApiAuthUtil.get('/course/videos/', { params: { sub_topic: subtopicId } });
};

export const createVideo = async (payload: any) => {
  return restApiAuthUtil.post('/course/videos/', payload);
};

export const updateVideo = async (id: string, payload: any) => {
  return restApiAuthUtil.put(`/course/videos/${id}/`, payload);
};

export const deleteVideo = async (id: string) => {
  await restApiAuthUtil.delete(`/course/videos/${id}/`);
  return true;
};

export const fetchQuizzesBySubtopic = async (subtopicId: string) => {
  return restApiAuthUtil.get('/course/quizzes/', { params: { sub_topic: subtopicId } });
};

export const createQuiz = async (payload: any) => {
  return restApiAuthUtil.post('/course/quizzes/', payload);
};

export const updateQuiz = async (id: string, payload: any) => {
  return restApiAuthUtil.put(`/course/quizzes/${id}/`, payload);
};

export const deleteQuiz = async (id: string) => {
  await restApiAuthUtil.delete(`/course/quizzes/${id}/`);
  return true;
};

export const fetchCodingProblemsBySubtopic = async (subtopicId: string) => {
  return restApiAuthUtil.get('/course/coding-problems/', { params: { sub_topic: subtopicId } });
};

export const createCodingProblem = async (payload: any) => {
  return restApiAuthUtil.post('/course/coding-problems/', payload);
};

export const updateCodingProblem = async (id: string, payload: any) => {
  return restApiAuthUtil.put(`/course/coding-problems/${id}/`, payload);
};

export const deleteCodingProblem = async (id: string) => {
  await restApiAuthUtil.delete(`/course/coding-problems/${id}/`);
  return true;
};

export const fetchNotesBySubtopic = async (subtopicId: string) => {
  return restApiAuthUtil.get('/course/notes/', { params: { sub_topic: subtopicId } });
};

export const createNote = async (payload: any) => {
  return restApiAuthUtil.post('/course/notes/', payload);
};

export const updateNote = async (id: string, payload: any) => {
  return restApiAuthUtil.patch(`/course/notes/${id}/`, payload);
};

export const deleteNote = async (id: string) => {
  await restApiAuthUtil.delete(`/course/notes/${id}/`);
  return true;
};

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

export const fetchSkillTestQuizzesByTopic = async (topicId: string) => {
  return restApiAuthUtil.get('/course/quizzes/', { params: { topic: topicId, category: 'skill_test' } });
};

export const createSkillTestQuiz = async (payload: any) => {
  return restApiAuthUtil.post('/course/quizzes/', payload);
};

export const updateSkillTestQuiz = async (id: string, payload: any) => {
  return restApiAuthUtil.patch(`/course/quizzes/${id}/`, payload);
};

export const deleteSkillTestQuiz = async (id: string) => {
  await restApiAuthUtil.delete(`/course/quizzes/${id}/`);
  return true;
};

export const fetchSkillTestCodingProblemsByTopic = async (topicId: string) => {
  return restApiAuthUtil.get('/course/coding-problems/', { params: { topic: topicId, category: 'skill_test' } });
};

export const createSkillTestCodingProblem = async (payload: any) => {
  return restApiAuthUtil.post('/course/coding-problems/', payload);
};

export const updateSkillTestCodingProblem = async (id: string, payload: any) => {
  return restApiAuthUtil.patch(`/course/coding-problems/${id}/`, payload);
};

export const deleteSkillTestCodingProblem = async (id: string) => {
  await restApiAuthUtil.delete(`/course/coding-problems/${id}/`);
  return true;
};

export async function fetchPracticeCodingProblemsByTopic(topicId: string) {
  return restApiAuthUtil.get('/course/coding-problems/', { params: { topic: topicId, category: 'practice' } });
}

export async function createPracticeCodingProblem(payload: any) {
  return restApiAuthUtil.post('/course/coding-problems/', payload);
}

export async function updatePracticeCodingProblem(id: string, payload: any) {
  return restApiAuthUtil.put(`/course/coding-problems/${id}/`, payload);
}

export async function deletePracticeCodingProblem(id: string) {
  await restApiAuthUtil.delete(`/course/coding-problems/${id}/`);
  return true;
}

export async function fetchCourseInstructors(courseId: string) {
  return restApiAuthUtil.get(`/course/courses/${courseId}/instructors/`);
}

export async function addInstructorToCourse(courseId: string, instructorId: string) {
  return restApiAuthUtil.post(`/course/courses/${courseId}/add_instructor/`, { instructor_id: instructorId });
}

export async function removeInstructorFromCourse(courseId: string, instructorId: string) {
  return restApiAuthUtil.post(`/course/courses/${courseId}/remove_instructor/`, { instructor_id: instructorId });
}

export async function fetchAllInstructors() {
  return restApiAuthUtil.get('/auth/users/', { params: { role: 'instructor' } });
}

export async function fetchSkillTestQuestions(topicId: string) {
  function safeParseOptions(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map(String);
    }
    if (typeof raw === "object") {
      try {
        return Object.values(raw).map(String);
      } catch {
        return [];
      }
    }
    if (typeof raw !== "string") {
      raw = String(raw);
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    try {
      const fixed = raw.replace(/'/g, '"');
      const parsed = JSON.parse(fixed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return raw.split(/[,|;]/).map((s: string) => s.trim()).filter(Boolean);
  }

  const quizzes = await restApiAuthUtil.get('/course/quizzes/', { params: { topic: topicId, category: 'skill_test' } });
  const coding = await restApiAuthUtil.get('/course/coding-problems/', { params: { topic: topicId, category: 'skill_test' } });

  const mcqQuestions = quizzes.map((q: any) => ({
    id: q.id,
    type: "mcq",
    question: q.question,
    options: safeParseOptions(q.options),
    multipleCorrect: q.multiple_correct ?? false,
    marks: 2,
  }));

  const codingQuestions = coding.map((c: any) => ({
    id: c.id,
    type: "coding",
    question: c.title,
    test_cases_basic: c.test_cases_basic,
    test_cases_advanced: c.test_cases_advanced,
    marks: 10,
  }));

  return [...mcqQuestions, ...codingQuestions];
}
