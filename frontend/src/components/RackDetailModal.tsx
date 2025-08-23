import React, { useEffect, useMemo, useState } from 'react';
import { Rack, Bin } from 'types';
import { BinStatus } from 'types';
import { Package as PackageIcon, PackageOpen, Wrench, Ban, Bookmark, Edit, Trash, X } from 'lucide-react';
import './RackDetailModal.css';
import { getBinsByRack } from 'services/rackService';
import BinFormModal from 'components/BinFormModal';

interface RackDetailModalProps {
    rack: Rack;
    onClose: () => void;
    onEditRack?: () => void;
    onDeleteRack?: () => void;
}

const statusConfig: Record<BinStatus, { className: string; icon: React.ReactNode; label: string }> = {
  empty: {
    className: 'status-empty',
    icon: <PackageOpen className="bin-icon" aria-hidden />,
    label: 'Empty',
  },
  occupied: {
    className: 'status-occupied',
    icon: <PackageIcon className="bin-icon" aria-hidden />,
    label: 'Occupied',
  },
  reserved: {
    className: 'status-reserved',
    icon: <Bookmark className="bin-icon" aria-hidden />,
    label: 'Reserved',
  },
  blocked: {
    className: 'status-blocked',
    icon: <Ban className="bin-icon" aria-hidden />,
    label: 'Blocked',
  },
  maintenance: {
    className: 'status-maintenance',
    icon: <Wrench className="bin-icon" aria-hidden />,
    label: 'Maintenance',
  },
};

const RackDetailModal: React.FC<RackDetailModalProps> = ({ rack, onClose, onEditRack, onDeleteRack }) => {
    const [bins, setBins] = useState<Bin[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [binEditing, setBinEditing] = useState<Bin | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await getBinsByRack(rack.id);
                setBins(data);
            } catch (e) {
                setError('Failed to load bins');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [rack.id]);

    const grid = useMemo(() => {
        return Array.from({ length: rack.stacks }, (_, row) =>
            Array.from({ length: rack.bins_per_stack }, (_, col) => ({ row, col }))
        );
    }, [rack.stacks, rack.bins_per_stack]);

    const findBin = (row: number, col: number) => bins.find(b => b.stack_index === row && b.bin_index === col);
    const getStatus = (row: number, col: number): BinStatus => findBin(row, col)?.status ?? 'empty';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <div className="header-left">
                                        <h2>{rack.name}</h2>
                                        <div className="rack-meta">
                                            <span className="rack-chip">{rack.stacks} stacks</span>
                                            <span className="rack-chip">{rack.bins_per_stack} bins / stack</span>
                                            <span className="rack-chip">{rack.total_bins} total bins</span>
                                            <span className="rack-chip">{rack.occupied_bins} occupied</span>
                                        </div>
                                        <div className="rack-util-row" aria-label="Rack utilization">
                                            <div className="util-bar" role="progressbar" aria-valuenow={rack.total_bins ? Math.round((rack.occupied_bins / rack.total_bins) * 100) : 0} aria-valuemin={0} aria-valuemax={100}>
                                                <div className="util-fill" style={{ width: `${rack.total_bins ? (rack.occupied_bins / rack.total_bins) * 100 : 0}%` }} />
                                            </div>
                                            <span className="util-text">{rack.total_bins ? ((rack.occupied_bins / rack.total_bins) * 100).toFixed(1) : 0}% full</span>
                                        </div>
                                    </div>
                                    <div className="action-buttons">
                                        {onEditRack && (
                                            <button className="btn-outline-token btn-inline" onClick={onEditRack} title="Edit Rack">
                                                <Edit /> Edit
                                            </button>
                                        )}
                                        {onDeleteRack && (
                                            <button className="btn-outline-token btn-inline" onClick={onDeleteRack} title="Delete Rack">
                                                <Trash /> Delete
                                            </button>
                                        )}
                                        <button className="close-button" onClick={onClose} aria-label="Close modal">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="modal-body">
                                    <div className="panel-left panel-scroll">
                                        <p className="section-title" style={{marginTop:0}}>Bins</p>
                                        {loading && <p>Loading bins...</p>}
                                        {error && <p className="error-message">{error}</p>}
                                        <div className="bin-grid" aria-label="Bin grid">
                                            {grid.map((row, rowIndex) => (
                                                <div key={rowIndex} className="bin-row">
                                                    {row.map(({ row: r, col: c }) => {
                                                        const bin = findBin(r, c);
                                                        const status = getStatus(r, c);
                                                        const cfg = statusConfig[status];
                                                        const fullCode = bin?.code || `${rack.name}-S${String(r+1).padStart(3,'0')}-B${String(c+1).padStart(3,'0')}`;
                                                        // Always display normalized SXXX-BXXX (from indices) for visual consistency
                                                        const shortCode = `S${String(r+1).padStart(3,'0')}-B${String(c+1).padStart(3,'0')}`;
                                                        
                                                        // Product information for occupied bins
                                                        const productInfo = status === 'occupied' && bin ? 
                                                          `${bin.product_id ? `Product: ${bin.product_id}` : ''}${bin.store_product_id ? ` • Store: ${bin.store_product_id}` : ''}${bin.quantity ? ` • Qty: ${bin.quantity}` : ''}`.replace(/^[•\s]+|[•\s]+$/g, '') :
                                                          '';
                                                        
                                                        const title = `${cfg.label} • ${fullCode}${productInfo ? ` • ${productInfo}` : ''}`;
                                                        return (
                                                            <button
                                                                key={`${r}-${c}`}
                                                                type="button"
                                                                className={`bin-cell ${cfg.className}`}
                                                                onClick={() => setBinEditing(bin || { id: `${rack.id}:${r}:${c}`, rack_id: rack.id, stack_index: r, bin_index: c, status: 'empty' })}
                                                                title={title}
                                                                aria-label={title}
                                                            >
                                                                {cfg.icon}
                                                                <span className="bin-name">{shortCode}</span>
                                                                {productInfo && (
                                                                    <span className="bin-product" style={{fontSize: '0.7em', color: 'var(--color-text-soft)', marginTop: '2px'}}>
                                                                        {bin?.quantity || '?'}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="panel-right">
                                        <p className="section-title" style={{marginTop:0}}>Legend</p>
                                        <div className="legend" aria-label="Bin status legend">
                                            {(['occupied','reserved','blocked','maintenance','empty'] as BinStatus[]).map((s) => (
                                                <div key={s} className={`legend-item ${statusConfig[s].className}`}>
                                                    {statusConfig[s].icon}
                                                    <span>{statusConfig[s].label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                {binEditing && (
                    <BinFormModal
                        rack={rack}
                        bin={binEditing}
                        onClose={() => setBinEditing(null)}
                        onChanged={(updated: Bin) => {
                            // replace or add
                            setBins(prev => {
                                const idx = prev.findIndex(b => b.id === updated.id);
                                if (idx >= 0) {
                                    const copy = [...prev];
                                    copy[idx] = updated;
                                    return copy;
                                }
                                return [...prev, updated];
                            });
                            setBinEditing(null);
                        }}
                        onDeleted={(binId: string) => {
                            setBins(prev => prev.filter(b => b.id !== binId));
                            setBinEditing(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default RackDetailModal;
