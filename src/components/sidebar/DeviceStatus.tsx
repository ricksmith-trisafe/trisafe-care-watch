import { Watch, Smartphone, Home, Wifi } from 'lucide-react';
import type { Device } from '../../types';
import './DeviceStatus.scss';

interface DeviceStatusProps {
  devices: Device[];
  isOnCall: boolean;
}

const getDeviceIcon = (type: string | undefined) => {
  switch (type?.toLowerCase()) {
    case 'smartwatch':
    case 'watch':
      return Watch;
    case 'pendant':
    case 'smart pendant':
      return Smartphone;
    case 'home assistant':
    case 'home':
      return Home;
    default:
      return Smartphone;
  }
};

export const DeviceStatus = ({ devices, isOnCall }: DeviceStatusProps) => {
  // Show empty state when no call
  if (!isOnCall) {
    return (
      <div className="device-status device-status--empty">
        <span className="device-status__label">Device Status</span>
        <div className="device-status__empty">
          <Wifi size={16} />
          <span>No active patient</span>
        </div>
      </div>
    );
  }

  // Default devices if none provided
  const displayDevices = devices.length > 0 ? devices : [
    { _id: '1', id: '1', resourceType: 'Device' as const, status: 'inactive' as const, deviceName: [{ name: 'Smartwatch', type: 'user-friendly-name' }] },
    { _id: '2', id: '2', resourceType: 'Device' as const, status: 'active' as const, deviceName: [{ name: 'Smart Pendant', type: 'user-friendly-name' }] },
    { _id: '3', id: '3', resourceType: 'Device' as const, status: 'active' as const, deviceName: [{ name: 'Home Assistant', type: 'user-friendly-name' }] },
  ];

  return (
    <div className="device-status">
      <span className="device-status__label">Device Status</span>

      <div className="device-status__list">
        {displayDevices.map((device) => {
          const Icon = getDeviceIcon(device.deviceName?.[0]?.name);
          const isOnline = device.status === 'active';

          return (
            <div key={device._id} className="device-status__item">
              <Icon size={16} className="device-status__icon" />
              <span className="device-status__name">
                {device.deviceName?.[0]?.name || 'Unknown Device'}
              </span>
              <span className={`device-status__badge ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
