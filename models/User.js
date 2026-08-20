const db = require("../database/database");

async function createTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await db.query(query);
}

async function createUser(name, email, password) {
    const query = `
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at;
    `;

    const values = [name, email, password];

    const result = await db.query(query, values);

    return result.rows[0];
}

async function findByEmail(email) {
    const result = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    return result.rows[0];
}

async function findById(id) {
    const result = await db.query(
        "SELECT id, name, email, created_at FROM users WHERE id = $1",
        [id]
    );

    return result.rows[0];
}

module.exports = {
    createTable,
    createUser,
    findByEmail,
    findById
};