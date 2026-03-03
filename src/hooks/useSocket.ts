/**
 * Socket.IO Hook
 * Manages real-time communication with the backend
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { socketConfig } from '../config/api';
import type { EmergencyConnectionData } from '../types';

export interface DeviceStatusChangeData {
  deviceId: string;
  status: 'active' | 'inactive';
  deviceName?: string;
}

export interface AlarmEscalationData {
  alarmId: number;
  deviceId: string;
  tier: number;
  retryCount: number;
  alarm: {
    id: number;
    type: string;
    code: string;
    receivedAt: string;
  };
  user: {
    name: string;
    address: string;
    phone: string;
  } | null;
  message: string;
  priority: 'high' | 'critical';
  timestamp: string;
}

interface UseSocketProps {
  agentUsername?: string;
  agentEmail?: string;
  onEmergencyConnection?: (data: EmergencyConnectionData) => void;
  onAgentStatusChange?: (data: { username: string; status: string }) => void;
  onDeviceStatusChange?: (data: DeviceStatusChangeData) => void;
  onAlarmEscalation?: (data: AlarmEscalationData) => void;
}

export const useSocket = ({
  agentUsername,
  agentEmail,
  onEmergencyConnection,
  onAgentStatusChange,
  onDeviceStatusChange,
  onAlarmEscalation,
}: UseSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use refs for callbacks to avoid reconnecting when they change
  const callbacksRef = useRef({
    onEmergencyConnection,
    onAgentStatusChange,
    onDeviceStatusChange,
    onAlarmEscalation,
  });

  // Keep refs up to date
  useEffect(() => {
    callbacksRef.current = {
      onEmergencyConnection,
      onAgentStatusChange,
      onDeviceStatusChange,
      onAlarmEscalation,
    };
  });

  useEffect(() => {
    const socket = io(socketConfig.url, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);

      // Register agent if username provided (for SIP/call routing)
      if (agentUsername) {
        socket.emit('registerAgent', agentUsername);
      }

      // Also register with email for video feed routing
      // This adds the agent to the users map so videoFeedOffer can be routed back
      if (agentEmail) {
        socket.emit('register', {
          email: agentEmail,
          deviceType: 'web',
        });
        console.log('Socket registered with email:', agentEmail);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('emergencyCallConnection', (data: EmergencyConnectionData) => {
      console.log('Emergency call connection:', data);
      callbacksRef.current.onEmergencyConnection?.(data);
    });

    socket.on('agentStatusChange', (data: { username: string; status: string }) => {
      callbacksRef.current.onAgentStatusChange?.(data);
    });

    socket.on('deviceStatusChange', (data: DeviceStatusChangeData) => {
      console.log('Device status change:', data);
      callbacksRef.current.onDeviceStatusChange?.(data);
    });

    socket.on('alarmEscalation', (data: AlarmEscalationData) => {
      console.log('Alarm escalation:', data);
      callbacksRef.current.onAlarmEscalation?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [agentUsername, agentEmail]);

  const registerAgent = useCallback((username: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('registerAgent', username);
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    registerAgent,
    emit,
  };
};
