"use client";
//  register/page.tsx 
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import {
  CalendarIcon,
  Loader2,
  UserPlus,
  Lock,
  Phone,
  MapPin,
  User,
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { REQUEST, setTokens } from "@/services/api";

// Types 
interface RegisterForm {
  // Step 1 – Account
  username: string;
  email: string;
  password: string;
  password2: string;
  // Step 2 – Personal
  first_name: string;
  last_name: string;
  phone_number: string;
  gender: string;
  date_of_birth: Date | undefined;
  // Step 3 – Address
  address: string;
  city: string;
  state_province: string;
  postal_code: string;
}

type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

const INITIAL_FORM: RegisterForm = {
  username: "",
  email: "",
  password: "",
  password2: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  gender: "",
  date_of_birth: undefined,
  address: "",
  city: "",
  state_province: "",
  postal_code: "",
};

//  Step config 

const STEPS = [
  { label: "Account", icon: Lock },
  { label: "Personal", icon: User },
  { label: "Address", icon: MapPin },
];

//  Validation ─
// WHY per-step: Only validate fields relevant to the current step so the user
// isn't blocked by address errors while filling account info.

function validateStep(step: number, form: RegisterForm): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 0) {
    if (!form.username || form.username.length < 3)
      errors.username = "At least 3 characters required";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Enter a valid email address";
    if (!form.password || form.password.length < 8)
      errors.password = "Minimum 8 characters";
    if (form.password !== form.password2)
      errors.password2 = "Passwords do not match";
  }

  if (step === 1) {
    if (
      form.phone_number &&
      !/^\+?[\d\s\-]{10,}$/.test(form.phone_number)
    )
      errors.phone_number = "Invalid phone number";
    if (form.date_of_birth && form.date_of_birth > new Date())
      errors.date_of_birth = "Date cannot be in the future";
  }

  // Step 2 (address) has no required fields — all optional
  return errors;
}

//  Component 

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const progressPercent = ((step + 1) / STEPS.length) * 100;

  //  Field change handler ─
  function handleChange(
    field: keyof RegisterForm,
    value: string | Date | undefined
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this field as the user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  //  Step navigation 
  function handleNext() {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      // Show a concise toast listing which fields need attention
      const fieldNames = Object.keys(stepErrors).join(", ");
      toast.error(`Fix these fields: ${fieldNames}`);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  //  Submit 
  // WHY: We validate the last step too before submitting.
  //      The payload matches exactly what CitizenRegistrationSerializer expects:
  //      a nested `user` object + flat profile fields at the top level.

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const lastStepErrors = validateStep(step, form);
    if (Object.keys(lastStepErrors).length) {
      setErrors(lastStepErrors);
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
        gender: form.gender || undefined,
        city: form.city,
        state_province: form.state_province,
        postal_code: form.postal_code,
        date_of_birth: form.date_of_birth
          ? form.date_of_birth.toISOString().slice(0, 10)
          : undefined,
      };

      const res = await REQUEST<{ access?: string; refresh?: string }>(
        "POST",
        "citizens/register/",
        payload
      );

      // WHY store both tokens: the refresh token is what lets us silently
      // renew the access token later without logging the user out.
      if (res?.access) {
        setTokens(res.access, res.refresh);
        toast.success("Account created — welcome! 🎉");
        router.push("/citizen/home");
      } else {
        toast.success("Account created! Please sign in.");
        router.push("/citizen/login");
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Registration failed. Please try again.";

      // Show the full Django error message in the toast
      toast.error(message, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  //  Field components (named render functions) 

  function renderAccountStep() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FieldWrapper id="username" label="Username *" error={errors.username}>
          <Input
            id="username"
            placeholder="muthu_kumar"
            value={form.username}
            onChange={(e) => handleChange("username", e.target.value)}
            className={cn(errors.username && "border-destructive")}
          />
        </FieldWrapper>

        <FieldWrapper id="email" label="Email *" error={errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={cn(errors.email && "border-destructive")}
          />
        </FieldWrapper>

        <FieldWrapper id="password" label="Password *" error={errors.password}>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            className={cn(errors.password && "border-destructive")}
          />
        </FieldWrapper>

        <FieldWrapper
          id="password2"
          label="Confirm Password *"
          error={errors.password2}
        >
          <Input
            id="password2"
            type="password"
            placeholder="Repeat password"
            value={form.password2}
            onChange={(e) => handleChange("password2", e.target.value)}
            className={cn(errors.password2 && "border-destructive")}
          />
        </FieldWrapper>
      </div>
    );
  }

  function renderPersonalStep() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FieldWrapper id="first_name" label="First Name">
          <Input
            id="first_name"
            placeholder="Muthu"
            value={form.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper id="last_name" label="Last Name">
          <Input
            id="last_name"
            placeholder="Kumar"
            value={form.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper
          id="phone_number"
          label="Phone Number"
          error={errors.phone_number}
        >
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone_number"
              placeholder="+91 99556 77879"
              value={form.phone_number}
              onChange={(e) => handleChange("phone_number", e.target.value)}
              className={cn(
                "pl-9",
                errors.phone_number && "border-destructive"
              )}
            />
          </div>
        </FieldWrapper>

        <FieldWrapper id="gender" label="Gender">
          <Select
            value={form.gender}
            onValueChange={(v) => handleChange("gender", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Male</SelectItem>
              <SelectItem value="F">Female</SelectItem>
              <SelectItem value="O">Other</SelectItem>
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper
          id="date_of_birth"
          label="Date of Birth"
          error={errors.date_of_birth}
          className="sm:col-span-2"
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.date_of_birth && "text-muted-foreground",
                  errors.date_of_birth && "border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.date_of_birth
                  ? format(form.date_of_birth, "PPP")
                  : "Pick a date"}
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
        </FieldWrapper>
      </div>
    );
  }

  function renderAddressStep() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FieldWrapper
          id="address"
          label="Street Address"
          className="sm:col-span-2"
        >
          <Input
            id="address"
            placeholder="123 Anna Salai"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper id="city" label="City">
          <Input
            id="city"
            placeholder="Chennai"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper id="state_province" label="State">
          <Input
            id="state_province"
            placeholder="Tamil Nadu"
            value={form.state_province}
            onChange={(e) => handleChange("state_province", e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper id="postal_code" label="Postal Code">
          <Input
            id="postal_code"
            placeholder="600001"
            value={form.postal_code}
            onChange={(e) => handleChange("postal_code", e.target.value)}
          />
        </FieldWrapper>
      </div>
    );
  }

  //  Render 

  const StepIcon = STEPS[step].icon;
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-xl shadow-lg">
        {/*  Header  */}
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Create your account</CardTitle>
              <CardDescription>
                Step {step + 1} of {STEPS.length} — {STEPS[step].label}
              </CardDescription>
            </div>
          </div>

          {/*  Stepper  */}
          <div className="space-y-3">
            <Progress value={progressPercent} className="h-1.5" />

            <div className="flex justify-between">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i < step;
                const active = i === step;
                return (
                  <div key={s.label} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                        done &&
                        "border-primary bg-primary text-primary-foreground",
                        active &&
                        "border-primary text-primary",
                        !done && !active &&
                        "border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {done ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>

        {/*  Form body  */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 0 && renderAccountStep()}
            {step === 1 && renderPersonalStep()}
            {step === 2 && renderAddressStep()}

            {/*  Navigation buttons  */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}

              {isLastStep ? (
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleNext}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            {step === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/citizen/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

//  Reusable field wrapper 
// WHY: Keeps label + error message co-located with the input rather than
//      scattering them across the tree. Named export so it can be reused
//      in other forms.

interface FieldWrapperProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({
  id,
  label,
  error,
  className,
  children,
}: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}