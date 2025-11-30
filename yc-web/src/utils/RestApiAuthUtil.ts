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

    isAuthenticated(): boolean {
        return !!this.getAuthToken();
    }

    async forceRefreshToken(): Promise<boolean> {
        console.log('Force refreshing token...');
        return await this.refreshToken();
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
        if (!refreshToken) {
            console.warn('No refresh token available');
            return false;
        }

        try {
            console.log('Attempting to refresh token...');
            const response = await super.post<{ access: string; refresh?: string }>('/auth/token/refresh/', { refresh: refreshToken });
            
            localStorage.setItem('access', response.access);
            if (response.refresh) {
                localStorage.setItem('refresh', response.refresh);
            }
            this.token = response.access;
            console.log('Token refreshed successfully');
            return true;
        } catch (err) {
            console.error('Token refresh failed:', err);
            this.logout();
            return false;
        }
    }

    private logout(): void {
        console.log('Logging out user due to authentication failure');
        this.clearAuthToken();
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }

    protected async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        let authHeaders = this.getAuthHeaders();
        let optionsWithAuth = {
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
                // Don't attempt token refresh for auth endpoints (login, register, etc.)
                const isAuthEndpoint = endpoint.includes('/auth/login') || 
                                     endpoint.includes('/auth/register') || 
                                     endpoint.includes('/auth/token/refresh');
                
                if (isAuthEndpoint) {
                    // For auth endpoints, just throw the error without trying to refresh
                    throw error;
                }

                console.log('Received 401, attempting token refresh...');
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    console.log('Token refreshed, retrying request...');
                    // Update headers with new token
                    authHeaders = this.getAuthHeaders();
                    const retryOptionsWithAuth = {
                        ...options,
                        headers: {
                            ...authHeaders,
                            ...options.headers,
                        },
                    };
                    return await super.request<T>(endpoint, retryOptionsWithAuth);
                } else {
                    console.error('Token refresh failed, redirecting to login');
                    throw new ApiError('Session expired. Please log in again.', 401);
                }
            }
            throw error;
        }
    }
}

export const restApiAuthUtil = new RestApiAuthUtil(API_BASE_URL);
export default restApiAuthUtil;