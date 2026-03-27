import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../StatCard';

export default function BillingTab({ bill, history, loading, user }) {
    if (loading || !bill) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.3, fontFamily: "'DM Mono', monospace", fontSize: '.85rem' }}>
                Loading billing data...
            </div>
        );
    }

    const regulator = bill.regulator || 'SERC';
    const discom = bill.discom || '—';
    const totalUnits = bill.totalUnits || 0;
    const totalCost = bill.totalCost || 0;
    const avgRate = totalUnits > 0 ? (totalCost / totalUnits).toFixed(2) : '0.00';

    // Map history for cost trend chart
    const historyChart = history.map(h => ({
        month: h.month,
        cost: Math.round(h.totalUnits * parseFloat(avgRate)),
    }));

    return (
        <>
            <div className="dash-page-header">
                <h1>Billing</h1>
                <span className="dash-page-tag">{user?.state || 'State'} {regulator} — {discom}</span>
            </div>

            <div className="dash-stats-grid three">
                <StatCard label="Current Bill" value={`₹${Math.round(totalCost).toLocaleString('en-IN')}`} unit="" />
                <StatCard label="Units Used" value={Math.round(totalUnits)} unit="kWh" />
                <StatCard label="Avg Rate" value={`₹${avgRate}`} unit="/kWh" />
            </div>

            <div className="dash-card">
                <div className="dash-card-header"><h2>Slab Breakdown</h2></div>
                <div className="dash-bill-table">
                    <div className="dash-bill-row dash-bill-header">
                        <span>Slab (units)</span><span>Units Used</span><span>Rate (₹/unit)</span><span>Cost (₹)</span>
                    </div>
                    {(bill.breakdown || []).map((slab, i) => (
                        <div className="dash-bill-row" key={i}>
                            <span>{slab.slabStart}–{slab.slabEnd === 999999 ? '∞' : slab.slabEnd}</span>
                            <span>{Math.round(slab.units)}</span>
                            <span>{slab.rate}</span>
                            <span className="dash-bill-cost">{slab.cost.toFixed(2)}</span>
                        </div>
                    ))}
                    {bill.fixedCharge > 0 && (
                        <div className="dash-bill-row">
                            <span>Fixed Charge</span><span>—</span><span>—</span>
                            <span className="dash-bill-cost">{bill.fixedCharge.toFixed(2)}</span>
                        </div>
                    )}
                    {bill.electricityDuty > 0 && (
                        <div className="dash-bill-row">
                            <span>Electricity Duty</span><span>—</span><span>—</span>
                            <span className="dash-bill-cost">{bill.electricityDuty.toFixed(2)}</span>
                        </div>
                    )}
                    {bill.fuelSurcharge > 0 && (
                        <div className="dash-bill-row">
                            <span>Fuel Surcharge</span><span>—</span><span>—</span>
                            <span className="dash-bill-cost">{bill.fuelSurcharge.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="dash-bill-row" style={{ opacity: 0.35, fontSize: '.65rem', fontStyle: 'italic', border: 'none', padding: '.3rem .8rem' }}>
                        <span style={{ gridColumn: '1 / -1' }}>* Illustrative rates. Actual {regulator} tariff may differ.</span>
                    </div>
                    <div className="dash-bill-row dash-bill-total">
                        <span>Total</span><span>{Math.round(totalUnits)} kWh</span><span></span>
                        <span className="dash-bill-cost">₹{Math.round(totalCost).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {historyChart.length > 0 && (
                <div className="dash-card">
                    <div className="dash-card-header"><h2>Monthly Cost Trend</h2></div>
                    <div className="dash-chart-wrap">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={historyChart}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `₹${v}`} />
                                <Tooltip formatter={(v) => [`₹${v}`, 'Cost']} contentStyle={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 12 }} />
                                <Bar dataKey="cost" fill="#00aaff" radius={[3, 3, 0, 0]} fillOpacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </>
    );
}
