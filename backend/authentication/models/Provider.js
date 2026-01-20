const { pool } = require('../config/database');

class Provider {
  /**
   * Create providers table if it doesn't exist
   */
  static async createTable() {
    try {
      // Check if table exists
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'providers'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        // Create table if it doesn't exist
        const createQuery = `
          CREATE TABLE providers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            specialty VARCHAR(255),
            title VARCHAR(255),
            bio TEXT,
            hourly_rate DECIMAL(10, 2) DEFAULT 0,
            rating DECIMAL(3, 2) DEFAULT 0,
            sessions_completed INTEGER DEFAULT 0,
            reviews_count INTEGER DEFAULT 0,
            verified BOOLEAN DEFAULT false,
            status VARCHAR(50) DEFAULT 'pending',
            availability JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            welcome_email_sent BOOLEAN DEFAULT false
          );
          
          CREATE INDEX IF NOT EXISTS idx_providers_email ON providers(email);
          CREATE INDEX IF NOT EXISTS idx_providers_verified ON providers(verified);
          CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
        `;
        await pool.query(createQuery);
        console.log('✅ Providers table created');
      } else {
        // Table exists - migrate to new schema
        console.log('⚠️  Migrating providers table to new schema...');
        
        // Check if password column exists
        const passwordExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'providers' 
            AND column_name = 'password'
          );
        `);
        
        if (!passwordExists.rows[0].exists) {
          // Add password column (nullable first, then we'll update it)
          await pool.query(`
            ALTER TABLE providers 
            ADD COLUMN password VARCHAR(255);
          `);
          
          // For existing rows, we need to handle them - delete providers without passwords
          // since they can't authenticate without a password
          await pool.query(`
            DELETE FROM providers WHERE password IS NULL;
          `);
          
          // Now make password NOT NULL
          await pool.query(`
            ALTER TABLE providers 
            ALTER COLUMN password SET NOT NULL;
          `);
          
          console.log('✅ Added password column to providers table');
        } else {
          // Password column exists, but check if it's nullable
          const passwordNullable = await pool.query(`
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'providers' 
            AND column_name = 'password';
          `);
          
          // If it's nullable, make it NOT NULL (after cleaning up NULL values)
          if (passwordNullable.rows[0]?.is_nullable === 'YES') {
            await pool.query(`
              DELETE FROM providers WHERE password IS NULL;
            `);
            await pool.query(`
              ALTER TABLE providers 
              ALTER COLUMN password SET NOT NULL;
            `);
            console.log('✅ Made password column NOT NULL');
          }
        }
        
        // Check if user_id column exists and make it nullable if it does
        const userIdExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'providers' 
            AND column_name = 'user_id'
          );
        `);
        
        if (userIdExists.rows[0].exists) {
          // Make user_id nullable (providers are now independent)
          await pool.query(`
            ALTER TABLE providers 
            ALTER COLUMN user_id DROP NOT NULL;
          `);
          console.log('✅ Made user_id nullable in providers table');
        }
        
        // Check if last_login column exists
        const lastLoginExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'providers' 
            AND column_name = 'last_login'
          );
        `);
        
        if (!lastLoginExists.rows[0].exists) {
          await pool.query(`
            ALTER TABLE providers 
            ADD COLUMN last_login TIMESTAMP;
          `);
          console.log('✅ Added last_login column to providers table');
        }
        
        // Ensure other indexes exist
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_providers_email ON providers(email);
          CREATE INDEX IF NOT EXISTS idx_providers_verified ON providers(verified);
          CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
        `);

        // Add welcome_email_sent flag if missing (used for Google provider onboarding email)
        const welcomeFlagExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'providers'
              AND column_name = 'welcome_email_sent'
          );
        `);

        if (!welcomeFlagExists.rows[0].exists) {
          await pool.query(`
            ALTER TABLE providers
            ADD COLUMN welcome_email_sent BOOLEAN DEFAULT false;
          `);
          console.log('✅ Added welcome_email_sent column to providers table');
        }
        
        console.log('✅ Providers table migration completed');
      }
    } catch (error) {
      console.error('❌ Error creating/updating providers table:', error);
      throw error;
    }
  }

  /**
   * Create a new provider (independent from users table)
   */
  static async create(providerData) {
    const { passwordHash, name, email, phone, specialty, title, bio, hourlyRate } = providerData;
    
    // Check if last_login column exists before including it in RETURNING
    const lastLoginExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'providers' 
        AND column_name = 'last_login'
      );
    `);
    
    const returnColumns = lastLoginExists.rows[0].exists
      ? 'id, name, email, phone, specialty, title, bio, hourly_rate, rating, sessions_completed, reviews_count, verified, status, availability, created_at, updated_at, last_login'
      : 'id, name, email, phone, specialty, title, bio, hourly_rate, rating, sessions_completed, reviews_count, verified, status, availability, created_at, updated_at';
    
    const query = `
      INSERT INTO providers (name, email, password, phone, specialty, title, bio, hourly_rate, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING ${returnColumns}
    `;
    
    try {
      const result = await pool.query(query, [
        name,
        email,
        passwordHash,
        phone || null,
        specialty || null,
        title || null,
        bio || null,
        hourlyRate || 0
      ]);
      
      // Add last_login as null if column doesn't exist (for backward compatibility)
      const provider = result.rows[0];
      if (!lastLoginExists.rows[0].exists) {
        provider.last_login = null;
      }
      
      return provider;
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Provider with this email already exists');
      }
      console.error('Error creating provider:', error);
      throw error;
    }
  }

  /**
   * Find provider by user ID
   */
  static async findByUserId(userId) {
    const query = 'SELECT * FROM providers WHERE user_id = $1';
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding provider by user_id:', error);
      throw error;
    }
  }

  /**
   * Find provider by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM providers WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding provider by id:', error);
      throw error;
    }
  }

  /**
   * Find provider by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM providers WHERE email = $1';
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding provider by email:', error);
      throw error;
    }
  }

  /**
   * Get all providers with optional filters
   */
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM providers WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.verified !== undefined) {
      query += ` AND verified = $${paramCount++}`;
      params.push(filters.verified);
    }

    if (filters.status) {
      query += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.specialty) {
      query += ` AND specialty ILIKE $${paramCount++}`;
      params.push(`%${filters.specialty}%`);
    }

    // Search across multiple fields (name, title, specialty, bio)
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query += ` AND (
        name ILIKE $${paramCount} OR
        title ILIKE $${paramCount} OR
        specialty ILIKE $${paramCount} OR
        bio ILIKE $${paramCount}
      )`;
      params.push(searchTerm);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding providers:', error);
      throw error;
    }
  }

  /**
   * Update provider
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    if (updates.specialty !== undefined) {
      fields.push(`specialty = $${paramCount++}`);
      values.push(updates.specialty);
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.bio !== undefined) {
      fields.push(`bio = $${paramCount++}`);
      values.push(updates.bio);
    }
    if (updates.hourlyRate !== undefined) {
      fields.push(`hourly_rate = $${paramCount++}`);
      values.push(updates.hourlyRate);
    }
    if (updates.verified !== undefined) {
      fields.push(`verified = $${paramCount++}`);
      values.push(updates.verified);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE providers 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating provider:', error);
      throw error;
    }
  }

  /**
   * Update provider availability
   * When availability is saved, provider status becomes 'ready' and they are auto-verified
   */
  static async updateAvailability(id, availability) {
    const query = `
      UPDATE providers 
      SET availability = $1, status = 'ready', verified = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [JSON.stringify(availability), id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating provider availability:', error);
      throw error;
    }
  }

  /**
   * Get provider availability
   */
  static async getAvailability(id) {
    const query = 'SELECT availability FROM providers WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      if (result.rows[0] && result.rows[0].availability) {
        const availability = result.rows[0].availability;
        // PostgreSQL JSONB returns as object, but handle string case too
        if (typeof availability === 'string') {
          try {
            return JSON.parse(availability);
          } catch (parseError) {
            console.error('Error parsing availability JSON string:', parseError);
            return {};
          }
        }
        return availability;
      }
      return {};
    } catch (error) {
      console.error('Error getting provider availability:', error);
      throw error;
    }
  }
}

module.exports = Provider;

