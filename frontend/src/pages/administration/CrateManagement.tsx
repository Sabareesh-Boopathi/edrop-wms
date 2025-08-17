import React, { useEffect, useState, useMemo } from 'react';
import CrateCard from '../../components/CrateCard';
import CrateEditor from '../../components/CrateEditor';
import BulkCrateList from '../../components/BulkCrateList';
import QRScanner from '../../components/QRScanner';
import { getCrates, createCrate, updateCrate, deleteCrate } from '../../services/crateService';
import { getWarehouses } from '../../services/warehouseService';
import { Button } from '../../components/ui/button';
import { PlusCircle, Package, Archive, AlertTriangle, SearchX } from 'lucide-react';
import { motion } from 'framer-motion';
import * as notify from '../../lib/notify';
import { Crate, CrateStatus, Warehouse } from '../../types';
import './CrateManagement.css';
import EmptyState from '../../components/EmptyState';
import KpiCard from '../../components/KpiCard';

const CrateManagement: React.FC = () => {
  const [crates, setCrates] = useState<Crate[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [editingCrate, setEditingCrate] = useState<Crate | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [bulkCrates, setBulkCrates] = useState<Crate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  const fetchCrates = async () => {
    try {
      const data = await getCrates();
      setCrates(data);
    } catch (error) {
      notify.error('Failed to fetch crates.');
    }
  };

  const fetchWarehouses = async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } catch (error) {
      notify.error('Failed to fetch warehouses.');
    }
  };

  useEffect(() => {
    fetchCrates();
    fetchWarehouses();
  }, []);

  const handleSaveCrate = async (data: { name: string; warehouse_id: string; count: number; type?: "standard" | "refrigerated" | "large"; status?: CrateStatus }) => {
    try {
      if (editingCrate) {
        // Do not send name; it's auto-generated and read-only
        await updateCrate(editingCrate.id, { warehouse_id: data.warehouse_id, type: data.type, status: data.status });
  notify.success('Crate updated successfully!');
    } else {
        const newCrates: Crate[] = [];
        for (let i = 0; i < data.count; i++) {
          // Let the backend generate the crate name/QR based on warehouse config
          const normalizedStatus = (data.status || '').toString().toLowerCase() === 'unavailable' ? 'inactive' : data.status;
          const newCrate = await createCrate({ warehouse_id: data.warehouse_id, type: data.type ?? 'standard', status: normalizedStatus });
          newCrates.push(newCrate);
        }
        if (newCrates.length > 1) {
          setBulkCrates(newCrates);
        }
  notify.success(`${newCrates.length} crate(s) created successfully!`);
      }
    } catch (error: any) {
  const msg = (error as any)?.response?.data?.detail || 'Failed to save crate.';
  notify.error(msg);
    } finally {
      setEditingCrate(null);
      setIsCreating(false);
      fetchCrates();
    }
  };

  const handlePrintAll = () => {
    // Logic to print all QR labels for bulk crates
    console.log('Printing all QR labels for:', bulkCrates);
  };

  const handleCancel = () => {
    setEditingCrate(null);
    setIsCreating(false);
  };

  const handleDeleteCrate = async (id: string) => {
  notify.show('Are you sure you want to delete this crate?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteCrate(id);
            fetchCrates();
      notify.success('Crate deleted successfully!');
          } catch (error) {
      notify.error('Failed to delete crate.');
          }
        },
      },
      cancel: {
        label: 'Cancel',
    onClick: () => notify.dismiss(),
      },
    });
  };

  const handleCreateCrates = async (details: { warehouse_id: string; count: number }) => {
    // Logic to create crates in bulk
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredCrates = crates.filter(crate =>
    crate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredByWarehouse = selectedWarehouse
    ? filteredCrates.filter(crate => crate.warehouse_id === selectedWarehouse)
    : filteredCrates;

  const kpiData = useMemo(() => {
    const cratesToDisplay = selectedWarehouse ? filteredByWarehouse : crates;
    const totalCrates = cratesToDisplay.length;
    const activeCrates = cratesToDisplay.filter(c => c.status === 'active').length;
    const inUseCrates = cratesToDisplay.filter(c => c.status === 'in_use').length;
    const damagedCrates = cratesToDisplay.filter(c => c.status === 'damaged').length;
    return { totalCrates, activeCrates, inUseCrates, damagedCrates };
  }, [crates, selectedWarehouse, filteredByWarehouse]);

  return (
    <div className="crate-management">
      {isCreating || editingCrate ? (
        <CrateEditor
          warehouses={warehouses}
          onSave={handleSaveCrate}
          onCancel={handleCancel}
          crate={editingCrate}
        />
      ) : bulkCrates.length > 0 ? (
        <BulkCrateList crates={bulkCrates} onPrint={handlePrintAll} />
      ) : (
        <>
          {crates.length === 0 ? (
            <EmptyState
              icon={<Package size={64} />}
              title="No Crates Found"
              message="Get started by adding your first crate. Organize your inventory and improve warehouse efficiency."
              actionLabel="Add Your First Crate"
              actionIcon={<PlusCircle className="icon" />}
              onAction={() => setIsCreating(true)}
            />
          ) : (
            <>
              <header className="header">
                <div className="header-text">
                  <h1>Crate Management</h1>
                  <p>Organize, track, and manage all your crates.</p>
                </div>
                <div className="header-actions">
                  <div className="search-wrapper">
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <QRScanner />
                  <Button onClick={() => setIsCreating(true)} className="add-crate-btn">
                    <PlusCircle className="icon" /> Add Crate
                  </Button>
                </div>
              </header>
              <motion.section
                className="kpi-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
              >
                <KpiCard icon={<Package />} title="Total Crates" value={kpiData.totalCrates} variant="indigo" />
                <KpiCard icon={<Archive />} title="Active" value={kpiData.activeCrates} variant="emerald" />
                <KpiCard icon={<Package />} title="In Use" value={kpiData.inUseCrates} variant="orange" />
                <KpiCard icon={<AlertTriangle />} title="Damaged" value={kpiData.damagedCrates} variant="cyan" />
              </motion.section>

              <div className="filter-section">
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="warehouse-filter"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              {filteredByWarehouse.length > 0 ? (
                <div className="crate-list">
                  {filteredByWarehouse.map((crate, index) => (
                    <motion.div
                      key={crate.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    >
                      <CrateCard
                        crate={crate}
                        onEdit={() => setEditingCrate(crate)}
                        onDelete={handleDeleteCrate}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<SearchX size={64} />}
                  title="No Crates Found"
                  message="No crates found matching your search criteria."
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CrateManagement;
