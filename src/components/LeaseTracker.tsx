import React, { useState, useEffect } from 'react';
import './LeaseTracker.css';

interface Lease {
  lotNumber: string;
  endDate: string;
  termMonths?: number;
  notes?: string;
}

interface LeaseTrackerProps {
  lotNumber: string;
  onUpdate?: (lease: Lease) => void;
}

const LeaseTracker: React.FC<LeaseTrackerProps> = ({ lotNumber, onUpdate }) => {
  const [lease, setLease] = useState<Lease | null>(null);
  const [endDate, setEndDate] = useState('');
  const [termMonths, setTermMonths] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`lease-${lotNumber}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setLease(parsed);
      setEndDate(parsed.endDate);
      setTermMonths(parsed.termMonths || '');
      setNotes(parsed.notes || '');
    }
  }, [lotNumber]);

  const saveLease = () => {
    if (!endDate) return;
    const newLease: Lease = { lotNumber, endDate, termMonths: termMonths || undefined, notes: notes || undefined };
    localStorage.setItem(`lease-${lotNumber}`, JSON.stringify(newLease));
    setLease(newLease);
    onUpdate && onUpdate(newLease);
  };

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (days: number) => {
    if (days < 0) return 'red';
    if (days < 30) return 'red';
    if (days < 90) return 'orange';
    return 'green';
  };

  const days = lease ? getDaysUntil(lease.endDate) : null;

  return (
    <div className="lease-tracker">
      <h4>Lease</h4>
      <div className="lease-form">
        <label>End Date<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
        <label>Term (months)<input type="number" value={termMonths} onChange={e => setTermMonths(e.target.value ? Number(e.target.value) : '')} /></label>
        <label>Notes<input type="text" value={notes} onChange={e => setNotes(e.target.value)} /></label>
        <button onClick={saveLease}>Save Lease</button>
      </div>
      {lease && days !== null && (
        <div className={`lease-status lease-status--${getStatusColor(days)}`}>
          {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days remaining`}
        </div>
      )}
      {days !== null && days < 90 && days >= 0 && (
        <div className="lease-warning">Renewal coming up — send notice soon.</div>
      )}
    </div>
  );
};

export default LeaseTracker;