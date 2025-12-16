import { restApiAuthUtil } from '@/utils/RestApiAuthUtil';

export interface MockInterview {
  id: string;
  title: string;
  description: string;
  type: 'technical' | 'behavioral' | 'system_design' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  scheduled_date: string;
  duration: number;
  interviewer: string;
  interviewee?: string;
  interviewer_details?: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  interviewee_details?: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  questions: any[];
  notes: string;
  feedback: string;
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  overall_score?: number;
  meeting_link: string;
  meeting_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMockInterviewData {
  title: string;
  description: string;
  // Align with backend MockInterview.TYPE_CHOICES
  type: 'coding' | 'system_design' | 'aptitude' | 'behavioral' | 'domain_specific';
  difficulty: 'easy' | 'medium' | 'hard';
  scheduled_datetime: string;
  duration: number;
  interviewee?: string;
  questions: any[];
  meeting_link: string;
  meeting_id: string;
}

export interface CompleteMockInterviewData {
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  feedback?: string;
  notes?: string;
}

class MockInterviewService {
  // Using central restApiAuthUtil for all requests which handles auth headers & refresh

  async getAllMockInterviews(): Promise<MockInterview[]> {
    try {
      const response = await restApiAuthUtil.get<any[]>('/mock-interviews/');
      return response;
    } catch (error) {
      console.error('Error fetching mock interviews:', error);
      throw error;
    }
  }

  async getMockInterview(id: string): Promise<MockInterview> {
    try {
      const response = await restApiAuthUtil.get<any>(`/mock-interviews/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching mock interview:', error);
      throw error;
    }
  }

  async createMockInterview(data: CreateMockInterviewData): Promise<MockInterview> {
    try {
      const response = await restApiAuthUtil.post<any>('/mock-interviews/', data);
      return response;
    } catch (error) {
      console.error('Error creating mock interview:', error);
      throw error;
    }
  }

  async updateMockInterview(id: string, data: Partial<CreateMockInterviewData>): Promise<MockInterview> {
    try {
      const response = await restApiAuthUtil.patch<any>(`/mock-interviews/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating mock interview:', error);
      throw error;
    }
  }

  async deleteMockInterview(id: string): Promise<void> {
    try {
      await restApiAuthUtil.delete<void>(`/mock-interviews/${id}/`);
    } catch (error) {
      console.error('Error deleting mock interview:', error);
      throw error;
    }
  }

  async startInterview(id: string): Promise<MockInterview> {
    try {
      const response = await restApiAuthUtil.post<any>(`/mock-interviews/${id}/start_interview/`, {});
      return response;
    } catch (error) {
      console.error('Error starting interview:', error);
      throw error;
    }
  }

  async completeInterview(id: string, data: CompleteMockInterviewData): Promise<MockInterview> {
    try {
      const response = await restApiAuthUtil.post<any>(`/mock-interviews/${id}/complete_interview/`, data);
      return response;
    } catch (error) {
      console.error('Error completing interview:', error);
      throw error;
    }
  }

  async cancelInterview(id: string): Promise<MockInterview> {
    try {
      const response = await restApiAuthUtil.post<any>(`/mock-interviews/${id}/cancel_interview/`, {});
      return response;
    } catch (error) {
      console.error('Error cancelling interview:', error);
      throw error;
    }
  }

  async getMyInterviews(): Promise<MockInterview[]> {
    try {
      const response = await restApiAuthUtil.get<any[]>('/mock-interviews/my_interviews/');
      return response;
    } catch (error) {
      console.error('Error fetching my interviews:', error);
      throw error;
    }
  }

  async getUpcomingInterviews(): Promise<MockInterview[]> {
    try {
      const response = await restApiAuthUtil.get<any[]>('/mock-interviews/upcoming/');
      return response;
    } catch (error) {
      console.error('Error fetching upcoming interviews:', error);
      throw error;
    }
  }
}

export const mockInterviewService = new MockInterviewService();