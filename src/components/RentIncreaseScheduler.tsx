import React, { useState, useEffect } from 'react';
import './RentIncreaseScheduler.css';

interface ScheduledIncrease {
  id: string;
  lotNumber: string;
  currentRent: number;
  newRent: number;
  type: 'percent' | 'flat';
  value: number;
  effectiveDate: string;
  status: 'pending' | 'applied';
}

const RentIncreaseScheduler: React.FC = () => {
  const [increases, setIncreases] = useState<ScheduledIncrease[]>([]);
  const [lotNumber, setLotNumber] = useState('');
  const [currentRent, setCurrentRent] = useState<number | ''>('');
  const [type, setType] = useState<'percent' | 'flat'>('percent');
  const [value, setValue] = useState<number | ''>('');
  const [effectiveDate, setEffectiveDate] = useState('2026-08-01');
  const [parkWide, setParkWide] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rent-increases');
    if (saved) setIncreases(JSON.parse(saved));
  }, []);

  const save = (next: ScheduledIncrease[]) => {
    setIncreases(next);
    localStorage.setItem('rent-increases', JSON.stringify(next));
  };

  const add = () => {
    if (!currentRent || !value) return;
    const delta = type === 'percent' ? currentRent * (Number(value) / 100) : Number(value);
    const entry: ScheduledIncrease = {
      id: Date.now().toString(),
      lotNumber: parkWide ? 'ALL' : lotNumber,
      currentRent: Number(currentRent),
      newRent: Number(currentRent) + delta,
      type,
      value: Number(value),
      effectiveDate,
      status: 'pending'
    };
    save([entry, ...increases]);
    setLotNumber(''); setCurrentRent(''); setValue('');
  };

  const apply = (id: string) => {
    save(increases.map(i => i.id === id ? { ...i, status: 'applied' as const } : i));
  };

  useEffect(() => {
    const check = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      const due = increases.filter(i => i.status === 'pending' && i.effectiveDate <= today);
      if (due.length > 0) {
        save(increases.map(i => due.find(d => d.id === i.id) ? { ...i, status: 'applied' as const } : i));
      }
    }, 60000);
    return () => clearInterval(check);
  }, [increases]);

  const pending = increases.filter(i => i.status === 'pending');
  const applied = increases.filter(i => i.status === 'applied');

  return (
    <div className="rent-increase">
      <h3>Rent Increase Scheduler</h3>
      <div className="rent-increase__form">
        <label><input type="checkbox" checked={parkWide} onChange={e => setParkWide(e.target.checked)} /> Park-wide</label>
        {!parkWide && <label>Lot<input type="text" value={lotNumber} onChange={e => setLotNumber(e.target.value)} /></label>}
        <label>Current Rent<input type="number" value={currentRent} onChange={e => setCurrentRent(e.target.value ? Number(e.target.value) : '')} /></label>
        <label>Type
          <select value={type} onChange={e => setType(e.target.value as any)}>
            <option value="percent">Percent</option>
            <option value="flat">Flat $</option>
          </select>
        </label>
        <label>Value<input type="number" value={value} onChange={e => setValue(e.target.value ? Number(e.target.value) : '')} /></label>
        <label>Effective Date<input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} /></label>
        <button onClick={add}>Schedule</button>
      </div>
      <h4>Pending ({pending.length})</h4>
      {pending.map(i => (
        <div key={i.id} className="rent-increase__card">
          <div>Lot {i.lotNumber === 'ALL' ? 'Park-wide' : i.lotNumber}: ${i.currentRent} → ${i.newRent.toFixed(2)} ({i.type === 'percent' ? i.value + '%' : '$' + i.value})</div>
          <div>Effective {i.effectiveDate}</div>
          <button onClick={() => apply(i.id)} className="apply-btn">Apply Now</button>
        </div>
      ))}
      <h4>Applied ({applied.length})</h4>
      {applied.slice(0, 10).map(i => (
        <div key={i.id} className="rent-increase__card applied">
          Lot {i.lotNumber === 'ALL' ? 'Park-wide' : i.lotNumber}: ${i.currentRent} → ${i.newRent.toFixed(2)} on {i.effectiveDate}
        </div>
      ))}
    </div>
  );
};

export default RentIncreaseScheduler;