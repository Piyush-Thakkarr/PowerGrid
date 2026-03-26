import React from 'react';

export default function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="dash-tooltip">
            <span className="dash-tooltip-label">{label}</span>
            <span className="dash-tooltip-value">{payload[0].value} kWh</span>
        </div>
    );
}
