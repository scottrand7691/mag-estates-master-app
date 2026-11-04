import React, { useState, useEffect } from 'react';
import './VendorDirectory.css';

interface VendorDoc {
  provider: string;
  policyNumber: string;
  uploadDate: string;
  expirationDate: string;
  status: 'current' | 'expiring' | 'expired' | 'missing';
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  licenseNumber: string;
  notes: string;
  liability: VendorDoc;
  workersComp: VendorDoc;
  businessLicense: VendorDoc;
}

const VendorDirectory: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('vendorDirectory');
    return saved ? JSON.parse(saved) : [getDefaultVendor()];
  });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('vendorDirectory', JSON.stringify(vendors));
  }, [vendors]);

  const getDocStatus = (doc: VendorDoc): VendorDoc['status'] => {
    if (!doc.provider || !doc.expirationDate) return 'missing';
    const exp = new Date(doc.expirationDate);
    const now = new Date();
    const daysUntil = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return 'expired';
    if (daysUntil <= 30) return 'expiring';
    return 'current';
  };

  const isApproved = (vendor: Vendor): boolean => {
    return getDocStatus(vendor.liability) === 'current' &&
           getDocStatus(vendor.workersComp) === 'current' &&
           getDocStatus(vendor.businessLicense) === 'current';
  };

  const filteredVendors = vendors.filter(v => {
    if (filter === 'approved') return isApproved(v);
    if (filter === 'pending') return !isApproved(v);
    return true;
  });

  const addVendor = (vendor: Omit<Vendor, 'id'>) => {
    const newVendor: Vendor = { ...vendor, id: Date.now().toString() };
    setVendors([...vendors, newVendor]);
    setShowForm(false);
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors(vendors.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVendor = (id: string) => {
    if (confirm('Remove this vendor?')) {
      setVendors(vendors.filter(v => v.id !== id));
    }
  };

  const statusColor = (status: VendorDoc['status']) => {
    switch (status) {
      case 'current': return 'status-current';
      case 'expiring': return 'status-expiring';
      case 'expired': return 'status-expired';
      case 'missing': return 'status-missing';
    }
  };

  const statusLabel = (status: VendorDoc['status']) => {
    switch (status) {
      case 'current': return 'Current';
      case 'expiring': return 'Expiring Soon';
      case 'expired': return 'Expired';
      case 'missing': return 'Missing';
    }
  };

  return (
    <div className="vendor-directory">
      <div className="vd-header">
        <h2>Vendor Directory</h2>
        <div className="vd-filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>Approved</button>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>+ Add Vendor</button>
        </div>
      </div>

      {showForm && (
        <VendorForm onSubmit={addVendor} onCancel={() => setShowForm(false)} />
      )}

      <div className="vd-list">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="vd-card">
            <div className="vd-card-header" onClick={() => setExpandedId(expandedId === vendor.id ? null : vendor.id)}>
              <div>
                <h3>{vendor.name}</h3>
                <span className="vd-category">{vendor.category}</span>
              </div>
              <div className="vd-card-status">
                {isApproved(vendor) ? (
                  <span className="status-current">✓ Approved</span>
                ) : (
                  <span className="status-pending">Pending Docs</span>
                )}
                <span className="vd-expand">{expandedId === vendor.id ? '▼' : '▶'}</span>
              </div>
            </div>
            {expandedId === vendor.id && (
              <div className="vd-card-body">
                <div className="vd-contact">
                  <p><strong>Phone:</strong> {vendor.phone || '—'}</p>
                  <p><strong>Email:</strong> {vendor.email || '—'}</p>
                  <p><strong>License #:</strong> {vendor.licenseNumber || '—'}</p>
                </div>
                <div className="vd-docs">
                  <h4>Required Documents (1-year validity)</h4>
                  <DocRow label="Liability Insurance" doc={vendor.liability} statusClass={statusColor(getDocStatus(vendor.liability))} statusLabel={statusLabel(getDocStatus(vendor.liability))} onUpdate={(doc) => updateVendor(vendor.id, { liability: doc })} />
                  <DocRow label="Workers' Comp" doc={vendor.workersComp} statusClass={statusColor(getDocStatus(vendor.workersComp))} statusLabel={statusLabel(getDocStatus(vendor.workersComp))} onUpdate={(doc) => updateVendor(vendor.id, { workersComp: doc })} />
                  <DocRow label="Business License" doc={vendor.businessLicense} statusClass={statusColor(getDocStatus(vendor.businessLicense))} statusLabel={statusLabel(getDocStatus(vendor.businessLicense))} onUpdate={(doc) => updateVendor(vendor.id, { businessLicense: doc })} />
                </div>
                {vendor.notes && <p className="vd-notes"><strong>Notes:</strong> {vendor.notes}</p>}
                <button className="delete-btn" onClick={() => deleteVendor(vendor.id)}>× Remove Vendor</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  function getDefaultVendor(): Vendor {
    return {
      id: 'default-cool-cat-pat',
      name: 'Cool Cat Pat AC Repair',
      category: 'AC / HVAC',
      phone: '',
      email: '',
      licenseNumber: '',
      notes: 'Default AC vendor for jobs beyond handyman scope.',
      liability: { provider: '', policyNumber: '', uploadDate: '', expirationDate: '', status: 'missing' },
      workersComp: { provider: '', policyNumber: '', uploadDate: '', expirationDate: '', status: 'missing' },
      businessLicense: { provider: '', policyNumber: '', uploadDate: '', expirationDate: '', status: 'missing' },
    };
  }

  return null;

function DocRow({ label, doc, statusClass, statusLabel, onUpdate }: {
  label: string;
  doc: VendorDoc;
  statusClass: string;
  statusLabel: string;
  onUpdate: (doc: VendorDoc) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(doc);

  const handleSave = () => {
    const uploadDate = form.provider && !form.expirationDate ? new Date().toISOString().split('T')[0] : form.expirationDate;
    let expirationDate = form.expirationDate;
    if (uploadDate && !expirationDate) {
      const d = new Date(uploadDate);
      d.setFullYear(d.getFullYear() + 1);
      expirationDate = d.toISOString().split('T')[0];
    }
    onUpdate({ ...form, uploadDate, expirationDate });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="doc-row editing">
        <span className="doc-label">{label}</span>
        <input placeholder="Provider" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} />
        <input placeholder="Policy #" value={form.policyNumber} onChange={e => setForm({ ...form, policyNumber: e.target.value })} />
        <button onClick={handleSave}>Save</button>
        <button onClick={() => setEditing(false)}>×</button>
      </div>
    );
  }

  return (
    <div className="doc-row">
      <span className="doc-label">{label}</span>
      <span className={statusClass}>{statusLabel}</span>
      {doc.expirationDate && <span className="doc-expiry">Exp: {doc.expirationDate}</span>}
      <button onClick={() => setEditing(true)}>✎</button>
    </div>
  );
}

function VendorForm({ onSubmit, onCancel }: {
  onSubmit: (vendor: Omit<Vendor, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Vendor, 'id'>>(() => {
    const v = getDefaultVendor();
    const { id, ...rest } = v;
    return rest;
  });

  return (
    <div className="vd-form">
      <h3>Add Vendor</h3>
      <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
      <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      <input placeholder="License Number" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
      <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      <div className="vd-form-actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onSubmit(form)} className="submit-btn">Add Vendor</button>
      </div>
    </div>
  );
}
}

export default VendorDirectory;