import type { User } from '../contexts/AuthContext';
import restApiAuthUtil from '../utils/RestApiAuthUtil';
import { safeLocalStorage } from '../utils/localStorageUtil';

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

class AuthService {
  setAuthToken(token: string): void {
    restApiAuthUtil.setAuthToken(token);
  }

  isAuthenticated(): boolean {
    return restApiAuthUtil.isAuthenticated();
  }

  getAuthToken(): string | null {
    return restApiAuthUtil.getAuthToken();
  }

  async refreshToken(): Promise<boolean> {
    return restApiAuthUtil.forceRefreshToken();
  }

  initializeFromStorage(): void {
    const token = safeLocalStorage.getItem('access');
    if (token) {
      restApiAuthUtil.setAuthToken(token);
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await restApiAuthUtil.post<LoginResponse>('/auth/login/', { email, password });

    if (response.access) {
      safeLocalStorage.setItem('access', response.access);
    }
    if (response.refresh) {
      safeLocalStorage.setItem('refresh', response.refresh);
    }
    if (response.access) {
      restApiAuthUtil.setAuthToken(response.access);
    }

    return response;
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await restApiAuthUtil.post<LoginResponse>('/auth/register/', data);

    if (response.access) {
      safeLocalStorage.setItem('access', response.access);
    }
    if (response.refresh) {
      safeLocalStorage.setItem('refresh', response.refresh);
    }
    if (response.access) {
      restApiAuthUtil.setAuthToken(response.access);
    }

    return response;
  }

  async loginWithGoogle(token: string): Promise<LoginResponse> {
    const response = await restApiAuthUtil.post<LoginResponse>('/auth/google/', { token });

    localStorage.setItem('access', response.access);
    localStorage.setItem('refresh', response.refresh);
    restApiAuthUtil.setAuthToken(response.access);

    return response;
  }

  async getCurrentUser(): Promise<User> {
    return await restApiAuthUtil.get<User>('/auth/user/');
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    return await restApiAuthUtil.put<User>('/auth/user/', userData);
  }

  async logoutUser(): Promise<void> {
    const refreshToken = safeLocalStorage.getItem('refresh');
    if (refreshToken) {
      restApiAuthUtil.post('/auth/logout/', { refresh: refreshToken }).catch(error => {
        console.warn('Logout error:', error);
      });
    }
    restApiAuthUtil.clearAuthToken();
    window.location.href = '/login';
  }

  async healthCheck(): Promise<{ status: string }> {
    return await restApiAuthUtil.get<{ status: string }>('/health/');
  }
}

export const authService = new AuthService();
export default authService;