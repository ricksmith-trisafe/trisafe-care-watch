import { useState, useCallback, useMemo } from 'react';
import type { Device } from '../types';
import type { DeviceStatusChangeData } from './useSocket';

export interface UseDevicesReturn {
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  updateDeviceStatus: (deviceId: string, status: 'active' | 'inactive') => void;
  upsertDevice: (device: Device) => void;
  handleDeviceStatusChange: (data: DeviceStatusChangeData) => void;
  addDeviceFromConnection: (deviceId: string, deviceName?: string) => void;
}

export const useDevices = (): UseDevicesReturn => {
  const [devices, setDevices] = useState<Device[]>([]);

  const updateDeviceStatus = useCallback((deviceId: string, status: 'active' | 'inactive') => {
    setDevices((prev) => {
      const existingIndex = prev.findIndex(d => d.id === deviceId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], status };
        return updated;
      }
      return prev;
    });
  }, []);

  const upsertDevice = useCallback((device: Device) => {
    setDevices((prev) => {
      const existingIndex = prev.findIndex(d => d.id === device.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = device;
        return updated;
      }
      return [...prev, device];
    });
  }, []);

  // Handler for socket device status change events
  const handleDeviceStatusChange = useCallback((data: DeviceStatusChangeData) => {
    console.log('Device status change received:', data);
    setDevices((prevDevices) => {
      const existingIndex = prevDevices.findIndex(d => d.id === data.deviceId);
      if (existingIndex >= 0) {
        // Update existing device status
        const updated = [...prevDevices];
        updated[existingIndex] = { ...updated[existingIndex], status: data.status };
        return updated;
      } else {
        // Add new device
        const newDevice: Device = {
          _id: data.deviceId,
          id: data.deviceId,
          resourceType: 'Device',
          status: data.status,
          deviceName: [{ name: data.deviceName || 'Unknown Device', type: 'user-friendly-name' }],
        };
        return [...prevDevices, newDevice];
      }
    });
  }, []);

  // Add device from emergency connection (sets to active status)
  const addDeviceFromConnection = useCallback((deviceId: string, deviceName?: string) => {
    setDevices((prevDevices) => {
      const existingIndex = prevDevices.findIndex(d => d.id === deviceId);
      if (existingIndex >= 0) {
        // Update existing device status to active
        const updated = [...prevDevices];
        updated[existingIndex] = { ...updated[existingIndex], status: 'active' };
        return updated;
      } else {
        // Add new device with active status
        const newDevice: Device = {
          _id: deviceId,
          id: deviceId,
          resourceType: 'Device',
          status: 'active',
          deviceName: [{ name: deviceName || 'Connected Device', type: 'user-friendly-name' }],
        };
        return [...prevDevices, newDevice];
      }
    });
  }, []);

  return useMemo(() => ({
    devices,
    setDevices,
    updateDeviceStatus,
    upsertDevice,
    handleDeviceStatusChange,
    addDeviceFromConnection,
  }), [devices, updateDeviceStatus, upsertDevice, handleDeviceStatusChange, addDeviceFromConnection]);
};
