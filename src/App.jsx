import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
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

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    return user ? children : <Navigate to="/login" replace />;
}

function AuthRoute({ children }) {
    const { user, loading, passwordRecovery } = useAuth();
    if (loading) return <LoadingScreen />;
    if (user && !passwordRecovery) return <Navigate to="/dashboard" replace />;
    return children;
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

function App() {
    return (
        <Routes>
            {/* Landing page: always accessible, even for logged-in users */}
            <Route path="/" element={<><Navbar /><Landing /></>} />
            <Route path="/login" element={
                <AuthRoute>
                    <Login />
                </AuthRoute>
            } />
            <Route path="/signup" element={
                <AuthRoute>
                    <Signup />
                </AuthRoute>
            } />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;
