const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyOfficer } = require('../middleware/auth');
const { getIo } = require('../socket');

// Generate unique token
const generateToken = () => {
    return 'FC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Farmer: Book a slot
router.post('/', verifyToken, async (req, res) => {
    const { schedule_id, quantity_kg, slot_time } = req.body;
    const farmer_id = req.user.id;

    try {
        await db.query('BEGIN');

        // Check slots available
        const scheduleRes = await db.query('SELECT total_slots, booked_slots, center_id FROM schedules WHERE id = $1 FOR UPDATE', [schedule_id]);
        if (scheduleRes.rows.length === 0) throw new Error('Schedule not found');
        
        const schedule = scheduleRes.rows[0];
        if (schedule.booked_slots >= schedule.total_slots) {
            throw new Error('No slots available');
        }

        const token_number = generateToken();

        // Create booking
        const bookingRes = await db.query(
            'INSERT INTO bookings (farmer_id, schedule_id, token_number, slot_time, quantity_kg, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [farmer_id, schedule_id, token_number, slot_time, quantity_kg, 'Queued']
        );
        const booking = bookingRes.rows[0];

        // Update schedule
        await db.query('UPDATE schedules SET booked_slots = booked_slots + 1 WHERE id = $1', [schedule_id]);

        // Add history
        await db.query('INSERT INTO status_history (booking_id, status) VALUES ($1, $2)', [booking.id, 'Queued']);

        await db.query('COMMIT');

        // Emit event to center queue
        getIo().to(`center_${schedule.center_id}`).emit('new_booking', booking);

        res.status(201).json(booking);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ error: err.message || 'Server error' });
    }
});

// Get My Bookings (Farmer)
router.get('/my', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT b.*, s.date, s.crop_type, c.name as center_name, c.lat, c.lng
            FROM bookings b
            JOIN schedules s ON b.schedule_id = s.id
            JOIN procurement_centers c ON s.center_id = c.id
            WHERE b.farmer_id = $1
            ORDER BY b.created_at DESC
        `;
        const result = await db.query(query, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Bookings by Center (Officer)
router.get('/center', verifyOfficer, async (req, res) => {
    const center_id = req.user.center_id;
    try {
        const query = `
            SELECT b.*, f.name as farmer_name, f.mobile, s.date, s.crop_type
            FROM bookings b
            JOIN schedules s ON b.schedule_id = s.id
            JOIN farmers f ON b.farmer_id = f.id
            WHERE s.center_id = $1 AND s.date = CURRENT_DATE
            ORDER BY b.slot_time ASC
        `;
        const result = await db.query(query, [center_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Officer updates status
router.patch('/:id/status', verifyOfficer, async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const officer_id = req.user.id;

    const validStatuses = ['Queued', 'Weighed', 'Quality Checked', 'Approved', 'Payment Initiated', 'Paid'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await db.query('BEGIN');

        // Update booking
        const updateRes = await db.query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (updateRes.rows.length === 0) throw new Error('Booking not found');
        const booking = updateRes.rows[0];

        // Insert history
        await db.query(
            'INSERT INTO status_history (booking_id, status, updated_by, notes) VALUES ($1, $2, $3, $4)',
            [id, status, officer_id, notes || null]
        );

        await db.query('COMMIT');

        // Emit real-time status update to farmer
        getIo().to(`booking_${id}`).emit('status_updated', { booking_id: id, status, notes });
        
        // Let officer queue know it changed
        const scheduleRes = await db.query('SELECT center_id FROM schedules WHERE id = $1', [booking.schedule_id]);
        getIo().to(`center_${scheduleRes.rows[0].center_id}`).emit('booking_changed', booking);

        res.json(booking);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

// Get booking status history
router.get('/:id/history', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM status_history WHERE booking_id = $1 ORDER BY updated_at ASC', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
