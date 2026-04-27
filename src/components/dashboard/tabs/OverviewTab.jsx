import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import CustomTooltip from '../CustomTooltip';

export default function OverviewTab({ liveWatts, todayUnits, thisMonthUnits, monthChange, bill, gamification, chartData, chartKey, chartView, setChartView, loading }) {
    const billTotal = bill?.totalCost || bill?.total || 0;
    const xp = gamification?.xp || 0;
    const level = gamification?.level || 1;
    const breakdown = bill?.breakdown || [];

    return (
        <>
            <div className="dash-hd">
                <div>
                    <h1>Overview</h1>
                    <div className="dash-hd-meta">Residential · Maharashtra · MSEDCL</div>
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
                    <div className="dash-sub"><span className="pos">&#8595; 12%</span> below daily peak</div>
                    <div className="pw-meta">
                        <div className="pw-m"><span className="pw-m-l">Voltage</span><span className="pw-m-v">230.7 V</span></div>
                        <div className="pw-m"><span className="pw-m-l">Current</span><span className="pw-m-v">4.9 A</span></div>
                        <div className="pw-m"><span className="pw-m-l">Freq</span><span className="pw-m-v">50.0 Hz</span></div>
                    </div>
                </div>

                {/* Chart */}
                <div className="dash-c c-chart">
                    <div className="dash-lbl">This Week <span className="dash-lbl-r">&#8594;</span></div>
                    <div className="ch-wrap">
                        {loading ? <div className="ch-empty">Loading...</div> : chartData.length === 0 ? <div className="ch-empty">No data</div> : (
                            <ResponsiveContainer width="100%" height={160}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0047AB" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#0047AB" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.02)" />
                                    <XAxis dataKey={chartKey} tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={30} />
                                    <Tooltip cursor={false} content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="units" stroke="#0066cc" fill="url(#af)" strokeWidth={1.2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="ch-val"><span className="n-lg">{Math.round(thisMonthUnits)}</span><span>kWh this month</span></div>
                </div>

                {/* Stats */}
                <div className="dash-c c-stat"><div className="dash-lbl">Monthly Bill</div><div className="n-lg">&#8377;{Math.round(billTotal).toLocaleString('en-IN')}</div><div className="dash-sub">{Math.round(thisMonthUnits)} units</div></div>
                <div className="dash-c c-stat"><div className="dash-lbl">Today</div><div className="n-lg">{todayUnits.toFixed(1)}</div><div className="dash-sub">kWh {monthChange !== 0 && <span className={monthChange > 0 ? 'neg' : 'pos'}>{monthChange > 0 ? '▲' : '▼'} {Math.abs(Math.round(monthChange))}%</span>}</div></div>
                <div className="dash-c c-stat"><div className="dash-lbl">Savings</div><div className="n-lg">&#8377;420</div><div className="dash-sub"><span className="pos">13%</span> below avg</div></div>
                <div className="dash-c c-stat"><div className="dash-lbl">Level</div><div className="n-lg">{level}</div><div className="dash-sub">{xp} / {level * 200} xp</div></div>

                {/* Daily bars */}
                <div className="dash-c c-daily">
                    <div className="dash-lbl">Daily Usage <span className="dash-lbl-r">&#8594;</span></div>
                    <div className="db-wrap">
                        {['M','T','W','T','F','S','S'].map((d, i) => (
                            <div className="db-g" key={i}>
                                <div className="db-stack">
                                    <div className={`db-bar db-a${i===4?' db-hi':''}`} style={{ height: `${[55,72,64,48,90,70,58][i]}%` }} />
                                    <div className="db-bar db-b" style={{ height: `${[35,42,38,30,50,55,45][i]}%` }} />
                                </div>
                                <div className="db-day">{d}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Anomalies */}
                <div className="dash-c c-anom">
                    <div className="dash-lbl">Anomalies <span className="an-count">8 flagged</span></div>
                    <div className="an-list">
                        {[{d:'12 Oct',t:'0.1 vs 14.3 expected',p:'-99%',h:true},{d:'23 Oct',t:'17.4 vs 7.1 expected',p:'+146%',h:false},{d:'24 Oct',t:'17.0 vs 8.5 expected',p:'+100%',h:true},{d:'12 Nov',t:'0.0 vs 13.0 expected',p:'-100%',h:true}].map((a,i) => (
                            <div className="an-row" key={i}>
                                <div className="an-bar" style={{ background: a.h ? '#ff6b6b' : 'rgba(255,255,255,0.15)' }} />
                                <div className="an-info"><div className="an-date">{a.d}</div><div className="an-detail">{a.t}</div></div>
                                <span className="an-pct">{a.p}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Forecast */}
                <div className="dash-c c-fc">
                    <div className="dash-lbl">7-Day Forecast · SARIMA <span className="dash-lbl-r">&#8594;</span></div>
                    <div className="fc-row">
                        {[{d:'MON',v:'11.2',h:42},{d:'TUE',v:'12.8',h:50},{d:'WED',v:'11.9',h:46},{d:'THU',v:'10.4',h:38},{d:'FRI',v:'14.1',h:56},{d:'SAT',v:'13.5',h:52},{d:'SUN',v:'12.3',h:48}].map((f,i) => (
                            <div className="fc-day" key={i}><div className="fc-d">{f.d}</div><div className="fc-bar" style={{height:f.h}} /><div className="fc-v">{f.v}</div></div>
                        ))}
                    </div>
                </div>

                {/* Bill */}
                <div className="dash-c c-bill">
                    <div className="dash-lbl">Bill Breakdown <span className="dash-lbl-r">&#8594;</span></div>
                    <div className="bl-rows">
                        {breakdown.slice(0,3).map((s,i) => (
                            <div className="bl-row" key={i}><span className="bl-l">{s.slabStart}-{s.slabEnd===999999?'∞':s.slabEnd} ({Math.round(s.units)}u)</span><span className="bl-r">{Math.round(s.cost)}</span></div>
                        ))}
                        {bill?.fixedCharge > 0 && <div className="bl-row"><span className="bl-l">Fixed + duty + surcharge</span><span className="bl-r">{Math.round((bill.fixedCharge||0)+(bill.electricityDuty||0)+(bill.fuelSurcharge||0))}</span></div>}
                        <div className="bl-row bl-total"><span className="bl-l">Total</span><span className="bl-r">&#8377;{Math.round(billTotal).toLocaleString('en-IN')}</span></div>
                    </div>
                </div>
            </div>
        </>
    );
}
