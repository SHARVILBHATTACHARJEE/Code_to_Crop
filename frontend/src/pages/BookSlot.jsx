import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { bookSlot } from '../api/firestore';
import { useStore } from '../store';
import { ArrowLeft, Info } from 'lucide-react';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
];

export default function BookSlot() {
  const { scheduleId } = useParams();
  const navigate       = useNavigate();
  const user           = useStore((s) => s.user);

  const [schedule, setSchedule] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [slotTime, setSlotTime] = useState('09:00');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'schedules', scheduleId)).then((snap) => {
      if (snap.exists()) setSchedule({ id: snap.id, ...snap.data() });
    });
  }, [scheduleId]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) return alert('Enter valid quantity');
    setLoading(true);
    try {
      const booking = await bookSlot(user.id, user.name, scheduleId, quantity, slotTime);
      navigate(`/token/${booking.id}`);
    } catch (err) {
      alert(err.message || 'Booking failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!schedule) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white p-4 sticky top-0 flex items-center gap-3 shadow-sm z-10">
        <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <div>
          <h1 className="text-lg font-bold">Book a Slot</h1>
          <p className="text-xs opacity-80">{schedule.cropType} · {schedule.centerName}</p>
        </div>
      </header>

      {/* Schedule Info Banner */}
      <div className="bg-green-50 border-b border-green-100 px-4 py-3 flex justify-between text-sm">
        <span className="text-gray-600">📅 {schedule.date}</span>
        <span className="text-green-700 font-bold">MSP ₹{schedule.mspRate}/Qtl</span>
        <span className="text-gray-600">{schedule.totalSlots - schedule.bookedSlots} slots left</span>
      </div>

      <form onSubmit={handleBook} className="p-5 space-y-5">
        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Estimated Quantity (kg)
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 500"
            min="10"
            className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-lg"
            required
          />
        </div>

        {/* Time Slot */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Preferred Time Slot
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSlotTime(t)}
                className={`py-2 rounded-xl text-sm font-medium border transition
                  ${slotTime === t
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Your token guarantees service within a 1-hour window. Please arrive 15 minutes early with your produce.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-md disabled:bg-green-300 text-lg"
        >
          {loading ? 'Confirming...' : '✅ Confirm Booking'}
        </button>
      </form>
    </div>
  );
}
