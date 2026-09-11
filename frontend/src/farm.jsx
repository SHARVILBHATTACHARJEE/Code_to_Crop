/* FarmConnect farmer-app design system — mirrors the officer dashboard:
   terracotta primary #B4431F, olive #5C6E46, wheat tints, warm charcoal
   headers, Fraunces display type, sharp corners, pills only for status. */

const PATHS = {
  wheat: (<><path d="M12 22V8" strokeLinecap="round" strokeWidth="2" /><path d="M12 8C12 4.7 9.6 2.6 6.2 2.6c0 3.4 2.4 5.4 5.8 5.4z" strokeLinejoin="round" strokeWidth="1.8" /><path d="M12 8c0-3.3 2.4-5.4 5.8-5.4 0 3.4-2.4 5.4-5.8 5.4z" strokeLinejoin="round" strokeWidth="1.8" /><path d="M12 13c-1.6 0-3.8-.6-5-2M12 16.5c1.6 0 3.8-.6 5-2" strokeLinecap="round" strokeWidth="1.8" /></>),
  rice: (<><path d="M6.5 10h11l-1.3 9.2a2 2 0 01-2 1.8H9.8a2 2 0 01-2-1.8L6.5 10z" strokeLinejoin="round" strokeWidth="2" /><path d="M6.5 10c0-2.2 2.4-3.5 5.5-3.5s5.5 1.3 5.5 3.5" strokeWidth="2" /><path d="M12 6.5V4M9.5 13.5h5" strokeLinecap="round" strokeWidth="1.8" /></>),
  soybean: (<><path d="M7.5 20.5C4.5 14.5 6.5 7.5 14.5 4c2.8 6 .8 13-7 16.5z" strokeLinejoin="round" strokeWidth="2" /><circle cx="10.6" cy="11.4" r="1.1" fill="currentColor" stroke="none" /><circle cx="12.4" cy="14.8" r="1.1" fill="currentColor" stroke="none" /></>),
  ticket: (<><path d="M4 8a2 2 0 002-2h12a2 2 0 002 2v1.5a2.5 2.5 0 000 5V16a2 2 0 00-2 2H6a2 2 0 00-2-2v-1.5a2.5 2.5 0 000-5V8z" strokeLinejoin="round" strokeWidth="1.8" /><path d="M13.5 7.5v1.8M13.5 11.1v1.8M13.5 14.7v1.8" strokeLinecap="round" strokeWidth="1.8" /></>),
  calendar: (<><rect x="3" y="4.5" width="18" height="16" rx="2" strokeWidth="2" /><path d="M8 2.5v4M16 2.5v4M3 9.5h18" strokeLinecap="round" strokeWidth="2" /></>),
  pin: (<><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" strokeLinejoin="round" strokeWidth="2" /><circle cx="12" cy="10" r="2.6" strokeWidth="2" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" strokeWidth="2" /><path d="M12 7.5V12l3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></>),
  user: (<><circle cx="12" cy="8" r="3.6" strokeWidth="2" /><path d="M4.5 20a7.5 7.5 0 0115 0" strokeLinecap="round" strokeWidth="2" /></>),
  arrowR: (<path d="M13 6l6 6-6 6M19 12H5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />),
  arrowL: (<path d="M11 18l-6-6 6-6M5 12h14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />),
  logout: (<path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />),
  check: (<path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />),
  info: (<><circle cx="12" cy="12" r="8.5" strokeWidth="2" /><path d="M12 11v5M12 7.8v.3" strokeLinecap="round" strokeWidth="2" /></>),
  rupee: (<path d="M6 3.5h12M6 7.5h12M6 3.5c7.5 0 9.5 1.6 9.5 4s-2.8 4-6.5 4l8.5 9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />),
};

export function FIcon({ name, className }) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         className={className} aria-hidden="true">
      {PATHS[name] || null}
    </svg>
  );
}

export function CropIcon({ type, className }) {
  const t = (type || '').toLowerCase();
  const name = t.indexOf('rice') !== -1 ? 'rice' : t.indexOf('soy') !== -1 ? 'soybean' : 'wheat';
  return <FIcon name={name} className={className} />;
}

const STATUS_CONFIG = {
  Queued:              { pill: 'bg-[#F7ECD4] text-[#8A5A12] border-[#E7CF9E]', dot: 'bg-[#C07A1A]' },
  Weighed:             { pill: 'bg-[#E4EBF0] text-[#37556E] border-[#C3D2DC]', dot: 'bg-[#3E6B8C]' },
  'Quality Checked':   { pill: 'bg-[#ECE7EE] text-[#5D4A6B] border-[#D3C8DB]', dot: 'bg-[#6D5A7B]' },
  Approved:            { pill: 'bg-[#F1DFB8] text-[#7A4E0D] border-[#DDBE7E]', dot: 'bg-[#8A5A12]' },
  'Payment Initiated': { pill: 'bg-[#F7E3D3] text-[#933515] border-[#E8BFA4]', dot: 'bg-[#B4431F]' },
  Paid:                { pill: 'bg-[#E9EDDB] text-[#44532F] border-[#CFD8B8]', dot: 'bg-[#5C6E46]' },
};

export function StatusPill({ status, small }) {
  const cfg = STATUS_CONFIG[status] || { pill: 'bg-stone-100 text-stone-600 border-stone-200', dot: 'bg-stone-400' };
  return (
    <span className={'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap ' + cfg.pill + (small ? ' text-[10px]' : ' text-xs')}>
      <span className={'w-1.5 h-1.5 rounded-full ' + cfg.dot} />
      {status}
    </span>
  );
}

export function TokenBadge({ token }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-bold font-mono tracking-widest bg-[#F4E8CF] text-[#8A5A12] border border-[#E5CF9F]">
      {token}
    </span>
  );
}

export function PrimaryBtn({ children, onClick, type, disabled, small, className }) {
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}
            className={'inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#B4431F] hover:bg-[#933515] active:scale-[0.98] transition shadow-sm whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none ' + (small ? 'px-3 py-2 text-xs rounded' : 'px-4 py-2.5 text-sm rounded') + (className ? ' ' + className : '')}>
      {children}
    </button>
  );
}

export function DarkHeader({ left, title, sub, right }) {
  return (
    <header className="text-white px-4 py-3.5 flex items-center gap-3 sticky top-0 z-10 shadow-md"
            style={{ background: '#221A13' }}>
      {left || null}
      <div className="min-w-0">
        <h1 className="font-display text-lg font-semibold tracking-tight leading-tight truncate">{title}</h1>
        {sub ? <p className="text-[11px] text-stone-400 truncate">{sub}</p> : null}
      </div>
      {right ? <div className="ml-auto flex items-center gap-1.5 shrink-0">{right}</div> : null}
    </header>
  );
}

export function SectionTitle({ icon, children, aside }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[#B4431F] text-base inline-flex">{icon}</span>
      <h2 className="font-display text-lg font-semibold text-stone-900 tracking-tight">{children}</h2>
      {aside ? <span className="ml-auto">{aside}</span> : null}
    </div>
  );
}

export function TextInput(props) {
  const { className, ...rest } = props;
  return (
    <input {...rest}
           className={'w-full bg-white border border-stone-300 p-3 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#B4431F]/25 focus:border-[#B4431F] transition-all placeholder:text-stone-400' + (className ? ' ' + className : '')} />
  );
}

export function LiveDot() {
  return <span className="w-2 h-2 rounded-full bg-[#A9BC8A] ring-4 ring-[#A9BC8A]/25 inline-block" />;
}