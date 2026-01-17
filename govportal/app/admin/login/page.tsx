"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FormField from "@/components/reusables/FormField";
import { toast } from "sonner";
import { REQUEST } from "@/services/api";
import { setStoredToken } from "@/services/helpers";
import { Loader2, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // adjust route if your backend expects another path
      const res = await REQUEST("POST", "admins/login/", { username: form.username, password: form.password });
      // Expect token in res.access or res.token — adjust accordingly
      if (res?.access) {
        // Store the access token 
        setStoredToken(res.access);        
        toast.success("Welcome back!");
        router.push("/admins/home");
      } else {
        // No token received - this should NOT happen on successful login
        console.error("Login response missing token:", res);
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted dark:from-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Lock className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Login to your admin account</CardDescription>
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
            <Link href="/citizen/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
