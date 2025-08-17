import React from 'react';
import { Receipt } from '../../types/inbound';
import '../../pages/inbound/Inbound.css';

const textMap: Record<Receipt['status'], string> = {
  AWAITING_UNLOADING: 'Awaiting',
  UNLOADING: 'Unloading',
  MOVED_TO_BAY: 'At Bay',
  ALLOCATED: 'Allocated',
  READY_FOR_PICKING: 'Ready',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled'
};

export const StatusChip: React.FC<{ status: Receipt['status']; compact?: boolean }> = ({ status, compact }) => (
  <span className={`status-chip status-chip--${status}${compact ? ' status-chip--compact' : ''}`}>{textMap[status]}</span>
);
