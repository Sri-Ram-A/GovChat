"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface SelectFieldProps {
  label: string
  options: { value: string; label: string }[]
  value?: string
  onValueChange: (value: string) => void
  error?: string
  placeholder?: string
}

export function SelectField({ label, options, error, ...props }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select {...props}>
        <SelectTrigger className={error ? "border-destructive" : ""}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
