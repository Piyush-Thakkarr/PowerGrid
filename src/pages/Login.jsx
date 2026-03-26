import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import OAuthButtons from '../components/auth/OAuthButtons';
import AuthMethodToggle from '../components/auth/AuthMethodToggle';
import PhoneOTPForm from '../components/auth/PhoneOTPForm';

export default function Login() {
    const { loginWithEmail, loginWithGoogle, sendPhoneOTP, verifyPhoneOTP, resetPassword, updatePassword, passwordRecovery } = useAuth();
    const navigate = useNavigate();

    const [method, setMethod] = useState('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const withLoading = async (fn) => {
        setError('');
        setLoading(true);
        try { await fn(); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleMethodChange = (m) => {
        setMethod(m);
        setError('');
        setOtpSent(false);
        setOtp('');
        setPhone('');
        setEmail('');
        setPassword('');
    };

    return (
        <AuthLayout switchText="Don't have an account?" switchLink="/signup" switchLinkText="Create one">
            {passwordRecovery ? (
                <>
                    <h1 className="auth-title">Set New Password</h1>
                    <p className="auth-subtitle">Enter your new password below. This link expires shortly.</p>
                    {error && <div className="auth-error" role="alert">{error}</div>}
                    <form onSubmit={e => { e.preventDefault(); withLoading(async () => {
                        if (newPassword.trim().length < 6) throw new Error('Password must be at least 6 non-space characters');
                        if (newPassword !== confirmNewPassword) throw new Error('Passwords do not match');
                        await updatePassword(newPassword);
                        navigate('/dashboard', { replace: true });
                    }); }} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="login-new-pw">New Password</label>
                            <input id="login-new-pw" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="login-confirm-pw">Confirm New Password</label>
                            <input id="login-confirm-pw" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Re-enter password" required />
                        </div>
                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? <span className="auth-spinner"></span> : 'Update Password'}
                        </button>
                    </form>
                </>
            ) : (
                <>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your energy dashboard</p>

                    <OAuthButtons onClick={() => withLoading(() => loginWithGoogle())} />
                    <AuthMethodToggle method={method} onChange={handleMethodChange} />
                    {error && <div className="auth-error" role="alert">{error}</div>}

                    {method === 'email' ? (
                        resetSent ? (
                            <div className="auth-confirmation">
                                <p className="auth-subtitle">Password reset link sent to <strong>{email}</strong>. Check your inbox.</p>
                                <button className="auth-resend" onClick={() => setResetSent(false)}>Back to login</button>
                            </div>
                        ) : (
                            <form onSubmit={e => { e.preventDefault(); withLoading(async () => {
                                await loginWithEmail(email, password);
                                navigate('/dashboard', { replace: true });
                            }); }} className="auth-form">
                                <div className="auth-field">
                                    <label htmlFor="login-email">Email</label>
                                    <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                                </div>
                                <div className="auth-field">
                                    <label htmlFor="login-password">Password</label>
                                    <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
                                </div>
                                <button type="submit" className="auth-submit" disabled={loading}>
                                    {loading ? <span className="auth-spinner"></span> : 'Sign In'}
                                </button>
                                {showResetConfirm ? (
                                    <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', alignItems: 'center' }}>
                                        <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Send reset email?</span>
                                        <button type="button" className="auth-forgot" disabled={loading} onClick={() => withLoading(async () => {
                                            if (!email) throw new Error('Enter your email address first');
                                            await resetPassword(email);
                                            setResetSent(true);
                                            setShowResetConfirm(false);
                                        })} style={{ color: '#00aaff' }}>Yes, send</button>
                                        <button type="button" className="auth-forgot" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                                    </div>
                                ) : (
                                    <button type="button" className="auth-forgot" onClick={() => {
                                        if (!email) { setError('Enter your email address first'); return; }
                                        setError('');
                                        setShowResetConfirm(true);
                                    }}>Forgot password?</button>
                                )}
                            </form>
                        )
                    ) : (
                        <PhoneOTPForm
                            phone={phone} otp={otp} otpSent={otpSent} loading={loading}
                            onPhoneChange={setPhone} onOtpChange={setOtp}
                            onSendOTP={() => withLoading(async () => {
                                if (!phone || !phone.startsWith('+') || phone.length < 10) throw new Error('Enter phone with country code (e.g. +91 98765 43210)');
                                await sendPhoneOTP(phone.replace(/\s/g, '')); setOtpSent(true);
                            })}
                            onVerifyOTP={e => { e.preventDefault(); withLoading(async () => {
                                if (otp.length !== 6) throw new Error('Enter the 6-digit code');
                                await verifyPhoneOTP(phone, otp); navigate('/dashboard', { replace: true });
                            }); }}
                            onChangeNumber={() => { setOtpSent(false); setOtp(''); }}
                            submitLabel="Verify & Sign In"
                        />
                    )}
                </>
            )}
        </AuthLayout>
    );
}
