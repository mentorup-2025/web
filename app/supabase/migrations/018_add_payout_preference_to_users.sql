-- Add payout_preference column to users table
ALTER TABLE users 
ADD COLUMN payout_preference TEXT;

-- Add comment to the column
COMMENT ON COLUMN users.payout_preference IS 'User preference for payment method (e.g., Stripe, Wechat, etc.)'; 