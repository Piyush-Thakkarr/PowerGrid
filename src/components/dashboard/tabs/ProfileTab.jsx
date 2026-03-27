import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { INDIAN_STATES, TARIFF_OPTIONS } from '../../../lib/constants';
import { apiFetch } from '../../../lib/api';

export default function ProfileTab({ user, gamification }) {
    const { updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: user?.name || '',
        householdSize: String(user?.householdSize || 4),
        state: user?.state || 'Gujarat',
        tariffPlan: user?.tariffPlan || 'Residential',
    });

    const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            // Update Supabase profile
            await updateProfile({
                name: form.name,
                household_size: parseInt(form.householdSize),
                state: form.state,
                tariff_plan: form.tariffPlan,
            });

            // Also sync with backend
            try {
                await apiFetch('/api/profile', {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: form.name,
                        householdSize: parseInt(form.householdSize),
                        state: form.state,
                        tariffPlan: form.tariffPlan,
                    }),
                });
            } catch { /* backend sync is best-effort */ }

            setEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const level = gamification?.level || 1;

    return (
        <>
            <div className="dash-page-header">
                <h1>Profile</h1>
                <span className="dash-page-tag">Level {level}</span>
            </div>
            <div className="dash-card">
                <div className="dash-card-header">
                    <h2>Account Details</h2>
                    {!editing && (
                        <button className="dash-view-toggle-btn" onClick={() => {
                            setForm({
                                name: user?.name || '',
                                householdSize: String(user?.householdSize || 4),
                                state: user?.state || 'Gujarat',
                                tariffPlan: user?.tariffPlan || 'Residential',
                            });
                            setEditing(true);
                        }}>
                            Edit
                        </button>
                    )}
                </div>
                {error && <div className="auth-error" role="alert" style={{ margin: '0 1.3rem .8rem' }}>{error}</div>}
                {saved && <div style={{ margin: '0 1.3rem .8rem', color: '#39FF14', fontSize: '.8rem', fontFamily: "'DM Mono', monospace" }}>Profile updated.</div>}
                {editing ? (
                    <div className="dash-profile-grid" style={{ padding: '0 1.3rem 1.3rem' }}>
                        <div className="dash-profile-item">
                            <label htmlFor="prof-name" className="dash-profile-label">Name</label>
                            <input id="prof-name" className="dash-profile-input" value={form.name} onChange={set('name')} />
                        </div>
                        <div className="dash-profile-item">
                            <span className="dash-profile-label">{user?.phone ? 'Phone' : 'Email'}</span>
                            <span className="dash-profile-value">{user?.email || user?.phone || '—'}</span>
                        </div>
                        <div className="dash-profile-item">
                            <label htmlFor="prof-state" className="dash-profile-label">State</label>
                            <select id="prof-state" className="dash-profile-input" value={form.state} onChange={set('state')}>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="dash-profile-item">
                            <label htmlFor="prof-tariff" className="dash-profile-label">Tariff Plan</label>
                            <select id="prof-tariff" className="dash-profile-input" value={form.tariffPlan} onChange={set('tariffPlan')}>
                                {TARIFF_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="dash-profile-item">
                            <label htmlFor="prof-household" className="dash-profile-label">Household</label>
                            <select id="prof-household" className="dash-profile-input" value={form.householdSize} onChange={set('householdSize')}>
                                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>)}
                            </select>
                        </div>
                        <div className="dash-profile-item">
                            <span className="dash-profile-label">Member Since</span>
                            <span className="dash-profile-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}</span>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '.8rem', marginTop: '.5rem' }}>
                            <button className="auth-submit" style={{ flex: 1, maxWidth: '200px' }} onClick={handleSave} disabled={saving}>
                                {saving ? '...' : 'Save Changes'}
                            </button>
                            <button className="auth-resend" onClick={() => {
                                setEditing(false);
                                setError('');
                                setForm({
                                    name: user?.name || '',
                                    householdSize: String(user?.householdSize || 4),
                                    state: user?.state || 'Gujarat',
                                    tariffPlan: user?.tariffPlan || 'Residential',
                                });
                            }}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="dash-profile-grid">
                        {[
                            ['Name', user?.name || '—'],
                            [user?.phone ? 'Phone' : 'Email', user?.email || user?.phone || '—'],
                            ['State', user?.state || '—'],
                            ['Tariff Plan', user?.tariffPlan || '—'],
                            ['Household', user?.householdSize ? `${user.householdSize} members` : '—'],
                            ['Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'],
                        ].map(([label, value]) => (
                            <div className="dash-profile-item" key={label}>
                                <span className="dash-profile-label">{label}</span>
                                <span className="dash-profile-value">{value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
