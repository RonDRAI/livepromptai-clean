-- LivePromptAI Seed Data
-- Sample data for development and testing

-- Demo user (password: demo123)
INSERT INTO users (id, email, password_hash, name, role, settings) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'demo@livepromptai.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXANBjXbpOt9OQjGi6zI5Z8Kqm', -- demo123
    'Demo User',
    'user',
    '{"voice_enabled": true, "preferred_framework": "Sandler", "notifications": true}'
);

-- Sample conversation
INSERT INTO conversations (id, user_id, title, prospect_name, prospect_company, current_stage, stage_progress, status) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    'TechCorp Discovery Call',
    'Sarah Johnson',
    'TechCorp Solutions',
    'discovery_surface',
    25,
    'active'
);

-- Sample messages
INSERT INTO messages (id, conversation_id, content, speaker, confidence, detected_patterns, ai_analysis) VALUES 
(
    '770e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'Hi Sarah, thanks for making time today. Could you tell me about your team''s current workflow for client reporting?',
    'rep',
    0.95,
    '[]',
    '{"sentiment": "neutral", "engagement_score": 0.8, "buying_intent": 0.1, "urgency_level": "low", "key_topics": ["workflow", "client reporting", "team process"], "next_best_action": "Wait for prospect response and listen for pain points"}'
),
(
    '880e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'Well, honestly, we''re struggling with our current process. Everything is manual and it takes our team hours to compile reports each week.',
    'prospect',
    0.92,
    '[{"type": "pain_point", "description": "Manual reporting process causing time inefficiency", "confidence": 0.89, "keywords": ["struggling", "manual", "hours"], "context": "Everything is manual and it takes our team hours to compile reports each week"}]',
    '{"sentiment": "negative", "engagement_score": 0.9, "buying_intent": 0.6, "urgency_level": "medium", "key_topics": ["manual process", "time consumption", "reporting inefficiency"], "next_best_action": "Dig deeper into the pain - quantify the impact"}'
),
(
    '990e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'That sounds frustrating. Can you walk me through exactly how much time your team spends on this each week?',
    'rep',
    0.94,
    '[{"type": "question", "description": "Quantifying pain point with specific time impact", "confidence": 0.91, "keywords": ["how much time", "each week"], "context": "Can you walk me through exactly how much time your team spends on this each week"}]',
    '{"sentiment": "empathetic", "engagement_score": 0.85, "buying_intent": 0.3, "urgency_level": "low", "key_topics": ["time quantification", "pain discovery"], "next_best_action": "Listen for specific numbers and impact"}'
);

-- Sample patterns extracted from messages
INSERT INTO patterns (id, message_id, type, description, confidence, keywords, context, framework) VALUES 
(
    'aa0e8400-e29b-41d4-a716-446655440000',
    '880e8400-e29b-41d4-a716-446655440000',
    'pain_point',
    'Manual reporting process causing time inefficiency',
    0.89,
    ARRAY['struggling', 'manual', 'hours', 'compile', 'reports'],
    'Everything is manual and it takes our team hours to compile reports each week',
    'Sandler'
),
(
    'bb0e8400-e29b-41d4-a716-446655440000',
    '990e8400-e29b-41d4-a716-446655440000',
    'question',
    'Quantifying pain point with specific time impact',
    0.91,
    ARRAY['how much time', 'each week', 'walk me through'],
    'Can you walk me through exactly how much time your team spends on this each week',
    'Sandler'
);

-- Sample suggestions
INSERT INTO suggestions (id, conversation_id, message_id, framework, type, content, reasoning, confidence, follow_ups) VALUES 
(
    'cc0e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    '880e8400-e29b-41d4-a716-446655440000',
    'Sandler',
    'pain_discovery',
    'That sounds frustrating. Can you walk me through exactly how much time your team spends on this each week?',
    'Prospect mentioned manual process taking hours - need to quantify the pain',
    0.94,
    ARRAY['What happens when reports are delayed?', 'How does this impact your team''s other priorities?', 'What would it mean if you could cut this time in half?']
),
(
    'dd0e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    '880e8400-e29b-41d4-a716-446655440000',
    'SPIN',
    'problem_question',
    'What problems does this manual process create for your team beyond just the time investment?',
    'SPIN methodology - explore problems beyond the obvious',
    0.87,
    ARRAY['How does this affect your client relationships?', 'What errors occur with manual processes?']
),
(
    'ee0e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    '880e8400-e29b-41d4-a716-446655440000',
    'MEDDIC',
    'metrics_question',
    'How do you currently measure the success of your reporting process?',
    'MEDDIC - establish metrics for current state',
    0.82,
    ARRAY['What would good look like?', 'How do you track reporting accuracy?']
);

-- Sample analytics events
INSERT INTO analytics (id, user_id, conversation_id, event_type, event_data) VALUES 
(
    'ff0e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'pattern_detected',
    '{"pattern_type": "pain_point", "confidence": 0.89, "framework": "Sandler", "stage": "discovery_surface"}'
),
(
    '110e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'suggestion_generated',
    '{"framework": "Sandler", "type": "pain_discovery", "confidence": 0.94, "stage": "discovery_surface"}'
),
(
    '220e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'stage_progression',
    '{"from_stage": "discovery_surface", "to_stage": "discovery_surface", "progress_change": 15, "trigger": "pain_point_detected"}'
);

-- Sample voice session
INSERT INTO voice_sessions (id, conversation_id, session_start, session_end, total_duration, recognition_accuracy, speaker_detection_accuracy, settings) VALUES 
(
    '330e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '5 minutes',
    300, -- 5 minutes
    0.94,
    0.87,
    '{"language": "en-US", "continuous": true, "interim_results": true, "confidence_threshold": 0.7}'
);

-- Additional playbook templates with more comprehensive coverage
INSERT INTO playbook_templates (framework, stage, pattern_type, template, variables, priority, active) VALUES 
-- Sandler Pain Funnel
('Sandler', 'discovery_surface', 'pain_point', 'Tell me more about {pain_area}.', '{"pain_area": "the challenge you mentioned"}', 1, true),
('Sandler', 'discovery_surface', 'pain_point', 'How long has this been going on?', '{}', 2, true),
('Sandler', 'discovery_deep', 'pain_point', 'What have you tried to do about it?', '{}', 1, true),
('Sandler', 'discovery_deep', 'pain_point', 'How did that work?', '{}', 2, true),
('Sandler', 'discovery_deep', 'pain_point', 'What happens if you don''t solve this?', '{}', 3, true),
('Sandler', 'discovery_deep', 'pain_point', 'How do you feel about that?', '{}', 4, true),

-- SPIN Selling Questions
('SPIN', 'discovery_surface', 'question', 'What''s your current situation with {topic}?', '{"topic": "this process"}', 1, true),
('SPIN', 'discovery_surface', 'pain_point', 'What difficulties are you experiencing with {topic}?', '{"topic": "your current approach"}', 1, true),
('SPIN', 'discovery_deep', 'pain_point', 'What would be the consequences if this continues?', '{}', 1, true),
('SPIN', 'qualification', 'buying_signal', 'What would solving this problem mean to you?', '{}', 1, true),

-- MEDDIC Qualification
('MEDDIC', 'qualification', 'question', 'What metrics do you use to measure {area}?', '{"area": "success in this area"}', 1, true),
('MEDDIC', 'qualification', 'question', 'Who else would be involved in evaluating a solution?', '{}', 2, true),
('MEDDIC', 'qualification', 'question', 'What''s your process for making decisions like this?', '{}', 3, true),
('MEDDIC', 'qualification', 'question', 'What''s your timeline for addressing this?', '{}', 4, true),
('MEDDIC', 'qualification', 'question', 'What would need to be true for you to move forward?', '{}', 5, true),

-- Challenger Sale
('Challenger', 'presentation', 'insight', 'What we''ve found with companies like yours is {insight}.', '{"insight": "that this approach leads to significant improvements"}', 1, true),
('Challenger', 'objection_handling', 'objection', 'I understand that concern. Let me share what {similar_company} discovered...', '{"similar_company": "a similar company"}', 1, true),
('Challenger', 'objection_handling', 'objection', 'That''s exactly why companies are making this change now.', '{}', 2, true),

-- Closing techniques
('Sandler', 'closing', 'buying_signal', 'Based on what you''ve shared, it sounds like this could help. What questions do you have?', '{}', 1, true),
('SPIN', 'closing', 'buying_signal', 'Given the impact we''ve discussed, what would you like to do next?', '{}', 1, true),
('MEDDIC', 'closing', 'buying_signal', 'Based on your criteria, how does this align with your needs?', '{}', 1, true),
('Challenger', 'closing', 'buying_signal', 'The question isn''t whether you need to act, but how quickly you can get started.', '{}', 1, true),

-- Objection handling responses
('Sandler', 'objection_handling', 'objection', 'I hear you saying {objection}. Help me understand what''s behind that.', '{"objection": "that"}', 1, true),
('SPIN', 'objection_handling', 'objection', 'That''s a fair concern. What specifically worries you about {concern_area}?', '{"concern_area": "that aspect"}', 1, true),
('MEDDIC', 'objection_handling', 'objection', 'Let''s look at how this fits with your decision criteria...', '{}', 1, true),
('Challenger', 'objection_handling', 'objection', 'I''d be surprised if you weren''t thinking that. Most of our clients had the same concern initially.', '{}', 1, true);

-- Update conversation timestamp
UPDATE conversations SET updated_at = NOW() WHERE id = '660e8400-e29b-41d4-a716-446655440000';

-- Create indexes for better performance on sample data
ANALYZE users;
ANALYZE conversations;
ANALYZE messages;
ANALYZE patterns;
ANALYZE suggestions;
ANALYZE analytics;
ANALYZE voice_sessions;
ANALYZE playbook_templates;

-- Display setup summary
SELECT 'Database seeded successfully!' as status,
       (SELECT COUNT(*) FROM users) as users_count,
       (SELECT COUNT(*) FROM conversations) as conversations_count,
       (SELECT COUNT(*) FROM messages) as messages_count,
       (SELECT COUNT(*) FROM patterns) as patterns_count,
       (SELECT COUNT(*) FROM suggestions) as suggestions_count,
       (SELECT COUNT(*) FROM playbook_templates) as templates_count;
