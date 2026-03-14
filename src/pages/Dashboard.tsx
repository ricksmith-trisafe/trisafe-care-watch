import { useState, useEffect, useRef } from 'react';
import { Header } from '../components/layout/Header';
import { ConfirmModal } from '../components/layout/ConfirmModal';
import { LeftSidebar } from '../components/sidebar';
import { MainContent } from '../components/main';
import { RightSidebar } from '../components/contacts';
import { EmergencyVideoPanel } from '../components/video/EmergencyVideoPanel';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useSipCall } from '../hooks/useSipCall';
import { useCallTimer } from '../hooks/useCallTimer';
import { useSocket, type AlarmEscalationData } from '../hooks/useSocket';
import { useEmergencyVideo } from '../hooks/useEmergencyVideo';
import { fetchInactiveAgent } from '../store/slices/agentSlice';
import { usePatientTabs } from '../hooks/usePatientTabs';
import { useDevices } from '../hooks/useDevices';
import { usePatientCommunications } from '../hooks/usePatientCommunications';
import { useClinicalSummaryLoader } from '../hooks/useClinicalSummaryLoader';
import { usePatientNotes } from '../hooks/usePatientNotes';
import { useEmergencyConnection } from '../hooks/useEmergencyConnection';
import { useVitalsLoader } from '../hooks/useVitalsLoader';
import type { QuickReference } from '../types';
import './Dashboard.scss';

export const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { agentStatus, currentCallId } = useAppSelector((state) => state.call);
  const patientDataCache = useAppSelector((state) => state.patient.patientDataCache);
  const agentCredentials = useAppSelector((state) => state.agent.credentials);

  // Call timer hook
  const { activeCallTime, totalHoldTime, afterCallTime, isOnHold: timerIsOnHold } = useCallTimer();

  // Patient tabs hook (uses Redux internally)
  const {
    patientTabs,
    currentPatient,
    selectPatient,
    closePatient,
    addPatient,
    selectSearchedPatient,
    updatePatient,
    showNoteRequiredModal,
    setShowNoteRequiredModal,
  } = usePatientTabs();

  // Get current patient's cached data from Redux
  const currentPatientData = currentPatient?._id ? patientDataCache[currentPatient._id] : null;
  const callNotes = currentPatientData?.callNotes || [];
  const clinicalSummary = useAppSelector((state) =>
    currentPatient?._id ? state.clinical.summaryCache[currentPatient._id] : null
  ) || null;
  const hasAddedNoteThisCall = currentPatientData?.hasAddedNoteThisCall || false;

  // Devices hook
  const { devices, handleDeviceStatusChange, addDeviceFromConnection } = useDevices();

  // Vitals from stored FHIR Observations
  const { vitals, sleep, activity, ecg, isVitalsLoading } = useVitalsLoader();

  // Static state (not extracted - rarely changes)
  const [quickReference] = useState<QuickReference | null>(null);

  // Escalated alarms state
  const [escalatedAlarms, setEscalatedAlarms] = useState<AlarmEscalationData[]>([]);

  // Handle alarm escalation events
  const handleAlarmEscalation = (data: AlarmEscalationData) => {
    console.log('Alarm escalation received:', data);
    // Add or update escalated alarm
    setEscalatedAlarms((prev) => {
      const existing = prev.findIndex((a) => a.alarmId === data.alarmId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = data;
        return updated;
      }
      return [...prev, data];
    });

    // Play alert sound for critical escalations
    if (data.priority === 'critical') {
      const audio = new Audio('/sounds/critical-alert.mp3');
      audio.play().catch(() => console.log('Could not play alert sound'));
    }
  };

  // Clear escalation when alarm is acknowledged
  const handleClearEscalation = (alarmId: number) => {
    setEscalatedAlarms((prev) => prev.filter((a) => a.alarmId !== alarmId));
  };

  // Emergency connection handler (uses Redux internally)
  const { handleEmergencyConnection } = useEmergencyConnection({
    addDeviceFromConnection,
  });

  // Initialize SIP call hook — extract patient ID from SIP header for telecare calls
  const sipCall = useSipCall({
    credentials: agentCredentials || null,
    onIncomingCall: (invitation) => {
      const patientId = invitation.request.getHeader('X-Patient-Id');
      const deviceId = invitation.request.from?.displayName;

      console.log("Incoming call with patientId:", patientId, "and deviceId:", deviceId);

      if (patientId) {
        handleEmergencyConnection({
          customer: {
            type: 'sip',
            callerIdName: deviceId,
            deviceId,
            telecareDevice: {
              deviceId: deviceId || '',
              patientId,
            },
          },
          agent: {
            username: agentCredentials?.username || '',
            _id: agentCredentials?._id || '',
          },
        });
      }
    },
  });

  // Initialize socket hook
  const { socket } = useSocket({
    agentUsername: agentCredentials?.username,
    agentEmail: user?.email,
    onEmergencyConnection: handleEmergencyConnection,
    onDeviceStatusChange: handleDeviceStatusChange,
    onAlarmEscalation: handleAlarmEscalation,
  });

  // Get patient email for video call
  const currentPatientEmail = currentPatient?.telecom?.find(t => t.system === 'email')?.value || null;
  const currentVideoCallId = currentPatient?._id || null;

  // Initialize emergency video hook
  const emergencyVideo = useEmergencyVideo({
    socket,
    callId: currentVideoCallId,
    patientEmail: currentPatientEmail,
  });

  // Fetch agent credentials once on mount
  const hasFetchedAgent = useRef(false);
  useEffect(() => {
    if (!hasFetchedAgent.current) {
      hasFetchedAgent.current = true;
      dispatch(fetchInactiveAgent());
    }
  }, [dispatch]);

  // Load patient communications (uses Redux internally)
  usePatientCommunications();

  // Load clinical summary (uses Redux internally)
  const { isClinicalLoading, refreshClinicalSummary } = useClinicalSummaryLoader();

  // Patient notes hook (uses Redux internally)
  const { addNote } = usePatientNotes();

  // Emergency call loading state (socket-based, no REST mutation needed)
  const isEmergencyCallLoading = false;

  // Handlers
  const handleCallContact = (phone: string) => {
    sipCall.makeCall(phone);
  };

  const handleGoAvailable = () => {
    // Check if agent has added a note during this call - required before going available
    if (!hasAddedNoteThisCall && currentPatient) {
      setShowNoteRequiredModal(true);
      return;
    }

    // Patient state is only cleared when the agent closes the patient tab
    sipCall.goAvailable();
  };

  const handleCallEmergency = (service: 'ambulance' | 'police' | 'fire') => {
    console.log(`Calling ${service} emergency services`);
  };

  const handleTriggerEmergencyCall = async () => {
    if (!currentPatientEmail) {
      console.warn('Cannot trigger emergency call: no patient email found');
      return;
    }
    // Emit socket event so the Pi navigates to the emergency screen
    if (socket?.connected) {
      socket.emit('emergencyCall', currentPatientEmail);
      console.log('Emergency call socket event sent to:', currentPatientEmail);
    } else {
      console.warn('Socket not connected, cannot trigger emergency call');
    }
  };

  return (
    <div className="dashboard">
      <ConfirmModal
        isOpen={showNoteRequiredModal}
        title="Note Required"
        message="You must add a call note before going available. Please add a note documenting this call."
        confirmLabel="OK"
        onConfirm={() => setShowNoteRequiredModal(false)}
        onCancel={() => setShowNoteRequiredModal(false)}
        variant="danger"
        showCancel={false}
      />

      <Header
        activeCallTime={activeCallTime}
        holdTime={totalHoldTime}
        afterCallTime={afterCallTime}
        isOnHold={timerIsOnHold}
        agentStatus={agentStatus}
        pendingAlerts={3}
      />

      <div className="dashboard__content">
        <LeftSidebar
          patient={currentPatient}
          devices={devices}
          agentStatus={agentStatus}
          isOnHold={sipCall.isOnHold}
          isMuted={sipCall.isMuted}
          onAnswer={sipCall.answerCall}
          onHangUp={sipCall.hangUp}
          onHold={sipCall.toggleHold}
          onMute={sipCall.toggleMute}
          onTransfer={() => console.log('Transfer')}
          onDial={() => console.log('Dial')}
          onMakeCall={(phoneNumber) => sipCall.makeCall(phoneNumber)}
          onGoAvailable={handleGoAvailable}
          onRequestCamera={emergencyVideo.requestVideo}
          isVideoConnecting={emergencyVideo.isConnecting}
          isVideoConnected={emergencyVideo.isConnected}
          onDispatchEmergency={() => handleCallEmergency('ambulance')}
          onContactWarden={() => console.log('Contact warden')}
          onTriggerEmergencyCall={handleTriggerEmergencyCall}
          isEmergencyCallLoading={isEmergencyCallLoading}
          escalatedAlarms={escalatedAlarms}
          onClearEscalation={handleClearEscalation}
        />

        <MainContent
          patients={patientTabs}
          currentPatientId={currentCallId}
          onPatientSelect={selectPatient}
          onPatientClose={closePatient}
          onAddPatient={addPatient}
          onSearchSelectPatient={selectSearchedPatient}
          vitals={vitals}
          sleep={sleep}
          activity={activity}
          ecg={ecg}
          isVitalsLoading={isVitalsLoading}
          clinicalSummary={clinicalSummary}
          isClinicalLoading={isClinicalLoading}
          onRefreshClinicalSummary={refreshClinicalSummary}
          callNotes={callNotes}
          onAddNote={addNote}
          onPatientUpdate={updatePatient}
        />

        <RightSidebar
          quickReference={quickReference}
          onCallContact={handleCallContact}
          onCallEmergency={handleCallEmergency}
        />
      </div>

      <EmergencyVideoPanel
        localVideoRef={emergencyVideo.localVideoRef}
        remoteVideoRef={emergencyVideo.remoteVideoRef}
        isConnected={emergencyVideo.isConnected}
        onClose={emergencyVideo.disconnectVideo}
      />
    </div>
  );
};
