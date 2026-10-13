import mongoose from "mongoose";

const LOG_PREFIX = "[MongoDB]";
const RETRY_INITIAL_DELAY_MS = 1000;
const RETRY_MAX_DELAY_MS = 30000;

/**
 * Timeouts cortos a propósito: si MongoDB no responde, la operación falla rápido
 * en lugar de dejar la petición colgada (los defaults del driver son 30s de
 * selección de servidor y espera infinita en la cola del pool).
 */
const connectionOptions = {
  appName: "gym-api",
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  waitQueueTimeoutMS: 10000,
  heartbeatFrequencyMS: 5000,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 60000,
  retryWrites: true,
  retryReads: true,
};

// `localhost` puede resolverse primero a IPv6 (::1) y luego caer a IPv4, penalizando
// cada socket nuevo. Fijamos loopback IPv4 para hosts locales.
const normalizeUri = (uri) =>
  uri.replace(/\/\/localhost(?=[:/])/i, "//127.0.0.1").replace(/@localhost(?=[:/])/i, "@127.0.0.1");

const maxConnectAttempts = () => {
  const value = Number(process.env.DB_CONNECT_ATTEMPTS);
  return Number.isInteger(value) && value > 0 ? value : Infinity;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let connectionPromise = null;
let listenersRegistered = false;
let hasConnected = false;

const registerConnectionEvents = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection
    .on("connected", () => {
      hasConnected = true;
      console.log(`${LOG_PREFIX} Conexión establecida.`);
    })
    .on("reconnected", () => console.log(`${LOG_PREFIX} Conexión restablecida.`))
    .on("disconnected", () => {
      // Un intento fallido durante el arranque también emite "disconnected".
      if (hasConnected) console.warn(`${LOG_PREFIX} Conexión perdida, el driver reintentará automáticamente.`);
    })
    .on("error", (error) => console.error(`${LOG_PREFIX} Error:`, error.message));
};

const openConnection = async () => {
  const uri = normalizeUri(process.env.databaseUrl ?? "");

  if (!uri) {
    throw new Error(`${LOG_PREFIX} La variable de entorno databaseUrl no está definida.`);
  }

  registerConnectionEvents();

  const attempts = maxConnectAttempts();
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mongoose.connect(uri, connectionOptions);
      console.log(`${LOG_PREFIX} Conectado a "${mongoose.connection.name}" en ${mongoose.connection.host}:${mongoose.connection.port}.`);
      return mongoose.connection;
    } catch (error) {
      lastError = error;
      const delay = Math.min(RETRY_INITIAL_DELAY_MS * 2 ** (attempt - 1), RETRY_MAX_DELAY_MS);
      console.warn(`${LOG_PREFIX} Intento ${attempt} falló (${error.message}). Reintentando en ${Math.round(delay / 1000)}s.`);
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Abre la conexión a MongoDB y resuelve cuando está lista.
 * Es idempotente: las llamadas concurrentes comparten el mismo intento.
 * Reintenta con backoff exponencial (limita los intentos con DB_CONNECT_ATTEMPTS).
 */
export const connectToDatabase = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);

  if (!connectionPromise) {
    connectionPromise = openConnection().finally(() => {
      connectionPromise = null;
    });
  }

  return connectionPromise;
};

export default mongoose.connection;
