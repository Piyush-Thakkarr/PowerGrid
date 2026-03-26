import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES, TARIFF_OPTIONS } from '../lib/constants';
import AuthLayout from '../components/auth/AuthLayout';
import OAuthButtons from '../components/auth/OAuthButtons';
import AuthMethodToggle from '../components/auth/AuthMethodToggle';
import PhoneOTPForm from '../components/auth/PhoneOTPForm';

export default function Signup() {
    const { signupWithEmail, loginWithGoogle, sendPhoneOTP, verifyPhoneOTP, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [method, setMethod] = useState('email');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        householdSize: '4', state: 'Gujarat', tariffPlan: 'Residential',
    });

    const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

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
    };

    return (
        <AuthLayout switchText="Already have an account?" switchLink="/login" switchLinkText="Sign in">
            {/* Step indicators — hide during email confirmation */}
            {!emailConfirmationSent && (
                <div className="auth-steps">
                    <div className={`auth-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="auth-step-line"></div>
                    <div className={`auth-step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                </div>
            )}

            {emailConfirmationSent ? (
                <div className="auth-confirmation">
                    <h1 className="auth-title">Check Your Email</h1>
                    <p className="auth-subtitle">
                        We sent a confirmation link to <strong>{form.email}</strong>.
                        Please check your inbox and click the link to activate your account.
                    </p>
                    <p className="auth-subtitle" style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.7 }}>
                        After confirming, you can <Link to="/login">sign in here</Link>.
                    </p>
                    <button className="auth-resend" onClick={() => withLoading(async () => {
                        await signupWithEmail({
                            email: form.email, password: form.password, name: form.name,
                            householdSize: parseInt(form.householdSize), state: form.state, tariffPlan: form.tariffPlan,
                        });
                        setError('');
                    })} disabled={loading} style={{ marginTop: '.5rem' }}>
                        {loading ? 'Resending...' : 'Resend confirmation email'}
                    </button>
                </div>
            ) : step === 1 ? (
                <>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join the smart energy revolution</p>

                    <OAuthButtons onClick={() => withLoading(() => loginWithGoogle())} />
                    <AuthMethodToggle method={method} onChange={handleMethodChange} />
                    {error && <div className="auth-error" role="alert">{error}</div>}

                    {method === 'email' ? (
                        <form onSubmit={e => { e.preventDefault(); withLoading(async () => {
                            if (!form.name.trim()) throw new Error('Name is required');
                            if (form.password.length < 6) throw new Error('Password must be at least 6 characters');
                            if (form.password !== form.confirmPassword) throw new Error('Passwords do not match');
                            const result = await signupWithEmail({
                                email: form.email, password: form.password, name: form.name,
                                householdSize: parseInt(form.householdSize), state: form.state, tariffPlan: form.tariffPlan,
                            });
                            result.needsEmailConfirmation ? setEmailConfirmationSent(true) : setStep(2);
                        }); }} className="auth-form">
                            <div className="auth-field">
                                <label htmlFor="signup-name">Full Name</label>
                                <input id="signup-name" type="text" value={form.name} onChange={set('name')} placeholder="Your full name" required />
                            </div>
                            <div className="auth-field">
                                <label htmlFor="signup-email">Email</label>
                                <input id="signup-email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
                            </div>
                            <div className="auth-field">
                                <label htmlFor="signup-pw">Password</label>
                                <input id="signup-pw" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required />
                            </div>
                            <div className="auth-field">
                                <label htmlFor="signup-confirm-pw">Confirm Password</label>
                                <input id="signup-confirm-pw" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" required />
                            </div>
                            <button type="submit" className="auth-submit" disabled={loading}>
                                {loading ? <span className="auth-spinner"></span> : 'Continue'}
                            </button>
                        </form>
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
                                await verifyPhoneOTP(phone, otp); setStep(2);
                            }); }}
                            onChangeNumber={() => { setOtpSent(false); setOtp(''); }}
                            submitLabel="Verify & Continue"
                        />
                    )}
                </>
            ) : (
                <>
                    <h1 className="auth-title">Setup Profile</h1>
                    <p className="auth-subtitle">Tell us about your household</p>
                    {error && <div className="auth-error" role="alert">{error}</div>}

                    <form onSubmit={e => { e.preventDefault(); withLoading(async () => {
                        await updateProfile({
                            name: form.name || undefined,
                            household_size: parseInt(form.householdSize),
                            state: form.state, tariff_plan: form.tariffPlan,
                        });
                        navigate('/dashboard', { replace: true });
                    }); }} className="auth-form">
                        {method === 'phone' && (
                            <div className="auth-field">
                                <label htmlFor="signup-profile-name">Full Name</label>
                                <input id="signup-profile-name" type="text" value={form.name} onChange={set('name')} placeholder="Your full name" required />
                            </div>
                        )}
                        <div className="auth-field">
                            <label htmlFor="signup-household">Household Size</label>
                            <select id="signup-household" value={form.householdSize} onChange={set('householdSize')}>
                                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>)}
                            </select>
                        </div>
                        <div className="auth-field">
                            <label htmlFor="signup-state">State</label>
                            <select id="signup-state" value={form.state} onChange={set('state')}>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="auth-field">
                            <label htmlFor="signup-tariff">Tariff Category</label>
                            <select id="signup-tariff" value={form.tariffPlan} onChange={set('tariffPlan')}>
                                {TARIFF_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? <span className="auth-spinner"></span> : 'Start Dashboard'}
                        </button>
                        {method === 'email' ? (
                            <button type="button" className="auth-resend" onClick={() => setStep(1)}>
                                ← Back
                            </button>
                        ) : (
                            <button type="button" className="auth-resend" onClick={() => navigate('/dashboard', { replace: true })}>
                                Skip for now
                            </button>
                        )}
                    </form>
                </>
            )}
        </AuthLayout>
    );
}
