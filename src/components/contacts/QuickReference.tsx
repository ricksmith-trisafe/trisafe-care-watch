import { FileText } from 'lucide-react';
import type { QuickReference as QuickReferenceType } from '../../types';
import './QuickReference.scss';

interface QuickReferenceProps {
  data: QuickReferenceType | null;
  hasActivePatient?: boolean;
}

export const QuickReference = ({ data, hasActivePatient = true }: QuickReferenceProps) => {
  // Empty state when no patient is active
  if (!hasActivePatient) {
    return (
      <div className="quick-reference quick-reference--empty">
        <h4 className="quick-reference__title">Quick Reference</h4>
        <div className="quick-reference__empty-state">
          <FileText size={16} />
          <span>No patient selected</span>
        </div>
      </div>
    );
  }

  // Default data for demo
  const reference: QuickReferenceType = data || {
    carePlanId: 'CP-2024-4521',
    riskLevel: 'Medium',
    mobility: 'Walking Frame',
    dnrStatus: false,
  };

  const getRiskLevelClass = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  };

  return (
    <div className="quick-reference">
      <h4 className="quick-reference__title">Quick Reference</h4>

      <div className="quick-reference__items">
        <div className="quick-reference__item">
          <span className="quick-reference__label">Care Plan ID:</span>
          <span className="quick-reference__value">{reference.carePlanId || 'N/A'}</span>
        </div>
        <div className="quick-reference__item">
          <span className="quick-reference__label">Risk Level:</span>
          <span className={`quick-reference__value quick-reference__value--risk ${getRiskLevelClass(reference.riskLevel)}`}>
            {reference.riskLevel || 'N/A'}
          </span>
        </div>
        <div className="quick-reference__item">
          <span className="quick-reference__label">Mobility:</span>
          <span className="quick-reference__value">{reference.mobility || 'N/A'}</span>
        </div>
        <div className="quick-reference__item">
          <span className="quick-reference__label">DNR Status:</span>
          <span className="quick-reference__value">
            {reference.dnrStatus === true ? 'Yes' : reference.dnrStatus === false ? 'No' : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
