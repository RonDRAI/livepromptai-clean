import { DetectedPattern, SpeechRecognitionResult } from '@/types/conversation';

// Speaker detection patterns
const REP_PATTERNS = [
  // Questions and discovery
  /\b(can you|could you|would you|tell me about|walk me through|help me understand|what|how|when|where|why)\b/i,
  // Professional language
  /\b(appreciate|understand|solution|process|workflow|challenge|opportunity|value|benefit)\b/i,
  // Closing and next steps
  /\b(next steps|follow up|schedule|meeting|demo|proposal|contract|agreement)\b/i,
  // Empathy and acknowledgment
  /\b(I see|I understand|that makes sense|absolutely|definitely|certainly)\b/i,
];

const PROSPECT_PATTERNS = [
  // Pain points and challenges
  /\b(struggling|difficult|problem|issue|challenge|frustrated|concerned|worried)\b/i,
  // Current state descriptions
  /\b(currently|right now|at the moment|we have|we use|we're using|our process)\b/i,
  // Objections and concerns
  /\b(expensive|cost|budget|price|not sure|hesitant|concerned about|worried about)\b/i,
  // Interest and buying signals
  /\b(interested|sounds good|that's helpful|I like|we need|we want|when can|how soon)\b/i,
];

export function detectSpeaker(text: string, context?: { previousSpeaker?: 'rep' | 'prospect' }): 'rep' | 'prospect' {
  const cleanText = text.toLowerCase().trim();
  
  // Empty or very short text defaults to previous speaker or rep
  if (cleanText.length < 10) {
    return context?.previousSpeaker || 'rep';
  }

  let repScore = 0;
  let prospectScore = 0;

  // Check rep patterns
  REP_PATTERNS.forEach(pattern => {
    const matches = cleanText.match(pattern);
    if (matches) {
      repScore += matches.length;
    }
  });

  // Check prospect patterns
  PROSPECT_PATTERNS.forEach(pattern => {
    const matches = cleanText.match(pattern);
    if (matches) {
      prospectScore += matches.length;
    }
  });

  // Additional heuristics
  if (cleanText.includes('?')) repScore += 2; // Questions often from reps
  if (cleanText.startsWith('we ') || cleanText.startsWith('our ')) prospectScore += 2;
  if (cleanText.includes('thanks for') || cleanText.includes('appreciate')) repScore += 1;
  if (cleanText.includes('struggling') || cleanText.includes('problem')) prospectScore += 2;

  // Determine speaker with confidence threshold
  const totalScore = repScore + prospectScore;
  if (totalScore === 0) {
    return context?.previousSpeaker || 'rep';
  }

  const confidence = Math.max(repScore, prospectScore) / totalScore;
  
  // If confidence is low, stick with previous speaker
  if (confidence < 0.6 && context?.previousSpeaker) {
    return context.previousSpeaker;
  }

  return repScore > prospectScore ? 'rep' : 'prospect';
}

export function detectPatterns(text: string, speaker: 'rep' | 'prospect'): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const cleanText = text.toLowerCase();

  // Objection patterns
  const objectionPatterns = [
    { pattern: /\b(too expensive|costs? too much|budget|price|afford)\b/i, type: 'objection', subtype: 'budget' },
    { pattern: /\b(not the right time|timing|too busy|later|next quarter|next year)\b/i, type: 'objection', subtype: 'timing' },
    { pattern: /\b(need to think|discuss|talk to|check with|get approval)\b/i, type: 'objection', subtype: 'authority' },
    { pattern: /\b(not sure|don't think|not convinced|hesitant|concerned)\b/i, type: 'objection', subtype: 'trust' },
    { pattern: /\b(already have|current solution|existing|satisfied with)\b/i, type: 'objection', subtype: 'need' },
  ];

  // Buying signal patterns
  const buyingSignalPatterns = [
    { pattern: /\b(interested|sounds good|that's helpful|I like|we need|we want)\b/i, type: 'buying_signal', subtype: 'interest' },
    { pattern: /\b(when can|how soon|timeline|start|implement|next steps)\b/i, type: 'buying_signal', subtype: 'urgency' },
    { pattern: /\b(pricing|cost|investment|budget|proposal|quote)\b/i, type: 'buying_signal', subtype: 'budget_inquiry' },
    { pattern: /\b(demo|trial|test|pilot|proof of concept)\b/i, type: 'buying_signal', subtype: 'evaluation' },
  ];

  // Pain point patterns
  const painPointPatterns = [
    { pattern: /\b(struggling|difficult|problem|issue|challenge|frustrated)\b/i, type: 'pain_point', subtype: 'operational' },
    { pattern: /\b(manual|time.consuming|inefficient|slow|tedious)\b/i, type: 'pain_point', subtype: 'efficiency' },
    { pattern: /\b(errors|mistakes|inaccurate|unreliable|inconsistent)\b/i, type: 'pain_point', subtype: 'quality' },
    { pattern: /\b(expensive|costly|waste|losing money|budget)\b/i, type: 'pain_point', subtype: 'financial' },
  ];

  // Check all patterns
  const allPatterns = [...objectionPatterns, ...buyingSignalPatterns, ...painPointPatterns];
  
  allPatterns.forEach(({ pattern, type, subtype }) => {
    const matches = text.match(pattern);
    if (matches) {
      const confidence = calculatePatternConfidence(matches, text, speaker);
      patterns.push({
        type: type as DetectedPattern['type'],
        confidence,
        description: `${subtype} detected: "${matches[0]}"`,
        keywords: matches,
        context: subtype
      });
    }
  });

  // Additional context-based patterns
  if (speaker === 'prospect') {
    // Questions from prospects often indicate interest
    if (text.includes('?') && (cleanText.includes('how') || cleanText.includes('what') || cleanText.includes('when'))) {
      patterns.push({
        type: 'buying_signal',
        confidence: 0.7,
        description: 'Prospect asking clarifying questions',
        context: 'engagement'
      });
    }
  }

  return patterns;
}

function calculatePatternConfidence(matches: RegExpMatchArray, text: string, speaker: 'rep' | 'prospect'): number {
  let confidence = 0.6; // Base confidence
  
  // Increase confidence based on context
  if (matches.length > 1) confidence += 0.1;
  if (text.length > 50) confidence += 0.1; // Longer text often more reliable
  
  // Speaker-specific adjustments
  if (speaker === 'prospect') {
    // Prospects expressing pain points or objections are high confidence
    if (text.toLowerCase().includes('problem') || text.toLowerCase().includes('struggling')) {
      confidence += 0.2;
    }
  }
  
  return Math.min(confidence, 0.95); // Cap at 95%
}

export function processSpeechResult(result: SpeechRecognitionResult, context?: { previousSpeaker?: 'rep' | 'prospect' }): {
  speaker: 'rep' | 'prospect';
  patterns: DetectedPattern[];
  confidence: number;
} {
  const speaker = detectSpeaker(result.transcript, context);
  const patterns = detectPatterns(result.transcript, speaker);
  
  return {
    speaker,
    patterns,
    confidence: result.confidence
  };
}

// Voice recognition utilities
export function initializeSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null;
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  return recognition;
}

export function calculateSpeakerAccuracy(predictions: Array<{ predicted: 'rep' | 'prospect', actual: 'rep' | 'prospect' }>): number {
  if (predictions.length === 0) return 0;
  
  const correct = predictions.filter(p => p.predicted === p.actual).length;
  return (correct / predictions.length) * 100;
}
