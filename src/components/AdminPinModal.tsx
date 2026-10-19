import React, { useState } from 'react';
import { Lock, ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';

interface AdminPinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ onSuccess, onCancel }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (index: number, val: string) => {
    // Only accept numeric digit
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = cleaned;
    setPin(newPin);
    setError('');

    // Auto-focus next input via DOM id
    if (cleaned && index < 3) {
      const nextInput = document.getElementById(`admin-pin-digit-${index + 1}`);
      nextInput?.focus();
    }

    // Auto submit if all 4 digits entered
    if (cleaned && index === 3 && newPin.every(d => d !== '')) {
      verifyPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`admin-pin-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyPin = (fullPin: string) => {
    setIsVerifying(true);
    const correctPin = import.meta.env.VITE_ADMIN_PIN || '1234';

    setTimeout(() => {
      if (fullPin === correctPin) {
        onSuccess();
      } else {
        setError('รหัส PIN 4 หลักไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setPin(['', '', '', '']);
        setIsVerifying(false);
        const firstInput = document.getElementById('admin-pin-digit-0');
        firstInput?.focus();
      }
    }, 200);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 15, 15, 0.7)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--notion-border)',
        borderRadius: 'var(--radius-md)',
        width: '100%',
        maxWidth: '400px',
        padding: '32px 28px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        textAlign: 'center'
      }}>
        {/* Icon */}
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: 'var(--notion-sidebar)',
          border: '1px solid var(--notion-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--notion-text)'
        }}>
          <KeyRound size={24} strokeWidth={2} />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '24px' }}>
          กรอกรหัส PIN ผู้ดูแลระบบ
        </h2>

        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Digit Boxes */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
          {pin.map((digit, idx) => (
            <input
              key={idx}
              id={`admin-pin-digit-${idx}`}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoFocus={idx === 0}
              value={digit}
              disabled={isVerifying}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: '56px',
                height: '62px',
                fontSize: '1.8rem',
                textAlign: 'center',
                fontWeight: 700,
                borderRadius: 'var(--radius-xs)',
                border: digit ? '2px solid var(--notion-text)' : '1px solid var(--notion-border-dark)',
                backgroundColor: digit ? '#fafafa' : '#ffffff',
                color: 'var(--notion-text)',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isVerifying}
            className="notion-btn notion-btn-subtle"
            style={{ flex: 1, padding: '10px', fontSize: '0.9rem', justifyContent: 'center' }}
          >
            <ArrowLeft size={15} />
            <span>ยกเลิก</span>
          </button>
          
          <button
            type="button"
            disabled={isVerifying || pin.some(d => d === '')}
            onClick={() => verifyPin(pin.join(''))}
            className="notion-btn notion-btn-primary"
            style={{ flex: 1.4, padding: '10px', fontSize: '0.9rem', justifyContent: 'center', opacity: pin.every(d => d !== '') ? 1 : 0.6 }}
          >
            <Lock size={15} />
            <span>{isVerifying ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส PIN'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
