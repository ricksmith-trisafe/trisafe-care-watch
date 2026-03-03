import { Plus, MessageSquare, StickyNote } from 'lucide-react';
import { Tile, TileEmptyState } from '../common';
import type { CallNote } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';
import './CallNotes.scss';

interface CallNotesProps {
  notes: CallNote[];
  noteInput: string;
  onNoteInputChange: (value: string) => void;
  onAddNote: () => void;
  hasActivePatient?: boolean;
}

export const CallNotes = ({ notes, noteInput, onNoteInputChange, onAddNote, hasActivePatient = true }: CallNotesProps) => {

  const getCallTypeBadgeClass = (callType?: string) => {
    switch (callType) {
      case 'Current Call':
        return 'current';
      case 'Emergency':
        return 'emergency';
      default:
        return 'routine';
    }
  };

  // Empty state when no patient is active
  if (!hasActivePatient) {
    return (
      <Tile title="Call Notes & History" icon={StickyNote}>
        <TileEmptyState
          icon={MessageSquare}
          title="No active patient"
          description="Call notes will appear when a patient is selected"
        />
      </Tile>
    );
  }

  return (
    <Tile
      title="Call Notes & History"
      icon={StickyNote}
      actions={[
        { label: 'Add Note', icon: Plus, onClick: onAddNote },
      ]}
    >
      <div className="call-notes__input-container">
        <textarea
          className="call-notes__input"
          placeholder="Type your notes here..."
          value={noteInput}
          onChange={(e) => onNoteInputChange(e.target.value)}
          rows={2}
        />
      </div>

      <div className="call-notes__list">
        {notes.map((note) => (
          <div key={note.id} className="call-notes__item">
            <div className="call-notes__item-icon">
              <MessageSquare size={16} />
            </div>
            <div className="call-notes__item-content">
              <div className="call-notes__item-header">
                <span className="call-notes__item-author">{note.author}</span>
                <span className="call-notes__item-time">
                  {note.timestamp.includes('T') ? formatTimeAgo(note.timestamp) : note.timestamp}
                </span>
              </div>
              <p className="call-notes__item-text">{note.content}</p>
            </div>
            {note.callType && (
              <span className={`call-notes__item-badge ${getCallTypeBadgeClass(note.callType)}`}>
                {note.callType}
              </span>
            )}
          </div>
        ))}
      </div>
    </Tile>
  );
};
