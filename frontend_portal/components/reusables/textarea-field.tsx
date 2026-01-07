"use client"

import type React from "react"

import { forwardRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({ label, error, ...props }, ref) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Textarea ref={ref} className={error ? "border-destructive" : ""} {...props} />
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
))
TextareaField.displayName = "TextareaField"
