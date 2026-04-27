import React from 'react';

export default function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="tt">
            <span className="tt-l">{label}</span>
            <span className="tt-v">{payload[0].value} kWh</span>
        </div>
    );
}
