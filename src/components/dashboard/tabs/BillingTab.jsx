import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { calculateBill } from '../../../lib/demoData';
import StatCard from '../StatCard';

const STATE_REGULATORS = {
    'Gujarat': 'GERC', 'Maharashtra': 'MERC', 'Delhi': 'DERC', 'Karnataka': 'KERC',
    'Tamil Nadu': 'TNERC', 'Rajasthan': 'RERC', 'Uttar Pradesh': 'UPERC', 'Kerala': 'KSERC',
    'West Bengal': 'WBERC', 'Telangana': 'TSERC', 'Andhra Pradesh': 'APERC', 'Punjab': 'PSERC',
    'Haryana': 'HERC', 'Madhya Pradesh': 'MPERC', 'Bihar': 'BERC', 'Odisha': 'OERC',
    'Jharkhand': 'JSERC', 'Chhattisgarh': 'CSERC', 'Assam': 'AERC', 'Goa': 'JERC',
    'Himachal Pradesh': 'HPERC', 'Uttarakhand': 'UERC', 'Sikkim': 'SSERC',
    'Manipur': 'MSPDCL', 'Meghalaya': 'MeSERC', 'Mizoram': 'JERC-M', 'Nagaland': 'NSERC', 'Tripura': 'TERC',
};

export default function BillingTab({ bill, thisMonthUnits, data, user }) {
    const monthlyBills = data.monthly.map(m => ({ ...m, cost: calculateBill(m.units).total }));
    const regulator = STATE_REGULATORS[user?.state] || 'SERC';

    return (
        <>
            <div className="dash-page-header">
                <h1>Billing</h1>
                <span className="dash-page-tag">{user?.state || 'State'} {regulator} Tariff</span>
            </div>

            <div className="dash-stats-grid three">
                <StatCard label="Current Bill" value={`₹${bill.total.toLocaleString('en-IN')}`} unit="" />
                <StatCard label="Units Used" value={thisMonthUnits.toFixed(0)} unit="kWh" />
                <StatCard label="Avg Rate" value={`₹${thisMonthUnits > 0 ? (bill.total / thisMonthUnits).toFixed(2) : '0.00'}`} unit="/kWh" />
            </div>

            <div className="dash-card">
                <div className="dash-card-header"><h2>Slab Breakdown</h2></div>
                <div className="dash-bill-table">
                    <div className="dash-bill-row dash-bill-header">
                        <span>Slab (units)</span><span>Units Used</span><span>Rate (₹/unit)</span><span>Cost (₹)</span>
                    </div>
                    {bill.breakdown.map((slab, i) => (
                        <div className="dash-bill-row" key={i}>
                            <span>{slab.range}</span><span>{slab.units}</span><span>{slab.rate}</span>
                            <span className="dash-bill-cost">{slab.cost.toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="dash-bill-row" style={{ opacity: 0.35, fontSize: '.65rem', fontStyle: 'italic', border: 'none', padding: '.3rem .8rem' }}>
                        <span style={{ gridColumn: '1 / -1' }}>* Illustrative rates. Actual {regulator} tariff may differ.</span>
                    </div>
                    <div className="dash-bill-row dash-bill-total">
                        <span>Total</span><span>{thisMonthUnits.toFixed(0)} kWh</span><span></span>
                        <span className="dash-bill-cost">₹{bill.total.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            <div className="dash-card">
                <div className="dash-card-header"><h2>Monthly Cost Trend</h2></div>
                <div className="dash-chart-wrap">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyBills}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `₹${v}`} />
                            <Tooltip formatter={(v) => [`₹${v}`, 'Cost']} contentStyle={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 12 }} />
                            <Bar dataKey="cost" fill="#00aaff" radius={[3, 3, 0, 0]} fillOpacity={0.7} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}
