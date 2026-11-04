import React, { useState, useEffect, useRef } from 'react';
import './ResidentPhoto.css';

interface ResidentPhotoProps {
  lotNumber: string;
}

const ResidentPhoto: React.FC<ResidentPhotoProps> = ({ lotNumber }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`photo-${lotNumber}`);
    if (saved) setPhoto(saved);
  }, [lotNumber]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      localStorage.setItem(`photo-${lotNumber}`, result);
      setPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    localStorage.removeItem(`photo-${lotNumber}`);
    setPhoto(null);
  };

  return (
    <div className="resident-photo">
      {photo ? (
        <div className="resident-photo__wrap">
          <img src={photo} alt="Resident" className="resident-photo__img" />
          <button className="resident-photo__remove" onClick={removePhoto} title="Remove">×</button>
          <button className="resident-photo__change" onClick={() => inputRef.current && inputRef.current.click()}>Change</button>
        </div>
      ) : (
        <button className="resident-photo__placeholder" onClick={() => inputRef.current && inputRef.current.click()}>
          + Add Photo
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
    </div>
  );
};

export default ResidentPhoto;