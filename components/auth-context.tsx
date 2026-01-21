"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppUser } from "./login-page";
import { useRouter } from "next/navigation";

interface AuthContextType {
    currentUser: AppUser | null;
    login: (user: AppUser) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setCurrentUser(user);
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.removeItem("currentUser");
            }
        }
        setIsLoading(false);
    }, []);

    const login = (user: AppUser) => {
        setCurrentUser(user);
        localStorage.setItem("currentUser", JSON.stringify(user));
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem("currentUser");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
