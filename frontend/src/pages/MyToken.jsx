import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, CheckCircle, MapPin, Clock, Wheat, IndianRupee } from 'lucide-react';

const STAGES = [
  { label: 'Queued',            desc: 'Your token is in the queue.' },
  { label: 'Weighed',           desc: 'Produce weight recorded.' },
  { label: 'Quality Checked',   desc: 'Quality inspection done.' },
  { label: 'Approved',          desc: 'Produce accepted.' },
  { label: 'Payment Initiated', desc: 'Payment sent to your bank.' },
  { label: 'Paid',              desc: '✅ Amount credited via DBT.' },
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
    </div>
  );

  const currentIdx = STAGES.findIndex((s) => s.label === booking.status);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-green-600 text-white p-4 sticky top-0 flex items-center gap-3 shadow-sm z-10">
        <ArrowLeft className="cursor-pointer" onClick={() => navigate('/')} />
        <div>
          <h1 className="text-lg font-bold">My Token</h1>
          <p className="text-xs opacity-80">Live status · updates automatically</p>
        </div>
        {/* Live pulse */}
        <span className="ml-auto relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      </header>

      <div className="p-4 space-y-4">
        {/* Token Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border-t-8 border-green-600">
          <div className="p-5 flex flex-col items-center text-center">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Token Number</p>
            <h2 className="text-4xl font-black text-gray-800 tracking-widest mb-5">{booking.tokenNumber}</h2>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <QRCodeSVG value={booking.tokenNumber} size={150} />
            </div>
          </div>
          <div className="border-t border-gray-100 px-5 py-4 space-y-2 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={15} className="text-green-500" />
              <span>{booking.date} · Slot {booking.slotTime}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={15} className="text-green-500" />
              <span>{booking.centerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Wheat size={15} className="text-green-500" />
              <span>{booking.cropType} · {booking.quantityKg} kg · MSP ₹{booking.mspRate}/Qtl</span>
            </div>
          </div>
        </div>

        {/* Live Status Tracker */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h3 className="font-bold text-gray-800 mb-5">Live Status Tracker</h3>
          <div className="relative ml-3 border-l-2 border-gray-200 space-y-6 pl-6">
            {STAGES.map((stage, idx) => {
              const done    = idx <= currentIdx;
              const current = idx === currentIdx;
              return (
                <div key={stage.label} className="relative">
                  {/* Circle on the line */}
                  <div className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${done ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'}`}>
                    {done && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <p className={`font-semibold text-sm ${current ? 'text-green-600 text-base' : done ? 'text-gray-800' : 'text-gray-400'}`}>
                    {stage.label}
                  </p>
                  {(current || done) && (
                    <p className="text-xs text-gray-500 mt-0.5">{stage.desc}</p>
                  )}
                  {stage.label === 'Paid' && done && (
                    <p className="flex items-center gap-1 text-xs text-green-600 font-semibold mt-1">
                      <IndianRupee size={12} />
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
