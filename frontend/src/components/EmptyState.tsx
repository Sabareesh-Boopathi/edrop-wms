import React from 'react';
import { Button } from './ui/button';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionClassName?: string;
  actionIcon?: React.ReactNode; // new optional icon for the action button
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionLabel, onAction, actionClassName, actionIcon }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        {icon && <div className="empty-state-icon">{icon}</div>}
        <h2 className="empty-state-title">{title}</h2>
        {message && <p className="empty-state-message">{message}</p>}
        {onAction && actionLabel && (
          <div className="empty-state-button-wrapper">
            <Button onClick={onAction} className={`empty-state-action-btn ${actionClassName || ''}`.trim()}>
              {actionIcon}
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
