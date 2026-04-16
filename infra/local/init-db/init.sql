-- REMOVE the "CREATE DATABASE auth_db" line!
-- REMOVE the "\c auth_db" line!

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: We don't need to insert the user here anymore 
-- because our NEW test suite (auth.test.js) inserts the user automatically!