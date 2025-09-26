'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  Zap,
  Target,
  BookOpen
} from 'lucide-react';
import { PlaybookSuggestion, DetectedPattern } from '@/types/conversation';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedGuidancePanelProps {
  suggestions: PlaybookSuggestion[];
  patterns: DetectedPattern[];
  currentStage: string;
  onSuggestionUse?: (suggestion: PlaybookSuggestion) => void;
  onSuggestionFeedback?: (suggestionId: string, feedback: 'positive' | 'negative') => void;
}

export function EnhancedGuidancePanel({
  suggestions,
  patterns,
  currentStage,
  onSuggestionUse,
  onSuggestionFeedback
}: EnhancedGuidancePanelProps) {
  const [activeTab, setActiveTab] = useState('guidance');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usedSuggestions, setUsedSuggestions] = useState<Set<string>>(new Set());

  // Group suggestions by framework
  const suggestionsByFramework = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.framework]) {
      acc[suggestion.framework] = [];
    }
    acc[suggestion.framework].push(suggestion);
    return acc;
  }, {} as Record<string, PlaybookSuggestion[]>);

  // Group patterns by type
  const patternsByType = patterns.reduce((acc, pattern) => {
    if (!acc[pattern.type]) {
      acc[pattern.type] = [];
    }
    acc[pattern.type].push(pattern);
    return acc;
  }, {} as Record<string, DetectedPattern[]>);

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

  // Get framework color
  const getFrameworkColor = (framework: string) => {
    const colors = {
      'Sandler': 'bg-blue-100 text-blue-800',
      'SPIN': 'bg-green-100 text-green-800',
      'MEDDIC': 'bg-purple-100 text-purple-800',
      'Challenger': 'bg-orange-100 text-orange-800'
    };
    return colors[framework as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Get pattern icon and color
  const getPatternDisplay = (type: string) => {
    const displays = {
      objection: { icon: AlertTriangle, color: 'text-red-500', label: 'Objections' },
      buying_signal: { icon: TrendingUp, color: 'text-green-500', label: 'Buying Signals' },
      pain_point: { icon: Target, color: 'text-orange-500', label: 'Pain Points' },
      question: { icon: Lightbulb, color: 'text-blue-500', label: 'Questions' },
      interest: { icon: Zap, color: 'text-purple-500', label: 'Interest' }
    };
    return displays[type as keyof typeof displays] || {
      icon: BookOpen,
      color: 'text-gray-500',
      label: type.replace('_', ' ')
    };
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Guidance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Unified playbook recommendations
        </p>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4">
            <TabsTrigger value="guidance">Guidance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="playbook">Playbook</TabsTrigger>
          </TabsList>

          {/* Guidance Tab */}
          <TabsContent value="guidance" className="flex-1 mt-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-4 pb-4">
                {suggestions.length > 0 ? (
                  <AnimatePresence>
                    {suggestions.slice(0, 6).map((suggestion, index) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className={`transition-all duration-200 hover:shadow-md ${
                          usedSuggestions.has(suggestion.id) ? 'bg-green-50 border-green-200' : ''
                        }`}>
                          <CardContent className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge className={getFrameworkColor(suggestion.framework)}>
                                  {suggestion.framework}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(suggestion.confidence * 100)}% confidence
                                </Badge>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.type.replace('_', ' ')}
                              </Badge>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                              <p className="text-sm leading-relaxed">
                                {suggestion.content}
                              </p>
                              
                              {suggestion.reasoning && (
                                <p className="text-xs text-muted-foreground italic">
                                  {suggestion.reasoning}
                                </p>
                              )}

                              {suggestion.follow_ups && suggestion.follow_ups.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Follow-ups:
                                  </p>
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {suggestion.follow_ups.map((followUp, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span>•</span>
                                        <span>{followUp}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopy(suggestion.content, suggestion.id)}
                                  className="h-7 px-2"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  {copiedId === suggestion.id ? 'Copied!' : 'Copy'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSuggestionUse(suggestion)}
                                  disabled={usedSuggestions.has(suggestion.id)}
                                  className="h-7 px-2"
                                >
                                  {usedSuggestions.has(suggestion.id) ? 'Used' : 'Use'}
                                </Button>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onSuggestionFeedback?.(suggestion.id, 'positive')}
                                  className="h-7 w-7 p-0"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onSuggestionFeedback?.(suggestion.id, 'negative')}
                                  className="h-7 w-7 p-0"
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No guidance available yet</p>
                    <p className="text-xs">Continue the conversation to get AI suggestions</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="flex-1 mt-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-4 pb-4">
                {Object.entries(patternsByType).map(([type, typePatterns]) => {
                  const display = getPatternDisplay(type);
                  const Icon = display.icon;

                  return (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className={`h-4 w-4 ${display.color}`} />
                            <h3 className="font-medium text-sm">{display.label}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {typePatterns.length}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {typePatterns.map((pattern, idx) => (
                              <div key={idx} className="text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    {pattern.description}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(pattern.confidence * 100)}%
                                  </Badge>
                                </div>
                                {pattern.keywords && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Keywords: {pattern.keywords.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}

                {patterns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No patterns detected yet</p>
                    <p className="text-xs">Patterns will appear as the conversation develops</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Playbook Tab */}
          <TabsContent value="playbook" className="flex-1 mt-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-4 pb-4">
                {Object.entries(suggestionsByFramework).map(([framework, frameworkSuggestions]) => (
                  <motion.div
                    key={framework}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-sm">{framework}</h3>
                          <Badge className={getFrameworkColor(framework)}>
                            {frameworkSuggestions.length} suggestions
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {frameworkSuggestions.slice(0, 3).map((suggestion, idx) => (
                            <div key={idx} className="text-sm p-2 bg-muted/30 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed">
                                {suggestion.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {suggestions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No playbook suggestions yet</p>
                    <p className="text-xs">AI will provide framework-specific guidance as needed</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
