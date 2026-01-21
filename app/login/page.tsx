"use client";

import React, { useEffect } from "react";
import LoginPage from "@/components/login-page";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";

export default function LoginRoute() {
    const { login, currentUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (currentUser) {
            router.push("/dashboard");
        }
    }, [currentUser, router]);

    const handleLogin = (user: any) => {
        login(user);
        // Navigation is handled by the effect or we can push immediately
        router.push("/dashboard");
    };

    return <LoginPage onLogin={handleLogin} />;
}
