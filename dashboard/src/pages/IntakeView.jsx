import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CROP_COLORS = ['#B4431F', '#5C6E46', '#8A5A12', '#3E6B8C', '#6D5A7B', '#C07A1A'];
const RANGE_OPTIONS = [
  { id: '7', label: '7 days' },
  { id: '14', label: '14 days' },
  { id: '30', label: '30 days' },
  { id: 'all', label: 'All' },
];

function shortDay(iso) {
  if (!iso) return 'Undated';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function longDay(iso) {
  if (!iso) return 'Undated';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function IntakeMetric({ label, value, unit, tint }) {
  return (
    <div className="bg-white rounded-md px-4 sm:px-5 py-4 border border-stone-200/80 min-w-0"
         style={{ boxShadow: '0 1px 2px rgba(60,45,25,0.05)' }}>
      <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest truncate">{label}</p>
      <p className="font-display tabular-nums mt-1.5 text-2xl sm:text-[28px] sm:leading-8 text-stone-900 break-words">
        {value}
        {unit ? <span className={'font-sans text-xs font-medium ml-1.5 ' + (tint || 'text-stone-400')}>{unit}</span> : null}
      </p>
    </div>
  );
}

export default function IntakeView({ bookings, search, setSearch }) {
  const [range, setRange] = useState('14');
  const [crop, setCrop] = useState('All');

  const todayStr = new Date().toISOString().split('T')[0];

  const cropOptions = useMemo(() => {
    const set = new Set(bookings.map(b => b.cropType).filter(Boolean));
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [bookings]);

  const scoped = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return bookings.filter(b => {
      if (crop !== 'All' && (b.cropType || '') !== crop) return false;
      if (q && !(b.cropType || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [bookings, crop, search]);

  const model = useMemo(() => {
    const byDate = {};
    scoped.forEach(b => {
      const key = b.date || 'Undated';
      if (!byDate[key]) byDate[key] = { date: key, tokens: 0, kg: 0, byCrop: {}, byStatus: {} };
      const entry = byDate[key];
      entry.tokens += 1;
      entry.kg += Number(b.quantityKg || 0);
      const cropName = b.cropType || 'Other';
      entry.byCrop[cropName] = (entry.byCrop[cropName] || 0) + 1;
      const st = b.status || 'Queued';
      entry.byStatus[st] = (entry.byStatus[st] || 0) + 1;
    });
    let days = Object.values(byDate)
      .filter(d => d.date !== 'Undated')
      .sort((a, b) => a.date.localeCompare(b.date));
    if (range !== 'all') days = days.slice(-Number(range));

    const cropTotals = {};
    days.forEach(d => {
      Object.entries(d.byCrop).forEach(([name, count]) => {
        cropTotals[name] = (cropTotals[name] || 0) + count;
      });
    });
    const top = Object.entries(cropTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);

    const chartDays = days.map(d => {
      const row = { date: d.date, label: shortDay(d.date), tokens: d.tokens, kg: d.kg };
      let other = 0;
      Object.entries(d.byCrop).forEach(([name, count]) => {
        if (top.indexOf(name) !== -1) row[name] = (row[name] || 0) + count;
        else other += count;
      });
      if (other > 0) row.Other = other;
      return row;
    });
    const stackKeys = top.slice();
    if (chartDays.some(r => r.Other > 0) && stackKeys.indexOf('Other') === -1) stackKeys.push('Other');

    const totals = days.reduce(
      (sum, d) => ({ tokens: sum.tokens + d.tokens, kg: sum.kg + d.kg }),
      { tokens: 0, kg: 0 }
    );
    const peak = days.reduce((best, d) => (!best || d.kg > best.kg ? d : best), null);
    return { chartDays, stackKeys, totals, peak, dayRows: days, todayEntry: byDate[todayStr] || null };
  }, [scoped, range, todayStr]);

  const latestFirst = useMemo(() => model.dayRows.slice().reverse(), [model.dayRows]);

  return (
    <div className="min-w-0">
      <header className="flex flex-col gap-4 pb-6 border-b border-stone-200 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-xl sm:text-[26px] font-semibold tracking-tight text-stone-900 break-words">Today&apos;s Intake</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#F4E8CF] text-[#8A5A12] border border-[#E5CF9F] whitespace-nowrap">
              {scoped.length} tokens in view
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">Daily procurement intake grouped by date, latest date first</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="relative w-full sm:w-60 lg:w-72 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search by crop name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-[13px] text-stone-800 bg-white border border-stone-200/80 rounded-md placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B4431F]/25 focus:border-[#B4431F] transition-all"
            />
          </div>
          <select
            value={crop}
            onChange={e => setCrop(e.target.value)}
            className="px-3 py-2 rounded-md bg-white border border-stone-300 text-stone-700 font-medium text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B4431F]/25 max-w-full"
          >
            {cropOptions.map(name => (
              <option key={name} value={name}>{name === 'All' ? 'All crops' : name}</option>
            ))}
          </select>
          <div className="inline-flex rounded-md border border-stone-300 bg-white shadow-sm overflow-hidden max-w-full overflow-x-auto">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setRange(opt.id)}
                className={'px-2.5 sm:px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ' + (range === opt.id ? 'bg-[#B4431F] text-white' : 'text-stone-600 hover:bg-stone-50')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 my-5 sm:my-6">
        <IntakeMetric label="Tokens today" value={String(model.todayEntry ? model.todayEntry.tokens : 0)} unit="tokens" />
        <IntakeMetric label="Volume today" value={(model.todayEntry ? model.todayEntry.kg : 0).toLocaleString()} unit="kg" />
        <IntakeMetric label="Tokens in period" value={String(model.totals.tokens)} unit="tokens" />
        <IntakeMetric label="Volume in period" value={model.totals.kg.toLocaleString()} unit="kg" />
      </section>

      {model.chartDays.length === 0 ? (
        <div className="bg-white rounded-md border border-stone-200/70 px-6 py-16 text-center">
          <p className="text-sm font-medium text-stone-600">No intake records for this selection</p>
          <p className="text-[11px] mt-1 text-stone-400">Try a wider date range, a different crop, or clear the search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 min-w-0">
          <div className="bg-white rounded-md border border-stone-200/70 p-4 sm:p-5 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
              <div className="min-w-0">
                <h2 className="font-display text-base sm:text-lg font-semibold text-stone-900">Daily intake volume</h2>
                <p className="text-[11px] text-stone-500">Net kilograms received per date with token count overlay</p>
              </div>
              {model.peak ? (
                <span className="text-[11px] font-medium text-[#8A5A12] bg-[#F4E8CF] border border-[#E5CF9F] rounded px-2 py-1 whitespace-nowrap">
                  Peak: {shortDay(model.peak.date)} ({model.peak.kg.toLocaleString()} kg)
                </span>
              ) : null}
            </div>
            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={model.chartDays} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0D3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis yAxisId="kg" tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} width={56} tickFormatter={v => (v >= 1000 ? (v / 1000) + 'k' : v)} />
                  <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E7E0D3', fontSize: 12 }}
                    formatter={(value, name) => (name === 'Volume (kg)' ? [Number(value).toLocaleString() + ' kg', name] : [value, name])}
                    labelFormatter={(label, payload) => (payload && payload.length ? longDay(payload[0].payload.date) : label)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="kg" dataKey="kg" name="Volume (kg)" fill="#B4431F" radius={[6, 6, 0, 0]} maxBarSize={44} />
                  <Line yAxisId="n" type="monotone" dataKey="tokens" name="Tokens" stroke="#3E6B8C" strokeWidth={2.5} dot={{ r: 3, fill: '#3E6B8C' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-md border border-stone-200/70 p-4 sm:p-5 min-w-0">
            <h2 className="font-display text-base sm:text-lg font-semibold text-stone-900">Tokens per day by crop</h2>
            <p className="text-[11px] text-stone-500 mb-3">Stacked token counts for each date in the selected period</p>
            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={model.chartDays} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0D3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E7E0D3', fontSize: 12 }}
                    labelFormatter={(label, payload) => (payload && payload.length ? longDay(payload[0].payload.date) : label)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {model.stackKeys.map((name, idx) => (
                    <Bar key={name} dataKey={name} stackId="tokens" name={name} fill={CROP_COLORS[idx % CROP_COLORS.length]} radius={idx === model.stackKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} maxBarSize={44} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-6 mb-3 flex-wrap">
        <h2 className="font-display text-base sm:text-lg font-semibold text-stone-900">Day-wise breakdown</h2>
        <span className="text-[11px] font-medium text-stone-500 bg-white border border-stone-200 rounded px-2 py-1">Latest date first</span>
      </div>
      {latestFirst.length === 0 ? (
        <div className="bg-white rounded-md border border-stone-200/70 px-6 py-10 text-center">
          <p className="text-sm font-medium text-stone-600">Nothing to break down yet</p>
          <p className="text-[11px] mt-1 text-stone-400">Bookings will appear here grouped by their scheduled date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4">
          {latestFirst.map(day => (
            <div key={day.date} className="bg-white rounded-md border border-stone-200/70 p-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 text-sm truncate">{longDay(day.date)}</p>
                  <p className="text-[11px] text-stone-400 font-mono">{day.date}</p>
                </div>
                {day.date === todayStr ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#933515] bg-[#F7E3D3] border border-[#E8BFA4] rounded px-2 py-0.5 shrink-0">Today</span>
                ) : null}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <p className="font-display text-xl text-stone-900 tabular-nums">{day.tokens}<span className="font-sans text-[11px] font-medium text-stone-400 ml-1">tokens</span></p>
                <p className="font-display text-xl text-stone-900 tabular-nums">{day.kg.toLocaleString()}<span className="font-sans text-[11px] font-medium text-stone-400 ml-1">kg</span></p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(day.byCrop).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, count]) => (
                  <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F4E8CF] text-[#8A5A12] border border-[#E5CF9F] max-w-full">
                    <span className="truncate">{name}</span>
                    <span className="font-mono font-semibold">{count}</span>
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-stone-500 mt-2.5 truncate">
                {Object.entries(day.byStatus).map(([st, count]) => st + ' ' + count).join('  ·  ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
