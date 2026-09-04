import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { MapPin, Calendar, ArrowRight, UserCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedRes, bookRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/bookings/my')
      ]);
      setSchedules(schedRes.data);
      setBookings(bookRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">FarmConnect</h1>
        <UserCircle size={28} />
      </header>

      <div className="p-4">
        {bookings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">My Active Tokens</h2>
            <div className="flex flex-col gap-3">
              {bookings.map(b => (
                <div 
                  key={b.id} 
                  onClick={() => navigate(`/token/${b.id}`)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex justify-between items-center cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-green-700">{b.token_number}</div>
                    <div className="text-sm text-gray-600">{b.crop_type} • {b.quantity_kg}kg</div>
                    <div className="text-xs font-semibold mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded inline-block">
                      Status: {b.status}
                    </div>
                  </div>
                  <ArrowRight className="text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-gray-800 mb-3">Upcoming Procurement</h2>
        <div className="flex flex-col gap-4">
          {schedules.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800">{s.crop_type}</h3>
                  <span className="text-sm font-semibold text-green-700">MSP: ₹{s.msp_rate}/Qtl</span>
                </div>
                
                <div className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <Calendar size={16} />
                  {format(new Date(s.date), 'dd MMM yyyy')} ({s.start_time.slice(0,5)} - {s.end_time.slice(0,5)})
                </div>
                
                <div className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                  <MapPin size={16} />
                  {s.center_name}, {s.district}
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Slots: {s.total_slots - s.booked_slots} left</span>
                  <button 
                    onClick={() => navigate(`/book/${s.id}`)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Book Slot
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {schedules.length === 0 && (
            <div className="text-center p-6 text-gray-500 bg-white rounded-xl shadow-sm">
              No upcoming schedules in your area.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
