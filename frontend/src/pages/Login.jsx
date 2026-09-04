import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useStore } from '../store';
import { Wheat } from 'lucide-react';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (mobile.length !== 10) return alert('Enter valid 10-digit mobile number');
    try {
      await api.post('/auth/send-otp', { mobile });
      setStep(2);
    } catch (err) {
      alert('Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/verify-otp', { mobile, otp, name: 'Demo Farmer' });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      alert('Invalid OTP');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <Wheat size={64} className="text-green-600 mb-4" />
      <h1 className="text-3xl font-bold text-gray-800 mb-8">FarmConnect</h1>
      
      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-700">Mobile Number</label>
          <input 
            type="tel" 
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="e.g. 9876543210"
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            required
          />
          <button type="submit" className="bg-green-600 text-white font-bold py-3 rounded-lg mt-2">
            Get OTP
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-700">Enter OTP (Mock: 1234)</label>
          <input 
            type="text" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="1234"
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-center tracking-widest text-lg"
            required
          />
          <button type="submit" className="bg-green-600 text-white font-bold py-3 rounded-lg mt-2">
            Verify & Login
          </button>
        </form>
      )}
    </div>
  );
}
