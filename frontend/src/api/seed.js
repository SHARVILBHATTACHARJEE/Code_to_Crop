// Seed script — Run once to populate Firestore with demo procurement data
// Called automatically from App.jsx on first load if no schedules exist
import { collection, getDocs, doc, setDoc, query, limit } from "firebase/firestore";
import { db } from "../firebase";

const centers = [
  {
    id: "center_karnal",
    name: "Mandi Samiti, Karnal",
    address: "GT Road, Karnal",
    district: "Karnal",
    lat: 29.6857,
    lng: 76.9905,
    capacityPerDay: 500,
  },
  {
    id: "center_kurukshetra",
    name: "Agricultural Produce Market, Kurukshetra",
    address: "Pipli Road, Kurukshetra",
    district: "Kurukshetra",
    lat: 29.9695,
    lng: 76.8783,
    capacityPerDay: 300,
  },
];

const getDateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const schedules = [
  {
    id: "sched_wheat_karnal",
    centerId: "center_karnal",
    centerName: "Mandi Samiti, Karnal",
    district: "Karnal",
    cropType: "Wheat",
    date: getDateOffset(1),
    startTime: "09:00",
    endTime: "17:00",
    mspRate: 2275,
    totalSlots: 100,
    bookedSlots: 12,
  },
  {
    id: "sched_paddy_kurukshetra",
    centerId: "center_kurukshetra",
    centerName: "Agricultural Produce Market, Kurukshetra",
    district: "Kurukshetra",
    cropType: "Paddy",
    date: getDateOffset(2),
    startTime: "08:00",
    endTime: "16:00",
    mspRate: 2183,
    totalSlots: 150,
    bookedSlots: 30,
  },
  {
    id: "sched_soybean_karnal",
    centerId: "center_karnal",
    centerName: "Mandi Samiti, Karnal",
    district: "Karnal",
    cropType: "Soybean",
    date: getDateOffset(3),
    startTime: "08:30",
    endTime: "15:30",
    mspRate: 4600,
    totalSlots: 80,
    bookedSlots: 5,
  },
  {
    id: "sched_cotton_kurukshetra",
    centerId: "center_kurukshetra",
    centerName: "Agricultural Produce Market, Kurukshetra",
    district: "Kurukshetra",
    cropType: "Cotton",
    date: getDateOffset(4),
    startTime: "09:00",
    endTime: "17:00",
    mspRate: 7121,
    totalSlots: 60,
    bookedSlots: 20,
  },
];

export const seedFirestore = async () => {
  try {
    // Check if already seeded
    const q = query(collection(db, "schedules"), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return; // Already seeded

    console.log("Seeding Firestore with demo data...");

    // Seed centers
    for (const center of centers) {
      await setDoc(doc(db, "procurementCenters", center.id), center);
    }

    // Seed schedules
    for (const sched of schedules) {
      await setDoc(doc(db, "schedules", sched.id), sched);
    }

    console.log("✅ Firestore seeded successfully!");
  } catch (err) {
    console.error("Seeding failed:", err);
  }
};
