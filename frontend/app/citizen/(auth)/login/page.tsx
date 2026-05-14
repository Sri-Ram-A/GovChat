"use client";

// ─── login/page.tsx ──────────────────────────────────────────────────────────
// Changes from original:
//  1. Stores BOTH access + refresh tokens on login (was only storing access)
//  2. Named functions for all handlers (no inline arrows)
//  3. Uses the shared REQUEST wrapper → auto-refresh works for subsequent calls
//  4. Descriptive toast messages using Django's error shape
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { Loader2, Lock, User } from "lucide-react";
import { REQUEST, setTokens, setOnboardingNeeded } from "@/services/api";
import { FieldWrapper } from "@/app/citizen/(auth)/register/page"; // reuse the wrapper

interface LoginForm {
  username: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  needs_onboarding: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(function mountAnimation() {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, username: e.target.value }));
    if (error) setError("");
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, password: e.target.value }));
    if (error) setError("");
  }

  function navigateWithFade(path: string) {
    setExiting(true);
    setTimeout(() => router.push(path), 280);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Please enter your username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await REQUEST<LoginResponse>("POST", "citizens/login/", {
        username: form.username,
        password: form.password,
      });

      if (!res?.access) {
        throw new Error("Login failed — no token received.");
      }

      // WHY store both: refresh token is needed for the silent renewal in api.ts
      setTokens(res.access, res.refresh);
      setOnboardingNeeded(res.needs_onboarding);
      toast.success("Welcome back!");
      navigateWithFade("/citizen/home");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Invalid credentials. Please try again.";
      setError(message);
      toast.error(message, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={[
        "relative min-h-screen flex items-center justify-center overflow-hidden",
        "transition-all duration-300 ease-out",
        exiting
          ? "opacity-0 scale-[0.98]"
          : visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      {/* Video background */}
      <div className="absolute inset-0 -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover opacity-90"
        >
          <source src="/background1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <Card className="w-full max-w-md p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-1 pb-4">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-blue-500/20 p-3">
              <Lock className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-white">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-white/60">
            Sign in to your citizen account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldWrapper id="username" label="Username">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="your_username"
                  value={form.username}
                  onChange={handleUsernameChange}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
            </FieldWrapper>

            <FieldWrapper id="password" label="Password">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handlePasswordChange}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
            </FieldWrapper>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-sm text-center mt-4 text-white/60">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => navigateWithFade("/citizen/register")}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Register
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}