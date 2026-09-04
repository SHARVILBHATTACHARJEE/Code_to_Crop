import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Clock, CheckCircle, MapPin, Truck, IndianRupee } from 'lucide-react';
import { io } from 'socket.io-client';

const STAGES = ['Queued', 'Weighed', 'Quality Checked', 'Approved', 'Payment Initiated', 'Paid'];

export default function MyToken() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    fetchBooking();
    
    // Connect to WebSocket
    const socket = io('http://localhost:5000');
    socket.emit('join_booking', bookingId);
    
    socket.on('status_updated', (data) => {
      setBooking(prev => prev ? { ...prev, status: data.status } : prev);
      // Optional: use browser push notifications here
    });

    return () => socket.disconnect();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await api.get('/bookings/my');
      const b = res.data.find(x => x.id === parseInt(bookingId));
      setBooking(b);
    } catch (err) {
      console.error(err);
    }
  };

  if (!booking) return <div className="p-8 text-center">Loading...</div>;

  const currentStageIndex = STAGES.indexOf(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-green-600 text-white p-4 sticky top-0 flex items-center gap-3 shadow-sm z-10">
        <ArrowLeft className="cursor-pointer" onClick={() => navigate('/')} />
        <h1 className="text-xl font-bold">My Token</h1>
      </header>

      <div className="p-4">
        {/* Token Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 text-center border-t-8 border-green-600 mb-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 bg-green-50 w-24 h-24 rounded-full opacity-50"></div>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Token Number</p>
          <h2 className="text-3xl font-black text-gray-800 tracking-widest mb-6">{booking.token_number}</h2>
          
          <div className="flex justify-center mb-6 bg-white p-2 inline-block rounded-lg shadow-sm">
            <QRCodeSVG value={booking.token_number} size={160} />
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 text-left">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-green-600 shrink-0" size={18} />
              <span className="text-sm font-medium">{booking.date} • {booking.slot_time.slice(0,5)}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="text-green-600 shrink-0" size={18} />
              <span className="text-sm font-medium">{booking.center_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="text-green-600 shrink-0" size={18} />
              <span className="text-sm font-medium">{booking.crop_type} ({booking.quantity_kg} kg)</span>
            </div>
          </div>
        </div>

        {/* Live Tracker */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center justify-between">
            Live Status Tracker
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </h3>
          
          <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
            {STAGES.map((stage, index) => {
              const isCompleted = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              
              return (
                <div key={stage} className="relative pl-6">
                  <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center
                    ${isCompleted ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                  >
                    {isCompleted && <CheckCircle size={10} className="text-white" />}
                  </div>
                  <h4 className={`text-sm font-bold ${isCurrent ? 'text-green-600 text-base' : (isCompleted ? 'text-gray-800' : 'text-gray-400')}`}>
                    {stage}
                  </h4>
                  {stage === 'Paid' && isCompleted && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <IndianRupee size={12}/> Amount transferred to bank via DBT
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
