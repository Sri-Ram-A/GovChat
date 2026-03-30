import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'pill';
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles = {
    default: {
      display: 'inline-block',
      padding: '6px 16px',
      background: 'rgba(100, 100, 120, 0.4)',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600' as const,
      color: '#d0d0d8',
      letterSpacing: '0.5px'
    },
    pill: {
      display: 'inline-block',
      padding: '8px 16px',
      background: 'rgba(100, 100, 120, 0.3)',
      borderRadius: '20px',
      fontSize: '13px',
      color: '#c0c0d0'
    }
  };

  return <div style={styles[variant]}>{children}</div>;
}