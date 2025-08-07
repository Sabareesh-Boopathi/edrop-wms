import React from 'react';
import { Button } from './ui/button';
import { Crate } from '../types';

interface BulkCrateListProps {
  crates: Crate[];
  onPrint: () => void;
}

const BulkCrateList: React.FC<BulkCrateListProps> = ({ crates, onPrint }) => {
  return (
    <div className="bulk-crate-list">
      <h2>Bulk Crate Creation Summary</h2>
      <p>{crates.length} crates have been created successfully.</p>
      <Button onClick={onPrint}>Print All QR Labels</Button>
      <div className="crate-summary-list">
        {crates.map(crate => (
          <div key={crate.id} className="crate-summary-item">
            <span>{crate.name}</span>
            <span>{crate.qr_code}</span>
            <span>{crate.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkCrateList;
