import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { updateBookingStatus, createSchedule } from '../api/firestore';
import { useStore } from '../store';
import { LogOut, Plus, X, Search } from 'lucide-react';

const STAGES = ['Queued', 'Weighed', 'Quality Checked', 'Approved', 'Payment Initiated', 'Paid'];

const statusBadge = (status) => {
  const map = {
    Queued:             'bg-gray-100 text-gray-700',
    Weighed:            'bg-blue-100 text-blue-700',
    'Quality Checked':  'bg-purple-100 text-purple-700',
    Approved:           'bg-yellow-100 text-yellow-700',
    'Payment Initiated':'bg-orange-100 text-orange-700',
    Paid:               'bg-green-100 text-green-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

export default function QueueView() {
  const user     = useStore((s) => s.user);
  const logout   = useStore((s) => s.logout);
  const navigate = useNavigate();

  const [bookings,     setBookings]     = useState([]);
  const [search,       setSearch]       = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [formLoading,  setFormLoading]  = useState(false);
  const [form, setForm] = useState({
    cropType: '', date: '', startTime: '09:00', endTime: '17:00', mspRate: '', totalSlots: '50',
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    // Real-time Firestore listener — replaces Socket.io
    const q = query(
      collection(db, 'bookings'),
      where('centerId', '==', user.centerId),
      where('date', '==', today)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.slotTime.localeCompare(b.slotTime));
      setBookings(data);
    });
    return () => unsub();
  }, [user.centerId]);

  const handleStatusUpdate = async (id, nextStatus) => {
    try {
      await updateBookingStatus(id, nextStatus, user.name);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await createSchedule(user, form);
      setShowForm(false);
      setForm({ cropType: '', date: '', startTime: '09:00', endTime: '17:00', mspRate: '', totalSlots: '50' });
      alert('Schedule created!');
    } catch (err) {
      alert('Failed to create schedule');
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = bookings.filter((b) =>
    b.tokenNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.farmerName?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: bookings.length,
    paid:  bookings.filter((b) => b.status === 'Paid').length,
    active: bookings.filter((b) => b.status !== 'Paid').length,
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-blue-400">FarmConnect</h1>
          <p className="text-slate-400 text-xs mt-1">Officer Portal</p>
        </div>
        <div className="p-4 flex-1 space-y-3">
          <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Officer</p>
            <p className="font-semibold mt-1">{user.name}</p>
            <p className="text-xs text-slate-400 mt-1">{user.centerName}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Today</span>
              <span className="font-bold">{stats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Active</span>
              <span className="font-bold text-yellow-400">{stats.active}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Paid</span>
              <span className="font-bold text-green-400">{stats.paid}</span>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Plus size={16} /> New Schedule
          </button>
        </div>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            Today's Queue
            <span className="ml-2 text-sm font-normal text-slate-400">({new Date().toLocaleDateString('en-IN')})</span>
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text" placeholder="Search token or farmer..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg w-64 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Token</th>
                  <th className="px-6 py-3">Farmer</th>
                  <th className="px-6 py-3">Produce</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400">
                      No farmers in queue for today.
                    </td>
                  </tr>
                ) : filtered.map((b) => {
                  const curIdx   = STAGES.indexOf(b.status);
                  const nextStage = curIdx < STAGES.length - 1 ? STAGES[curIdx + 1] : null;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium">{b.slotTime}</td>
                      <td className="px-6 py-4 font-black text-blue-600 tracking-wider">{b.tokenNumber}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{b.farmerName}</p>
                        <p className="text-slate-400 text-xs">{b.farmerId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p>{b.cropType}</p>
                        <p className="font-medium">{b.quantityKg} kg</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {nextStage ? (
                          <button
                            onClick={() => handleStatusUpdate(b.id, nextStage)}
                            className="bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            → {nextStage}
                          </button>
                        ) : (
                          <span className="text-green-600 font-semibold text-xs">✓ Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Schedule Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">New Procurement Schedule</h3>
              <X className="cursor-pointer text-slate-400 hover:text-slate-700" onClick={() => setShowForm(false)} />
            </div>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              {[
                { label: 'Crop Type', key: 'cropType', type: 'text', placeholder: 'e.g. Wheat' },
                { label: 'Date', key: 'date', type: 'date' },
                { label: 'Start Time', key: 'startTime', type: 'time' },
                { label: 'End Time', key: 'endTime', type: 'time' },
                { label: 'MSP Rate (₹/Qtl)', key: 'mspRate', type: 'number', placeholder: 'e.g. 2275' },
                { label: 'Total Slots', key: 'totalSlots', type: 'number', placeholder: 'e.g. 100' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                  <input
                    type={type} value={form[key]} placeholder={placeholder}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
              ))}
              <button
                type="submit" disabled={formLoading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 disabled:bg-blue-300"
              >
                {formLoading ? 'Creating...' : 'Create Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
