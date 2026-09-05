import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { officerLogin } from '../api/firestore';
import { useStore } from '../store';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
  const [mobile,   setMobile]   = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const login    = useStore((s) => s.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await officerLogin(mobile, password);
      login(user);
      navigate('/');
    } catch (err) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center">
        <ShieldCheck size={64} className="text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Officer Portal</h1>
        <p className="text-slate-500 text-sm mb-8">Manage procurement queues in real-time</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
            <input
              type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit number"
              className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2 text-center text-xs text-yellow-800 font-medium mb-2">
              🔐 Demo password: <strong>admin123</strong>
            </div>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
              className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
