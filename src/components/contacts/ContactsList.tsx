import { Phone, Plus, User } from 'lucide-react';
import type { RelatedPerson } from '../../types';
import { formatName, formatPhone } from '../../utils/formatters';
import './ContactsList.scss';

interface Contact {
  id: string;
  name: string;
  relationship?: string;
  phone?: string;
  available?: boolean;
  schedule?: string;
}

interface ContactsListProps {
  title: string;
  contacts: RelatedPerson[];
  onCall: (phone: string) => void;
  showAddButton?: boolean;
  hasActivePatient?: boolean;
}

export const ContactsList = ({ title, contacts, onCall, showAddButton, hasActivePatient = true }: ContactsListProps) => {
  // Transform RelatedPerson to display format
  const displayContacts: Contact[] = contacts.map((contact) => ({
    id: contact._id,
    name: contact.name?.[0] ? formatName(contact.name[0]) : 'Unknown',
    relationship: contact.relationship?.[0]?.text || contact.relationship?.[0]?.coding?.[0]?.display,
    phone: contact.telecom?.find((t) => t.system === 'phone')?.value,
    available: true,
  }));

  // Empty state when no patient is active
  if (!hasActivePatient) {
    return (
      <div className="contacts-list contacts-list--empty">
        <div className="contacts-list__header">
          <h4 className="contacts-list__title">{title}</h4>
        </div>
        <div className="contacts-list__empty-state">
          <User size={16} />
          <span>No patient selected</span>
        </div>
      </div>
    );
  }

  if (hasActivePatient && displayContacts.length === 0) {
    return (
      <div className="contacts-list contacts-list--empty">
        <div className="contacts-list__header">
          <h4 className="contacts-list__title">{title}</h4>
        </div>
        <div className="contacts-list__empty-state">
          <User size={16} />
          <span>No contacts found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="contacts-list">
      <div className="contacts-list__header">
        <h4 className="contacts-list__title">{title}</h4>
        {showAddButton && (
          <button className="contacts-list__add">
            <Plus size={14} />
          </button>
        )}
      </div>

      <div className="contacts-list__items">
        {displayContacts.map((contact) => (
          <div key={contact.id} className="contacts-list__item">
            <div className={`contacts-list__avatar ${contact.available ? 'available' : ''}`}>
              <User size={16} />
              {contact.available !== undefined && (
                <span className={`contacts-list__status ${contact.available ? 'online' : 'offline'}`} />
              )}
            </div>
            <div className="contacts-list__info">
              <span className="contacts-list__name">{contact.name}</span>
              <span className="contacts-list__relationship">
                {contact.relationship || 'Contact'}
              </span>
              {contact.phone && (
                <span className="contacts-list__phone">{formatPhone(contact.phone)}</span>
              )}
              {contact.schedule && (
                <span className="contacts-list__schedule">{contact.schedule}</span>
              )}
            </div>
            {contact.phone && (
              <button
                className="contacts-list__call"
                onClick={() => onCall(contact.phone!)}
              >
                <Phone size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

