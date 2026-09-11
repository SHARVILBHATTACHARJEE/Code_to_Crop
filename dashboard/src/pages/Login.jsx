import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { officerLogin } from '../api/firestore';
import { useStore } from '../store';

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
      const { user, token } = await officerLogin(mobile, password);
      login(user, token);
      navigate('/');
    } catch (err) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{ fontFamily: "'Inter', sans-serif", background: '#F6F1E8' }}
    >
      <div className="bg-white p-10 rounded-md w-full max-w-md text-center"
           style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.07)', border: '1px solid rgba(214,207,194,0.9)' }}>

        {/* Brand icon */}
        <div className="mx-auto mb-5 h-14 w-14 rounded-md flex items-center justify-center shadow-lg ring-1 ring-white/20"
             style={{ background: '#B4431F', boxShadow: '0 8px 24px rgba(180,67,31,.3)' }}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3M6 3h12M12 16v5m-4 0h8"
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="font-display text-2xl font-semibold text-stone-900 tracking-tight">FarmConnect</h1>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold
                           bg-[#E9EDDB] text-[#44532F] border border-[#CFD8B8]">HQ</span>
        </div>
        <p className="text-stone-500 text-sm mb-8">Officer Portal · Sign in to manage procurement queues</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
              Mobile Number
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit number"
              className="w-full bg-stone-50 border border-stone-200 p-3 rounded-md text-sm outline-none
                         focus:ring-2 focus:ring-[#B4431F]/25 focus:border-[#B4431F] transition-all
                         placeholder:text-stone-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="bg-[#F7ECD4] border border-[#E5CF9F] rounded-md p-2 text-center text-xs
                            text-[#8A5A12] font-medium mb-2">
              Demo password: <strong>admin123</strong>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
              className="w-full bg-stone-50 border border-stone-200 p-3 rounded-md text-sm outline-none
                         focus:ring-2 focus:ring-[#B4431F]/25 focus:border-[#B4431F] transition-all
                         placeholder:text-stone-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="text-white font-bold py-3 rounded mt-2 transition-all duration-150 shadow-lg
                       disabled:opacity-60 active:scale-[0.98]"
            style={{
              background: loading ? '#D9A88F' : '#B4431F',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(180,67,31,.35)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-[11px] text-stone-400">
          FarmConnect Officer Portal — Secured access
        </p>
      </div>
    </div>
  );
}
