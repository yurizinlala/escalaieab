'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthUser, getCurrentUser, login as authLogin, logout as authLogout, isAdmin as checkIsAdmin } from '@/lib/auth';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAdmin: boolean;
    login: (phone: string, pin: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Error refreshing user:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (phone: string, pin: string) => {
        const result = await authLogin(phone, pin);
        if (result.success && result.user) {
            setUser(result.user);
        }
        return { success: result.success, error: result.error, user: result.user };
    };

    const logout = async () => {
        await authLogout();
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAdmin: checkIsAdmin(user),
        login,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
