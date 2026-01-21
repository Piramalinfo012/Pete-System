"use client";
import ApprovalView from "@/components/approval-view";
import { useAuth } from "@/components/auth-context";

export default function ApprovalPage() {
    const { currentUser } = useAuth();
    if (!currentUser) return null;
    return <ApprovalView currentUser={currentUser} />;
}
