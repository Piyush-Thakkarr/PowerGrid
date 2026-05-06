import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import RoleDashboard from './components/dashboard/RoleDashboard';
import DashboardPreview from './pages/DashboardPreview';
import OnboardingForm from './components/auth/OnboardingForm';
import './styles/index.css';

function LoadingScreen() {
    return (
        <div style={{
            position: 'fixed', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#000', color: '#00aaff',
            fontFamily: "'DM Mono', monospace", fontSize: '0.9rem',
            letterSpacing: '3px', zIndex: 99999
        }}>
            LOADING...
        </div>
    );
}

function DashboardGate() {
    const { loading, needsOnboarding } = useAuth();
    if (loading) return <LoadingScreen />;
    if (needsOnboarding) return <OnboardingForm />;
    return <RoleDashboard />;
}

function NotFound() {
    return (
        <div style={{
            position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1rem',
            background: '#000', color: '#fff',
            fontFamily: "'DM Mono', monospace",
        }}>
            <h1 style={{ fontSize: '3rem', color: '#00aaff', margin: 0 }}>404</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', fontSize: '.8rem' }}>PAGE NOT FOUND</p>
            <Link to="/" style={{ color: '#00aaff', textDecoration: 'none', fontSize: '.75rem', letterSpacing: '2px', marginTop: '1rem', borderBottom: '1px solid rgba(0,170,255,0.3)' }}>← BACK TO HOME</Link>
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            {/* Landing — public, but redirects signed-in users to dashboard */}
            <Route path="/" element={
                <>
                    <SignedOut>
                        <Navbar />
                        <Landing />
                    </SignedOut>
                    <SignedIn>
                        <Navigate to="/dashboard" replace />
                    </SignedIn>
                </>
            } />

            {/* Dashboard — Clerk-gated, then onboarding gate, then role dispatch */}
            <Route path="/dashboard" element={
                <>
                    <SignedIn><DashboardGate /></SignedIn>
                    <SignedOut><RedirectToSignIn /></SignedOut>
                </>
            } />

            {/* Public preview, no auth */}
            <Route path="/preview" element={<DashboardPreview />} />

            {/* Legacy /login + /signup routes — Clerk's modal replaces them */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
