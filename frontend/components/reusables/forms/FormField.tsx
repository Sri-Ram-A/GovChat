import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  label?: string;
  value?: string | number;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string | undefined;
  leadingIcon?: React.ReactNode;
  onChange?: (value: string) => void;
  className?: string;
};

export default function FormField({
  id,
  label,
  value,
  placeholder,
  type = "text",
  required,
  error,
  leadingIcon,
  onChange,
  className,
}: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}

      <div className="relative">
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {leadingIcon}
          </div>
        )}

        <Input
          id={id}
          name={id}
          type={type as any}
          value={value as any}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("input-focus h-11", leadingIcon && "pl-10", error && "border-destructive")}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
