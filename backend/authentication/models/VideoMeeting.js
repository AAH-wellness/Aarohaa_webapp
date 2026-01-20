const { pool } = require('../config/database');

class VideoMeeting {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS video_meetings (
        booking_id INTEGER PRIMARY KEY,
        provider_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        vendor VARCHAR(50) NOT NULL DEFAULT 'daily',
        room_name VARCHAR(255) NOT NULL,
        room_url TEXT NOT NULL,
        scheduled_start TIMESTAMPTZ,
        scheduled_end TIMESTAMPTZ,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMPTZ,
        ended_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS idx_video_meetings_provider_id ON video_meetings(provider_id);
      CREATE INDEX IF NOT EXISTS idx_video_meetings_user_id ON video_meetings(user_id);
      CREATE INDEX IF NOT EXISTS idx_video_meetings_status ON video_meetings(status);
    `;

    await pool.query(query);
    console.log('✅ Video meetings table created/verified');
  }

  static async upsert(meeting) {
    const {
      bookingId,
      providerId,
      userId,
      vendor = 'daily',
      roomName,
      roomUrl,
      scheduledStart = null,
      scheduledEnd = null,
      status = 'scheduled',
      startedAt = null,
      endedAt = null,
    } = meeting;

    const q = `
      INSERT INTO video_meetings (
        booking_id, provider_id, user_id, vendor, room_name, room_url,
        scheduled_start, scheduled_end, status, started_at, ended_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, CURRENT_TIMESTAMP
      )
      ON CONFLICT (booking_id) DO UPDATE SET
        provider_id = EXCLUDED.provider_id,
        user_id = EXCLUDED.user_id,
        vendor = EXCLUDED.vendor,
        room_name = EXCLUDED.room_name,
        room_url = EXCLUDED.room_url,
        scheduled_start = EXCLUDED.scheduled_start,
        scheduled_end = EXCLUDED.scheduled_end,
        status = EXCLUDED.status,
        started_at = COALESCE(video_meetings.started_at, EXCLUDED.started_at),
        ended_at = COALESCE(video_meetings.ended_at, EXCLUDED.ended_at),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const res = await pool.query(q, [
      bookingId,
      providerId,
      userId,
      vendor,
      roomName,
      roomUrl,
      scheduledStart,
      scheduledEnd,
      status,
      startedAt,
      endedAt,
    ]);
    return res.rows[0];
  }

  static async findByBookingId(bookingId) {
    const res = await pool.query('SELECT * FROM video_meetings WHERE booking_id = $1', [bookingId]);
    return res.rows[0] || null;
  }

  static async markStarted(bookingId) {
    const res = await pool.query(
      `
      UPDATE video_meetings
      SET status = 'in_progress', started_at = COALESCE(started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $1
      RETURNING *;
    `,
      [bookingId]
    );
    return res.rows[0] || null;
  }

  static async markCompleted(bookingId) {
    const res = await pool.query(
      `
      UPDATE video_meetings
      SET status = 'completed', ended_at = COALESCE(ended_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $1
      RETURNING *;
    `,
      [bookingId]
    );
    return res.rows[0] || null;
  }
}

module.exports = VideoMeeting;

