import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://localhost:8001/api';

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
  type: 'technical' | 'behavioral' | 'system_design' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  scheduled_date: string;
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
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getAllMockInterviews(): Promise<MockInterview[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/mock-interviews/`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching mock interviews:', error);
      throw error;
    }
  }

  async getMockInterview(id: string): Promise<MockInterview> {
    try {
      const response = await axios.get(`${API_BASE_URL}/mock-interviews/${id}/`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching mock interview:', error);
      throw error;
    }
  }

  async createMockInterview(data: CreateMockInterviewData): Promise<MockInterview> {
    try {
      const response = await axios.post(`${API_BASE_URL}/mock-interviews/`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating mock interview:', error);
      throw error;
    }
  }

  async updateMockInterview(id: string, data: Partial<CreateMockInterviewData>): Promise<MockInterview> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/mock-interviews/${id}/`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating mock interview:', error);
      throw error;
    }
  }

  async deleteMockInterview(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/mock-interviews/${id}/`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting mock interview:', error);
      throw error;
    }
  }

  async startInterview(id: string): Promise<MockInterview> {
    try {
      const response = await axios.post(`${API_BASE_URL}/mock-interviews/${id}/start_interview/`, {}, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error starting interview:', error);
      throw error;
    }
  }

  async completeInterview(id: string, data: CompleteMockInterviewData): Promise<MockInterview> {
    try {
      const response = await axios.post(`${API_BASE_URL}/mock-interviews/${id}/complete_interview/`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error completing interview:', error);
      throw error;
    }
  }

  async cancelInterview(id: string): Promise<MockInterview> {
    try {
      const response = await axios.post(`${API_BASE_URL}/mock-interviews/${id}/cancel_interview/`, {}, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling interview:', error);
      throw error;
    }
  }

  async getMyInterviews(): Promise<MockInterview[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/mock-interviews/my_interviews/`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching my interviews:', error);
      throw error;
    }
  }

  async getUpcomingInterviews(): Promise<MockInterview[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/mock-interviews/upcoming/`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming interviews:', error);
      throw error;
    }
  }
}

export const mockInterviewService = new MockInterviewService();