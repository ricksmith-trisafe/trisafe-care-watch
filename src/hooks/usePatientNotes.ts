import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useAddCallNotesMutation, useCreatePatientNoteMutation } from '../services/callHistoryApi';
import { updatePatientData } from '../store/slices/patientSlice';
import type { CallNote } from '../types';

export interface UsePatientNotesReturn {
  addNote: (content: string) => Promise<void>;
}

/**
 * Hook for adding notes to the current patient.
 * Handles both call-attached notes and standalone patient notes.
 * Uses Redux for state - can be used anywhere in the component tree.
 */
export const usePatientNotes = (): UsePatientNotesReturn => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentCallId, activeCalls } = useAppSelector((state) => state.call);
  const currentPatient = useAppSelector((state) => state.patient.currentPatient);
  const patientDataCache = useAppSelector((state) => state.patient.patientDataCache);

  const [addCallNotesApi] = useAddCallNotesMutation();
  const [createPatientNote] = useCreatePatientNoteMutation();

  const addNote = useCallback(async (content: string) => {
    if (!currentPatient?._id) return;

    const authorName = user?.fullName || `${user?.firstName} ${user?.lastName}` || 'Agent';
    const practitionerId = user?.id;
    // Use MongoDB _id for cache, FHIR id for API calls
    const patientMongoId = currentPatient._id;
    const patientFhirId = currentPatient.id || currentPatient._id;
    const patientName = `${currentPatient.name?.[0]?.given?.[0] || ''} ${currentPatient.name?.[0]?.family || ''}`.trim();

    // Check if we have an active call for this patient
    const activeCall = activeCalls.find(c => c.id === currentCallId);
    const callId = activeCall?.fhirCallId;

    // Optimistically add note to UI
    const newNote: CallNote = {
      id: Date.now().toString(),
      author: authorName,
      practitionerId,
      patientId: patientFhirId,
      callId,
      timestamp: new Date().toISOString(),
      content,
      callType: activeCall ? 'Current Call' : undefined,
    };

    const currentNotes = patientDataCache[patientMongoId]?.callNotes || [];
    dispatch(updatePatientData({
      patientId: patientMongoId,
      updates: {
        callNotes: [newNote, ...currentNotes],
        hasAddedNoteThisCall: true,
      },
    }));

    try {
      if (activeCall?.fhirCallId) {
        // If there's an active call, add note to the call record
        await addCallNotesApi({
          callId: activeCall.fhirCallId,
          content,
          author: authorName,
          practitionerId,
          patientId: patientFhirId,
        }).unwrap();
        console.log('Note saved to call record');
      } else {
        // No active call - create a standalone patient note (FHIR Communication)
        await createPatientNote({
          patientId: patientFhirId,
          content,
          noteType: 'note',
          patientName,
          author: authorName,
          practitionerId,
        }).unwrap();
        console.log('Patient note saved');
      }
    } catch (err) {
      console.error('Failed to save note to API:', err);
    }
  }, [currentPatient, user, currentCallId, activeCalls, patientDataCache, dispatch, addCallNotesApi, createPatientNote]);

  return { addNote };
};
