"use client";
import DashboardView from "@/components/dashboard-view";
import { useAuth } from "@/components/auth-context";

export default function DashboardPage() {
    const { currentUser } = useAuth();
    if (!currentUser) return null;
    return <DashboardView currentUser={currentUser} />;
}
