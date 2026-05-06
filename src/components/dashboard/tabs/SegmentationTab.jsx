import React from 'react';
import { useMySegmentation } from '../../../hooks/useMLEndpoints';

export default function SegmentationTab() {
    const { data, loading, error } = useMySegmentation();

    if (loading) return <div className="role-loading">Finding your segment…</div>;
    if (error) return <div className="role-error">⚠ {error}</div>;

    return (
        <div className="role-stack">
            <div className="role-card role-card-hero">
                <div className="role-hero-l">Your segment</div>
                <div className="role-hero-v">Cluster #{data?.clusterId ?? '—'}</div>
                <div className="role-hero-sub">{data?.clusterSize ?? 0} households share your usage pattern</div>
            </div>

            <div className="role-grid">
                <div className="role-stat">
                    <span className="role-stat-l">Cluster peak hour</span>
                    <span className="role-stat-v">{data?.peakHour != null ? `${data.peakHour}:00` : '—'}</span>
                </div>
                <div className="role-stat">
                    <span className="role-stat-l">Cluster avg / day</span>
                    <span className="role-stat-v">{data?.clusterDailyAvg?.toFixed(2) || '—'} kWh</span>
                </div>
            </div>
        </div>
    );
}
