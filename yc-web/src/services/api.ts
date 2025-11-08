import type { User } from '../contexts/AuthContext';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, string[]>;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  getAuthToken() {
    return this.token;
  }

  clearAuthToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request with new token
            const newToken = localStorage.getItem('token');
            const retryConfig: RequestInit = {
              ...config,
              headers: {
                ...config.headers,
                Authorization: `Bearer ${newToken}`,
              },
            };
            const retryResponse = await fetch(url, retryConfig);
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          // If refresh failed or retry failed, logout user
          this.logout();
          throw new ApiError('Authentication failed', 401);
        }

        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || 'An error occurred',
          response.status,
          errorData.details
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0);
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  private logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Redirect to login page
    window.location.href = '/login';
  }

  // Authentication methods
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/login/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Login failed',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    // Store tokens
    localStorage.setItem('token', data.access);
    localStorage.setItem('refreshToken', data.refresh);

    return data;
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Registration failed',
        response.status,
        errorData
      );
    }

    const responseData = await response.json();

    // Store tokens
    localStorage.setItem('token', responseData.access);
    localStorage.setItem('refreshToken', responseData.refresh);

    return responseData;
  }

  async loginWithGoogle(token: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/google/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    // Store tokens
    localStorage.setItem('token', response.access);
    localStorage.setItem('refreshToken', response.refresh);

    return response;
  }

  async getCurrentUser(): Promise<User> {
    return await this.request<User>('/auth/user/');
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    return await this.request<User>('/auth/user/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async logoutUser(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await this.request('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        // Ignore logout errors
        console.error('Logout error:', error);
      }
    }
    this.logout();
  }

  async healthCheck(): Promise<{ status: string }> {
    return await this.request<{ status: string }>('/health/');
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export ApiError class
export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
