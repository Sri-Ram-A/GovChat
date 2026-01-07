"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { InputField } from "@/components/reusables/input-field"
import { REQUEST } from "@/services/api"
import { validators } from "@/services/validators"
import { setStoredToken } from "@/services/helpers"
import type { RegisterForm, FormErrors } from "@/types"

const initialForm: RegisterForm = {
  username: "",
  email: "",
  password: "",
  phone_number: "",
  address: "",
  gender: "",
  city: "",
  state_province: "",
  postal_code: "",
  date_of_birth: undefined,
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<RegisterForm>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  const update = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: FormErrors = {}

    if (!validators.username(form.username)) nextErrors.username = "3–30 chars, letters/numbers/_"
    if (!validators.email(form.email)) nextErrors.email = "Invalid email"
    if (!validators.password(form.password)) nextErrors.password = "Minimum 8 characters"
    if (form.phone_number && !validators.phone(form.phone_number))
      nextErrors.phone_number = "Invalid phone number"
    if (form.date_of_birth && form.date_of_birth > new Date())
      nextErrors.date_of_birth = "Date cannot be in the future"

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...form,
        date_of_birth: form.date_of_birth?.toISOString().split("T")[0],
      }

      const res = await REQUEST("POST", "auth/register/", payload)
      setStoredToken(res.access)
      router.push("/citizen/home")
    } catch (err: any) {
      setErrors({ submit: err.message || "Registration failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Background */}
      <Image
        src="https://images.unsplash.com/photo-1521791136064-7986c2920216"
        alt="Civic background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <Card className="relative w-full max-w-2xl shadow-2xl bg-background/90">
        <CardHeader>
          <CardTitle className="text-3xl">Create your account</CardTitle>
          <CardDescription>
            Access citizen services with a single secure login
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <InputField
                label="Username"
                value={form.username}
                error={errors.username}
                onChange={e => update("username", e.target.value)}
              />

              <InputField
                label="Email"
                type="email"
                value={form.email}
                error={errors.email}
                onChange={e => update("email", e.target.value)}
              />

              <InputField
                label="Password"
                type="password"
                value={form.password}
                error={errors.password}
                helper="At least 8 characters"
                onChange={e => update("password", e.target.value)}
              />

              <InputField
                label="Phone"
                value={form.phone_number}
                error={errors.phone_number}
                onChange={e => update("phone_number", e.target.value)}
              />
            </div>

            {/* Date + Gender */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium">Gender</label>
                <Select value={form.gender} onValueChange={v => update("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.date_of_birth
                        ? format(form.date_of_birth, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={form.date_of_birth}
                      onSelect={d => update("date_of_birth", d)}
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {errors.submit && (
              <p className="text-sm text-destructive text-center">{errors.submit}</p>
            )}

            <Button className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/citizen/login" className="text-primary font-semibold">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
