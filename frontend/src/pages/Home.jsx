import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { getMyBookings } from '../api/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { DarkHeader, SectionTitle, StatusPill, TokenBadge, PrimaryBtn, FIcon, CropIcon } from '../components/farm';

export default function Home() {
  const user     = useStore((s) => s.user);
  const logout   = useStore((s) => s.logout);
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // Real-time listener — new schedules from officer dashboard appear instantly
    const unsub = onSnapshot(
      query(collection(db, 'schedules')),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date));
        setSchedules(data);
      },
      (err) => console.error('schedules snapshot error:', err)
    );

    // One-time fetch for farmer's own bookings
    getMyBookings(user.id)
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));

    return () => unsub();
  }, [user.id]);

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="pb-8">
      <DarkHeader
        left={
          <div className="h-9 w-9 rounded-md flex items-center justify-center text-white text-xl shrink-0"
               style={{ background: '#B4431F' }}>
            <FIcon name="wheat" />
          </div>
        }
        title="FarmConnect"
        sub="Farmer App"
        right={
          <>
            <span className="flex items-center gap-1.5 text-xs text-stone-300 max-w-[110px]">
              <FIcon name="user" className="text-sm text-[#DE9A63] shrink-0" />
              <span className="truncate">{user.name}</span>
            </span>
            <button onClick={() => { logout(); navigate('/login'); }} aria-label="Logout"
                    className="p-2 rounded-md text-stone-400 hover:text-[#DE9A63] hover:bg-white/5 transition-colors">
              <FIcon name="logout" className="text-base" />
            </button>
          </>
        }
      />

      <div className="p-4 space-y-6">
        {/* Welcome */}
        <section className="rounded-md border border-[#E5CF9F] p-4 flex items-center gap-3"
                 style={{ background: '#F7ECD4' }}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#8A5A12] uppercase">Namaste</p>
            <h2 className="font-display text-xl font-semibold text-stone-900 tracking-tight leading-snug truncate">{user.name}</h2>
            <p className="text-xs text-stone-500 mt-0.5">{todayStr} · {bookings.length} active tokens · {schedules.length} upcoming drives</p>
          </div>
          <span className="ml-auto text-4xl text-[#B4431F]/70 shrink-0"><FIcon name="wheat" /></span>
        </section>

        {/* Active Tokens */}
        {bookings.length > 0 && (
          <section>
            <SectionTitle icon={<FIcon name="ticket" />}
                          aside={<span className="text-[11px] font-semibold text-[#8A5A12] bg-[#F4E8CF] border border-[#E5CF9F] px-2 py-0.5 rounded">{bookings.length} active</span>}>
              My Active Tokens
            </SectionTitle>
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/token/${b.id}`)}
                  className="bg-white border border-stone-200/80 rounded-md p-4 flex justify-between items-center gap-3 shadow-sm cursor-pointer active:scale-[0.98] transition hover:border-[#B4431F]/40"
                >
                  <div className="min-w-0">
                    <TokenBadge token={b.tokenNumber} />
                    <p className="text-xs text-stone-500 mt-1.5 truncate">{b.cropType} · {b.quantityKg} kg · {b.centerName}</p>
                    <div className="mt-1.5"><StatusPill status={b.status} small /></div>
                  </div>
                  <FIcon name="arrowR" className="text-lg text-stone-300 shrink-0" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Schedules */}
        <section>
          <SectionTitle icon={<FIcon name="calendar" />}>Upcoming Procurement</SectionTitle>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white border border-stone-200/60 rounded-md flex items-center justify-center">
                  <FIcon name="wheat" className="text-2xl text-stone-200" />
                </div>
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-10 bg-white border border-stone-200/60 rounded-md shadow-sm">
              <FIcon name="calendar" className="text-3xl text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-500">No upcoming schedules found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((s) => {
                const slotsLeft = s.totalSlots - s.bookedSlots;
                const full = slotsLeft <= 0;
                return (
                  <div key={s.id} className="bg-white rounded-md shadow-sm border border-stone-200/80 overflow-hidden">
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-[#F4E8CF] text-[#8A5A12] text-xl flex items-center justify-center shrink-0">
                        <CropIcon type={s.cropType} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-stone-900 tracking-tight leading-tight truncate">{s.cropType}</p>
                        <p className="text-xs font-bold text-[#8A5A12]">MSP ₹{s.mspRate}/Qtl</p>
                      </div>
                      <span className={'ml-auto shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded border ' + (full ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-[#E9EDDB] text-[#44532F] border-[#CFD8B8]')}>
                        {full ? 'House full' : `${slotsLeft} slots left`}
                      </span>
                    </div>
                    <div className="px-4 pb-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <FIcon name="calendar" className="text-sm text-[#8A5A12] shrink-0" />
                        <span>{s.date} &nbsp;({s.startTime} – {s.endTime})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <FIcon name="pin" className="text-sm text-[#5C6E46] shrink-0" />
                        <span className="truncate">{s.centerName}</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t border-stone-100 flex justify-end">
                      {full ? (
                        <span className="text-xs font-semibold text-stone-400 bg-stone-100 border border-stone-200 px-3 py-2 rounded">Full</span>
                      ) : (
                        <PrimaryBtn small onClick={() => navigate(`/book/${s.id}`)}>
                          Book Slot <FIcon name="arrowR" className="text-sm" />
                        </PrimaryBtn>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}