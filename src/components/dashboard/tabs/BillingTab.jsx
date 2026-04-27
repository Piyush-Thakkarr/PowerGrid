import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function BillingTab({ bill, history, loading, user }) {
    if (loading || !bill) return <div className="ch-empty">Loading billing data...</div>;

    const totalUnits = bill.totalUnits || 0;
    const totalCost = bill.totalCost || 0;
    const avgRate = totalUnits > 0 ? (totalCost / totalUnits).toFixed(2) : '0.00';
    const breakdown = bill.breakdown || [];
    const historyChart = (history || []).map(h => ({ month: h.month, cost: Math.round(h.totalUnits * parseFloat(avgRate)) }));

    return (
        <>
            <div className="dash-hd"><div><h1>Billing</h1><div className="dash-hd-meta">{user?.state || 'State'} · {bill.discom || 'DISCOM'}</div></div></div>

            <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1rem' }}>
                <div className="dash-c"><div className="dash-lbl">Current Bill</div><div className="n-lg">&#8377;{Math.round(totalCost).toLocaleString('en-IN')}</div></div>
                <div className="dash-c"><div className="dash-lbl">Units Used</div><div className="n-lg">{Math.round(totalUnits)}</div><div className="dash-sub">kWh</div></div>
                <div className="dash-c"><div className="dash-lbl">Avg Rate</div><div className="n-lg">&#8377;{avgRate}</div><div className="dash-sub">per kWh</div></div>
            </div>

            <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Slab Breakdown</div>
                    <div className="bl-rows">
                        {breakdown.map((s, i) => (
                            <div className="bl-row" key={i}><span className="bl-l">{s.slabStart}–{s.slabEnd === 999999 ? '∞' : s.slabEnd} kWh @ &#8377;{s.rate}</span><span className="bl-r">{s.cost.toFixed(0)}</span></div>
                        ))}
                        {bill.fixedCharge > 0 && <div className="bl-row"><span className="bl-l">Fixed Charge</span><span className="bl-r">{bill.fixedCharge.toFixed(0)}</span></div>}
                        {bill.electricityDuty > 0 && <div className="bl-row"><span className="bl-l">Electricity Duty</span><span className="bl-r">{bill.electricityDuty.toFixed(0)}</span></div>}
                        {bill.fuelSurcharge > 0 && <div className="bl-row"><span className="bl-l">Fuel Surcharge</span><span className="bl-r">{bill.fuelSurcharge.toFixed(0)}</span></div>}
                        <div className="bl-row bl-total"><span className="bl-l">Total</span><span className="bl-r">&#8377;{Math.round(totalCost).toLocaleString('en-IN')}</span></div>
                    </div>
                </div>
            </div>

            {historyChart.length > 0 && (
                <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="dash-c">
                        <div className="dash-lbl">Monthly Cost Trend</div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={historyChart}>
                                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.02)" />
                                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `₹${v}`} />
                                <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, fontSize: 12 }} formatter={v => [`₹${v}`, 'Cost']} />
                                <Bar dataKey="cost" fill="#0047AB" radius={[1, 1, 0, 0]} fillOpacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </>
    );
}
