import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useLazyGetPatientCommunicationsQuery } from '../services/callHistoryApi';
import { updatePatientData } from '../store/slices/patientSlice';
import type { CallNote } from '../types';

/**
 * Hook that loads patient communications (call notes) when current patient changes.
 * Transforms API response to CallNote format and updates Redux store.
 * Uses Redux for state - can be used anywhere in the component tree.
 */
export const usePatientCommunications = (): void => {
  const dispatch = useAppDispatch();
  const currentPatient = useAppSelector((state) => state.patient.currentPatient);
  const [getPatientCommunications] = useLazyGetPatientCommunicationsQuery();

  useEffect(() => {
    const patientMongoId = currentPatient?._id;
    // Use FHIR id for API calls (matches subject.reference in Communications)
    const patientFhirId = currentPatient?.id || currentPatient?._id;

    console.log('[Notes] Patient changed, loading notes:', { patientMongoId, patientFhirId, hasId: !!currentPatient?.id });

    if (!patientMongoId || !patientFhirId) return;

    const loadPatientCommunications = async () => {
      try {
        console.log('[Notes] Fetching communications for patient:', patientFhirId);
        const result = await getPatientCommunications({ patientId: patientFhirId }).unwrap();
        console.log('[Notes] Got result:', { success: result.success, count: result.data?.length });

        if (result.success && result.data.length > 0) {
          // Transform communications to CallNote format for display
          const notes: CallNote[] = result.data.flatMap((comm) => {
            // Determine callType badge based on communication type
            let callType: 'Current Call' | 'Routine Check' | 'Emergency' | undefined;
            if (comm.type === 'emergency') {
              callType = 'Emergency';
            } else if (comm.type === 'manual' || comm.type === 'note') {
              callType = undefined; // Manual notes don't have a call type badge
            } else if (comm.type === 'regular' || comm.isCall) {
              callType = 'Routine Check';
            }

            // For calls, content is an array of individual notes - expand each into its own entry
            if (Array.isArray(comm.content)) {
              if (comm.content.length === 0) {
                return [];
              }
              return comm.content.map((note, index) => ({
                id: `${comm.id}-${index}`,
                author: note.author || 'Agent',
                practitionerId: comm.practitionerId,
                patientId: comm.patientId,
                callId: comm.communicationId,
                timestamp: note.timestamp || comm.timestamp,
                content: note.content || '',
                callType,
              }));
            }

            // For manual notes, content is a string - return as single entry
            const contentStr = typeof comm.content === 'string' ? comm.content : '';
            if (!contentStr.trim()) {
              return [];
            }
            return [{
              id: comm.id,
              author: comm.author,
              practitionerId: comm.practitionerId,
              patientId: comm.patientId,
              callId: comm.communicationId,
              timestamp: comm.timestamp,
              content: contentStr,
              callType,
            }];
          });

          // Sort by timestamp descending (newest first)
          notes.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          dispatch(updatePatientData({ patientId: patientMongoId, updates: { callNotes: notes } }));
        } else {
          dispatch(updatePatientData({ patientId: patientMongoId, updates: { callNotes: [] } }));
        }
      } catch (err) {
        console.error('Failed to load patient communications:', err);
      }
    };

    loadPatientCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPatient?._id]);
};
