import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Maximize2 } from 'lucide-react';
import { Tile, TileEmptyState } from '../common';
import type { Patient } from '../../types';
import { formatAddress, getPatientAddress, formatPatientName } from '../../utils/formatters';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './PatientLocation.scss';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Coordinates {
  latitude: number;
  longitude: number;
}

// Component to update map view when coordinates change
const MapUpdater = ({ coordinates }: { coordinates: Coordinates }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([coordinates.latitude, coordinates.longitude], 15);
  }, [map, coordinates.latitude, coordinates.longitude]);

  return null;
};

// Component to enable scroll zoom only after clicking the map
const ScrollZoomHandler = () => {
  const map = useMap();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      if (!isActive) {
        map.scrollWheelZoom.enable();
        setIsActive(true);
      }
    };

    const handleMouseLeave = () => {
      map.scrollWheelZoom.disable();
      setIsActive(false);
    };

    map.on('click', handleClick);
    map.getContainer().addEventListener('mouseleave', handleMouseLeave);

    return () => {
      map.off('click', handleClick);
      map.getContainer().removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [map, isActive]);

  return null;
};

interface PatientLocationProps {
  patient: Patient | null;
}

export const PatientLocation = ({ patient }: PatientLocationProps) => {
  // Default coordinates for UK
  const defaultCoordinates: Coordinates = {
    latitude: 53.4808,
    longitude: -2.2426,
  };

  const [coordinates, setCoordinates] = useState<Coordinates>(defaultCoordinates);

  // Get patient address
  const patientAddress = getPatientAddress(patient);
  const addressText = formatAddress(patientAddress) || '42 Maple Street, Manchester, M20 4LJ';
  const patientName = formatPatientName(patient);

  // Geocode the address when it changes
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!addressText || !patient) {
        setCoordinates(defaultCoordinates);
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}&countrycodes=gb&limit=1`,
          {
            headers: {
              'User-Agent': 'CareWatch-ResponseCenter/1.0',
            },
          }
        );

        const data = await response.json();

        if (data && data.length > 0) {
          setCoordinates({
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          });
        } else {
          setCoordinates(defaultCoordinates);
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
        setCoordinates(defaultCoordinates);
      }
    };

    geocodeAddress();
  }, [addressText, patient]);

  const actions = patient
    ? [
        { label: 'GPS Active', variant: 'badge' as const, badgeColor: 'green' as const },
        { label: '', icon: Maximize2, onClick: () => console.log('Expand map') },
      ]
    : [];

  // Empty state when no patient is selected
  if (!patient) {
    return (
      <Tile title="Patient Location" icon={MapPin} className="patient-location">
        <TileEmptyState
          icon={MapPin}
          title="No active patient"
          description="Location will appear when a patient is selected"
        />
      </Tile>
    );
  }

  return (
    <Tile title="Patient Location" icon={MapPin} actions={actions} className="patient-location" noPadding>
      <div className="patient-location__map-container">
        <div className="patient-location__address-overlay">
          <MapPin size={14} />
          <div>
            <div className="patient-location__address-label">Current Location:</div>
            <div className="patient-location__address-text">{addressText}</div>
          </div>
        </div>

        <MapContainer
          center={[coordinates.latitude, coordinates.longitude]}
          zoom={15}
          className="patient-location__map"
          scrollWheelZoom={false}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater coordinates={coordinates} />
          <ScrollZoomHandler />
          <Marker position={[coordinates.latitude, coordinates.longitude]}>
            <Popup>
              {patientName}'s Location<br />
              {addressText}
            </Popup>
          </Marker>
        </MapContainer>

        <div className="patient-location__distance">
          Distance from home: 0.2 miles
        </div>
      </div>
    </Tile>
  );
};
