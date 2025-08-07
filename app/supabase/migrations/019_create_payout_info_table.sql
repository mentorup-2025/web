-- Create payout_info table
CREATE TABLE IF NOT EXISTS payout_info (
    id TEXT PRIMARY KEY REFERENCES users(user_id), -- user id as primary key with foreign key reference
    ali_pay JSONB, -- AliPay information as JSON
    wechat_pay TEXT -- WeChat ID as string
);

-- Add comment to table
COMMENT ON TABLE payout_info IS 'Stores payout information for users including AliPay and WeChat payment details';

-- Add comments to columns
COMMENT ON COLUMN payout_info.id IS 'User ID (primary key) - references users.user_id';
COMMENT ON COLUMN payout_info.ali_pay IS 'AliPay account information stored as JSON (e.g., {"name": "Xiao Wang", "phone": "188123123123"})';
COMMENT ON COLUMN payout_info.wechat_pay IS 'WeChat ID for payment setup'; 