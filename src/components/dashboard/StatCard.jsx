import React from 'react';

export default function StatCard({ label, value, unit, trend }) {
    return (
        <div className="dash-c c-stat">
            <div className="dash-lbl">{label}</div>
            <div className="n-lg">{value}</div>
            <div className="dash-sub">
                {unit}
                {trend !== undefined && trend !== 0 && (
                    <span className={trend < 0 ? 'pos' : 'neg'}> {trend < 0 ? '↓' : '↑'} {Math.abs(trend)}%</span>
                )}
            </div>
        </div>
    );
}
