"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check, ChevronsUpDown, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FormField from "@/components/reusables/forms/FormField";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Department, RegisterForm } from "@/types/index";
import { REQUEST } from "@/services/api";
import { setStoredToken } from "@/services/auth";

type Errors = Record<string, string>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [deptID, setDeptID] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleChange = (field: keyof RegisterForm, value: string | Date | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = (): Errors => {
    const newErrors: Errors = {};
    if (!form.username || form.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Valid email is required";
    if (!form.password || form.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (form.password !== form.password2) newErrors.password2 = "Passwords do not match";
    return newErrors;
  };

  const validateForm = (): Errors => {
    const newErrors = validateStep1();
    if (form.phone_number && !/^\+?[\d\s-]{10,}$/.test(form.phone_number)) newErrors.phone_number = "Invalid phone number";
    if (!form.designation) newErrors.designation = "Designation is required";
    return newErrors;
  };

  const handleNextStep = () => {
    const step1Errors = validateStep1();
    if (Object.keys(step1Errors).length > 0) {
      setErrors(step1Errors);
      toast.error("Please fix the validation errors before moving forward.");
      return;
    }
    setStep(2);
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
        router.push("/admin/login");
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
      const res = await REQUEST("GET", "admins/departments/");
      setDepartments(res || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-100 flex flex-col gap-6">

        {/* Branding Header matching your exact reference UI */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 shadow-xs dark:border-neutral-800">
            {/* Minimalist modern logo marker */}
            <Shield />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Welcome to GovChat
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Already have an account?{" "}
            <Link href="/admin/login" className="underline underline-offset-4 hover:text-primary dark:hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>

        {/* Minimal Form Card Container */}
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base font-medium">
              {step === 1 ? "Account Credentials" : "Personal details"}
            </CardTitle>
            <CardDescription className="text-xs">
              Step {step} of 2 — Fields marked with * are required.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-4">

              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
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

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full bg-primary hover:bg-primary/90 text-white dark:bg-primary/90 dark:hover:bg-primary/80 h-10 mt-2 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      id="first_name"
                      label="First Name"
                      value={form.first_name}
                      onChange={(v) => handleChange("first_name", v)}
                      placeholder="John"
                    />
                    <FormField
                      id="last_name"
                      label="Last Name"
                      value={form.last_name}
                      onChange={(v) => handleChange("last_name", v)}
                      placeholder="Doe"
                    />
                  </div>

                  <FormField
                    id="phone"
                    label="Phone Number"
                    value={form.phone_number}
                    onChange={(v) => handleChange("phone_number", v)}
                    placeholder="9955677879"
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

                  <div className="space-y-2 flex flex-col">
                    <label className="text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-200">
                      Department
                    </label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between h-10 px-3 border-neutral-200 dark:border-neutral-800 text-left font-normal"
                        >
                          <span className="truncate">
                            {value
                              ? departments.find((dept) => dept.name === value)?.name
                              : "Select Department..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search Department..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No Department found.</CommandEmpty>
                            <CommandGroup>
                              {departments.map((department) => (
                                <CommandItem
                                  key={department.id}
                                  value={department.name}
                                  onSelect={(currentValue) => {
                                    const selectedDept = departments.find(
                                      (dept) => dept.name.toLowerCase() === currentValue.toLowerCase()
                                    );
                                    const isSelected = currentValue === value;
                                    setValue(isSelected ? "" : currentValue);
                                    setDeptID(isSelected ? undefined : selectedDept?.id);
                                    handleChange("department", isSelected ? undefined : String(selectedDept?.id));
                                    setOpen(false);
                                  }}
                                >
                                  {department.name}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
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

                  {errors.submit && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                      <p className="text-xs text-destructive text-center font-medium">{errors.submit}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="h-10 px-3 border-neutral-200 dark:border-neutral-800"
                      disabled={loading}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90 text-white dark:bg-primary/90 dark:hover:bg-primary/80 h-10 font-medium transition-colors cursor-pointer flex items-center justify-center"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer Terms Agreement Statement matches template */}
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 leading-normal px-4">
          By clicking continue, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-50">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-50">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}