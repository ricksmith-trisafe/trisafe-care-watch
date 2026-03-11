/**
 * Telecare API Service
 * BS 8521-2 compliant alarm management for Response Center agents
 */
import { api } from './api';

export interface TelecareAlarm {
  id: number;
  deviceId: string;
  alarmType: string;
  alarmCode: string;
  location?: string;
  user: {
    name: string;
    address: string;
    phone: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
  };
  gp?: {
    name: string;
    phone: string;
  };
  receivedAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  outcomeCode?: string;
  call?: {
    callId: string;
    startedAt?: string;
    endedAt?: string;
    duration?: number;
  };
  notes?: string;
}

export interface OutcomeCode {
  code: string;
  label: string;
  description: string;
  requires_followup: boolean;
  sia_code?: string;
  scaip_code?: string;
}

export interface AlarmListResponse {
  resourceType: string;
  type: string;
  total: number;
  entry: Array<{
    resource: TelecareAlarm;
  }>;
}

export interface AcknowledgeAlarmRequest {
  alarmId: number;
  outcomeCode: string;
  notes?: string;
}

export interface AcknowledgeAlarmResponse {
  message: string;
  alarm: TelecareAlarm;
}

export const telecareApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get list of alarms (optionally filtered)
    getAlarms: builder.query<TelecareAlarm[], { acknowledged?: boolean; deviceId?: string; limit?: number }>({
      query: ({ acknowledged, deviceId, limit = 50 }) => {
        const params = new URLSearchParams();
        if (acknowledged !== undefined) params.append('acknowledged', String(acknowledged));
        if (deviceId) params.append('deviceId', deviceId);
        params.append('limit', String(limit));
        return `/telecare/alarms?${params.toString()}`;
      },
      transformResponse: (response: AlarmListResponse) =>
        response.entry?.map((e) => e.resource) || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'TelecareAlarm' as const, id })),
              { type: 'TelecareAlarm', id: 'LIST' },
            ]
          : [{ type: 'TelecareAlarm', id: 'LIST' }],
    }),

    // Get a single alarm by ID
    getAlarm: builder.query<TelecareAlarm, number>({
      query: (alarmId) => `/telecare/alarms/${alarmId}`,
      providesTags: (_result, _error, alarmId) => [{ type: 'TelecareAlarm', id: alarmId }],
    }),

    // Get available outcome codes
    getOutcomeCodes: builder.query<OutcomeCode[], void>({
      query: () => '/telecare/outcome-codes',
      providesTags: ['OutcomeCode'],
    }),

    // Acknowledge an alarm with outcome code
    acknowledgeAlarm: builder.mutation<AcknowledgeAlarmResponse, AcknowledgeAlarmRequest>({
      query: ({ alarmId, outcomeCode, notes }) => ({
        url: `/telecare/alarms/${alarmId}/acknowledge`,
        method: 'POST',
        body: { outcomeCode, notes },
      }),
      invalidatesTags: (_result, _error, { alarmId }) => [
        { type: 'TelecareAlarm', id: alarmId },
        { type: 'TelecareAlarm', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAlarmsQuery,
  useLazyGetAlarmsQuery,
  useGetAlarmQuery,
  useGetOutcomeCodesQuery,
  useAcknowledgeAlarmMutation,
} = telecareApi;
