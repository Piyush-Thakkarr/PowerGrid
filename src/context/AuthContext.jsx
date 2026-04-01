import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [passwordRecovery, setPasswordRecovery] = useState(false);

    // Fetch user profile from Supabase profiles table
    const fetchProfile = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) console.warn('fetchProfile error:', error);
        setProfile(data);
        return data;
    };

    // Create or update profile in Supabase
    const upsertProfile = async (userId, profileData) => {
        const { data, error } = await supabase
            .from('profiles')
            .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() })
            .select()
            .single();
        if (error) throw error;
        setProfile(data);
        return data;
    };

    // Listen to auth state changes
    useEffect(() => {
        const AUTH_TIMEOUT_MS = 3000;
        const timeout = setTimeout(() => setLoading(false), AUTH_TIMEOUT_MS);

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            clearTimeout(timeout);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        }).catch(() => {
            clearTimeout(timeout);
            setLoading(false);
        });

        // Subscribe to changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'PASSWORD_RECOVERY') {
                    setPasswordRecovery(true);
                }
                setUser(session?.user ?? null);
                if (session?.user) {
                    const existingProfile = await fetchProfile(session.user.id);

                    // Auto-create profile if missing (OAuth users, or email users
                    // whose profile creation failed due to RLS during signup)
                    if (!existingProfile) {
                        await upsertProfile(session.user.id, {
                            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                            email: session.user.email,
                            household_size: 4,
                            state: 'Gujarat',
                            tariff_plan: 'Residential',
                            xp: 0,
                            level: 1,
                        });
                    }
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => { clearTimeout(timeout); subscription.unsubscribe(); };
    }, []);

    const requireSupabase = () => {
        if (!isSupabaseConfigured) throw new Error('This feature is currently unavailable. Please try again later.');
    };

    // Email + password signup
    const signupWithEmail = async ({ email, password, name, householdSize, state, tariffPlan }) => {
        requireSupabase();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });
        if (error) throw error;

        // Create profile row (may fail under RLS if email confirmation is required
        // and there's no active session — profile will be created on first login instead)
        if (data.user) {
            try {
                await upsertProfile(data.user.id, {
                    name,
                    email,
                    household_size: householdSize || 4,
                    state: state || 'Gujarat',
                    tariff_plan: tariffPlan || 'Residential',
                    xp: 0,
                    level: 1,
                });
            } catch (err) {
                console.warn('Profile creation deferred to first login:', err.message);
            }
        }

        // Return whether email confirmation is needed
        // If session is null, Supabase requires email confirmation before login
        return { ...data, needsEmailConfirmation: !data.session };
    };

    // Password reset - send email
    const resetPassword = async (email) => {
        requireSupabase();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
    };

    // Password reset - set new password
    const updatePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setPasswordRecovery(false);
    };

    // Email + password login
    const loginWithEmail = async (email, password) => {
        requireSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    // Google OAuth
    const loginWithGoogle = async () => {
        requireSupabase();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) throw error;
        return data;
    };

    // Phone OTP - send code
    const sendPhoneOTP = async (phone) => {
        requireSupabase();
        const { data, error } = await supabase.auth.signInWithOtp({
            phone,
        });
        if (error) throw error;
        return data;
    };

    // Phone OTP - verify code
    const verifyPhoneOTP = async (phone, token) => {
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
        if (error) throw error;
        return data;
    };

    // Logout
    const logout = async () => {
        setUser(null);
        setProfile(null);
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.warn('Sign-out error:', err);
        }
    };

    // Update profile
    const updateProfile = async (updates) => {
        if (!user) return;
        return upsertProfile(user.id, updates);
    };

    // Combined user data (auth + profile)
    const userData = user ? {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        householdSize: profile?.household_size || 4,
        state: profile?.state || 'Gujarat',
        tariffPlan: profile?.tariff_plan || 'Residential',
        xp: profile?.xp || 0,
        level: profile?.level || 1,
        createdAt: user.created_at,
        avatarUrl: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider,
        needsProfile: !profile,
    } : null;

    return (
        <AuthContext.Provider value={{
            user: userData,
            loading,
            signupWithEmail,
            loginWithEmail,
            loginWithGoogle,
            sendPhoneOTP,
            verifyPhoneOTP,
            logout,
            updateProfile,
            resetPassword,
            updatePassword,
            passwordRecovery,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
