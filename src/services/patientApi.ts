/**
 * Patient API Service
 */
import { api } from './api';
import type { Patient, RelatedPerson } from '../types';

interface PatientLookupResponse {
  patient: Patient;
  contacts: RelatedPerson[];
}

interface PatientSearchResponse {
  success: boolean;
  data: Patient[];
  total: number;
}

interface PatientSearchParams {
  query?: string;
  name?: string;
  phone?: string;
  nhsNumber?: string;
  addressLine?: string;
  postcode?: string;
}

export interface MedicalInfoUpdateData {
  bloodType?: string;
  nhsNumber?: string;
  gpPractice?: string;
  medications?: string[];
  allergies?: string[];
  conditions?: string[];
}

interface MedicalInfoUpdateResponse {
  success: boolean;
  data: Patient;
}

export interface PatientUpdateData {
  name?: Patient['name'];
  telecom?: Patient['telecom'];
  address?: Patient['address'];
  birthDate?: string;
  gender?: string;
}

interface EmergencyCallResponse {
  success: boolean;
  message?: string;
}

export const patientApi = api.injectEndpoints({
  endpoints: (builder) => ({
    lookupPatientByPhone: builder.query<PatientLookupResponse, string>({
      query: (phone) => `/patients/lookup?phone=${encodeURIComponent(phone)}`,
      providesTags: (result) =>
        result ? [{ type: 'Patient', id: result.patient._id }] : [],
    }),
    lookupPatientByEmail: builder.query<PatientLookupResponse, string>({
      query: (email) => `/patients/lookup?email=${encodeURIComponent(email)}`,
      providesTags: (result) =>
        result ? [{ type: 'Patient', id: result.patient._id }] : [],
    }),
    getPatientById: builder.query<Patient, string>({
      query: (id) => `/patients/${id}`,
      providesTags: (_, __, id) => [{ type: 'Patient', id }],
    }),
    searchPatients: builder.query<PatientSearchResponse, PatientSearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.query) searchParams.append('q', params.query);
        if (params.name) searchParams.append('name', params.name);
        if (params.phone) searchParams.append('phone', params.phone);
        if (params.nhsNumber) searchParams.append('nhsNumber', params.nhsNumber);
        if (params.addressLine) searchParams.append('addressLine', params.addressLine);
        if (params.postcode) searchParams.append('postcode', params.postcode);
        return `/patients/search?${searchParams.toString()}`;
      },
      providesTags: ['Patient'],
    }),
    updateMedicalInfo: builder.mutation<MedicalInfoUpdateResponse, { patientId: string; data: MedicalInfoUpdateData }>({
      query: ({ patientId, data }) => ({
        url: `/patients/${patientId}/medical-info`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_, __, { patientId }) => [{ type: 'Patient', id: patientId }],
    }),
    updatePatient: builder.mutation<Patient, { patientId: string; data: PatientUpdateData }>({
      query: ({ patientId, data }) => ({
        url: `/patients/${patientId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { patientId }) => [{ type: 'Patient', id: patientId }],
    }),
    getRelatedPersons: builder.query<RelatedPerson[], string>({
      query: (patientId) => `/related-persons/contacts/${patientId}`,
    }),
    triggerEmergencyCall: builder.mutation<EmergencyCallResponse, string>({
      query: (toEmail) => ({
        url: '/signaling/emergency-call',
        method: 'POST',
        body: { from: toEmail },
      }),
    }),
  }),
});

export const {
  useLookupPatientByPhoneQuery,
  useLookupPatientByEmailQuery,
  useLazyLookupPatientByPhoneQuery,
  useLazyLookupPatientByEmailQuery,
  useGetPatientByIdQuery,
  useLazyGetPatientByIdQuery,
  useLazySearchPatientsQuery,
  useLazyGetRelatedPersonsQuery,
  useUpdateMedicalInfoMutation,
  useUpdatePatientMutation,
  useTriggerEmergencyCallMutation,
} = patientApi;
