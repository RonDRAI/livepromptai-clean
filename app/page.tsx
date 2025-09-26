'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  Brain, 
  Users, 
  Zap, 
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

// Import our enhanced components
import { EnhancedVoiceFallback } from '@/components/enhanced-voice-fallback';
import { EnhancedConversationFeed } from '@/components/enhanced-conversation-feed';
import { EnhancedGuidancePanel } from '@/components/enhanced-guidance-panel';
import { ConversationStageIndicator } from '@/components/conversation-stage-indicator';
import { PatternDetectionDisplay } from '@/components/pattern-detection-display';
import { UnifiedPlaybookSuggestions } from '@/components/unified-playbook-suggestions';

// Import AI libraries
import { PatternRecognitionEngine } from '@/lib/pattern-recognition';
import { UnifiedPlaybookEngine } from '@/lib/playbook-engine';
import { conversationAnalyzer, generateAIAnalysis, ConversationAnalyzer } from '@/lib/conversation-analyzer';

// Import types
import { 
  Message, 
  DetectedPattern, 
  PlaybookSuggestion, 
  ConversationStage 
} from '@/types/conversation';

export default function LivePromptAIDemo() {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStage, setCurrentStage] = useState('discovery_surface');
  const [stageProgress, setStageProgress] = useState(0);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [suggestions, setSuggestions] = useState<PlaybookSuggestion[]>([]);
  
  // UI state
  const [isRecording, setIsRecording] = useState(false);
  const [activeView, setActiveView] = useState<'conversation' | 'patterns' | 'playbook'>('conversation');
  
  // AI engines
  const [patternEngine] = useState(() => new PatternRecognitionEngine());
  const [playbookEngine] = useState(() => new UnifiedPlaybookEngine());
  const [conversationAnalyzer] = useState(() => new ConversationAnalyzer());

  // Demo conversation stages
  const conversationStages: ConversationStage[] = [
    {
      id: 'discovery_surface',
      name: 'Discovery - Surface',
      description: 'Initial discovery and rapport building',
      completed: false,
      current: true,
      progress: 25
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
      description: 'Budget, authority, need, timeline',
      completed: false,
      current: false,
      progress: 0
    },
    {
      id: 'presentation',
      name: 'Presentation',
      description: 'Solution presentation and demo',
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

  // Initialize with demo message
  useEffect(() => {
    const initialMessage: Message = {
      id: 'demo-1',
      content: "Hi there, thanks for making time today. Could you tell me about your team's current workflow for client reporting?",
      speaker: 'rep',
      timestamp: new Date(),
      ai_analysis: {
        sentiment: 'neutral',
        engagement_score: 0.8,
        buying_intent: 0.1,
        urgency_level: 'low',
        key_topics: ['workflow', 'client reporting', 'team process'],
        next_best_action: 'Wait for prospect response and listen for pain points'
      }
    };

    setMessages([initialMessage]);

    // Generate initial suggestions
    const initialSuggestions = playbookEngine.generateSuggestions(
      [],
      'discovery_surface',
      [initialMessage.content]
    );
    setSuggestions(initialSuggestions);
  }, [playbookEngine]);

  // Handle new transcript from voice input
  const handleTranscript = useCallback(async (
    transcript: string, 
    speaker: 'rep' | 'prospect', 
    confidence: number
  ) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: transcript,
      speaker,
      timestamp: new Date(),
      confidence
    };

    // Analyze patterns
    const detectedPatterns = patternEngine.detectPatterns(transcript, speaker);
    if (detectedPatterns.length > 0) {
      newMessage.detected_patterns = detectedPatterns;
      setPatterns(prev => [...prev, ...detectedPatterns]);
    }

    // Add AI analysis
    const analysis = generateAIAnalysis(newMessage);
    newMessage.ai_analysis = analysis;

    // Update messages
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // Update conversation stage and progress
    const stageAnalysis = conversationAnalyzer.analyzeStageProgression(updatedMessages);
    setCurrentStage(stageAnalysis.current_stage);
    setStageProgress(stageAnalysis.progress_percentage);

    // Generate new suggestions
    const newSuggestions = playbookEngine.generateSuggestions(
      detectedPatterns,
      stageAnalysis.current_stage,
      updatedMessages.map(m => m.content)
    );
    setSuggestions(newSuggestions);

  }, [messages, patternEngine, playbookEngine, conversationAnalyzer]);

  // Handle pattern detection
  const handlePatternDetected = useCallback((newPatterns: DetectedPattern[]) => {
    setPatterns(prev => [...prev, ...newPatterns]);
  }, []);

  // Handle suggestion use
  const handleSuggestionUse = useCallback((suggestion: PlaybookSuggestion) => {
    console.log('Using suggestion:', suggestion.content);
    // In a real app, this might auto-fill a response field or track usage
  }, []);

  // Handle suggestion feedback
  const handleSuggestionFeedback = useCallback((suggestionId: string, feedback: 'positive' | 'negative') => {
    console.log('Suggestion feedback:', suggestionId, feedback);
    // In a real app, this would be sent to analytics/learning system
  }, []);

  // Reset demo
  const resetDemo = useCallback(() => {
    setMessages([]);
    setPatterns([]);
    setSuggestions([]);
    setCurrentStage('discovery_surface');
    setStageProgress(0);
    
    // Re-initialize with demo message
    setTimeout(() => {
      const initialMessage: Message = {
        id: 'demo-reset',
        content: "Hi there, thanks for making time today. Could you tell me about your team's current workflow for client reporting?",
        speaker: 'rep',
        timestamp: new Date(),
        ai_analysis: {
          sentiment: 'neutral',
          engagement_score: 0.8,
          buying_intent: 0.1,
          urgency_level: 'low',
          key_topics: ['workflow', 'client reporting', 'team process'],
          next_best_action: 'Wait for prospect response and listen for pain points'
        }
      };
      setMessages([initialMessage]);
      
      const initialSuggestions = playbookEngine.generateSuggestions(
        [],
        'discovery_surface',
        [initialMessage.content]
      );
      setSuggestions(initialSuggestions);
    }, 100);
  }, [playbookEngine]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Voice-Enhanced LivePromptAI Demo
                </h1>
                <p className="text-sm text-gray-600">
                  AI-powered sales guidance with real-time voice recognition
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Mic className="h-3 w-3 mr-1" />
                Voice Enabled
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Users className="h-3 w-3 mr-1" />
                Unified Playbook
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={resetDemo}
                className="ml-2"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset Demo
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Highlights */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Mic className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-medium text-sm">Real-Time Voice</h3>
              <p className="text-xs text-muted-foreground">Speech recognition with ≤500ms latency</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-medium text-sm">Auto Speaker Detection</h3>
              <p className="text-xs text-muted-foreground">85%+ accuracy using linguistic patterns</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-medium text-sm">Unified Playbook</h3>
              <p className="text-xs text-muted-foreground">Sandler, SPIN, MEDDIC, Challenger</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-medium text-sm">Always-On Guidance</h3>
              <p className="text-xs text-muted-foreground">Real-time pattern recognition & suggestions</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Voice Input & Stage Progress */}
          <div className="col-span-3 space-y-6">
            <EnhancedVoiceFallback
              onTranscript={handleTranscript}
              onPatternDetected={handlePatternDetected}
              placeholder="Type what was said in the conversation..."
            />
            
            <ConversationStageIndicator
              currentStage={currentStage}
              stageProgress={stageProgress}
              stages={conversationStages}
            />
          </div>

          {/* Center Column - Conversation Feed */}
          <div className="col-span-6">
            <div className="space-y-4">
              {/* View Tabs */}
              <div className="flex items-center gap-2">
                <Button
                  variant={activeView === 'conversation' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView('conversation')}
                >
                  Conversation Progress
                </Button>
                <Button
                  variant={activeView === 'patterns' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView('patterns')}
                >
                  Pattern Detection ({patterns.length})
                </Button>
                <Button
                  variant={activeView === 'playbook' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView('playbook')}
                >
                  Playbook Suggestions ({suggestions.length})
                </Button>
              </div>

              {/* Dynamic Content */}
              <div className="h-[600px]">
                {activeView === 'conversation' && (
                  <EnhancedConversationFeed
                    messages={messages}
                    currentStage={currentStage}
                  />
                )}
                
                {activeView === 'patterns' && (
                  <PatternDetectionDisplay
                    patterns={patterns}
                    showFilters={true}
                    maxPatterns={10}
                  />
                )}
                
                {activeView === 'playbook' && (
                  <UnifiedPlaybookSuggestions
                    suggestions={suggestions}
                    currentStage={currentStage}
                    onSuggestionUse={handleSuggestionUse}
                    onSuggestionFeedback={handleSuggestionFeedback}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - AI Guidance */}
          <div className="col-span-3">
            <EnhancedGuidancePanel
              suggestions={suggestions.slice(0, 3)}
              patterns={patterns.slice(-5)}
              currentStage={currentStage}
              onSuggestionUse={handleSuggestionUse}
              onSuggestionFeedback={handleSuggestionFeedback}
            />
          </div>
        </div>
      </div>

      {/* Demo Instructions */}
      <div className="fixed bottom-4 right-4 max-w-sm">
        <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Play className="h-4 w-4" />
              Voice Demo Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p>• Click the red microphone button to start recording</p>
            <p>• Speak naturally - AI will detect who's talking</p>
            <p>• Watch real-time pattern detection and stage progression</p>
            <p>• Try saying: "WeWe're struggling with manual reportingapos;re struggling with manual reporting"</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
