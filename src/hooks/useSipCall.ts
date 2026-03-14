/**
 * SIP Call Hook
 * Manages SIP/WebRTC voice calls (audio only)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  UserAgent,
  Registerer,
  Inviter,
  SessionState,
  type UserAgentOptions,
  type InviterOptions,
  type Session,
  type Invitation,
} from 'sip.js';
import type { Agent } from '../types';
import { useAppDispatch } from '../store/hooks';
import { setAgentStatus, setRegistered, setIsOnHold, resetCallTimers } from '../store/slices/callSlice';
import { updateAgentStatus } from '../store/slices/agentSlice';

interface UseSipCallProps {
  credentials: Agent | null;
  onIncomingCall?: (invitation: Invitation) => void;
  onCallEnded?: () => void;
}

export const useSipCall = ({ credentials, onIncomingCall, onCallEnded }: UseSipCallProps) => {
  const dispatch = useAppDispatch();


  const [registered, setLocalRegistered] = useState(false);
  const [incomingSession, setIncomingSession] = useState<Invitation | null>(null);
  const [isOnHold, setLocalIsOnHold] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callState, setCallState] = useState<SessionState | null>(null);

  const userAgentRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const sessionRef = useRef<Inviter | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callDirectionRef = useRef<'inbound' | 'outbound' | null>(null);
  const isHangingUpRef = useRef(false); // Track intentional hangup to prevent AVAILABLE override

  const config: UserAgentOptions = credentials ? {
    uri: UserAgent.makeURI(credentials.sipUri),
    transportOptions: {
      server: credentials.websocketUrl,
    },
    authorizationUsername: credentials.username,
    authorizationPassword: credentials.password,
    sessionDescriptionHandlerFactoryOptions: {
      peerConnectionOptions: {
        rtcConfiguration: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        }
      }
    }
  } : {};

  const updateStatus = useCallback(async (status: string) => {
    if (credentials) {
      try {
        await dispatch(updateAgentStatus({
          id: credentials._id,
          status: status as Agent['status'],
          username: credentials.username,
        })).unwrap();
        dispatch(setAgentStatus(status as Agent['status']));
      } catch (err) {
        console.error('Failed to update agent status:', err);
      }
    }
  }, [credentials, dispatch]);

  const setupAudioStream = useCallback((session: Session) => {
    const handler = session.sessionDescriptionHandler as any;
    if (!handler) return;

    // Create audio element if needed and attach to DOM
    if (!remoteAudioRef.current) {
      remoteAudioRef.current = document.createElement('audio');
      remoteAudioRef.current.id = 'remote-audio';
      remoteAudioRef.current.autoplay = true;
      document.body.appendChild(remoteAudioRef.current);
    }

    // Use remoteMediaStream directly from handler (like working example)
    const remoteStream = handler.remoteMediaStream;
    if (remoteAudioRef.current && remoteStream) {
      console.log('Setting remote audio stream:', remoteStream);
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((err) => {
        console.warn('Audio autoplay blocked:', err);
      });
    }

    // Also listen for track events as backup
    const pc: RTCPeerConnection = handler.peerConnection;
    pc.addEventListener('track', (event) => {
      console.log('Got remote track:', event.track.kind);
      if (event.track.kind === 'audio' && remoteAudioRef.current) {
        // Add track to existing stream or create new one
        const stream = remoteAudioRef.current.srcObject as MediaStream;
        if (stream) {
          stream.addTrack(event.track);
        } else {
          remoteAudioRef.current.srcObject = new MediaStream([event.track]);
        }
        remoteAudioRef.current.play().catch(console.warn);
      }
    });
  }, []);

  // Initialize SIP User Agent - only when username actually changes
  const credentialsUsername = credentials?.username;
  useEffect(() => {
    if (!credentials || !credentialsUsername) return;

    const userAgent = new UserAgent(config);
    userAgentRef.current = userAgent;

    const registerer = new Registerer(userAgent);
    registererRef.current = registerer;

    userAgent.delegate = {
      onInvite: async (invitation: Invitation) => {
        console.log('Incoming call received');
        setIncomingSession(invitation);
        dispatch(setAgentStatus('INCOMING'));
        onIncomingCall?.(invitation);
      }
    };

    userAgent.start()
      .then(() => registerer.register())
      .then(() => {
        setLocalRegistered(true);
        dispatch(setRegistered(true));
        updateStatus('AVAILABLE');
      })
      .catch(console.error);

    return () => {
      updateStatus('INACTIVE');
      registerer.unregister().catch(console.error);
      userAgent.stop().catch(console.error);
      dispatch(setRegistered(false));
      // Clean up audio element
      if (remoteAudioRef.current && remoteAudioRef.current.parentNode) {
        remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
        remoteAudioRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentialsUsername]);  // Only re-init when username changes, not object reference

  const makeCall = useCallback(async (target: string = '100') => {
    console.log('makeCall called with target:', target);
    console.log('userAgent exists:', !!userAgentRef.current);
    console.log('registered:', registered);

    if (!userAgentRef.current) {
      console.error('Cannot make call: UserAgent not initialized');
      return;
    }

    const domain = credentials?.domain || 'asterisk.brigid-personal-assistant.com';
    const sipUri = `sip:${target}@${domain}`;
    console.log('Creating SIP URI:', sipUri);

    const targetURI = UserAgent.makeURI(sipUri);
    if (!targetURI) {
      console.error('Invalid target URI:', sipUri);
      return;
    }

    const inviterOptions: InviterOptions = {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false, // Voice only
        }
      }
    };

    console.log('Creating Inviter...');
    const inviter = new Inviter(userAgentRef.current, targetURI, inviterOptions);
    sessionRef.current = inviter;
    callDirectionRef.current = 'outbound';

    inviter.stateChange.addListener((state) => {
      console.log('Call state changed:', state);
      setCallState(state);

      if (state === SessionState.Established) {
        console.log('Call established');
        setupAudioStream(inviter);
        dispatch(setAgentStatus('OUTGOING'));
      }

      if (state === SessionState.Terminated) {
        console.log('Call terminated');
        sessionRef.current = null;
        callDirectionRef.current = null;
        setLocalIsOnHold(false);
        dispatch(setIsOnHold(false));
        if (remoteAudioRef.current) {
          remoteAudioRef.current.pause();
          remoteAudioRef.current.srcObject = null;
        }
        // Always go to AFTER_CALL when a call ends (agent needs wrap-up time)
        if (!isHangingUpRef.current) {
          dispatch(setAgentStatus('AFTER_CALL'));
        }
        isHangingUpRef.current = false;
        onCallEnded?.();
      }
    });

    try {
      console.log('Sending INVITE...');
      await inviter.invite();
      console.log('INVITE sent successfully');
      dispatch(setAgentStatus('OUTGOING'));
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  }, [credentials, registered, setupAudioStream, dispatch, onCallEnded]);

  const answerCall = useCallback(async () => {
    if (!incomingSession) return;

    callDirectionRef.current = 'inbound';

    const sessionDescriptionHandlerOptions = {
      constraints: { audio: true, video: false }
    };

    incomingSession.stateChange.addListener((state: SessionState) => {
      setCallState(state);

      if (state === SessionState.Established) {
        setupAudioStream(incomingSession);
        updateStatus('INCOMING');
      }

      if (state === SessionState.Terminated) {
        setIncomingSession(null);
        callDirectionRef.current = null;
        setLocalIsOnHold(false);
        dispatch(setIsOnHold(false));
        if (remoteAudioRef.current) {
          remoteAudioRef.current.pause();
          remoteAudioRef.current.srcObject = null;
        }
        // Always go to AFTER_CALL when a call ends (agent needs wrap-up time)
        if (!isHangingUpRef.current) {
          dispatch(setAgentStatus('AFTER_CALL'));
        }
        isHangingUpRef.current = false;
        onCallEnded?.();
      }
    });

    try {
      await incomingSession.accept({ sessionDescriptionHandlerOptions });
    } catch (err) {
      console.error('Error answering call:', err);
    }
  }, [incomingSession, setupAudioStream, updateStatus, onCallEnded]);

  const hangUp = useCallback(async () => {
    // Set flag to prevent Terminated handler from overwriting AFTER_CALL with AVAILABLE
    isHangingUpRef.current = true;

    // Dispatch AFTER_CALL immediately
    dispatch(setAgentStatus('AFTER_CALL'));
    setLocalIsOnHold(false);
    dispatch(setIsOnHold(false));

    // Outgoing call
    if (sessionRef.current && sessionRef.current.state !== SessionState.Terminated) {
      try {
        await sessionRef.current.bye();
      } catch (err) {
        console.error('Failed to hang up outgoing call:', err);
      }
    }
    // Incoming call
    else if (incomingSession && incomingSession.state !== SessionState.Terminated) {
      try {
        await incomingSession.bye();
      } catch (err) {
        console.error('Failed to hang up incoming call:', err);
      }
    }

    // Update API in background (non-blocking)
    updateStatus('AFTER_CALL');
  }, [incomingSession, updateStatus, dispatch]);

  const declineCall = useCallback(async () => {
    if (incomingSession) {
      await incomingSession.reject();
      setIncomingSession(null);
      updateStatus('AVAILABLE');
    }
  }, [incomingSession, updateStatus]);

  const holdCall = useCallback(async () => {
    const session = sessionRef.current || incomingSession;
    if (!session || session.state !== SessionState.Established) {
      console.warn('No active call to hold');
      return;
    }

    // Dispatch HOLD status immediately for responsive UI
    setLocalIsOnHold(true);
    dispatch(setIsOnHold(true));
    dispatch(setAgentStatus('HOLD'));

    try {
      const options = {
        requestDelegate: {
          onAccept: () => {
            console.log('Hold request accepted');
          },
          onReject: () => {
            // Revert on rejection
            console.error('Hold request rejected');
            setLocalIsOnHold(false);
            dispatch(setIsOnHold(false));
            const prevStatus = callDirectionRef.current === 'outbound' ? 'OUTGOING' : 'INCOMING';
            dispatch(setAgentStatus(prevStatus));
          },
        },
        sessionDescriptionHandlerOptions: {
          hold: true,
        },
        sessionDescriptionHandlerModifiers: [
          (description: any) => {
            if (description.sdp) {
              description.sdp = description.sdp
                .replace(/a=sendrecv/g, 'a=sendonly')
                .replace(/a=recvonly/g, 'a=inactive');
            }
            return Promise.resolve(description);
          }
        ]
      };
      await (session as any).invite(options);
      // Update API in background
      updateStatus('HOLD');
    } catch (err) {
      console.error('Failed to hold call:', err);
      // Revert on error
      setLocalIsOnHold(false);
      dispatch(setIsOnHold(false));
      const prevStatus = callDirectionRef.current === 'outbound' ? 'OUTGOING' : 'INCOMING';
      dispatch(setAgentStatus(prevStatus));
    }
  }, [incomingSession, updateStatus, dispatch]);

  const unholdCall = useCallback(async () => {
    const session = sessionRef.current || incomingSession;
    if (!session || session.state !== SessionState.Established) {
      console.warn('No active call to unhold');
      return;
    }

    // Determine status based on call direction
    const activeStatus = callDirectionRef.current === 'outbound' ? 'OUTGOING' : 'INCOMING';

    // Dispatch unhold status immediately for responsive UI
    setLocalIsOnHold(false);
    dispatch(setIsOnHold(false));
    dispatch(setAgentStatus(activeStatus));

    try {
      const options = {
        requestDelegate: {
          onAccept: () => {
            console.log('Unhold request accepted');
          },
          onReject: () => {
            // Revert on rejection
            console.error('Unhold request rejected');
            setLocalIsOnHold(true);
            dispatch(setIsOnHold(true));
            dispatch(setAgentStatus('HOLD'));
          },
        },
        sessionDescriptionHandlerOptions: {
          hold: false,
        },
        sessionDescriptionHandlerModifiers: [
          (description: any) => {
            if (description.sdp) {
              description.sdp = description.sdp
                .replace(/a=sendonly/g, 'a=sendrecv')
                .replace(/a=inactive/g, 'a=sendrecv')
                .replace(/a=recvonly/g, 'a=sendrecv');
            }
            return Promise.resolve(description);
          }
        ]
      };
      await (session as any).invite(options);
      // Update API in background
      updateStatus(activeStatus);
    } catch (err) {
      console.error('Failed to unhold call:', err);
      // Revert on error
      setLocalIsOnHold(true);
      dispatch(setIsOnHold(true));
      dispatch(setAgentStatus('HOLD'));
    }
  }, [incomingSession, updateStatus, dispatch]);

  const toggleHold = useCallback(async () => {
    if (isOnHold) {
      await unholdCall();
    } else {
      await holdCall();
    }
  }, [isOnHold, holdCall, unholdCall]);

  const toggleMute = useCallback(() => {
    const session = sessionRef.current || incomingSession;
    if (!session) return;

    const handler = session.sessionDescriptionHandler as any;
    if (!handler) return;

    const pc: RTCPeerConnection = handler.peerConnection;
    pc.getSenders().forEach(sender => {
      if (sender.track?.kind === 'audio') {
        sender.track.enabled = isMuted;
      }
    });

    setIsMuted(!isMuted);
  }, [incomingSession, isMuted]);

  const goAvailable = useCallback(async () => {
    // Reset timers and set agent as available
    dispatch(resetCallTimers());
    dispatch(setAgentStatus('AVAILABLE'));
    await updateStatus('AVAILABLE');
  }, [dispatch, updateStatus]);

  const cleanup = useCallback(async () => {
    if (registererRef.current) {
      try {
        await registererRef.current.unregister();
      } catch (err) {
        console.error('Failed to unregister:', err);
      }
    }

    if (userAgentRef.current) {
      try {
        await userAgentRef.current.stop();
      } catch (err) {
        console.error('Failed to stop user agent:', err);
      }
    }

    registererRef.current = null;
    userAgentRef.current = null;
    setLocalRegistered(false);
    dispatch(setRegistered(false));
  }, [dispatch]);

  return {
    registered,
    incomingSession,
    callState,
    isOnHold,
    isMuted,
    makeCall,
    answerCall,
    hangUp,
    declineCall,
    holdCall,
    unholdCall,
    toggleHold,
    toggleMute,
    goAvailable,
    cleanup,
  };
};
