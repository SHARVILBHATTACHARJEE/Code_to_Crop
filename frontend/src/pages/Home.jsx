import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchedules, getMyBookings } from '../api/firestore';
import { useStore } from '../store';
import { MapPin, Calendar, ArrowRight, LogOut, Wheat } from 'lucide-react';

export default function Home() {
  const user     = useStore((s) => s.user);
  const logout   = useStore((s) => s.logout);
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, b] = await Promise.all([
          getSchedules(),
          getMyBookings(user.id),
        ]);
        setSchedules(s);
        setBookings(b);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const statusColor = (status) => {
    const map = {
      Queued: 'bg-gray-100 text-gray-700',
      Weighed: 'bg-blue-100 text-blue-700',
      'Quality Checked': 'bg-purple-100 text-purple-700',
      Approved: 'bg-yellow-100 text-yellow-700',
      'Payment Initiated': 'bg-orange-100 text-orange-700',
      Paid: 'bg-green-100 text-green-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Wheat size={22} />
          <span className="text-lg font-bold">FarmConnect</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">👤 {user.name}</span>
          <LogOut size={18} className="cursor-pointer opacity-80" onClick={() => { logout(); navigate('/login'); }} />
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Active Tokens */}
        {bookings.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">📋 My Active Tokens</h2>
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/token/${b.id}`)}
                  className="bg-white border border-green-100 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer active:scale-95 transition"
                >
                  <div>
                    <p className="font-black text-green-700 text-lg tracking-wider">{b.tokenNumber}</p>
                    <p className="text-sm text-gray-500">{b.cropType} · {b.quantityKg} kg · {b.centerName}</p>
                    <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                  <ArrowRight className="text-gray-300" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Schedules */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3">🌾 Upcoming Procurement</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center text-gray-400 py-10 bg-white rounded-2xl shadow-sm">
              No upcoming schedules found.
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-green-600 text-white px-4 py-2 flex justify-between items-center">
                    <span className="font-bold text-lg">{s.cropType}</span>
                    <span className="text-sm font-semibold opacity-90">MSP ₹{s.mspRate}/Qtl</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={15} className="text-green-500" />
                      <span>{s.date} &nbsp;({s.startTime} – {s.endTime})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={15} className="text-green-500" />
                      <span>{s.centerName}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                      <span className="text-xs text-gray-400">
                        {s.totalSlots - s.bookedSlots} slots remaining
                      </span>
                      <button
                        onClick={() => navigate(`/book/${s.id}`)}
                        disabled={s.totalSlots - s.bookedSlots <= 0}
                        className="bg-green-600 disabled:bg-gray-300 text-white text-sm font-bold px-4 py-2 rounded-xl"
                      >
                        {s.totalSlots - s.bookedSlots <= 0 ? 'Full' : 'Book Slot →'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
