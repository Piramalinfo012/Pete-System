"use client";
import RequestView from "@/components/request-view";
import { useAuth } from "@/components/auth-context";

export default function RequestPage() {
    const { currentUser } = useAuth();
    if (!currentUser) return null;
    return <RequestView currentUser={currentUser} />;
}
