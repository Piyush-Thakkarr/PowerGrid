import React from 'react';
import { useDemandResponse } from '../../../hooks/useMLEndpoints';

export default function DemandResponseTab({ mock }) {
    const { data: fetched, loading, error } = useDemandResponse(24, { skip: !!mock });
    const data = mock || fetched;

    if (!mock && loading) return <div className="role-loading">Loading peak forecast…</div>;
    if (!mock && error) return <div className="role-error">⚠ {error}</div>;

    const preds = data?.predictions || [];

    return (
        <div className="role-stack">
            <div className="role-grid">
                <div className="role-stat"><span className="role-stat-l">Predicted peak hours</span><span className="role-stat-v">{data?.predictedPeakCount ?? 0}</span></div>
                <div className="role-stat"><span className="role-stat-l">Threshold</span><span className="role-stat-v">{data?.threshold?.toFixed(2) || '—'}</span></div>
            </div>

            <div className="role-card">
                <div className="role-card-head"><span className="role-card-title">Next 24h · hourly peak probability</span></div>
                <div className="dr-strip">
                    {preds.map(p => {
                        const intensity = p.peakProbability || 0;
                        return (
                            <div
                                key={p.hour}
                                className={`dr-cell${p.isPeak ? ' dr-cell-peak' : ''}`}
                                style={{
                                    background: p.isPeak
                                        ? `rgba(255, 77, 79, ${0.4 + intensity * 0.6})`
                                        : `rgba(0, 170, 255, ${0.1 + intensity * 0.4})`,
                                }}
                                title={`${p.hour}h · ${(intensity * 100).toFixed(0)}% peak probability`}
                            >
                                <span className="dr-cell-h">{p.hour}</span>
                                <span className="dr-cell-p">{(intensity * 100).toFixed(0)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {data?.recommendation && (
                <div className="role-card role-card-tip">
                    <span className="role-card-tip-icon">💡</span>
                    <span className="role-card-tip-text">{data.recommendation}</span>
                </div>
            )}
        </div>
    );
}
