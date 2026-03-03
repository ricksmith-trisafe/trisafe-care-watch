/**
 * Auth Slice
 * Manages Cognito authentication state
 */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { cognitoConfig } from '../../config/cognito';
import { apiConfig } from '../../config/api';
import type { AuthUser } from '../../types';

// Initialize Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.userPoolId,
  ClientId: cognitoConfig.clientId,
});

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: AuthUser | null;
  error: string | null;
  requiresNewPassword: boolean;
  pendingEmail: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  user: null,
  error: null,
  requiresNewPassword: false,
  pendingEmail: null,
};

// Store for pending new password challenge
let pendingPasswordChallenge: {
  cognitoUser: CognitoUser;
  userAttributes: Record<string, string>;
} | null = null;

// Get access token from current session
export const getAccessToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        resolve(null);
        return;
      }
      resolve(session.getIdToken().getJwtToken());
    });
  });
};

// Helper to call backend API
const callBackendApi = async (endpoint: string, options: RequestInit = {}, directToken?: string) => {
  const token = directToken ?? await getAccessToken();
  const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return response;
};

// Register with backend
const registerWithBackend = async (token?: string) => {
  const response = await callBackendApi('/admin/auth/register', { method: 'POST', body: '{}' }, token);
  if (!response.ok && response.status !== 409) {
    throw new Error('Failed to register with backend');
  }
  return response.json();
};

// Fetch user profile from backend
const fetchUserProfile = async (token?: string): Promise<AuthUser> => {
  const response = await callBackendApi('/admin/auth/me', {}, token);
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

// Check current auth state
export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, { rejectWithValue }) => {
    try {
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        return { isAuthenticated: false, user: null };
      }

      const sessionResult = await new Promise<{ isValid: boolean; session: CognitoUserSession | null }>((resolve, reject) => {
        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ isValid: session?.isValid() ?? false, session });
        });
      });

      if (!sessionResult.isValid) {
        return { isAuthenticated: false, user: null };
      }

      let user: AuthUser | null = null;
      try {
        user = await fetchUserProfile();
      } catch (err) {
        console.warn('Could not fetch user profile:', err);
      }

      return { isAuthenticated: true, user };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Auth check failed');
    }
  }
);

// Login
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const cognitoUser = new CognitoUser({
        Username: email.toLowerCase(),
        Pool: userPool,
      });

      const authDetails = new AuthenticationDetails({
        Username: email.toLowerCase(),
        Password: password,
      });

      const authResult = await new Promise<{ session: CognitoUserSession } | { newPasswordRequired: true; userAttributes: Record<string, string> }>((resolve, reject) => {
        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (session) => {
            resolve({ session });
          },
          onFailure: (err) => {
            reject(err);
          },
          newPasswordRequired: (userAttributes) => {
            pendingPasswordChallenge = { cognitoUser, userAttributes };
            resolve({ newPasswordRequired: true, userAttributes });
          },
        });
      });

      if ('newPasswordRequired' in authResult) {
        return { requiresNewPassword: true, email: email.toLowerCase() };
      }

      const token = authResult.session.getIdToken().getJwtToken();
      await registerWithBackend(token);
      const user = await fetchUserProfile(token);

      return { user, requiresNewPassword: false };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

// Complete new password challenge
export const completeNewPassword = createAsyncThunk(
  'auth/completeNewPassword',
  async ({ newPassword }: { newPassword: string }, { rejectWithValue }) => {
    try {
      if (!pendingPasswordChallenge) {
        throw new Error('No pending password challenge');
      }

      const { cognitoUser, userAttributes } = pendingPasswordChallenge;

      delete userAttributes.email_verified;
      delete userAttributes.phone_number_verified;
      delete userAttributes.email;

      const session = await new Promise<CognitoUserSession>((resolve, reject) => {
        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
          onSuccess: (session) => {
            pendingPasswordChallenge = null;
            resolve(session);
          },
          onFailure: (err) => {
            reject(err);
          },
        });
      });

      const token = session.getIdToken().getJwtToken();
      await registerWithBackend(token);
      const user = await fetchUserProfile(token);

      return { user };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to set new password');
    }
  }
);

// Logout
export const logout = createAsyncThunk('auth/logout', async () => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.requiresNewPassword = false;
        state.pendingEmail = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.requiresNewPassword) {
          state.requiresNewPassword = true;
          state.pendingEmail = action.payload.email ?? null;
        } else {
          state.isAuthenticated = true;
          state.user = action.payload.user ?? null;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(completeNewPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeNewPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.requiresNewPassword = false;
        state.pendingEmail = null;
        state.user = action.payload.user;
      })
      .addCase(completeNewPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
