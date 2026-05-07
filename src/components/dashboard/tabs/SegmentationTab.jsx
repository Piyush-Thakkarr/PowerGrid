import React from 'react';
import { useMySegmentation } from '../../../hooks/useMLEndpoints';

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export default function SegmentationTab({ mock }) {
    const { data: fetched, loading, error } = useMySegmentation({ skip: !!mock });
    const data = mock || fetched;

    if (!mock && loading) return <div className="role-loading">Finding your usage group…</div>;
    if (!mock && error) return <div className="role-error">⚠ {error}</div>;

    const groupLetter = data?.clusterId != null ? GROUP_LABELS[data.clusterId] || data.clusterId : '—';

    return (
        <div className="role-stack">
            <div className="role-card role-card-hero">
                <div className="role-hero-l">Your usage group</div>
                <div className="role-hero-v">Group {groupLetter}</div>
                <div className="role-hero-sub">{data?.clusterSize ?? 0} households share your usage pattern</div>
            </div>

            <div className="role-grid">
                <div className="role-stat">
                    <span className="role-stat-l">Group's busiest hour</span>
                    <span className="role-stat-v">{data?.peakHour != null ? `${data.peakHour}:00` : '—'}</span>
                </div>
                <div className="role-stat">
                    <span className="role-stat-l">Group avg / day</span>
                    <span className="role-stat-v">{data?.clusterDailyAvg?.toFixed(2) || '—'} kWh</span>
                </div>
            </div>
        </div>
    );
}
