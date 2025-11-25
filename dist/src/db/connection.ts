import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const DATABASE_URL = 'postgresql://user:password@localhost:5433/mydb';

let pool: Pool | null = null;

/**
 * Get or create a PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err: Error) => {
      console.error('[ERROR] Unexpected error on idle database client:', err.message, err.stack);
    });

    console.log('[INFO] Database connection pool created');
  }

  return pool;
}

/**
 * Execute a query with parameters
 */
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('[INFO] Executed query:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('[ERROR] Query execution failed:', {
      text,
      params: params ? '[REDACTED]' : undefined,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  try {
    const client = await pool.connect();
    console.log('[INFO] Database client acquired from pool');
    return client;
  } catch (error) {
    console.error('[ERROR] Failed to acquire database client:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log('[INFO] Database connection pool closed');
    } catch (error) {
      console.error('[ERROR] Failed to close database connection pool:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}