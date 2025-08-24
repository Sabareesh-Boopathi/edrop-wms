import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSystemConfig, SystemConfig } from '../services/configService';

export type DateFormat = 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '24h' | '12h';

interface ConfigContextType {
  config: SystemConfig;
  reload: () => Promise<void>;
  initAfterLogin: () => Promise<void>;
  formatDate: (value: string | number | Date) => string;
  formatTime: (value: string | number | Date) => string;
  formatDateTime: (value: string | number | Date) => string;
}

// Helper to read env values in both CRA and Vite without referencing undefined globals
const getEnv = (key: string): string | undefined => {
  const viteVal = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) || undefined;
  if (viteVal !== undefined) return viteVal as string;
  // Avoid ReferenceError when process is not defined (Vite)
  const nodeEnv = (typeof process !== 'undefined' && (process as any).env && (process as any).env[key]) || undefined;
  return nodeEnv as string | undefined;
};

const defaultConfig: SystemConfig = {
  appName: 'eDrop WMS',
  logoUrl: '',
  defaultTimeZone: getEnv('VITE_DEFAULT_TZ') || getEnv('REACT_APP_DEFAULT_TZ') || 'Asia/Kolkata',
  dateFormat: (getEnv('VITE_DATE_FORMAT') as DateFormat) || (getEnv('REACT_APP_DATE_FORMAT') as DateFormat) || 'DD-MM-YYYY',
  timeFormat: (getEnv('VITE_TIME_FORMAT') as TimeFormat) || (getEnv('REACT_APP_TIME_FORMAT') as TimeFormat) || '24h',
  defaultLanguage: getEnv('VITE_LANG') || getEnv('REACT_APP_LANG') || 'en',
  defaultCrateSize: 'standard',
  defaultCrateStatus: 'inactive',
  defaultRackStatus: 'active',
  maxStackHeight: 0,
  maxBinsPerRack: 0,
  sessionTimeoutMins: Number(getEnv('VITE_SESSION_TIMEOUT_MINS') || getEnv('REACT_APP_SESSION_TIMEOUT_MINS') || 15),
  passwordPolicy: 'min8+complexity',
  roleAccessToggle: true,
  defaultPrinter: '',
  defaultScanner: '',
  apiBaseUrl: '',
  apiToken: '',
  autoGenerateMissingIds: true,
  dataSyncIntervalMins: 10,
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [authReady, setAuthReady] = useState(false);

  const reload = async () => {
    try {
      const cfg = await getSystemConfig();
      setConfig((prev) => ({ ...prev, ...cfg }));
    } catch (e) {
      // ignore, keep defaults
    }
  };

  // Called by Auth after login
  const initAfterLogin = async () => {
    setAuthReady(true);
    await reload();
  };

  // Do not auto-load on mount; wait for login
  useEffect(() => {
    // no-op here; AuthContext will call initAfterLogin after successful login
  }, []);

  const locale = useMemo(() => (config.defaultLanguage || 'en'), [config.defaultLanguage]);
  const timeZone = useMemo(() => (config.defaultTimeZone || 'Asia/Kolkata'), [config.defaultTimeZone]);

  const ensureDate = (value: string | number | Date) => (value instanceof Date ? value : new Date(value));

  const formatDate = (value: string | number | Date) => {
    const d = ensureDate(value);
    const parts = new Intl.DateTimeFormat(locale, { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(d);
    const map: Record<string, string> = {};
    parts.forEach((p) => { if (p.type !== 'literal') map[p.type] = p.value; });
    const df = (config.dateFormat as DateFormat) || 'DD-MM-YYYY';
    if (df === 'YYYY-MM-DD') return `${map.year}-${map.month}-${map.day}`;
    if (df === 'MM-DD-YYYY') return `${map.month}-${map.day}-${map.year}`;
    return `${map.day}-${map.month}-${map.year}`; // DD-MM-YYYY
  };

  const formatTime = (value: string | number | Date) => {
    const d = ensureDate(value);
    const hour12 = (config.timeFormat as TimeFormat) === '12h';
    return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', hour12 }).format(d);
  };

  const formatDateTime = (value: string | number | Date) => {
    return `${formatDate(value)} ${formatTime(value)}`;
  };

  const ctx: ConfigContextType = {
    config,
    reload,
    initAfterLogin,
    formatDate,
    formatTime,
    formatDateTime,
  };

  return (
    <ConfigContext.Provider value={ctx}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within a ConfigProvider');
  return ctx;
};
