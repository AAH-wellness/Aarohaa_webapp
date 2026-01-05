-- =====================================================
-- Provider Availability and Bookings Tables
-- =====================================================
-- This script creates dedicated tables for:
-- 1. Provider Availability (separate from providers table)
-- 2. Bookings (provider-specific bookings)
-- =====================================================

-- =====================================================
-- 1. PROVIDER AVAILABILITY TABLE
-- =====================================================
-- Stores detailed availability schedule for each provider
-- Each day of the week can have different start/end times

CREATE TABLE IF NOT EXISTS provider_availability (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    
    -- Day of week (monday, tuesday, wednesday, thursday, friday, saturday, sunday)
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    
    -- Availability settings for this day
    is_available BOOLEAN DEFAULT false,
    start_time TIME,
    end_time TIME,
    
    -- Timezone for this provider
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one record per provider per day
    UNIQUE(provider_id, day_of_week)
);

-- Indexes for provider_availability table
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_id ON provider_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_availability_day ON provider_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_provider_availability_available ON provider_availability(is_available);

-- =====================================================
-- 2. BOOKINGS TABLE (Provider-specific)
-- =====================================================
-- Stores all bookings/appointments between users and providers

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    
    -- Appointment details
    appointment_date TIMESTAMP NOT NULL,
    session_type VARCHAR(100) DEFAULT 'Video Consultation',
    session_duration INTEGER DEFAULT 60, -- Duration in minutes
    notes TEXT,
    
    -- Booking status: scheduled, confirmed, completed, cancelled, no_show
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    
    -- Payment information (optional)
    amount DECIMAL(10, 2), -- Total amount for this booking
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    
    -- Session information (for completed sessions)
    session_started_at TIMESTAMP,
    session_ended_at TIMESTAMP,
    actual_duration INTEGER, -- Actual duration in minutes
    
    -- Cancellation information
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('user', 'provider', 'system')),
    
    -- Reminder information
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for bookings table
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_date ON bookings(provider_id, appointment_date);

-- Composite index for finding upcoming appointments
CREATE INDEX IF NOT EXISTS idx_bookings_upcoming ON bookings(provider_id, appointment_date, status) 
WHERE status IN ('scheduled', 'confirmed');

-- =====================================================
-- 3. TRIGGERS FOR UPDATED_AT TIMESTAMP
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for provider_availability
DROP TRIGGER IF EXISTS update_provider_availability_updated_at ON provider_availability;
CREATE TRIGGER update_provider_availability_updated_at
    BEFORE UPDATE ON provider_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. HELPER VIEWS FOR EASY QUERYING
-- =====================================================

-- View: Provider availability summary
CREATE OR REPLACE VIEW provider_availability_summary AS
SELECT 
    p.id as provider_id,
    p.name as provider_name,
    p.email as provider_email,
    COUNT(pa.id) FILTER (WHERE pa.is_available = true) as available_days_count,
    STRING_AGG(pa.day_of_week, ', ' ORDER BY 
        CASE pa.day_of_week
            WHEN 'monday' THEN 1
            WHEN 'tuesday' THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4
            WHEN 'friday' THEN 5
            WHEN 'saturday' THEN 6
            WHEN 'sunday' THEN 7
        END
    ) FILTER (WHERE pa.is_available = true) as available_days,
    MAX(pa.timezone) as timezone
FROM providers p
LEFT JOIN provider_availability pa ON p.id = pa.provider_id
GROUP BY p.id, p.name, p.email;

-- View: Provider bookings summary
CREATE OR REPLACE VIEW provider_bookings_summary AS
SELECT 
    p.id as provider_id,
    p.name as provider_name,
    COUNT(b.id) FILTER (WHERE b.status = 'scheduled') as scheduled_count,
    COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_count,
    COUNT(b.id) FILTER (WHERE b.status = 'cancelled') as cancelled_count,
    SUM(b.amount) FILTER (WHERE b.payment_status = 'paid') as total_earnings,
    MIN(b.appointment_date) FILTER (WHERE b.status = 'scheduled' AND b.appointment_date > CURRENT_TIMESTAMP) as next_appointment
FROM providers p
LEFT JOIN bookings b ON p.id = b.provider_id
GROUP BY p.id, p.name;

-- =====================================================
-- 5. USEFUL QUERIES
-- =====================================================

-- Query: Get provider's full availability schedule
-- SELECT * FROM provider_availability WHERE provider_id = ? ORDER BY 
--     CASE day_of_week
--         WHEN 'monday' THEN 1
--         WHEN 'tuesday' THEN 2
--         WHEN 'wednesday' THEN 3
--         WHEN 'thursday' THEN 4
--         WHEN 'friday' THEN 5
--         WHEN 'saturday' THEN 6
--         WHEN 'sunday' THEN 7
--     END;

-- Query: Get all bookings for a provider
-- SELECT * FROM bookings WHERE provider_id = ? ORDER BY appointment_date DESC;

-- Query: Get upcoming bookings for a provider
-- SELECT * FROM bookings 
-- WHERE provider_id = ? 
--   AND appointment_date > CURRENT_TIMESTAMP 
--   AND status IN ('scheduled', 'confirmed')
-- ORDER BY appointment_date ASC;

-- Query: Get provider availability summary
-- SELECT * FROM provider_availability_summary WHERE provider_id = ?;

-- Query: Get provider bookings summary
-- SELECT * FROM provider_bookings_summary WHERE provider_id = ?;

-- =====================================================
-- 6. MIGRATION: Move existing availability from providers table
-- =====================================================
-- If you have existing availability data in providers.availability (JSONB),
-- you can migrate it using this script (uncomment and modify as needed):

/*
-- Example migration script (adjust based on your JSON structure)
DO $$
DECLARE
    provider_record RECORD;
    day_name TEXT;
    day_data JSONB;
BEGIN
    FOR provider_record IN SELECT id, availability FROM providers WHERE availability IS NOT NULL
    LOOP
        -- Loop through each day in the availability JSON
        FOR day_name, day_data IN SELECT * FROM jsonb_each(provider_record.availability)
        LOOP
            INSERT INTO provider_availability (
                provider_id,
                day_of_week,
                is_available,
                start_time,
                end_time,
                timezone
            ) VALUES (
                provider_record.id,
                day_name,
                COALESCE((day_data->>'enabled')::boolean, false),
                COALESCE((day_data->>'start')::time, NULL),
                COALESCE((day_data->>'end')::time, NULL),
                'America/New_York' -- Default timezone, adjust as needed
            )
            ON CONFLICT (provider_id, day_of_week) DO UPDATE SET
                is_available = EXCLUDED.is_available,
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time,
                updated_at = CURRENT_TIMESTAMP;
        END LOOP;
    END LOOP;
END $$;
*/

-- =====================================================
-- END OF SCRIPT
-- =====================================================

