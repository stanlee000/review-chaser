-- Create review_requests table
CREATE TABLE IF NOT EXISTS review_requests (
  id BIGSERIAL PRIMARY KEY,
  token VARCHAR(32) NOT NULL UNIQUE,
  review_content TEXT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  platforms TEXT[] NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  product_name VARCHAR(255) NOT NULL,
  rating INTEGER,
  title VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS review_requests_token_idx ON review_requests(token);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS review_requests_status_idx ON review_requests(status);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_requests_updated_at
    BEFORE UPDATE ON review_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 