import { User, Phone, Mail, MapPin, Calendar, Heart, Pencil } from 'lucide-react';
import { Tile } from '../common';
import type { Patient } from '../../types';
import './PatientDetails.scss';

interface PatientDetailsProps {
  patient: Patient;
  onEdit?: () => void;
}

// Helper to format patient name
const formatPatientName = (patient: Patient): string => {
  const name = patient.name?.[0];
  if (!name) return 'Unknown';
  const prefix = name.prefix?.join(' ') || '';
  const given = name.given?.join(' ') || '';
  const family = name.family || '';
  return [prefix, given, family].filter(Boolean).join(' ').trim() || 'Unknown';
};

// Helper to format date of birth
const formatDateOfBirth = (birthDate?: string): string | null => {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Helper to calculate age
const calculateAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Helper to format gender
const formatGender = (gender?: string): string | null => {
  if (!gender) return null;
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

// Helper to get phone numbers
const getPhoneNumbers = (patient: Patient): { value: string; use?: string }[] => {
  return (patient.telecom || [])
    .filter((t) => t.system === 'phone')
    .map((t) => ({ value: t.value, use: t.use }));
};

// Helper to get email
const getEmail = (patient: Patient): string | null => {
  const email = patient.telecom?.find((t) => t.system === 'email');
  return email?.value || null;
};

// Helper to format address
const formatAddress = (patient: Patient): string[] | null => {
  const addr = patient.address?.[0];
  if (!addr) return null;

  const lines: string[] = [];
  if (addr.line) {
    lines.push(...addr.line);
  }
  if (addr.city) {
    lines.push(addr.city);
  }
  if (addr.state) {
    lines.push(addr.state);
  }
  if (addr.postalCode) {
    lines.push(addr.postalCode);
  }
  if (addr.country) {
    lines.push(addr.country);
  }

  return lines.length > 0 ? lines : null;
};

export const PatientDetails = ({ patient, onEdit }: PatientDetailsProps) => {
  const name = formatPatientName(patient);
  const dob = formatDateOfBirth(patient.birthDate);
  const age = calculateAge(patient.birthDate);
  const gender = formatGender(patient.gender);
  const phones = getPhoneNumbers(patient);
  const email = getEmail(patient);
  const addressLines = formatAddress(patient);

  const actions = onEdit ? [{ label: 'Edit', icon: Pencil, onClick: onEdit }] : [];

  return (
    <Tile title="Patient Details" icon={User} actions={actions} className="patient-details">
      <div className="patient-details__section">
        <div className="patient-details__row">
          <span className="patient-details__label">Name</span>
          <span className="patient-details__value patient-details__value--name">{name}</span>
        </div>

        {(dob || age !== null) && (
          <div className="patient-details__row">
            <span className="patient-details__label">
              <Calendar size={14} />
              Date of Birth
            </span>
            <span className="patient-details__value">
              {dob}
              {age !== null && <span className="patient-details__age">({age} years old)</span>}
            </span>
          </div>
        )}

        {gender && (
          <div className="patient-details__row">
            <span className="patient-details__label">
              <Heart size={14} />
              Gender
            </span>
            <span className="patient-details__value">{gender}</span>
          </div>
        )}
      </div>

      <div className="patient-details__divider" />

      <div className="patient-details__section">
        <div className="patient-details__section-title">Contact Information</div>

        {phones.length > 0 ? (
          phones.map((phone, index) => (
            <div className="patient-details__row" key={index}>
              <span className="patient-details__label">
                <Phone size={14} />
                Phone {phone.use && `(${phone.use})`}
              </span>
              <a href={`tel:${phone.value}`} className="patient-details__value patient-details__value--link">
                {phone.value}
              </a>
            </div>
          ))
        ) : (
          <div className="patient-details__row patient-details__row--empty">
            <span className="patient-details__label">
              <Phone size={14} />
              Phone
            </span>
            <span className="patient-details__value patient-details__value--empty">Not provided</span>
          </div>
        )}

        <div className="patient-details__row">
          <span className="patient-details__label">
            <Mail size={14} />
            Email
          </span>
          {email ? (
            <a href={`mailto:${email}`} className="patient-details__value patient-details__value--link">
              {email}
            </a>
          ) : (
            <span className="patient-details__value patient-details__value--empty">Not provided</span>
          )}
        </div>
      </div>

      <div className="patient-details__divider" />

      <div className="patient-details__section">
        <div className="patient-details__row patient-details__row--address">
          <span className="patient-details__label">
            <MapPin size={14} />
            Address
          </span>
          {addressLines ? (
            <div className="patient-details__address">
              {addressLines.map((line, index) => (
                <span key={index}>{line}</span>
              ))}
            </div>
          ) : (
            <span className="patient-details__value patient-details__value--empty">Not provided</span>
          )}
        </div>
      </div>
    </Tile>
  );
};
