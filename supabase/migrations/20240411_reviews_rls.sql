-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reviews" ON reviews
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON reviews TO authenticated;
GRANT USAGE ON SEQUENCE reviews_id_seq TO authenticated; 