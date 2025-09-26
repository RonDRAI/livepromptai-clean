-- LivePromptAI Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    prospect_name VARCHAR(255),
    prospect_company VARCHAR(255),
    prospect_email VARCHAR(255),
    current_stage VARCHAR(100) DEFAULT 'discovery_surface',
    stage_progress INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('rep', 'prospect')),
    confidence DECIMAL(3,2),
    detected_patterns JSONB,
    ai_analysis JSONB,
    voice_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patterns table (for analytics and learning)
CREATE TABLE patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    confidence DECIMAL(3,2) NOT NULL,
    keywords TEXT[],
    context TEXT,
    framework VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suggestions table (for tracking AI suggestions)
CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    framework VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    reasoning TEXT,
    confidence DECIMAL(3,2) NOT NULL,
    follow_ups TEXT[],
    used BOOLEAN DEFAULT FALSE,
    feedback VARCHAR(20) CHECK (feedback IN ('positive', 'negative')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table (for performance tracking)
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice sessions table (for voice recognition tracking)
CREATE TABLE voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    total_duration INTEGER, -- in seconds
    recognition_accuracy DECIMAL(3,2),
    speaker_detection_accuracy DECIMAL(3,2),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playbook templates table
CREATE TABLE playbook_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework VARCHAR(50) NOT NULL,
    stage VARCHAR(100) NOT NULL,
    pattern_type VARCHAR(100),
    template TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_speaker ON messages(speaker);
CREATE INDEX idx_patterns_message_id ON patterns(message_id);
CREATE INDEX idx_patterns_type ON patterns(type);
CREATE INDEX idx_suggestions_conversation_id ON suggestions(conversation_id);
CREATE INDEX idx_suggestions_framework ON suggestions(framework);
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
CREATE INDEX idx_voice_sessions_conversation_id ON voice_sessions(conversation_id);
CREATE INDEX idx_playbook_templates_framework_stage ON playbook_templates(framework, stage);

-- GIN indexes for JSONB columns
CREATE INDEX idx_messages_detected_patterns ON messages USING GIN (detected_patterns);
CREATE INDEX idx_messages_ai_analysis ON messages USING GIN (ai_analysis);
CREATE INDEX idx_analytics_event_data ON analytics USING GIN (event_data);

-- Full-text search indexes
CREATE INDEX idx_messages_content_fts ON messages USING GIN (to_tsvector('english', content));
CREATE INDEX idx_conversations_search ON conversations USING GIN (
    to_tsvector('english', title || ' ' || COALESCE(prospect_name, '') || ' ' || COALESCE(prospect_company, ''))
);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_templates_updated_at BEFORE UPDATE ON playbook_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW conversation_summary AS
SELECT 
    c.id,
    c.title,
    c.prospect_name,
    c.prospect_company,
    c.current_stage,
    c.stage_progress,
    c.status,
    c.created_at,
    c.updated_at,
    COUNT(m.id) as message_count,
    COUNT(CASE WHEN m.speaker = 'rep' THEN 1 END) as rep_messages,
    COUNT(CASE WHEN m.speaker = 'prospect' THEN 1 END) as prospect_messages,
    AVG(m.confidence) as avg_confidence,
    COUNT(CASE WHEN m.detected_patterns IS NOT NULL THEN 1 END) as messages_with_patterns
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.title, c.prospect_name, c.prospect_company, c.current_stage, 
         c.stage_progress, c.status, c.created_at, c.updated_at;

CREATE VIEW pattern_analytics AS
SELECT 
    p.type,
    p.framework,
    COUNT(*) as total_count,
    AVG(p.confidence) as avg_confidence,
    COUNT(DISTINCT p.message_id) as unique_messages,
    COUNT(DISTINCT m.conversation_id) as unique_conversations,
    array_agg(DISTINCT unnest(p.keywords)) as common_keywords
FROM patterns p
JOIN messages m ON p.message_id = m.id
GROUP BY p.type, p.framework;

-- Sample data for development
INSERT INTO playbook_templates (framework, stage, pattern_type, template, priority) VALUES
-- Sandler templates
('Sandler', 'discovery_surface', 'pain_point', 'Can you walk me through how you''re handling {topic} today?', 1),
('Sandler', 'discovery_surface', 'pain_point', 'What happens when that process breaks down?', 2),
('Sandler', 'discovery_deep', 'pain_point', 'How long has this been a challenge for your team?', 1),
('Sandler', 'discovery_deep', 'pain_point', 'What''s the impact when this doesn''t work properly?', 2),

-- SPIN templates
('SPIN', 'discovery_surface', 'question', 'What''s your current situation with {topic}?', 1),
('SPIN', 'discovery_surface', 'pain_point', 'What problems are you experiencing with {topic}?', 2),
('SPIN', 'discovery_deep', 'pain_point', 'What would be the implications if this continues?', 1),
('SPIN', 'qualification', 'buying_signal', 'What would need to happen for you to move forward?', 1),

-- MEDDIC templates
('MEDDIC', 'qualification', 'question', 'What metrics are you using to measure success?', 1),
('MEDDIC', 'qualification', 'question', 'Who else would be involved in this decision?', 2),
('MEDDIC', 'qualification', 'question', 'What''s your timeline for implementing a solution?', 3),

-- Challenger templates
('Challenger', 'presentation', 'objection', 'I understand your concern. Let me share what we''ve seen with similar companies...', 1),
('Challenger', 'objection_handling', 'objection', 'That''s exactly why companies like yours are making this change now.', 1);

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO livepromptai_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO livepromptai_user;
