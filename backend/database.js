const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { format, parseISO, differenceInDays, isAfter, addDays } = require('date-fns');

// Configuração do banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Criação da tabela se não existir
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client TEXT NOT NULL,
            date TEXT NOT NULL,
            product TEXT NOT NULL,
            commission REAL NOT NULL,
            forecast TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Funções do banco de dados
function getAllEntries(callback) {
    db.all("SELECT * FROM entries ORDER BY date DESC", callback);
}

function getEntriesByMonth(month, callback) {
    db.all(`
        SELECT * FROM entries 
        WHERE strftime('%m', date) = ? 
        ORDER BY date DESC
    `, [month.toString().padStart(2, '0')], callback);
}

function getEntryById(id, callback) {
    db.get("SELECT * FROM entries WHERE id = ?", [id], callback);
}

function createEntry(entry, callback) {
    const { client, date, product, commission, forecast, status } = entry;
    db.run(
        "INSERT INTO entries (client, date, product, commission, forecast, status) VALUES (?, ?, ?, ?, ?, ?)",
        [client, date, product, commission, forecast, status],
        function(err) {
            callback(err, this.lastID);
        }
    );
}

function createBatchEntries(entries, callback) {
    const placeholders = entries.map(() => "(?, ?, ?, ?, ?, ?)").join(",");
    const values = entries.flatMap(entry => [
        entry.client,
        entry.date,
        entry.product,
        entry.commission,
        entry.forecast,
        entry.status
    ]);
    
    db.run(
        `INSERT INTO entries (client, date, product, commission, forecast, status) VALUES ${placeholders}`,
        values,
        function(err) {
            callback(err, this.changes);
        }
    );
}

function updateEntry(id, entry, callback) {
    const { client, date, product, commission, forecast, status } = entry;
    db.run(
        "UPDATE entries SET client = ?, date = ?, product = ?, commission = ?, forecast = ?, status = ? WHERE id = ?",
        [client, date, product, commission, forecast, status, id],
        callback
    );
}

function deleteEntry(id, callback) {
    db.run("DELETE FROM entries WHERE id = ?", [id], callback);
}

function getUpcomingNotifications(callback) {
    const today = new Date();
    const warningDate = addDays(today, 15); // 15 dias no futuro
    
    db.all(`
        SELECT id, client, forecast 
        FROM entries 
        WHERE status = 'pendente' 
        AND forecast BETWEEN date('now') AND date(?, '+15 days')
        ORDER BY forecast ASC
    `, [warningDate.toISOString()], (err, rows) => {
        if (err) return callback(err);
        
        const notifications = rows.map(row => {
            const forecastDate = parseISO(row.forecast);
            const daysLeft = differenceInDays(forecastDate, today);
            
            return {
                id: row.id,
                client: row.client,
                forecast: row.forecast,
                daysLeft: daysLeft,
                type: daysLeft <= 0 ? 'danger' : 'warning'
            };
        });
        
        callback(null, notifications);
    });
}

module.exports = {
    getAllEntries,
    getEntriesByMonth,
    getEntryById,
    createEntry,
    createBatchEntries,
    updateEntry,
    deleteEntry,
    getUpcomingNotifications
};