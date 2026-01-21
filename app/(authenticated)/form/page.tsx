"use client";
import FormView from "@/components/form-view";
import { useAuth } from "@/components/auth-context";

export default function FormPage() {
    const { currentUser } = useAuth();
    if (!currentUser) return null;
    return <FormView currentUser={currentUser} />;
}
