import React, { useEffect, useMemo, useState } from 'react';
import * as notify from '../../lib/notify';
import { Button } from '../../components/ui/button';
import * as warehouseService from '../../services/warehouseService';
import * as configService from '../../services/configService';
import { HelpCircle, Save } from 'lucide-react';
import './WarehouseManagement.css';
import './CrateManagement.css';
import './SystemConfiguration.css';
import { useConfig } from '../../contexts/ConfigContext';

// Small reusable field components
function Field({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {label}
        {tooltip && (
          <span className="help-icon" title={tooltip} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
            <HelpCircle size={14} />
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" {...props} />;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" {...props} />;
}

const SystemConfiguration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'warehouse'>('global');
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const { reload: reloadGlobalConfig } = useConfig();

  // Global config state
  const [systemConfig, setSystemConfig] = useState<configService.SystemConfig>({
    appName: '',
    logoUrl: '',
    defaultTimeZone: 'Asia/Kolkata',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '24h',
    defaultLanguage: 'en',
    defaultCrateSize: 'standard',
  defaultCrateStatus: 'inactive',
    maxStackHeight: 0,
    maxBinsPerRack: 0,
  defaultRackStatus: 'active',
    sessionTimeoutMins: 60,
    passwordPolicy: 'min8+complexity',
    roleAccessToggle: true,
    defaultPrinter: '',
    defaultScanner: '',
    apiBaseUrl: '',
    apiToken: '',
    autoGenerateMissingIds: true,
    dataSyncIntervalMins: 10,
  });

  // Per-warehouse config state
  const [warehouseConfig, setWarehouseConfig] = useState<configService.WarehouseConfig | null>(null);
  const [initialSeq, setInitialSeq] = useState<{ crate: number; rack: number; receipt: number }>({ crate: 1, rack: 1, receipt: 1 });

  const TIME_ZONES = [
    { label: 'IST (UTC+05:30)', value: 'Asia/Kolkata' },
    { label: 'UTC', value: 'UTC' },
    { label: 'GMT', value: 'GMT' },
    { label: 'GST (Gulf)', value: 'Asia/Dubai' },
    { label: 'US/Eastern', value: 'America/New_York' },
  ];
  const DATE_FORMATS = ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'];
  const TIME_FORMATS = ['24h', '12h'];
  const LANGUAGES = [{ label: 'English (en)', value: 'en' }];
  const CRATE_SIZES = ['standard', 'refrigerated', 'large'];
  // Backend crate status enum values only
  const CRATE_STATUSES = ['active', 'in_use', 'reserved', 'damaged', 'inactive'] as const;

  // ensure IST default on first load if empty
  useEffect(() => {
    setSystemConfig((prev) => ({
      ...prev,
      defaultTimeZone: prev.defaultTimeZone || 'Asia/Kolkata',
      dateFormat: prev.dateFormat || 'DD-MM-YYYY',
      timeFormat: prev.timeFormat || '24h',
      defaultLanguage: prev.defaultLanguage || 'en',
    }));
  }, []);

  // Load base data
  useEffect(() => {
    (async () => {
      try {
        const [sys] = await Promise.all([
          configService.getSystemConfig(),
        ]);
        setSystemConfig(sys);
      } catch (err: any) {
  notify.error(getErrorMessage(err));
      }
      try {
        const ws = await warehouseService.getWarehouses();
        const mapped = (ws || []).map((w: any) => ({ id: w.id, name: w.name || w.store_name || w.warehouse_name || 'Warehouse' }));
        setWarehouses(mapped);
        if (mapped[0]?.id) setSelectedWarehouseId(mapped[0].id);
      } catch (err: any) {
  notify.error(getErrorMessage(err));
      }
    })();
  }, []);

  // Load selected warehouse config
  useEffect(() => {
    if (!selectedWarehouseId) return;
    (async () => {
      try {
        const cfg = await configService.getWarehouseConfig(selectedWarehouseId);
        setWarehouseConfig(cfg);
        setInitialSeq({ crate: Number(cfg.nextCrateSeq || 1), rack: Number(cfg.nextRackSeq || 1), receipt: Number(cfg.nextReceiptSeq || 1) });
      } catch (err: any) {
        // If not found, initialize defaults so user can save first config
        const defaults: configService.WarehouseConfig = {
          warehouseName: warehouses.find(w => w.id === selectedWarehouseId)?.name || '',
          shortCode: '',
          nextCrateSeq: 1,
          cratePrefix: '',
          crateSuffix: '',
          nextRackSeq: 1,
          rackPrefix: '',
          nextReceiptSeq: 1,
          nextBinSeq: 1,
          serviceAreaRangeKm: 0,
          dockBayCount: 0,
          maxCratesCapacity: 0,
          maxPalletsCapacity: 0,
          printer: '',
          scanner: '',
          defaultCrateExpiryDays: 0,
          autoCloseEmptyBins: false,
          utilizationAlertThreshold: 80,
          rackLabelTemplate: '',
          crateLabelTemplate: '',
        };
        setWarehouseConfig(defaults);
        setInitialSeq({ crate: 1, rack: 1, receipt: 1 });
      }
    })();
  }, [selectedWarehouseId, warehouses]);

  const confirmAnd = async (action: () => Promise<void>) => {
  notify.show('Confirm save?', {
      action: {
        label: 'Save',
        onClick: async () => {
          try {
            await action();
            notify.success('Saved');
          } catch (e: any) {
            notify.error(getErrorMessage(e));
          }
        },
      },
  cancel: { label: 'Cancel', onClick: () => notify.dismiss() },
    });
  };

  const saveGlobal = async () => {
    await confirmAnd(async () => {
      // Basic validation
      if (!systemConfig.appName) throw new Error('Application Name is required');
      if (!systemConfig.dateFormat) throw new Error('Date Format is required');
      const saved = await configService.saveSystemConfig(systemConfig);
      setSystemConfig(saved);
      await reloadGlobalConfig();
    });
  };

  const saveWarehouse = async () => {
    if (!warehouseConfig || !selectedWarehouseId) return;
    await confirmAnd(async () => {
      // Basic validation
      if (!warehouseConfig.warehouseName) throw new Error('Warehouse Name is required');
      if (!/^[A-Za-z0-9]{3}$/.test(warehouseConfig.shortCode)) throw new Error('Short Code must be 3 alphanumeric characters');

  const nextCrate = Number(warehouseConfig.nextCrateSeq || 1);
  const nextRack = Number(warehouseConfig.nextRackSeq || 1);
  const nextReceipt = Number(warehouseConfig.nextReceiptSeq || 1);
      if (nextCrate < initialSeq.crate) throw new Error('Crate sequence can only be increased. Decreasing may cause duplicate IDs.');
      if (nextRack < initialSeq.rack) throw new Error('Rack sequence can only be increased. Decreasing may cause duplicate IDs.');
  if (nextReceipt < initialSeq.receipt) throw new Error('Receipt sequence can only be increased. Decreasing may cause duplicate IDs.');
      if (nextCrate < 1 || nextCrate > 9999) throw new Error('Crate sequence must be between 1 and 9999.');
      if (nextRack < 1 || nextRack > 999) throw new Error('Rack sequence must be between 1 and 999.');
  if (nextReceipt < 1 || nextReceipt > 999999) throw new Error('Receipt sequence must be between 1 and 999,999.');

      const saved = await configService.saveWarehouseConfig(selectedWarehouseId, warehouseConfig);
      setWarehouseConfig(saved);
  setInitialSeq({ crate: Number(saved.nextCrateSeq || 1), rack: Number(saved.nextRackSeq || 1), receipt: Number(saved.nextReceiptSeq || 1) });
    });
  };

  const renderGlobal = () => (
    <div className="card edrop-card">
  {/* Removed duplicate card title for seamless tab-card blend */}
      <div className="card-content">
        <div className="form-grid edrop-form-grid">
          <div className="form-group form-group-span-2"><h5>General</h5></div>
          <Field label="Application Name" tooltip="Displayed in UI & reports">
            <TextInput value={systemConfig.appName} onChange={(e) => setSystemConfig(s => ({ ...s, appName: e.target.value }))} />
          </Field>
          <Field label="Logo URL" tooltip="Public URL for logo image">
            <TextInput value={systemConfig.logoUrl || ''} onChange={(e) => setSystemConfig(s => ({ ...s, logoUrl: e.target.value }))} />
          </Field>
          <Field label="Default Time Zone" tooltip="Used for consistent timestamps">
            <select
              id="defaultTimeZone"
              value={systemConfig.defaultTimeZone}
              onChange={(e) => setSystemConfig(s => ({ ...s, defaultTimeZone: e.target.value }))}
            >
              {TIME_ZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Date Format" tooltip="e.g., DD-MM-YYYY">
            <select
              id="dateFormat"
              value={systemConfig.dateFormat}
              onChange={(e) => setSystemConfig(s => ({ ...s, dateFormat: e.target.value }))}
            >
              {DATE_FORMATS.map(df => (
                <option key={df} value={df}>{df}</option>
              ))}
            </select>
          </Field>

          <div className="form-group">
            <label htmlFor="timeFormat">Time Format</label>
            <select
              id="timeFormat"
              value={systemConfig.timeFormat || '24h'}
              onChange={(e) => setSystemConfig(s => ({ ...s, timeFormat: e.target.value }))}
            >
              {TIME_FORMATS.map(tf => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="defaultLanguage">Default Language</label>
            <select
              id="defaultLanguage"
              value={systemConfig.defaultLanguage}
              onChange={(e) => setSystemConfig(s => ({ ...s, defaultLanguage: e.target.value }))}
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group form-group-span-2"><h5>Crate Settings</h5></div>
          <div className="form-group">
            <label htmlFor="defaultCrateSize">Default Crate Size</label>
            <select
              id="defaultCrateSize"
              value={systemConfig.defaultCrateSize || ''}
              onChange={(e) => setSystemConfig(s => ({ ...s, defaultCrateSize: e.target.value }))}
            >
              <option value="">Select</option>
              {CRATE_SIZES.map(cs => (
                <option key={cs} value={cs}>{cs}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="defaultCrateStatus">Default Crate Status</label>
            <select
              id="defaultCrateStatus"
              value={systemConfig.defaultCrateStatus || ''}
              onChange={(e) => setSystemConfig(s => ({ ...s, defaultCrateStatus: e.target.value }))}
            >
              <option value="">Select</option>
              {CRATE_STATUSES.map(cs => (
                <option key={cs} value={cs}>{cs.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="form-group form-group-span-2"><h5>Rack & Bin Settings</h5></div>
          <Field label="Max Stack Height" tooltip="Safety compliance">
            <NumberInput value={systemConfig.maxStackHeight ?? 0} onChange={(e) => setSystemConfig(s => ({ ...s, maxStackHeight: Number(e.target.value) }))} />
          </Field>
          <Field label="Max Bins Per Rack" tooltip="Physical layout limit">
            <NumberInput value={systemConfig.maxBinsPerRack ?? 0} onChange={(e) => setSystemConfig(s => ({ ...s, maxBinsPerRack: Number(e.target.value) }))} />
          </Field>
          <Field label="Default Rack Status" tooltip="Applied when creating new racks unless overridden">
            <select
              id="defaultRackStatus"
              value={systemConfig.defaultRackStatus || ''}
              onChange={(e) => setSystemConfig(s => ({ ...s, defaultRackStatus: e.target.value }))}
            >
              <option value="">Select</option>
              <option value="active">active</option>
              <option value="maintenance">maintenance</option>
              <option value="inactive">inactive</option>
            </select>
          </Field>

          <div className="form-group form-group-span-2"><h5>User & Security</h5></div>
          <Field label="Session Timeout (mins)" tooltip="Auto logout control">
            <NumberInput value={systemConfig.sessionTimeoutMins ?? 60} onChange={(e) => setSystemConfig(s => ({ ...s, sessionTimeoutMins: Number(e.target.value) }))} />
          </Field>
          <Field label="Password Policy" tooltip="Min length, complexity">
            <TextInput value={systemConfig.passwordPolicy || ''} onChange={(e) => setSystemConfig(s => ({ ...s, passwordPolicy: e.target.value }))} />
          </Field>
          <Field label="Role-based Access Toggle" tooltip="Enable/disable features">
            <select value={String(systemConfig.roleAccessToggle ? 'yes' : 'no')} onChange={(e) => setSystemConfig(s => ({ ...s, roleAccessToggle: e.target.value === 'yes' }))}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>

          <div className="form-group form-group-span-2"><h5>Connectivity</h5></div>
          <Field label="Default Printer" tooltip="Fallback printing device">
            <TextInput value={systemConfig.defaultPrinter || ''} onChange={(e) => setSystemConfig(s => ({ ...s, defaultPrinter: e.target.value }))} />
          </Field>
          <Field label="Default Scanner" tooltip="Fallback scanner">
            <TextInput value={systemConfig.defaultScanner || ''} onChange={(e) => setSystemConfig(s => ({ ...s, defaultScanner: e.target.value }))} />
          </Field>

          <div className="form-group form-group-span-2"><h5>Integration & API</h5></div>
          <Field label="API Base URL" tooltip="Integration endpoints">
            <TextInput value={systemConfig.apiBaseUrl || ''} onChange={(e) => setSystemConfig(s => ({ ...s, apiBaseUrl: e.target.value }))} />
          </Field>
          <Field label="API Token / Key" tooltip="Security credentials">
            <TextInput value={systemConfig.apiToken || ''} onChange={(e) => setSystemConfig(s => ({ ...s, apiToken: e.target.value }))} />
          </Field>

          <div className="form-group form-group-span-2"><h5>System Behavior</h5></div>
          <Field label="Auto-generate Missing IDs" tooltip="Toggle auto ID creation">
            <select value={String(systemConfig.autoGenerateMissingIds ? 'yes' : 'no')} onChange={(e) => setSystemConfig(s => ({ ...s, autoGenerateMissingIds: e.target.value === 'yes' }))}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Data Sync Interval (mins)" tooltip="Cloud sync frequency">
            <NumberInput value={systemConfig.dataSyncIntervalMins ?? 10} onChange={(e) => setSystemConfig(s => ({ ...s, dataSyncIntervalMins: Number(e.target.value) }))} />
          </Field>

        </div>
      </div>
      <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem' }}>
  <Button className="btn-primary-token" onClick={saveGlobal}><Save size={14} style={{ marginRight: 6 }} />Save</Button>
      </div>
    </div>
  );

  const renderWarehouse = () => (
    <div className="card edrop-card">
  {/* Removed duplicate card title for seamless tab-card blend */}
      <div className="card-content">
        <div className="form-grid edrop-form-grid">
          <Field label="Warehouse" tooltip="Select warehouse to edit settings">
            <select value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)}>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {warehouseConfig && (
          <div className="form-grid edrop-form-grid" style={{ marginTop: 8 }}>
            <div className="form-group form-group-span-2"><h5>General</h5></div>
            <Field label="Warehouse Name" tooltip="Used in reports">
              <TextInput value={warehouseConfig.warehouseName} onChange={(e) => setWarehouseConfig(s => s ? { ...s, warehouseName: e.target.value } : s)} />
            </Field>
            <Field label="Short Code (3)" tooltip="Used in labels">
              <TextInput value={warehouseConfig.shortCode} onChange={(e) => setWarehouseConfig(s => s ? { ...s, shortCode: e.target.value.toUpperCase().slice(0,3) } : s)} />
            </Field>

            <div className="form-group form-group-span-2"><h5>Inbound Receipt Numbering</h5></div>
            <Field label="Next Receipt Seq No." tooltip="For inbound receipt ID generation">
              <NumberInput min={1} max={999999} value={warehouseConfig.nextReceiptSeq || 1} onChange={(e) => setWarehouseConfig(s => s ? { ...s, nextReceiptSeq: Number(e.target.value) } : s)} />
            </Field>
            <Field label="Receipt Prefix" tooltip="Prefix for auto-generated receipt IDs">
              <TextInput value={warehouseConfig.receiptPrefix || ''} onChange={(e) => setWarehouseConfig(s => s ? { ...s, receiptPrefix: e.target.value.toUpperCase().slice(0,8) } : s)} />
            </Field>

            <div className="form-group form-group-span-2"><h5>Crate Numbering</h5></div>
            <Field label="Next Crate Seq No." tooltip="For crate ID generation">
              <NumberInput min={1} max={9999} value={warehouseConfig.nextCrateSeq} onChange={(e) => setWarehouseConfig(s => s ? { ...s, nextCrateSeq: Number(e.target.value) } : s)} />
            </Field>
            <Field label="Crate Prefix" tooltip="Branding/category">
              <TextInput value={warehouseConfig.cratePrefix || ''} onChange={(e) => setWarehouseConfig(s => s ? { ...s, cratePrefix: e.target.value } : s)} />
            </Field>
            <Field label="Crate Suffix" tooltip="Branding/category">
              <TextInput value={warehouseConfig.crateSuffix || ''} onChange={(e) => setWarehouseConfig(s => s ? { ...s, crateSuffix: e.target.value } : s)} />
            </Field>

            <div className="form-group form-group-span-2"><h5>Rack & Bin Numbering</h5></div>
            <Field label="Next Rack Seq No." tooltip="Auto ID generation">
              <NumberInput min={1} max={999} value={warehouseConfig.nextRackSeq} onChange={(e) => setWarehouseConfig(s => s ? { ...s, nextRackSeq: Number(e.target.value) } : s)} />
            </Field>
            <Field label="Rack Prefix" tooltip="Auto ID generation">
              <TextInput value={warehouseConfig.rackPrefix || ''} onChange={(e) => setWarehouseConfig(s => s ? { ...s, rackPrefix: e.target.value } : s)} />
            </Field>
            <Field label="Next Bin Seq No." tooltip="Auto ID generation">
              <NumberInput value={warehouseConfig.nextBinSeq} onChange={(e) => setWarehouseConfig(s => s ? { ...s, nextBinSeq: Number(e.target.value) } : s)} />
            </Field>

            <div className="form-group form-group-span-2"><h5>Service Area</h5></div>
            <Field label="Service Area Range (km)" tooltip="Location coverage">
              <NumberInput value={warehouseConfig.serviceAreaRangeKm ?? 0} onChange={(e) => setWarehouseConfig(s => s ? { ...s, serviceAreaRangeKm: Number(e.target.value) } : s)} />
            </Field>
            <Field label="Dock/Bay Count" tooltip="Logistics planning">
              <NumberInput value={warehouseConfig.dockBayCount ?? 0} onChange={(e) => setWarehouseConfig(s => s ? { ...s, dockBayCount: Number(e.target.value) } : s)} />
            </Field>

            <div className="form-group form-group-span-2"><h5>Capacity & Utilization</h5></div>
            <Field label="Max Crates Capacity" tooltip="Planning threshold">
              <NumberInput value={warehouseConfig.maxCratesCapacity ?? 0} onChange={(e) => setWarehouseConfig(s => s ? { ...s, maxCratesCapacity: Number(e.target.value) } : s)} />
            </Field>
            <Field label="Max Pallets Capacity" tooltip="Planning threshold">
              <NumberInput value={warehouseConfig.maxPalletsCapacity ?? 0} onChange={(e) => setWarehouseConfig(s => s ? { ...s, maxPalletsCapacity: Number(e.target.value) } : s)} />
            </Field>

            <div className="form-group form-group-span-2"><h5>Printing & Scanning</h5></div>
            <Field label="Printer Name/IP" tooltip="Per warehouse printer">
              <TextInput value={warehouseConfig.printer || ''} onChange={(e) => setWarehouseConfig(s => s ? { ...s, printer: e.target.value } : s)} />
            </Field>
            <Field label="Bluetooth Scanner ID" tooltip="Per warehouse scanner">
              <TextInput value={warehouseConfig.scanner || ''} onChange={(e) => setWarehouseConfig(s => s ? { ...s, scanner: e.target.value } : s)} />
            </Field>

            <div className="form-group form-group-span-2"><h5>Operational Rules</h5></div>
            <Field label="Default Crate Expiry Days" tooltip="FIFO/LIFO management">
              <NumberInput value={warehouseConfig.defaultCrateExpiryDays ?? 0} onChange={(e) => setWarehouseConfig(s => s ? { ...s, defaultCrateExpiryDays: Number(e.target.value) } : s)} />
            </Field>
            <Field label="Auto-close Empty Bins" tooltip="Workflow optimization">
              <select value={String(warehouseConfig.autoCloseEmptyBins ? 'yes' : 'no')} onChange={(e) => setWarehouseConfig(s => s ? { ...s, autoCloseEmptyBins: e.target.value === 'yes' } : s)}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Utilization Alert Threshold (%)" tooltip="Warn when near full">
              <NumberInput value={warehouseConfig.utilizationAlertThreshold ?? 80} onChange={(e) => setWarehouseConfig(s => s ? { ...s, utilizationAlertThreshold: Number(e.target.value) } : s)} />
            </Field>

            <div className="form-group form-group-span-2"><h5>Custom Labels</h5></div>
            <Field label="Rack Label Template" tooltip="Custom print layout">
              <TextInput value={warehouseConfig.rackLabelTemplate || ''} onChange={(e) => setWarehouseConfig(s => s ? { ...s, rackLabelTemplate: e.target.value } : s)} />
            </Field>
            <Field label="Crate Label Template" tooltip="QR + text layout">
              <TextInput value={warehouseConfig.crateLabelTemplate || ''} onChange={(e) => setWarehouseConfig(s => s ? { ...s, crateLabelTemplate: e.target.value } : s)} />
            </Field>

            <div className="form-group form-group-span-2"><h5>Inbound Policies</h5></div>
            <Field label="Overs Hold Days" tooltip="Days to hold over-delivered items before action">
              <NumberInput min={0} value={warehouseConfig.inboundOversPolicy?.hold_days ?? 3} onChange={(e) => setWarehouseConfig(s => s ? { ...s, inboundOversPolicy: { hold_days: Math.max(0, Number(e.target.value||0)), after: s.inboundOversPolicy?.after || 'DISPOSE' } } : s)} />
            </Field>
            <Field label="Overs After" tooltip="Action after hold: Dispose or Charity">
              <select value={warehouseConfig.inboundOversPolicy?.after || 'DISPOSE'} onChange={(e) => setWarehouseConfig(s => s ? { ...s, inboundOversPolicy: { hold_days: s.inboundOversPolicy?.hold_days ?? 3, after: e.target.value as any } } : s)}>
                <option value="DISPOSE">Dispose</option>
                <option value="CHARITY">Charity</option>
              </select>
            </Field>
          </div>
        )}
      </div>
      <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem' }}>
  <Button className="btn-primary-token" onClick={saveWarehouse}><Save size={14} style={{ marginRight: 6 }} />Save</Button>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h1>System Configuration</h1>
      <div className="tabs-bar">
        <div className="tabs">
          <button className={`tab ${activeTab === 'global' ? 'active' : ''}`} onClick={() => setActiveTab('global')}>Global Settings</button>
          <button className={`tab ${activeTab === 'warehouse' ? 'active' : ''}`} onClick={() => setActiveTab('warehouse')}>Warehouse Settings</button>
        </div>
      </div>

      <div className="tab-panel">
        {activeTab === 'global' ? renderGlobal() : renderWarehouse()}
      </div>
    </div>
  );
};

function getErrorMessage(error: any): string {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((d: any) => d?.msg || d?.message || (typeof d === 'string' ? d : JSON.stringify(d)));
    return msgs.join('; ');
  }
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') return (detail.message || JSON.stringify(detail));
  return error?.message || 'An error occurred';
}

export default SystemConfiguration;
