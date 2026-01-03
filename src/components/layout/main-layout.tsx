"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { usePathname } from 'next/navigation';

// Routes that should not display the sidebar
const noSidebarRoutes = ['/', '/login', '/signup'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    // Determine if the sidebar should be shown
    const showSidebar = user && !loading && !noSidebarRoutes.includes(pathname);

    if (showSidebar) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        );
    }

    // For public routes or when loading, just render the page content
    return <>{children}</>;
}
