import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay: React.FC<{ label?: string; fullscreen?: boolean }>=({ label='Loading', fullscreen=false })=>{
  return (
    <div className={fullscreen? 'loading-overlay fullscreen':'loading-overlay'} role="status" aria-live="polite">
      <div className="spinner">
        <div/><div/><div/><div/>
      </div>
      <div className="loading-text">{label}…</div>
    </div>
  );
};

export default LoadingOverlay;
