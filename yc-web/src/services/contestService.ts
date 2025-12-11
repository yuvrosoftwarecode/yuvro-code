import restApiAuthUtil from '../utils/RestApiAuthUtil';

export interface Contest {
  id: string;
  title: string;
  organizer: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  duration?: number;
  prize?: string;
  difficulty: string;
  description: string;
  question_ids: number[];
  participants_count: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  title: string;
  difficulty: string;
  type: string;
  course: {
    id: number;
    title: string;
  };
}

export const fetchContests = async (): Promise<Contest[]> => {
  return restApiAuthUtil.get('/contests/');
};

export interface CreateContestData {
  title: string;
  organizer: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  duration?: number;
  prize?: string;
  difficulty: string;
  description: string;
}

export const contestService = {
  async getAllContests(): Promise<Contest[]> {
    return fetchContests();
  },

  async getContest(contestId: string): Promise<Contest> {
    return restApiAuthUtil.get(`/contests/${contestId}/`);
  },

  async createContest(data: CreateContestData): Promise<Contest> {
    return restApiAuthUtil.post('/contests/', data);
  },

  async updateContest(contestId: string, data: Partial<Contest>): Promise<Contest> {
    return restApiAuthUtil.patch(`/contests/${contestId}/`, data);
  },

  async deleteContest(contestId: string): Promise<void> {
    return restApiAuthUtil.delete(`/contests/${contestId}/`);
  },

  async getQuestion(questionId: number): Promise<Question> {
    return restApiAuthUtil.get(`/course/questions/${questionId}/`);
  },

  async getQuestionsByCourse(courseId: string | number, filters?: {
    difficulty?: string;
    type?: string;
    search?: string;
  }): Promise<Question[]> {
    const params: any = { course: courseId };
    
    if (filters?.difficulty) {
      params.difficulty = filters.difficulty;
    }
    if (filters?.type) {
      params.type = filters.type;
    }
    if (filters?.search) {
      params.search = filters.search;
    }
    
    return restApiAuthUtil.get('/course/questions/', { params });
  },

  async addQuestionToContest(contestId: string, questionId: number, currentQuestionIds: number[]): Promise<Contest> {
    const updatedQuestionIds = [...currentQuestionIds, questionId];
    return this.updateContest(contestId, { question_ids: updatedQuestionIds });
  },

  async removeQuestionFromContest(contestId: string, questionId: number, currentQuestionIds: number[]): Promise<Contest> {
    const updatedQuestionIds = currentQuestionIds.filter(id => id !== questionId);
    return this.updateContest(contestId, { question_ids: updatedQuestionIds });
  },
};