import React from 'react';

export default function Footer() {
    return (
        <footer>
            <div className="foot-in">
                <div className="foot-logo brand-name">POWER GRID</div>
                <div className="foot-links">
                    {['Privacy', 'Terms', 'API', 'Blog', 'Contact'].map(label => (
                        <span key={label} className="foot-link-disabled" title="Coming soon">{label}</span>
                    ))}
                </div>
                <div className="foot-copy">&copy; 2026 PowerGrid AI</div>
            </div>
        </footer>
    );
}
