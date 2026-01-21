"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Page() {
    const { currentUser, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!currentUser) {
            router.push("/login"); // Redirect to login if not authenticated
        } else {
            // Determine initial view based on user permissions
            const initialView = currentUser.pages.includes("dashboard")
                ? "dashboard"
                : currentUser.pages[0] || "dashboard";

            const routeMap: { [key: string]: string } = {
                dashboard: "/dashboard",
                request: "/request",
                approval: "/approval",
                form: "/form",
                reports: "/reports",

            };

            const targetRoute = routeMap[initialView] || "/dashboard";
            router.push(targetRoute);
        }
    }, [currentUser, isLoading, router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
    );
}
