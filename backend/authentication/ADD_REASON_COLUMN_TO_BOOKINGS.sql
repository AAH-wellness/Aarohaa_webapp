-- Add reason column to user_bookings and provider_bookings tables
-- This column stores the cancellation reason when a booking is cancelled

-- Add reason column to user_bookings table
ALTER TABLE user_bookings 
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add reason column to provider_bookings table
ALTER TABLE provider_bookings 
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Update status values: Change 'scheduled' to 'confirmed' for existing bookings
-- Note: This assumes you want to migrate existing 'scheduled' bookings to 'confirmed'
UPDATE user_bookings 
SET status = 'confirmed' 
WHERE status = 'scheduled';

UPDATE provider_bookings 
SET status = 'confirmed' 
WHERE status = 'scheduled';

-- Add comment to explain the status values
COMMENT ON COLUMN user_bookings.status IS 'Booking status: confirmed, rescheduled, cancelled, or completed';
COMMENT ON COLUMN provider_bookings.status IS 'Booking status: confirmed, rescheduled, cancelled, or completed';
COMMENT ON COLUMN user_bookings.reason IS 'Cancellation reason (required when status is cancelled)';
COMMENT ON COLUMN provider_bookings.reason IS 'Cancellation reason (required when status is cancelled)';
