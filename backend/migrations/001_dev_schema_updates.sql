ALTER TABLE events
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

ALTER TABLE events
ADD COLUMN IF NOT EXISTS start_time VARCHAR;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS end_time VARCHAR;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);

ALTER TABLE events
ADD COLUMN IF NOT EXISTS reviewed_at VARCHAR;

CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    capacity INTEGER NOT NULL
);

INSERT INTO venues (name, capacity)
VALUES
    ('Main Auditorium', 500),
    ('Seminar Hall', 120),
    ('Tech Lab', 80),
    ('Sports Complex', 800)
ON CONFLICT (name) DO NOTHING;
