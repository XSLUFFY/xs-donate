const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    ssl: {
        rejectUnauthorized: false
    },

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on("connect", () => {
    console.log("✅ PostgreSQL conectado ao Supabase.");
});

pool.on("error", (err) => {
    console.error("❌ Erro no PostgreSQL:", err);
});

module.exports = pool;
