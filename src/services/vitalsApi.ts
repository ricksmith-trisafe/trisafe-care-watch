import { api } from './api';
import type { Vitals, VitalsHistory, SleepSummary, ActivitySummary, EcgSummary } from '../types';

interface VitalsResponse {
  patientId: string;
  vitals: Vitals;
  history: VitalsHistory[];
  sleep: SleepSummary;
  activity: ActivitySummary;
  ecg: EcgSummary;
}

export const vitalsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPatientVitals: builder.query<VitalsResponse, { patientId: string; historyHours?: number }>({
      query: ({ patientId, historyHours = 72 }) =>
        `/observations/patient/${patientId}/vitals?historyHours=${historyHours}`,
      providesTags: (_, __, { patientId }) => [{ type: 'Vitals', id: patientId }],
    }),
  }),
});

export const {
  useGetPatientVitalsQuery,
  useLazyGetPatientVitalsQuery,
} = vitalsApi;
