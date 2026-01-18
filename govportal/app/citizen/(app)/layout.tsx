// app/citizen/layout.tsx
import CitizenNavbar from "@/components/navbar/CitizenNavbar";

export default function CitizenLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <CitizenNavbar />
            <main className="pt-24">
                {children}
            </main>
        </div>
    );
}
