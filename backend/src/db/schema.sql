CREATE TABLE IF NOT EXISTS farmers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    aadhaar_last4 VARCHAR(4),
    district VARCHAR(100),
    pincode VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS procurement_centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    district VARCHAR(100),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    capacity_per_day INT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    center_id INT REFERENCES procurement_centers(id),
    crop_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    msp_rate DECIMAL(10, 2),
    total_slots INT NOT NULL,
    booked_slots INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INT REFERENCES farmers(id),
    schedule_id INT REFERENCES schedules(id),
    token_number VARCHAR(50) UNIQUE NOT NULL,
    slot_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'Queued',
    quantity_kg DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INT REFERENCES bookings(id),
    status VARCHAR(50) NOT NULL,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS officers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    center_id INT REFERENCES procurement_centers(id),
    role VARCHAR(50) DEFAULT 'Officer'
);

INSERT OR IGNORE INTO procurement_centers (id, name, address, district, lat, lng, capacity_per_day) VALUES
(1, 'Mandi Samiti, Karnal', 'GT Road, Karnal', 'Karnal', 29.6857, 76.9905, 500),
(2, 'Agricultural Produce Market, Kurukshetra', 'Pipli Road', 'Kurukshetra', 29.9695, 76.8783, 300);

INSERT OR IGNORE INTO schedules (id, center_id, crop_type, date, start_time, end_time, msp_rate, total_slots) VALUES
(1, 1, 'Wheat', date('now', '+1 day'), '09:00:00', '17:00:00', 2125.00, 100),
(2, 2, 'Paddy', date('now', '+2 days'), '08:00:00', '16:00:00', 2040.00, 150);
