import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Patient } from '../../types';
import './PatientDetailsModal.scss';

export interface PatientDetailsFormData {
  givenName: string;
  familyName: string;
  prefix: string;
  birthDate: string;
  gender: string;
  phones: { value: string; use: string }[];
  email: string;
  addressLines: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PatientDetailsFormData) => void;
  patient: Patient;
  isLoading?: boolean;
}

const GENDER_OPTIONS = ['male', 'female', 'other', 'unknown'];
const PHONE_USE_OPTIONS = ['mobile', 'home', 'work'];

const extractPatientData = (patient: Patient): PatientDetailsFormData => {
  const name = patient.name?.[0];
  const address = patient.address?.[0];
  const phones = (patient.telecom || [])
    .filter((t) => t.system === 'phone')
    .map((t) => ({ value: t.value || '', use: t.use || 'mobile' }));
  const email = patient.telecom?.find((t) => t.system === 'email')?.value || '';

  return {
    givenName: name?.given?.join(' ') || '',
    familyName: name?.family || '',
    prefix: name?.prefix?.join(' ') || '',
    birthDate: patient.birthDate || '',
    gender: patient.gender || '',
    phones: phones.length > 0 ? phones : [{ value: '', use: 'mobile' }],
    email,
    addressLines: address?.line || [''],
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || '',
  };
};

export const PatientDetailsModal = ({
  isOpen,
  onClose,
  onSave,
  patient,
  isLoading = false,
}: PatientDetailsModalProps) => {
  const [formData, setFormData] = useState<PatientDetailsFormData>(extractPatientData(patient));

  useEffect(() => {
    if (isOpen) {
      setFormData(extractPatientData(patient));
    }
  }, [isOpen, patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addPhone = () => {
    setFormData((prev) => ({
      ...prev,
      phones: [...prev.phones, { value: '', use: 'mobile' }],
    }));
  };

  const removePhone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index),
    }));
  };

  const updatePhone = (index: number, field: 'value' | 'use', value: string) => {
    setFormData((prev) => ({
      ...prev,
      phones: prev.phones.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const addAddressLine = () => {
    setFormData((prev) => ({
      ...prev,
      addressLines: [...prev.addressLines, ''],
    }));
  };

  const removeAddressLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      addressLines: prev.addressLines.filter((_, i) => i !== index),
    }));
  };

  const updateAddressLine = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      addressLines: prev.addressLines.map((line, i) => (i === index ? value : line)),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="patient-modal__overlay" onClick={onClose}>
      <div className="patient-modal" onClick={(e) => e.stopPropagation()}>
        <div className="patient-modal__header">
          <h2>Edit Patient Details</h2>
          <button className="patient-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="patient-modal__form">
          {/* Name Section */}
          <div className="patient-modal__section">
            <label className="patient-modal__section-title">Name</label>
            <div className="patient-modal__grid patient-modal__grid--3col">
              <div className="patient-modal__field">
                <label>Prefix</label>
                <input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) => setFormData((prev) => ({ ...prev, prefix: e.target.value }))}
                  placeholder="Mr, Mrs, Dr..."
                />
              </div>
              <div className="patient-modal__field">
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.givenName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, givenName: e.target.value }))}
                  placeholder="First name..."
                />
              </div>
              <div className="patient-modal__field">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.familyName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, familyName: e.target.value }))}
                  placeholder="Last name..."
                />
              </div>
            </div>
          </div>

          {/* Demographics Section */}
          <div className="patient-modal__section">
            <label className="patient-modal__section-title">Demographics</label>
            <div className="patient-modal__grid">
              <div className="patient-modal__field">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                />
              </div>
              <div className="patient-modal__field">
                <label>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="">Select gender...</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="patient-modal__section">
            <label className="patient-modal__section-title">Contact Information</label>

            <div className="patient-modal__subsection">
              <label>Phone Numbers</label>
              {formData.phones.map((phone, index) => (
                <div key={index} className="patient-modal__phone-row">
                  <select
                    value={phone.use}
                    onChange={(e) => updatePhone(index, 'use', e.target.value)}
                  >
                    {PHONE_USE_OPTIONS.map((use) => (
                      <option key={use} value={use}>
                        {use.charAt(0).toUpperCase() + use.slice(1)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone.value}
                    onChange={(e) => updatePhone(index, 'value', e.target.value)}
                    placeholder="Phone number..."
                  />
                  {formData.phones.length > 1 && (
                    <button type="button" className="patient-modal__remove-btn" onClick={() => removePhone(index)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="patient-modal__add-btn" onClick={addPhone}>
                <Plus size={14} /> Add Phone
              </button>
            </div>

            <div className="patient-modal__field patient-modal__field--full">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email address..."
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="patient-modal__section">
            <label className="patient-modal__section-title">Address</label>

            <div className="patient-modal__subsection">
              <label>Street Address</label>
              {formData.addressLines.map((line, index) => (
                <div key={index} className="patient-modal__address-row">
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => updateAddressLine(index, e.target.value)}
                    placeholder={index === 0 ? 'Street address...' : 'Address line 2...'}
                  />
                  {formData.addressLines.length > 1 && (
                    <button
                      type="button"
                      className="patient-modal__remove-btn"
                      onClick={() => removeAddressLine(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="patient-modal__add-btn" onClick={addAddressLine}>
                <Plus size={14} /> Add Line
              </button>
            </div>

            <div className="patient-modal__grid">
              <div className="patient-modal__field">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City..."
                />
              </div>
              <div className="patient-modal__field">
                <label>County/State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="County or state..."
                />
              </div>
              <div className="patient-modal__field">
                <label>Postcode</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="Postcode..."
                />
              </div>
              <div className="patient-modal__field">
                <label>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="Country..."
                />
              </div>
            </div>
          </div>

          <div className="patient-modal__actions">
            <button type="button" className="patient-modal__btn patient-modal__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="patient-modal__btn patient-modal__btn--save" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
