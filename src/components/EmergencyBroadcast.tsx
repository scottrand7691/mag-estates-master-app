import React, { useState, useEffect } from 'react';
import './EmergencyBroadcast.css';

interface Broadcast {
  id: string;
  date: string;
  message: string;
  recipients: number;
  target: string;
}

const EmergencyBroadcast: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [history, setHistory] = useState<Broadcast[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('broadcast-history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const send = () => {
    if (!message.trim()) return;
    const entry: Broadcast = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      message: message.trim(),
      recipients: target === 'all' ? 134 : 0,
      target
    };
    const next = [entry, ...history].slice(0, 100);
    setHistory(next);
    localStorage.setItem('broadcast-history', JSON.stringify(next));
    setMessage('');
    setOpen(false);
    alert('Broadcast sent to ' + (target === 'all' ? 'all lots' : target) + '. Logged with timestamp.');
  };

  return (
    <div className="emergency-broadcast">
      <button className="emergency-broadcast__btn" onClick={() => setOpen(true)}>
        🚨 EMERGENCY BROADCAST
      </button>
      {open && (
        <div className="emergency-broadcast__panel">
          <h3>Emergency Broadcast</h3>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." rows={4} />
          <select value={target} onChange={e => setTarget(e.target.value)}>
            <option value="all">All lots</option>
            <option value="occupied">Occupied only</option>
            <option value="street">By street</option>
            <option value="selected">Selected lots</option>
          </select>
          <div className="emergency-broadcast__actions">
            <button onClick={send} className="send-btn">Send</button>
            <button onClick={() => setOpen(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}
      <div className="emergency-broadcast__history">
        <h4>Broadcast History</h4>
        {history.length === 0 && <p className="empty">No broadcasts sent yet.</p>}
        {history.map(b => (
          <div key={b.id} className="emergency-broadcast__entry">
            <div className="entry-date">{new Date(b.date).toLocaleString()}</div>
            <div className="entry-msg">{b.message}</div>
            <div className="entry-meta">{b.target} · {b.recipients} lots</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyBroadcast;