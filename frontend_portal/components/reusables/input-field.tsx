"use client"

import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helper?: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helper, className, ...props }, ref) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        ref={ref}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  )
)

InputField.displayName = "InputField"
