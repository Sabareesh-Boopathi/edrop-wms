import React from 'react';
// Use a direct relative path to the UI card components to avoid path resolution quirks
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';

type TableCardProps = {
  title?: React.ReactNode;
  // Header slots in the desired order
  details?: React.ReactNode; // left-side details or title override
  warehouse?: React.ReactNode;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  // Optional filters row just under header
  filters?: React.ReactNode;
  children: React.ReactNode; // the table
  footer?: React.ReactNode; // pagination or summary
  className?: string;
  variant?: 'plain' | 'inbound';
  // Optional alignment for header controls in inbound variant
  controlsAlign?: 'left' | 'center' | 'right';
  // Control wrapping behavior for header controls group
  controlsWrap?: 'wrap' | 'nowrap';
  // Special layout: center the search while keeping actions on the right (inbound only)
  centerSearch?: boolean;
};

const TableCard: React.FC<TableCardProps> = ({
  title,
  details,
  warehouse,
  search,
  actions,
  filters,
  children,
  footer,
  className,
  variant = 'plain',
  controlsAlign = 'right',
  controlsWrap = 'wrap',
  centerSearch = false,
}) => {
  if (variant === 'inbound') {
    return (
      <div className={`inbound-card${className ? ` ${className}` : ''}`}>
        {centerSearch ? (
          <div
            className="inbound-card-header"
            style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'end' }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', minWidth: 0, flexWrap: 'wrap' }}>
              {details ? (
                <div style={{ minWidth: 0, flex: '0 0 auto' }}>{details}</div>
              ) : (
                title ? <h3 className="inbound-card-title" style={{ margin: 0, flex: '0 0 auto' }}>{title}</h3> : null
              )}
              {warehouse ? (
                <div style={{ flex: '0 1 auto', minWidth: 0, maxWidth: '100%' }}>{warehouse}</div>
              ) : null}
            </div>
            <div style={{ justifySelf: 'center', display: 'flex', gap: 8, alignItems: 'flex-end', minWidth: 280, maxWidth: 480, width: '100%' }}>
              {search}
            </div>
            <div style={{ justifySelf: 'end', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {actions}
            </div>
          </div>
        ) : (
          <div className="inbound-card-header" style={{ gap: 16, flexWrap: 'wrap' }}>
            <h3
              className="inbound-card-title"
              style={{ flex: controlsAlign === 'center' ? '0 0 100%' : '1 1 auto' }}
            >
              {details ?? title}
            </h3>
            {controlsAlign === 'center' ? (
              <div
                className="inbound-card-header-controls"
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-end',
                  flexWrap: controlsWrap === 'nowrap' ? 'nowrap' : 'wrap',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                {warehouse}
                {search}
                {actions}
              </div>
            ) : (
              <div
                className="inbound-card-header-controls"
                style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: controlsWrap === 'nowrap' ? 'nowrap' : 'wrap' }}
              >
                {warehouse}
                {search}
                {actions}
              </div>
            )}
          </div>
        )}
        <div className="inbound-card-content">
          {filters ? (
            <div className="inbound-filters-row" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              <span className="filters-chip" aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🔎</span>
                Filter by
              </span>
              {filters}
            </div>
          ) : null}
          {children}
        </div>
        {footer ? (
          <div className="inbound-card-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {footer}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b p-4">
        {controlsAlign === 'center' ? (
          <div className="w-full">
            <div className="min-w-0">
              {details ?? (
                title ? (
                  <div className="font-semibold text-foreground truncate">{title}</div>
                ) : null
              )}
            </div>
            <div
              className="mt-2 flex flex-row items-end justify-center gap-2"
              style={{ flexWrap: controlsWrap === 'nowrap' ? 'nowrap' : 'wrap' }}
            >
              {warehouse}
              {search}
              {actions}
            </div>
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              {details ?? (
                title ? (
                  <div className="font-semibold text-foreground truncate">{title}</div>
                ) : null
              )}
            </div>
            <div
              className="flex flex-row items-end gap-2"
              style={{ flexWrap: controlsWrap === 'nowrap' ? 'nowrap' : 'wrap' }}
            >
              {warehouse}
              {search}
              {actions}
            </div>
          </>
        )}
      </CardHeader>
      {filters ? (
        <div className="border-b p-4">
          <div className="flex flex-row flex-wrap items-center gap-2">{filters}</div>
        </div>
      ) : null}
      <CardContent className="p-0">
        {children}
      </CardContent>
      {footer ? <CardFooter className="justify-between border-t p-4">{footer}</CardFooter> : null}
    </Card>
  );
};

export default TableCard;
