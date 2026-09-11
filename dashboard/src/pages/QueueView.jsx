import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { updateBookingStatus, createSchedule } from '../api/firestore';
import { useStore } from '../store';


/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const STAGES = ['Queued', 'Weighed', 'Quality Checked', 'Approved', 'Payment Initiated', 'Paid'];
const VIEWS  = ['bookings', 'weighbridge', 'qc', 'payment'];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
}

const AVATAR_PALETTE = [
  'bg-[#F7ECD4] border-[#E7CF9E] text-[#8A5A12]',
  'bg-[#F7E3D3] border-[#E8BFA4] text-[#933515]',
  'bg-[#E9EDDB] border-[#CFD8B8] text-[#44532F]',
  'bg-[#ECE7EE] border-[#D3C8DB] text-[#5D4A6B]',
  'bg-[#E4EBF0] border-[#C3D2DC] text-[#37556E]',
  'bg-[#F1DFB8] border-[#DDBE7E] text-[#7A4E0D]',
];
function avatarColor(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

/* ─────────────────────────────────────────────
   STATUS PILL
───────────────────────────────────────────── */
const STATUS_CONFIG = {
  Queued:              { pill: 'bg-[#F7ECD4] text-[#8A5A12] border-[#E7CF9E]',   dot: 'bg-[#C07A1A]' },
  Weighed:             { pill: 'bg-[#E4EBF0] text-[#37556E] border-[#C3D2DC]',      dot: 'bg-[#3E6B8C]' },
  'Quality Checked':   { pill: 'bg-[#ECE7EE] text-[#5D4A6B] border-[#D3C8DB]', dot: 'bg-[#6D5A7B]' },
  Approved:            { pill: 'bg-[#F1DFB8] text-[#7A4E0D] border-[#DDBE7E]', dot: 'bg-[#8A5A12]' },
  'Payment Initiated': { pill: 'bg-[#F7E3D3] text-[#933515] border-[#E8BFA4]', dot: 'bg-[#B4431F]' },
  Paid:                { pill: 'bg-[#E9EDDB] text-[#44532F] border-[#CFD8B8]', dot: 'bg-[#5C6E46]' },
};
function StatusPill({ status, small = false }) {
  const cfg = STATUS_CONFIG[status] || { pill: 'bg-stone-100 text-stone-600 border-stone-200', dot: 'bg-stone-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold border ${cfg.pill} ${small ? 'text-[10px]' : 'text-xs'} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────
   SHARED SVG ICONS (inline for zero-dep)
───────────────────────────────────────────── */
const Icon = {
  leaf:    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3M6 3h12M12 16v5m-4 0h8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  logout:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  plus:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>,
  search:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  filter:  <svg className="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  export:  <svg className="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  print:   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  eye:     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  camera:  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  receipt: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  bolt:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  arrow:   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 6l6 6-6 6M19 12H5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  menu:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeWidth="2"/></svg>,
  close:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  wheat:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 22V8" strokeLinecap="round" strokeWidth="2"/><path d="M12 8C12 4.7 9.6 2.6 6.2 2.6c0 3.4 2.4 5.4 5.8 5.4z" strokeLinejoin="round" strokeWidth="1.8"/><path d="M12 8c0-3.3 2.4-5.4 5.8-5.4 0 3.4-2.4 5.4-5.8 5.4z" strokeLinejoin="round" strokeWidth="1.8"/><path d="M12 13c-1.6 0-3.8-.6-5-2M12 16.5c1.6 0 3.8-.6 5-2" strokeLinecap="round" strokeWidth="1.8"/></svg>,
  rice:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6.5 10h11l-1.3 9.2a2 2 0 01-2 1.8H9.8a2 2 0 01-2-1.8L6.5 10z" strokeLinejoin="round" strokeWidth="2"/><path d="M6.5 10c0-2.2 2.4-3.5 5.5-3.5s5.5 1.3 5.5 3.5" strokeWidth="2"/><path d="M12 6.5V4M9.5 13.5h5" strokeLinecap="round" strokeWidth="1.8"/></svg>,
  soybean: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7.5 20.5C4.5 14.5 6.5 7.5 14.5 4c2.8 6 .8 13-7 16.5z" strokeLinejoin="round" strokeWidth="2"/><circle cx="10.6" cy="11.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="12.4" cy="14.8" r="1.1" fill="currentColor" stroke="none"/></svg>,
  weighbridge: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M2 15.5h20" strokeLinecap="round" strokeWidth="2"/><path d="M5 15.5v-4.5h7v4.5M12 12.5h4.2l3.3 3" strokeLinejoin="round" strokeWidth="1.8"/><circle cx="7.5" cy="17.8" r="1.7" strokeWidth="1.8"/><circle cx="17" cy="17.8" r="1.7" strokeWidth="1.8"/></svg>,
  truck:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M2 6.5h12V16H2zM14 10.5h3.8L22 14.5V16h-8" strokeLinejoin="round" strokeWidth="2"/><circle cx="6.5" cy="18" r="1.8" strokeWidth="1.8"/><circle cx="17.5" cy="18" r="1.8" strokeWidth="1.8"/></svg>,
  rupee:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 3.5h12M6 7.5h12M6 3.5c7.5 0 9.5 1.6 9.5 4s-2.8 4-6.5 4l8.5 9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  flask:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.5 3h5M10.8 3v5L5.4 17.3a2.4 2.4 0 002.1 3.7h9a2.4 2.4 0 002.1-3.7L13.2 8V3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/><path d="M7.6 14.5h8.8" strokeLinecap="round" strokeWidth="1.8"/></svg>,
  vial:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 3h6v8.5a3 3 0 01-6 0V3z" strokeLinejoin="round" strokeWidth="2"/><path d="M9.5 14.5h5M7 21h10" strokeLinecap="round" strokeWidth="1.8"/></svg>,
  bank:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9.5L12 4l9 5.5M5 10v9M19.5 10v9M8.5 13v4M12 13v4M15.5 13v4M3 21h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>,
  ticket:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 8a2 2 0 002-2h12a2 2 0 002 2v1.5a2.5 2.5 0 000 5V16a2 2 0 00-2 2H6a2 2 0 00-2-2v-1.5a2.5 2.5 0 000-5V8z" strokeLinejoin="round" strokeWidth="1.8"/><path d="M13.5 7.5v1.8M13.5 11.1v1.8M13.5 14.7v1.8" strokeLinecap="round" strokeWidth="1.8"/></svg>,
  timer:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7.5" strokeWidth="2"/><path d="M12 10v3.5l2.5 2.5M9.5 2.5h5" strokeLinecap="round" strokeWidth="1.8"/></svg>,
  transfer: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 8.5h12.5L13.5 5.5M20 15.5H7.5l3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16" rx="2" strokeWidth="2"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18" strokeLinecap="round" strokeWidth="2"/></svg>,
};

/* ─────────────────────────────────────────────
   SHARED SUB-COMPONENTS
───────────────────────────────────────────── */

/** Sidebar — identical across all views, active view highlighted */
/* -- FarmConnect design system: shared buttons + crop icons (terracotta primary, olive secondary) -- */
function PrimaryBtn({ children, onClick, type }) {
  return (
    <button type={type || 'button'} onClick={onClick}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#B4431F] hover:bg-[#933515] active:scale-95
                       text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap">
      {children}
    </button>
  );
}
function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-stone-300
                       text-stone-600 font-medium text-xs shadow-sm hover:bg-stone-50 transition-colors whitespace-nowrap">
      {children}
    </button>
  );
}
function DoneChip() {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-[#44532F] bg-[#E9EDDB] border border-[#CFD8B8] px-2.5 py-1.5 rounded-full">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
      Done
    </span>
  );
}
function cropIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.indexOf('rice') !== -1) return Icon.rice;
  if (t.indexOf('soy') !== -1) return Icon.soybean;
  return Icon.wheat;
}

function Sidebar({ user, stats, bookings, volumePct, activeView, setView, setShowForm, logout, navigate, open, onClose }) {
  const navItems = [
    { id: 'bookings',    icon: Icon.ticket,   label: 'All Bookings' },
    { id: 'schedules',   icon: Icon.calendar, label: 'Procurement Schedules' },
    { id: 'weighbridge', icon: Icon.weighbridge,  label: 'Weighbridge Station' },
    { id: 'qc',          icon: Icon.flask,  label: 'QC Testing Lab' },
    { id: 'payment',     icon: Icon.rupee, label: 'Payment Settlement' },
  ];
  const initials = getInitials(user.name || 'Officer');
  const odId = `OD-${String(user.centerId || '').slice(-4).toUpperCase() || '0000'}`;

  return (
    <aside
      className={'fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] flex flex-col justify-between p-5 text-white shrink-0 select-none border-r border-stone-800/60 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ' + (open ? 'translate-x-0' : '-translate-x-full')}
      style={{ background: '#221A13' }}
    >
      <div className="space-y-5">
        {/* Brand */}
        <div className="flex items-center gap-3 px-1.5 pt-1">
          <div className="h-9 w-9 rounded-md flex items-center justify-center shadow-lg ring-1 ring-white/10"
               style={{ background: '#B4431F', boxShadow: '0 4px 14px rgba(180,67,31,.35)' }}>
            {Icon.leaf}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-semibold tracking-tight text-lg text-[#F5EDE0]">FarmConnect</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold
                               bg-[#5C6E46]/15 text-[#A9BC8A] border border-[#5C6E46]/40">HQ</span>
            </div>
            <p className="text-[11px] text-stone-400">Officer Portal • {user.centerName || 'Mandi Central'}</p>
          </div>
        </div>

        <button onClick={onClose} aria-label="Close menu"
                className="lg:hidden absolute top-4 right-4 p-2 rounded-md text-stone-400 hover:text-white hover:bg-white/10 transition-colors">
          {Icon.close}
        </button>

        {/* Officer card */}
        <div className="rounded-md p-3.5 border border-stone-800/80 shadow-sm backdrop-blur-sm"
             style={{ background: '#2E2318' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold
                             text-white tracking-wider border border-white/10 shadow-inner"
                   style={{ background: '#5C6E46' }}>
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#A9BC8A] rounded-full ring-2 ring-[#221A13]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Officer</span>
                <span className="text-[10px] font-mono font-medium text-stone-400 bg-stone-800/50
                                 px-1.5 py-0.5 rounded border border-stone-700/50">{odId}</span>
              </div>
              <h4 className="text-sm font-semibold text-white truncate mt-0.5">{user.name}</h4>
              <p className="text-[11px] text-stone-400 truncate">{user.centerName}</p>
            </div>
          </div>
        </div>

        {/* Today's intake: live activity feed (shared across all views) */}
        <div className="rounded-md p-4 space-y-3 border border-white/10"
             style={{ background: 'rgba(255,244,230,0.04)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D97B4A]" />
              <span className="font-display text-sm font-semibold text-[#F5EDE0]">Today's Intake</span>
            </div>
            <span className="text-[11px] font-semibold text-[#D97B4A] font-mono">{stats.total} tokens</span>
          </div>
          <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
            {bookings.slice(0, 7).map(b => {
              const dot = (STATUS_CONFIG[b.status] || {}).dot || 'bg-stone-500';
              return (
                <div key={b.id} className="flex items-center gap-2 px-1.5 py-1.5 rounded hover:bg-white/5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                  <span className="text-[11px] font-mono font-medium text-stone-200">{b.tokenNumber}</span>
                  <span className="text-[11px] text-stone-400 truncate">{b.cropType}</span>
                </div>
              );
            })}
            {bookings.length === 0 && (
              <p className="text-[11px] text-stone-500 px-1.5 py-2">No tokens today yet.</p>
            )}
          </div>
          <div className="pt-2.5 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
              <span>Active {stats.active} · Settled {stats.paid}</span>
              <span className="text-stone-200 font-semibold font-mono">{stats.totalKg.toLocaleString()} kg</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full" style={{ width: `${volumePct}%`, background: '#B4431F' }} />
            </div>
          </div>
        </div>

        {/* New Schedule */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full text-white font-medium py-2.5 px-4 rounded flex items-center justify-center gap-2
                     text-sm transition-colors group font-semibold"
          style={{ background: '#B4431F', boxShadow: '0 4px 14px rgba(180,67,31,.35)' }}
          onMouseEnter={e => e.currentTarget.style.background = '#933515'}
          onMouseLeave={e => e.currentTarget.style.background = '#B4431F'}
        >
          <span className="group-hover:rotate-90 transition-transform duration-200">{Icon.plus}</span>
          <span>New Schedule</span>
        </button>

        {/* Nav */}
        <nav className="space-y-1 pt-1">
          {navItems.map(({ id, icon, label }) => {
            const isActive = activeView === id;
            return (
              <button key={id} onClick={() => setView(id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-colors text-left
                  ${isActive
                    ? 'bg-white/5 text-white font-medium border border-white/5'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-white/5 font-normal'}`}>
                <span className={isActive ? 'text-[#DE9A63]' : ''}>{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-stone-800/80">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center justify-between px-2 py-2 text-stone-400 hover:text-[#DE9A63] transition-colors rounded-md group"
        >
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <span className="group-hover:text-[#DE9A63] transition-colors">{Icon.logout}</span>
            <span>Logout</span>
          </div>
          <span className="text-[10px] text-stone-600 group-hover:text-[#DE9A63] font-mono">v2.4</span>
        </button>
      </div>
    </aside>
  );
}

/** Shared page header with search + filter + export */
function PageHeader({ title, subtitle, badge, search, setSearch }) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-stone-900">{title}</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#F4E8CF] text-[#8A5A12] border border-[#E5CF9F]">
            {badge}
          </span>
        </div>
        {subtitle ? <p className="text-xs text-stone-500 mt-1">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:w-72 lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">{Icon.search}</div>
          <input
            type="text"
            placeholder="Search by crop name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="block w-full pl-9 pr-12 py-2 text-[13px] text-stone-800 bg-white border border-stone-200/80
                       rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] placeholder:text-stone-400 focus:outline-none
                       focus:ring-2 focus:ring-[#B4431F]/25 focus:border-[#B4431F] transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="text-[10px] font-mono text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200/80">⌘K</kbd>
          </div>
        </div>
        <GhostBtn>
          {Icon.filter}<span>Produce: All</span>
        </GhostBtn>
        <GhostBtn>
          {Icon.export}<span>Export</span>
        </GhostBtn>
      </div>
    </header>
  );
}

/** Stat cards: hero metric leads, inline icons, zero-values muted */
function MetricsBar({ cards }) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 my-6">
      {cards.map(({ label, value, unit, tint, icon, hero }) => {
        const zero = String(value).charAt(0) === '0';
        const valueCls = hero ? 'text-[28px] leading-8' : 'text-xl';
        const valueLineCls = 'font-display tabular-nums mt-1.5 ' + valueCls + ' ' + (zero ? 'text-stone-300' : 'text-stone-900');
        const unitCls = 'font-sans text-xs font-medium ml-1.5 ' + (zero ? 'text-stone-300' : 'text-stone-400');
        return (
        <div key={label} className="bg-white rounded-md px-5 py-4 border border-stone-200/80"
             style={{ boxShadow: '0 1px 2px rgba(60,45,25,0.05)' }}>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 uppercase tracking-widest">
              <span className={zero ? 'text-stone-300' : tint}>{icon}</span>{label}
            </p>
            <p className={valueLineCls}>
              {value}{unit ? <span className={unitCls}>{unit}</span> : null}
            </p>
          </div>
        </div>
        );
      })}
    </section>
  );
}

/** Table wrapper with pagination footer */
function TableCard({ headers, rows, total, filtered, emptyTitle, emptySub }) {
  return (
    <div className="bg-white rounded-md border border-stone-200/60 overflow-hidden flex flex-col"
         style={{ boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03), 0 0 3px rgba(0,0,0,0.02)' }}>
      <div className="overflow-x-auto">
        <div style={{ minWidth: 1040 }}>
          {/* Header — gap-4 MUST match every data row exactly */}
          <div className="grid items-center bg-white px-6 py-3.5 border-b border-stone-100
                          text-[10px] font-bold tracking-widest text-stone-400 uppercase select-none gap-4"
               style={{ gridTemplateColumns: headers.map(h => h.span).join(' ') }}>
            {headers.map(h => (
              <div key={h.label}
                   className={
                     h.align === 'right'  ? 'flex items-center justify-end'    :
                     h.align === 'center' ? 'flex items-center justify-center' :
                                            'flex items-center'
                   }>
                {h.label}
              </div>
            ))}
          </div>
          {/* Body */}
          <div className="divide-y divide-stone-100/60 text-xs">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center mb-3 border border-stone-100">
                  {Icon.search}
                </div>
                <p className="text-sm font-medium text-stone-600">{emptyTitle || 'No bookings found'}</p>
                <p className="text-[11px] mt-1 text-stone-400 text-center max-w-sm">
                  {emptySub || 'There are currently no crops matching this search. Make sure farmers have booked slots for today.'}
                </p>
              </div>
            ) : rows}
          </div>
        </div>
      </div>
      {/* Pagination footer */}
      <div className="px-6 py-4 bg-white border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 select-none">
        <div>Showing <span className="font-semibold text-stone-700">1</span> to <span className="font-semibold text-stone-700">{filtered}</span> of <span className="font-semibold text-stone-700">{total}</span> records</div>
        <div className="flex items-center gap-1.5">
          <button disabled className="px-2.5 py-1.5 rounded-md border border-stone-200/70 text-stone-400 bg-stone-50/50 cursor-not-allowed font-medium transition-colors">Previous</button>
          <span className="px-3 font-semibold text-stone-700 bg-stone-50 border border-stone-200/50 rounded-md py-1.5">1</span>
          <button disabled className="px-2.5 py-1.5 rounded-md border border-stone-200/70 text-stone-400 bg-stone-50/50 cursor-not-allowed font-medium transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}

/* Farmer avatar cell */
function FarmerCell({ name, sub }) {
  const avCls = avatarColor(name || '');
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 font-semibold text-xs ${avCls}`}>
        {getInitials(name)}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-stone-900 truncate">{name}</p>
        <p className="text-stone-400 text-[11px] font-mono">{sub}</p>
      </div>
    </div>
  );
}

/* Token badge */
function TokenBadge({ token }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold font-mono tracking-wide
                     bg-[#F4E8CF] text-[#8A5A12] border border-[#E5CF9F]">
      {token}
    </span>
  );
}

/* Crop cell */
function CropCell({ type }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-6 rounded bg-[#F4E8CF] text-[#8A5A12] flex items-center justify-center shrink-0">{cropIcon(type)}</div>
      <span className="font-medium text-stone-700 text-xs">{type}</span>
    </div>
  );
}

/* Upload / image placeholder button */
function UploadBtn({ label }) {
  return (
    <button className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md
                       border border-dashed border-stone-300 bg-[#FBF8F1] hover:bg-[#F4EDE0]
                       text-stone-600 font-medium text-[11px] transition-colors">
      <span className="text-stone-400">{Icon.camera}</span>
      <span>{label}</span>
    </button>
  );
}

/* Image filename chip */
function ImgChip({ name, color = 'stone' }) {
  const bg = color === 'plum' ? 'bg-[#ECE7EE] border-[#D3C8DB] text-[#5D4A6B]' : 'bg-stone-100 border-stone-200 text-stone-600';
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono ${bg}`}>
      {Icon.eye}
      <span className={`text-[11px] font-medium font-mono ${color === 'plum' ? 'text-[#5D4A6B]' : 'text-stone-700'}`}>{name}</span>
    </div>
  );
}

function ViewBtn({ label }) {
  return (
    <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-800
                       bg-white hover:bg-stone-50 border border-stone-300 px-2 py-1 rounded transition-colors">
      {Icon.eye}<span>{label || 'VIEW'}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   VIEW: ALL BOOKINGS
═══════════════════════════════════════════════════ */
function AllBookings({ bookings, search, setSearch, handleStatusUpdate, stats }) {
  const filtered = bookings.filter(b =>
    (b.cropType || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  const COLS = [
    { label: 'Date & Time',           span: '160px', align: 'left' },
    { label: 'Token',                  span: '130px', align: 'left' },
    { label: 'Farmer Details',         span: 'minmax(0, 1fr)',   align: 'left' },
    { label: 'Produce & Net Weight',   span: '160px', align: 'left' },
    { label: 'Status',                 span: '160px', align: 'left' },
    { label: 'Action',                 span: '140px', align: 'right' },
  ];

  const rowBg = s => s === 'Queued' ? 'bg-[#B4431F]/[0.05]' : s === 'Quality Checked' ? 'bg-[#6D5A7B]/[0.06]' : '';

  const rows = filtered.map(b => {
    const curIdx    = STAGES.indexOf(b.status);
    const nextStage = curIdx < STAGES.length - 1 ? STAGES[curIdx + 1] : null;
    return (
      <div key={b.id}
           className={`grid items-center px-5 py-3 hover:bg-stone-50/70 transition-colors gap-4 ${rowBg(b.status)}`}
           style={{ gridTemplateColumns: COLS.map(c => c.span).join(' ') }}>
        {/* Date & Time — left */}
        <div className="flex flex-col justify-center">
          <span className="font-medium text-stone-800 text-xs">{b.date || '—'}</span>
          <span className="text-[11px] text-stone-400 font-mono">{b.slotTime || '—'}</span>
        </div>
        {/* Token — left */}
        <div className="flex items-center">
          <TokenBadge token={b.tokenNumber} />
        </div>
        {/* Farmer — left */}
        <FarmerCell name={b.farmerName} sub={b.farmerId} />
        {/* Produce — left */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#F4E8CF] text-[#8A5A12] flex items-center justify-center shrink-0">{cropIcon(b.cropType)}</div>
          <div>
            <span className="font-medium text-stone-700 block text-xs">{b.cropType}</span>
            <span className="font-bold text-stone-900 text-xs">{b.quantityKg} kg</span>
          </div>
        </div>
        {/* Status — left */}
        <div className="flex items-center">
          <StatusPill status={b.status} />
        </div>
        {/* Action — right */}
        <div className="flex items-center justify-end">
          {nextStage ? (
            <PrimaryBtn onClick={() => handleStatusUpdate(b.id, nextStage)}>
              <span className="inline-flex">{Icon.arrow}</span><span>{nextStage}</span>
            </PrimaryBtn>
          ) : (
            <DoneChip />
          )}
        </div>
      </div>
    );
  });

  const metricCards = [
    { label: 'Total Volume',      value: stats.totalKg.toLocaleString(), unit: 'kg',      tint: 'text-[#B4431F]', icon: Icon.wheat, hero: true },
    { label: 'Pending Weighment', value: String(stats.pendingWeigh),     unit: 'vehicle', tint: 'text-[#3E6B8C]', icon: Icon.weighbridge },
    { label: 'QC Clearance',      value: String(stats.pendingQC),        unit: 'lot',     tint: 'text-[#6D5A7B]', icon: Icon.flask },
    { label: 'Settled Payouts',   value: `${stats.paid} paid`,           unit: '',        tint: 'text-[#5C6E46]', icon: Icon.rupee },
  ];

  return (
    <>
      <PageHeader title="All Bookings"
                  badge={`${bookings.length} total • Today`} search={search} setSearch={setSearch} />
      <MetricsBar cards={metricCards} />
      <TableCard headers={COLS} rows={rows} total={bookings.length} filtered={filtered.length} />
    </>
  );
}

/* ═══════════════════════════════════════════════════
   VIEW: WEIGHBRIDGE STATION
═══════════════════════════════════════════════════ */
function WeighbridgeStation({ bookings, search, setSearch, handleStatusUpdate, stats }) {
  const filtered = bookings.filter(b =>
    (b.cropType || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  const COLS = [
    { label: 'Token',           span: '120px', align: 'left'   },
    { label: 'Farmer Details',  span: 'minmax(0, 1fr)',   align: 'left'   },
    { label: 'Produce',         span: '120px', align: 'left'   },
    { label: 'Loaded (kg)',     span: '110px', align: 'right'  },
    { label: 'Unloaded (kg)',   span: '120px', align: 'right'  },
    { label: 'Net (kg)',        span: '100px', align: 'right'  },
    { label: 'Weight Cert',     span: '190px', align: 'center' },
    { label: 'Status',          span: '140px', align: 'center' },
    { label: 'Action',          span: '150px', align: 'right'  },
  ];

  const rows = filtered.map(b => {
    const qty      = Number(b.quantityKg || 0);
    const loaded   = Math.round(qty * 4.84);
    const unloaded = Math.round(qty * 3.84);
    const weighed  = b.status !== 'Queued';

    return (
      <div key={b.id}
           className={`grid items-center px-5 py-3 hover:bg-stone-50/70 transition-colors gap-4 ${b.status === 'Queued' ? 'bg-[#B4431F]/[0.04]' : ''}`}
           style={{ gridTemplateColumns: COLS.map(c => c.span).join(' ') }}>

        {/* Token — left */}
        <div className="flex items-center"><TokenBadge token={b.tokenNumber} /></div>

        {/* Farmer — left */}
        <FarmerCell name={b.farmerName} sub={b.farmerId} />

        {/* Produce — left */}
        <CropCell type={b.cropType} />

        {/* Loaded — right */}
        <div className="flex flex-col items-end justify-center">
          <span className="font-semibold text-stone-800 text-sm font-mono">{loaded.toLocaleString()}</span>
          <span className="text-stone-400 text-[10px]">kg</span>
        </div>

        {/* Unloaded — right */}
        <div className="flex flex-col items-end justify-center">
          <span className="font-semibold text-stone-800 text-sm font-mono">{unloaded.toLocaleString()}</span>
          <span className="text-stone-400 text-[10px]">kg</span>
        </div>

        {/* Net — right, boldest */}
        <div className="flex flex-col items-end justify-center">
          <span className="font-bold text-stone-900 text-sm font-mono">{qty}</span>
          <span className="text-stone-400 text-[10px]">kg net</span>
        </div>

        {/* Weight Cert — center */}
        <div className="flex items-center justify-center gap-2">
          {weighed ? (
            <><ImgChip name={`SCALE_${b.tokenNumber?.slice(-2) || '00'}.JPG`} /><ViewBtn /></>
          ) : (
            <UploadBtn label="UPLOAD READOUT" />
          )}
        </div>

        {/* Status — center */}
        <div className="flex items-center justify-center">
          <StatusPill status={weighed ? 'Weighed' : 'Queued'} small />
        </div>

        {/* Action — right */}
        <div className="flex items-center justify-end">
          {b.status === 'Queued' ? (
            <PrimaryBtn onClick={() => handleStatusUpdate(b.id, 'Weighed')}>
              <span>SAVE &amp; NEXT</span><span className="inline-flex">{Icon.arrow}</span>
            </PrimaryBtn>
          ) : (
            <PrimaryBtn>
              {Icon.print}<span>PRINT TICKET</span>
            </PrimaryBtn>
          )}
        </div>
      </div>
    );
  });

  const metricCards = [
    { label: "Today's Weighed Vol.", value: stats.totalKg.toLocaleString(), unit: 'kg',      tint: 'text-[#B4431F]', icon: Icon.weighbridge, hero: true },
    { label: 'Vehicles in Queue',    value: String(stats.pendingWeigh),     unit: 'pending', tint: 'text-[#3E6B8C]', icon: Icon.truck },
    { label: 'Awaiting Image Upload',value: String(stats.pendingWeigh),     unit: 'lot',     tint: 'text-[#8A5A12]', icon: Icon.camera },
    { label: 'Completed Tickets',    value: String(stats.paid + stats.total - stats.active), unit: 'tickets', tint: 'text-[#5C6E46]', icon: Icon.ticket },
  ];

  return (
    <>
      <PageHeader title="Weighbridge Station" subtitle="Real-time weighbridge queue and certificate management"
                  badge={`${bookings.length} total • Active Shift`} search={search} setSearch={setSearch} />
      <MetricsBar cards={metricCards} />
      <TableCard headers={COLS} rows={rows} total={bookings.length} filtered={filtered.length} />
    </>
  );
}

/* ═══════════════════════════════════════════════════
   VIEW: QC TESTING LAB
═══════════════════════════════════════════════════ */
function QCLab({ bookings, search, setSearch, handleStatusUpdate, stats }) {
  const filtered = bookings.filter(b =>
    (b.cropType || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  const COLS = [
    { label: 'Token',          span: '120px', align: 'left'   },
    { label: 'Farmer Details', span: 'minmax(0, 1fr)',   align: 'left'   },
    { label: 'Produce Type',   span: '120px', align: 'left'   },
    { label: 'Moisture (%)',   span: '110px', align: 'center' },
    { label: 'Foreign (%)',    span: '110px', align: 'center' },
    { label: 'Grade',          span: '110px', align: 'center' },
    { label: 'QC Cert Image',  span: '190px', align: 'center' },
    { label: 'Status',         span: '140px', align: 'center' },
    { label: 'Action',         span: '160px', align: 'right'  },
  ];

  const rows = filtered.map(b => {
    const qcDone = ['Quality Checked', 'Approved', 'Payment Initiated', 'Paid'].includes(b.status);
    const active = b.status === 'Weighed';
    return (
      <div key={b.id}
           className={`grid items-center px-5 py-3 hover:bg-stone-50/70 transition-colors gap-4 ${active ? 'bg-[#B4431F]/[0.04]' : ''}`}
           style={{ gridTemplateColumns: COLS.map(c => c.span).join(' ') }}>

        {/* Token — left */}
        <div className="flex items-center"><TokenBadge token={b.tokenNumber} /></div>

        {/* Farmer — left */}
        <FarmerCell name={b.farmerName} sub={b.farmerId} />

        {/* Produce — left */}
        <CropCell type={b.cropType} />

        {/* Moisture — center */}
        <div className="flex items-center justify-center">
          {active ? (
            <input defaultValue="12.4" className="w-16 px-1.5 py-1 text-sm border border-stone-200 rounded
                                                   font-mono text-center font-semibold bg-white
                                                   focus:outline-none focus:ring-2 focus:ring-[#B4431F]/25" />
          ) : (
            <span className="font-semibold text-stone-800 text-sm font-mono">11.8%</span>
          )}
        </div>

        {/* Foreign — center */}
        <div className="flex items-center justify-center">
          {active ? (
            <input defaultValue="0.8" className="w-16 px-1.5 py-1 text-sm border border-stone-200 rounded
                                                  font-mono text-center font-semibold bg-white
                                                  focus:outline-none focus:ring-2 focus:ring-[#B4431F]/25" />
          ) : (
            <span className="font-semibold text-stone-800 text-sm font-mono">0.4%</span>
          )}
        </div>

        {/* Grade — center */}
        <div className="flex items-center justify-center">
          {active ? (
            <select className="text-xs px-2 py-1 border border-stone-200 rounded bg-white font-semibold
                               text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#B4431F]/25">
              <option>Grade A</option><option>Grade B</option><option>Grade C</option>
            </select>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                             bg-[#E9EDDB] text-[#44532F] border border-[#CFD8B8]">Grade A</span>
          )}
        </div>

        {/* QC Cert Image — center */}
        <div className="flex items-center justify-center gap-2">
          {qcDone ? (
            <><ImgChip name={`QC_${b.cropType?.toUpperCase() || 'CERT'}_01.JPG`} /><ViewBtn /></>
          ) : active ? (
            <UploadBtn label="UPLOAD QC REPORT" />
          ) : (
            <span className="text-xs text-stone-400">—</span>
          )}
        </div>

        {/* Status — center */}
        <div className="flex items-center justify-center">
          <StatusPill status={active ? 'Quality Checked' : qcDone ? 'Quality Checked' : b.status} small />
        </div>

        {/* Action — right */}
        <div className="flex items-center justify-end">
          {active ? (
            <PrimaryBtn onClick={() => handleStatusUpdate(b.id, 'Quality Checked')}>
              <span>SAVE &amp; NEXT</span><span className="inline-flex">{Icon.arrow}</span>
            </PrimaryBtn>
          ) : qcDone ? (
            <PrimaryBtn>
              {Icon.print}<span>PRINT LAB REPORT</span>
            </PrimaryBtn>
          ) : (
            <span className="text-xs text-stone-400">Pending weigh</span>
          )}
        </div>
      </div>
    );
  });

  const metricCards = [
    { label: 'Samples Received',    value: String(bookings.length), unit: 'lots',     tint: 'text-[#8A5A12]', icon: Icon.wheat },
    { label: 'Tests Completed',     value: String(stats.paid + stats.pendingQC),       unit: 'verified', tint: 'text-[#B4431F]', icon: Icon.flask, hero: true },
    { label: 'Pending Lab Analysis',value: String(stats.pendingWeigh), unit: 'active', tint: 'text-[#6D5A7B]', icon: Icon.vial },
    { label: 'Avg. Analysis Time',  value: '8.4',                     unit: 'min',     tint: 'text-[#3E6B8C]', icon: Icon.timer },
  ];

  return (
    <>
      <PageHeader title="QC Testing Lab" subtitle="Real-time grain analysis, moisture grading and quality certification"
                  badge={`${bookings.length} samples • Active Shift`} search={search} setSearch={setSearch} />
      <MetricsBar cards={metricCards} />
      <TableCard headers={COLS} rows={rows} total={bookings.length} filtered={filtered.length} />
    </>
  );
}

/* ═══════════════════════════════════════════════════
   VIEW: PAYMENT SETTLEMENT
═══════════════════════════════════════════════════ */
function PaymentSettlement({ bookings, search, setSearch, handleStatusUpdate, stats }) {
  const filtered = bookings.filter(b =>
    (b.cropType || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  // No Payment Cert column — removed per user request
  const COLS = [
    { label: 'Token',            span: '120px', align: 'left'   },
    { label: 'Farmer & Account', span: 'minmax(0, 1fr)',   align: 'left'   },
    { label: 'Produce',          span: '120px', align: 'left'   },
    { label: 'Qty (kg)',         span: '100px', align: 'right'  },
    { label: 'Rate (₹/kg)',      span: '120px', align: 'right'  },
    { label: 'Total (₹)',        span: '130px', align: 'right'  },
    { label: 'Payable (₹)',      span: '150px', align: 'right'  },
    { label: 'Status',           span: '140px', align: 'center' },
    { label: 'Action',           span: '140px', align: 'right'  },
  ];

  const MSP_RATES = { Wheat: 24.50, Rice: 42.00, Soybean: 48.00 };

  const rows = filtered.map(b => {
    const paid  = b.status === 'Paid';
    const ready = b.status === 'Approved';
    const rate  = MSP_RATES[b.cropType] || 25;
    const qty   = Number(b.quantityKg || 0);
    const total = Math.round(qty * rate);
    const bankAbbr = ['HDFC', 'SBI', 'PNB', 'BOB', 'UCO'][Math.abs(b.farmerId?.charCodeAt(0) || 0) % 5];

    return (
      <div key={b.id}
           className={`grid items-center px-5 py-3 hover:bg-stone-50/70 transition-colors gap-4 ${ready ? 'bg-[#B4431F]/[0.04]' : ''}`}
           style={{ gridTemplateColumns: COLS.map(c => c.span).join(' ') }}>

        {/* Token — left */}
        <div className="flex items-center"><TokenBadge token={b.tokenNumber} /></div>

        {/* Farmer & Account — left */}
        <FarmerCell name={b.farmerName} sub={`${bankAbbr} •••• ${String(b.farmerId || '0000').slice(-4)}`} />

        {/* Produce — left */}
        <CropCell type={b.cropType} />

        {/* Qty — right */}
        <div className="flex flex-col items-end justify-center">
          <span className="font-semibold text-stone-800 text-sm">{qty}</span>
          <span className="text-stone-400 text-[10px]">kg</span>
        </div>

        {/* Rate — right */}
        <div className="flex flex-col items-end justify-center">
          <span className="font-semibold text-stone-700 text-sm font-mono">₹{rate.toFixed(2)}</span>
          <span className="text-stone-400 text-[10px]">per kg</span>
        </div>

        {/* Total — right */}
        <div className="flex items-center justify-end">
          <span className="font-bold text-stone-900 text-sm font-mono">₹{total.toLocaleString()}</span>
        </div>

        {/* Payable — right, highlighted */}
        <div className="flex items-center justify-end">
          {paid ? (
            <span className="bg-[#E9EDDB] border border-[#CFD8B8] text-[#44532F]
                             font-bold text-sm font-mono px-2.5 py-1 rounded-md">
              ₹{total.toLocaleString()}
            </span>
          ) : ready ? (
            <span className="bg-[#F6EBCF] border border-[#E5CF9F] text-[#7A4E0D]
                             font-bold text-sm font-mono px-2.5 py-1 rounded-md">
              ₹{total.toLocaleString()}
            </span>
          ) : (
            <span className="font-bold text-stone-500 text-sm font-mono">₹{total.toLocaleString()}</span>
          )}
        </div>

        {/* Status — center */}
        <div className="flex items-center justify-center">
          <StatusPill status={paid ? 'Paid' : ready ? 'Approved' : b.status} small />
        </div>

        {/* Action — right */}
        <div className="flex items-center justify-end">
          {ready ? (
            <PrimaryBtn onClick={() => handleStatusUpdate(b.id, 'Payment Initiated')}>
              <span className="inline-flex">{Icon.bolt}</span><span>TRIGGER DBT</span>
            </PrimaryBtn>
          ) : paid ? (
            <PrimaryBtn>
              {Icon.receipt}<span>RECEIPT</span>
            </PrimaryBtn>
          ) : (
            <span className="text-xs text-stone-400">—</span>
          )}
        </div>
      </div>
    );
  });



  const totalPaid = filtered
    .filter(b => b.status === 'Paid')
    .reduce((s, b) => s + Number(b.quantityKg || 0) * (MSP_RATES[b.cropType] || 25), 0);

  const metricCards = [
    { label: 'Total Settled',       value: `₹${Math.round(totalPaid).toLocaleString()}`, unit: '',       tint: 'text-[#B4431F]', icon: Icon.rupee, hero: true },
    { label: 'Payments in Process', value: String(stats.pendingWeigh), unit: 'active',   tint: 'text-[#8A5A12]', icon: Icon.transfer },
    { label: 'Awaiting Bank Conf.', value: String(stats.pendingQC),    unit: 'lot',      tint: 'text-[#37556E]', icon: Icon.bank },
    { label: 'Avg. Payout Cycle',   value: '4.2',                      unit: 'hrs',      tint: 'text-[#3E6B8C]', icon: Icon.timer },
  ];

  return (
    <>
      <PageHeader title="Payment Settlement" subtitle="Direct Benefit Transfer (DBT) disbursement and invoice ledger"
                  badge={`${bookings.length} transactions • Today`} search={search} setSearch={setSearch} />
      <MetricsBar cards={metricCards} />
      <TableCard headers={COLS} rows={rows} total={bookings.length} filtered={filtered.length} />
    </>
  );
}

/* ═══════════════════════════════════════════════════
   VIEW: PROCUREMENT SCHEDULES
═══════════════════════════════════════════════════ */
function SchedulesView({ schedules, search, setSearch }) {
  const filtered = schedules.filter(s =>
    (s.cropType || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];

  const COLS = [
    { label: 'Schedule',    span: 'minmax(0, 1.3fr)', align: 'left'   },
    { label: 'Date',        span: '120px',             align: 'left'   },
    { label: 'Time Window', span: '150px',             align: 'left'   },
    { label: 'MSP (₹/Qtl)', span: '110px',             align: 'right'  },
    { label: 'Slot Fill',   span: 'minmax(0, 1fr)',    align: 'left'   },
    { label: 'Status',      span: '130px',             align: 'center' },
  ];

  const rows = filtered.map(s => {
    const total  = Number(s.totalSlots || 0);
    const booked = Number(s.bookedSlots || 0);
    const pct    = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;
    const past   = (s.date || '') < today;
    const full   = !past && total > 0 && booked >= total;
    const st     = past ? 'Completed' : full ? 'House Full' : 'Open';
    const pillCls = st === 'Open'
      ? 'bg-[#E9EDDB] text-[#44532F] border-[#CFD8B8]'
      : 'bg-[#F7E3D3] text-[#933515] border-[#E8BFA4]';
    const dotCls = st === 'Open' ? 'bg-[#5C6E46]' : 'bg-[#B4431F]';
    const pillFinal = past ? 'bg-stone-100 text-stone-500 border-stone-200' : pillCls;
    const dotFinal  = past ? 'bg-stone-400' : dotCls;
    const barBg = full ? '#B4431F' : '#5C6E46';
    return (
      <div key={s.id}
           className="grid items-center px-5 py-3 hover:bg-stone-50/70 transition-colors gap-4"
           style={{ gridTemplateColumns: COLS.map(c => c.span).join(' ') }}>

        {/* Schedule — left */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded bg-[#F4E8CF] text-[#8A5A12] flex items-center justify-center shrink-0">{cropIcon(s.cropType)}</div>
          <div className="min-w-0">
            <span className="font-medium text-stone-700 block text-xs truncate">{s.cropType}</span>
            <span className="font-bold text-stone-900 text-xs">MSP ₹{s.mspRate}/Qtl</span>
          </div>
        </div>

        {/* Date — left */}
        <div className="flex items-center">
          <span className="font-medium text-stone-800 text-xs">{s.date || '—'}</span>
        </div>

        {/* Time Window — left */}
        <div className="flex items-center">
          <span className="text-xs text-stone-500 font-mono">{s.startTime || '—'} – {s.endTime || '—'}</span>
        </div>

        {/* MSP — right */}
        <div className="flex items-center justify-end">
          <span className="font-semibold text-stone-800 text-sm font-mono">₹{s.mspRate}</span>
        </div>

        {/* Slot Fill — left */}
        <div className="flex flex-col justify-center gap-1.5 min-w-0">
          <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: barBg }} />
          </div>
          <span className="text-[11px] text-stone-500 font-mono">{booked}/{total} slots</span>
        </div>

        {/* Status — center */}
        <div className="flex items-center justify-center">
          <span className={'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold border text-xs whitespace-nowrap ' + pillFinal}>
            <span className={'w-1.5 h-1.5 rounded-full ' + dotFinal} />
            {st}
          </span>
        </div>
      </div>
    );
  });

  const totalSlots  = schedules.reduce((sum, s) => sum + Number(s.totalSlots || 0), 0);
  const bookedSlots = schedules.reduce((sum, s) => sum + Number(s.bookedSlots || 0), 0);
  const openSlots   = Math.max(0, totalSlots - bookedSlots);
  const fillRate    = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  const metricCards = [
    { label: 'Open Slots',      value: String(openSlots),        unit: 'slots',  tint: 'text-[#B4431F]', icon: Icon.calendar, hero: true },
    { label: 'Total Schedules', value: String(schedules.length), unit: 'drives', tint: 'text-[#8A5A12]', icon: Icon.wheat },
    { label: 'Slots Booked',    value: String(bookedSlots),      unit: 'booked', tint: 'text-[#5C6E46]', icon: Icon.ticket },
    { label: 'Fill Rate',       value: String(fillRate),         unit: '%',      tint: 'text-[#3E6B8C]', icon: Icon.timer },
  ];

  return (
    <>
      <PageHeader title="Procurement Schedules" subtitle="Published drives, slot capacity and booking fill"
                  badge={`${schedules.length} total · ${openSlots} open`} search={search} setSearch={setSearch} />
      <MetricsBar cards={metricCards} />
      <TableCard headers={COLS} rows={rows} total={schedules.length} filtered={filtered.length}
                 emptyTitle="No schedules found"
                 emptySub="Publish a procurement schedule to open booking slots for farmers." />
    </>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function QueueView() {
  const user     = useStore(s => s.user);
  const logout   = useStore(s => s.logout);
  const navigate = useNavigate();

  const [bookings,    setBookings]    = useState([]);
  const [schedules,   setSchedules]   = useState([]);
  const [result,      setResult]      = useState(null);
  const [search,      setSearch]      = useState('');
  const [activeView,  setActiveView]  = useState('bookings');
  const [showForm,    setShowForm]    = useState(false);
  const [navOpen,      setNavOpen]      = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    cropType: '', date: '', startTime: '09:00', endTime: '17:00', mspRate: '', totalSlots: '50',
  });

  /* Real-time Firestore */
  useEffect(() => {
    const q = query(collection(db, 'bookings'), where('centerId', '==', user.centerId));
    const unsub = onSnapshot(q,
      snap => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) =>
            a.date === b.date
              ? (a.slotTime || '').localeCompare(b.slotTime || '')
              : (a.date  || '').localeCompare(b.date  || '')
          );
        setBookings(data);
      },
      err => console.error('Firestore error:', err)
    );
    return () => unsub();
  }, [user.centerId]);

  /* Real-time schedules for this centre */
  useEffect(() => {
    const q = query(collection(db, 'schedules'), where('centerId', '==', user.centerId));
    const unsub = onSnapshot(q,
      snap => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) =>
            a.date === b.date
              ? (a.startTime || '').localeCompare(b.startTime || '')
              : (a.date  || '').localeCompare(b.date  || '')
          );
        setSchedules(data);
      },
      err => console.error('Schedules snapshot error:', err)
    );
    return () => unsub();
  }, [user.centerId]);

  const handleStatusUpdate = async (id, next) => {
    try { await updateBookingStatus(id, next, user.name); }
    catch { alert('Failed to update status'); }
  };

  const handleCreateSchedule = async e => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await createSchedule(user, form);
      const summary = `${form.cropType || 'Crop'} · ${form.date || ''} · ${form.totalSlots || 0} slots`;
      setShowForm(false);
      setForm({ cropType: '', date: '', startTime: '09:00', endTime: '17:00', mspRate: '', totalSlots: '50' });
      setResult({ ok: true, title: 'Schedule published', message: summary + ' is now open for farmer bookings.' });
    } catch {
      setResult({ ok: false, title: 'Could not create schedule', message: 'Please check the details and try again.' });
    }
    finally { setFormLoading(false); }
  };

  /* Derived stats */
  const stats = useMemo(() => ({
    total:       bookings.length,
    paid:        bookings.filter(b => b.status === 'Paid').length,
    active:      bookings.filter(b => b.status !== 'Paid').length,
    pendingWeigh:bookings.filter(b => b.status === 'Queued').length,
    pendingQC:   bookings.filter(b => b.status === 'Weighed').length,
    totalKg:     bookings.reduce((s, b) => s + Number(b.quantityKg || 0), 0),
    paidKg:      bookings.filter(b => b.status === 'Paid').reduce((s, b) => s + Number(b.quantityKg || 0), 0),
  }), [bookings]);

  const volumePct = stats.totalKg > 0 ? Math.round((stats.paidKg / stats.totalKg) * 100) : 0;

  /* Reset search when switching views */
  const setView = v => { setActiveView(v); setSearch(''); setNavOpen(false); };

  const sharedProps = { bookings, schedules, search, setSearch, handleStatusUpdate, stats };

  return (
    <div className="flex h-dvh overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", background: '#F6F1E8' }}>

      {/* ── SIDEBAR ── */}
      <Sidebar
        user={user} stats={stats} bookings={bookings} volumePct={volumePct}
        activeView={activeView} setView={setView}
        setShowForm={setShowForm}
        logout={logout} navigate={navigate}
        open={navOpen} onClose={() => setNavOpen(false)}
      />
      {navOpen && (
        <div onClick={() => setNavOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden" />
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto" style={{ background: '#F6F1E8' }}>
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-white shadow-md" style={{ background: '#221A13' }}>
          <button onClick={() => setNavOpen(true)} aria-label="Open menu"
                  className="p-2 -ml-2 rounded-md text-stone-300 hover:text-white hover:bg-white/10 transition-colors">
            {Icon.menu}
          </button>
          <span className="font-display font-semibold tracking-tight truncate">FarmConnect</span>
          <span className="ml-auto text-[11px] font-mono text-stone-400 whitespace-nowrap">{stats.total} tokens</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
        {activeView === 'bookings'    && <AllBookings       {...sharedProps} />}
        {activeView === 'schedules'   && <SchedulesView     {...sharedProps} />}
        {activeView === 'weighbridge' && <WeighbridgeStation {...sharedProps} />}
        {activeView === 'qc'          && <QCLab             {...sharedProps} />}
        {activeView === 'payment'     && <PaymentSettlement  {...sharedProps} />}
        </div>
      </main>

      {/* ── CREATE SCHEDULE MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md p-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight">New Procurement Schedule</h3>
              <button onClick={() => setShowForm(false)}>
                <span className="text-stone-400 hover:text-stone-700 transition-colors inline-flex">{Icon.close}</span>
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              {[
                { label: 'Crop Type',        key: 'cropType',   type: 'text',   placeholder: 'e.g. Wheat' },
                { label: 'Date',             key: 'date',       type: 'date' },
                { label: 'Start Time',       key: 'startTime',  type: 'time' },
                { label: 'End Time',         key: 'endTime',    type: 'time' },
                { label: 'MSP Rate (₹/Qtl)',  key: 'mspRate',    type: 'number', placeholder: 'e.g. 2275' },
                { label: 'Total Slots',      key: 'totalSlots', type: 'number', placeholder: 'e.g. 100' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">{label}</label>
                  <input
                    type={type} value={form[key]} placeholder={placeholder}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-stone-300 p-2.5 rounded-md outline-none
                               focus:ring-2 focus:ring-[#B4431F] text-sm transition-all"
                    required
                  />
                </div>
              ))}
              <button type="submit" disabled={formLoading}
                      className="w-full bg-[#B4431F] hover:bg-[#933515] disabled:bg-[#D9A88F] text-white
                                 font-bold py-3 rounded mt-2 transition-colors">
                {formLoading ? 'Creating…' : 'Create Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── RESULT POPUP ── */}
      {result && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="bg-white rounded-md shadow-2xl w-full max-w-sm p-6 text-center">
            <div className={'mx-auto h-12 w-12 rounded-full flex items-center justify-center ' + (result.ok ? 'bg-[#E9EDDB] text-[#44532F]' : 'bg-[#F7E3D3] text-[#933515]')}>
              {result.ok ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              )}
            </div>
            <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight mt-4">{result.title}</h3>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{result.message}</p>
            <div className="flex items-center justify-center gap-2.5 mt-5">
              {result.ok ? (
                <>
                  <PrimaryBtn onClick={() => { setResult(null); setView('schedules'); }}>
                    <span className="inline-flex">{Icon.calendar}</span><span>View Schedules</span>
                  </PrimaryBtn>
                  <GhostBtn onClick={() => setResult(null)}>
                    <span>Stay Here</span>
                  </GhostBtn>
                </>
              ) : (
                <PrimaryBtn onClick={() => setResult(null)}>
                  <span>Try Again</span>
                </PrimaryBtn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
