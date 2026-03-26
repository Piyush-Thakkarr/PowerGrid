import React from 'react';

export default function AuthMethodToggle({ method, onChange }) {
    return (
        <div className="auth-method-toggle" role="tablist" aria-label="Sign in method">
            <button role="tab" aria-selected={method === 'email'} className={method === 'email' ? 'active' : ''} onClick={() => onChange('email')}>
                Email
            </button>
            <button role="tab" aria-selected={method === 'phone'} className={method === 'phone' ? 'active' : ''} onClick={() => onChange('phone')}>
                Phone
            </button>
        </div>
    );
}
