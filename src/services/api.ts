/**
 * RTK Query API Service
 * Base API with auth headers
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiConfig } from '../config/api';
import { getAccessToken } from '../store/slices/authSlice';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: apiConfig.baseUrl,
    prepareHeaders: async (headers) => {
      const token = await getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Patient', 'Agent', 'Device', 'CallHistory', 'AllergyIntolerance', 'Condition', 'MedicationStatement', 'ClinicalSummary', 'TelecareAlarm', 'OutcomeCode', 'Vitals'],
  endpoints: () => ({}),
});
