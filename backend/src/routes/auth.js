const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Mock sending OTP
router.post('/send-otp', async (req, res) => {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });
    
    // In MVP, we just mock the OTP as '1234' and don't actually send SMS
    res.json({ message: 'OTP sent successfully', mockOtp: '1234' });
});

// Verify OTP & Login/Register Farmer
router.post('/verify-otp', async (req, res) => {
    const { mobile, otp, name, district, pincode } = req.body;
    
    if (otp !== '1234') {
        return res.status(401).json({ error: 'Invalid OTP' });
    }

    try {
        // Check if farmer exists
        let result = await db.query('SELECT * FROM farmers WHERE mobile = $1', [mobile]);
        let farmer;

        if (result.rows.length === 0) {
            // Register new farmer
            if (!name) return res.status(400).json({ error: 'Name is required for new registration' });
            const insertRes = await db.query(
                'INSERT INTO farmers (name, mobile, district, pincode) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, mobile, district || null, pincode || null]
            );
            farmer = insertRes.rows[0];
        } else {
            farmer = result.rows[0];
        }

        // Generate JWT
        const token = jwt.sign({ id: farmer.id, role: 'Farmer' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ token, user: farmer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Officer Login Mock
router.post('/officer/login', async (req, res) => {
    const { mobile, password } = req.body;
    // Mock login for hackathon demo
    if (password !== 'admin123') return res.status(401).json({ error: 'Invalid credentials' });
    
    try {
        let result = await db.query('SELECT * FROM officers WHERE mobile = $1', [mobile]);
        let officer;
        if (result.rows.length === 0) {
            // Mock auto-create for demo
            const insertRes = await db.query(
                'INSERT INTO officers (name, mobile, center_id) VALUES ($1, $2, 1) RETURNING *',
                ['Demo Officer', mobile]
            );
            officer = insertRes.rows[0];
        } else {
            officer = result.rows[0];
        }
        
        const token = jwt.sign({ id: officer.id, role: officer.role, center_id: officer.center_id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: officer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
