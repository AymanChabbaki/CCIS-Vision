-- =====================================================
-- CHATBOT CONVERSATIONS TABLE
-- Stores chatbot interaction history for analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response JSONB,
    response_type VARCHAR(50), -- 'text', 'stats', 'templates', 'troubleshooting', 'error'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster user conversation lookup
CREATE INDEX idx_chatbot_user_id ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_created_at ON chatbot_conversations(created_at DESC);

-- Comments
COMMENT ON TABLE chatbot_conversations IS 'Stores all chatbot interactions for user support and analytics';
COMMENT ON COLUMN chatbot_conversations.message IS 'User message sent to the chatbot';
COMMENT ON COLUMN chatbot_conversations.response IS 'Chatbot response stored as JSON for flexibility';
COMMENT ON COLUMN chatbot_conversations.response_type IS 'Type of response: text, stats, templates, troubleshooting, error';
