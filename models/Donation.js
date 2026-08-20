const db = require("../database/db");


// ==========================================
// CRIAR TABELA
// ==========================================

async function createTable() {

    const query = `
        CREATE TABLE IF NOT EXISTS donations (
            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            donor_name VARCHAR(100) NOT NULL,

            donor_message TEXT,

            amount DECIMAL(10,2) NOT NULL,

            status VARCHAR(20)
                DEFAULT 'pending',

            payment_id VARCHAR(100),

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await db.query(query);
}


// ==========================================
// CRIAR DOAÇÃO
// ==========================================

async function createDonation(
    userId,
    donorName,
    donorMessage,
    amount
) {

    const result = await db.query(

        `
        INSERT INTO donations
        (
            user_id,
            donor_name,
            donor_message,
            amount
        )

        VALUES
        ($1, $2, $3, $4)

        RETURNING *
        `,

        [
            userId,
            donorName,
            donorMessage,
            amount
        ]

    );

    return result.rows[0];
}


// ==========================================
// BUSCAR DOAÇÕES DO USUÁRIO
// ==========================================

async function getDonations(userId) {

    const result = await db.query(

        `
        SELECT *
        FROM donations

        WHERE user_id = $1

        ORDER BY created_at DESC
        `,

        [userId]

    );

    return result.rows;
}


// ==========================================
// BUSCAR DOAÇÃO PELO PAYMENT ID
// ==========================================

async function findByPaymentId(paymentId) {

    const result = await db.query(

        `
        SELECT *
        FROM donations

        WHERE payment_id = $1

        LIMIT 1
        `,

        [String(paymentId)]

    );

    return result.rows[0];
}


// ==========================================
// ATUALIZAR STATUS
// ==========================================

async function updateStatus(
    id,
    status,
    paymentId
) {

    const result = await db.query(

        `
        UPDATE donations

        SET
            status = $1,
            payment_id = COALESCE($2, payment_id)

        WHERE id = $3

        RETURNING *
        `,

        [
            status,
            paymentId
                ? String(paymentId)
                : null,
            id
        ]

    );

    return result.rows[0];
}


// ==========================================
// EXPORTS
// ==========================================

module.exports = {

    createTable,

    createDonation,

    getDonations,

    findByPaymentId,

    updateStatus

};
