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
  payload: Partial<{ name: string; order_index: number; course: string }>
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
  payload: Partial<{ name: string; order_index: number; content?: string; topic: string }>
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

// Fetch questions with filters
export async function getQuestions(filters: {
  categories?: string;
  type?: string;
  difficulty?: string;
  course?: string;
  topic?: string;
  subtopic?: string;
}) {
  return restApiAuthUtil.get('/course/questions/', { params: filters });
}

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
  getNotes: fetchNotesBySubtopic,
  createNote,
  updateNote,
  deleteNote,
  getQuestions,
};

export default courseService;

// Question Bank interfaces
export interface Question {
  id: string;
  type: 'mcq' | 'coding' | 'descriptive';
  title: string;
  content: string;
  level: 'course' | 'topic' | 'subtopic';
  course?: string;
  topic?: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  categories: string[];
  mcq_options?: string[];
  mcq_correct_answer_index?: number;
  test_cases_basic?: Array<{ input: string; expected_output: string }>;
  test_cases_advanced?: Array<{ input: string; expected_output: string }>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Question Bank functions (replacing old quiz and coding problem functions)
export const fetchQuestionsByCategory = async (category: string, levelId: string, level: 'course' | 'topic' | 'subtopic'): Promise<Question[]> => {
  const params: any = { categories: category };
  if (level === 'course') params.course = levelId;
  if (level === 'topic') params.topic = levelId;
  if (level === 'subtopic') params.subtopic = levelId;

  return restApiAuthUtil.get('/course/questions/', { params });
};



export const fetchLearnQuestions = async (subtopicId: string): Promise<Question[]> => {
  return fetchQuestionsByCategory('learn', subtopicId, 'subtopic');
};

export const fetchPracticeQuestions = async (topicId: string): Promise<Question[]> => {
  return fetchQuestionsByCategory('practice', topicId, 'topic');
};

export async function fetchSkillTestQuestions(topicId: string) {
  const questions = await fetchQuestionsByCategory('skill_test', topicId, 'topic');

  return questions.map((q: Question) => ({
    id: q.id,
    type: q.type,
    question: q.title,
    title: q.title,
    content: q.content,
    options: q.mcq_options || [],
    correct_answer_index: q.mcq_correct_answer_index,
    test_cases_basic: q.test_cases_basic || [],
    test_cases_advanced: q.test_cases_advanced || [],
    marks: q.marks || (q.type === 'coding' ? 10 : 2),
    difficulty: q.difficulty,
  }));
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

// Question Bank API functions
export async function fetchQuestionsByLevel(level: 'course' | 'topic' | 'subtopic', id: string) {
  const params: any = {};
  if (level === 'course') params.course = id;
  if (level === 'topic') params.topic = id;
  if (level === 'subtopic') params.subtopic = id;

  return restApiAuthUtil.get('/course/questions/', { params });
}

export async function createQuestion(payload: any) {
  return restApiAuthUtil.post('/course/questions/', payload);
}

export async function updateQuestion(id: string, payload: any) {
  return restApiAuthUtil.put(`/course/questions/${id}/`, payload);
}

export async function deleteQuestion(id: string) {
  await restApiAuthUtil.delete(`/course/questions/${id}/`);
  return true;
}


