import React from 'react';
import { Link } from 'react-router-dom';
import { DASHBOARD_TABS } from '../../lib/constants';

export default function Sidebar({ tab, onTabChange, user, level, onLogout, loggingOut }) {
    return (
        <aside className="dash-sidebar">
            <Link to="/" className="dash-sidebar-logo" title="Back to home">
                <svg viewBox="0 0 28 28" fill="none" width="22" height="22">
                    <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="rgba(0,170,255,0.5)" strokeWidth="1" />
                    <circle cx="14" cy="14" r="2" fill="#00aaff" />
                </svg>
                <span className="brand-name" style={{ fontSize: '.85rem' }}>POWER GRID</span>
            </Link>
            <nav className="dash-sidebar-nav" role="tablist" aria-label="Dashboard navigation">
                {DASHBOARD_TABS.map(t => (
                    <button
                        key={t.id}
                        role="tab"
                        aria-selected={tab === t.id}
                        aria-current={tab === t.id ? 'page' : undefined}
                        className={`dash-nav-item ${tab === t.id ? 'active' : ''}`}
                        onClick={() => onTabChange(t.id)}
                        title={t.label}
                    >
                        <span className="dash-nav-icon">{t.icon}</span>
                        <span className="dash-nav-label">{t.label}</span>
                    </button>
                ))}
            </nav>
            <div className="dash-sidebar-footer">
                <div className="dash-sidebar-user">
                    <div className="dash-avatar-sm">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div className="dash-sidebar-user-info">
                        <span>{user?.name || 'User'}</span>
                        <span className="dash-sidebar-user-meta">Lvl {level}</span>
                    </div>
                </div>
                <button className="dash-logout-sm" onClick={onLogout} disabled={loggingOut} title="Logout">
                    {loggingOut ? '...' : 'Logout'}
                </button>
            </div>
        </aside>
    );
}
