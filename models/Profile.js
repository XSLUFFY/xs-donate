const db = require("../database/database");

async function createTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            display_name VARCHAR(100),
            pix_key VARCHAR(255),
            pix_type VARCHAR(30),
            avatar VARCHAR(500),
            banner VARCHAR(500),
            theme VARCHAR(30) DEFAULT 'dark',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await db.query(query);
}

async function createProfile(userId) {
    const result = await db.query(
        `INSERT INTO profiles(user_id)
         VALUES($1)
         RETURNING *`,
        [userId]
    );

    return result.rows[0];
}

async function getProfile(userId) {
    const result = await db.query(
        "SELECT * FROM profiles WHERE user_id = $1",
        [userId]
    );

    return result.rows[0];
}

async function updateProfile(userId, data) {
    const result = await db.query(
        `UPDATE profiles
         SET
            display_name = $1,
            pix_key = $2,
            pix_type = $3,
            avatar = $4,
            banner = $5,
            theme = $6
         WHERE user_id = $7
         RETURNING *`,
        [
            data.display_name,
            data.pix_key,
            data.pix_type,
            data.avatar,
            data.banner,
            data.theme,
            userId
        ]
    );

    return result.rows[0];
}

module.exports = {
    createTable,
    createProfile,
    getProfile,
    updateProfile
};