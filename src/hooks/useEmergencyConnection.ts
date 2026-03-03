import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addActiveCall, setCurrentCallId } from '../store/slices/callSlice';
import {
  setCurrentPatient,
  addPatientTab,
  updatePatientData,
} from '../store/slices/patientSlice';
import { useCreateTwilioCallMutation } from '../services/callHistoryApi';
import { useLazyLookupPatientByPhoneQuery, useLazyLookupPatientByEmailQuery, useLazyGetPatientByIdQuery } from '../services/patientApi';
import type { Patient, EmergencyConnectionData, RelatedPerson } from '../types';

export interface UseEmergencyConnectionProps {
  addDeviceFromConnection: (deviceId: string, deviceName?: string) => void;
}

export interface UseEmergencyConnectionReturn {
  handleEmergencyConnection: (data: EmergencyConnectionData) => Promise<void>;
}

/**
 * Hook that handles incoming emergency connections.
 * Coordinates patient lookup, call creation, device updates, and tab management.
 * Uses Redux for state - can be used anywhere in the component tree.
 */
export const useEmergencyConnection = ({
  addDeviceFromConnection,
}: UseEmergencyConnectionProps): UseEmergencyConnectionReturn => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const patientTabs = useAppSelector((state) => state.patient.patientTabs);

  const [createTwilioCall] = useCreateTwilioCallMutation();
  const [lookupPatientByPhone] = useLazyLookupPatientByPhoneQuery();
  const [lookupPatientByEmail] = useLazyLookupPatientByEmailQuery();
  const [getPatientById] = useLazyGetPatientByIdQuery();

  const handleEmergencyConnection = useCallback(async (data: EmergencyConnectionData) => {
    console.log('Emergency connection:', data);

    // Update device status to 'active' when connection comes online
    if (data.customer.deviceId) {
      addDeviceFromConnection(data.customer.deviceId, data.customer.callerIdName);
    }

    // Create call history record for all call types
    let fhirCallId: string | undefined;
    const callerPhone = data.customer.callerIdNum || '';
    const callerEmail = data.customer.callerEmail || '';
    const isEmergency = data.customer.type === 'sip' || data.customer.type === 'web';

    if (callerPhone || callerEmail) {
      try {
        const callResult = await createTwilioCall({
          callerPhone: callerPhone || undefined,
          callerEmail: callerEmail || undefined,
          callerName: data.customer.callerIdName || data.customer.username,
          recipientEmail: user?.email,
          direction: 'inbound',
          isEmergency,
          callType: isEmergency ? 'emergency' : 'regular',
          asteriskChannel: data.customer.channel,
        }).unwrap();
        fhirCallId = callResult.data.callId;
        console.log('Created call history record:', fhirCallId);
      } catch (err) {
        console.error('Failed to create call history record:', err);
      }
    }

    // Lookup patient - try telecare device patientId first, then email, then phone
    let patientResult: { patient: Patient; contacts: RelatedPerson[] } | null = null;

    // Telecare devices (BS 8521-2) have a direct link to FHIR Patient
    if (data.customer.telecareDevice?.patientId) {
      try {
        console.log('Looking up patient by telecare device patientId:', data.customer.telecareDevice.patientId);
        const patient = await getPatientById(data.customer.telecareDevice.patientId).unwrap();
        if (patient) {
          patientResult = { patient, contacts: [] }; // Contacts loaded via clinical summary
        }
      } catch (err) {
        console.error('Failed to lookup patient by telecare device patientId:', err);
      }
    }

    if (!patientResult && data.customer.callerEmail) {
      // SIP/web calls use email for identification
      try {
        console.log('Looking up patient by email:', data.customer.callerEmail);
        patientResult = await lookupPatientByEmail(data.customer.callerEmail).unwrap();
      } catch (err) {
        console.error('Failed to lookup patient by email:', err);
      }
    }

    if (!patientResult && data.customer.callerIdNum) {
      // Phone calls use phone number
      try {
        console.log('Looking up patient by phone:', data.customer.callerIdNum);
        patientResult = await lookupPatientByPhone(data.customer.callerIdNum).unwrap();
      } catch (err) {
        console.error('Failed to lookup patient by phone:', err);
      }
    }

    if (patientResult?.patient) {
      dispatch(setCurrentPatient(patientResult.patient));

      // Initialize patient data in cache
      dispatch(updatePatientData({
        patientId: patientResult.patient._id,
        updates: {
          hasAddedNoteThisCall: false,
        },
      }));

      // Add to tabs (will update existing or add new)
      dispatch(addPatientTab({
        id: patientResult.patient._id,
        patient: patientResult.patient,
        isActive: true,
      }));

      dispatch(addActiveCall({
        id: patientResult.patient._id,
        patient: patientResult.patient,
        connectionData: data,
        startTime: new Date().toISOString(),
        status: 'ringing',
        fhirCallId,
      }));
      dispatch(setCurrentCallId(patientResult.patient._id));
    } else {
      console.warn('No patient found for caller:', data.customer);
    }
  }, [
    user?.email,
    patientTabs,
    dispatch,
    createTwilioCall,
    lookupPatientByPhone,
    lookupPatientByEmail,
    getPatientById,
    addDeviceFromConnection,
  ]);

  return { handleEmergencyConnection };
};
