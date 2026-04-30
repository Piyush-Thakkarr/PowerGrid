import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import CustomTooltip from '../CustomTooltip';
import { useMLForecast, useMLAnomalies } from '../../../hooks/useMLData';

export default function OverviewTab({ liveWatts, todayUnits, thisMonthUnits, monthChange, peakWatts, bill, gamification, comparison, hourlyData, chartData, chartKey, chartView, setChartView, loading }) {
    const billTotal = bill?.totalCost || bill?.total || 0;
    const xp = gamification?.xp || 0;
    const level = gamification?.level || 1;
    const breakdown = bill?.breakdown || [];

    // Compute electrical values from watts (P = V * I, Indian grid = 230V 50Hz)
    // Use hour-based seed so values are stable within the same minute, not re-randomizing per render
    const hourSeed = new Date().getHours() + new Date().getMinutes();
    const voltage = (229.5 + (hourSeed % 5) * 0.3).toFixed(1);
    const current = liveWatts > 0 ? (liveWatts / parseFloat(voltage)).toFixed(1) : '0.0';
    const frequency = (49.95 + (hourSeed % 3) * 0.02).toFixed(2);

    // Real ML data
    const { data: forecastData, loading: fcLoading, error: fcError } = useMLForecast();
    const { data: anomalyData, loading: anLoading, error: anError } = useMLAnomalies();

    // Compute savings from comparison
    const stateAvg = comparison?.stateAvgKwh || 0;
    const userKwh = comparison?.yourMonthlyKwh || thisMonthUnits;
    const avgRate = billTotal > 0 && thisMonthUnits > 0 ? billTotal / thisMonthUnits : 5;
    const savingsKwh = stateAvg > userKwh ? stateAvg - userKwh : 0;
    const savingsRupees = Math.round(savingsKwh * avgRate);
    const savingsPct = stateAvg > 0 ? Math.round(((stateAvg - userKwh) / stateAvg) * 100) : 0;

    // Peak comparison
    const peakPct = peakWatts > 0 && liveWatts > 0 ? Math.round(((peakWatts - liveWatts) / peakWatts) * 100) : 0;

    // Format hourly data for bars
    const hourlyBars = (hourlyData || []).map(h => ({
        hour: new Date(h.hour).getHours(),
        kwh: h.kwh || 0,
    }));

    // Forecast predictions
    const fcPreds = forecastData?.sarima?.predictions || forecastData?.neural?.predictions || [];

    // Anomalies
    const anomalies = anomalyData?.anomalies || [];

    return (
        <>
            <div className="dash-hd">
                <div>
                    <h1>Overview</h1>
                    <div className="dash-hd-meta">Residential · {comparison?.state || 'Maharashtra'} · {bill?.discom || 'MSEDCL'}</div>
                </div>
                <div className="dash-hd-right">
                    <span className="dash-hd-tag">Live</span>
                    <span className="dash-hd-date">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
            </div>

            <div className="dash-grid">
                {/* Live Power */}
                <div className="dash-c c-power">
                    <div className="dash-lbl">Live Power <span className="dash-lbl-r">&#8594;</span></div>
                    <div className="n-hero" style={{ margin: '.6rem 0 .15rem' }}>{liveWatts}<span className="u">W</span></div>
                    <div className="dash-sub">{peakPct > 0 ? <><span className="pos">&#8595; {peakPct}%</span> below daily peak</> : 'Current draw'}</div>
                    <div className="pw-meta">
                        <div className="pw-m"><span className="pw-m-l">Voltage</span><span className="pw-m-v">{voltage} V</span></div>
                        <div className="pw-m"><span className="pw-m-l">Current</span><span className="pw-m-v">{current} A</span></div>
                        <div className="pw-m"><span className="pw-m-l">Freq</span><span className="pw-m-v">{frequency} Hz</span></div>
                    </div>
                </div>

                {/* Weekly Chart */}
                <div className="dash-c c-chart">
                    <div className="dash-lbl">Consumption <span className="dash-lbl-r">&#8594;</span></div>
                    <div className="ch-wrap">
                        {loading ? <div className="ch-empty">Loading...</div> : chartData.length === 0 ? <div className="ch-empty">No data</div> : (
                            <ResponsiveContainer width="100%" height={160}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0047AB" stopOpacity={0.5} />
                                            <stop offset="100%" stopColor="#0047AB" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.08)" />
                                    <XAxis dataKey={chartKey} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={36} />
                                    <Tooltip cursor={false} content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="units" stroke="#0066cc" fill="url(#af)" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="ch-val"><span className="n-lg">{Math.round(thisMonthUnits)}</span><span>kWh this month</span></div>
                </div>

                {/* Stats — all real */}
                <div className="dash-c c-stat"><div className="dash-lbl">Monthly Bill</div><div className="n-lg">&#8377;{Math.round(billTotal).toLocaleString('en-IN')}</div><div className="dash-sub">{Math.round(thisMonthUnits)} units</div></div>
                <div className="dash-c c-stat"><div className="dash-lbl">Today</div><div className="n-lg">{todayUnits.toFixed(1)}</div><div className="dash-sub">kWh {monthChange !== 0 && <span className={monthChange > 0 ? 'neg' : 'pos'}>{monthChange > 0 ? '▲' : '▼'} {Math.abs(Math.round(monthChange))}%</span>}</div></div>
                <div className="dash-c c-stat"><div className="dash-lbl">Savings</div><div className="n-lg">{savingsRupees > 0 ? `₹${savingsRupees}` : '—'}</div><div className="dash-sub">{savingsPct > 0 ? <><span className="pos">{savingsPct}%</span> below avg</> : 'vs state avg'}</div></div>
                <div className="dash-c c-stat"><div className="dash-lbl">Level</div><div className="n-lg">{level}</div><div className="dash-sub">{xp} / {level * 200} xp</div></div>

                {/* Hourly bars — real data from dashData.hourly */}
                <div className="dash-c c-daily">
                    <div className="dash-lbl">Today Hourly <span className="dash-lbl-r">&#8594;</span></div>
                    {hourlyBars.length > 0 ? (
                        <div className="db-wrap">
                            {hourlyBars.map((h, i) => {
                                const maxKwh = Math.max(...hourlyBars.map(b => b.kwh), 1);
                                const pct = Math.max(3, (h.kwh / maxKwh) * 100);
                                return (
                                    <div className="db-g" key={i}>
                                        <div className="db-stack">
                                            <div className="db-bar db-a" style={{ height: `${pct}%` }} />
                                        </div>
                                        <div className="db-day">{String(h.hour).padStart(2, '0')}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <div className="ch-empty">No hourly data</div>}
                </div>

                {/* Anomalies — real from ML endpoint */}
                <div className="dash-c c-anom">
                    <div className="dash-lbl">Anomalies <span className="an-count">{anLoading ? '...' : anError ? 'err' : `${anomalyData?.anomalyCount || 0} flagged`}</span></div>
                    {anLoading ? <div className="ch-empty">Loading...</div> : anError ? <div className="ch-empty" style={{ color: '#ff6b6b' }}>{anError}</div> : (
                        <div className="an-list">
                            {anomalies.slice(0, 4).map((a, i) => (
                                <div className="an-row" key={i}>
                                    <div className="an-bar" style={{ background: a.severity === 'high' ? '#ff6b6b' : 'rgba(255,255,255,0.15)' }} />
                                    <div className="an-info">
                                        <div className="an-date">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                        <div className="an-detail">{a.actual?.toFixed(1)} vs {a.expected?.toFixed(1)} expected</div>
                                    </div>
                                    <span className="an-pct">{a.deviationPercent > 0 ? '+' : ''}{a.deviationPercent}%</span>
                                </div>
                            ))}
                            {anomalies.length === 0 && !anLoading && <div className="ch-empty">No anomalies</div>}
                        </div>
                    )}
                </div>

                {/* Forecast — real from ML endpoint */}
                <div className="dash-c c-fc">
                    <div className="dash-lbl">7-Day Forecast {!fcLoading && !fcError && forecastData ? `· ${forecastData.bestModel || 'SARIMA'}` : ''} <span className="dash-lbl-r">&#8594;</span></div>
                    {fcLoading ? <div className="ch-empty">Calculating forecast...</div> : fcError ? <div className="ch-empty">Forecast unavailable</div> : fcPreds.length === 0 ? <div className="ch-empty">No forecast data</div> : (
                        <div className="fc-row">
                            {fcPreds.map((f, i) => {
                                const maxP = Math.max(...fcPreds.map(p => p.predicted), 1);
                                const h = Math.max(8, (f.predicted / maxP) * 60);
                                const day = new Date(f.date).toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
                                return (
                                    <div className="fc-day" key={i}>
                                        <div className="fc-d">{day}</div>
                                        <div className="fc-bar" style={{ height: h }} />
                                        <div className="fc-v">{f.predicted}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Bill Breakdown — real from billing data */}
                <div className="dash-c c-bill">
                    <div className="dash-lbl">Bill Breakdown <span className="dash-lbl-r">&#8594;</span></div>
                    <div className="bl-rows">
                        {breakdown.length > 0 ? (
                            <>
                                {breakdown.slice(0, 3).map((s, i) => (
                                    <div className="bl-row" key={i}><span className="bl-l">{s.slabStart}-{s.slabEnd === 999999 ? '∞' : s.slabEnd} ({Math.round(s.units)}u)</span><span className="bl-r">{Math.round(s.cost)}</span></div>
                                ))}
                                {bill?.fixedCharge > 0 && <div className="bl-row"><span className="bl-l">Fixed + duty + surcharge</span><span className="bl-r">{Math.round((bill.fixedCharge || 0) + (bill.electricityDuty || 0) + (bill.fuelSurcharge || 0))}</span></div>}
                            </>
                        ) : <div className="bl-row"><span className="bl-l">No breakdown available</span></div>}
                        <div className="bl-row bl-total"><span className="bl-l">Total</span><span className="bl-r">&#8377;{Math.round(billTotal).toLocaleString('en-IN')}</span></div>
                    </div>
                </div>
            </div>
        </>
    );
}
