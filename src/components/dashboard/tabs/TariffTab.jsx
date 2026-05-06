import React from 'react';
import { useTariffOptimizer } from '../../../hooks/useMLEndpoints';

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

export default function TariffTab() {
    const { data, loading, error } = useTariffOptimizer();

    if (loading) return <div className="role-loading">Calculating optimal tariff…</div>;
    if (error) return <div className="role-error">⚠ {error}</div>;

    const plans = data?.allPlans || [];
    const savings = data?.monthlySavings || 0;

    return (
        <div className="role-stack">
            <div className="role-card role-card-hero">
                <div className="role-hero-l">Recommended plan</div>
                <div className="role-hero-v">{data?.recommendedPlan || '—'}</div>
                <div className="role-hero-sub">
                    {savings > 0
                        ? <>Save <strong>₹{fmt(savings)}/mo</strong> vs current ({data?.currentPlan})</>
                        : <>You're already on the optimal plan ({data?.currentPlan})</>
                    }
                </div>
            </div>

            <div className="role-grid">
                <div className="role-stat"><span className="role-stat-l">Monthly kWh</span><span className="role-stat-v">{data?.monthlyKwh?.toFixed(1) || '—'}</span></div>
                <div className="role-stat"><span className="role-stat-l">Peak Usage</span><span className="role-stat-v">{data?.peakUsagePercent?.toFixed(1) || '—'}%</span></div>
                <div className="role-stat"><span className="role-stat-l">DISCOM</span><span className="role-stat-v">{data?.discom || '—'}</span></div>
                <div className="role-stat"><span className="role-stat-l">State</span><span className="role-stat-v">{data?.state || '—'}</span></div>
            </div>

            <div className="role-card">
                <div className="role-card-head"><span className="role-card-title">All plans compared</span></div>
                <div className="role-table-wrap">
                    <table className="role-table">
                        <thead><tr><th>Plan</th><th>Energy</th><th>Fixed</th><th>Duty</th><th>Fuel surch.</th><th>Total bill</th></tr></thead>
                        <tbody>
                            {plans.map(p => (
                                <tr key={p.plan} className={p.plan === data?.recommendedPlan ? 'role-row-highlight' : ''}>
                                    <td>{p.plan}</td>
                                    <td>₹{fmt(p.energyCharge?.toFixed(0))}</td>
                                    <td>₹{fmt(p.fixedCharge?.toFixed(0))}</td>
                                    <td>₹{fmt(p.duty?.toFixed(0))}</td>
                                    <td>₹{fmt(p.fuelSurcharge?.toFixed(0))}</td>
                                    <td><strong>₹{fmt(p.totalBill?.toFixed(0))}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
