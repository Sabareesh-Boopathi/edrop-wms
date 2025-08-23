import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlusCircle, Store as StoreIcon, Package, MapPin, Edit, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import * as notify from '../../lib/notify';
import * as vendorService from '../../services/vendorService';
import * as storeService from '../../services/storeService';
import * as productService from '../../services/productService';
import LocationPicker from '../../components/LocationPicker';
import './VendorDetails.css'
import TableCard from '../../components/table/TableCard';
import LoadingOverlay from '../../components/LoadingOverlay';

export interface VendorDetailsProps {
  vendor: { id: string; business_name: string; };
  open: boolean;
  onClose: () => void;
}

const VendorDetails: React.FC<VendorDetailsProps> = ({ vendor, open, onClose }) => {
  const [activeTab, setActiveTab] = useState<'stores' | 'products'>('stores');
  const [stores, setStores] = useState<vendorService.StoreDTO[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  // Pagination: stores
  const [storePage, setStorePage] = useState(1);
  const [storePageSize] = useState(5);

  // Global filter text for current tab
  const [filterText, setFilterText] = useState('');

  // Create store form state
  const [createStoreOpen, setCreateStoreOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  // Add: toggle for product create form
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [newStore, setNewStore] = useState<storeService.CreateStoreDTO>({
    store_name: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    store_status: 'ACTIVE',
    operation_start_time: '',
    operation_end_time: '',
    vendor_id: vendor.id,
  });

  // Per-store product management state
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [storeProducts, setStoreProducts] = useState<Record<string, storeService.StoreProductDTO[]>>({});
  const [allProducts, setAllProducts] = useState<productService.ProductDTO[]>([]);
  const [newStoreProduct, setNewStoreProduct] = useState<{ product_id: string; available_qty: number; price: number; bin_code?: string }>({ product_id: '', available_qty: 0, price: 0 });

  // Initial products for New Store
  const [initialProducts, setInitialProducts] = useState<Array<{ product_id: string; available_qty: number; price: number; bin_code?: string }>>([]);
  const [initialNewProduct, setInitialNewProduct] = useState<{ product_id: string; available_qty: number; price: number; bin_code?: string }>({ product_id: '', available_qty: 0, price: 0 });

  // Clone-from-store state
  const [cloneSourceStoreId, setCloneSourceStoreId] = useState<string>('');

  // Products tab state
  const [products, setProducts] = useState<productService.ProductDTO[]>([]);
  // Pagination: products
  const [productPage, setProductPage] = useState(1);
  const [productPageSize] = useState(5);
  const [newProduct, setNewProduct] = useState<productService.CreateProductDTO>({ name: '', sku: '', price: 0, description: '', vendor_id: vendor.id });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<productService.UpdateProductDTO>({});

  // Derived filtered lists
  const filteredStores = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(s => s.store_name?.toLowerCase().includes(q));
  }, [stores, filterText]);

  const storePageCount = Math.max(1, Math.ceil(filteredStores.length / storePageSize));
  const pagedStores = useMemo(() => {
    const start = (storePage - 1) * storePageSize;
    return filteredStores.slice(start, start + storePageSize);
  }, [filteredStores, storePage, storePageSize]);

  const filteredProducts = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => (p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)));
  }, [products, filterText]);

  const productPageCount = Math.max(1, Math.ceil(filteredProducts.length / productPageSize));
  const pagedProducts = useMemo(() => {
    const start = (productPage - 1) * productPageSize;
    return filteredProducts.slice(start, start + productPageSize);
  }, [filteredProducts, productPage, productPageSize]);

  const loadStores = useCallback(async () => {
    try {
      setIsLoadingStores(true);
      const data = await vendorService.getVendorStores(vendor.id);
      setStores(data);
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    } finally {
      setIsLoadingStores(false);
    }
  }, [vendor.id]);

  const loadStoreProducts = async (storeId: string) => {
    try {
      const list = await storeService.listStoreProducts(storeId);
      setStoreProducts(prev => ({ ...prev, [storeId]: list }));
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  const ensureProductsLoaded = async () => {
    if (allProducts.length > 0) return;
    try {
      const list = await productService.listProducts();
      setAllProducts(list);
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  const loadProductsTab = async () => {
    try {
      const list = await productService.listProducts();
      setProducts(list);
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  const handleCreateStore = async () => {
    if (!newStore.store_name || !newStore.store_status) {
      notify.error('Store name and status are required');
      return;
    }
    try {
      const created = await storeService.createStore(newStore);
      setStores(prev => [...prev, created]);

      // Link initial products, if any
      if (initialProducts.length > 0) {
        await Promise.all(initialProducts.map(p => storeService.addStoreProduct(created.id, p)));
        notify.success(`Store created with ${initialProducts.length} product${initialProducts.length > 1 ? 's' : ''}`);
      } else {
        notify.success('Store created');
      }

      setCreateStoreOpen(false);
      setNewStore({ ...newStore, store_name: '', address: '', latitude: undefined, longitude: undefined });
      setInitialProducts([]);
      setInitialNewProduct({ product_id: '', available_qty: 0, price: 0 });
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  // Clone products from an existing store into the Initial Products list
  const handleCloneFromStore = useCallback(async (sourceStoreId: string) => {
    if (!sourceStoreId) return;
    try {
      await ensureProductsLoaded();
      const list = await storeService.listStoreProducts(sourceStoreId);
      const mapped = list.map(sp => ({
        product_id: sp.product_id,
        available_qty: 0, // quantities reset to 0 by default
        price: sp.price ?? 0,
        bin_code: undefined, // bins differ per store
      }));
      setInitialProducts(mapped);
      notify.success(`Cloned ${mapped.length} products from source store`);
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  }, [ensureProductsLoaded]);

  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('Delete this store?')) return; // quicker confirm
    try {
      await storeService.deleteStore(storeId);
      setStores(prev => prev.filter(s => s.id !== storeId));
      notify.success('Store deleted');
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  const handleToggleStoreExpand = async (storeId: string) => {
    const newState = expandedStoreId === storeId ? null : storeId;
    setExpandedStoreId(newState);
    if (newState) {
      await ensureProductsLoaded();
      await loadStoreProducts(storeId);
    }
  };

  const handleAddProductToStore = async (storeId: string) => {
    if (!newStoreProduct.product_id) {
      notify.error('Select a product');
      return;
    }
    try {
      const created = await storeService.addStoreProduct(storeId, newStoreProduct);
      setStoreProducts(prev => ({
        ...prev,
        [storeId]: [ ...(prev[storeId] || []), created ]
      }));
      notify.success('Product added to store');
      setNewStoreProduct({ product_id: '', available_qty: 0, price: 0 });
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  const handleDeleteStoreProduct = async (storeId: string, spId: string) => {
    if (!window.confirm('Remove this product from store?')) return; // quicker confirm
    try {
      await storeService.deleteStoreProduct(storeId, spId);
      setStoreProducts(prev => ({
        ...prev,
        [storeId]: (prev[storeId] || []).filter((sp: storeService.StoreProductDTO) => sp.id !== spId)
      }));
      notify.success('Removed');
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  // Products CRUD
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku) {
      notify.error('Name and SKU are required');
      return;
    }
    try {
      const created = await productService.createProduct(newProduct);
      setProducts(prev => [created, ...prev]);
      setAllProducts(prev => [created, ...prev]);
      setNewProduct({ name: '', sku: '', price: 0, description: '', vendor_id: vendor.id });
      setCreateProductOpen(false); // close form after add
      notify.success('Product created');
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  const startEditProduct = (p: productService.ProductDTO) => {
    setEditingProductId(p.id);
    setEditProduct({ name: p.name, sku: p.sku, price: p.price, description: p.description || '' });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditProduct({});
  };

  const saveEditProduct = async () => {
    if (!editingProductId) return;
    try {
      const updated = await productService.updateProduct(editingProductId, editProduct);
      setProducts(prev => prev.map(p => (p.id === editingProductId ? updated : p)));
      setAllProducts(prev => prev.map(p => (p.id === editingProductId ? updated : p)));
      setEditingProductId(null);
      setEditProduct({});
      notify.success('Product updated');
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product?')) return; // quicker confirm
    try {
      await productService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setAllProducts(prev => prev.filter(p => p.id !== productId));
      notify.success('Product deleted');
    } catch (err: any) {
      notify.error(getErrorMessage(err));
    }
  };

  // Load stores on open
  useEffect(() => {
    if (!open) return;
    loadStores();
  }, [open, loadStores]);

  // Ensure products are available when opening the Create Store form
  useEffect(() => {
    if (createStoreOpen) {
      ensureProductsLoaded();
    }
  }, [createStoreOpen]);

  // Reset pagination on filter change or tab switch
  useEffect(() => {
    setStorePage(1);
    setProductPage(1);
  }, [filterText, activeTab]);

  // Load products for Products tab
  useEffect(() => {
    if (activeTab === 'products') {
      loadProductsTab();
    }
  }, [activeTab]);

  if (!open) return null;

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal-content" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="modal-header">
          <h3 className="modal-title">Manage {vendor.business_name}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="close-btn"><X size={24} /></Button>
        </div>

        <div className="tabs-bar">
          <div className="vd-tabs">
            <button
              className={`vd-tab-chip ${activeTab === 'stores' ? 'active' : ''}`}
              onClick={() => setActiveTab('stores')}
              aria-pressed={activeTab === 'stores'}
            >
              <StoreIcon size={16} />
              <span>Stores</span>
            </button>
            <button
              className={`vd-tab-chip ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
              aria-pressed={activeTab === 'products'}
            >
              <Package size={16} />
              <span>Products</span>
            </button>
          </div>
        </div>

        {activeTab === 'stores' && (
          <div className="tab-panel">
            <TableCard
              variant="inbound"
              title="Stores"
              search={<input className="filter-input" placeholder="Filter stores…" value={filterText} onChange={(e)=>setFilterText(e.target.value)} />}
              actions={<Button className="btn-primary-token" onClick={()=>setCreateStoreOpen(true)}><PlusCircle className="icon"/> Add Store</Button>}
              footer={
                <>
                  <span style={{fontSize:12,color:'var(--color-text-dim)'}}>Total stores: {filteredStores.length}</span>
                  <div style={{display:'inline-flex',gap:6,alignItems:'center'}}>
                    <button type="button" className="pager-btn" title="Previous" disabled={storePage<=1} onClick={()=>setStorePage(p=>Math.max(1,p-1))}><ChevronLeft size={16}/></button>
                    <span style={{fontSize:12}}>Page {storePage} / {storePageCount}</span>
                    <button type="button" className="pager-btn" title="Next" disabled={storePage>=storePageCount} onClick={()=>setStorePage(p=>Math.min(storePageCount,p+1))}><ChevronRight size={16}/></button>
                  </div>
                </>
              }
            >
              {isLoadingStores ? (
                <LoadingOverlay label="Loading stores" />
              ) : (
                <>
                  {createStoreOpen && (
                    <div className="nested-card" style={{ marginBottom: 12 }}>
                      <h5>New Store</h5>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Name</label>
                          <input value={newStore.store_name} onChange={e => setNewStore(s => ({ ...s, store_name: e.target.value }))} placeholder="e.g., Main Street Store" />
                        </div>
                        <div className="form-group">
                          <label>Status</label>
                          <select value={newStore.store_status} onChange={e => setNewStore(s => ({ ...s, store_status: e.target.value }))}>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                        </div>
                        <div className="form-group form-group-span-2">
                          <label>Address</label>
                          <input value={newStore.address || ''} onChange={e => setNewStore(s => ({ ...s, address: e.target.value }))} placeholder="Street, City, ZIP" />
                        </div>
                        <div className="form-group form-group-span-2">
                          <label>Location</label>
                          <div className="location-picker-group">
                            <input value={newStore.latitude ?? ''} placeholder="Latitude" disabled />
                            <input value={newStore.longitude ?? ''} placeholder="Longitude" disabled />
                            <Button type="button" className="btn-outline-token map-picker-btn" onClick={() => setIsMapOpen(true)}>
                              <MapPin size={16} /> Pick from Map
                            </Button>
                          </div>
                        </div>
                        <div className="form-group form-group-span-2">
                          <label>Clone products from existing store (optional)</label>
                          <div className="location-picker-group" style={{ gap: 8 }}>
                            <select
                              value={cloneSourceStoreId}
                              onChange={(e) => {
                                const id = e.target.value;
                                setCloneSourceStoreId(id);
                              }}
                            >
                              <option value="">Select source store</option>
                              {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.store_name}</option>
                              ))}
                            </select>
                            <Button type="button" className="btn-outline-token" onClick={() => {
                              if (!cloneSourceStoreId) { notify.error('Select a source store'); return; }
                              handleCloneFromStore(cloneSourceStoreId);
                            }}>Clone</Button>
                            {initialProducts.length > 0 && (
                              <Button type="button" className="btn-outline-token" onClick={() => setInitialProducts([])}>Reset</Button>
                            )}
                          </div>
                          <small className="muted">Cloning copies the product list. Quantities are reset to 0. Bin codes are not copied.</small>
                        </div>
                      </div>

                      <div className="nested-card" style={{ marginTop: 12 }}>
                        <h5>Initial Products (optional)</h5>
                        <div className="inline-form" style={{ marginBottom: 8 }}>
                          <select value={initialNewProduct.product_id} onChange={(e) => setInitialNewProduct(p => ({ ...p, product_id: e.target.value }))}>
                            <option value="">Select product</option>
                            {allProducts.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <input type="number" placeholder="Qty" value={initialNewProduct.available_qty} onChange={(e) => setInitialNewProduct(p => ({ ...p, available_qty: Number(e.target.value) }))} />
                          <input type="number" step="0.01" placeholder="Price" value={initialNewProduct.price} onChange={(e) => setInitialNewProduct(p => ({ ...p, price: Number(e.target.value) }))} />
                          <input type="text" placeholder="Bin code" value={initialNewProduct.bin_code || ''} onChange={(e) => setInitialNewProduct(p => ({ ...p, bin_code: e.target.value }))} />
                          <Button className="btn-primary-token" onClick={() => {
                            if (!initialNewProduct.product_id) { notify.error('Select a product'); return; }
                            setInitialProducts(prev => [...prev, initialNewProduct]);
                            setInitialNewProduct({ product_id: '', available_qty: 0, price: 0 });
                          }}><PlusCircle className="icon" /> Add</Button>
                        </div>
                        {initialProducts.length > 0 && (
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Bin</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {initialProducts.map((p, idx) => (
                                <tr key={`${p.product_id}-${idx}`}>
                                  <td>{allProducts.find(ap => ap.id === p.product_id)?.name || p.product_id}</td>
                                  <td>{p.available_qty}</td>
                                  <td>{p.price}</td>
                                  <td>{p.bin_code || '-'}</td>
                                  <td className="text-right">
                                    <Button size="icon" variant="destructive" title="Remove" onClick={() => setInitialProducts(prev => prev.filter((_, i) => i !== idx))}>
                                      <Trash2 size={16} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        <div className="modal-footer">
                          <Button className="btn-outline-token" onClick={() => setCreateStoreOpen(false)}>Cancel</Button>
                          <Button className="btn-primary-token" onClick={handleCreateStore}>Create Store</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {stores.length === 0 && !createStoreOpen ? (
                    <div className="empty-state">
                      <h2>No stores yet</h2>
                      <p>Create your first store and start mapping products.</p>
                      <Button className="btn-primary-token" onClick={() => setCreateStoreOpen(true)}>
                        <PlusCircle className="icon" /> Add Store
                      </Button>
                    </div>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedStores.map((s) => (
                          <React.Fragment key={s.id}>
                            <tr>
                              <td>{s.store_name}</td>
                              <td>{s.store_status}</td>
                              <td className="text-right">
                                <div className="row-actions" style={{display:'inline-flex',gap:10}}>
                                  <button type="button" className="action-link primary" onClick={() => handleToggleStoreExpand(s.id)}>
                                    <Package size={16}/> Products
                                  </button>
                                  <button type="button" className="action-link danger" onClick={() => handleDeleteStore(s.id)}>
                                    <Trash2 size={16}/> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedStoreId === s.id && (
                              <tr>
                                <td colSpan={3}>
                                  <TableCard variant="inbound" title={`Products in ${s.store_name}`}>
                                    <div className="inline-form" style={{ marginBottom: 8 }}>
                                      <select value={newStoreProduct.product_id} onChange={(e) => setNewStoreProduct(p => ({ ...p, product_id: e.target.value }))}>
                                        <option value="">Select product</option>
                                        {allProducts.map(p => (
                                          <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                      </select>
                                      <input type="number" placeholder="Qty" value={newStoreProduct.available_qty} onChange={(e) => setNewStoreProduct(p => ({ ...p, available_qty: Number(e.target.value) }))} />
                                      <input type="number" step="0.01" placeholder="Price" value={newStoreProduct.price} onChange={(e) => setNewStoreProduct(p => ({ ...p, price: Number(e.target.value) }))} />
                                      <input type="text" placeholder="Bin code" value={newStoreProduct.bin_code || ''} onChange={(e) => setNewStoreProduct(p => ({ ...p, bin_code: e.target.value }))} />
                                      <Button className="btn-primary-token" onClick={() => handleAddProductToStore(s.id)}><PlusCircle className="icon" /> Add</Button>
                                    </div>
                                    <table className="table">
                                      <thead>
                                        <tr>
                                          <th>Product</th>
                                          <th>Qty</th>
                                          <th>Price</th>
                                          <th>Bin</th>
                                          <th></th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(storeProducts[s.id] || []).map((sp: storeService.StoreProductDTO) => (
                                          <tr key={sp.id}>
                                            <td>{allProducts.find(p => p.id === sp.product_id)?.name || sp.product_id}</td>
                                            <td>{sp.available_qty}</td>
                                            <td>{sp.price}</td>
                                            <td>{sp.bin_code || '-'}</td>
                                            <td className="text-right">
                                              <button type="button" className="icon-btn-plain icon-danger" title="Remove" onClick={() => handleDeleteStoreProduct(s.id, sp.id)}>
                                                <Trash2 size={16} />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </TableCard>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <AnimatePresence>
                    {isMapOpen && (
                      <LocationPicker
                        onClose={() => setIsMapOpen(false)}
                        onLocationSelect={(lat, lng) => {
                          setNewStore(s => ({ ...s, latitude: lat, longitude: lng }));
                          notify.success('Location selected from map');
                          setIsMapOpen(false);
                        }}
                        initialPosition={[newStore.latitude || 51.505, newStore.longitude || -0.09]}
                      />
                    )}
                  </AnimatePresence>
                </>
              )}
            </TableCard>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="tab-panel">
            <TableCard
              variant="inbound"
              title="Products"
              search={<input className="filter-input" placeholder="Filter products…" value={filterText} onChange={(e)=>setFilterText(e.target.value)} />}
              actions={<Button className="btn-primary-token" onClick={()=>setCreateProductOpen(true)}><PlusCircle className="icon"/> Add Product</Button>}
              footer={
                <>
                  <span style={{fontSize:12,color:'var(--color-text-dim)'}}>Total products: {filteredProducts.length}</span>
                  <div style={{display:'inline-flex',gap:6,alignItems:'center'}}>
                    <button type="button" className="pager-btn" title="Previous" disabled={productPage<=1} onClick={()=>setProductPage(p=>Math.max(1,p-1))}><ChevronLeft size={16}/></button>
                    <span style={{fontSize:12}}>Page {productPage} / {productPageCount}</span>
                    <button type="button" className="pager-btn" title="Next" disabled={productPage>=productPageCount} onClick={()=>setProductPage(p=>Math.min(productPageCount,p+1))}><ChevronRight size={16}/></button>
                  </div>
                </>
              }
            >
              {createProductOpen && (
                <div className="nested-card" style={{ marginBottom: 12 }}>
                  <h5>New Product</h5>
                  <div className="form-grid">
                      <div className="form-group">
                        <label>Name</label>
                        <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Apple iPhone Case" />
                      </div>
                      <div className="form-group">
                        <label>SKU</label>
                        <input value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} placeholder="e.g., IPH-CASE-001" />
                      </div>
                      <div className="form-group">
                        <label>Price</label>
                        <input type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: Number(e.target.value) }))} placeholder="0.00" />
                      </div>
                      <div className="form-group form-group-span-2">
                        <label>Description</label>
                        <input value={newProduct.description || ''} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <Button className="btn-outline-token" onClick={() => setCreateProductOpen(false)}>Cancel</Button>
                      <Button className="btn-primary-token" onClick={handleAddProduct}><PlusCircle className="icon" /> Add Product</Button>
                    </div>
                  </div>
                )}

                {products.length === 0 && !createProductOpen ? (
                  <div className="nested-card" style={{ marginTop: 12 }}>
                    <div className="empty-state">
                      <h2>No products yet</h2>
                      <p>Add a product to start mapping to stores.</p>
                      <Button className="btn-primary-token" onClick={() => setCreateProductOpen(true)}><PlusCircle className="icon" /> Add Product</Button>
                    </div>
                  </div>
                ) : (
                  <table className="table">
                    <thead><tr><th>Product</th><th>SKU</th><th>Price</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                      {pagedProducts.map(p => (
                        <tr key={p.id}>
                          <td>
                            {editingProductId === p.id ? (
                              <input value={editProduct.name ?? ''} onChange={e => setEditProduct(ep => ({ ...ep, name: e.target.value }))} />
                            ) : (
                              <>
                                {p.name}
                                {p.sku && <span className="product-sku">[{p.sku}]</span>}
                              </>
                            )}
                          </td>
                          <td>{editingProductId === p.id ? (<input value={editProduct.sku ?? ''} onChange={e => setEditProduct(ep => ({ ...ep, sku: e.target.value }))} />) : p.sku}</td>
                          <td>{editingProductId === p.id ? (<input type="number" step="0.01" value={editProduct.price ?? 0} onChange={e => setEditProduct(ep => ({ ...ep, price: Number(e.target.value) }))} />) : p.price}</td>
                          <td className="text-right">
                            {editingProductId === p.id ? (
                              <div className="row-actions" style={{display:'inline-flex',gap:8}}>
                                <button type="button" className="icon-btn-plain icon-success" title="Save" onClick={saveEditProduct}><Save size={16}/></button>
                                <button type="button" className="icon-btn-plain icon-danger" title="Cancel" onClick={cancelEditProduct}><X size={16}/></button>
                              </div>
                            ) : (
                              <div className="row-actions" style={{display:'inline-flex',gap:10}}>
                                <button type="button" className="action-link success" onClick={() => startEditProduct(p)}>
                                  <Edit size={16}/> Edit
                                </button>
                                <button type="button" className="action-link danger" onClick={() => deleteProduct(p.id)}>
                                  <Trash2 size={16}/> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </TableCard>
          </div>
        )}
      </motion.div>
    </motion.div>
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

export default VendorDetails;
