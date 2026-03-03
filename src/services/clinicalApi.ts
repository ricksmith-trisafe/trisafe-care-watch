/**
 * Clinical Resources API Service
 * FHIR R4 compliant endpoints for AllergyIntolerance, Condition, MedicationStatement
 */
import { api } from './api';
import type {
  ClinicalSummary,
  AllergyIntolerance,
  Condition,
  MedicationStatement,
} from '../types';

// Response types
interface ClinicalSummaryResponse {
  success: boolean;
  data: ClinicalSummary;
}

interface AllergyResponse {
  success: boolean;
  data: AllergyIntolerance;
}

interface AllergiesResponse {
  success: boolean;
  data: AllergyIntolerance[];
  total: number;
}

interface ConditionResponse {
  success: boolean;
  data: Condition;
}

interface ConditionsResponse {
  success: boolean;
  data: Condition[];
  total: number;
}

interface MedicationResponse {
  success: boolean;
  data: MedicationStatement;
}

interface MedicationsResponse {
  success: boolean;
  data: MedicationStatement[];
  total: number;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

// Input types for creating/updating resources
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

export const clinicalApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ========== Clinical Summary ==========
    getClinicalSummary: builder.query<ClinicalSummary, string>({
      query: (patientId) => `/patients/${patientId}/clinical-summary`,
      transformResponse: (response: ClinicalSummaryResponse) => response.data,
      providesTags: (_, __, patientId) => [
        { type: 'ClinicalSummary', id: patientId },
        { type: 'Patient', id: patientId },
      ],
    }),

    // ========== AllergyIntolerance ==========
    getAllergies: builder.query<AllergyIntolerance[], string>({
      query: (patientRef) => `/clinical/allergy-intolerance?patient=${encodeURIComponent(patientRef)}`,
      transformResponse: (response: AllergiesResponse) => response.data,
      providesTags: ['AllergyIntolerance'],
    }),

    createAllergy: builder.mutation<AllergyIntolerance, CreateAllergyInput>({
      query: (allergy) => ({
        url: '/clinical/allergy-intolerance',
        method: 'POST',
        body: allergy,
      }),
      transformResponse: (response: AllergyResponse) => response.data,
      invalidatesTags: ['AllergyIntolerance', 'ClinicalSummary'],
    }),

    updateAllergy: builder.mutation<AllergyIntolerance, { id: string; data: Partial<CreateAllergyInput> }>({
      query: ({ id, data }) => ({
        url: `/clinical/allergy-intolerance/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: AllergyResponse) => response.data,
      invalidatesTags: ['AllergyIntolerance', 'ClinicalSummary'],
    }),

    deleteAllergy: builder.mutation<void, string>({
      query: (id) => ({
        url: `/clinical/allergy-intolerance/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: DeleteResponse) => { console.log(response.message); },
      invalidatesTags: ['AllergyIntolerance', 'ClinicalSummary'],
    }),

    // ========== Condition ==========
    getConditions: builder.query<Condition[], string>({
      query: (patientRef) => `/clinical/condition?patient=${encodeURIComponent(patientRef)}`,
      transformResponse: (response: ConditionsResponse) => response.data,
      providesTags: ['Condition'],
    }),

    createCondition: builder.mutation<Condition, CreateConditionInput>({
      query: (condition) => ({
        url: '/clinical/condition',
        method: 'POST',
        body: condition,
      }),
      transformResponse: (response: ConditionResponse) => response.data,
      invalidatesTags: ['Condition', 'ClinicalSummary'],
    }),

    updateCondition: builder.mutation<Condition, { id: string; data: Partial<CreateConditionInput> }>({
      query: ({ id, data }) => ({
        url: `/clinical/condition/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ConditionResponse) => response.data,
      invalidatesTags: ['Condition', 'ClinicalSummary'],
    }),

    deleteCondition: builder.mutation<void, string>({
      query: (id) => ({
        url: `/clinical/condition/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: DeleteResponse) => { console.log(response.message); },
      invalidatesTags: ['Condition', 'ClinicalSummary'],
    }),

    // ========== MedicationStatement ==========
    getMedications: builder.query<MedicationStatement[], string>({
      query: (patientRef) => `/clinical/medication-statement?patient=${encodeURIComponent(patientRef)}`,
      transformResponse: (response: MedicationsResponse) => response.data,
      providesTags: ['MedicationStatement'],
    }),

    createMedication: builder.mutation<MedicationStatement, CreateMedicationInput>({
      query: (medication) => ({
        url: '/clinical/medication-statement',
        method: 'POST',
        body: medication,
      }),
      transformResponse: (response: MedicationResponse) => response.data,
      invalidatesTags: ['MedicationStatement', 'ClinicalSummary'],
    }),

    updateMedication: builder.mutation<MedicationStatement, { id: string; data: Partial<CreateMedicationInput> }>({
      query: ({ id, data }) => ({
        url: `/clinical/medication-statement/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: MedicationResponse) => response.data,
      invalidatesTags: ['MedicationStatement', 'ClinicalSummary'],
    }),

    deleteMedication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/clinical/medication-statement/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: DeleteResponse) => { console.log(response.message); },
      invalidatesTags: ['MedicationStatement', 'ClinicalSummary'],
    }),
  }),
});

export const {
  // Clinical Summary
  useGetClinicalSummaryQuery,
  useLazyGetClinicalSummaryQuery,
  // AllergyIntolerance
  useGetAllergiesQuery,
  useCreateAllergyMutation,
  useUpdateAllergyMutation,
  useDeleteAllergyMutation,
  // Condition
  useGetConditionsQuery,
  useCreateConditionMutation,
  useUpdateConditionMutation,
  useDeleteConditionMutation,
  // MedicationStatement
  useGetMedicationsQuery,
  useCreateMedicationMutation,
  useUpdateMedicationMutation,
  useDeleteMedicationMutation,
} = clinicalApi;
