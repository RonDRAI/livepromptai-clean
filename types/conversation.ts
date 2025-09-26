export interface Message {
  id: string;
  content: string;
  speaker: 'rep' | 'prospect';
  timestamp: Date;
  detected_patterns?: DetectedPattern[];
  ai_analysis?: AIAnalysis;
  confidence?: number;
}

export interface DetectedPattern {
  type: 'objection' | 'buying_signal' | 'pain_point' | 'greeting' | 'closing' | 'question' | 'concern' | 'interest' | 'urgency' | 'budget' | 'authority' | 'timeline' | 'competitor' | 'feature_request';
  confidence: number;
  description: string;
  keywords?: string[];
  context?: string;
}

export interface AIAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement_score: number;
  urgency_level: 'low' | 'medium' | 'high';
  buying_intent: number;
  pain_level?: number;
  decision_maker_likelihood?: number;
  key_topics?: string[];
  next_best_action?: string;
}

export interface ConversationStage {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  current: boolean;
  progress: number;
}

export interface PlaybookSuggestion {
  id: string;
  framework: 'Sandler' | 'SPIN' | 'MEDDIC' | 'Challenger';
  type: 'question' | 'response' | 'technique' | 'objection_handler';
  content: string;
  confidence: number;
  context: string;
  stage: string;
  reasoning?: string;
  follow_ups?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  current_stage: ConversationStage;
  all_stages: ConversationStage[];
  detected_patterns: DetectedPattern[];
  ai_suggestions: PlaybookSuggestion[];
  created_at: Date;
  updated_at: Date;
}

export interface VoiceSettings {
  enabled: boolean;
  continuous: boolean;
  interimResults: boolean;
  language: string;
  confidence_threshold: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  speaker?: 'rep' | 'prospect';
}

// Extended Web Speech API types
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: any;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export interface Analytics {
  totalConversations: number;
  avgDuration: number;
  totalMessages: number;
  totalPatterns: number;
  messagesWithPatterns: number;
  topPatterns: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  stageProgression: Array<{
    stage: string;
    averageTime: number;
    completionRate: number;
  }>;
  frameworkUsage: Array<{
    framework: string;
    usage: number;
    effectiveness: number;
  }>;
}
