import { DetectedPattern, Message } from '@/types/conversation';

export interface PatternAnalysis {
  patterns: DetectedPattern[];
  summary: {
    totalPatterns: number;
    objections: number;
    buyingSignals: number;
    painPoints: number;
    confidence: number;
  };
  trends: {
    increasing: string[];
    decreasing: string[];
  };
}

// Advanced pattern recognition engine
export class PatternRecognitionEngine {
  private patternHistory: Map<string, DetectedPattern[]> = new Map();
  
  // Comprehensive pattern definitions
  private patterns = {
    objections: {
      budget: [
        /\b(too expensive|costs? too much|can't afford|budget|price|expensive)\b/i,
        /\b(cheaper|less expensive|lower cost|reduce price|discount)\b/i,
        /\b(roi|return on investment|justify|worth it)\b/i
      ],
      timing: [
        /\b(not the right time|timing|too busy|later|next quarter|next year)\b/i,
        /\b(rush|hurry|urgent|immediate|asap)\b/i,
        /\b(delay|postpone|wait|hold off)\b/i
      ],
      authority: [
        /\b(need to think|discuss|talk to|check with|get approval|boss|manager)\b/i,
        /\b(decision maker|authorize|permission|committee|board)\b/i,
        /\b(consult|review|consider|evaluate)\b/i
      ],
      trust: [
        /\b(not sure|don't think|not convinced|hesitant|concerned|skeptical)\b/i,
        /\b(proof|evidence|guarantee|references|testimonials)\b/i,
        /\b(risk|risky|uncertain|doubt|worry)\b/i
      ],
      need: [
        /\b(already have|current solution|existing|satisfied with|working fine)\b/i,
        /\b(don't need|unnecessary|overkill|too much)\b/i,
        /\b(different|alternative|other options)\b/i
      ]
    },
    buyingSignals: {
      interest: [
        /\b(interested|sounds good|that's helpful|I like|we need|we want)\b/i,
        /\b(tell me more|learn more|details|information|explain)\b/i,
        /\b(impressive|excellent|perfect|exactly|ideal)\b/i
      ],
      urgency: [
        /\b(when can|how soon|timeline|start|implement|next steps)\b/i,
        /\b(asap|immediately|urgent|rush|quickly)\b/i,
        /\b(deadline|by when|schedule|calendar)\b/i
      ],
      budget_inquiry: [
        /\b(pricing|cost|investment|budget|proposal|quote|price)\b/i,
        /\b(how much|what does it cost|pricing structure|payment)\b/i,
        /\b(affordable|reasonable|fair price|value)\b/i
      ],
      evaluation: [
        /\b(demo|trial|test|pilot|proof of concept|sample)\b/i,
        /\b(try it|see it|show me|demonstrate|example)\b/i,
        /\b(compare|evaluate|assess|review|analyze)\b/i
      ]
    },
    painPoints: {
      operational: [
        /\b(struggling|difficult|problem|issue|challenge|frustrated)\b/i,
        /\b(broken|not working|failing|issues|problems)\b/i,
        /\b(complicated|complex|confusing|hard to use)\b/i
      ],
      efficiency: [
        /\b(manual|time.consuming|inefficient|slow|tedious)\b/i,
        /\b(automate|streamline|faster|quicker|efficient)\b/i,
        /\b(bottleneck|delay|waiting|stuck)\b/i
      ],
      quality: [
        /\b(errors|mistakes|inaccurate|unreliable|inconsistent)\b/i,
        /\b(quality|accuracy|reliable|consistent|correct)\b/i,
        /\b(wrong|incorrect|bad data|poor quality)\b/i
      ],
      financial: [
        /\b(expensive|costly|waste|losing money|budget constraints)\b/i,
        /\b(save money|reduce costs|cost effective|cheaper)\b/i,
        /\b(revenue|profit|loss|financial impact)\b/i
      ]
    }
  };

  analyzeMessage(message: Message, conversationHistory: Message[] = []): PatternAnalysis {
    const patterns = this.detectPatterns(message.content, message.speaker);
    const messageId = message.id;
    
    // Store patterns for trend analysis
    this.patternHistory.set(messageId, patterns);
    
    // Calculate summary
    const summary = this.calculateSummary(patterns);
    
    // Analyze trends
    const trends = this.analyzeTrends(conversationHistory);
    
    return {
      patterns,
      summary,
      trends
    };
  }

  public detectPatterns(text: string, speaker: 'rep' | 'prospect'): DetectedPattern[] {
    const detectedPatterns: DetectedPattern[] = [];
    const cleanText = text.toLowerCase();

    // Analyze objections
    Object.entries(this.patterns.objections).forEach(([subtype, patterns]) => {
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          const confidence = this.calculateConfidence(matches, text, speaker, 'objection');
          detectedPatterns.push({
            type: 'objection',
            confidence,
            description: `${subtype} objection: "${matches[0]}"`,
            keywords: matches,
            context: subtype
          });
        }
      });
    });

    // Analyze buying signals
    Object.entries(this.patterns.buyingSignals).forEach(([subtype, patterns]) => {
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          const confidence = this.calculateConfidence(matches, text, speaker, 'buying_signal');
          detectedPatterns.push({
            type: 'buying_signal',
            confidence,
            description: `${subtype} signal: "${matches[0]}"`,
            keywords: matches,
            context: subtype
          });
        }
      });
    });

    // Analyze pain points
    Object.entries(this.patterns.painPoints).forEach(([subtype, patterns]) => {
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          const confidence = this.calculateConfidence(matches, text, speaker, 'pain_point');
          detectedPatterns.push({
            type: 'pain_point',
            confidence,
            description: `${subtype} pain: "${matches[0]}"`,
            keywords: matches,
            context: subtype
          });
        }
      });
    });

    // Additional contextual patterns
    this.detectContextualPatterns(text, speaker, detectedPatterns);

    // Remove duplicates and sort by confidence
    return this.deduplicatePatterns(detectedPatterns)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private detectContextualPatterns(text: string, speaker: 'rep' | 'prospect', patterns: DetectedPattern[]): void {
    const cleanText = text.toLowerCase();

    // Question patterns
    if (text.includes('?')) {
      if (speaker === 'prospect') {
        patterns.push({
          type: 'buying_signal',
          confidence: 0.7,
          description: 'Prospect asking questions (engagement)',
          context: 'engagement'
        });
      }
    }

    // Emotional indicators
    const emotionalWords = ['frustrated', 'excited', 'worried', 'happy', 'concerned', 'pleased'];
    emotionalWords.forEach(emotion => {
      if (cleanText.includes(emotion)) {
        const type = ['frustrated', 'worried', 'concerned'].includes(emotion) ? 'pain_point' : 'buying_signal';
        patterns.push({
          type: type as DetectedPattern['type'],
          confidence: 0.6,
          description: `Emotional indicator: ${emotion}`,
          context: 'emotional'
        });
      }
    });

    // Comparison patterns
    if (cleanText.includes('compared to') || cleanText.includes('versus') || cleanText.includes('vs')) {
      patterns.push({
        type: 'buying_signal',
        confidence: 0.8,
        description: 'Comparison language (evaluation stage)',
        context: 'comparison'
      });
    }
  }

  private calculateConfidence(matches: RegExpMatchArray, text: string, speaker: 'rep' | 'prospect', patternType: string): number {
    let confidence = 0.6; // Base confidence

    // Text length factor
    if (text.length > 100) confidence += 0.1;
    if (text.length > 200) confidence += 0.1;

    // Multiple matches
    if (matches.length > 1) confidence += 0.1;

    // Speaker relevance
    if (speaker === 'prospect') {
      if (patternType === 'objection' || patternType === 'pain_point') {
        confidence += 0.2; // Prospects expressing objections/pain are high confidence
      }
    }

    // Context strength
    const strongIndicators = ['struggling', 'problem', 'expensive', 'interested', 'need'];
    if (strongIndicators.some(indicator => text.toLowerCase().includes(indicator))) {
      confidence += 0.15;
    }

    return Math.min(confidence, 0.95);
  }

  private deduplicatePatterns(patterns: DetectedPattern[]): DetectedPattern[] {
    const seen = new Set<string>();
    return patterns.filter(pattern => {
      const key = `${pattern.type}-${pattern.context}-${pattern.keywords?.[0]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateSummary(patterns: DetectedPattern[]) {
    const objections = patterns.filter(p => p.type === 'objection').length;
    const buyingSignals = patterns.filter(p => p.type === 'buying_signal').length;
    const painPoints = patterns.filter(p => p.type === 'pain_point').length;
    const totalPatterns = patterns.length;
    
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0;

    return {
      totalPatterns,
      objections,
      buyingSignals,
      painPoints,
      confidence: avgConfidence
    };
  }

  private analyzeTrends(conversationHistory: Message[]): { increasing: string[]; decreasing: string[] } {
    if (conversationHistory.length < 3) {
      return { increasing: [], decreasing: [] };
    }

    // Analyze pattern frequency over time
    const recentMessages = conversationHistory.slice(-5);
    const olderMessages = conversationHistory.slice(-10, -5);

    const recentPatterns = this.getPatternCounts(recentMessages);
    const olderPatterns = this.getPatternCounts(olderMessages);

    const increasing: string[] = [];
    const decreasing: string[] = [];

    Object.keys(recentPatterns).forEach(patternType => {
      const recentCount = recentPatterns[patternType] || 0;
      const olderCount = olderPatterns[patternType] || 0;
      
      if (recentCount > olderCount) {
        increasing.push(patternType);
      } else if (recentCount < olderCount) {
        decreasing.push(patternType);
      }
    });

    return { increasing, decreasing };
  }

  private getPatternCounts(messages: Message[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    messages.forEach(message => {
      if (message.detected_patterns) {
        message.detected_patterns.forEach(pattern => {
          const key = `${pattern.type}-${pattern.context}`;
          counts[key] = (counts[key] || 0) + 1;
        });
      }
    });

    return counts;
  }

  // Public utility methods
  getPatternsByType(patterns: DetectedPattern[], type: DetectedPattern['type']): DetectedPattern[] {
    return patterns.filter(p => p.type === type);
  }

  getHighConfidencePatterns(patterns: DetectedPattern[], threshold = 0.8): DetectedPattern[] {
    return patterns.filter(p => p.confidence >= threshold);
  }

  groupPatternsByContext(patterns: DetectedPattern[]): Record<string, DetectedPattern[]> {
    const grouped: Record<string, DetectedPattern[]> = {};
    
    patterns.forEach(pattern => {
      const context = pattern.context || 'general';
      if (!grouped[context]) {
        grouped[context] = [];
      }
      grouped[context].push(pattern);
    });

    return grouped;
  }
}

// Export singleton instance
export const patternEngine = new PatternRecognitionEngine();

// Utility functions
export function analyzeConversationPatterns(messages: Message[]): {
  totalPatterns: number;
  patternsByType: Record<string, number>;
  confidenceDistribution: Record<string, number>;
  timeline: Array<{ timestamp: Date; patterns: DetectedPattern[] }>;
} {
  let totalPatterns = 0;
  const patternsByType: Record<string, number> = {};
  const confidenceDistribution: Record<string, number> = { high: 0, medium: 0, low: 0 };
  const timeline: Array<{ timestamp: Date; patterns: DetectedPattern[] }> = [];

  messages.forEach(message => {
    if (message.detected_patterns) {
      totalPatterns += message.detected_patterns.length;
      
      message.detected_patterns.forEach(pattern => {
        // Count by type
        patternsByType[pattern.type] = (patternsByType[pattern.type] || 0) + 1;
        
        // Confidence distribution
        if (pattern.confidence >= 0.8) confidenceDistribution.high++;
        else if (pattern.confidence >= 0.6) confidenceDistribution.medium++;
        else confidenceDistribution.low++;
      });

      timeline.push({
        timestamp: message.timestamp,
        patterns: message.detected_patterns
      });
    }
  });

  return {
    totalPatterns,
    patternsByType,
    confidenceDistribution,
    timeline
  };
}

export function getPatternInsights(patterns: DetectedPattern[]): {
  dominantPattern: string;
  averageConfidence: number;
  recommendations: string[];
} {
  if (patterns.length === 0) {
    return {
      dominantPattern: 'none',
      averageConfidence: 0,
      recommendations: ['Continue the conversation to gather more insights']
    };
  }

  // Find dominant pattern
  const patternCounts: Record<string, number> = {};
  patterns.forEach(pattern => {
    patternCounts[pattern.type] = (patternCounts[pattern.type] || 0) + 1;
  });

  const dominantPattern = Object.entries(patternCounts)
    .sort(([,a], [,b]) => b - a)[0][0];

  // Calculate average confidence
  const averageConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;

  // Generate recommendations
  const recommendations = generateRecommendations(dominantPattern, patterns);

  return {
    dominantPattern,
    averageConfidence,
    recommendations
  };
}

function generateRecommendations(dominantPattern: string, patterns: DetectedPattern[]): string[] {
  const recommendations: string[] = [];

  switch (dominantPattern) {
    case 'objection':
      recommendations.push('Address objections with empathy and evidence');
      recommendations.push('Ask clarifying questions to understand concerns');
      recommendations.push('Provide social proof and testimonials');
      break;
    case 'buying_signal':
      recommendations.push('Capitalize on interest with next steps');
      recommendations.push('Provide detailed information and demos');
      recommendations.push('Move toward closing the conversation');
      break;
    case 'pain_point':
      recommendations.push('Dig deeper into pain points with follow-up questions');
      recommendations.push('Quantify the impact of current challenges');
      recommendations.push('Position your solution as the remedy');
      break;
    default:
      recommendations.push('Continue discovery to uncover more insights');
      recommendations.push('Ask open-ended questions to encourage dialogue');
  }

  return recommendations;
}
