import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function PhoneOTPForm({ phone, otp, otpSent, loading, onPhoneChange, onOtpChange, onSendOTP, onVerifyOTP, onChangeNumber, submitLabel }) {
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(id);
    }, [cooldown]);

    const prevOtpSent = useRef(otpSent);
    useEffect(() => {
        // Start cooldown only when OTP is actually sent successfully
        if (otpSent && !prevOtpSent.current) {
            setCooldown(30);
        }
        prevOtpSent.current = otpSent;
    }, [otpSent]);

    const handleSendOTP = useCallback(() => {
        if (cooldown > 0) return;
        onSendOTP();
        // For resends (otpSent already true), start cooldown immediately
        // For initial send, cooldown starts via the useEffect above
        if (otpSent) setCooldown(30);
    }, [cooldown, onSendOTP, otpSent]);

    return (
        <div className="auth-form">
            <div className="auth-field">
                <label htmlFor="auth-phone">Phone Number</label>
                <input
                    id="auth-phone"
                    type="tel"
                    value={phone}
                    onChange={e => onPhoneChange(e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={otpSent}
                />
            </div>
            {otpSent ? (
                <form onSubmit={onVerifyOTP} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="auth-otp">Verification Code</label>
                        <input
                            id="auth-otp"
                            type="text"
                            value={otp}
                            onChange={e => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6-digit code"
                            maxLength={6}
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? <span className="auth-spinner"></span> : (submitLabel || 'Verify')}
                    </button>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button type="button" className="auth-resend" onClick={handleSendOTP} disabled={loading || cooldown > 0}>
                            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                        </button>
                        <button type="button" className="auth-resend" onClick={onChangeNumber}>
                            Change number
                        </button>
                    </div>
                </form>
            ) : (
                <button className="auth-submit" onClick={handleSendOTP} disabled={loading || cooldown > 0}>
                    {loading ? <span className="auth-spinner"></span> : cooldown > 0 ? `Wait ${cooldown}s` : 'Send OTP'}
                </button>
            )}
        </div>
    );
}
