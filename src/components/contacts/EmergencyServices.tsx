import { Ambulance, Shield, Flame } from 'lucide-react';
import './EmergencyServices.scss';

interface EmergencyServicesProps {
  onCall: (service: 'ambulance' | 'police' | 'fire') => void;
}

export const EmergencyServices = ({ onCall }: EmergencyServicesProps) => {
  return (
    <div className="emergency-services">
      <h4 className="emergency-services__title">Emergency Services</h4>

      <div className="emergency-services__buttons">
        <button
          className="emergency-services__btn emergency-services__btn--ambulance"
          onClick={() => onCall('ambulance')}
        >
          <Ambulance size={20} />
          <span>Ambulance</span>
          <span className="emergency-services__number">999</span>
        </button>

        <button
          className="emergency-services__btn emergency-services__btn--police"
          onClick={() => onCall('police')}
        >
          <Shield size={20} />
          <span>Police</span>
          <span className="emergency-services__number">999</span>
        </button>

        <button
          className="emergency-services__btn emergency-services__btn--fire"
          onClick={() => onCall('fire')}
        >
          <Flame size={20} />
          <span>Fire Service</span>
          <span className="emergency-services__number">999</span>
        </button>
      </div>
    </div>
  );
};
