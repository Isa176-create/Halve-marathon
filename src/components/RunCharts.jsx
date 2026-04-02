import React, { useState } from 'react';

// Helper: pace string "mm:ss" omzetten naar secondes
const paceToSeconds = (paceStr) => {
  if (!paceStr || paceStr === '—') return 0;
  const [mins, secs] = paceStr.split(':').map(Number);
  return mins * 60 + (secs || 0);
};

// Helper: secondes terug naar "mm:ss"
const secondsToPace = (secs) => {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// SVG Bar Chart voor kilometers
const KmBarChart = ({ runs }) => {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const data = [...runs].reverse(); // chronologisch
  const maxKm = Math.max(...data.map((r) => parseFloat(r.distanceKm)));
  const chartH = 130;
  const chartW = 300;
  const barW = Math.max(8, (chartW / data.length) * 0.6);
  const gap = chartW / data.length;
  const selected = selectedIdx !== null ? data[selectedIdx] : null;

  return (
    <div>
      {/* Tooltip bij geselecteerde balk */}
      {selected && (
        <div style={{
          backgroundColor: 'rgba(252,76,2,0.15)',
          border: '1px solid rgba(252,76,2,0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.6rem 0.9rem',
          marginBottom: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
        }}>
          <div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
              {new Date(selected.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selected.name}</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Afstand</div>
              <div style={{ fontWeight: 700, color: '#FC4C02' }}>{selected.distanceKm} km</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Pace</div>
              <div style={{ fontWeight: 700, color: '#FC4C02' }}>{selected.pacePerKm}/km</div>
            </div>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${chartW} ${chartH + 30}`}
        style={{ width: '100%', maxWidth: chartW, overflow: 'visible' }}
      >
        {/* Gridlijnen */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1={0}
            y1={chartH - chartH * frac}
            x2={chartW}
            y2={chartH - chartH * frac}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {data.map((run, i) => {
          const km = parseFloat(run.distanceKm);
          const barH = (km / maxKm) * chartH;
          const x = i * gap + gap / 2 - barW / 2;
          const y = chartH - barH;
          const isLong = km >= 15;
          const isSelected = selectedIdx === i;

          return (
            <g
              key={run.id}
              onClick={() => setSelectedIdx(isSelected ? null : i)}
              style={{ cursor: 'pointer' }}
            >
              {/* Klikbaar gebied (groter dan de balk zelf) */}
              <rect x={x - 4} y={0} width={barW + 8} height={chartH + 30} fill="transparent" />
              <defs>
                <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isLong ? '#ffb347' : '#FC4C02'} stopOpacity={isSelected ? '1' : '0.85'} />
                  <stop offset="100%" stopColor={isLong ? '#FC4C02' : '#f24f2b'} stopOpacity={isSelected ? '0.9' : '0.6'} />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill={`url(#bar-grad-${i})`}
                stroke={isSelected ? 'white' : 'none'}
                strokeWidth={isSelected ? 1 : 0}
                strokeOpacity={0.6}
              />
              {/* Datum label onderaan (elke 3e) */}
              {i % 3 === 0 && (
                <text
                  x={i * gap + gap / 2}
                  y={chartH + 18}
                  textAnchor="middle"
                  fill={isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'}
                  fontSize="9"
                >
                  {new Date(run.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </text>
              )}
            </g>
          );
        })}

        {/* Y-as labels */}
        {[0, Math.round(maxKm / 2), Math.round(maxKm)].map((val, i) => (
          <text
            key={i}
            x={-4}
            y={chartH - (val / maxKm) * chartH + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.3)"
            fontSize="9"
          >
            {val}
          </text>
        ))}
      </svg>
    </div>
  );
};


// SVG Line Chart voor pace
const PaceLineChart = ({ runs }) => {
  const data = [...runs].reverse().filter((r) => r.pacePerKm !== '—');
  if (data.length < 2) return null;

  const paces = data.map((r) => paceToSeconds(r.pacePerKm));
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const range = maxPace - minPace || 60;

  const chartH = 130;
  const chartW = 300;
  const padLeft = 30;
  const padRight = 10;
  const innerW = chartW - padLeft - padRight;

  const toX = (i) => padLeft + (i / (data.length - 1)) * innerW;
  const toY = (pace) => chartH - ((pace - minPace) / range) * (chartH * 0.85) - chartH * 0.05;

  const points = data.map((r, i) => ({ x: toX(i), y: toY(paceToSeconds(r.pacePerKm)), run: r }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Area fill path
  const areaPath = `M ${points[0].x},${chartH} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x},${chartH} Z`;

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH + 30}`}
      style={{ width: '100%', maxWidth: chartW, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="pace-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FC4C02" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FC4C02" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlijnen */}
      {[0.25, 0.5, 0.75, 1].map((frac) => (
        <line
          key={frac}
          x1={padLeft}
          y1={chartH - chartH * frac * 0.85 - chartH * 0.05}
          x2={chartW - padRight}
          y2={chartH - chartH * frac * 0.85 - chartH * 0.05}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#pace-area-grad)" />

      {/* Lijn */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#FC4C02"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Punten */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#FC4C02" stroke="var(--bg-base)" strokeWidth={1.5} />
      ))}

      {/* Datum labels (elke 3e) */}
      {points.map((p, i) =>
        i % 3 === 0 ? (
          <text
            key={i}
            x={p.x}
            y={chartH + 18}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
          >
            {new Date(p.run.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </text>
        ) : null
      )}

      {/* Y-as pace labels */}
      {[minPace, Math.round((minPace + maxPace) / 2), maxPace].map((val, i) => (
        <text
          key={i}
          x={padLeft - 4}
          y={toY(val) + 4}
          textAnchor="end"
          fill="rgba(255,255,255,0.3)"
          fontSize="9"
        >
          {secondsToPace(val)}
        </text>
      ))}

      {/* Beste pace label */}
      {(() => {
        const best = points.find((p) => paceToSeconds(p.run.pacePerKm) === minPace);
        return best ? (
          <text x={best.x} y={best.y - 8} textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="bold">
            {secondsToPace(minPace)}
          </text>
        ) : null;
      })()}
    </svg>
  );
};

// Samenvattingsstatistieken
const StatsSummary = ({ runs }) => {
  const totalKm = runs.reduce((s, r) => s + parseFloat(r.distanceKm), 0);
  const avgKm = totalKm / runs.length;
  const paces = runs.map((r) => paceToSeconds(r.pacePerKm)).filter(Boolean);
  const bestPace = paces.length ? Math.min(...paces) : 0;
  const avgPace = paces.length ? paces.reduce((a, b) => a + b, 0) / paces.length : 0;
  const longestRun = Math.max(...runs.map((r) => parseFloat(r.distanceKm)));

  const stats = [
    { label: 'Totaal', value: `${totalKm.toFixed(1)} km`, icon: '📏' },
    { label: 'Langste run', value: `${longestRun} km`, icon: '🏆' },
    { label: 'Gem. afstand', value: `${avgKm.toFixed(1)} km`, icon: '📊' },
    { label: 'Beste pace', value: secondsToPace(bestPace), icon: '⚡' },
    { label: 'Gem. pace', value: secondsToPace(Math.round(avgPace)), icon: '🎯' },
    { label: 'Runs', value: runs.length, icon: '🏃' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
      {stats.map((s, i) => (
        <div
          key={i}
          className="glass-panel"
          style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}
        >
          <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{s.icon}</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{s.value}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
};

// Hoofd component
const RunCharts = ({ runs }) => {
  const [activeChart, setActiveChart] = useState('km'); // 'km' | 'pace'

  if (!runs || runs.length < 2) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Statistieken grid */}
      <StatsSummary runs={runs} />

      {/* Grafiek panel */}
      <div
        className="glass-panel"
        style={{ padding: 'var(--space-4)', background: 'rgba(255,255,255,0.06)' }}
      >
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveChart('km')}
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: activeChart === 'km' ? '#FC4C02' : 'rgba(255,255,255,0.07)',
              color: activeChart === 'km' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            📏 Kilometers
          </button>
          <button
            onClick={() => setActiveChart('pace')}
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: activeChart === 'pace' ? '#FC4C02' : 'rgba(255,255,255,0.07)',
              color: activeChart === 'pace' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            ⚡ Pace
          </button>
        </div>

        {/* Grafiek titel */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
          {activeChart === 'km'
            ? `Afstand per run (laatste ${runs.length} runs)`
            : `Pace per run — lager = sneller`}
        </div>

        {/* Grafiek */}
        <div style={{ paddingLeft: '28px' }}>
          {activeChart === 'km' ? (
            <KmBarChart runs={runs} />
          ) : (
            <PaceLineChart runs={runs} />
          )}
        </div>

        {/* Legenda */}
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {activeChart === 'km' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#FC4C02' }} />
                Normale run
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#ffb347' }} />
                Lange run (≥15km)
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FC4C02' }} />
                Pace/km
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#4ade80' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#4ade80' }} />
                Beste pace
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunCharts;
