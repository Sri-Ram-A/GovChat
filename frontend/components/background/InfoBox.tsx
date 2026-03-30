import React from 'react';

interface InfoBoxProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export default function InfoBox({ children, variant = 'primary' }: InfoBoxProps) {
  const variants = {
    primary: {
      background: 'rgba(65, 105, 225, 0.15)',
      border: '1px solid rgba(65, 105, 225, 0.3)'
    },
    secondary: {
      background: 'rgba(65, 105, 225, 0.1)',
      border: '1px solid rgba(65, 105, 225, 0.25)'
    }
  };

  return (
    <div style={{
      padding: '20px',
      background: variants[variant].background,
      border: variants[variant].border,
      borderRadius: '12px',
      marginBottom: '16px'
    }}>
      {children}
    </div>
  );
}