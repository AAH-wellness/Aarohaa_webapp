/**
 * Jitsi Video Service (FREE Alternative to Daily.co)
 *
 * Generates Jitsi Meet room URLs for video calls.
 * No API keys needed for basic usage with meet.jit.si
 *
 * For production, consider self-hosting Jitsi for better security.
 */

/**
 * Generate a unique room name for a booking
 * Format: aarohaa-booking-{bookingId}
 * Using booking ID ensures same room for same booking (deterministic)
 */
function generateRoomName(bookingId, roomNameSuffix = '') {
  const safeBookingId = String(bookingId).replace(/[^a-z0-9-]/gi, '');
  const suffix = roomNameSuffix ? `-${roomNameSuffix}` : '';
  return `aarohaa-booking-${safeBookingId}${suffix}`;
}

/**
 * Generate Jitsi Meet room URL
 * @param {Object} options
 * @param {number} options.bookingId - Booking ID
 * @param {string} options.userName - Display name
 * @param {boolean} options.isProvider - Whether requester is provider
 * @returns {Object} { roomUrl, roomName }
 */
function generateJitsiRoom({ bookingId, userName, isProvider }) {
  const roomName = generateRoomName(bookingId);
  
  // Using free Jitsi cloud service
  // For production, you can self-host: https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-start
  const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';
  
  // Build URL with optional parameters
  const params = new URLSearchParams({
    // User display name
    userInfo: JSON.stringify({
      displayName: userName || (isProvider ? 'Provider' : 'User'),
    }),
    // Optional: password for private rooms (if you want to add password protection)
    // jwt: token, // If using JWT tokens (requires self-hosted Jitsi)
  });

  const roomUrl = `https://${jitsiDomain}/${roomName}?${params.toString()}`;

  return {
    roomName,
    roomUrl,
    // Jitsi doesn't use tokens like Daily, but you can add password protection
    password: null, // Optional: generate password for private rooms
  };
}

/**
 * Ensure room for booking (Jitsi doesn't require pre-creation)
 * This is a compatibility function to match Daily.co's API
 * Jitsi rooms are created on-demand when first user joins
 */
async function ensureRoomForBooking({ bookingId, expiresAt, privacy = 'private', roomNameSuffix = '', userName = null }) {
  const roomName = generateRoomName(bookingId, roomNameSuffix);
  const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';
  
  // Build URL with optional user display name parameter
  const params = new URLSearchParams();
  if (userName) {
    params.append('userInfo', JSON.stringify({ displayName: userName }));
  }
  
  // Force English language interface
  params.append('lang', 'en');
  params.append('config.lang', 'en');
  params.append('interfaceConfig.lang', 'en');
  
  const roomUrl = `https://${jitsiDomain}/${roomName}?${params.toString()}`;

  return {
    roomName,
    roomUrl,
    config: {
      privacy,
      expiresAt: expiresAt?.toISOString(),
    },
  };
}

/**
 * Create meeting token (Jitsi doesn't use tokens like Daily)
 * This is kept for API compatibility but returns null
 * For security, consider using Jitsi's password protection or self-hosting with JWT
 */
async function createMeetingToken({ roomName, userName, isOwner, expiresAt }) {
  // Jitsi Meet (free cloud) doesn't use tokens
  // For production with self-hosted Jitsi, you can generate JWT tokens here
  return null;
}

module.exports = {
  generateJitsiRoom,
  ensureRoomForBooking,
  createMeetingToken,
};
