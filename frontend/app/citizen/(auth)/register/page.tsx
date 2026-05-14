"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import {
    CalendarIcon,
    Loader2,
    Phone,
    ArrowRight,
    ArrowLeft, Shield
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
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    gender: string;
    date_of_birth: Date | undefined;
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

const STEPS = [
    { label: "Account credentials", desc: "Set up your secure login access parameters." },
    { label: "Personal details", desc: "Provide your basic identifying information." },
    { label: "Address information", desc: "Where should your profile be localized?" },
];

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
        if (form.phone_number && !/^\+?[\d\s\-]{10,}$/.test(form.phone_number))
            errors.phone_number = "Invalid phone number";
        if (form.date_of_birth && form.date_of_birth > new Date())
            errors.date_of_birth = "Date cannot be in the future";
    }

    return errors;
}

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);

    function handleChange(field: keyof RegisterForm, value: string | Date | undefined) {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    function handleNext(e?: React.MouseEvent<HTMLButtonElement>) {
        e?.preventDefault();
        const stepErrors = validateStep(step, form);
        if (Object.keys(stepErrors).length) {
            setErrors(stepErrors);
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (step !== STEPS.length - 1) {
            return;
        }
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

            toast.error(message, { duration: 6000 });
        } finally {
            setLoading(false);
        }
    }

    const isLastStep = step === STEPS.length - 1;

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-10">
            <div className="w-full max-w-100 flex flex-col gap-6">

                {/* Branding Block */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="mb-6 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background shadow-sm">
                            <Shield className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">GovChat</span>
                    </div>

                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Create your account
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Already registered?{" "}
                        <Link href="/citizen/login" className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-50">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Main Minimalist Container Layout */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-base font-medium">
                            {STEPS[step].label}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Step {step + 1} of {STEPS.length} — {STEPS[step].desc}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0">
                        <form onSubmit={
                            isLastStep
                                ? handleSubmit
                                : (e) => e.preventDefault()
                        } className="space-y-4">

                            {/* STEP 1: ACCOUNT DETAILS */}
                            {step === 0 && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <FieldWrapper id="username" label="Username *" error={errors.username}>
                                        <Input
                                            id="username"
                                            placeholder="muthu_kumar"
                                            value={form.username}
                                            onChange={(e) => handleChange("username", e.target.value)}
                                            className={cn("h-10", errors.username && "border-destructive focus-visible:ring-destructive")}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper id="email" label="Email *" error={errors.email}>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={form.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            className={cn("h-10", errors.email && "border-destructive focus-visible:ring-destructive")}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper id="password" label="Password *" error={errors.password}>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Min. 8 characters"
                                            value={form.password}
                                            onChange={(e) => handleChange("password", e.target.value)}
                                            className={cn("h-10", errors.password && "border-destructive focus-visible:ring-destructive")}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper id="password2" label="Confirm Password *" error={errors.password2}>
                                        <Input
                                            id="password2"
                                            type="password"
                                            placeholder="Repeat password"
                                            value={form.password2}
                                            onChange={(e) => handleChange("password2", e.target.value)}
                                            className={cn("h-10", errors.password2 && "border-destructive focus-visible:ring-destructive")}
                                        />
                                    </FieldWrapper>
                                </div>
                            )}

                            {/* STEP 2: PERSONAL DETAILS */}
                            {step === 1 && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-2 gap-3">
                                        <FieldWrapper id="first_name" label="First Name">
                                            <Input
                                                id="first_name"
                                                placeholder="Muthu"
                                                value={form.first_name}
                                                onChange={(e) => handleChange("first_name", e.target.value)}
                                                className="h-10"
                                            />
                                        </FieldWrapper>

                                        <FieldWrapper id="last_name" label="Last Name">
                                            <Input
                                                id="last_name"
                                                placeholder="Kumar"
                                                value={form.last_name}
                                                onChange={(e) => handleChange("last_name", e.target.value)}
                                                className="h-10"
                                            />
                                        </FieldWrapper>
                                    </div>

                                    <FieldWrapper id="phone_number" label="Phone Number" error={errors.phone_number}>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone_number"
                                                placeholder="+91 99556 77879"
                                                value={form.phone_number}
                                                onChange={(e) => handleChange("phone_number", e.target.value)}
                                                className={cn("pl-9 h-10", errors.phone_number && "border-destructive focus-visible:ring-destructive")}
                                            />
                                        </div>
                                    </FieldWrapper>

                                    <FieldWrapper id="gender" label="Gender">
                                        <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M">Male</SelectItem>
                                                <SelectItem value="F">Female</SelectItem>
                                                <SelectItem value="O">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldWrapper>

                                    <FieldWrapper id="date_of_birth" label="Date of Birth" error={errors.date_of_birth}>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal h-10 px-3 border-neutral-200 dark:border-neutral-800",
                                                        !form.date_of_birth && "text-muted-foreground",
                                                        errors.date_of_birth && "border-destructive"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                                    <span className="truncate">
                                                        {form.date_of_birth ? format(form.date_of_birth, "PPP") : "Pick a date"}
                                                    </span>
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
                            )}

                            {/* STEP 3: ADDRESS LOCATIONS */}
                            {step === 2 && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <FieldWrapper id="address" label="Street Address">
                                        <Input
                                            id="address"
                                            placeholder="123 Anna Salai"
                                            value={form.address}
                                            onChange={(e) => handleChange("address", e.target.value)}
                                            className="h-10"
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper id="city" label="City">
                                        <Input
                                            id="city"
                                            placeholder="Chennai"
                                            value={form.city}
                                            onChange={(e) => handleChange("city", e.target.value)}
                                            className="h-10"
                                        />
                                    </FieldWrapper>

                                    <div className="grid grid-cols-2 gap-3">
                                        <FieldWrapper id="state_province" label="State">
                                            <Input
                                                id="state_province"
                                                placeholder="Tamil Nadu"
                                                value={form.state_province}
                                                onChange={(e) => handleChange("state_province", e.target.value)}
                                                className="h-10"
                                            />
                                        </FieldWrapper>

                                        <FieldWrapper id="postal_code" label="Postal Code">
                                            <Input
                                                id="postal_code"
                                                placeholder="600001"
                                                value={form.postal_code}
                                                onChange={(e) => handleChange("postal_code", e.target.value)}
                                                className="h-10"
                                            />
                                        </FieldWrapper>
                                    </div>
                                </div>
                            )}

                            {/* Action Row Control Engine */}
                            <div className="flex gap-2 pt-2">
                                {step > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={loading}
                                        className="h-10 px-3 border-neutral-200 dark:border-neutral-800"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                )}

                                {isLastStep ? (
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-50 dark:hover:bg-neutral-200 dark:text-neutral-900 h-10 font-medium transition-colors cursor-pointer flex items-center justify-center"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating profile...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button" /* <--- THIS RIGHT HERE EXPLICITLY STOPS AUTOSUBMIT */
                                        onClick={(e) => handleNext(e)}
                                        className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-50 dark:hover:bg-neutral-200 dark:text-neutral-900 h-10 font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                        </form>
                    </CardContent>
                </Card>

                {/* Subtext Legal Context Bar */}
                <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 leading-normal px-4">
                    By confirming signup details, you explicitly consent to our automated{" "}
                    <Link href="/terms" className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-50">
                        Terms of Service
                    </Link>{" "}
                    and digital storage protocols.
                </p>
            </div>
        </div>
    );
}

// Reusable Field Wrapper
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
        <div className={cn("space-y-1.5 flex flex-col", className)}>
            <Label htmlFor={id} className="text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-200">
                {label}
            </Label>
            {children}
            {error && (
                <p className="text-xs text-destructive font-medium tracking-tight mt-0.5">{error}</p>
            )}
        </div>
    );
}