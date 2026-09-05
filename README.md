# 🌾 FarmConnect — Code to Crop

> A digital platform that connects farmers directly to government procurement centers, eliminating queues, middlemen, and uncertainty.

---

## 📖 What Is This?

FarmConnect is a two-sided web application built for **Smart India Hackathon (SIH)**. It digitizes the MSP (Minimum Support Price) crop procurement process — the system through which the Indian government buys crops directly from farmers at a fixed price.

**The problem it solves:**
Farmers used to travel to procurement centers without knowing if slots were available, wait in long physical queues for hours, and had no visibility into where their produce was in the payment pipeline.

**FarmConnect fixes this** by letting farmers book time slots in advance and track their payment status in real time — all from their phone.

---

## 👥 Two Types of Users

| Role | App | What they do |
|------|-----|--------------|
| 🧑‍🌾 **Farmer** | `frontend/` | Browse procurement schedules, book a slot, get a token, track payment |
| 👮 **Officer** | `dashboard/` | Create procurement schedules, manage the queue, advance farmer statuses toward payment |

---

## 🏗️ Project Structure

```
farmconnect/
├── frontend/        ← Farmer-facing mobile web app (React + Vite)
├── dashboard/       ← Officer portal web app (React + Vite)
├── backend/         ← Node.js/Express API (SQLite, JWT auth)
└── docker-compose.yml
```

Both `frontend` and `dashboard` are independent React apps that talk directly to **Firebase Firestore** as their database. The `backend` is a supporting Node.js service.

---

## 🔄 How the System Works — Step by Step

### Step 1 — Officer Creates a Schedule
An officer logs into the **dashboard** and creates a "Procurement Schedule" by specifying:
- Crop type (e.g. Wheat, Paddy)
- Date and time window (e.g. 5 Sep, 09:00–17:00)
- Total number of slots available
- MSP rate (₹ per quintal)
- Procurement center

This schedule is saved to **Firestore** and becomes **instantly visible** to all farmers without any page refresh.

---

### Step 2 — Farmer Logs In
The farmer opens the **frontend** on their phone. Login uses a **mobile number + OTP** (demo OTP is always `1234`).

- If it's their first time, a farmer profile is automatically created in Firestore.
- If they've logged in before, their profile is retrieved.

---

### Step 3 — Farmer Books a Slot
On the Home screen, the farmer sees all **upcoming procurement schedules** in real time. They tap a schedule and:
1. Enter their estimated crop quantity (in kg)
2. Pick a preferred time slot (e.g. 10:00 AM)
3. Tap **Confirm Booking**

The system:
- Generates a unique **token number** (e.g. `FC-A3KZ7R`)
- Saves the booking to Firestore
- Increments the booked slots count on the schedule
- Navigates the farmer to their **Token Screen**

---

### Step 4 — Farmer Gets a Token
The Token Screen shows:
- A large **token number** + scannable **QR code**
- Booking details (date, time, center, crop, MSP rate)
- A **Live Status Tracker** — a 6-stage pipeline that updates automatically

The farmer shows this token at the procurement center.

---

### Step 5 — Officer Processes the Queue
The officer's dashboard shows **all bookings** for their center in a table. For each farmer, the officer can click a button to advance their status through the pipeline:

```
Queued → Weighed → Quality Checked → Approved → Payment Initiated → Paid
```

Every status update is saved to Firestore instantly.

---

### Step 6 — Farmer Sees Real-Time Updates
The farmer's Token Screen uses a **Firestore real-time listener** — whenever the officer advances the status, the farmer's phone updates **automatically** (no refresh needed). When the status reaches **Paid**, the estimated payment amount is displayed.

---

## 🗄️ Database Structure (Firestore Collections)

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `farmers` | Farmer profiles | `mobile`, `name`, `district` |
| `officers` | Officer profiles | `mobile`, `name`, `centerId`, `centerName` |
| `procurementCenters` | Center master data | `name`, `address`, `district`, `lat`, `lng` |
| `schedules` | Procurement schedules created by officers | `cropType`, `date`, `centerId`, `mspRate`, `totalSlots`, `bookedSlots` |
| `bookings` | Farmer slot bookings | `farmerId`, `centerId`, `tokenNumber`, `slotTime`, `status`, `quantityKg` |
| `statusHistory` | Audit log of every status change | `bookingId`, `status`, `updatedBy`, `updatedAt` |

---

## 🔐 Authentication

| App | Method | Demo Credentials |
|-----|--------|-----------------|
| Farmer App (`frontend`) | Mobile OTP | Any mobile number + OTP `1234` |
| Officer Dashboard (`dashboard`) | Mobile + Password | Any mobile number + password `admin123` |

> ⚠️ These are demo credentials for hackathon purposes. In production, Firebase Phone Auth would replace the mock OTP system.

---

## ⚡ Real-Time Architecture

FarmConnect uses **Firebase Firestore real-time listeners** (`onSnapshot`) throughout — replacing the need for WebSockets or polling:

| Where | What updates in real time |
|-------|--------------------------|
| Farmer → Home Screen | New procurement schedules added by officers |
| Farmer → Token Screen | Status changes as officer processes the queue |
| Officer → Dashboard | New bookings as farmers book slots |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Farmer App UI | React 18 + Vite + TailwindCSS |
| Officer Dashboard UI | React 18 + Vite + TailwindCSS |
| Database & Real-time | Firebase Firestore |
| State Management | Zustand |
| Routing | React Router v6 |
| Icons | Lucide React |
| QR Code | qrcode.react |
| Backend API | Node.js + Express + SQLite |
| Auth (demo) | Mock OTP (Firestore-based) |

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- npm

### 1. Start the Farmer App
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 2. Start the Officer Dashboard
```bash
cd dashboard
npm install
npm run dev
# Opens at http://localhost:5174
```

### 3. Start the Backend (optional)
```bash
cd backend
npm install
npm run dev
# Runs at http://localhost:5000
```

> **Firebase is already configured** — no setup needed. The app connects to the live Firestore project (`code-crop-6ce23`) automatically.

---

## 🌱 Demo Data (Auto-Seeded)

When the **Farmer App** is opened for the first time, it automatically seeds Firestore with:
- **2 procurement centers** (Karnal, Kurukshetra)
- **4 upcoming schedules** (Wheat, Paddy, Soybean, Cotton)
- **4 demo bookings** with different statuses to demonstrate the pipeline

This means the officer dashboard shows data immediately without needing real farmer activity.

---

## 📱 App Flow Diagram

```
OFFICER DASHBOARD                    FARMER APP
─────────────────                    ──────────
1. Login (mobile + admin123)         1. Login (mobile + OTP 1234)
        │                                    │
2. Create Schedule ──────────────→  2. See Schedule (real-time)
        │                                    │
        │                           3. Book Slot → Get Token
        │                                    │
3. See Booking in Queue ←───────────── Token saved to Firestore
        │
4. Advance Status ──────────────→  4. Token Screen auto-updates
   (Queued → ... → Paid)              (real-time listener)
```

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/pages/Home.jsx` | Farmer home — schedule list + active tokens |
| `frontend/src/pages/BookSlot.jsx` | Slot booking form |
| `frontend/src/pages/MyToken.jsx` | Token + live status tracker |
| `frontend/src/api/firestore.js` | All Firestore read/write helpers (farmer side) |
| `frontend/src/api/seed.js` | Demo data seeder (runs once on first load) |
| `dashboard/src/pages/Login.jsx` | Officer login |
| `dashboard/src/pages/QueueView.jsx` | Officer queue management table |
| `dashboard/src/api/firestore.js` | Firestore helpers (officer side) |
| `dashboard/src/store/index.js` | Zustand auth store (persisted to localStorage) |

---

## 🏆 Built For

**Smart India Hackathon (SIH)** — Problem statement related to digitizing MSP crop procurement to reduce farmer distress, improve transparency, and ensure timely Direct Benefit Transfer (DBT) payments.
