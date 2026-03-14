/**
 * Patient Slice
 * Manages patient tabs, current patient selection, and per-patient cached data
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Patient, CallNote, RelatedPerson } from '../../types';

// Per-patient cached data
export interface PatientData {
  callNotes: CallNote[];
  personalContacts: RelatedPerson[];
  hasAddedNoteThisCall: boolean;
  fhirCallId: string | null;
}

export interface PatientTab {
  id: string;
  patient: Patient;
  isActive: boolean;
}

interface PatientState {
  patientTabs: PatientTab[];
  currentPatient: Patient | null;
  patientDataCache: Record<string, PatientData>;
}

const initialState: PatientState = {
  patientTabs: [],
  currentPatient: null,
  patientDataCache: {},
};

const createEmptyPatientData = (): PatientData => ({
  callNotes: [],
  personalContacts: [],
  hasAddedNoteThisCall: false,
  fhirCallId: null,
});

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    // Patient tabs actions
    setPatientTabs: (state, action: PayloadAction<PatientTab[]>) => {
      state.patientTabs = action.payload;
    },
    addPatientTab: (state, action: PayloadAction<PatientTab>) => {
      const exists = state.patientTabs.find(t => t.id === action.payload.id);
      if (exists) {
        // Update existing tab
        state.patientTabs = state.patientTabs.map(t =>
          t.id === action.payload.id ? { ...t, isActive: true } : t
        );
      } else {
        state.patientTabs.push(action.payload);
      }
    },
    removePatientTab: (state, action: PayloadAction<string>) => {
      state.patientTabs = state.patientTabs.filter(t => t.id !== action.payload);
    },
    updatePatientInTab: (state, action: PayloadAction<Patient>) => {
      state.patientTabs = state.patientTabs.map(tab =>
        tab.id === action.payload._id ? { ...tab, patient: action.payload } : tab
      );
      // Also update currentPatient if it's the same patient
      if (state.currentPatient?._id === action.payload._id) {
        state.currentPatient = action.payload;
      }
    },

    // Current patient actions
    setCurrentPatient: (state, action: PayloadAction<Patient | null>) => {
      state.currentPatient = action.payload;
    },

    // Patient data cache actions
    updatePatientData: (state, action: PayloadAction<{ patientId: string; updates: Partial<PatientData> }>) => {
      const { patientId, updates } = action.payload;
      const existing = state.patientDataCache[patientId] || createEmptyPatientData();
      state.patientDataCache[patientId] = {
        ...existing,
        ...updates,
      };
    },
    removePatientData: (state, action: PayloadAction<string>) => {
      delete state.patientDataCache[action.payload];
    },
    clearPatientDataCache: (state) => {
      state.patientDataCache = {};
    },

    // Combined reset action
    resetPatientState: (state) => {
      state.patientTabs = [];
      state.currentPatient = null;
      state.patientDataCache = {};
    },
  },
});

export const {
  setPatientTabs,
  addPatientTab,
  removePatientTab,
  updatePatientInTab,
  setCurrentPatient,
  updatePatientData,
  removePatientData,
  clearPatientDataCache,
  resetPatientState,
} = patientSlice.actions;

export default patientSlice.reducer;
