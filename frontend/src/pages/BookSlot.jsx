import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { bookSlot } from '../api/firestore';
import { useStore } from '../store';
import { DarkHeader, PrimaryBtn, TextInput, FIcon, LangToggle } from '../components/farm';
import { useT, t } from '../components/i18n';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
];

export default function BookSlot() {
  const { scheduleId } = useParams();
  const navigate       = useNavigate();
  const user           = useStore((s) => s.user);
  const lang           = useStore((s) => s.lang);
  const tr             = useT();

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
    if (!quantity || parseFloat(quantity) <= 0) return alert(t(lang, 'alertQty'));
    setLoading(true);
    try {
      const booking = await bookSlot(user.id, user.name, scheduleId, quantity, slotTime);
      navigate(`/token/${booking.id}`);
    } catch (err) {
      alert(err.message || t(lang, 'alertBookingFail'));
    } finally {
      setLoading(false);
    }
  };

  if (!schedule) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#F6F1E8' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#B4431F] border-t-transparent" />
    </div>
  );

  const slotsLeft = schedule.totalSlots - schedule.bookedSlots;

  return (
    <div className="min-h-screen pb-8" style={{ background: '#F6F1E8' }}>
      <DarkHeader
        left={
          <button onClick={() => navigate(-1)} aria-label={tr('back')}
                  className="p-2 -ml-2 rounded-md text-stone-400 hover:text-[#DE9A63] hover:bg-white/5 transition-colors shrink-0">
            <FIcon name="arrowL" className="text-lg" />
          </button>
        }
        title={tr('bookASlot')}
        sub={`${schedule.cropType} · ${schedule.centerName}`}
        right={<LangToggle />}
      />

      <div className="bg-[#F7ECD4] border-b border-[#E5CF9F] px-4 py-3 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-stone-600 min-w-0">
          <FIcon name="calendar" className="text-sm text-[#8A5A12] shrink-0" /> <span className="truncate">{schedule.date}</span>
        </span>
        <span className="font-bold text-[#8A5A12] whitespace-nowrap">{tr('msp')} ₹{schedule.mspRate}/{tr('qtl')}</span>
        <span className="text-stone-500 font-medium whitespace-nowrap">{slotsLeft} {tr('slotsLeft')}</span>
      </div>

      <form onSubmit={handleBook} className="p-5 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
            {tr('qtyLabel')}
          </label>
          <TextInput type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                     placeholder={tr('qtyPh')} min="10" className="text-lg py-3.5" required />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wider">
            {tr('slotLabel')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((tm) => (
              <button
                key={tm}
                type="button"
                onClick={() => setSlotTime(tm)}
                className={'py-2.5 rounded-md text-xs font-semibold border transition ' + (slotTime === tm
                  ? 'bg-[#B4431F] text-white border-[#B4431F] shadow-sm'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-[#B4431F]/50')}
              >
                {tm}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#E4EBF0] border border-[#C3D2DC] rounded-md p-4 flex gap-3">
          <FIcon name="info" className="text-lg text-[#3E6B8C] shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-[#37556E]">{tr('infoText')}</p>
        </div>

        <PrimaryBtn type="submit" disabled={loading} className="w-full py-4 text-base">
          {loading ? tr('confirming') : tr('confirmBooking')}
        </PrimaryBtn>
      </form>
    </div>
  );
}