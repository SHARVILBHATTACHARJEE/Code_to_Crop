import React, { useEffect, useState } from 'react';
import api from '../api';
import { useStore } from '../store';
import { io } from 'socket.io-client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Search, LogOut } from 'lucide-react';

const STAGES = ['Queued', 'Weighed', 'Quality Checked', 'Approved', 'Payment Initiated', 'Paid'];

export default function QueueView() {
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const [bookings, setBookings] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQueue();
    
    const socket = io('http://localhost:5000');
    socket.emit('join_center', user.center_id);
    
    socket.on('new_booking', (booking) => {
      // Need to fetch full details including farmer name ideally, 
      // but for simplicity we refetch the queue
      fetchQueue();
    });
    
    socket.on('booking_changed', () => {
      fetchQueue();
    });

    return () => socket.disconnect();
  }, [user.center_id]);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
      scanner.render((decodedText) => {
        setSearchTerm(decodedText);
        setShowScanner(false);
        scanner.clear();
      }, (err) => {});
      return () => {
        try { scanner.clear(); } catch(e) {}
      };
    }
  }, [showScanner]);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/bookings/center');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      fetchQueue();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.token_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.farmer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-400">FarmConnect</h1>
          <p className="text-slate-400 text-sm mt-1">Officer Portal</p>
        </div>
        <div className="flex-1 px-4">
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Center</p>
            <p className="font-semibold">{user.name}</p>
          </div>
        </div>
        <div className="p-4 border-t border-slate-700">
          <button onClick={logout} className="flex items-center gap-2 text-slate-300 hover:text-white transition w-full">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full">
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Today's Queue</h2>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search token or name..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button 
              onClick={() => setShowScanner(!showScanner)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <QrCode size={18} /> {showScanner ? 'Close Scanner' : 'Scan Token'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {showScanner && (
            <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 max-w-md mx-auto">
              <div id="reader" className="w-full"></div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Time Slot</th>
                  <th className="px-6 py-4">Token No.</th>
                  <th className="px-6 py-4">Farmer Info</th>
                  <th className="px-6 py-4">Produce</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4 text-right">Update Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No farmers in queue for today.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(b => {
                    const currentIdx = STAGES.indexOf(b.status);
                    const nextStage = currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;
                    
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {b.slot_time.slice(0,5)}
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600 tracking-wider">
                          {b.token_number}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{b.farmer_name}</div>
                          <div className="text-slate-500 text-xs">{b.mobile}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{b.crop_type}</div>
                          <div className="font-medium">{b.quantity_kg} kg</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                            ${b.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {nextStage ? (
                            <button 
                              onClick={() => updateStatus(b.id, nextStage)}
                              className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600 transition"
                            >
                              Mark as {nextStage}
                            </button>
                          ) : (
                            <span className="text-green-600 font-semibold flex items-center justify-end gap-1 text-sm">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
