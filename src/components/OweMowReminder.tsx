import React from 'react';
import './OweMowReminder.css';

interface OweMowReminderProps {
  lotNumber: string;
  residentName: string;
  amountOwed: number;
  phone?: string;
  email?: string;
}

const OweMowReminder: React.FC<OweMowReminderProps> = ({ lotNumber, residentName, amountOwed, phone, email }) => {
  const sendText = () => {
    if (!phone) { alert('No phone number on file for this lot.'); return; }
    const msg = encodeURIComponent(`Hi ${residentName}, this is Magnolia Estates. You have an outstanding mowing balance of ${amountOwed.toFixed(2)} on lot ${lotNumber}. Please pay or schedule the mow. Thank you!`);
    window.open(`sms:${phone}?body=${msg}`);
  };

  const sendEmail = () => {
    if (!email) { alert('No email on file for this lot.'); return; }
    const subject = encodeURIComponent(`Outstanding Mowing Balance - Lot ${lotNumber}`);
    const body = encodeURIComponent(`Hi ${residentName},\n\nYou have an outstanding mowing balance of ${amountOwed.toFixed(2)} on lot ${lotNumber}. Please remit payment or schedule the mow at your earliest convenience.\n\nThank you,\nMagnolia Estates`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="owe-mow-reminder">
      <button className="remind-btn text-btn" onClick={sendText} title="Send text reminder">📱 Text</button>
      <button className="remind-btn email-btn" onClick={sendEmail} title="Send email reminder">✉️ Email</button>
    </div>
  );
};

export default OweMowReminder;