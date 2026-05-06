import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { apiFetch } from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();
    const { user: clerkUser } = useUser();
    const { signOut: clerkSignOut } = useClerk();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        try {
            const data = await apiFetch('/api/auth/me');
            setProfile(data);
            return data;
        } catch {
            setProfile(null);
            return null;
        }
    }, []);

    useEffect(() => {
        if (!clerkLoaded) return;
        if (!isSignedIn) {
            setProfile(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        refreshProfile().finally(() => setLoading(false));
    }, [isSignedIn, clerkLoaded, refreshProfile]);

    const updateProfile = async (updates) => {
        // Accept either snake_case (legacy callers) or camelCase keys.
        const body = {
            name: updates.name,
            householdSize: updates.householdSize ?? updates.household_size,
            state: updates.state,
            tariffPlan: updates.tariffPlan ?? updates.tariff_plan,
        };
        const data = await apiFetch('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(body),
        });
        setProfile(data);
        return data;
    };

    const signOut = async () => {
        try { await clerkSignOut(); } catch { /* swallow */ }
    };

    // Combined user shape — match what the rest of the app already expects.
    const userData = (isSignedIn && profile) ? {
        id: profile.id || clerkUser?.id,
        email: profile.email || clerkUser?.primaryEmailAddress?.emailAddress,
        phone: profile.phone || clerkUser?.primaryPhoneNumber?.phoneNumber,
        name: profile.name || clerkUser?.fullName || clerkUser?.firstName || 'User',
        householdSize: profile.householdSize ?? profile.household_size ?? 4,
        state: profile.state || 'Gujarat',
        tariffPlan: profile.tariffPlan || profile.tariff_plan || 'Residential',
        xp: profile.xp || 0,
        level: profile.level || 1,
        role: profile.role || 'consumer',
        createdAt: profile.createdAt || clerkUser?.createdAt,
        avatarUrl: clerkUser?.imageUrl,
    } : null;

    const value = {
        user: userData,
        profile,
        loading: !clerkLoaded || loading,
        isSignedIn: !!isSignedIn,
        needsOnboarding: !!isSignedIn && !loading && !profile,
        refreshProfile,
        updateProfile,
        signOut,
        // Back-compat alias for callers that used `logout`.
        logout: signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
