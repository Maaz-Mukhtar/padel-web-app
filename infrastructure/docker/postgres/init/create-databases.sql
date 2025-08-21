-- Create individual databases for each microservice
-- This script runs during PostgreSQL container initialization

-- Create databases
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE booking_db;
CREATE DATABASE notification_db;

-- Grant privileges to padel_user
GRANT ALL PRIVILEGES ON DATABASE auth_db TO padel_user;
GRANT ALL PRIVILEGES ON DATABASE user_db TO padel_user;
GRANT ALL PRIVILEGES ON DATABASE booking_db TO padel_user;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO padel_user;

-- Connect to each database and create extensions
\c auth_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

\c user_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location data

\c booking_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For venue location data

\c notification_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";