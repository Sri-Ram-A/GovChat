// app/admin/layout.tsx
import AdminNavbar from "@/components/navbar/AdminNavbar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <AdminNavbar />
            <main className="">
                {children}
            </main>
        </div>
    );
}
