import type { User } from '../contexts/AuthContext';

// Use backend URL from environment variable or default to local dev
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api';

// Error class for structured API errors
export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(message: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
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

export interface ApiErrorResponse {
  message: string;
  status: number;
  details?: Record<string, string[]>;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // --- Token Management ---
  setAuthToken(token: string) {
    this.token = token;
  }

  getAuthToken() {
    return this.token;
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  // --- Core Request Function ---
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    let token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      let response = await fetch(url, config);

      // Handle unauthorized (401)
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          token = localStorage.getItem('token');
          const retryConfig: RequestInit = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${token}`,
            },
          };
          response = await fetch(url, retryConfig);
        } else {
          this.logout();
          throw new ApiError('Session expired. Please log in again.', 401);
        }
      }

      // Handle non-success responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.detail || errorData.message || 'An error occurred',
          response.status,
          errorData
        );
      }

      // Return JSON data
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error. Please try again later.', 0);
    }
  }

  // --- Refresh Token Logic ---
  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access);
        this.token = data.access;
        return true;
      } else {
        console.warn('Refresh token invalid or expired.');
        this.logout();
        return false;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      this.logout();
      return false;
    }
  }

  // --- Logout Helper ---
  private logout(): void {
    this.clearAuthToken();
    window.location.href = '/login';
  }

  // --- Helper for Authorization headers ---
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  // --- Authentication Endpoints ---
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/login/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.detail || 'Login failed', response.status, errorData);
    }

    const data = await response.json();

    // Store tokens
    localStorage.setItem('token', data.access);
    localStorage.setItem('refreshToken', data.refresh);

    this.setAuthToken(data.access);
    return data;
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.detail || 'Registration failed', response.status, errorData);
    }

    const responseData = await response.json();

    // Store tokens
    localStorage.setItem('token', responseData.access);
    localStorage.setItem('refreshToken', responseData.refresh);

    this.setAuthToken(responseData.access);
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

    this.setAuthToken(response.access);
    return response;
  }

  // --- User Profile Endpoints ---
  async getCurrentUser(): Promise<User> {
    return await this.request<User>('/auth/user/');
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    return await this.request<User>('/auth/user/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // --- Logout Endpoint ---
  async logoutUser(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await this.request('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.warn('Logout error:', error);
      }
    }
    this.logout();
  }

  // --- Health Check Endpoint ---
  async healthCheck(): Promise<{ status: string }> {
    return await this.request<{ status: string }>('/health/');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
