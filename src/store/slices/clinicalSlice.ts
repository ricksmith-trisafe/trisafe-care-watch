/**
 * Clinical Slice
 * Manages clinical data (FHIR resources) with manual async thunks
 * Replaces RTK Query clinicalApi for full control over cache updates
 */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiConfig } from '../../config/api';
import { getAccessToken } from './authSlice';
import type { ClinicalSummary, AllergyIntolerance, Condition, MedicationStatement } from '../../types';

// Re-export input types (previously from clinicalApi)
export interface CreateAllergyInput {
  code: { text?: string; coding?: { system?: string; code?: string; display?: string }[] };
  patient: { reference: string; display?: string };
  criticality?: 'low' | 'high' | 'unable-to-assess';
  category?: ('food' | 'medication' | 'environment' | 'biologic')[];
  clinicalStatus?: { coding: { system: string; code: string; display?: string }[] };
  verificationStatus?: { coding: { system: string; code: string; display?: string }[] };
  reaction?: { manifestation?: { text?: string }[]; severity?: 'mild' | 'moderate' | 'severe' }[];
}

export interface CreateConditionInput {
  code: { text?: string; coding?: { system?: string; code?: string; display?: string }[] };
  subject: { reference: string; display?: string };
  clinicalStatus?: { coding: { system: string; code: string; display?: string }[] };
  verificationStatus?: { coding: { system: string; code: string; display?: string }[] };
  severity?: { coding?: { system?: string; code?: string; display?: string }[]; text?: string };
  onsetString?: string;
  onsetDateTime?: string;
}

export interface CreateMedicationInput {
  medicationCodeableConcept: { text?: string; coding?: { system?: string; code?: string; display?: string }[] };
  subject: { reference: string; display?: string };
  status?: 'active' | 'completed' | 'entered-in-error' | 'intended' | 'stopped' | 'on-hold' | 'unknown' | 'not-taken';
  dosage?: { text?: string }[];
  effectivePeriod?: { start?: string; end?: string };
}

export interface MedicalInfoUpdateData {
  bloodType?: string;
  nhsNumber?: string;
  gpPractice?: string;
}

// Helper for authenticated API calls
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

// ========== Async Thunks ==========

export const fetchClinicalSummary = createAsyncThunk(
  'clinical/fetchClinicalSummary',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const response = await apiFetch(`/patients/${patientId}/clinical-summary`);
      return { patientId, data: response.data as ClinicalSummary };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch clinical summary');
    }
  }
);

export const updateMedicalInfo = createAsyncThunk(
  'clinical/updateMedicalInfo',
  async ({ patientId, data }: { patientId: string; data: MedicalInfoUpdateData }, { rejectWithValue }) => {
    try {
      await apiFetch(`/patients/${patientId}/medical-info`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return { patientId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update medical info');
    }
  }
);

export const createAllergy = createAsyncThunk(
  'clinical/createAllergy',
  async (input: CreateAllergyInput, { rejectWithValue }) => {
    try {
      const response = await apiFetch('/clinical/allergy-intolerance', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return response.data as AllergyIntolerance;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create allergy');
    }
  }
);

export const deleteAllergy = createAsyncThunk(
  'clinical/deleteAllergy',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiFetch(`/clinical/allergy-intolerance/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete allergy');
    }
  }
);

export const createCondition = createAsyncThunk(
  'clinical/createCondition',
  async (input: CreateConditionInput, { rejectWithValue }) => {
    try {
      const response = await apiFetch('/clinical/condition', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return response.data as Condition;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create condition');
    }
  }
);

export const deleteCondition = createAsyncThunk(
  'clinical/deleteCondition',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiFetch(`/clinical/condition/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete condition');
    }
  }
);

export const createMedication = createAsyncThunk(
  'clinical/createMedication',
  async (input: CreateMedicationInput, { rejectWithValue }) => {
    try {
      const response = await apiFetch('/clinical/medication-statement', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return response.data as MedicationStatement;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create medication');
    }
  }
);

export const deleteMedication = createAsyncThunk(
  'clinical/deleteMedication',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiFetch(`/clinical/medication-statement/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete medication');
    }
  }
);

// ========== Slice ==========

interface ClinicalState {
  summaryCache: Record<string, ClinicalSummary>;
  isLoading: boolean;
  error: string | null;
}

const initialState: ClinicalState = {
  summaryCache: {},
  isLoading: false,
  error: null,
};

const clinicalSlice = createSlice({
  name: 'clinical',
  initialState,
  reducers: {
    clearClinicalCache: (state) => {
      state.summaryCache = {};
    },
    removeClinicalData: (state, action: PayloadAction<string>) => {
      delete state.summaryCache[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClinicalSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClinicalSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summaryCache[action.payload.patientId] = action.payload.data;
      })
      .addCase(fetchClinicalSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearClinicalCache, removeClinicalData } = clinicalSlice.actions;
export default clinicalSlice.reducer;
