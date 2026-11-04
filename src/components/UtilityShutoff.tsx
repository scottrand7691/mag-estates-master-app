import React, { useState, useEffect } from 'react';
import './UtilityShutoff.css';

interface Shutoff {
  utility: string;
  date: string;
  reason: string;
  restored?: string;
}

interface UtilityShutoffProps {
  lotNumber: string;
  isEmpty?: boolean;
}

const UTILITIES = ['Water', 'Electric', 'Sewer', 'Gas'];
const REASONS = ['Nonpayment', 'Resident request', 'Maintenance', 'Vacancy', 'Other'];

const UtilityShutoff: React.FC<UtilityShutoffProps> = ({ lotNumber, isEmpty }) => {
  const [shutoffs, setShutoffs] = useState<Shutoff[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`shutoff-${lotNumber}`);
    if (saved) setShutoffs(JSON.parse(saved));
    else if (isEmpty) {
      const defaults: Shutoff[] = [
        { utility: 'Water', date: new Date().toISOString().split('T')[0], reason: 'Vacancy' },
        { utility: 'Electric', date: new Date().toISOString().split('T')[0], reason: 'Vacancy' }
      ];
      setShutoffs(defaults);
      localStorage.setItem(`shutoff-${lotNumber}`, JSON.stringify(defaults));
      const noteKey = `lot-note-${lotNumber}`;
      const existing = localStorage.getItem(noteKey) || '';
      if (!existing.includes('empty, no shutoff on record')) {
        localStorage.setItem(noteKey, existing + (existing ? '\n' : '') + 'empty, no shutoff on record — verify utilities are off.');
      }
    }
  }, [lotNumber, isEmpty]);

  const save = (next: Shutoff[]) => {
    setShutoffs(next);
    localStorage.setItem(`shutoff-${lotNumber}`, JSON.stringify(next));
  };

  const addShutoff = () => {
    save([...shutoffs, { utility: 'Water', date: new Date().toISOString().split('T')[0], reason: 'Nonpayment' }]);
  };

  const restore = (idx: number) => {
    const next = [...shutoffs];
    next[idx] = { ...next[idx], restored: new Date().toISOString().split('T')[0] };
    save(next);
  };

  const update = (idx: number, field: string, value: string) => {
    const next = [...shutoffs];
    next[idx] = { ...next[idx], [field]: value };
    save(next);
  };

  const active = shutoffs.filter(s => !s.restored);

  return (
    <div className="utility-shutoff">
      <h4>Utility Shutoffs</h4>
      {active.length > 0 && <div className="utility-shutoff__banner">⚠️ {active.map(s => s.utility).join(', ')} OFF</div>}
      {shutoffs.map((s, i) => (
        <div key={i} className={`utility-shutoff__row ${s.restored ? 'restored' : ''}`}>
          <select value={s.utility} onChange={e => update(i, 'utility', e.target.value)} disabled={!!s.restored}>{(UTILITIES).map(u => <option key={u} value={u}>{u}</option>)}</select>
          <input type="date" value={s.date} onChange={e => update(i, 'date', e.target.value)} disabled={!!s.restored} />
          <select value={s.reason} onChange={e => update(i, 'reason', e.target.value)} disabled={!!s.restored}>{(REASONS).map(r => <option key={r} value={r}>{r}</option>)}</select>
          {s.restored ? <span className="restored-tag">Restored {s.restored}</span> : <button onClick={() => restore(i)} className="restore-btn">Restore</button>}
        </div>
      ))}
      <button className="add-btn" onClick={addShutoff}>+ Log Shutoff</button>
    </div>
  );
};

export default UtilityShutoff;