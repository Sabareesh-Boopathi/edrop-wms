import React from 'react';
import QRCode from 'react-qr-code';
import './PrintableLabel.css';

interface PrintableLabelProps {
  qrCode: string;
  name: string;
}

export const PrintableLabel = React.forwardRef<HTMLDivElement, PrintableLabelProps>((props, ref) => {
  return (
    <div ref={ref} className="printable-label-container">
      <div className="printable-label">
        <div className="label-content">
          {props.qrCode && <QRCode value={props.qrCode} size={128} />}
          <p className="label-name">{props.name}</p>
        </div>
      </div>
    </div>
  );
});

PrintableLabel.displayName = 'PrintableLabel';
