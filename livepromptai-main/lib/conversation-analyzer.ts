import { Message, DetectedPattern, ConversationStage, AIAnalysis } from '@/types/conversation';
import { patternEngine } from './pattern-recognition';
import { playbookEngine } from './playbook-engine';

export interface ConversationAnalysis {
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  engagement_score: number;
  stage_progression: {
    current_stage: string;
    progress_percentage: number;
    next_stage: string;
    stage_confidence: number;
  };
  pattern_summary: {
    total_patterns: number;
    dominant_pattern: string;
    pattern_distribution: Record<string, number>;
  };
  recommendations: {
    immediate_actions: string[];
    strategic_suggestions: string[];
    risk_factors: string[];
  };
  conversation_health: {
    score: number;
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
  };
}

export class ConversationAnalyzer {
  private conversationStages: ConversationStage[] = [
    {
      id: 'discovery_surface',
      name: 'Discovery - Surface',
      description: 'Initial discovery and rapport building',
      completed: false,
      current: true,
      progress: 0
    },
    {
      id: 'discovery_deep',
      name: 'Discovery - Deep',
      description: 'Deep pain discovery and qualification',
      completed: false,
      current: false,
      progress: 0
    },
    {
      id: 'qualification',
      name: 'Qualification',
      description: 'Budget, authority, need, timeline qualification',
      completed: false,
      current: false,
      progress: 0
    },
    {
      id: 'presentation',
      name: 'Presentation',
      description: 'Solution presentation and demonstration',
      completed: false,
      current: false,
      progress: 0
    },
    {
      id: 'objection_handling',
      name: 'Objection Handling',
      description: 'Address concerns and objections',
      completed: false,
      current: false,
      progress: 0
    },
    {
      id: 'closing',
      name: 'Closing',
      description: 'Secure commitment and next steps',
      completed: false,
      current: false,
      progress: 0
    }
  ];

  analyzeConversation(messages: Message[]): ConversationAnalysis {
    if (messages.length === 0) {
      return this.getEmptyAnalysis();
    }

    // Analyze overall sentiment
    const overall_sentiment = this.calculateOverallSentiment(messages);
    
    // Calculate engagement score
    const engagement_score = this.calculateEngagementScore(messages);
    
    // Determine stage progression
    const stage_progression = this.analyzeStageProgression(messages);
    
    // Analyze patterns
    const pattern_summary = this.analyzePatterns(messages);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(messages, pattern_summary);
    
    // Calculate conversation health
    const conversation_health = this.calculateConversationHealth(messages, pattern_summary);

    return {
      overall_sentiment,
      engagement_score,
      stage_progression,
      pattern_summary,
      recommendations,
      conversation_health
    };
  }

  private calculateOverallSentiment(messages: Message[]): 'positive' | 'negative' | 'neutral' {
    let positiveScore = 0;
    let negativeScore = 0;
    let totalMessages = 0;

    messages.forEach(message => {
      if (message.ai_analysis?.sentiment) {
        totalMessages++;
        switch (message.ai_analysis.sentiment) {
          case 'positive':
            positiveScore++;
            break;
          case 'negative':
            negativeScore++;
            break;
        }
      }
    });

    if (totalMessages === 0) return 'neutral';

    const positiveRatio = positiveScore / totalMessages;
    const negativeRatio = negativeScore / totalMessages;

    if (positiveRatio > 0.6) return 'positive';
    if (negativeRatio > 0.4) return 'negative';
    return 'neutral';
  }

  private calculateEngagementScore(messages: Message[]): number {
    if (messages.length === 0) return 0;

    let totalEngagement = 0;
    let scoredMessages = 0;

    messages.forEach(message => {
      if (message.ai_analysis?.engagement_score !== undefined) {
        totalEngagement += message.ai_analysis.engagement_score;
        scoredMessages++;
      }
    });

    if (scoredMessages === 0) {
      // Fallback calculation based on message characteristics
      return this.calculateFallbackEngagement(messages);
    }

    return totalEngagement / scoredMessages;
  }

  private calculateFallbackEngagement(messages: Message[]): number {
    let score = 0.5; // Base score

    // Question engagement
    const questionsAsked = messages.filter(m => m.content.includes('?')).length;
    score += Math.min(questionsAsked * 0.1, 0.3);

    // Response length (longer responses often indicate engagement)
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    if (avgLength > 100) score += 0.1;
    if (avgLength > 200) score += 0.1;

    // Pattern diversity
    const allPatterns = messages.flatMap(m => m.detected_patterns || []);
    const uniquePatternTypes = new Set(allPatterns.map(p => p.type));
    score += Math.min(uniquePatternTypes.size * 0.05, 0.2);

    return Math.min(score, 1.0);
  }

  public analyzeStageProgression(messages: Message[]): ConversationAnalysis['stage_progression'] {
    const allPatterns = messages.flatMap(m => m.detected_patterns || []);
    
    // Determine current stage based on patterns and conversation flow
    const currentStage = this.determineCurrentStage(messages, allPatterns);
    const nextStage = playbookEngine.determineNextStage(currentStage, allPatterns);
    
    // Calculate progress within current stage
    const progress_percentage = this.calculateStageProgress(currentStage, messages);
    
    // Calculate confidence in stage determination
    const stage_confidence = this.calculateStageConfidence(currentStage, allPatterns);

    return {
      current_stage: currentStage,
      progress_percentage,
      next_stage: nextStage,
      stage_confidence
    };
  }

  private determineCurrentStage(messages: Message[], patterns: DetectedPattern[]): string {
    // Stage determination logic based on conversation content and patterns
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Check for closing indicators
    if (conversationText.includes('next steps') || conversationText.includes('move forward') || 
        conversationText.includes('when can we start')) {
      return 'closing';
    }
    
    // Check for objection handling
    const objections = patterns.filter(p => p.type === 'objection');
    if (objections.length > 0) {
      return 'objection_handling';
    }
    
    // Check for presentation stage
    if (conversationText.includes('demo') || conversationText.includes('show you') || 
        conversationText.includes('solution') || conversationText.includes('features')) {
      return 'presentation';
    }
    
    // Check for qualification
    if (conversationText.includes('budget') || conversationText.includes('timeline') || 
        conversationText.includes('decision') || conversationText.includes('authority')) {
      return 'qualification';
    }
    
    // Check for deep discovery
    const painPoints = patterns.filter(p => p.type === 'pain_point');
    if (painPoints.length > 2 || conversationText.includes('impact') || 
        conversationText.includes('cost') || conversationText.includes('affect')) {
      return 'discovery_deep';
    }
    
    // Default to surface discovery
    return 'discovery_surface';
  }

  private calculateStageProgress(stage: string, messages: Message[]): number {
    const stageRequirements = {
      discovery_surface: ['rapport', 'current_state', 'initial_pain'],
      discovery_deep: ['pain_quantified', 'impact_understood', 'urgency'],
      qualification: ['budget', 'authority', 'timeline', 'decision_process'],
      presentation: ['solution_presented', 'benefits_shown', 'questions_answered'],
      objection_handling: ['concerns_addressed', 'proof_provided', 'confidence_restored'],
      closing: ['commitment_requested', 'next_steps_defined', 'timeline_set']
    };

    const requirements = stageRequirements[stage as keyof typeof stageRequirements] || [];
    if (requirements.length === 0) return 100;

    // Simple heuristic: progress based on message count and patterns
    const messageCount = messages.length;
    const baseProgress = Math.min((messageCount / 10) * 100, 80); // Max 80% from message count
    
    // Add progress from detected patterns
    const patterns = messages.flatMap(m => m.detected_patterns || []);
    const patternBonus = Math.min(patterns.length * 5, 20); // Max 20% from patterns
    
    return Math.min(baseProgress + patternBonus, 100);
  }

  private calculateStageConfidence(stage: string, patterns: DetectedPattern[]): number {
    // Base confidence
    let confidence = 0.6;
    
    // Increase confidence based on relevant patterns
    const stagePatterns = {
      discovery_surface: ['greeting', 'question'],
      discovery_deep: ['pain_point'],
      qualification: ['budget', 'authority', 'timeline'],
      presentation: ['interest', 'feature_request'],
      objection_handling: ['objection', 'concern'],
      closing: ['buying_signal', 'urgency']
    };

    const relevantPatterns = stagePatterns[stage as keyof typeof stagePatterns] || [];
    patterns.forEach(pattern => {
      if (relevantPatterns.includes(pattern.type) || 
          relevantPatterns.some(rp => pattern.context?.includes(rp))) {
        confidence += 0.1 * pattern.confidence;
      }
    });

    return Math.min(confidence, 0.95);
  }

  private analyzePatterns(messages: Message[]): ConversationAnalysis['pattern_summary'] {
    const allPatterns = messages.flatMap(m => m.detected_patterns || []);
    
    if (allPatterns.length === 0) {
      return {
        total_patterns: 0,
        dominant_pattern: 'none',
        pattern_distribution: {}
      };
    }

    // Count patterns by type
    const pattern_distribution: Record<string, number> = {};
    allPatterns.forEach(pattern => {
      pattern_distribution[pattern.type] = (pattern_distribution[pattern.type] || 0) + 1;
    });

    // Find dominant pattern
    const dominant_pattern = Object.entries(pattern_distribution)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      total_patterns: allPatterns.length,
      dominant_pattern,
      pattern_distribution
    };
  }

  private generateRecommendations(
    messages: Message[], 
    patternSummary: ConversationAnalysis['pattern_summary']
  ): ConversationAnalysis['recommendations'] {
    const immediate_actions: string[] = [];
    const strategic_suggestions: string[] = [];
    const risk_factors: string[] = [];

    // Analyze based on dominant pattern
    switch (patternSummary.dominant_pattern) {
      case 'objection':
        immediate_actions.push('Address the primary objection with empathy');
        immediate_actions.push('Ask clarifying questions to understand the concern');
        strategic_suggestions.push('Prepare objection handling materials');
        risk_factors.push('Multiple unaddressed objections may stall the deal');
        break;
        
      case 'pain_point':
        immediate_actions.push('Dig deeper into the pain with follow-up questions');
        immediate_actions.push('Quantify the impact of the pain');
        strategic_suggestions.push('Position your solution as the remedy');
        break;
        
      case 'buying_signal':
        immediate_actions.push('Capitalize on interest with next steps');
        immediate_actions.push('Provide detailed information or demo');
        strategic_suggestions.push('Move toward closing the conversation');
        break;
        
      default:
        immediate_actions.push('Continue discovery with open-ended questions');
        strategic_suggestions.push('Build rapport and trust');
    }

    // Analyze conversation length and engagement
    if (messages.length < 5) {
      strategic_suggestions.push('Extend the conversation to gather more insights');
    }

    if (messages.length > 20) {
      risk_factors.push('Long conversation may indicate lack of clear direction');
      immediate_actions.push('Summarize key points and suggest next steps');
    }

    // Check for prospect engagement
    const prospectMessages = messages.filter(m => m.speaker === 'prospect');
    if (prospectMessages.length < messages.length * 0.3) {
      risk_factors.push('Low prospect engagement - mostly one-sided conversation');
      immediate_actions.push('Ask more engaging questions to encourage participation');
    }

    return {
      immediate_actions,
      strategic_suggestions,
      risk_factors
    };
  }

  private calculateConversationHealth(
    messages: Message[], 
    patternSummary: ConversationAnalysis['pattern_summary']
  ): ConversationAnalysis['conversation_health'] {
    const factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }> = [];

    let score = 0.5; // Base score

    // Analyze message balance
    const repMessages = messages.filter(m => m.speaker === 'rep').length;
    const prospectMessages = messages.filter(m => m.speaker === 'prospect').length;
    const balance = prospectMessages / (repMessages + prospectMessages);

    if (balance > 0.3 && balance < 0.7) {
      score += 0.2;
      factors.push({
        factor: 'Message Balance',
        impact: 'positive',
        description: 'Good balance between rep and prospect participation'
      });
    } else if (balance < 0.2) {
      score -= 0.2;
      factors.push({
        factor: 'Message Balance',
        impact: 'negative',
        description: 'Conversation is too one-sided - prospect not engaged enough'
      });
    }

    // Analyze pattern diversity
    const patternTypes = Object.keys(patternSummary.pattern_distribution).length;
    if (patternTypes > 2) {
      score += 0.15;
      factors.push({
        factor: 'Pattern Diversity',
        impact: 'positive',
        description: 'Multiple types of patterns detected - rich conversation'
      });
    }

    // Check for buying signals
    const buyingSignals = patternSummary.pattern_distribution['buying_signal'] || 0;
    if (buyingSignals > 0) {
      score += 0.2;
      factors.push({
        factor: 'Buying Signals',
        impact: 'positive',
        description: `${buyingSignals} buying signals detected`
      });
    }

    // Check for objections
    const objections = patternSummary.pattern_distribution['objection'] || 0;
    if (objections > 2) {
      score -= 0.15;
      factors.push({
        factor: 'Multiple Objections',
        impact: 'negative',
        description: `${objections} objections need to be addressed`
      });
    } else if (objections === 1) {
      factors.push({
        factor: 'Single Objection',
        impact: 'neutral',
        description: 'One objection identified - normal part of sales process'
      });
    }

    // Check conversation length
    if (messages.length > 15) {
      factors.push({
        factor: 'Conversation Length',
        impact: 'positive',
        description: 'Substantial conversation with good depth'
      });
      score += 0.1;
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      factors
    };
  }

  private getEmptyAnalysis(): ConversationAnalysis {
    return {
      overall_sentiment: 'neutral',
      engagement_score: 0,
      stage_progression: {
        current_stage: 'discovery_surface',
        progress_percentage: 0,
        next_stage: 'discovery_deep',
        stage_confidence: 0.6
      },
      pattern_summary: {
        total_patterns: 0,
        dominant_pattern: 'none',
        pattern_distribution: {}
      },
      recommendations: {
        immediate_actions: ['Start the conversation with an engaging question'],
        strategic_suggestions: ['Build rapport and establish trust'],
        risk_factors: []
      },
      conversation_health: {
        score: 0.5,
        factors: []
      }
    };
  }

  // Public utility methods
  getConversationStages(): ConversationStage[] {
    return [...this.conversationStages];
  }

  updateStageProgress(stageId: string, progress: number): void {
    const stage = this.conversationStages.find(s => s.id === stageId);
    if (stage) {
      stage.progress = Math.max(0, Math.min(100, progress));
      if (progress >= 100) {
        stage.completed = true;
      }
    }
  }

  setCurrentStage(stageId: string): void {
    this.conversationStages.forEach(stage => {
      stage.current = stage.id === stageId;
    });
  }
}

// Export singleton instance
export const conversationAnalyzer = new ConversationAnalyzer();

// Utility functions
export function generateAIAnalysis(message: Message): AIAnalysis {
  const content = message.content.toLowerCase();
  
  // Simple sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'perfect', 'love', 'like', 'interested', 'helpful'];
  const negativeWords = ['bad', 'terrible', 'hate', 'dislike', 'problem', 'issue', 'concerned', 'worried'];
  
  let sentiment: AIAnalysis['sentiment'] = 'neutral';
  const positiveCount = positiveWords.filter(word => content.includes(word)).length;
  const negativeCount = negativeWords.filter(word => content.includes(word)).length;
  
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';
  
  // Calculate engagement score
  let engagement_score = 0.5;
  if (message.content.length > 50) engagement_score += 0.2;
  if (message.content.includes('?')) engagement_score += 0.1;
  if (message.speaker === 'prospect') engagement_score += 0.2;
  
  // Calculate urgency level
  const urgencyWords = ['urgent', 'asap', 'immediately', 'rush', 'deadline'];
  const urgency_level = urgencyWords.some(word => content.includes(word)) ? 'high' : 'low';
  
  // Calculate buying intent
  const buyingWords = ['buy', 'purchase', 'invest', 'budget', 'price', 'cost', 'when', 'timeline'];
  const buying_intent = Math.min(buyingWords.filter(word => content.includes(word)).length * 0.2, 1.0);
  
  return {
    sentiment,
    engagement_score: Math.min(engagement_score, 1.0),
    urgency_level,
    buying_intent
  };
}

export function calculateConversationMetrics(messages: Message[]): {
  duration_estimate: number; // in minutes
  message_frequency: number; // messages per minute
  rep_talk_time: number; // percentage
  prospect_talk_time: number; // percentage
  question_ratio: number; // questions per total messages
} {
  if (messages.length === 0) {
    return {
      duration_estimate: 0,
      message_frequency: 0,
      rep_talk_time: 0,
      prospect_talk_time: 0,
      question_ratio: 0
    };
  }

  // Estimate duration (rough calculation)
  const duration_estimate = Math.max(messages.length * 0.5, 5); // Minimum 5 minutes
  
  const message_frequency = messages.length / duration_estimate;
  
  // Calculate talk time
  const repMessages = messages.filter(m => m.speaker === 'rep');
  const prospectMessages = messages.filter(m => m.speaker === 'prospect');
  
  const rep_talk_time = (repMessages.length / messages.length) * 100;
  const prospect_talk_time = (prospectMessages.length / messages.length) * 100;
  
  // Calculate question ratio
  const questionsAsked = messages.filter(m => m.content.includes('?')).length;
  const question_ratio = questionsAsked / messages.length;
  
  return {
    duration_estimate,
    message_frequency,
    rep_talk_time,
    prospect_talk_time,
    question_ratio
  };
}
