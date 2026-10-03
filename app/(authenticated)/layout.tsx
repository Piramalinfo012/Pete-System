"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";

import {
    LogOut,
    LayoutDashboard,
    ClipboardList,
    CheckCircle2,
    FilePlus,
    BarChart3,
    User,
} from "lucide-react";

const pageIcons: { [key: string]: React.ElementType } = {
    dashboard: LayoutDashboard,
    request: ClipboardList,
    approval: CheckCircle2,
    form: FilePlus,
    reports: BarChart3,
    users: User,
};

const pageLabels: { [key: string]: string } = {
    dashboard: "Dashboard",
    request: "Request",
    approval: "Approval",
    form: "Add New Transaction",
    reports: "Reports",
    users: "User Management",
};

const pageRoutes: { [key: string]: string } = {
    dashboard: "/dashboard",
    request: "/request",
    approval: "/approval",
    form: "/form",
    reports: "/reports",
    users: "/users",
};

const SIDEBAR_ORDER = [
    "dashboard",
    "form",
    "request",
    "approval",
    "reports",
    "users",
];

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentUser, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.push("/login"); // Redirect to login if not authenticated
        }
    }, [currentUser, isLoading, router]);

    if (isLoading || !currentUser) {
        return null; // Or a loading spinner
    }

    const userInitial = currentUser.name.charAt(0).toUpperCase();

    // Determine current page key from pathname
    // e.g. /dashboard -> dashboard
    const currentPath = pathname?.split("/").pop() || "";
    const pageLabel = pageLabels[currentPath] || "App";

    return (
        <SidebarProvider>
            <Sidebar className="bg-white border-r border-slate-200">
                <SidebarHeader className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 relative overflow-hidden rounded-full ring-2 ring-purple-500/20 shadow-sm flex-shrink-0">
                            <img
                                src="/PPPl Logo.png"
                                alt="Logo"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-base font-bold text-slate-800 truncate">
                                {currentUser.name}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 w-fit capitalize mt-0.5">
                                {currentUser.role}
                            </span>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent className="p-4">
                    <SidebarMenu className="flex flex-col gap-2">
                        {SIDEBAR_ORDER.filter(
                            (page) => currentUser.role === 'admin' || currentUser.pages?.includes(page) // Check access
                        ).map((page) => {
                            const Icon = pageIcons[page] || LayoutDashboard;
                            const route = pageRoutes[page];
                            // Check if the current pathname starts with the route (handles sub-routes if any)
                            const isActive = pathname?.startsWith(route);

                            return (
                                <SidebarMenuItem key={page}>
                                    <SidebarMenuButton
                                        asChild
                                        size="lg"
                                        isActive={isActive}
                                        tooltip={pageLabels[page]}
                                        className="group text-slate-600 hover:bg-purple-50/80 hover:text-purple-700 rounded-xl data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-600 data-[active=true]:to-indigo-600 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-purple-500/25 data-[active=true]:font-bold gap-4 transition-all"
                                    >
                                        <Link href={route}>
                                            <Icon className="size-5 text-slate-500 group-hover:text-purple-700 group-data-[active=true]:text-white transition-colors" />
                                            <span className="text-base">{pageLabels[page]}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="p-4 mt-auto">
                    <div className="my-2 py-3 text-center border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                            Developed By{" "}
                            <span className="font-semibold text-purple-600">
                                Deepak Sahu
                            </span>
                        </p>
                    </div>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                onClick={logout}
                                className="group w-full justify-start text-slate-600 hover:bg-red-50 hover:text-red-600 gap-4"
                            >
                                <LogOut className="size-5 text-slate-500 group-hover:text-red-600" />
                                <span className="text-base">Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-16 items-center gap-4 border-b bg-white p-4 sticky top-0 z-10 transition-all duration-300 ease-in-out">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-xl font-bold text-slate-800">{pageLabel}</h1>
                </header>
                <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
