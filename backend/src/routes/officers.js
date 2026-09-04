const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyOfficer } = require('../middleware/auth');

// Get officer profile
router.get('/me', verifyOfficer, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT o.id, o.name, o.mobile, o.role, c.name as center_name FROM officers o JOIN procurement_centers c ON o.center_id = c.id WHERE o.id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
