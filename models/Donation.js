const db = require("../database/database");

async function createTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS donations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            donor_name VARCHAR(100) NOT NULL,
            donor_message TEXT,
            amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            payment_id VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await db.query(query);
}

async function createDonation(userId, donorName, donorMessage, amount) {
    const result = await db.query(
        `INSERT INTO donations
        (user_id, donor_name, donor_message, amount)
        VALUES ($1,$2,$3,$4)
        RETURNING *`,
        [userId, donorName, donorMessage, amount]
    );

    return result.rows[0];
}

async function getDonations(userId) {
    const result = await db.query(
        `SELECT *
         FROM donations
         WHERE user_id=$1
         ORDER BY created_at DESC`,
        [userId]
    );

    return result.rows;
}

async function updateStatus(id, status, paymentId) {
    const result = await db.query(
        `UPDATE donations
         SET status=$1,
             payment_id=$2
         WHERE id=$3
         RETURNING *`,
        [status, paymentId, id]
    );

    return result.rows[0];
}

module.exports = {
    createTable,
    createDonation,
    getDonations,
    updateStatus
};