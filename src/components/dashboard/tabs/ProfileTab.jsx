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
    const [form, setForm] = useState({ name: user?.name || '', householdSize: String(user?.householdSize || 4), state: user?.state || 'Gujarat', tariffPlan: user?.tariffPlan || 'Residential' });
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            await updateProfile({ name: form.name, household_size: parseInt(form.householdSize), state: form.state, tariff_plan: form.tariffPlan });
            try { await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ name: form.name, householdSize: parseInt(form.householdSize), state: form.state, tariffPlan: form.tariffPlan }) }); } catch {}
            setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
        } catch (e) { setError(e.message); } finally { setSaving(false); }
    };

    const fields = [['Name', user?.name], [user?.phone ? 'Phone' : 'Email', user?.email || user?.phone], ['State', user?.state], ['Tariff', user?.tariffPlan], ['Household', user?.householdSize ? `${user.householdSize} members` : '—'], ['Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—']];

    return (
        <>
            <div className="dash-hd">
                <div><h1>Profile</h1><div className="dash-hd-meta">Level {gamification?.level || 1}</div></div>
                {!editing && <button className="dash-side-btn" style={{ width: 'auto', height: 'auto', padding: '.25rem .6rem', fontSize: '.55rem', fontFamily: "'DM Mono', monospace", letterSpacing: '1.5px', color: '#00aaff', border: '1px solid rgba(0,170,255,0.2)', borderRadius: 3, textTransform: 'uppercase' }} onClick={() => { setForm({ name: user?.name || '', householdSize: String(user?.householdSize || 4), state: user?.state || 'Gujarat', tariffPlan: user?.tariffPlan || 'Residential' }); setEditing(true); }}>Edit</button>}
            </div>

            {error && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '.65rem', color: '#ff6b6b', marginBottom: '.5rem' }}>{error}</div>}
            {saved && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '.65rem', color: '#00aaff', marginBottom: '.5rem' }}>Updated.</div>}

            {editing ? (
                <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1rem' }}>
                    <div className="dash-c"><div className="dash-lbl">Name</div><input style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: '.8rem', padding: '.3rem .5rem', outline: 'none', width: '100%' }} value={form.name} onChange={set('name')} /></div>
                    <div className="dash-c"><div className="dash-lbl">State</div><select style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: '.8rem', padding: '.3rem .5rem', outline: 'none', width: '100%' }} value={form.state} onChange={set('state')}>{INDIAN_STATES.map(s => <option key={s} value={s} style={{ background: '#050508' }}>{s}</option>)}</select></div>
                    <div className="dash-c"><div className="dash-lbl">Tariff</div><select style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: '.8rem', padding: '.3rem .5rem', outline: 'none', width: '100%' }} value={form.tariffPlan} onChange={set('tariffPlan')}>{TARIFF_OPTIONS.map(t => <option key={t} value={t} style={{ background: '#050508' }}>{t}</option>)}</select></div>
                    <div className="dash-c"><div className="dash-lbl">Household</div><select style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: '.8rem', padding: '.3rem .5rem', outline: 'none', width: '100%' }} value={form.householdSize} onChange={set('householdSize')}>{[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} style={{ background: '#050508' }}>{n} {n===1?'person':'people'}</option>)}</select></div>
                    <div className="dash-c" style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                        <button onClick={handleSave} disabled={saving} style={{ fontFamily: "'DM Mono', monospace", fontSize: '.6rem', letterSpacing: '1px', padding: '.35rem .75rem', borderRadius: 3, border: 'none', background: '#0047AB', color: '#fff', cursor: 'pointer' }}>{saving ? '...' : 'SAVE'}</button>
                        <button onClick={() => { setEditing(false); setError(''); }} style={{ fontFamily: "'DM Mono', monospace", fontSize: '.6rem', letterSpacing: '1px', padding: '.35rem .75rem', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)', background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>CANCEL</button>
                    </div>
                </div>
            ) : (
                <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {fields.map(([l, v]) => (
                        <div className="dash-c" key={l}><div className="dash-lbl">{l}</div><div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,0.7)' }}>{v || '—'}</div></div>
                    ))}
                </div>
            )}
        </>
    );
}
