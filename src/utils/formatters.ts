import { format, formatDistanceToNow } from 'date-fns';
import type { Patient, PatientName, Address } from '../types';

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatPatientName = (patient: Patient | null): string => {
  if (!patient || !patient.name || patient.name.length === 0) {
    return 'Unknown Patient';
  }

  const name = patient.name[0];
  return formatName(name);
};

export const formatName = (name: PatientName): string => {
  if (name.text) return name.text;

  const given = name.given?.join(' ') || '';
  const family = name.family || '';
  const prefix = name.prefix?.join(' ') || '';

  return [prefix, given, family].filter(Boolean).join(' ').trim() || 'Unknown';
};

export const formatPhone = (phone: string): string => {
  // UK phone number formatting
  if (phone.startsWith('+44')) {
    const number = phone.slice(3);
    if (number.length === 10) {
      return `+44 ${number.slice(0, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;
    }
  }
  return phone;
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'dd MMM yyyy');
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  } catch {
    return dateString;
  }
};

export const formatTimeAgo = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
};

export const formatAge = (birthDate: string | undefined): number | null => {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
};

export const getPatientInitials = (patient: Patient | null): string => {
  if (!patient || !patient.name || patient.name.length === 0) {
    return '?';
  }

  const name = patient.name[0];
  const firstInitial = name.given?.[0]?.[0] || '';
  const lastInitial = name.family?.[0] || '';

  return (firstInitial + lastInitial).toUpperCase() || '?';
};

export const getPatientIdentifier = (patient: Patient): string => {
  return patient._id?.slice(-4)?.toUpperCase() || patient.id?.slice(-4)?.toUpperCase() || '0000';
};

export const formatAddress = (address: Address | undefined): string => {
  if (!address) return '';

  // If text is provided, use it directly
  if (address.text) return address.text;

  // Build address from components
  const parts: string[] = [];

  if (address.line && address.line.length > 0) {
    parts.push(...address.line);
  }

  if (address.city) {
    parts.push(address.city);
  }

  if (address.postalCode) {
    parts.push(address.postalCode);
  }

  return parts.join(', ');
};

export const getPatientAddress = (patient: Patient | null): Address | undefined => {
  if (!patient || !patient.address || patient.address.length === 0) {
    return undefined;
  }
  // Prefer home address, otherwise use first available
  return patient.address.find(a => a.use === 'home') || patient.address[0];
};
