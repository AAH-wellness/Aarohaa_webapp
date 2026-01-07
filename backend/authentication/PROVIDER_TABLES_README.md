# Provider Availability and Bookings Tables

This document explains the database structure for provider availability and bookings.

## Tables Created

### 1. `provider_availability` Table
Stores detailed availability schedule for each provider, with separate rows for each day of the week.

**Key Features:**
- One row per provider per day
- Stores start/end times for each day
- Timezone support
- Easy to query and update individual days

**Columns:**
- `id` - Primary key
- `provider_id` - Foreign key to providers table
- `day_of_week` - Day name (monday, tuesday, etc.)
- `is_available` - Boolean flag for availability
- `start_time` - Start time (TIME type)
- `end_time` - End time (TIME type)
- `timezone` - Provider's timezone
- `created_at`, `updated_at` - Timestamps

### 2. `bookings` Table (Enhanced)
Stores all bookings/appointments between users and providers.

**Key Features:**
- Links users to providers
- Tracks booking status and payment
- Records session duration and actual time
- Supports cancellation tracking

**Columns:**
- `id` - Primary key
- `user_id` - Foreign key to users table
- `provider_id` - Foreign key to providers table
- `appointment_date` - When the appointment is scheduled
- `session_type` - Type of session (Video Consultation, etc.)
- `session_duration` - Planned duration in minutes
- `notes` - Additional notes
- `status` - scheduled, confirmed, completed, cancelled, no_show
- `amount` - Booking amount
- `payment_status` - pending, paid, refunded, failed
- `session_started_at`, `session_ended_at` - Actual session times
- `actual_duration` - Actual duration in minutes
- `cancelled_at`, `cancellation_reason`, `cancelled_by` - Cancellation info
- `reminder_sent`, `reminder_sent_at` - Reminder tracking
- `created_at`, `updated_at` - Timestamps

## How to Use

### Step 1: Run the SQL Script

Execute the SQL script in your PostgreSQL database:

```bash
# Using psql
psql -U your_username -d your_database -f CREATE_PROVIDER_TABLES.sql

# Or using a database client (pgAdmin, DBeaver, etc.)
# Open CREATE_PROVIDER_TABLES.sql and execute it
```

### Step 2: Update Your Code

The backend code needs to be updated to use the new `provider_availability` table instead of the JSONB column in the `providers` table.

## Migration from JSONB to Separate Table

If you have existing availability data stored in the `providers.availability` JSONB column, you can migrate it using the migration script included in the SQL file (commented out). Uncomment and run it after creating the tables.

## Example Queries

### Insert Provider Availability

```sql
-- Set Monday availability for provider ID 1
INSERT INTO provider_availability (provider_id, day_of_week, is_available, start_time, end_time, timezone)
VALUES (1, 'monday', true, '09:00', '17:00', 'America/New_York')
ON CONFLICT (provider_id, day_of_week) 
DO UPDATE SET 
    is_available = EXCLUDED.is_available,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    updated_at = CURRENT_TIMESTAMP;
```

### Get Provider's Full Schedule

```sql
SELECT 
    day_of_week,
    is_available,
    start_time,
    end_time,
    timezone
FROM provider_availability
WHERE provider_id = 1
ORDER BY 
    CASE day_of_week
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
    END;
```

### Create a Booking

```sql
INSERT INTO bookings (user_id, provider_id, appointment_date, session_type, session_duration, amount, status)
VALUES (1, 1, '2024-01-15 10:00:00', 'Video Consultation', 60, 150.00, 'scheduled')
RETURNING *;
```

### Get Provider's Upcoming Bookings

```sql
SELECT 
    b.id,
    b.appointment_date,
    b.session_type,
    b.status,
    u.name as user_name,
    u.email as user_email
FROM bookings b
JOIN users u ON b.user_id = u.id
WHERE b.provider_id = 1
  AND b.appointment_date > CURRENT_TIMESTAMP
  AND b.status IN ('scheduled', 'confirmed')
ORDER BY b.appointment_date ASC;
```

## Benefits of Separate Tables

1. **Better Query Performance**: Indexed columns instead of JSONB queries
2. **Data Integrity**: Foreign key constraints and check constraints
3. **Easier Updates**: Update individual days without replacing entire JSON
4. **Better Analytics**: Easy to query availability patterns
5. **Scalability**: Can add more fields per day without JSON complexity

## Next Steps

1. Run the SQL script to create the tables
2. Update the `Provider` model to use the new `provider_availability` table
3. Update the availability API endpoints
4. Migrate existing data (if any)
5. Remove the `availability` JSONB column from `providers` table (optional)








