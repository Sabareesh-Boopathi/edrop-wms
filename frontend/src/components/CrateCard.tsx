import React from 'react';
import QRCode from 'react-qr-code';
import { Edit, Trash2 } from 'lucide-react';
import './CrateCard.css';

interface CrateCardProps {
  crate: {
    id: string;
    name: string;
    qr_code: string;
    status: string;
    type: string;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const CrateCard: React.FC<CrateCardProps> = ({ crate, onEdit, onDelete }) => {
  // Map status to semantic class; colors handled in CSS via tokens
  const statusClass = (s: string) => {
    switch (s) {
      case 'active': return 'status-active';
      case 'in_use': return 'status-inuse';
      case 'reserved': return 'status-reserved';
      case 'damaged': return 'status-damaged';
      case 'inactive': return 'status-inactive';
      default: return 'status-unknown';
    }
  };

  return (
  <div className={`crate-card ${statusClass(crate.status)}`} data-status={crate.status}>
      <div className="crate-card-header">
        <h3 title="Server-generated based on System Configuration">{crate.name.toUpperCase()}</h3>
        <div className="crate-actions">
          <button onClick={() => onEdit(crate.id)} className="edit-btn"><Edit size={16} /></button>
          <button onClick={() => onDelete(crate.id)} className="delete-btn"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="crate-card-body">
        <div className="qr-code-container">
          <QRCode value={crate.qr_code || crate.name} size={80} level="L" />
        </div>
        <div className="crate-details">
          <p><strong>Type:</strong> {crate.type}</p>
          <p><strong>Status:</strong> <span className={`status-text ${statusClass(crate.status)}`}>{crate.status}</span></p>
        </div>
      </div>
    </div>
  );
};

export default CrateCard;
