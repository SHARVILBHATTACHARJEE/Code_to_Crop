// Firestore helper functions — replaces the Node.js/Express backend entirely
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp, increment
} from "firebase/firestore";
import { db } from "../firebase";

// ─────────────────────────────────────────────
// AUTH (mock OTP — OTP is always "1234")
// ─────────────────────────────────────────────
export const sendOtp = async (mobile) => {
  // In production replace with Firebase Phone Auth
  return { success: true };
};

export const verifyOtpAndLogin = async (mobile, otp, name) => {
  if (otp !== "1234") throw new Error("Invalid OTP");

  const farmerRef = doc(db, "farmers", mobile); // use mobile as doc ID
  const farmerSnap = await getDoc(farmerRef);

  if (farmerSnap.exists()) {
    return farmerSnap.data();
  } else {
    if (!name) throw new Error("Name required for first login");
    const farmer = {
      id: mobile,
      mobile,
      name,
      district: "",
      pincode: "",
      createdAt: serverTimestamp(),
    };
    await setDoc(farmerRef, farmer);
    return farmer;
  }
};

// ─────────────────────────────────────────────
// SCHEDULES
// ─────────────────────────────────────────────
export const getSchedules = async () => {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "schedules"),
    where("date", ">=", today),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────
const generateToken = () =>
  "FC-" + Math.random().toString(36).substring(2, 8).toUpperCase();

export const bookSlot = async (farmerId, farmerName, scheduleId, quantityKg, slotTime) => {
  // Fetch schedule details
  const schedRef = doc(db, "schedules", scheduleId);
  const schedSnap = await getDoc(schedRef);
  if (!schedSnap.exists()) throw new Error("Schedule not found");

  const sched = schedSnap.data();
  if (sched.bookedSlots >= sched.totalSlots) throw new Error("No slots available");

  const tokenNumber = generateToken();

  const booking = {
    farmerId,
    farmerName,
    scheduleId,
    tokenNumber,
    slotTime,
    quantityKg: parseFloat(quantityKg),
    status: "Queued",
    cropType: sched.cropType,
    centerName: sched.centerName,
    centerId: sched.centerId,
    date: sched.date,
    mspRate: sched.mspRate,
    createdAt: serverTimestamp(),
  };

  const bookingRef = await addDoc(collection(db, "bookings"), booking);

  // Increment booked slots on schedule
  await updateDoc(schedRef, { bookedSlots: increment(1) });

  // Add status history
  await addDoc(collection(db, "statusHistory"), {
    bookingId: bookingRef.id,
    status: "Queued",
    updatedAt: serverTimestamp(),
  });

  return { id: bookingRef.id, ...booking };
};

export const getMyBookings = async (farmerId) => {
  const q = query(
    collection(db, "bookings"),
    where("farmerId", "==", farmerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBookingById = async (bookingId) => {
  const snap = await getDoc(doc(db, "bookings", bookingId));
  if (!snap.exists()) throw new Error("Booking not found");
  return { id: snap.id, ...snap.data() };
};

// ─────────────────────────────────────────────
// OFFICER — update status
// ─────────────────────────────────────────────
export const updateBookingStatus = async (bookingId, status, officerName) => {
  await updateDoc(doc(db, "bookings", bookingId), { status });
  await addDoc(collection(db, "statusHistory"), {
    bookingId,
    status,
    updatedBy: officerName,
    updatedAt: serverTimestamp(),
  });
};

export const getCenterBookings = async (centerId) => {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "bookings"),
    where("centerId", "==", centerId),
    where("date", "==", today),
    orderBy("slotTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─────────────────────────────────────────────
// OFFICER AUTH (mock — password is "admin123")
// ─────────────────────────────────────────────
export const officerLogin = async (mobile, password) => {
  if (password !== "admin123") throw new Error("Invalid credentials");

  const officerRef = doc(db, "officers", mobile);
  const snap = await getDoc(officerRef);

  if (snap.exists()) {
    return snap.data();
  } else {
    // Auto-create officer for demo
    const officer = {
      id: mobile,
      mobile,
      name: "Demo Officer",
      role: "Officer",
      centerId: "center_karnal", // default center
      centerName: "Mandi Samiti, Karnal",
    };
    await setDoc(officerRef, officer);
    return officer;
  }
};
