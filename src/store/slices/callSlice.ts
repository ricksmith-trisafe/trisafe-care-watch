/**
 * Call Slice
 * Manages call state and active patient tabs
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Patient, AgentStatus, EmergencyConnectionData } from '../../types';

interface ActiveCall {
  id: string;
  patient: Patient | null;
  connectionData: EmergencyConnectionData | null;
  startTime: string;
  status: 'ringing' | 'active' | 'hold' | 'ended';
  fhirCallId?: string; // Communication record callId from call-history-service
}

interface CallState {
  agentStatus: AgentStatus;
  isRegistered: boolean;
  activeCalls: ActiveCall[];
  currentCallId: string | null;
  isOnHold: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  // Timing state
  callStartTime: string | null;
  holdStartTime: string | null;
  afterCallStartTime: string | null;
  activeCallTime: number;
  totalHoldTime: number;
  afterCallTime: number;
}

const initialState: CallState = {
  agentStatus: 'INACTIVE',
  isRegistered: false,
  activeCalls: [],
  currentCallId: null,
  isOnHold: false,
  isMuted: false,
  isSpeakerOn: false,
  callDuration: 0,
  // Timing state
  callStartTime: null,
  holdStartTime: null,
  afterCallStartTime: null,
  activeCallTime: 0,
  totalHoldTime: 0,
  afterCallTime: 0,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setAgentStatus: (state, action: PayloadAction<AgentStatus>) => {
      state.agentStatus = action.payload;
    },
    setRegistered: (state, action: PayloadAction<boolean>) => {
      state.isRegistered = action.payload;
    },
    addActiveCall: (state, action: PayloadAction<ActiveCall>) => {
      state.activeCalls.push(action.payload);
      if (!state.currentCallId) {
        state.currentCallId = action.payload.id;
      }
    },
    updateActiveCall: (state, action: PayloadAction<{ id: string; updates: Partial<ActiveCall> }>) => {
      const call = state.activeCalls.find(c => c.id === action.payload.id);
      if (call) {
        Object.assign(call, action.payload.updates);
      }
    },
    removeActiveCall: (state, action: PayloadAction<string>) => {
      state.activeCalls = state.activeCalls.filter(c => c.id !== action.payload);
      if (state.currentCallId === action.payload) {
        state.currentCallId = state.activeCalls[0]?.id ?? null;
      }
    },
    setCurrentCallId: (state, action: PayloadAction<string | null>) => {
      state.currentCallId = action.payload;
    },
    setIsOnHold: (state, action: PayloadAction<boolean>) => {
      state.isOnHold = action.payload;
    },
    setIsMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },
    setIsSpeakerOn: (state, action: PayloadAction<boolean>) => {
      state.isSpeakerOn = action.payload;
    },
    setCallDuration: (state, action: PayloadAction<number>) => {
      state.callDuration = action.payload;
    },
    resetCallState: (state) => {
      state.activeCalls = [];
      state.currentCallId = null;
      state.isOnHold = false;
      state.isMuted = false;
      state.callDuration = 0;
      state.callStartTime = null;
      state.holdStartTime = null;
      state.afterCallStartTime = null;
      state.activeCallTime = 0;
      state.totalHoldTime = 0;
      state.afterCallTime = 0;
    },
    // Timer reducers
    startCallTimer: (state) => {
      state.callStartTime = new Date().toISOString();
      state.holdStartTime = null;
      state.afterCallStartTime = null;
      state.activeCallTime = 0;
      state.totalHoldTime = 0;
      state.afterCallTime = 0;
    },
    startHoldTimer: (state) => {
      state.holdStartTime = new Date().toISOString();
    },
    stopHoldTimer: (state) => {
      state.holdStartTime = null;
    },
    startAfterCallTimer: (state) => {
      state.afterCallStartTime = new Date().toISOString();
      state.afterCallTime = 0;
    },
    tickActiveTime: (state) => {
      state.activeCallTime += 1;
    },
    tickHoldTime: (state) => {
      state.totalHoldTime += 1;
    },
    tickAfterCallTime: (state) => {
      state.afterCallTime += 1;
    },
    resetCallTimers: (state) => {
      state.callStartTime = null;
      state.holdStartTime = null;
      state.afterCallStartTime = null;
      state.activeCallTime = 0;
      state.totalHoldTime = 0;
      state.afterCallTime = 0;
    },
  },
});

export const {
  setAgentStatus,
  setRegistered,
  addActiveCall,
  updateActiveCall,
  removeActiveCall,
  setCurrentCallId,
  setIsOnHold,
  setIsMuted,
  setIsSpeakerOn,
  setCallDuration,
  resetCallState,
  // Timer actions
  startCallTimer,
  startHoldTimer,
  stopHoldTimer,
  startAfterCallTimer,
  tickActiveTime,
  tickHoldTime,
  tickAfterCallTime,
  resetCallTimers,
} = callSlice.actions;

export default callSlice.reducer;
