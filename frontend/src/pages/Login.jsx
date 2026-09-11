import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtpAndLogin } from '../api/firestore';
import { useStore } from '../store';
import { FIcon, PrimaryBtn, TextInput } from '../components/farm';

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
    <div className="flex flex-col items-center justify-center min-h-screen p-6"
         style={{ background: '#F6F1E8' }}>
      <div className="mx-auto h-14 w-14 rounded-md flex items-center justify-center text-white text-3xl"
           style={{ background: '#B4431F', boxShadow: '0 8px 24px rgba(180,67,31,.3)' }}>
        <FIcon name="wheat" />
      </div>

      <div className="flex items-center gap-2 mt-5">
        <h1 className="font-display text-3xl font-semibold text-stone-900 tracking-tight">FarmConnect</h1>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E9EDDB] text-[#44532F] border border-[#CFD8B8]">FARMER</span>
      </div>
      <p className="text-stone-500 text-sm mt-1">Smarter Procurement. Faster Payments.</p>

      <div className="w-full bg-white rounded-md border border-stone-200/80 p-5 mt-8"
           style={{ boxShadow: '0 4px 20px -2px rgba(60,45,25,0.08)' }}>
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">Your Name</label>
              <TextInput type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">Mobile Number</label>
              <TextInput type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit number" maxLength={10} className="tracking-widest text-base" required />
            </div>
            <PrimaryBtn type="submit" disabled={loading} className="w-full py-3">
              {loading ? 'Sending...' : 'Get OTP'}
            </PrimaryBtn>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-4">
            <p className="text-center text-stone-600 text-sm">
              OTP sent to <strong>+91 {mobile}</strong>
            </p>
            <div className="bg-[#F7ECD4] border border-[#E5CF9F] rounded-md p-2.5 text-center text-xs text-[#8A5A12] font-medium">
              Demo OTP: <strong>1234</strong>
            </div>
            <TextInput type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" maxLength={6} className="text-center tracking-[0.5em] text-2xl font-bold py-4" required />
            <PrimaryBtn type="submit" disabled={loading} className="w-full py-3">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </PrimaryBtn>
            <button type="button" onClick={() => setStep(1)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors">
              <FIcon name="arrowL" className="text-sm" /> Change number
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-[11px] text-stone-400">FarmConnect Farmer App — Secured access</p>
    </div>
  );
}