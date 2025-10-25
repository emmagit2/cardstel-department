const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const pool = isProduction
  // ✅ Production: use single DATABASE_URL string (Render)
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required for Render PostgreSQL
    })
  // ✅ Local development: use separate variables
  : new Pool({
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "cardstel",
      password: process.env.DB_PASS || "123",
      port: process.env.DB_PORT || 5432,
    });

pool.connect()
  .then(() =>
    console.log(
      `✅ Connected to PostgreSQL (${isProduction ? "Production" : "Local"})`
    )
  )
  .catch((err) => console.error("❌ Database connection error:", err));

module.exports = pool;
