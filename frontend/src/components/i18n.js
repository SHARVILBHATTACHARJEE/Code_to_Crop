import { useStore } from '../store';

export const STR = {
  brand:             { en: 'FarmConnect', hi: 'फार्मकनेक्ट' },
  farmerApp:         { en: 'Farmer App', hi: 'किसान ऐप' },
  tagline:           { en: 'Smarter Procurement. Faster Payments.', hi: 'स्मार्ट खरीद। तेज़ भुगतान।' },
  farmerChip:        { en: 'FARMER', hi: 'किसान' },
  footer:            { en: 'FarmConnect Farmer App — Secured access', hi: 'फार्मकनेक्ट किसान ऐप — सुरक्षित एक्सेस' },
  yourName:          { en: 'Your Name', hi: 'आपका नाम' },
  namePh:            { en: 'e.g. Ramesh Kumar', hi: 'उदा. रमेश कुमार' },
  mobileNumber:      { en: 'Mobile Number', hi: 'मोबाइल नंबर' },
  mobilePh:          { en: '10-digit number', hi: '10 अंकों का नंबर' },
  getOtp:            { en: 'Get OTP', hi: 'ओटीपी पाएं' },
  sending:           { en: 'Sending...', hi: 'भेजा जा रहा है...' },
  otpSentTo:         { en: 'OTP sent to', hi: 'ओटीपी भेजा गया' },
  demoOtp:           { en: 'Demo OTP:', hi: 'डेमो ओटीपी:' },
  enterOtp:          { en: 'Enter OTP', hi: 'ओटीपी दर्ज करें' },
  verifyLogin:       { en: 'Verify & Login', hi: 'सत्यापित करें और लॉगिन करें' },
  verifying:         { en: 'Verifying...', hi: 'सत्यापन हो रहा है...' },
  changeNumber:      { en: 'Change number', hi: 'नंबर बदलें' },
  welcomeKicker:     { en: 'Namaste', hi: 'नमस्ते' },
  activeTokens:      { en: 'active tokens', hi: 'सक्रिय टोकन' },
  upcomingDrives:    { en: 'upcoming drives', hi: 'आगामी खरीद' },
  myActiveTokens:    { en: 'My Active Tokens', hi: 'मेरे सक्रिय टोकन' },
  activeChip:        { en: 'active', hi: 'सक्रिय' },
  upcomingProc:      { en: 'Upcoming Procurement', hi: 'आगामी खरीद' },
  noSchedules:       { en: 'No upcoming schedules found.', hi: 'कोई आगामी शेड्यूल नहीं मिला।' },
  msp:               { en: 'MSP', hi: 'एमएसपी' },
  qtl:               { en: 'Qtl', hi: 'क्विंटल' },
  slotsLeft:         { en: 'slots left', hi: 'स्लॉट बचे' },
  full:              { en: 'Full', hi: 'फुल' },
  bookSlot:          { en: 'Book Slot', hi: 'स्लॉट बुक करें' },
  bookASlot:         { en: 'Book a Slot', hi: 'स्लॉट बुक करें' },
  qtyLabel:          { en: 'Estimated Quantity (kg)', hi: 'अनुमानित मात्रा (किग्रा)' },
  qtyPh:             { en: 'e.g. 500', hi: 'उदा. 500' },
  slotLabel:         { en: 'Preferred Time Slot', hi: 'पसंदीदा समय स्लॉट' },
  infoText:          { en: 'Your token guarantees service within a 1-hour window. Please arrive 15 minutes early with your produce.', hi: 'आपका टोकन 1 घंटे की अवधि में सेवा की गारंटी देता है। कृपया उपज के साथ 15 मिनट पहले पहुंचें।' },
  confirmBooking:    { en: 'Confirm Booking', hi: 'बुकिंग कन्फर्म करें' },
  confirming:        { en: 'Confirming...', hi: 'कन्फर्म हो रहा है...' },
  myToken:           { en: 'My Token', hi: 'मेरा टोकन' },
  liveSub:           { en: 'Live status · updates automatically', hi: 'लाइव स्थिति · स्वतः अपडेट' },
  live:              { en: 'LIVE', hi: 'लाइव' },
  tokenNumber:       { en: 'Token Number', hi: 'टोकन नंबर' },
  slotWord:          { en: 'Slot', hi: 'स्लॉट' },
  trackerTitle:      { en: 'Live Status Tracker', hi: 'लाइव स्थिति ट्रैकर' },
  estimated:         { en: 'Estimated:', hi: 'अनुमानित:' },
  stQueued:          { en: 'Queued', hi: 'कतार में' },
  stWeighed:         { en: 'Weighed', hi: 'तौला गया' },
  stQC:              { en: 'Quality Checked', hi: 'गुणवत्ता जांच पूर्ण' },
  stApproved:        { en: 'Approved', hi: 'स्वीकृत' },
  stPayInit:         { en: 'Payment Initiated', hi: 'भुगतान शुरू' },
  stPaid:            { en: 'Paid', hi: 'भुगतान पूर्ण' },
  dQueued:           { en: 'Your token is in the queue.', hi: 'आपका टोकन कतार में है।' },
  dWeighed:          { en: 'Produce weight recorded.', hi: 'उपज का वज़न दर्ज हो गया।' },
  dQC:               { en: 'Quality inspection done.', hi: 'गुणवत्ता जांच पूरी हो गई।' },
  dApproved:         { en: 'Produce accepted.', hi: 'उपज स्वीकार कर ली गई।' },
  dPayInit:          { en: 'Payment sent to your bank.', hi: 'भुगतान आपके बैंक भेज दिया गया।' },
  dPaid:             { en: 'Amount credited via DBT.', hi: 'डीबीटी द्वारा राशि जमा हो गई।' },
  alertMobile:       { en: 'Enter a valid 10-digit mobile number', hi: 'सही 10 अंकों का मोबाइल नंबर दर्ज करें' },
  alertQty:          { en: 'Enter valid quantity', hi: 'सही मात्रा दर्ज करें' },
  alertBookingFail:  { en: 'Booking failed. Try again.', hi: 'बुकिंग विफल रही। पुनः प्रयास करें।' },
  alertLoginFail:    { en: 'Login failed', hi: 'लॉगिन विफल' },
  back:              { en: 'Back', hi: 'पीछे' },
  kgUnit:            { en: 'kg', hi: 'किग्रा' },
  logoutLabel:       { en: 'Logout', hi: 'लॉगआउट' },
};

export function t(lang, key) {
  const e = STR[key];
  if (!e) return key;
  return e[lang] || e.en;
}

export function useT() {
  const lang = useStore((s) => s.lang);
  return (key) => t(lang, key);
}
const CROP_HI = {
  wheat: 'गेहूं', rice: 'चावल', paddy: 'धान', soybean: 'सोयाबीन', soyabean: 'सोयाबीन',
  maize: 'मक्का', corn: 'मक्का', barley: 'जौ', mustard: 'सरसों', cotton: 'कपास',
  sugarcane: 'गन्ना', gram: 'चना', chickpea: 'चना', lentil: 'मसूर', masoor: 'मसूर',
  groundnut: 'मूंगफली', peanut: 'मूंगफली', sunflower: 'सूरजमुखी', bajra: 'बाजरा',
  'pearl millet': 'बाजरा', jowar: 'ज्वार', sorghum: 'ज्वार', ragi: 'रागी',
  'finger millet': 'रागी', sesamum: 'तिल', sesame: 'तिल', safflower: 'कुसुम',
  linseed: 'अलसी', tur: 'अरहर', urad: 'उड़द', moong: 'मूंग',
};

const MANDI_WORD_HI = {
  mandi: 'मंडी', samiti: 'समिति', kendra: 'केंद्र', center: 'केंद्र', centre: 'केंद्र',
  bazaar: 'बाज़ार', bazar: 'बाज़ार', market: 'बाज़ार', anaj: 'अनाज', grain: 'अनाज',
  upaj: 'उपज', krishi: 'कृषि', vipnan: 'विपणन', sahakari: 'सहकारी',
};

export function cropName(type, lang) {
  if (lang !== 'hi') return type;
  const key = String(type || '').trim().toLowerCase();
  return CROP_HI[key] || type;
}

export function placeName(name, lang) {
  if (lang !== 'hi') return name;
  return String(name || '').split(/(\s+|,|·|-)/).map((w) => MANDI_WORD_HI[w.toLowerCase()] || w).join('');
}

export function formatDate(iso, lang) {
  if (lang !== 'hi') return iso;
  try {
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}