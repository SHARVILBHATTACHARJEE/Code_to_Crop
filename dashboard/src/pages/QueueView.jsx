import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { updateBookingStatus, createSchedule } from '../api/firestore';
import { useStore } from '../store';
import { X } from 'lucide-react';

const STAGES = ['Queued', 'Weighed', 'Quality Checked', 'Approved', 'Payment Initiated', 'Paid'];

/* ── helpers ── */
function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-indigo-50 border-indigo-200/80 text-indigo-700',
  'bg-amber-50  border-amber-200/80  text-amber-700',
  'bg-emerald-50 border-emerald-200/80 text-emerald-700',
  'bg-purple-50 border-purple-200/80 text-purple-700',
  'bg-blue-50   border-blue-200/80   text-blue-700',
  'bg-rose-50   border-rose-200/80   text-rose-700',
];
function avatarColor(name = '') {
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const STATUS_PILL = {
  Queued:              'bg-amber-50   text-amber-700   border-amber-200/70   dot-amber',
  Weighed:             'bg-blue-50    text-blue-700    border-blue-200/70    dot-blue',
  'Quality Checked':   'bg-purple-50  text-purple-700  border-purple-200/70  dot-purple',
  Approved:            'bg-yellow-50  text-yellow-700  border-yellow-200/70  dot-yellow',
  'Payment Initiated': 'bg-orange-50  text-orange-700  border-orange-200/70  dot-orange',
  Paid:                'bg-emerald-50 text-emerald-700 border-emerald-200/70 dot-emerald',
};
const DOT_COLOR = {
  'dot-amber':   'bg-amber-500   animate-pulse',
  'dot-blue':    'bg-blue-500',
  'dot-purple':  'bg-purple-500',
  'dot-yellow':  'bg-yellow-500',
  'dot-orange':  'bg-orange-500',
  'dot-emerald': 'bg-emerald-500',
};
function StatusPill({ status }) {
  const cls = STATUS_PILL[status] || 'bg-gray-50 text-gray-700 border-gray-200/70 dot-gray';
  const parts = cls.split(' ');
  const dotKey = parts.find((p) => p.startsWith('dot-'));
  const dotCls = DOT_COLOR[dotKey] || 'bg-gray-500';
  const pillCls = parts.filter((p) => !p.startsWith('dot-')).join(' ');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${pillCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      {status}
    </span>
  );
}

/* ── Crop icon (generic grain SVG) ── */
function CropIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2v20M8 5a3 3 0 016 0M7 10a3 3 0 016 0M8 15a3 3 0 016 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── SVG icons ── */
const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const ScaleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const WalletIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
  </svg>
);
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const FilterIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const BoxIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const BadgeCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
  </svg>
);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function QueueView() {
  const user     = useStore((s) => s.user);
  const logout   = useStore((s) => s.logout);
  const navigate = useNavigate();

  const [bookings,    setBookings]    = useState([]);
  const [search,      setSearch]      = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    cropType: '', date: '', startTime: '09:00', endTime: '17:00', mspRate: '', totalSlots: '50',
  });

  /* Real-time bookings */
  useEffect(() => {
    const q = query(collection(db, 'bookings'), where('centerId', '==', user.centerId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) =>
            a.date === b.date
              ? (a.slotTime || '').localeCompare(b.slotTime || '')
              : (a.date  || '').localeCompare(b.date  || '')
          );
        setBookings(data);
      },
      (err) => console.error('Firestore onSnapshot error:', err)
    );
    return () => unsub();
  }, [user.centerId]);

  const handleStatusUpdate = async (id, nextStatus) => {
    try { await updateBookingStatus(id, nextStatus, user.name); }
    catch { alert('Failed to update status'); }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await createSchedule(user, form);
      setShowForm(false);
      setForm({ cropType: '', date: '', startTime: '09:00', endTime: '17:00', mspRate: '', totalSlots: '50' });
      alert('Schedule created!');
    } catch { alert('Failed to create schedule'); }
    finally { setFormLoading(false); }
  };

  /* Derived stats */
  const stats = useMemo(() => ({
    total:  bookings.length,
    paid:   bookings.filter((b) => b.status === 'Paid').length,
    active: bookings.filter((b) => b.status !== 'Paid').length,
    pendingWeigh: bookings.filter((b) => b.status === 'Queued').length,
    pendingQC:    bookings.filter((b) => b.status === 'Weighed').length,
    totalKg: bookings.reduce((s, b) => s + Number(b.quantityKg || 0), 0),
    paidKg:  bookings.filter((b) => b.status === 'Paid').reduce((s, b) => s + Number(b.quantityKg || 0), 0),
  }), [bookings]);

  const volumePct = stats.totalKg > 0 ? Math.round((stats.paidKg / stats.totalKg) * 100) : 0;

  /* Estimated payout (MSP not stored on booking; show total volume settled) */
  const settledLabel = stats.paid > 0
    ? `${stats.paid} paid`
    : '0 paid';

  const filtered = bookings.filter((b) =>
    b.tokenNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.farmerName?.toLowerCase().includes(search.toLowerCase())
  );

  const officerInitials = getInitials(user.name || 'Officer');

  /* ── Active row highlight ── */
  function rowBg(status) {
    if (status === 'Queued')          return 'bg-amber-50/30';
    if (status === 'Quality Checked') return 'bg-purple-50/20';
    return '';
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", background: '#F8FAFC' }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-72 flex flex-col justify-between p-5 text-white shrink-0 select-none border-r border-slate-800/80"
             style={{ background: '#090D16' }}>
        <div className="space-y-5">

          {/* Brand */}
          <div className="flex items-center gap-3 px-1.5 pt-1">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/20"
                 style={{ background: 'linear-gradient(135deg,#2563EB,#34d399)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3M6 3h12M12 16v5m-4 0h8"
                      strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-base text-white">FarmConnect</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold
                                 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">HQ</span>
              </div>
              <p className="text-[11px] text-slate-400">Officer Portal • {user.centerName || 'Mandi Central'}</p>
            </div>
          </div>

          {/* Officer card */}
          <div className="rounded-xl p-3.5 border border-slate-700/60 shadow-sm backdrop-blur-sm relative overflow-hidden"
               style={{ background: 'rgba(19,27,46,0.9)' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold
                               text-white tracking-wider border border-white/20"
                     style={{ background: 'linear-gradient(135deg,#3b82f6,#4f46e5)' }}>
                  {officerInitials}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full
                                 ring-2 animate-pulse" style={{ ringColor: 'rgba(19,27,46,1)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Officer</span>
                  <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5
                                   rounded border border-slate-700/50">
                    OD-{String(user.centerId || '').slice(-4).toUpperCase() || '0000'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white truncate">{user.name}</h4>
                <p className="text-[11px] text-slate-400 truncate">{user.centerName}</p>
              </div>
            </div>
          </div>

          {/* Today's Intake */}
          <div className="rounded-xl p-4 space-y-3.5 border border-slate-800/80"
               style={{ background: 'rgba(19,27,46,0.6)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span className="text-xs font-medium text-slate-300">Today's Intake</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Live feed</span>
            </div>
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Today</span>
                <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/60 font-mono">
                  {stats.total}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Active Queue</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300
                                 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {stats.active}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Settled / Paid</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-300
                                 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {stats.paid}
                </span>
              </div>
            </div>
            {/* Volume progress */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span>Cumulative Volume</span>
                <span className="text-slate-200 font-semibold font-mono">
                  {stats.totalKg.toLocaleString()} kg
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 rounded-full"
                     style={{ width: `${volumePct}%`, background: 'linear-gradient(90deg,#3b82f6,#34d399)' }} />
              </div>
            </div>
          </div>

          {/* New Schedule */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2
                       text-sm transition-all duration-150 group border border-blue-400/30 shadow-lg"
            style={{ background: '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >
            <span className="group-hover:rotate-90 transition-transform duration-200"><PlusIcon /></span>
            <span>New Schedule</span>
          </button>

          {/* Nav */}
          <nav className="space-y-1 pt-1">
            {[
              { icon: <HomeIcon />,       label: 'All Bookings',        active: true  },
              { icon: <ScaleIcon />,      label: 'Weighbridge Station', active: false },
              { icon: <ShieldCheckIcon />,label: 'QC Testing Lab',      active: false },
              { icon: <WalletIcon />,     label: 'Payment Settlement',  active: false },
            ].map(({ icon, label, active }) => (
              <a key={label} href="#"
                 className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors
                   ${active
                     ? 'bg-white/5 text-white font-medium border border-white/5'
                     : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-normal'}`}>
                {icon}
                <span>{label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-between px-2 py-2 text-slate-400
                       hover:text-red-400 transition-colors rounded-lg group"
          >
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <span className="group-hover:text-red-400 transition-colors"><LogoutIcon /></span>
              <span>Logout</span>
            </div>
            <span className="text-[10px] text-slate-600 group-hover:text-red-400 font-mono">v2.4</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 lg:p-8" style={{ background: '#F8FAFC' }}>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">All Bookings</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                               bg-slate-100 text-slate-600 border border-slate-200">
                {bookings.length} total • Today
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time gate passes, weighbridge allocation, and payment status
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-72 lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search token, farmer or crop..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-9 pr-12 py-2 text-xs text-slate-800 bg-white border border-slate-200
                           rounded-xl shadow-sm placeholder:text-slate-400 focus:outline-none
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">⌘K</kbd>
              </div>
            </div>
            {/* Filter */}
            <button className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700
                               bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors">
              <FilterIcon /> <span>Produce: All</span>
            </button>
            {/* Export */}
            <button className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700
                               bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors">
              <DownloadIcon /> <span>Export</span>
            </button>
          </div>
        </header>

        {/* ── Metrics bar ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          {[
            {
              label: 'Total Volume', value: `${stats.totalKg.toLocaleString()}`,
              unit: 'kg', color: 'text-slate-900', bg: 'bg-blue-50', iconColor: 'text-blue-600',
              icon: <BoxIcon />,
            },
            {
              label: 'Pending Weighment', value: String(stats.pendingWeigh),
              unit: 'vehicle', color: 'text-amber-600', bg: 'bg-amber-50', iconColor: 'text-amber-600',
              icon: <ClockIcon />,
            },
            {
              label: 'QC Clearance', value: String(stats.pendingQC),
              unit: 'lot ready', color: 'text-purple-600', bg: 'bg-purple-50', iconColor: 'text-purple-600',
              icon: <BadgeCheckIcon />,
            },
            {
              label: 'Settled Payouts', value: settledLabel,
              unit: '', color: 'text-emerald-600', bg: 'bg-emerald-50', iconColor: 'text-emerald-600',
              icon: <ShieldIcon />,
            },
          ].map(({ label, value, unit, color, bg, iconColor, icon }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-bold mt-0.5 ${color}`}>
                  {value} {unit && <span className="text-xs font-normal text-slate-500">{unit}</span>}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-lg ${bg} ${iconColor} flex items-center justify-center`}>
                {icon}
              </div>
            </div>
          ))}
        </section>

        {/* ── Bookings table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col"
             style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
          <div className="overflow-x-auto">
            <div style={{ minWidth: 960 }}>

              {/* Table header */}
              <div className="grid gap-4 items-center bg-slate-50/90 px-6 py-3.5 border-b border-slate-200
                              text-[11px] font-semibold tracking-wider text-slate-500 uppercase select-none"
                   style={{ gridTemplateColumns: '2fr 2fr 3fr 2fr 2fr 1fr' }}>
                <div>Date &amp; Time</div>
                <div>Token</div>
                <div>Farmer Details</div>
                <div>Produce &amp; Net Weight</div>
                <div>Status</div>
                <div className="text-right pr-2">Action</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 text-xs">
                {filtered.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <p>No bookings found for this center.</p>
                    <p className="text-[11px] mt-1">Make sure farmers have booked slots, or check the browser console for Firestore errors.</p>
                  </div>
                ) : filtered.map((b) => {
                  const curIdx    = STAGES.indexOf(b.status);
                  const nextStage = curIdx < STAGES.length - 1 ? STAGES[curIdx + 1] : null;
                  const avCls     = avatarColor(b.farmerName || '');
                  return (
                    <div key={b.id}
                         className={`grid gap-4 items-center px-6 py-4 hover:bg-slate-50/70 transition-colors ${rowBg(b.status)}`}
                         style={{ gridTemplateColumns: '2fr 2fr 3fr 2fr 2fr 1fr' }}>

                      {/* Date & Time */}
                      <div>
                        <span className="font-medium text-slate-800 block text-xs">{b.date}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{b.slotTime}</span>
                      </div>

                      {/* Token */}
                      <div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold
                                         font-mono tracking-wide bg-blue-50 text-blue-700 border border-blue-200/70">
                          {b.tokenNumber}
                        </span>
                      </div>

                      {/* Farmer */}
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center
                                        shrink-0 font-semibold text-xs ${avCls}`}>
                          {getInitials(b.farmerName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{b.farmerName}</p>
                          <p className="text-slate-400 text-[11px] font-mono">{b.farmerId}</p>
                        </div>
                      </div>

                      {/* Produce */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                          <CropIcon />
                        </div>
                        <div>
                          <span className="font-medium text-slate-700 block text-xs">{b.cropType}</span>
                          <span className="font-bold text-slate-900 text-xs">{b.quantityKg} kg</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div><StatusPill status={b.status} /></div>

                      {/* Action */}
                      <div className="text-right">
                        {nextStage ? (
                          <button
                            onClick={() => handleStatusUpdate(b.id, nextStage)}
                            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800
                                       active:scale-95 text-white text-xs font-medium px-3 py-1.5
                                       rounded-lg shadow-sm transition-all duration-150"
                          >
                            <span>→</span>
                            <span>{nextStage}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-xs
                                           text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-md">
                            <CheckIcon /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pagination footer */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between
                          text-xs text-slate-500 select-none">
            <div>
              Showing <span className="font-semibold text-slate-700">1</span> to{' '}
              <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
              <span className="font-semibold text-slate-700">{filtered.length}</span> bookings
            </div>
            <div className="flex items-center gap-2">
              <button disabled className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400
                                          bg-slate-100/50 cursor-not-allowed text-xs">
                Previous
              </button>
              <span className="px-2 font-medium text-slate-700">1 of 1</span>
              <button disabled className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400
                                          bg-slate-100/50 cursor-not-allowed text-xs">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ Create Schedule Modal ═══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">New Procurement Schedule</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="text-slate-400 hover:text-slate-700 transition-colors" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              {[
                { label: 'Crop Type',       key: 'cropType',    type: 'text',   placeholder: 'e.g. Wheat' },
                { label: 'Date',            key: 'date',        type: 'date' },
                { label: 'Start Time',      key: 'startTime',   type: 'time' },
                { label: 'End Time',        key: 'endTime',     type: 'time' },
                { label: 'MSP Rate (₹/Qtl)',key: 'mspRate',    type: 'number', placeholder: 'e.g. 2275' },
                { label: 'Total Slots',     key: 'totalSlots',  type: 'number', placeholder: 'e.g. 100' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-slate-300 p-2.5 rounded-lg outline-none
                               focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    required
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white
                           font-bold py-3 rounded-xl mt-2 transition-colors"
              >
                {formLoading ? 'Creating...' : 'Create Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
