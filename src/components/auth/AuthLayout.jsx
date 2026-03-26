import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children, switchText, switchLink, switchLinkText }) {
    return (
        <div className="auth-page">
            <div className="auth-bg-grid"></div>
            <div className="auth-container">
                <Link to="/" className="auth-logo">
                    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                        <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="rgba(0,170,255,0.5)" strokeWidth="1" />
                        <polygon points="14,6 22,10 22,18 14,22 6,18 6,10" fill="none" stroke="rgba(0,170,255,0.25)" strokeWidth="1" />
                        <circle cx="14" cy="14" r="2" fill="#00aaff" />
                    </svg>
                    <span className="brand-name">POWER GRID</span>
                </Link>

                <div className="auth-card">
                    <div className="auth-card-glow"></div>
                    {children}
                    <p className="auth-switch">
                        {switchText} <Link to={switchLink}>{switchLinkText}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
