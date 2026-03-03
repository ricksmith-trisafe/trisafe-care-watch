/**
 * Call History API Service
 * Manages FHIR Communication records for call history
 */
import { api } from './api';

interface CreateTwilioCallRequest {
  callerPhone?: string;
  callerEmail?: string;
  callerName?: string;
  recipientPhone?: string;
  recipientName?: string;
  recipientEmail?: string;
  direction: 'inbound' | 'outbound';
  isEmergency?: boolean;
  callType?: string;
  asteriskChannel?: string;
  recordingKey?: string;
}

interface CreateTwilioCallResponse {
  success: boolean;
  message: string;
  data: {
    callId: string;
    communication: {
      _id: string;
      status: string;
      callMetadata: {
        callId: string;
        direction: string;
      };
    };
    patient?: {
      id: string;
      name: string;
    } | null;
  };
}

interface AddCallNotesRequest {
  callId: string;
  content: string;
  author?: string;
  practitionerId?: string;
  patientId?: string;
}

interface AddCallNotesResponse {
  success: boolean;
  message: string;
  communication: {
    _id: string;
    payload: Array<{ contentString?: string }>;
  };
}

interface EndCallRequest {
  callId: string;
  endReason?: string;
  connectionQuality?: string;
  notes?: string;
}

interface EndCallResponse {
  success: boolean;
  message: string;
  communication: {
    _id: string;
    status: string;
    callMetadata: {
      callDuration: number;
      endReason: string;
    };
  };
}

interface CallHistoryNote {
  content: string;
  author: string;
  timestamp: string;
}

interface CallHistoryRecord {
  _id: string;
  callId: string;
  status: string;
  direction: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes: CallHistoryNote[];
  patient?: {
    id: string;
    name: string;
  };
}

interface GetCallHistoryByPatientResponse {
  success: boolean;
  data: CallHistoryRecord[];
}

// Patient note (FHIR Communication without call context)
interface CreatePatientNoteRequest {
  patientId: string;
  content: string;
  noteType?: 'note' | 'alert' | 'device-activity';
  patientName?: string;
  author?: string;
  practitionerId?: string;
  callId?: string;
}

interface CreatePatientNoteResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    communicationId: string;
    type: string;
    content: string;
    author: string;
    timestamp: string;
  };
}

// Unified communications (calls + notes + device activity)
interface PatientCommunicationItem {
  id: string;
  communicationId: string;
  type: string; // 'regular', 'emergency', 'manual', 'note', 'device-activity'
  isCall: boolean;
  timestamp: string;
  author: string;
  practitionerId?: string;
  patientId?: string;
  callId?: string;
  content: string | Array<{ content: string; author: string; timestamp: string | null }>;
  medium: string;
  status: string;
  direction?: string;
  duration?: number;
  endReason?: string;
}

interface GetPatientCommunicationsResponse {
  success: boolean;
  total: number;
  data: PatientCommunicationItem[];
}

export const callHistoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Create a Twilio call record (with automatic patient lookup)
    createTwilioCall: builder.mutation<CreateTwilioCallResponse, CreateTwilioCallRequest>({
      query: (data) => ({
        url: '/call-history/twilio',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CallHistory'],
    }),

    // Add notes to a call
    addCallNotes: builder.mutation<AddCallNotesResponse, AddCallNotesRequest>({
      query: ({ callId, ...body }) => ({
        url: `/call-history/${callId}/notes`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CallHistory'],
    }),

    // End a call
    endCall: builder.mutation<EndCallResponse, EndCallRequest>({
      query: ({ callId, ...body }) => ({
        url: `/call-history/${callId}/end`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CallHistory'],
    }),

    // Get call history by patient ID (legacy)
    getCallHistoryByPatient: builder.query<GetCallHistoryByPatientResponse, string>({
      query: (patientId) => `/call-history/patient/${patientId}`,
      providesTags: ['CallHistory'],
    }),

    // Create a patient note (Communication without call context)
    createPatientNote: builder.mutation<CreatePatientNoteResponse, CreatePatientNoteRequest>({
      query: ({ patientId, ...body }) => ({
        url: `/call-history/patient/${patientId}/note`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CallHistory'],
      async onQueryStarted({ patientId, content, author, practitionerId, callId }, { dispatch, queryFulfilled }) {
        // Optimistically update the getPatientCommunications cache
        const patchResult = dispatch(
          callHistoryApi.util.updateQueryData('getPatientCommunications', { patientId }, (draft) => {
            const tempId = `temp-${Date.now()}`;
            draft.data.unshift({
              id: tempId,
              communicationId: tempId,
              type: 'manual',
              isCall: false,
              timestamp: new Date().toISOString(),
              author: author || 'Agent',
              practitionerId,
              patientId,
              callId,
              content,
              medium: 'WRITTEN',
              status: 'completed',
            });
            draft.total += 1;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          // Revert optimistic update on error
          patchResult.undo();
        }
      },
    }),

    // Get all communications for a patient (calls + notes + device activity)
    getPatientCommunications: builder.query<GetPatientCommunicationsResponse, { patientId: string; types?: string }>({
      query: ({ patientId, types }) => {
        const params = new URLSearchParams();
        if (types) params.append('types', types);
        const queryString = params.toString();
        return `/call-history/patient/${patientId}/communications${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['CallHistory'],
    }),
  }),
});

export const {
  useCreateTwilioCallMutation,
  useAddCallNotesMutation,
  useEndCallMutation,
  useLazyGetCallHistoryByPatientQuery,
  useCreatePatientNoteMutation,
  useLazyGetPatientCommunicationsQuery,
} = callHistoryApi;

export type { CallHistoryNote, CallHistoryRecord, PatientCommunicationItem };
