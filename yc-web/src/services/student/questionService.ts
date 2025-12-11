import restApiAuthUtil from '../../utils/RestApiAuthUtil';

export interface LearnQuestion {
  id: string;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  test_cases_basic?: TestCase[];
  test_cases_advanced?: TestCase[];
}

export interface TestCase {
  input: string;
  expected_output: string;
  description?: string;
}

export const fetchLearnCodingQuestions = async (subtopicId: string): Promise<LearnQuestion[]> => {
  try {
    const response = await restApiAuthUtil.get('/course/questions/', {
      params: {
        subtopic: subtopicId,
        categories: 'learn',
        level: 'subtopic',
        type: 'coding'
      }
    });

    return response as LearnQuestion[];
  } catch (error) {
    console.error('Error fetching learn coding questions:', error);
    throw error;
  }
};