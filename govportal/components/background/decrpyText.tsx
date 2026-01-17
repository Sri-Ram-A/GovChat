"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DecryptedText from "@/components/DecryptedText";

interface AnimatedInputProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'input' | 'textarea';
  draftComplaintId: number | null;
  fieldKey: string;
}

export default function AnimatedInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'input',
  draftComplaintId,
  fieldKey
}: AnimatedInputProps) {
  const [isEditing, setIsEditing] = useState(false);

  const shouldShowAnimation = draftComplaintId && value && !isEditing;

  if (type === 'textarea') {
    return (
      <div>
        <Label style={{ color: 'white', marginBottom: '8px', display: 'block' }}>{label}</Label>
        {shouldShowAnimation ? (
          <div 
            onClick={() => setIsEditing(true)}
            style={{ 
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              minHeight: '80px'
            }}
          >
            <DecryptedText 
              text={value} 
              animateOn="view" 
              speed={30}
              sequential={true}
              revealDirection="start"
            />
          </div>
        ) : (
          <Textarea
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus={isEditing}
            style={{ minHeight: '80px' }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <Label style={{ color: 'white', marginBottom: '8px', display: 'block' }}>{label}</Label>
      {shouldShowAnimation ? (
        <div 
          onClick={() => setIsEditing(true)}
          style={{ 
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            minHeight: '44px'
          }}
        >
          <DecryptedText 
            text={value} 
            animateOn="view" 
            speed={30}
            sequential={true}
            revealDirection="start"
          />
        </div>
      ) : (
        <input
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus={isEditing}
          style={{ 
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px'
          }}
        />
      )}
    </div>
  );
}