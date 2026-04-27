import React from 'react';
import { Link } from 'react-router-dom';
import { DASHBOARD_TABS } from '../../lib/constants';
import { LayoutDashboard, BarChart3, Receipt, Users, Trophy, BrainCircuit, User, Settings, LogOut } from 'lucide-react';

const ICONS = { overview: LayoutDashboard, analytics: BarChart3, billing: Receipt, compare: Users, rewards: Trophy, ml: BrainCircuit, profile: User };

export default function Sidebar({ tab, onTabChange, user, onLogout }) {
    return (
        <div className="dash-side">
            <Link to="/" className="dash-side-logo">
                <svg viewBox="0 0 28 28" fill="none" width="24" height="24">
                    <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="rgba(0,170,255,0.4)" strokeWidth="1" />
                    <circle cx="14" cy="14" r="1.5" fill="#00aaff" />
                </svg>
            </Link>
            <div className="dash-side-nav">
                {DASHBOARD_TABS.map(t => {
                    const Ic = ICONS[t.id];
                    return (
                        <button key={t.id} className={`dash-side-btn${tab === t.id ? ' active' : ''}`} onClick={() => onTabChange(t.id)}>
                            {Ic ? <Ic size={16} strokeWidth={1.5} /> : null}
                        </button>
                    );
                })}
            </div>
            <div className="dash-side-bottom">
                <button className="dash-side-btn" onClick={() => onTabChange('profile')}><Settings size={15} strokeWidth={1.5} /></button>
                <button className="dash-side-btn" onClick={onLogout} style={{ color: 'rgba(255,255,255,0.15)' }}><LogOut size={14} strokeWidth={1.5} /></button>
                <div className="dash-side-av">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
            </div>
        </div>
    );
}
