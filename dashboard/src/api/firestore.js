// Same firestore helpers as frontend, but for officer actions
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, query, where, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

export const officerLogin = async (mobile, password) => {
  if (password !== "admin123") throw new Error("Invalid credentials");

  const ref  = doc(db, "officers", mobile);
  const snap = await getDoc(ref);

  let officer;
  if (snap.exists()) {
    officer = snap.data();
  } else {
    officer = {
      id: mobile, mobile,
      name: "Demo Officer",
      role: "Officer",
      centerId: "center_karnal",
      centerName: "Mandi Samiti, Karnal",
    };
    await setDoc(ref, officer);
  }

  // Generate a simple demo token (not a real JWT — Firestore is the auth source)
  const token = btoa(`${mobile}:${Date.now()}`);
  return { user: officer, token };
};

export const updateBookingStatus = async (bookingId, status, officerName) => {
  await updateDoc(doc(db, "bookings", bookingId), { status });
  await addDoc(collection(db, "statusHistory"), {
    bookingId, status, updatedBy: officerName,
    updatedAt: serverTimestamp(),
  });
};

export const createSchedule = async (officerData, formData) => {
  await addDoc(collection(db, "schedules"), {
    centerId:    officerData.centerId,
    centerName:  officerData.centerName,
    district:    officerData.district || "Karnal",
    cropType:    formData.cropType,
    date:        formData.date,
    startTime:   formData.startTime,
    endTime:     formData.endTime,
    mspRate:     parseFloat(formData.mspRate),
    totalSlots:  parseInt(formData.totalSlots),
    bookedSlots: 0,
    createdAt:   serverTimestamp(),
  });
};
