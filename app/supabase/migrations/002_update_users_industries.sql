-- Move industries from mentors to users and add wechat
BEGIN;

-- First add the industries column to users
ALTER TABLE users 
ADD COLUMN industries TEXT[] DEFAULT '{}';

-- Copy industries data from mentors to users
UPDATE users u
SET industries = m.industries
FROM mentors m
WHERE u.user_id = m.user_id;

-- Add wechat column to users
ALTER TABLE users
ADD COLUMN wechat TEXT;

-- Drop industries column from mentors
ALTER TABLE mentors
DROP COLUMN industries;

COMMIT;

-- Rollback if needed
-- BEGIN;
--   ALTER TABLE mentors ADD COLUMN industries TEXT[] DEFAULT '{}';
--   UPDATE mentors m
--   SET industries = u.industries
--   FROM users u
--   WHERE m.user_id = u.user_id;
--   ALTER TABLE users DROP COLUMN industries;
--   ALTER TABLE users DROP COLUMN wechat;
-- COMMIT; 