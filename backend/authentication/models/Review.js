const { pool } = require('../config/database');

class Review {
  static async createTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          provider_id INTEGER NOT NULL,
          booking_id INTEGER NOT NULL,
          rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
          review_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_unique ON reviews(booking_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
      `);
      console.log('✅ Reviews table created/verified');
    } catch (e) {
      console.warn('⚠️ Reviews table setup:', e?.message || e);
    }
  }

  static async create({ userId, providerId, bookingId, rating, reviewText }) {
    const existing = await this.findByBookingId(bookingId);
    if (existing) {
      const result = await pool.query(
        `UPDATE reviews SET rating = $1, review_text = $2, created_at = CURRENT_TIMESTAMP
         WHERE booking_id = $3 RETURNING *`,
        [rating, reviewText, bookingId]
      );
      return result.rows[0];
    }
    const result = await pool.query(
      `INSERT INTO reviews (user_id, provider_id, booking_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, providerId, bookingId, rating, reviewText]
    );
    return result.rows[0];
  }

  static async findByBookingId(bookingId) {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE booking_id = $1',
      [bookingId]
    );
    return result.rows[0] || null;
  }

  static async getProviderStats(providerId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(AVG(rating)::decimal(3,2), 0) as avg_rating
       FROM reviews WHERE provider_id = $1`,
      [providerId]
    );
    const row = result.rows[0];
    return {
      count: parseInt(row?.count || 0, 10),
      avgRating: parseFloat(row?.avg_rating || 0)
    };
  }
}

module.exports = Review;
