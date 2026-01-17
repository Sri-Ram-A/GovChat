import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'solid' | 'transparent';
  width?: string;
  height?: string;
}

export default function GlassCard({ children, variant = 'solid', width = '400px', height }: GlassCardProps) {
  const backgrounds = {
    solid: 'rgba(15, 15, 35, 0.6)',
    transparent: 'rgba(15, 15, 35, 0)'
  };

  return (
    <div style={{
      padding: '48px 40px',
      background: backgrounds[variant],
      backdropFilter: 'blur(10px)',
      minHeight: height || '500px',
      width: width,
      borderRadius: '24px'
    }}>
      {children}
    </div>
  );
}