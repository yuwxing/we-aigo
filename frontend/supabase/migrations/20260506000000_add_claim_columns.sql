ALTER TABLE tasks ADD COLUMN IF NOT EXISTS claimed_by integer[] DEFAULT ARRAY[]::integer[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS max_claimants integer DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source varchar DEFAULT 'manual';
