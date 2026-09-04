const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyOfficer } = require('../middleware/auth');

// Get all upcoming schedules
router.get('/', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT s.*, c.name as center_name, c.address, c.district, c.lat, c.lng 
            FROM schedules s
            JOIN procurement_centers c ON s.center_id = c.id
            WHERE s.date >= CURRENT_DATE
            ORDER BY s.date ASC, s.start_time ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Officer: Create a new schedule
router.post('/', verifyOfficer, async (req, res) => {
    const { crop_type, date, start_time, end_time, msp_rate, total_slots } = req.body;
    const center_id = req.user.center_id;

    try {
        const result = await db.query(
            'INSERT INTO schedules (center_id, crop_type, date, start_time, end_time, msp_rate, total_slots) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [center_id, crop_type, date, start_time, end_time, msp_rate, total_slots]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
