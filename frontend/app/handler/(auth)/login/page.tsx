"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock, User, Mail,Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { REQUEST, setTokens, setOnboardingNeeded } from "@/services/api";

interface LoginResponse {
  access: string;
  refresh: string;
  needs_onboarding: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await REQUEST<LoginResponse>("POST", "handlers/login/", {
        username: form.username,
        password: form.password,
      });

      if (res?.access) {
        setTokens(res.access, res.refresh);
        setOnboardingNeeded(res.needs_onboarding);
        toast.success("Welcome back!");

        setTimeout(() => {
          router.push("/handler/home");
        }, 300);
      } else {
        throw new Error("Login failed - no token received");
      }
    } catch (err: any) {
      const message = err?.message || "Invalid credentials";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        min-h-screen w-full grid lg:grid-cols-2 bg-background
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      {/* Left: Login form */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">GovChat</span>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pb-6">
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Login to your account
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter your username and password to login to your account
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      type="username"
                      placeholder="Username"
                      value={form.username}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                      className="pl-10"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                      className="pl-10"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/handler/register" className="font-medium text-foreground hover:underline">
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right: Image panel */}
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-muted" />
        <Image
          src="/login.jpg"
          alt="Login illustration"
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}