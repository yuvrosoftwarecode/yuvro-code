import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';
import { ApiError } from '../utils/RestApiUtil';
import { safeLocalStorage } from '../utils/localStorageUtil';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  profile?: {
    about?: string;
    avatar?: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const getInitialState = (): AuthState => {
  safeLocalStorage.cleanup();
  
  const accessToken = safeLocalStorage.getItem('access');
  const user = safeLocalStorage.getJSON<User>('user');

  if (accessToken) {
    return {
      user,
      token: accessToken,
      isLoading: true, 
      isAuthenticated: true, 
    };
  }
  return {
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, getInitialState());

  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      safeLocalStorage.setItem('access', state.token);
      authService.setAuthToken(state.token);
      
      if (state.user) {
        safeLocalStorage.setJSON('user', state.user);
      }
    } else {
      safeLocalStorage.removeItem('access');
      safeLocalStorage.removeItem('refresh');
      safeLocalStorage.removeItem('user');
    }
  }, [state.isAuthenticated, state.token, state.user]);

  useEffect(() => {
    const accessToken = safeLocalStorage.getItem('access');

    if (accessToken) {
      authService.setAuthToken(accessToken);
      authService.initializeFromStorage();

      authService.getCurrentUser()
        .then((user) => {
          const currentToken = authService.getAuthToken() || accessToken;
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token: currentToken }
          });
        })
        .catch((error) => {
          console.error('Failed to get current user:', error);
          if (error.status === 401 && error.message?.includes('Session expired')) {
            safeLocalStorage.removeItem('access');
            safeLocalStorage.removeItem('refresh');
            dispatch({ type: 'LOGIN_FAILURE' });
          } else {
            console.warn('Could not fetch user data, but keeping authentication');
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        });
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(email, password);

      safeLocalStorage.setJSON('user', response.user);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user, token: response.access },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      return response.user;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };


  const loginWithGoogle = async (): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      throw new ApiError('Google OAuth not implemented yet', 501);
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const register = async (
    email: string,
    username: string,
    password: string
  ): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.register({
        email,
        username,
        password,
        password_confirm: password
      });

      safeLocalStorage.setJSON('user', response.user);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user, token: response.access },
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = (): void => {
    authService.logoutUser().finally(() => {
      localStorage.clear();
      dispatch({ type: 'LOGOUT' });
    });
  };

  const updateUser = (user: User): void => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
