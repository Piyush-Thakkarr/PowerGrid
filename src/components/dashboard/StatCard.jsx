import React from 'react';

export default function StatCard({ label, value, unit, trend }) {
    return (
        <div className="dash-stat-card">
            <span className="dash-stat-label">{label}</span>
            <span className="dash-stat-value">{value}</span>
            <div className="dash-stat-bottom">
                <span className="dash-stat-unit">{unit}</span>
                {trend !== undefined && trend !== 0 && (
                    <span className={`dash-stat-trend ${trend < 0 ? 'down' : 'up'}`}>
                        {trend < 0 ? '↓' : '↑'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
    );
}
