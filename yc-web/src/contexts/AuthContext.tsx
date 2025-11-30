import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';
import { ApiError } from '../utils/RestApiUtil';

export interface User {
  id: number;
  email: string;
  username: string;
  role?: string;
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
  login: (email: string, password: string) => Promise<void>;
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

// Initialize state from localStorage
const getInitialState = (): AuthState => {
  const accessToken = localStorage.getItem('access');
  if (accessToken) {
    return {
      user: null, // Will be loaded from authService
      token: accessToken,
      isLoading: false,
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
      localStorage.setItem('access', state.token);
      authService.setAuthToken(state.token);
    } else {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    }
  }, [state.isAuthenticated, state.token]);

  useEffect(() => {
    const accessToken = localStorage.getItem('access');
    
    if (accessToken) {
      authService.setAuthToken(accessToken);
      // Initialize from storage and get user data
      authService.initializeFromStorage();
    }
  }, []);

  // -- Login --
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(email, password);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user, token: response.access },
      });
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
