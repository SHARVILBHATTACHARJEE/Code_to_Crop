import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtpAndLogin } from '../api/firestore';
import { useStore } from '../store';
import { Wheat } from 'lucide-react';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [name, setName]     = useState('');
  const [otp, setOtp]       = useState('');
  const [step, setStep]     = useState(1); // 1=mobile, 2=otp
  const [loading, setLoading] = useState(false);
  const login    = useStore((s) => s.login);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (mobile.length !== 10) return alert('Enter a valid 10-digit mobile number');
    setLoading(true);
    await sendOtp(mobile);
    setLoading(false);
    setStep(2);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await verifyOtpAndLogin(mobile, otp, name || 'Demo Farmer');
      login(user);
      navigate('/');
    } catch (err) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-green-50 to-white">
      <Wheat size={64} className="text-green-600 mb-4" />
      <h1 className="text-3xl font-black text-gray-800 mb-1">FarmConnect</h1>
      <p className="text-gray-500 text-sm mb-10">Smarter Procurement. Faster Payments.</p>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit number"
              maxLength={10}
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none tracking-widest text-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white font-bold py-3 rounded-xl mt-2 disabled:bg-green-300"
          >
            {loading ? 'Sending...' : 'Get OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-4">
          <p className="text-center text-gray-600 text-sm">
            OTP sent to <strong>+91 {mobile}</strong>
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center text-sm text-yellow-800 font-medium">
            🔐 Demo OTP: <strong>1234</strong>
          </div>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            maxLength={6}
            className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-center tracking-[0.5em] text-2xl font-bold"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white font-bold py-3 rounded-xl disabled:bg-green-300"
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 text-center">
            ← Change number
          </button>
        </form>
      )}
    </div>
  );
}
