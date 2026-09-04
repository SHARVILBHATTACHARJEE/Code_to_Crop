import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function BookSlot() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState('');
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/bookings', {
        schedule_id: parseInt(scheduleId),
        quantity_kg: parseFloat(quantity),
        slot_time: time + ':00'
      });
      navigate(`/token/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white p-4 sticky top-0 flex items-center gap-3 shadow-sm">
        <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="text-xl font-bold">Book a Slot</h1>
      </header>

      <form onSubmit={handleBook} className="p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Quantity (kg)</label>
          <input 
            type="number" 
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-green-500"
            placeholder="e.g. 500"
            required
            min="10"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time Slot</label>
          <select 
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-green-500 bg-white"
          >
            <option value="09:00">09:00 AM - 10:00 AM</option>
            <option value="10:00">10:00 AM - 11:00 AM</option>
            <option value="11:00">11:00 AM - 12:00 PM</option>
            <option value="12:00">12:00 PM - 01:00 PM</option>
            <option value="14:00">02:00 PM - 03:00 PM</option>
          </select>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 mt-4">
          <CheckCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-blue-800">
            Booking a slot guarantees that you will be served within your 1-hour window. Please arrive 15 minutes early.
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-600 text-white font-bold py-4 rounded-lg mt-4 w-full shadow-md disabled:bg-green-400"
        >
          {loading ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}
