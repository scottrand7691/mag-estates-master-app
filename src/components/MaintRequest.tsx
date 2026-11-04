import React, { useState, useEffect, useRef } from 'react';
import './MaintRequest.css';

interface Request {
  id: string;
  lotNumber: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  photo?: string;
  status: 'open' | 'in_progress' | 'done';
  assignedTo: string;
  created: string;
}

const CATEGORIES = ['Leak', 'AC', 'Pest', 'Electrical', 'Plumbing', 'Roof', 'Appliance', 'Other'];

const MaintRequest: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [lotNumber, setLotNumber] = useState('');
  const [category, setCategory] = useState('Leak');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('maint-requests');
    if (saved) setRequests(JSON.parse(saved));
  }, []);

  const save = (next: Request[]) => {
    setRequests(next);
    localStorage.setItem('maint-requests', JSON.stringify(next));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!lotNumber || !description.trim()) return;
    const entry: Request = {
      id: Date.now().toString(),
      lotNumber,
      category,
      urgency,
      description: description.trim(),
      photo: photo || undefined,
      status: 'open',
      assignedTo: '',
      created: new Date().toISOString()
    };
    save([entry, ...requests]);
    setLotNumber(''); setDescription(''); setPhoto(null); setUrgency('medium');
  };

  const updateStatus = (id: string, status: Request['status']) => {
    save(requests.map(r => r.id === id ? { ...r, status } : r));
  };

  const updateAssign = (id: string, assignedTo: string) => {
    save(requests.map(r => r.id === id ? { ...r, assignedTo } : r));
  };

  const sorted = [...requests].sort((a, b) => {
    const order = { emergency: 0, high: 1, medium: 2, low: 3 };
    return order[a.urgency] - order[b.urgency];
  });

  return (
    <div className="maint-request">
      <h3>Maintenance Requests</h3>
      <div className="maint-request__form">
        <input placeholder="Lot number" value={lotNumber} onChange={e => setLotNumber(e.target.value)} />
        <select value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={urgency} onChange={e => setUrgency(e.target.value as any)}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="emergency">Emergency</option>
        </select>
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        <button onClick={() => photoRef.current && photoRef.current.click()}>📷 Photo</button>
        {photo && <img src={photo} alt="preview" className="photo-preview" />}
        <button className="submit-btn" onClick={submit}>Submit Request</button>
      </div>
      <div className="maint-request__queue">
        {sorted.map(r => (
          <div key={r.id} className={`maint-request__card urgency--${r.urgency} status--${r.status}`}>
            <div className="card-header">
              <strong>Lot {r.lotNumber}</strong> · {r.category} · <span className="urgency-tag">{r.urgency}</span>
              <span className="status-tag">{r.status.replace('_', ' ')}</span>
            </div>
            <p>{r.description}</p>
            {r.photo && <img src={r.photo} alt="" className="card-photo" />}
            <div className="card-meta">{new Date(r.created).toLocaleString()}</div>
            <div className="card-actions">
              <input placeholder="Assign to" value={r.assignedTo} onChange={e => updateAssign(r.id, e.target.value)} />
              {r.status !== 'done' && <button onClick={() => updateStatus(r.id, r.status === 'open' ? 'in_progress' : 'done')}>
                {r.status === 'open' ? 'Start' : 'Done'}</button>}
            </div>
          </div>
        ))}
        {sorted.length === 0 && <p className="empty">No requests yet.</p>}
      </div>
    </div>
  );
};

export default MaintRequest;