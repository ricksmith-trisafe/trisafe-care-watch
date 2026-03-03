/**
 * Emergency Video WebRTC Hook
 * Response Center creates offer, Pi automatically accepts and answers
 */
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface UseEmergencyVideoProps {
  socket: Socket | null;
  callId: string | null;
  patientEmail: string | null;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const useEmergencyVideo = ({
  socket,
  callId,
  patientEmail,
}: UseEmergencyVideoProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Get local media stream
  const getLocalStream = async (): Promise<MediaStream> => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    console.log('[EmergencyVideo] Getting user media...');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false, // Audio handled by SIP
    });

    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  };

  // Create peer connection with local tracks
  const createPeerConnection = (stream: MediaStream): RTCPeerConnection => {
    console.log('[EmergencyVideo] Creating peer connection');
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionRef.current = pc; // Store in ref for immediate access

    // Add local tracks
    stream.getTracks().forEach((track) => {
      console.log('[EmergencyVideo] Adding track:', track.kind);
      pc.addTrack(track, stream);
    });

    // Handle remote tracks - store in state since video element might not exist yet
    pc.ontrack = (event) => {
      console.log('[EmergencyVideo] Remote track received:', event.track.kind);
      console.log('[EmergencyVideo] Track enabled:', event.track.enabled);
      console.log('[EmergencyVideo] Track readyState:', event.track.readyState);
      console.log('[EmergencyVideo] Track muted:', event.track.muted);
      console.log('[EmergencyVideo] Streams in event:', event.streams?.length || 0);

      // Listen for unmute event - this fires when media actually starts flowing
      event.track.onunmute = () => {
        console.log('[EmergencyVideo] Track unmuted - media is now flowing');
      };

      event.track.onmute = () => {
        console.log('[EmergencyVideo] Track muted - media stopped');
      };

      event.track.onended = () => {
        console.log('[EmergencyVideo] Track ended');
      };

      let stream: MediaStream;
      if (event.streams && event.streams[0]) {
        console.log('[EmergencyVideo] Using existing stream');
        stream = event.streams[0];
      } else {
        // aiortc may not include streams with tracks - create one
        console.log('[EmergencyVideo] Creating stream from track');
        stream = new MediaStream([event.track]);
      }

      console.log('[EmergencyVideo] Stream tracks:', stream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState,
      })));

      // Store in state - useEffect will set srcObject when video element is ready
      setRemoteStream(stream);
      // Also try to set directly if element exists
      if (remoteVideoRef.current) {
        console.log('[EmergencyVideo] Setting srcObject directly on video element');
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && patientEmail) {
        console.log('[EmergencyVideo] Sending ICE candidate');
        socket.emit('videoFeedIceCandidate', {
          callId,
          patientEmail,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[EmergencyVideo] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnecting(false);
        setIsConnected(true);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setIsConnecting(false);
        setIsConnected(false);
        setError('Connection failed');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[EmergencyVideo] ICE state:', pc.iceConnectionState);
    };

    return pc;
  };

  // Request video - creates offer and sends to Pi
  const requestVideo = async () => {
    if (!socket || !patientEmail) {
      console.error('[EmergencyVideo] Missing socket or patientEmail');
      return;
    }

    if (peerConnection) {
      console.log('[EmergencyVideo] Connection already exists');
      return;
    }

    console.log('[EmergencyVideo] Requesting video for patient:', patientEmail);
    setIsConnecting(true);
    setError(null);

    try {
      // Get local media first
      const stream = await getLocalStream();

      // Create peer connection with tracks
      const pc = createPeerConnection(stream);
      setPeerConnection(pc);

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('[EmergencyVideo] Sending offer to Pi');
      socket.emit('activateVideoFeed', {
        callId,
        patientEmail,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });
    } catch (err) {
      console.error('[EmergencyVideo] Error requesting video:', err);
      setError(err instanceof Error ? err.message : 'Failed to start video');
      setIsConnecting(false);
    }
  };

  // Set remote stream to video element when both are ready
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('[EmergencyVideo] Setting remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isConnected]); // Re-run when isConnected changes (video element mounts)

  // Set local stream to video element when both are ready
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      console.log('[EmergencyVideo] Setting local stream to video element');
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isConnected]); // Re-run when isConnected changes (video element mounts)

  // Handle answer from Pi
  useEffect(() => {
    if (!socket) return;

    const handleAnswer = async (data: { callId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[EmergencyVideo] Received answer from Pi');

      // Use ref to avoid stale closure issues
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.warn('[EmergencyVideo] No peer connection for answer');
        return;
      }

      if (pc.signalingState !== 'have-local-offer') {
        console.warn('[EmergencyVideo] Wrong state for answer:', pc.signalingState);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('[EmergencyVideo] Remote description set');
      } catch (err) {
        console.error('[EmergencyVideo] Error setting remote description:', err);
        setError('Failed to connect');
      }
    };

    const handleIceCandidate = async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('[EmergencyVideo] Added ICE candidate');
      } catch (err) {
        console.error('[EmergencyVideo] Error adding ICE candidate:', err);
      }
    };

    const handleDisconnected = (_data: { callId: string }) => {
      console.log('[EmergencyVideo] Pi disconnected video');
      cleanup();
    };

    const handleError = (data: { error: string }) => {
      console.error('[EmergencyVideo] Error:', data.error);
      setError(data.error);
      setIsConnecting(false);
    };

    socket.on('videoFeedAnswer', handleAnswer);
    socket.on('videoFeedIceCandidate', handleIceCandidate);
    socket.on('videoFeedDisconnected', handleDisconnected);
    socket.on('videoFeedError', handleError);

    return () => {
      socket.off('videoFeedAnswer', handleAnswer);
      socket.off('videoFeedIceCandidate', handleIceCandidate);
      socket.off('videoFeedDisconnected', handleDisconnected);
      socket.off('videoFeedError', handleError);
    };
  }, [socket]); // Using refs for peer connection, so no need to re-register on state changes

  // Cleanup
  const cleanup = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setPeerConnection(null);
    setRemoteStream(null);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIsConnecting(false);
    setIsConnected(false);
    setError(null);
  };

  // Disconnect video
  const disconnectVideo = () => {
    if (socket && patientEmail) {
      socket.emit('videoFeedDisconnected', { callId, patientEmail });
    }
    cleanup();
  };

  // Cleanup on callId change or unmount
  useEffect(() => {
    if (!callId) {
      cleanup();
    }
    return () => cleanup();
  }, [callId]);

  return {
    localVideoRef,
    remoteVideoRef,
    isConnecting,
    isConnected,
    error,
    requestVideo,
    disconnectVideo,
  };
};
