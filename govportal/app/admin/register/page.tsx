"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarIcon, Loader2, UserPlus, Lock, Phone, MapPin, User, Shield, ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import FormField from "@/components/reusables/FormField";
import FormSection from "@/components/reusables/FormSection";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Department, RegisterForm } from "@/types/index";
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
    department: undefined,
    designation: "",
  });
  const [departments, setDepartments] = useState<Department[]>([])
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [deptID, setDeptID] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

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
        department: deptID,
        designation: form.designation,
      };

      const res = await REQUEST("POST", "admins/register/", payload);

      if (res?.access) {
        setStoredToken(res.access);
        toast.success("Account created — welcome! 🎉");
        router.push("/admin/home");
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
  const fetchDepartments = async () => {
    try {
      const res = await REQUEST("GET", "admins/departments/")
      setDepartments(res || [])
    } catch (err) {
      console.error("Failed to fetch departments:", err)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])


  return (
    <div className="relative min-h-screen min-w-screen overflow-hidden flex items-center justify-center p-4 lg:p-8 bg-linear-to-br from-background to-muted dark:from-slate-900">

      <Card className="relative w-full max-w-7xl glass-card shadow-xl border dark:border-white/6 overflow-hidden">

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
                <FormField
                  id="designation"
                  label="Designation *"
                  value={form.designation}
                  onChange={(v) => handleChange("designation", v)}
                  placeholder="Manager"
                  error={errors.designation}
                />

              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium ">Departments</label>
                <Popover open={open} onOpenChange={setOpen}>

                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-50 justify-between ml-3 mt-3"
                    >
                      {value
                        ? departments.find((department) => department.name === value)?.name
                        : "Select Department..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-50 p-0">
                    <Command>
                      <CommandInput placeholder="Search Department..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No Department found.</CommandEmpty>
                        <CommandGroup>
                          {departments.map((department) => (
                            // Inside your CommandItem loop
                            <CommandItem
                              key={department.id}
                              value={department.name}
                              onSelect={(currentValue) => {
                                // 1. Find the department object matching the selected name
                                const selectedDept = departments.find(
                                  (dept) => dept.name.toLowerCase() === currentValue.toLowerCase()
                                );
                                // 2. Toggle selection: if clicking the same one, clear it; otherwise set it
                                const isSelected = currentValue === value;
                                setValue(isSelected ? "" : currentValue);
                                setDeptID(isSelected ? undefined : selectedDept?.id);
                                // 3. Keep your main form state in sync
                                handleChange("department", isSelected ? undefined : String(selectedDept?.id));
                                setOpen(false);
                              }}
                            >
                              {department.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  value === department.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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

                <Link href="/admin/login" className="flex-1">
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
