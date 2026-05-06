import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RoleSidebar({ tabs, tab, onTabChange, user, title }) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await Promise.race([logout(), new Promise(r => setTimeout(r, 1500))]); } catch {}
        Object.keys(localStorage).forEach(k => { if (k.startsWith('sb-')) localStorage.removeItem(k); });
        navigate('/', { replace: true });
    };

    return (
        <div className="dash-side">
            <Link to="/" className="dash-side-logo" title={title}>
                <svg viewBox="0 0 28 28" fill="none" width="24" height="24">
                    <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="rgba(0,170,255,0.4)" strokeWidth="1" />
                    <circle cx="14" cy="14" r="1.5" fill="#00aaff" />
                </svg>
            </Link>
            <div className="dash-side-nav">
                {tabs.map(t => {
                    const Ic = t.Icon;
                    return (
                        <button
                            key={t.id}
                            className={`dash-side-btn${tab === t.id ? ' active' : ''}`}
                            onClick={() => onTabChange(t.id)}
                            title={t.label}
                        >
                            {Ic ? <Ic size={16} strokeWidth={1.5} /> : null}
                        </button>
                    );
                })}
            </div>
            <div className="dash-side-bottom">
                <button className="dash-side-btn" onClick={handleLogout} title="Log out">
                    <LogOut size={14} strokeWidth={1.5} />
                </button>
                <div className="dash-side-av">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
            </div>
        </div>
    );
}
