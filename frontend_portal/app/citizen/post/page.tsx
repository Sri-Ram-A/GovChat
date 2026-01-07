"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/reusables/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputField } from "@/components/reusables/input-field"
import { TextareaField } from "@/components/reusables/textarea-field"
import { SelectField } from "@/components/reusables/select-field"
import { api } from "@/services/api"
import { getStoredToken, clearStoredToken } from "@/services/helpers"
import { validators } from "@/services/validators"

export default function FileComplaintPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    address_line_1: "",
    address_line_2: "",
    landmark: "",
    city: "",
    pincode: "",
  })

  useEffect(() => {
    const token = getStoredToken()
    if (!token) router.push("/citizen/login")
    else {
      api.departments
        .list(token)
        .then(setDepartments)
        .catch(() => setDepartments([]))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!form.title.trim()) newErrors.title = "Title required"
    if (!form.description.trim()) newErrors.description = "Description required"
    if (!form.department) newErrors.department = "Select a department"
    if (!form.pincode) newErrors.pincode = "Pincode required"
    if (form.pincode && !validators.pincode(form.pincode)) newErrors.pincode = "Invalid pincode"

    if (Object.keys(newErrors).length > 0) return setErrors(newErrors)

    setLoading(true)
    try {
      const token = getStoredToken()
      await api.complaints.create(form, token!)
      router.push("/citizen/home")
    } catch {
      setErrors({ submit: "Failed to file complaint" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar
        onLogout={() => {
          clearStoredToken()
          router.push("/citizen/login")
        }}
      />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>File a Complaint</CardTitle>
            <CardDescription>Provide details about your issue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                error={errors.title}
                placeholder="Brief title of complaint"
              />
              <TextareaField
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                error={errors.description}
                placeholder="Detailed description"
              />
              <SelectField
                label="Department"
                options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
                value={form.department}
                onValueChange={(val) => setForm({ ...form, department: val })}
                error={errors.department}
              />
              <InputField
                label="Address Line 1"
                value={form.address_line_1}
                onChange={(e) => setForm({ ...form, address_line_1: e.target.value })}
              />
              <InputField
                label="Address Line 2 (Optional)"
                value={form.address_line_2}
                onChange={(e) => setForm({ ...form, address_line_2: e.target.value })}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                <InputField
                  label="Pincode"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  error={errors.pincode}
                />
              </div>
              {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}
              <Button disabled={loading} className="w-full">
                {loading ? "Filing..." : "File Complaint"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
