const { Pool } = require("pg");

const TABLE_NAMES = [
  "admins",
  "adminactivities",
  "branches",
  "chatconversations",
  "enquiries",
  "feedbacks",
  "jobapplications",
  "jobopenings",
  "sitecontent",
  "users",
  "websitevisitors",
];

const INDEXES = [
  "CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(document ->> 'email'))",
  "CREATE UNIQUE INDEX IF NOT EXISTS admins_username_unique ON admins (lower(document ->> 'username'))",
  "CREATE INDEX IF NOT EXISTS adminactivities_created_at_idx ON adminactivities (created_at DESC)",
  "CREATE UNIQUE INDEX IF NOT EXISTS branches_headquarters_unique ON branches ((document ->> 'isHeadquarters')) WHERE document ->> 'isHeadquarters' = 'true'",
  "CREATE UNIQUE INDEX IF NOT EXISTS chatconversations_session_id_unique ON chatconversations ((document ->> 'sessionId'))",
  "CREATE INDEX IF NOT EXISTS chatconversations_last_message_at_idx ON chatconversations ((document ->> 'lastMessageAt') DESC)",
  "CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC)",
  "CREATE INDEX IF NOT EXISTS jobapplications_created_at_idx ON jobapplications (created_at DESC)",
  "CREATE INDEX IF NOT EXISTS jobapplications_status_created_at_idx ON jobapplications ((document ->> 'status'), created_at DESC)",
  "CREATE INDEX IF NOT EXISTS jobopenings_active_idx ON jobopenings ((document ->> 'isActive'))",
  "CREATE UNIQUE INDEX IF NOT EXISTS jobopenings_title_unique ON jobopenings (lower(document ->> 'title'))",
  "CREATE UNIQUE INDEX IF NOT EXISTS sitecontent_key_unique ON sitecontent ((document ->> 'key'))",
  "CREATE UNIQUE INDEX IF NOT EXISTS websitevisitors_hash_unique ON websitevisitors ((document ->> 'visitorHash'))",
  "CREATE INDEX IF NOT EXISTS websitevisitors_expires_at_idx ON websitevisitors (expires_at)",
];

let pool;

const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL must be configured for PostgreSQL");
    }
    const { hostname } = new URL(connectionString);
    const useSsl = !["localhost", "127.0.0.1", "::1"].includes(hostname);

    pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: true } : false,
      max: 10,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
    pool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error:", error);
    });
  }
  return pool;
};

const initializeSchema = async () => {
  const db = getPool();
  for (const tableName of TABLE_NAMES) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id UUID PRIMARY KEY,
        document JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ
      )
    `);
  }
  for (const statement of INDEXES) {
    await db.query(statement);
  }
  await db.query("DELETE FROM websitevisitors WHERE expires_at < NOW()");
};

const checkDatabase = async () => {
  await getPool().query("SELECT 1");
};

const closePool = async () => {
  if (pool) {
    const activePool = pool;
    pool = null;
    await activePool.end();
  }
};

const setPoolForTests = (testPool) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Test PostgreSQL pool injection is only available in test mode");
  }
  pool = testPool;
};

module.exports = {
  checkDatabase,
  closePool,
  getPool,
  initializeSchema,
  setPoolForTests,
};
