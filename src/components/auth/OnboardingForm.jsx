import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INDIAN_STATES, TARIFF_OPTIONS, HOUSEHOLD_SIZES, DEFAULTS } from '../../lib/constants';

export default function OnboardingForm() {
    const { updateProfile, refreshProfile, signOut } = useAuth();
    const [form, setForm] = useState({
        name: '',
        state: DEFAULTS.state,
        householdSize: String(DEFAULTS.householdSize),
        tariffPlan: DEFAULTS.tariffPlan,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError('');
        try {
            await updateProfile({
                name: form.name.trim(),
                householdSize: parseInt(form.householdSize, 10),
                state: form.state,
                tariffPlan: form.tariffPlan,
            });
            await refreshProfile();
        } catch (err) {
            setError(err.message || 'Could not save profile.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="onboard-page">
            <form className="onboard-card" onSubmit={handleSubmit}>
                <div className="onboard-tag">Welcome to PowerGrid</div>
                <h1 className="onboard-title">Tell us about your home</h1>
                <p className="onboard-sub">Two minutes to set up. We'll personalize your dashboard from there.</p>

                <label className="onboard-label">
                    <span>Your name</span>
                    <input
                        type="text"
                        value={form.name}
                        onChange={handleChange('name')}
                        placeholder="e.g. Archie Tyagi"
                        required
                        minLength={2}
                    />
                </label>

                <label className="onboard-label">
                    <span>State</span>
                    <select value={form.state} onChange={handleChange('state')}>
                        {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                </label>

                <label className="onboard-label">
                    <span>Household size</span>
                    <select value={form.householdSize} onChange={handleChange('householdSize')}>
                        {HOUSEHOLD_SIZES.map(n => (
                            <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                        ))}
                    </select>
                </label>

                <label className="onboard-label">
                    <span>Tariff plan</span>
                    <select value={form.tariffPlan} onChange={handleChange('tariffPlan')}>
                        {TARIFF_OPTIONS.map(t => <option key={t}>{t}</option>)}
                    </select>
                </label>

                {error && <div className="onboard-error">{error}</div>}

                <div className="onboard-actions">
                    <button type="submit" className="btn-p btn-pulse" disabled={submitting}>
                        <span>{submitting ? 'Saving…' : 'Start'}</span>
                        <span>→</span>
                    </button>
                    <button type="button" className="onboard-cancel" onClick={signOut}>
                        Sign out
                    </button>
                </div>
            </form>
        </div>
    );
}
