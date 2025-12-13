import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://localhost:8001/api';

export interface JobTest {
  id: string;
  title: string;
  description: string;
  type: 'technical' | 'aptitude' | 'coding' | 'behavioral' | 'domain_specific';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'active' | 'inactive' | 'archived';
  job_id: string;
  company_name: string;
  position_title: string;
  duration: number;
  total_marks: number;
  passing_marks: number;
  questions: any[];
  instructions: string;
  enable_proctoring: boolean;
  enable_screen_recording: boolean;
  enable_webcam_monitoring: boolean;
  enable_tab_switching_detection: boolean;
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_by_details?: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  total_attempts: number;
  average_score?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateJobTestData {
  title: string;
  description: string;
  type: 'technical' | 'aptitude' | 'coding' | 'behavioral' | 'domain_specific';
  difficulty: 'easy' | 'medium' | 'hard';
  job_id: string;
  company_name: string;
  position_title: string;
  duration: number;
  total_marks: number;
  passing_marks: number;
  questions: any[];
  instructions: string;
  enable_proctoring: boolean;
  enable_screen_recording: boolean;
  enable_webcam_monitoring: boolean;
  enable_tab_switching_detection: boolean;
  start_date?: string;
  end_date?: string;
}

class JobTestService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getAllJobTests(): Promise<JobTest[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/job-tests/`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching job tests:', error);
      throw error;
    }
  }

  async getJobTest(id: string): Promise<JobTest> {
    try {
      const response = await axios.get(`${API_BASE_URL}/job-tests/${id}/`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching job test:', error);
      throw error;
    }
  }

  async createJobTest(data: CreateJobTestData): Promise<JobTest> {
    try {
      const response = await axios.post(`${API_BASE_URL}/job-tests/`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating job test:', error);
      throw error;
    }
  }

  async updateJobTest(id: string, data: Partial<CreateJobTestData>): Promise<JobTest> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/job-tests/${id}/`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating job test:', error);
      throw error;
    }
  }

  async deleteJobTest(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/job-tests/${id}/`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting job test:', error);
      throw error;
    }
  }

  async activateJobTest(id: string): Promise<JobTest> {
    try {
      const response = await axios.post(`${API_BASE_URL}/job-tests/${id}/activate/`, {}, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error activating job test:', error);
      throw error;
    }
  }

  async deactivateJobTest(id: string): Promise<JobTest> {
    try {
      const response = await axios.post(`${API_BASE_URL}/job-tests/${id}/deactivate/`, {}, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error deactivating job test:', error);
      throw error;
    }
  }

  async getJobTestSubmissions(id: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/job-tests/${id}/submissions/`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching job test submissions:', error);
      throw error;
    }
  }

  async updateJobTestStatistics(id: string): Promise<JobTest> {
    try {
      const response = await axios.post(`${API_BASE_URL}/job-tests/${id}/update_statistics/`, {}, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating job test statistics:', error);
      throw error;
    }
  }
}

export const jobTestService = new JobTestService();