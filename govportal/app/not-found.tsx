import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />

            {/* Floating decorative elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
                {/* Large 404 text */}
                <div className="relative mb-8">
                    <h1 className="text-[12rem] md:text-[16rem] font-bold leading-none tracking-tighter text-muted-foreground/10 select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="space-y-2 flex justify-center items-center gap-2">
                            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                <Search className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Page Not Found</p>
                        </div>
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">Oops! Lost in the void</h2>
                <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto text-pretty">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button asChild size="lg" className="min-w-[160px] shadow-lg shadow-primary/20">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="min-w-[160px] bg-transparent">
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                </div>

                {/* Helpful links */}
                <div className="mt-16 pt-8 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-4">Here are some helpful links instead:</p>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                        <Link
                            href="/"
                            className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                        >
                            Home
                        </Link>
                        <Link
                            href="/citizen/complaints"
                            className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                        >
                            Complaints
                        </Link>
                        <Link
                            href="/help"
                            className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                        >
                            Help Center
                        </Link>
                        <Link
                            href="/contact"
                            className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
