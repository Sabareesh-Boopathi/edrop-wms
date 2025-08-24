import React from 'react';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
};

const SectionHeader: React.FC<Props> = ({ title, subtitle, right, className }) => {
  return (
    <div className={`section-header ${className || ''}`.trim()}>
      <div>
  <h2>{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {right && <div className="section-actions">{right}</div>}
    </div>
  );
};

export default SectionHeader;
