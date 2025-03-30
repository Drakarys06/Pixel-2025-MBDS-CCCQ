import React, { useState, useEffect, useRef } from 'react';
import '../../styles/components/ActivityList.css';

interface DeleteConfirmationProps {
  username: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  username,
  onCancel,
  onConfirm
}) => {
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fermer la modal en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current === event.target) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  // Focus sur l'input de confirmation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (modalRef.current) {
        const input = modalRef.current.querySelector('input');
        if (input) input.focus();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Gérer la soumission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmation !== username) {
      setError(`Please type "${username}" to confirm deletion`);
      return;
    }
    
    onConfirm();
  };

  return (
    <>
      <div className="delete-confirmation-overlay" ref={overlayRef}></div>
      <div className="delete-confirmation" ref={modalRef}>
        <h3>Delete Your Account</h3>
        <p>This action is permanent and cannot be undone. All your data will be permanently removed.</p>
        
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Your profile and personal data will be removed</li>
          <li>Your pixels will remain but will be anonymous</li>
          <li>Boards you've created will show "Deleted User" as creator</li>
        </ul>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="message error">{error}</div>}
          
          <div className="delete-confirm-input">
            <label htmlFor="confirmation">
              Please type <strong>{username}</strong> to confirm:
            </label>
            <input
              type="text"
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={`Type "${username}" to confirm`}
            />
          </div>
          
          <div className="delete-confirmation-buttons">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-logout" 
              disabled={confirmation !== username}
              style={{ 
                backgroundColor: confirmation === username ? 'rgba(255, 0, 0, 0.1)' : 'var(--disabled-bg, #f5f5f5)',
                borderColor: confirmation === username ? '#e53935' : 'var(--border-color)',
                color: confirmation === username ? '#e53935' : 'var(--disabled-color, #999)',
                cursor: confirmation === username ? 'pointer' : 'not-allowed'
              }}
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default DeleteConfirmation;