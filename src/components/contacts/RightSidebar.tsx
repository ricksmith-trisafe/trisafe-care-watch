import { useAppSelector } from '../../store/hooks';
import { ContactsList } from './ContactsList';
import { EmergencyServices } from './EmergencyServices';
import { QuickReference } from './QuickReference';
import type { QuickReference as QuickReferenceType } from '../../types';
import './RightSidebar.scss';

interface RightSidebarProps {
  quickReference: QuickReferenceType | null;
  onCallContact: (phone: string) => void;
  onCallEmergency: (service: 'ambulance' | 'police' | 'fire') => void;
}

export const RightSidebar = ({
  quickReference,
  onCallContact,
  onCallEmergency,
}: RightSidebarProps) => {
  const currentPatient = useAppSelector((state) => state.patient.currentPatient);
  const patientId = currentPatient?._id;
  const clinicalSummary = useAppSelector((state) =>
    patientId ? state.clinical.summaryCache[patientId] : undefined
  );
  const contacts = clinicalSummary?.contacts || [];

  return (
    <aside className="right-sidebar">
      <ContactsList
        title="Personal Contacts"
        contacts={contacts}
        onCall={onCallContact}
        showAddButton
        hasActivePatient={!!patientId}
      />

      <EmergencyServices onCall={onCallEmergency} />

      <QuickReference data={quickReference} hasActivePatient={!!patientId} />
    </aside>
  );
};
