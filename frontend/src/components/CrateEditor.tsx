import React, { useState, ChangeEvent, useMemo, useRef, useEffect } from 'react';
// Utility to print a specific DOM node
function printElement(element: HTMLElement) {
  const printWindow = window.open('', '', 'width=400,height=600');
  if (!printWindow) return;
  printWindow.document.write('<html><head><title>Print Label</title>');
  // Optionally add styles for print
  printWindow.document.write('<style>body{margin:0;} .label-overlay{margin:40px auto;box-shadow:none;transform:none;position:relative;left:0;bottom:0;}</style>');
  printWindow.document.write('</head><body>');
  printWindow.document.write(element.outerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 200);
}
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from './ui/dropdown-menu';
import { Minus, Plus, Printer, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import './CrateEditor.css';
import crateImage from '../assets/crate.png';
import { Crate, Warehouse, BulkCrate, CrateStatus, CrateType, CRATE_STATUSES, CRATE_TYPES } from '../types';
import { useConfig } from '../contexts/ConfigContext';
import { getWarehouseConfig } from '../services/configService';

interface CrateEditorProps {
  warehouses: Warehouse[];
  onSave: (data: { name: string; warehouse_id: string; count: number; type?: CrateType; status?: CrateStatus; }) => void;
  onCancel: () => void;
  crate: Crate | null;
  bulkCrates?: BulkCrate[];
  onPrintAll?: () => void;
}

const CrateEditor: React.FC<CrateEditorProps> = ({ 
    warehouses, 
    onSave, 
    onCancel, 
    crate,
    bulkCrates = [],
    onPrintAll
}) => {
  const { config } = useConfig();
  const defaultType = (config.defaultCrateSize as CrateType) || 'standard';
  const defaultStatus: CrateStatus = (config.defaultCrateStatus as CrateStatus) || 'inactive';

  const [warehouseId, setWarehouseId] = useState(crate ? crate.warehouse_id : '');
  const [name, setName] = useState(crate ? crate.name : 'Auto-generated');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [status, setStatus] = useState<CrateStatus>(crate ? crate.status : defaultStatus);
  const [type, setType] = useState<CrateType>(crate ? crate.type : defaultType);

  const isEditMode = !!crate;

  // Show preview name for new crates using warehouse config nextCrateSeq
  useEffect(() => {
    let active = true;
    const loadPreview = async () => {
      if (isEditMode) return; // editing shows actual existing name
      if (!warehouseId) {
        setName('Auto-generated');
        return;
      }
      try {
        setPreviewError(null);
        const cfg = await getWarehouseConfig(warehouseId);
        const short = (cfg.shortCode || '').toUpperCase();
        const prefix = (cfg.cratePrefix || 'CRT').toUpperCase();
        const suffix = (cfg.crateSuffix || '').toUpperCase();
        let seq = parseInt(String(cfg.nextCrateSeq || 1), 10);
        if (isNaN(seq) || seq < 1 || seq > 9999) seq = 1;
        const core = short ? `${short}-${prefix}-${String(seq).padStart(4, '0')}` : `${prefix}-${String(seq).padStart(4, '0')}`;
        const preview = suffix ? `${core}-${suffix}` : core;
        if (!short) {
          setPreviewError('Warehouse short code missing in System Configuration');
        }
        if (active) setName(preview);
      } catch (e) {
        if (active) {
          setName('Auto-generated');
          setPreviewError('Unable to load warehouse configuration');
        }
      }
    };
    loadPreview();
    return () => { active = false; };
  }, [warehouseId, isEditMode]);

  // Set initial name for new crate based on warehouse config (readonly; server will generate final)
  React.useEffect(() => {
    if (!crate) {
      // Keep placeholder until preview loads
      if (!warehouseId) setName('Auto-generated');
    }
  }, [warehouseId, crate]);
  const labelRef = useRef<HTMLDivElement>(null);
  // Print handler for the label card
  const handlePrint = () => {
    if (labelRef.current) {
      printElement(labelRef.current);
    }
  };

  // Bulk crate state
  const [generatedCrates, setGeneratedCrates] = useState<BulkCrate[]>([]);

  const handleSave = () => {
    if (!warehouseId) {
      alert("Please select a warehouse.");
      return;
    }
    const maxStack = Number(config.maxStackHeight || 0);
    const maxBinsPer = Number(config.maxBinsPerRack || 0);
    if (!isEditMode && count > 1 && (maxStack > 0 || maxBinsPer > 0)) {
      const limit = Math.max(maxStack, maxBinsPer);
      if (limit > 0 && count > limit) {
        alert(`Count exceeds configured limit (${limit}).`);
        return;
      }
    }

    if (isEditMode) {
      onSave({ name, warehouse_id: warehouseId, count: 1, type, status });
      return;
    }
    // Bulk create: do not generate names; backend will generate
    onSave({ name: 'Auto-generated', warehouse_id: warehouseId, count, type: defaultType, status: defaultStatus });
  };

  const currentStatus = useMemo(() => crate?.status || status, [crate, status]);
  const statusText = currentStatus.replace('_', ' ');

  return (
    <div className="crate-editor">
      <div className="crate-visualization">
        <div className="crate-image-container">
          <img src={crateImage} alt="Crate" className="crate-image" />
          <div className="label-overlay" ref={labelRef}>
            {crate?.qr_code && (
              <div className="qr-code-container-small">
                <QRCode value={crate.qr_code} size={50} level="L" />
              </div>
            )}
            {!isEditMode && generatedCrates.length > 0 && (
              <div className="qr-code-container-small">
                <QRCode value={generatedCrates[0].qr_code} size={50} level="L" />
              </div>
            )}
            {!isEditMode && generatedCrates.length === 0 && (
              <div className="qr-code-container-small" title="Preview">
                <QRCode value={name} size={50} level="L" />
              </div>
            )}
            <div className="label-name-small">{name}</div>
          </div>
          <div className={`status-overlay status-badge status-${currentStatus}`}>
            <span className="status-dot"></span>
            <span>{statusText}</span>
          </div>
        </div>
      </div>
      <form className="crate-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="form-grid">
          <div className="form-group full-width">
            <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Crate' : 'Create Crates'}</h2>
          </div>
          <div className="form-group">
            <label>
              Crate Name
              <span title={previewError ? previewError : 'Preview based on System Configuration. Final value is assigned on save.'}> ⓘ</span>
            </label>
            <input type="text" value={name} readOnly style={{ background: 'var(--color-surface-muted)', cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label htmlFor="warehouse-select">Warehouse</label>
            <select 
              id="warehouse-select" 
              value={warehouseId} 
              onChange={(e) => setWarehouseId(e.target.value)}
              className="select"
            >
              <option value="" disabled>Select a warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
          {isEditMode && (
            <>
              <div className="form-group">
                <label htmlFor="crate-type">Type</label>
                <select id="crate-type" value={type} onChange={(e) => setType(e.target.value as CrateType)} className="select">
                  {CRATE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="crate-status">Status</label>
                <select id="crate-status" value={status} onChange={(e) => setStatus(e.target.value as CrateStatus)} className="select">
                  {CRATE_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </>
          )}
          {!isEditMode && (
            <div className="form-group">
              <label>Number of Crates</label>
              <div className="counter">
                <Button type="button" size="icon" variant="outline" onClick={() => setCount(Math.max(1, count - 1))}><Minus className="h-4 w-4"/></Button>
                <Input 
                  type="number" 
                  className="input"
                  value={count} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))} 
                  disabled={generatedCrates.length > 0}
                />
                <Button type="button" size="icon" variant="outline" onClick={() => setCount(count + 1)} disabled={generatedCrates.length > 0}><Plus className="h-4 w-4"/></Button>
              </div>
            </div>
          )}
          <div className="actions">
            <Button type="button" onClick={onCancel} className="btn-outline-token">
                <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="btn-primary-token" disabled={!warehouseId || (!isEditMode && generatedCrates.length > 0)}>
                {isEditMode ? 'Save Changes' : `Create ${count} Crate(s)`}
            </Button>
            <Button
              type="button"
              className="btn-outline-token"
              onClick={handlePrint}
              disabled={(!isEditMode && generatedCrates.length === 0) || (isEditMode && !crate)}
            >
              <Printer className="mr-2 h-4 w-4" />
              {isEditMode ? 'Reprint QR' : 'Print QR'}
            </Button>
            {!isEditMode && generatedCrates.length > 0 && (
              <Button
                type="button"
                className="btn-outline-token"
                onClick={() => {
                  // Bulk print all generated labels
                  const printWindow = window.open('', '', 'width=600,height=800');
                  if (!printWindow) return;
                  printWindow.document.write('<html><head><title>Bulk Print Labels</title>');
                  printWindow.document.write('<style>body{margin:0;display:flex;flex-wrap:wrap;gap:16px;justify-content:center;align-items:flex-start;} .label-overlay{margin:24px;box-shadow:none;transform:none;position:relative;left:0;bottom:0;width:140px;min-width:140px;max-width:140px;}</style>');
                  printWindow.document.write('</head><body>');
                  generatedCrates.forEach((c) => {
                    printWindow.document.write(`<div class="label-overlay"><div class="qr-code-container-small">${document.querySelector('.qr-code-container-small')?.innerHTML || ''}</div><div class="label-name-small">${c.name}</div></div>`);
                  });
                  printWindow.document.write('</body></html>');
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                  }, 200);
                }}
                disabled={generatedCrates.length === 0}
              >
                <Printer className="mr-2 h-4 w-4" /> Bulk Print
              </Button>
            )}
          </div>
          {!isEditMode && generatedCrates.length > 0 && (
            <div className="bulk-create-list">
                <div className="bulk-create-header">
                    <h3 className="bulk-create-title">Generated Crates</h3>
                </div>
                <ul>
                    {generatedCrates.map((c, index) => (
                        <li key={index} className="bulk-crate-item">
                            <span className="bulk-crate-name">{c.name}</span>
                            <span className="bulk-crate-qr">{c.qr_code}</span>
                        </li>
                    ))}
                </ul>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CrateEditor;
