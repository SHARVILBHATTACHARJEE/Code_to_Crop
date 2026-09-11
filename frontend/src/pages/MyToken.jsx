import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { DarkHeader, FIcon, CropIcon, LiveDot } from '../components/farm';

const STAGES = [
  { label: 'Queued',            desc: 'Your token is in the queue.' },
  { label: 'Weighed',           desc: 'Produce weight recorded.' },
  { label: 'Quality Checked',   desc: 'Quality inspection done.' },
  { label: 'Approved',          desc: 'Produce accepted.' },
  { label: 'Payment Initiated', desc: 'Payment sent to your bank.' },
  { label: 'Paid',              desc: 'Amount credited via DBT.' },
];

export default function MyToken() {
  const { bookingId } = useParams();
  const navigate       = useNavigate();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    // onSnapshot — Firestore real-time listener (replaces Socket.io completely)
    const unsub = onSnapshot(doc(db, 'bookings', bookingId), (snap) => {
      if (snap.exists()) setBooking({ id: snap.id, ...snap.data() });
    });
    return () => unsub(); // cleanup listener on unmount
  }, [bookingId]);

  if (!booking) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#F6F1E8' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#B4431F] border-t-transparent" />
    </div>
  );

  const currentIdx = STAGES.findIndex((s) => s.label === booking.status);

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F6F1E8' }}>
      <DarkHeader
        left={
          <button onClick={() => navigate('/')} aria-label="Back"
                  className="p-2 -ml-2 rounded-md text-stone-400 hover:text-[#DE9A63] hover:bg-white/5 transition-colors">
            <FIcon name="arrowL" className="text-lg" />
          </button>
        }
        title="My Token"
        sub="Live status · updates automatically"
        right={
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-[#A9BC8A]">
            <LiveDot /> LIVE
          </span>
        }
      />

      <div className="p-4 space-y-4">
        {/* Token Card */}
        <div className="bg-white rounded-md shadow-sm border border-stone-200/80 overflow-hidden">
          <div className="h-1.5" style={{ background: '#B4431F' }} />
          <div className="p-5 flex flex-col items-center text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-1">Token Number</p>
            <h2 className="font-display text-4xl font-semibold text-stone-900 tracking-[0.12em] mb-5">{booking.tokenNumber}</h2>
            <div className="bg-[#FBF8F1] p-3 rounded-md border border-[#E5CF9F]">
              <QRCodeSVG value={booking.tokenNumber} size={150} />
            </div>
          </div>
          <div className="border-t border-stone-100 px-5 py-4 space-y-2.5" style={{ background: '#FAF6EC' }}>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <FIcon name="clock" className="text-sm text-[#3E6B8C] shrink-0" />
              <span>{booking.date} · Slot {booking.slotTime}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <FIcon name="pin" className="text-sm text-[#5C6E46] shrink-0" />
              <span>{booking.centerName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="text-sm text-[#8A5A12] inline-flex shrink-0"><CropIcon type={booking.cropType} /></span>
              <span>{booking.cropType} · {booking.quantityKg} kg · MSP ₹{booking.mspRate}/Qtl</span>
            </div>
          </div>
        </div>

        {/* Live Status Tracker */}
        <div className="bg-white rounded-md shadow-sm border border-stone-200/80 p-5">
          <h3 className="font-display text-lg font-semibold text-stone-900 tracking-tight mb-5">Live Status Tracker</h3>
          <div className="relative ml-3 border-l-2 border-stone-200 space-y-6 pl-6">
            {STAGES.map((stage, idx) => {
              const done    = idx <= currentIdx;
              const current = idx === currentIdx;
              return (
                <div key={stage.label} className="relative">
                  <div className={'absolute -left-[27px] top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-white text-[10px] ' + (done ? 'border-[#B4431F] bg-[#B4431F]' : 'border-stone-300 bg-white')}>
                    {done && <FIcon name="check" />}
                  </div>
                  <p className={'font-semibold ' + (current ? 'text-[#B4431F] text-base' : done ? 'text-sm text-stone-800' : 'text-sm text-stone-400')}>
                    {stage.label}
                  </p>
                  {(current || done) && (
                    <p className="text-xs text-stone-500 mt-0.5">{stage.desc}</p>
                  )}
                  {stage.label === 'Paid' && done && (
                    <p className="flex items-center gap-1 text-xs text-[#44532F] font-semibold mt-1.5 bg-[#E9EDDB] border border-[#CFD8B8] rounded-md px-2 py-1 w-fit">
                      <FIcon name="rupee" className="text-sm" />
                      Estimated: ₹{(booking.quantityKg * booking.mspRate / 100).toFixed(2)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}