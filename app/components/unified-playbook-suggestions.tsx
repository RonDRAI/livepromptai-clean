'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Lightbulb, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  Star,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { PlaybookSuggestion } from '@/types/conversation';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedPlaybookSuggestionsProps {
  suggestions: PlaybookSuggestion[];
  currentStage: string;
  onSuggestionUse?: (suggestion: PlaybookSuggestion) => void;
  onSuggestionFeedback?: (suggestionId: string, feedback: 'positive' | 'negative') => void;
  maxSuggestions?: number;
}

export function UnifiedPlaybookSuggestions({
  suggestions,
  currentStage,
  onSuggestionUse,
  onSuggestionFeedback,
  maxSuggestions = 8
}: UnifiedPlaybookSuggestionsProps) {
  const [activeFramework, setActiveFramework] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usedSuggestions, setUsedSuggestions] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Map<string, 'positive' | 'negative'>>(new Map());

  // Group suggestions by framework
  const suggestionsByFramework = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.framework]) {
      acc[suggestion.framework] = [];
    }
    acc[suggestion.framework].push(suggestion);
    return acc;
  }, {} as Record<string, PlaybookSuggestion[]>);

  // Get frameworks with counts
  const frameworks = Object.keys(suggestionsByFramework).map(framework => ({
    name: framework,
    count: suggestionsByFramework[framework].length,
    avgConfidence: suggestionsByFramework[framework].reduce((acc, s) => acc + s.confidence, 0) / suggestionsByFramework[framework].length
  }));

  // Filter suggestions based on active framework
  const filteredSuggestions = activeFramework === 'all' 
    ? suggestions 
    : suggestionsByFramework[activeFramework] || [];

  // Sort by confidence and limit
  const displaySuggestions = filteredSuggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxSuggestions);

  // Get framework info
  const getFrameworkInfo = (framework: string) => {
    const info = {
      'Sandler': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Target,
        description: 'Pain-focused selling methodology'
      },
      'SPIN': {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Lightbulb,
        description: 'Situation, Problem, Implication, Need-payoff'
      },
      'MEDDIC': {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Users,
        description: 'Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion'
      },
      'Challenger': {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: TrendingUp,
        description: 'Teach, Tailor, Take control'
      }
    };
    
    return info[framework as keyof typeof info] || {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: BookOpen,
      description: 'Sales methodology'
    };
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle suggestion use
  const handleSuggestionUse = (suggestion: PlaybookSuggestion) => {
    setUsedSuggestions(prev => new Set([...prev, suggestion.id]));
    onSuggestionUse?.(suggestion);
  };

  // Handle feedback
  const handleFeedback = (suggestionId: string, feedback: 'positive' | 'negative') => {
    setFeedbackGiven(prev => new Map([...prev, [suggestionId, feedback]]));
    onSuggestionFeedback?.(suggestionId, feedback);
  };

  // Get suggestion priority
  const getSuggestionPriority = (suggestion: PlaybookSuggestion) => {
    if (suggestion.confidence > 0.9) return { label: 'High', color: 'bg-red-100 text-red-800' };
    if (suggestion.confidence > 0.7) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Unified Playbook
          </div>
          <Badge variant="outline">
            {suggestions.length} suggestions
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered recommendations from multiple sales methodologies
        </p>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs value={activeFramework} onValueChange={setActiveFramework} className="h-full flex flex-col">
          {/* Framework Tabs */}
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="text-xs">
                All ({suggestions.length})
              </TabsTrigger>
              {frameworks.slice(0, 4).map(framework => (
                <TabsTrigger key={framework.name} value={framework.name} className="text-xs">
                  {framework.name} ({framework.count})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* All Suggestions Tab */}
          <TabsContent value="all" className="flex-1 mt-4">
            <ScrollArea className="h-full px-4">
              <div className="space-y-4 pb-4">
                {/* Framework Overview */}
                <div className="grid grid-cols-2 gap-2">
                  {frameworks.map(framework => {
                    const info = getFrameworkInfo(framework.name);
                    const Icon = info.icon;
                    
                    return (
                      <motion.div
                        key={framework.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`p-3 rounded-md border ${info.color}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{framework.name}</span>
                        </div>
                        <div className="text-xs opacity-80 mb-2">
                          {info.description}
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>{framework.count} suggestions</span>
                          <span>{Math.round(framework.avgConfidence * 100)}% avg</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Top Suggestions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Top Recommendations</h4>
                  <AnimatePresence>
                    {displaySuggestions.slice(0, 4).map((suggestion, index) => {
                      const frameworkInfo = getFrameworkInfo(suggestion.framework);
                      const priority = getSuggestionPriority(suggestion);
                      const isUsed = usedSuggestions.has(suggestion.id);
                      const feedback = feedbackGiven.get(suggestion.id);

                      return (
                        <motion.div
                          key={suggestion.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={`p-4 rounded-lg border transition-all duration-200 ${
                            isUsed ? 'bg-green-50 border-green-200' : 'bg-card hover:shadow-sm'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge className={frameworkInfo.color}>
                                {suggestion.framework}
                              </Badge>
                              <Badge variant="outline" className={priority.color}>
                                {priority.label}
                              </Badge>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>

                          {/* Content */}
                          <div className="space-y-2">
                            <p className="text-sm leading-relaxed">
                              {suggestion.content}
                            </p>
                            
                            {suggestion.reasoning && (
                              <p className="text-xs text-muted-foreground italic">
                                💡 {suggestion.reasoning}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(suggestion.content, suggestion.id)}
                                className="h-7 px-2 text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                {copiedId === suggestion.id ? 'Copied!' : 'Copy'}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSuggestionUse(suggestion)}
                                disabled={isUsed}
                                className="h-7 px-2 text-xs"
                              >
                                {isUsed ? '✓ Used' : 'Use'}
                              </Button>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant={feedback === 'positive' ? 'default' : 'ghost'}
                                onClick={() => handleFeedback(suggestion.id, 'positive')}
                                className="h-7 w-7 p-0"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant={feedback === 'negative' ? 'destructive' : 'ghost'}
                                onClick={() => handleFeedback(suggestion.id, 'negative')}
                                className="h-7 w-7 p-0"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Individual Framework Tabs */}
          {frameworks.map(framework => (
            <TabsContent key={framework.name} value={framework.name} className="flex-1 mt-4">
              <ScrollArea className="h-full px-4">
                <div className="space-y-4 pb-4">
                  {/* Framework Header */}
                  <div className={`p-4 rounded-lg border ${getFrameworkInfo(framework.name).color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {React.createElement(getFrameworkInfo(framework.name).icon, {
                        className: "h-5 w-5"
                      })}
                      <h3 className="font-medium">{framework.name} Methodology</h3>
                    </div>
                    <p className="text-sm opacity-90 mb-3">
                      {getFrameworkInfo(framework.name).description}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>{framework.count} suggestions available</span>
                      <span>Average confidence: {Math.round(framework.avgConfidence * 100)}%</span>
                    </div>
                  </div>

                  {/* Framework Suggestions */}
                  <div className="space-y-3">
                    <AnimatePresence>
                      {(suggestionsByFramework[framework.name] || [])
                        .sort((a, b) => b.confidence - a.confidence)
                        .map((suggestion, index) => {
                          const isUsed = usedSuggestions.has(suggestion.id);
                          const feedback = feedbackGiven.get(suggestion.id);

                          return (
                            <motion.div
                              key={suggestion.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className={`p-3 rounded-md border transition-all duration-200 ${
                                isUsed ? 'bg-green-50 border-green-200' : 'bg-card hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(suggestion.confidence * 100)}%
                                </Badge>
                              </div>

                              <p className="text-sm leading-relaxed mb-2">
                                {suggestion.content}
                              </p>

                              {suggestion.follow_ups && suggestion.follow_ups.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Follow-ups:
                                  </p>
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {suggestion.follow_ups.slice(0, 2).map((followUp, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span>•</span>
                                        <span>{followUp}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopy(suggestion.content, suggestion.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    {copiedId === suggestion.id ? 'Copied!' : 'Copy'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSuggestionUse(suggestion)}
                                    disabled={isUsed}
                                    className="h-6 px-2 text-xs"
                                  >
                                    {isUsed ? '✓ Used' : 'Use'}
                                  </Button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant={feedback === 'positive' ? 'default' : 'ghost'}
                                    onClick={() => handleFeedback(suggestion.id, 'positive')}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={feedback === 'negative' ? 'destructive' : 'ghost'}
                                    onClick={() => handleFeedback(suggestion.id, 'negative')}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Empty State */}
        {suggestions.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm mb-2">No playbook suggestions yet</p>
              <p className="text-xs">
                AI will provide methodology-specific guidance as the conversation develops
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
