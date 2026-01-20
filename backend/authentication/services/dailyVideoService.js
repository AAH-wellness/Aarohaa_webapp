/**
 * Daily Video Service
 *
 * Creates Daily rooms and issues meeting tokens.
 * Providers are always issued owner tokens (host).
 *
 * Env:
 * - DAILY_API_KEY: Daily REST API key
 * - DAILY_DOMAIN: e.g. "aarohaa.daily.co" (no protocol)
 */
const DAILY_API_BASE_URL = 'https://api.daily.co/v1';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getDailyConfig() {
  return {
    apiKey: requireEnv('DAILY_API_KEY'),
    domain: requireEnv('DAILY_DOMAIN'),
  };
}

function toEpochSeconds(date) {
  return Math.floor(date.getTime() / 1000);
}

function safeRoomName(name) {
  // Daily room names: lowercase, numbers, hyphens recommended.
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function dailyRequest(path, { method = 'GET', body } = {}) {
  const { apiKey } = getDailyConfig();
  const res = await fetch(`${DAILY_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error || data?.info || data?.message || `Daily API error (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Create (or get) a Daily room for a booking.
 * We use a deterministic room name so we can be idempotent without DB state.
 */
async function ensureRoomForBooking({ bookingId, expiresAt }) {
  const { domain } = getDailyConfig();
  const roomName = safeRoomName(`aarohaa-booking-${bookingId}`);
  const roomUrl = `https://${domain}/${roomName}`;

  // Try to get the room first (fast path).
  try {
    const existing = await dailyRequest(`/rooms/${roomName}`, { method: 'GET' });
    return {
      roomName,
      roomUrl: existing?.url || roomUrl,
      config: existing,
    };
  } catch (e) {
    // 404 means room doesn't exist yet; create it.
    if (e?.status !== 404) throw e;
  }

  const exp = expiresAt instanceof Date ? toEpochSeconds(expiresAt) : undefined;

  const created = await dailyRequest('/rooms', {
    method: 'POST',
    body: {
      name: roomName,
      privacy: 'private', // token-required
      properties: {
        // Keep access controlled via short-lived tokens minted by backend.
        exp,
      },
    },
  });

  return {
    roomName,
    roomUrl: created?.url || roomUrl,
    config: created,
  };
}

/**
 * Issue a Daily meeting token for a specific room.
 * Providers must be owner (host).
 */
async function createMeetingToken({ roomName, userName, isOwner, expiresAt }) {
  const exp = expiresAt instanceof Date ? toEpochSeconds(expiresAt) : undefined;
  const tokenRes = await dailyRequest('/meeting-tokens', {
    method: 'POST',
    body: {
      properties: {
        room_name: roomName,
        user_name: userName || undefined,
        is_owner: !!isOwner,
        exp,
      },
    },
  });

  return tokenRes?.token;
}

module.exports = {
  ensureRoomForBooking,
  createMeetingToken,
};

