"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { CalendarIcon, Loader2, UserPlus, Lock, Phone, MapPin, User, Shield, ArrowRight, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import FormField from "@/components/reusables/FormField";
import FormSection from "@/components/reusables/FormSection";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RegisterForm } from "@/types/index";
import { REQUEST } from "@/services/api"; 
import { setStoredToken } from "@/services/helpers";

type Errors = Record<string, string>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    password2: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    address: "",
    gender: "",
    city: "",
    state_province: "",
    postal_code: "",
    date_of_birth: undefined,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof RegisterForm, value: string | Date | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = (): Errors => {
    const newErrors: Errors = {};
    if (!form.username || form.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Valid email is required";
    if (!form.password || form.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (form.password !== form.password2) newErrors.password2 = "Passwords do not match";
    if (form.phone_number && !/^\+?[\d\s-]{10,}$/.test(form.phone_number)) newErrors.phone_number = "Invalid phone number";
    if (form.date_of_birth && form.date_of_birth > new Date()) newErrors.date_of_birth = "Date cannot be in the future";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error("Please fix the validation errors and try again.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user: {
          username: form.username,
          email: form.email,
          password: form.password,
          password2: form.password2,
          phone_number: form.phone_number,
          first_name: form.first_name,
          last_name: form.last_name,
        },
        address: form.address,
        gender: form.gender,
        city: form.city,
        state_province: form.state_province,
        postal_code: form.postal_code,
        date_of_birth: form.date_of_birth ? form.date_of_birth.toISOString().slice(0, 10) : undefined,
      };

      const res = await REQUEST("POST", "citizens/register/", payload);

      if (res?.access) {
        setStoredToken(res.access);
        toast.success("Account created — welcome! 🎉");
        router.push("/citizen/home");
      } else {
        toast.success("Account created — you can now sign in.");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err?.message || "Registration failed. Please try again.");
      setErrors({ submit: err?.message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen min-w-screen overflow-hidden flex items-center justify-center p-4 lg:p-8 bg-linear-to-br from-background to-muted dark:from-slate-900">

      <Card className="relative w-full max-w-7xl glass-card shadow-xl border dark:border-white/6 overflow-hidden">
        <CardHeader className="text-center py-3 bg-linear-to-b from-white/5 via-transparent dark:from-black/5">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl lg:text-2xl font-display font-bold">
            <Shield className="h-8 w-8 text-indigo-500 shrink-0" />
            <span className="bg-linear-to-r from-indigo-400 to-emerald-300 bg-clip-text text-transparent">
              Join the Community
            </span>
          </CardTitle>

          <CardDescription className="text-base text-muted-foreground max-w-xl mx-auto">
            Create a citizen account to report issues, track progress, and access services.
          </CardDescription>
        </CardHeader>


        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormSection title="Account Information" icon={<Lock className="h-4 w-4 text-primary" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  id="username"
                  label="Username *"
                  value={form.username}
                  onChange={(v) => handleChange("username", v)}
                  placeholder="Muthu Kumar"
                  error={errors.username}
                />

                <FormField
                  id="email"
                  label="Email *"
                  type="email"
                  value={form.email}
                  onChange={(v) => handleChange("email", v)}
                  placeholder="muthu_kumar@example.com"
                  error={errors.email}
                />

                <FormField
                  id="password"
                  label="Password *"
                  type="password"
                  value={form.password}
                  onChange={(v) => handleChange("password", v)}
                  placeholder="••••••••"
                  error={errors.password}
                />

                <FormField
                  id="password2"
                  label="Confirm Password *"
                  type="password"
                  value={form.password2}
                  onChange={(v) => handleChange("password2", v)}
                  placeholder="••••••••"
                  error={errors.password2}
                />
              </div>
            </FormSection>

            <FormSection title="Personal Information" icon={<User className="h-4 w-4 text-indigo-600" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <FormField id="first_name" label="First Name" value={form.first_name} onChange={(v) => handleChange("first_name", v)} placeholder="John" />

                <FormField id="last_name" label="Last Name" value={form.last_name} onChange={(v) => handleChange("last_name", v)} placeholder="Doe" />

                <FormField
                  id="phone"
                  label="Phone Number"
                  value={form.phone_number}
                  onChange={(v) => handleChange("phone_number", v)}
                  placeholder="9955677879"
                  leadingIcon={<Phone className="h-4 w-4 text-muted-foreground" />}
                  error={errors.phone_number}
                />

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                  <Select value={form.gender} onValueChange={(value) => handleChange("gender", value)}>
                    <SelectTrigger className={cn("input-focus h-11", errors.gender && "border-destructive")}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label className="text-sm font-medium">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11 input-focus",
                          !form.date_of_birth && "text-muted-foreground",
                          errors.date_of_birth && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.date_of_birth ? format(form.date_of_birth, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.date_of_birth}
                        onSelect={(date) => handleChange("date_of_birth", date)}
                        initialFocus
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth}</p>}
                </div>
              </div>
            </FormSection>

            <FormSection title="Address Information" icon={<MapPin className="h-4 w-4 text-amber-600" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="sm:col-span-2">
                  <FormField id="address" label="Street Address" value={form.address} onChange={(v) => handleChange("address", v)} placeholder="123 Main Street" />
                </div>

                <FormField id="city" label="City" value={form.city} onChange={(v) => handleChange("city", v)} placeholder="Bangalore" />

                <FormField id="state" label="State" value={form.state_province} onChange={(v) => handleChange("state_province", v)} placeholder="Karnataka" />

                <FormField id="postal_code" label="Postal Code" value={form.postal_code} onChange={(v) => handleChange("postal_code", v)} placeholder="560023" />
              </div>
            </FormSection>

            <div className="space-y-4 pt-4">
              {errors.submit && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm text-destructive text-center">{errors.submit}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 h-10 text-base font-semibold gradient-bg hover:opacity-95 transition-opacity shadow-glow flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Create Account
                    </>
                  )}
                </Button>

                <Link href="/citizen/login" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 text-white font-semibold flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-500/20 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              </div>

            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
