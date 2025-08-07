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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#52c41a';
      case 'in_use':
        return '#1890ff';
      case 'reserved':
        return '#faad14';
      case 'damaged':
        return '#f5222d';
      default:
        return '#d9d9d9';
    }
  };

  return (
    <div className="crate-card" style={{ borderTop: `5px solid ${getStatusColor(crate.status)}` }}>
      <div className="crate-card-header">
        <h3>{crate.name.toUpperCase()}</h3>
        <div className="crate-actions">
          <button onClick={() => onEdit(crate.id)} className="edit-btn"><Edit size={16} /></button>
          <button onClick={() => onDelete(crate.id)} className="delete-btn"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="crate-card-body">
        <div className="qr-code-container">
          <QRCode value={crate.name} size={80} level="L" />
        </div>
        <div className="crate-details">
          <p><strong>Type:</strong> {crate.type}</p>
          <p><strong>Status:</strong> <span className="status-text" style={{ color: getStatusColor(crate.status) }}>{crate.status}</span></p>
        </div>
      </div>
    </div>
  );
};

export default CrateCard;
