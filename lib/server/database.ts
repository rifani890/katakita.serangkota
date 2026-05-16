import fs from "fs";
import mysql, { type ResultSetHeader } from "mysql2/promise";
import { logger } from "@/lib/logger";

const SOCKET_CANDIDATES = [
  process.env.DB_SOCKET || "",
  "/opt/lampp/var/mysql/mysql.sock",
  "/opt/lampp/var/run/mysqld/mysqld.sock",
  "/opt/lampp/var/run/mysql/mysql.sock",
  "/var/run/mysqld/mysqld.sock",
  "/tmp/mysql.sock",
].filter(Boolean);

function findSocket(): string | null {
  if (process.env.DB_SOCKET) return process.env.DB_SOCKET;

  for (const socketPath of SOCKET_CANDIDATES) {
    try {
      if (fs.existsSync(socketPath)) return socketPath;
    } catch {
      // Ignore filesystem errors while probing socket candidates.
    }
  }

  return null;
}

function createPoolConfig() {
  const socketPath = findSocket();
  const config: Record<string, unknown> = {
    database: process.env.DB_NAME || "katakita_db",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
  };

  if (process.env.DB_HOST) {
    config.host = process.env.DB_HOST;
    config.port = Number(process.env.DB_PORT || 3306);
  } else if (socketPath) {
    config.socketPath = socketPath;
  } else {
    config.host = "127.0.0.1";
    config.port = Number(process.env.DB_PORT || 3306);
  }

  try {
    if (config.socketPath) {
      logger.info("DB: using socketPath ->", config.socketPath);
    } else {
      logger.info("DB: using TCP ->", `${config.host}:${config.port || 3306}`);
    }
  } catch {
    // Ignore logging errors.
  }

  return config;
}

const globalForDb = globalThis as unknown as {
  dbPool: ReturnType<typeof mysql.createPool> | undefined;
};

export const dbPool = globalForDb.dbPool ?? mysql.createPool(createPoolConfig());

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = dbPool;
}

export async function queryRows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await dbPool.execute(sql, params as any[]);
  return rows as T[];
}

export async function queryFirst<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

export async function executeStatement(
  sql: string,
  params: unknown[] = []
): Promise<ResultSetHeader> {
  const [result] = await dbPool.execute(sql, params as any[]);
  return result as ResultSetHeader;
}
