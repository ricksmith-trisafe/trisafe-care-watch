// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  photo?: string;
  accountStatus: string;
  activeOrganization?: {
    id: string;
    name: string;
    slug?: string;
  };
  roles: UserRole[];
  isSuperAdmin: boolean;
  lastLoginAt?: string;
}

export interface UserRole {
  id: string;
  role: 'super_admin' | 'org_admin' | 'employee';
  permissions: string[];
  organization?: {
    id: string;
    name: string;
    slug?: string;
  };
  joinedAt?: string;
}

// Agent Types
export interface Agent {
  _id: string;
  name: string;
  sipUri: string;
  websocketUrl: string;
  username: string;
  password: string;
  extension: string;
  transport: string;
  domain: string;
  active: boolean;
  status: AgentStatus;
  port: number;
  type: 'agent';
  createdAt: string;
  updatedAt: string;
}

export type AgentStatus = 'AVAILABLE' | 'INCOMING' | 'OUTGOING' | 'HOLD' | 'AFTER_CALL' | 'INACTIVE';

// Patient Types
export interface PatientIdentifier {
  system?: string;
  value?: string;
}

export interface Patient {
  _id: string;
  id: string;
  resourceType: 'Patient';
  name: PatientName[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  telecom?: Telecom[];
  address?: Address[];
  photo?: string;
  active?: boolean;
  identifier?: PatientIdentifier[];
  medicalInfo?: MedicalInfo;
}

export interface PatientName {
  use?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  text?: string;
}

export interface Telecom {
  system: 'phone' | 'email' | 'fax' | 'pager' | 'url' | 'sms' | 'other';
  value: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface Address {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Contact Types
export interface RelatedPerson {
  _id: string;
  id: string;
  resourceType: 'RelatedPerson';
  patient: {
    reference: string;
  };
  name: PatientName[];
  telecom?: Telecom[];
  relationship?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
    text?: string;
  }[];
  address?: Address[];
}

// Device Types
export interface Device {
  _id: string;
  id: string;
  resourceType: 'Device';
  status: 'active' | 'inactive' | 'entered-in-error' | 'unknown';
  deviceName?: {
    name: string;
    type: string;
  }[];
  type?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
    text?: string;
  };
  patient?: {
    reference: string;
  };
}

// Vitals Types
export interface Vitals {
  heartRate?: number;
  bloodOxygen?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  timestamp?: string;
}

export interface VitalsHistory {
  timestamp: string;
  systolic: number;
  diastolic: number;
}

export interface SleepSummary {
  score: number | null;
  duration: number | null;   // total seconds
  heartRate: number | null;
  date: string | null;
}

export interface ActivitySummary {
  steps: number | null;
  calories: number | null;
  date: string | null;
}

export interface EcgSummary {
  classification: string | null;
  heartRate: number | null;
  date: string | null;
}

// Call Types
export interface CallNote {
  id: string;
  author: string;
  practitionerId?: string;  // ID of the practitioner who created the note
  patientId?: string;       // ID of the patient this note is about
  callId?: string;          // Optional FHIR Communication ID if created during a call
  timestamp: string;
  content: string;
  callType?: 'Current Call' | 'Routine Check' | 'Emergency';
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  distanceFromHome?: string;
}

// Emergency Connection Data
export interface EmergencyConnectionData {
  customer: {
    type: 'inbound-phone' | 'sip' | 'web';
    callerIdNum?: string;
    callerIdName?: string;
    callerEmail?: string;
    username?: string;
    channel?: string;
    deviceId?: string;
    // Telecare device info (BS 8521-2 devices)
    telecareDevice?: {
      deviceId: string;
      patientId?: string;  // Links to FHIR Patient resource
    };
  };
  agent: {
    username: string;
    _id: string;
  };
  callId?: string;
}

// Medical Information (Legacy - use FHIR resources instead)
/** @deprecated Use ClinicalSummary with separate FHIR resources instead */
export interface MedicalInfo {
  bloodType?: string;
  nhsNumber?: string;
  gpPractice?: string;
  gpPhone?: string;
  medications?: string[];
  allergies?: string[];
  conditions?: string[];
}

// Quick Reference
export interface QuickReference {
  carePlanId?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  mobility?: string;
  dnrStatus?: boolean;
}

// ========== FHIR R4 Types ==========

// FHIR CodeableConcept
export interface CodeableConcept {
  coding?: {
    system?: string;
    code?: string;
    display?: string;
  }[];
  text?: string;
}

// FHIR Reference
export interface FhirReference {
  reference?: string;
  display?: string;
}

// FHIR Period
export interface FhirPeriod {
  start?: string;
  end?: string;
}

// FHIR Annotation (Note)
export interface FhirAnnotation {
  authorReference?: FhirReference;
  authorString?: string;
  time?: string;
  text?: string;
}

// AllergyIntolerance Resource (FHIR R4)
export interface AllergyIntolerance {
  _id: string;
  id: string;
  resourceType: 'AllergyIntolerance';
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  type?: 'allergy' | 'intolerance';
  category?: ('food' | 'medication' | 'environment' | 'biologic')[];
  criticality?: 'low' | 'high' | 'unable-to-assess';
  code: CodeableConcept;
  patient: FhirReference;
  onsetDateTime?: string;
  onsetString?: string;
  recordedDate?: string;
  recorder?: FhirReference;
  asserter?: FhirReference;
  lastOccurrence?: string;
  note?: FhirAnnotation[];
  reaction?: {
    substance?: CodeableConcept;
    manifestation?: CodeableConcept[];
    severity?: 'mild' | 'moderate' | 'severe';
    onset?: string;
  }[];
}

// Condition Resource (FHIR R4)
export interface Condition {
  _id: string;
  id: string;
  resourceType: 'Condition';
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject: FhirReference;
  encounter?: FhirReference;
  onsetDateTime?: string;
  onsetString?: string;
  abatementDateTime?: string;
  abatementString?: string;
  recordedDate?: string;
  recorder?: FhirReference;
  asserter?: FhirReference;
  note?: FhirAnnotation[];
}

// FHIR Dosage
export interface FhirDosage {
  sequence?: number;
  text?: string;
  additionalInstruction?: CodeableConcept[];
  patientInstruction?: string;
  timing?: {
    repeat?: {
      frequency?: number;
      period?: number;
      periodUnit?: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
    };
  };
  asNeededBoolean?: boolean;
  route?: CodeableConcept;
  method?: CodeableConcept;
  doseAndRate?: {
    type?: CodeableConcept;
    doseQuantity?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
  }[];
}

// MedicationStatement Resource (FHIR R4)
export interface MedicationStatement {
  _id: string;
  id: string;
  resourceType: 'MedicationStatement';
  status: 'active' | 'completed' | 'entered-in-error' | 'intended' | 'stopped' | 'on-hold' | 'unknown' | 'not-taken';
  statusReason?: CodeableConcept[];
  category?: CodeableConcept;
  medicationCodeableConcept: CodeableConcept;
  subject: FhirReference;
  context?: FhirReference;
  effectiveDateTime?: string;
  effectivePeriod?: FhirPeriod;
  dateAsserted?: string;
  informationSource?: FhirReference;
  reasonCode?: CodeableConcept[];
  reasonReference?: FhirReference[];
  note?: FhirAnnotation[];
  dosage?: FhirDosage[];
}

// Clinical Summary (bundled response from /patient/:id/clinical-summary)
export interface ClinicalSummary {
  patient: Patient;
  nhsNumber: string | null;
  allergies: AllergyIntolerance[];
  conditions: Condition[];
  medications: MedicationStatement[];
  contacts: RelatedPerson[];
  legacyMedicalInfo: MedicalInfo | null;
}
