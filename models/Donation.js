
const db = require("../database/db");

// Criar tabela
async function createTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS donations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            donor_name VARCHAR(100) NOT NULL,
            donor_message TEXT DEFAULT '',
            amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            payment_id VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await db.query(query);
}

// Criar doação
async function createDonation(userId, donorName, donorMessage, amount) {
    const result = await db.query(
        `INSERT INTO donations
            (user_id, donor_name, donor_message, amount)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, donorName, donorMessage || "", amount]
    );

    return result.rows[0];
}

// Buscar doações de um usuário
async function getDonations(userId) {
    const result = await db.query(
        `SELECT *
         FROM donations
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );

    return result.rows;
}

// Buscar doação pelo ID
async function findById(id) {
    const result = await db.query(
        `SELECT *
         FROM donations
         WHERE id = $1
         LIMIT 1`,
        [id]
    );

    return result.rows[0] || null;
}

// Buscar doação pelo ID do pagamento
async function findByPaymentId(paymentId) {
    const result = await db.query(
        `SELECT *
         FROM donations
         WHERE payment_id = $1
         LIMIT 1`,
        [String(paymentId)]
    );

    return result.rows[0] || null;
}

// Atualizar status da doação
async function updateStatus(id, status, paymentId) {
    const result = await db.query(
        `UPDATE donations
         SET status = $1,
             payment_id = COALESCE($2, payment_id)
         WHERE id = $3
         RETURNING *`,
        [
            status,
            paymentId == null ? null : String(paymentId),
            id
        ]
    );

    return result.rows[0] || null;
}

module.exports = {
    createTable,
    createDonation,
    getDonations,
    findById,
    findByPaymentId,
    updateStatus
};
