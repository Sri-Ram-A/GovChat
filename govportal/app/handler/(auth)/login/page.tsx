"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FormField from "@/components/reusables/forms/FormField";
import { toast } from "sonner";
import { REQUEST } from "@/services/api";
import { setStoredToken } from "@/services/auth";
import { Loader2, Lock, User } from "lucide-react";
import ColorBends from "@/components/ColorBends";

export default function LoginPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });

  React.useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await REQUEST("POST", "handlers/login/", {
        username: form.username,
        password: form.password
      });

      if (res?.access) {
        setStoredToken(res.access);
        toast.success("Welcome back!");
        setIsExiting(true)
        setTimeout(() => {
          router.push("/handler/home")
        }, 300)
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
        relative min-h-screen flex items-center justify-center overflow-hidden text-foreground
        transition-all duration-300 ease-out
        ${
          isExiting
            ? "opacity-0 scale-[0.98]"
            : isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2"
        }
      `}
    >
      {/* COLOR BENDS BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <ColorBends
          colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
          rotation={13}
          speed={0.57}
          scale={1.4}
          frequency={2.7}
          warpStrength={1}
          mouseInfluence={1.2}
          parallax={1}
          noise={0}
          transparent
          autoRotate={5}
        />
        <div className="absolute inset-0 bg-black/15" />
      </div>

      <Card
        className="
          w-full max-w-md p-10
          bg-white/10
          backdrop-blur-xl
          border border-white/20
          shadow-2xl
        "
      >
        <CardHeader className="text-center">
          <Lock className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Login to your handlers account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              id="login_username"
              label="Username"
              value={form.username}
              onChange={(v) => setForm({ ...form, username: v })}
              placeholder="your_username"
              leadingIcon={<User className="h-4 w-4 text-muted-foreground" />}
            />

            <FormField
              id="login_password"
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="Enter your password"
              leadingIcon={<Lock className="h-4 w-4 text-muted-foreground" />}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button disabled={loading} className="w-full h-12 flex items-center justify-center">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <p className="text-sm text-center mt-4">
            Don't have an account?{" "}
            <span
              onClick={() => {
                setIsExiting(true)
                setTimeout(() => {
                  router.push("/handler/register")
                }, 300)
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              Register
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
