const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all centers
router.get('/', verifyToken, async (req, res) => {
    try {
        const { district } = req.query;
        let query = 'SELECT * FROM procurement_centers';
        let params = [];
        
        if (district) {
            query += ' WHERE district = $1';
            params.push(district);
        }
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
