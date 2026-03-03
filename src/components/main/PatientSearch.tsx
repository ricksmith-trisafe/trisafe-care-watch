import { useState, useCallback } from 'react';
import { Search, User, Phone, CreditCard, MapPin, Loader2, Mail, Home } from 'lucide-react';
import { useLazySearchPatientsQuery } from '../../services/patientApi';
import type { Patient } from '../../types';
import './PatientSearch.scss';

interface PatientSearchProps {
  onSelectPatient: (patient: Patient) => void;
}

// Helper to format patient name
const formatPatientName = (patient: Patient): string => {
  const name = patient.name?.[0];
  if (!name) return 'Unknown';
  const given = name.given?.join(' ') || '';
  const family = name.family || '';
  return `${given} ${family}`.trim() || 'Unknown';
};

// Helper to get phone number
const getPhoneNumber = (patient: Patient): string | null => {
  const phone = patient.telecom?.find((t) => t.system === 'phone');
  return phone?.value || null;
};

// Helper to get email
const getEmail = (patient: Patient): string | null => {
  const email = patient.telecom?.find((t) => t.system === 'email');
  return email?.value || null;
};

// Helper to get first line of address
const getAddressLine = (patient: Patient): string | null => {
  const addr = patient.address?.[0];
  if (!addr) return null;
  return addr.line?.[0] || null;
};

// Helper to get postcode
const getPostcode = (patient: Patient): string | null => {
  const addr = patient.address?.[0];
  return addr?.postalCode || null;
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

interface SearchFields {
  name: string;
  phone: string;
  nhsNumber: string;
  addressLine: string;
  postcode: string;
}

export const PatientSearch = ({ onSelectPatient }: PatientSearchProps) => {
  const [searchFields, setSearchFields] = useState<SearchFields>({
    name: '',
    phone: '',
    nhsNumber: '',
    addressLine: '',
    postcode: '',
  });
  const [searchPatients, { data, isLoading, isFetching }] = useLazySearchPatientsQuery();

  const hasAnySearchValue = Object.values(searchFields).some((v) => v.trim());

  const handleSearch = useCallback(() => {
    if (!hasAnySearchValue) return;

    const params: Record<string, string> = {};
    if (searchFields.name.trim()) params.name = searchFields.name.trim();
    if (searchFields.phone.trim()) params.phone = searchFields.phone.trim();
    if (searchFields.nhsNumber.trim()) params.nhsNumber = searchFields.nhsNumber.trim();
    if (searchFields.addressLine.trim()) params.addressLine = searchFields.addressLine.trim();
    if (searchFields.postcode.trim()) params.postcode = searchFields.postcode.trim();

    searchPatients(params);
  }, [searchFields, hasAnySearchValue, searchPatients]);

  const handleFieldChange = (field: keyof SearchFields, value: string) => {
    setSearchFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchFields({ name: '', phone: '', nhsNumber: '', addressLine: '', postcode: '' });
  };

  const results = data?.data || [];
  const hasSearched = data !== undefined;

  return (
    <div className="patient-search">
      <div className="patient-search__header">
        <Search size={20} />
        <h2>Patient Search</h2>
      </div>

      <div className="patient-search__form">
        <div className="patient-search__fields">
          <div className="patient-search__field">
            <label className="patient-search__label">
              <User size={14} />
              Name
            </label>
            <input
              type="text"
              className="patient-search__input"
              placeholder="Enter patient name..."
              value={searchFields.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="patient-search__field">
            <label className="patient-search__label">
              <Phone size={14} />
              Phone
            </label>
            <input
              type="text"
              className="patient-search__input"
              placeholder="Enter phone number..."
              value={searchFields.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="patient-search__field">
            <label className="patient-search__label">
              <CreditCard size={14} />
              NHS Number
            </label>
            <input
              type="text"
              className="patient-search__input"
              placeholder="Enter NHS number..."
              value={searchFields.nhsNumber}
              onChange={(e) => handleFieldChange('nhsNumber', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="patient-search__field">
            <label className="patient-search__label">
              <Home size={14} />
              Address
            </label>
            <input
              type="text"
              className="patient-search__input"
              placeholder="Enter street address..."
              value={searchFields.addressLine}
              onChange={(e) => handleFieldChange('addressLine', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="patient-search__field">
            <label className="patient-search__label">
              <MapPin size={14} />
              Postcode
            </label>
            <input
              type="text"
              className="patient-search__input"
              placeholder="Enter postcode..."
              value={searchFields.postcode}
              onChange={(e) => handleFieldChange('postcode', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="patient-search__actions">
          <button
            className="patient-search__clear"
            onClick={handleClear}
            disabled={!hasAnySearchValue}
          >
            Clear
          </button>
          <button
            className="patient-search__submit"
            onClick={handleSearch}
            disabled={!hasAnySearchValue || isLoading || isFetching}
          >
            {(isLoading || isFetching) ? <Loader2 size={18} className="spinning" /> : <Search size={18} />}
            Search
          </button>
        </div>
      </div>

      <div className="patient-search__results">
        {(isLoading || isFetching) && (
          <div className="patient-search__loading">
            <Loader2 size={24} className="spinning" />
            <span>Searching patients...</span>
          </div>
        )}

        {!isLoading && !isFetching && hasSearched && results.length === 0 && (
          <div className="patient-search__empty">
            <User size={32} />
            <p>No patients found</p>
            <span>Try a different search term or filter</span>
          </div>
        )}

        {!isLoading && !isFetching && results.length > 0 && (
          <>
            <div className="patient-search__results-header">
              <span>{results.length} patient{results.length !== 1 ? 's' : ''} found</span>
            </div>
            <div className="patient-search__results-list">
              {results.map((patient) => {
                const age = calculateAge(patient.birthDate);
                const phone = getPhoneNumber(patient);
                const email = getEmail(patient);
                const addressLine = getAddressLine(patient);
                const postcode = getPostcode(patient);

                return (
                  <button
                    key={patient._id}
                    className="patient-search__result-item"
                    onClick={() => onSelectPatient(patient)}
                  >
                    <div className="patient-search__result-avatar">
                      {patient.photo ? (
                        <img src={patient.photo} alt="" />
                      ) : (
                        <span>{formatPatientName(patient).charAt(0)}</span>
                      )}
                    </div>
                    <div className="patient-search__result-info">
                      <div className="patient-search__result-name">
                        {formatPatientName(patient)}
                        {age !== null && <span className="patient-search__result-age">Age {age}</span>}
                      </div>
                      <div className="patient-search__result-details">
                        {phone && (
                          <span className="patient-search__result-detail">
                            <Phone size={12} />
                            {phone}
                          </span>
                        )}
                        {email && (
                          <span className="patient-search__result-detail">
                            <Mail size={12} />
                            {email}
                          </span>
                        )}
                        {(addressLine || postcode) && (
                          <span className="patient-search__result-detail">
                            <MapPin size={12} />
                            {[addressLine, postcode].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="patient-search__result-id">
                      ID: {patient.id?.slice(-6) || patient._id?.slice(-6)}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {!hasSearched && !isLoading && !isFetching && (
          <div className="patient-search__placeholder">
            <Search size={48} />
            <h3>Search for a Patient</h3>
            <p>Enter a name, phone number, NHS number, address, or postcode to find a patient</p>
          </div>
        )}
      </div>
    </div>
  );
};
