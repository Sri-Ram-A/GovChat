// app/citizen/layout.tsx
"use client"
import { useEffect, useState } from "react"
import React from "react"

import { useRouter } from "next/navigation"
import { getStoredToken, clearStoredToken } from "@/services/auth"
import CitizenNavbar from "@/components/navbar/CitizenNavbar";

export default function CitizenLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter()
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const token = getStoredToken()
        if (!token) {
            clearStoredToken()
            router.replace("/citizen/login")
        } else {
            setTimeout(() => setReady(true), 300)
        }
    }, [])
    if (!ready) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden relative">
                {/* Animated linear background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-50 animate-pulse dark:opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-linear-to-tr from-primary/5 to-transparent rounded-full blur-3xl opacity-50 animate-pulse dark:opacity-10" style={{ animationDelay: '1s' }}></div>
                </div>

                {/* Main content */}
                <div className="relative z-10 text-center space-y-8 max-w-md px-6">
                    {/* Animated loader */}
                    <div className="flex justify-center">
                        <div className="relative w-16 h-16">
                            {/* Outer rotating ring */}
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin" style={{ animationDuration: '2s' }}></div>

                            {/* Middle pulsing ring */}
                            <div className="absolute inset-2 rounded-full border border-primary/30 animate-pulse" style={{ animationDuration: '2s' }}></div>

                            {/* Center dot */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Text content */}
                    <div className="space-y-3 animate-fade-in" style={{ animation: 'fadeIn 0.8s ease-in-out 0.3s both' }}>
                        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                            Preparing Services
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            Securing your session and loading your workspace…
                        </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="space-y-2 pt-4">
                        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-primary to-primary/60 rounded-full"
                                style={{
                                    animation: 'progress 2s ease-in-out infinite',
                                }}
                            ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Just a moment…
                        </p>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes progress {
                        0% {
                            width: 0%;
                        }
                        50% {
                            width: 100%;
                        }
                        100% {
                            width: 0%;
                        }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <CitizenNavbar />
            <main className="pt-24">
                {children}
            </main>
        </div>
    );
}
