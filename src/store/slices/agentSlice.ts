/**
 * Agent Slice
 * Manages agent credentials and status updates
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiConfig } from '../../config/api';
import { getAccessToken } from './authSlice';
import type { Agent, AgentStatus } from '../../types';

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAccessToken();
  const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `Request failed: ${response.status}`);
  }
  return response.json();
};

export const fetchInactiveAgent = createAsyncThunk(
  'agent/fetchInactiveAgent',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch('/asterisk/getInactiveAgent') as Agent;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch agent');
    }
  }
);

export const fetchAllAgents = createAsyncThunk(
  'agent/fetchAllAgents',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch('/asterisk/all') as Agent[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch agents');
    }
  }
);

export const updateAgentStatus = createAsyncThunk(
  'agent/updateAgentStatus',
  async ({ id, status, username }: { id: string; status: AgentStatus; username: string }, { rejectWithValue }) => {
    try {
      return await apiFetch(`/asterisk/agent/status/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, username }),
      }) as Agent;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update agent status');
    }
  }
);

interface AgentState {
  credentials: Agent | null;
  allAgents: Agent[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AgentState = {
  credentials: null,
  allAgents: [],
  isLoading: false,
  error: null,
};

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    clearAgentCredentials: (state) => {
      state.credentials = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInactiveAgent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInactiveAgent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.credentials = action.payload;
      })
      .addCase(fetchInactiveAgent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAllAgents.fulfilled, (state, action) => {
        state.allAgents = action.payload;
      });
  },
});

export const { clearAgentCredentials } = agentSlice.actions;
export default agentSlice.reducer;
