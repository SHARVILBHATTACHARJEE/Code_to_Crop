import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useStore } from '../store';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/officer/login', { mobile, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center">
        <ShieldCheck size={64} className="text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Officer Portal</h1>
        <p className="text-slate-500 mb-8">Manage procurement queues in real-time</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5 text-left">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
            <input 
              type="tel" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 9988776655"
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password (Mock: admin123)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-blue-700 transition">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
