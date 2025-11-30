import { RestApiUtil, ApiError } from './RestApiUtil';

const API_BASE_URL = import.meta.env.BACKEND_API_BASE_URL || 'http://127.0.0.1:8001/api';

interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
}

class RestApiAuthUtil extends RestApiUtil {
    private token: string | null = null;

    constructor(baseURL: string) {
        super(baseURL);
    }

    setAuthToken(token: string) {
        this.token = token;
    }

    getAuthToken(): string | null {
        return this.token || localStorage.getItem('access');
    }

    clearAuthToken() {
        this.token = null;
        const keysToRemove = ['access', 'refresh'];
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    private getAuthHeaders(): HeadersInit {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private async refreshToken(): Promise<boolean> {
        const refreshToken = localStorage.getItem('refresh');
        if (!refreshToken) return false;

        try {
            const response = await super.post('/auth/token/refresh/', { refresh: refreshToken });
            localStorage.setItem('access', response.access);
            this.token = response.access;
            return true;
        } catch (err) {
            this.logout();
            return false;
        }
    }

    private logout(): void {
        this.clearAuthToken();
        window.location.href = '/login';
    }

    protected async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const authHeaders = this.getAuthHeaders();
        const optionsWithAuth = {
            ...options,
            headers: {
                ...authHeaders,
                ...options.headers,
            },
        };

        try {
            return await super.request<T>(endpoint, optionsWithAuth);
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    const retryOptionsWithAuth = {
                        ...options,
                        headers: {
                            ...this.getAuthHeaders(),
                            ...options.headers,
                        },
                    };
                    return await super.request<T>(endpoint, retryOptionsWithAuth);
                } else {
                    throw new ApiError('Session expired. Please log in again.', 401);
                }
            }
            throw error;
        }
    }
}

export const restApiAuthUtil = new RestApiAuthUtil(API_BASE_URL);
export default restApiAuthUtil;