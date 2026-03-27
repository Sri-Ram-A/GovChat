-- =========================================
-- File: schema.sql
-- Purpose: Schema for service locations API
-- Database: PostgreSQL
-- =========================================

BEGIN;

CREATE TABLE IF NOT EXISTS service_locations (
    id SERIAL PRIMARY KEY,

    service_name TEXT NOT NULL,
    location_description TEXT NOT NULL,

    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT latitude_valid CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT longitude_valid CHECK (longitude BETWEEN -180 AND 180),

    CONSTRAINT unique_location_coordinates UNIQUE (latitude, longitude)
);

COMMIT;
