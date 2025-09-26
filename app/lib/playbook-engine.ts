import { PlaybookSuggestion, DetectedPattern, ConversationStage } from '@/types/conversation';

export interface PlaybookFramework {
  id: string;
  name: string;
  description: string;
  stages: string[];
  techniques: Record<string, PlaybookTechnique>;
}

export interface PlaybookTechnique {
  name: string;
  description: string;
  questions: string[];
  responses: string[];
  triggers: string[];
  stage: string;
}

// Unified Playbook Engine combining multiple sales methodologies
export class UnifiedPlaybookEngine {
  private frameworks: Record<string, PlaybookFramework> = {
    sandler: {
      id: 'sandler',
      name: 'Sandler Selling System',
      description: 'Pain-focused selling methodology',
      stages: ['bonding_rapport', 'up_front_contract', 'pain', 'budget', 'decision', 'fulfillment', 'post_sell'],
      techniques: {
        pain_funnel: {
          name: 'Pain Funnel',
          description: 'Systematic approach to uncovering pain',
          questions: [
            "Can you tell me more about that?",
            "How long has this been a problem?",
            "What have you tried to do about it?",
            "How much is this costing you?",
            "What happens if you don't fix this?"
          ],
          responses: [
            "That sounds frustrating. Can you help me understand the impact?",
            "I can see why that would be concerning. What's driving that issue?",
            "It sounds like this is really affecting your team. How so?"
          ],
          triggers: ['problem', 'issue', 'challenge', 'struggling', 'difficult'],
          stage: 'pain'
        },
        upfront_contract: {
          name: 'Up-Front Contract',
          description: 'Setting clear expectations',
          questions: [
            "What would you like to accomplish in our time together?",
            "How will you know if this meeting was worthwhile?",
            "What questions do you have for me?"
          ],
          responses: [
            "Let me suggest an agenda for our time together...",
            "Here's what I'd like to cover, does that work for you?"
          ],
          triggers: ['meeting', 'agenda', 'time', 'expectations'],
          stage: 'up_front_contract'
        }
      }
    },
    spin: {
      id: 'spin',
      name: 'SPIN Selling',
      description: 'Situation, Problem, Implication, Need-payoff methodology',
      stages: ['situation', 'problem', 'implication', 'need_payoff', 'close'],
      techniques: {
        situation_questions: {
          name: 'Situation Questions',
          description: 'Understanding current state',
          questions: [
            "Can you walk me through your current process?",
            "How are you handling this today?",
            "What tools are you currently using?",
            "Who's involved in this process?"
          ],
          responses: [
            "That's helpful context. Let me understand...",
            "I see. Can you tell me more about how that works?"
          ],
          triggers: ['current', 'process', 'workflow', 'today', 'now'],
          stage: 'situation'
        },
        problem_questions: {
          name: 'Problem Questions',
          description: 'Identifying difficulties and dissatisfactions',
          questions: [
            "What challenges are you facing with that approach?",
            "Are you satisfied with how that's working?",
            "What problems does that create?",
            "Where do you see gaps in your current solution?"
          ],
          responses: [
            "That does sound problematic. How often does that happen?",
            "I can see how that would be frustrating."
          ],
          triggers: ['problem', 'challenge', 'issue', 'difficulty', 'gap'],
          stage: 'problem'
        },
        implication_questions: {
          name: 'Implication Questions',
          description: 'Exploring consequences of problems',
          questions: [
            "What impact does that have on your team?",
            "How does that affect your customers?",
            "What happens if this continues?",
            "How much time does that waste?"
          ],
          responses: [
            "That's a significant impact. Have you calculated the cost?",
            "It sounds like this is affecting multiple areas."
          ],
          triggers: ['impact', 'affect', 'consequence', 'result', 'outcome'],
          stage: 'implication'
        },
        need_payoff_questions: {
          name: 'Need-Payoff Questions',
          description: 'Getting buyer to state benefits',
          questions: [
            "How would solving this help your team?",
            "What would be the value of fixing this?",
            "How important is it to resolve this?",
            "What would success look like?"
          ],
          responses: [
            "That's exactly what our solution provides.",
            "Those are the benefits our clients typically see."
          ],
          triggers: ['value', 'benefit', 'help', 'solve', 'success'],
          stage: 'need_payoff'
        }
      }
    },
    meddic: {
      id: 'meddic',
      name: 'MEDDIC',
      description: 'Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion',
      stages: ['metrics', 'economic_buyer', 'decision_criteria', 'decision_process', 'identify_pain', 'champion'],
      techniques: {
        metrics_qualification: {
          name: 'Metrics Qualification',
          description: 'Quantifying the opportunity',
          questions: [
            "What metrics are you trying to improve?",
            "How do you measure success in this area?",
            "What's the current baseline?",
            "What's your target improvement?"
          ],
          responses: [
            "Those are important metrics. Let's explore how we can impact them.",
            "I understand the measurement challenge."
          ],
          triggers: ['metrics', 'measure', 'kpi', 'target', 'goal'],
          stage: 'metrics'
        },
        economic_buyer: {
          name: 'Economic Buyer Identification',
          description: 'Finding who controls the budget',
          questions: [
            "Who typically makes decisions about investments like this?",
            "Who controls the budget for this initiative?",
            "Who would need to approve a purchase?",
            "Who else would be involved in this decision?"
          ],
          responses: [
            "It's important we involve the right stakeholders.",
            "I'd like to understand the decision-making process."
          ],
          triggers: ['budget', 'decision', 'approve', 'stakeholder', 'authority'],
          stage: 'economic_buyer'
        }
      }
    },
    challenger: {
      id: 'challenger',
      name: 'Challenger Sale',
      description: 'Teach, Tailor, Take control approach',
      stages: ['teach', 'tailor', 'take_control'],
      techniques: {
        commercial_teaching: {
          name: 'Commercial Teaching',
          description: 'Teaching insights that lead to your solution',
          questions: [
            "Have you considered the hidden costs of your current approach?",
            "Are you aware of how industry leaders are handling this?",
            "What if I told you there's a better way?"
          ],
          responses: [
            "Let me share what we're seeing across the industry...",
            "Here's an insight that might surprise you...",
            "Most companies don't realize that..."
          ],
          triggers: ['insight', 'industry', 'trend', 'best practice', 'research'],
          stage: 'teach'
        },
        tailored_message: {
          name: 'Tailored Messaging',
          description: 'Customizing insights to specific stakeholder',
          questions: [
            "From your perspective as [role], how does this impact you?",
            "What matters most to you in this area?",
            "How would your team benefit from this?"
          ],
          responses: [
            "For someone in your position, this typically means...",
            "Given your role, you're probably concerned about..."
          ],
          triggers: ['role', 'position', 'responsibility', 'concern', 'priority'],
          stage: 'tailor'
        }
      }
    }
  };

  generateSuggestions(
    patterns: DetectedPattern[],
    currentStage: string,
    conversationContext: string[]
  ): PlaybookSuggestion[] {
    const suggestions: PlaybookSuggestion[] = [];

    // Generate suggestions from each framework
    Object.values(this.frameworks).forEach(framework => {
      const frameworkSuggestions = this.generateFrameworkSuggestions(
        framework,
        patterns,
        currentStage,
        conversationContext
      );
      suggestions.push(...frameworkSuggestions);
    });

    // Sort by confidence and relevance
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6); // Return top 6 suggestions
  }

  private generateFrameworkSuggestions(
    framework: PlaybookFramework,
    patterns: DetectedPattern[],
    currentStage: string,
    conversationContext: string[]
  ): PlaybookSuggestion[] {
    const suggestions: PlaybookSuggestion[] = [];

    Object.values(framework.techniques).forEach(technique => {
      // Check if technique is relevant to current patterns
      const relevanceScore = this.calculateRelevance(technique, patterns, conversationContext);
      
      if (relevanceScore > 0.3) {
        // Generate question suggestions
        technique.questions.forEach(question => {
          suggestions.push({
            id: `${framework.id}-${technique.name}-q-${Date.now()}`,
            framework: framework.name as PlaybookSuggestion['framework'],
            type: 'question',
            content: question,
            confidence: relevanceScore,
            context: technique.description,
            stage: technique.stage,
            reasoning: `Based on detected ${patterns.map(p => p.type).join(', ')} patterns`
          });
        });

        // Generate response suggestions
        technique.responses.forEach(response => {
          suggestions.push({
            id: `${framework.id}-${technique.name}-r-${Date.now()}`,
            framework: framework.name as PlaybookSuggestion['framework'],
            type: 'response',
            content: response,
            confidence: relevanceScore * 0.9, // Slightly lower confidence for responses
            context: technique.description,
            stage: technique.stage,
            reasoning: `Appropriate response for ${technique.name}`
          });
        });
      }
    });

    return suggestions;
  }

  private calculateRelevance(
    technique: PlaybookTechnique,
    patterns: DetectedPattern[],
    conversationContext: string[]
  ): number {
    let relevance = 0.1; // Base relevance

    // Check trigger word matches
    const contextText = conversationContext.join(' ').toLowerCase();
    technique.triggers.forEach(trigger => {
      if (contextText.includes(trigger)) {
        relevance += 0.2;
      }
    });

    // Check pattern matches
    patterns.forEach(pattern => {
      if (technique.triggers.some(trigger => 
        pattern.description.toLowerCase().includes(trigger) ||
        pattern.keywords?.some(keyword => keyword.toLowerCase().includes(trigger))
      )) {
        relevance += 0.3 * pattern.confidence;
      }
    });

    // Boost relevance for high-confidence patterns
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
    if (highConfidencePatterns.length > 0) {
      relevance += 0.2;
    }

    return Math.min(relevance, 1.0);
  }

  getFrameworkByName(name: string): PlaybookFramework | undefined {
    return Object.values(this.frameworks).find(f => f.name === name);
  }

  getAllFrameworks(): PlaybookFramework[] {
    return Object.values(this.frameworks);
  }

  // Objection handling
  generateObjectionResponse(objection: DetectedPattern): PlaybookSuggestion[] {
    const responses: PlaybookSuggestion[] = [];

    const objectionResponses = {
      budget: [
        "I understand budget is a concern. Can you help me understand what you're comparing this investment to?",
        "What would need to happen for this to fit within your budget?",
        "Let's explore the cost of not solving this problem."
      ],
      timing: [
        "I appreciate you being upfront about timing. What would need to change for this to become a priority?",
        "Help me understand what's driving the current timeline.",
        "What happens if you wait to address this?"
      ],
      authority: [
        "That makes sense. Who else would be involved in a decision like this?",
        "What information would be helpful for that conversation?",
        "How do decisions like this typically get made at your company?"
      ],
      trust: [
        "I can understand that concern. What would help you feel more confident?",
        "What questions can I answer to address that hesitation?",
        "Would it be helpful to speak with some of our current clients?"
      ],
      need: [
        "It sounds like your current solution is working well. What would make you consider a change?",
        "Help me understand what's working about your current approach.",
        "What would an ideal solution look like for you?"
      ]
    };

    const context = objection.context || 'general';
    const responses_for_context = objectionResponses[context as keyof typeof objectionResponses] || objectionResponses.trust;

    responses_for_context.forEach((response, index) => {
      responses.push({
        id: `objection-${context}-${index}`,
        framework: 'Sandler',
        type: 'objection_handler',
        content: response,
        confidence: 0.8,
        context: `Handling ${context} objection`,
        stage: 'objection_handling',
        reasoning: `Response to ${objection.description}`
      });
    });

    return responses;
  }

  // Stage progression logic
  determineNextStage(currentStage: string, patterns: DetectedPattern[]): string {
    const stageProgression = {
      'discovery_surface': 'discovery_deep',
      'discovery_deep': 'qualification',
      'qualification': 'presentation',
      'presentation': 'objection_handling',
      'objection_handling': 'closing',
      'closing': 'follow_up'
    };

    // Check if patterns suggest skipping stages
    const buyingSignals = patterns.filter(p => p.type === 'buying_signal');
    const objections = patterns.filter(p => p.type === 'objection');

    if (objections.length > 0) {
      return 'objection_handling';
    }

    if (buyingSignals.length > 2 && currentStage === 'discovery_surface') {
      return 'qualification'; // Skip deep discovery if strong buying signals
    }

    return stageProgression[currentStage as keyof typeof stageProgression] || currentStage;
  }
}

// Export singleton instance
export const playbookEngine = new UnifiedPlaybookEngine();

// Utility functions
export function getStageRecommendations(stage: string): {
  objectives: string[];
  keyQuestions: string[];
  successCriteria: string[];
} {
  const stageData = {
    discovery_surface: {
      objectives: ['Build rapport', 'Understand current state', 'Identify initial pain points'],
      keyQuestions: [
        'Can you walk me through your current process?',
        'What challenges are you facing?',
        'How are you handling this today?'
      ],
      successCriteria: ['Prospect is engaged', 'Initial pain identified', 'Trust established']
    },
    discovery_deep: {
      objectives: ['Quantify pain', 'Understand impact', 'Identify decision makers'],
      keyQuestions: [
        'How much is this costing you?',
        'What happens if you don\'t fix this?',
        'Who else is affected by this problem?'
      ],
      successCriteria: ['Pain quantified', 'Impact understood', 'Urgency established']
    },
    qualification: {
      objectives: ['Confirm budget', 'Identify decision process', 'Establish timeline'],
      keyQuestions: [
        'What\'s your budget for solving this?',
        'How do decisions like this get made?',
        'What\'s your timeline for implementation?'
      ],
      successCriteria: ['Budget confirmed', 'Decision process clear', 'Timeline established']
    },
    presentation: {
      objectives: ['Present solution', 'Connect features to benefits', 'Address concerns'],
      keyQuestions: [
        'How does this address your specific needs?',
        'What questions do you have?',
        'How do you see this fitting into your workflow?'
      ],
      successCriteria: ['Solution understood', 'Value demonstrated', 'Concerns addressed']
    },
    objection_handling: {
      objectives: ['Address concerns', 'Provide reassurance', 'Maintain momentum'],
      keyQuestions: [
        'What specific concerns do you have?',
        'What would need to happen for you to move forward?',
        'How can I address that concern?'
      ],
      successCriteria: ['Objections resolved', 'Confidence restored', 'Path forward clear']
    },
    closing: {
      objectives: ['Secure commitment', 'Define next steps', 'Set expectations'],
      keyQuestions: [
        'Are you ready to move forward?',
        'What are the next steps?',
        'When can we get started?'
      ],
      successCriteria: ['Commitment secured', 'Next steps defined', 'Timeline agreed']
    }
  };

  return stageData[stage as keyof typeof stageData] || {
    objectives: ['Continue conversation'],
    keyQuestions: ['What questions do you have?'],
    successCriteria: ['Engagement maintained']
  };
}

export function calculatePlaybookEffectiveness(
  suggestions: PlaybookSuggestion[],
  usageData: Array<{ suggestionId: string; used: boolean; outcome: 'positive' | 'negative' | 'neutral' }>
): Record<string, number> {
  const effectiveness: Record<string, number> = {};

  suggestions.forEach(suggestion => {
    const usage = usageData.find(u => u.suggestionId === suggestion.id);
    if (usage) {
      const framework = suggestion.framework;
      if (!effectiveness[framework]) {
        effectiveness[framework] = 0;
      }
      
      switch (usage.outcome) {
        case 'positive':
          effectiveness[framework] += 1;
          break;
        case 'negative':
          effectiveness[framework] -= 0.5;
          break;
        case 'neutral':
          effectiveness[framework] += 0.1;
          break;
      }
    }
  });

  return effectiveness;
}
