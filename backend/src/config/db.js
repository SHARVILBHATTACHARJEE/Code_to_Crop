const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../farmconnect.db');
const schemaPath = path.resolve(__dirname, '../db/schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to SQLite db:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Initialize schema
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
            if (err) {
                console.error('Error executing schema:', err.message);
            } else {
                console.log('Database schema initialized.');
            }
        });
    }
});

// Promisify the query method to match pg's API for our routes
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        // Convert $1, $2 to ? for SQLite
        let sqliteSql = sql.replace(/\$\d+/g, '?');
        
        // For INSERT/UPDATE with RETURNING (SQLite supports RETURNING in newer versions)
        if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sqliteSql, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
            });
        } else {
            db.all(sqliteSql, params, function(err, rows) {
                if (err) reject(err);
                else {
                    // if RETURNING is used, rows will contain the returned data
                    if (rows && rows.length > 0) {
                         resolve({ rows });
                    } else {
                         resolve({ rows: [], lastID: this.lastID, changes: this.changes });
                    }
                }
            });
        }
    });
};

module.exports = { query };
