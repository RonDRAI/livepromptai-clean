'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  Heart, 
  MessageSquare,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { Message, DetectedPattern } from '@/types/conversation';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedConversationFeedProps {
  messages: Message[];
  currentStage: string;
  onMessageSelect?: (message: Message) => void;
  autoScroll?: boolean;
}

export function EnhancedConversationFeed({
  messages,
  currentStage,
  onMessageSelect,
  autoScroll = true
}: EnhancedConversationFeedProps) {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, autoScroll]);

  // Get pattern icon and color
  const getPatternDisplay = (pattern: DetectedPattern) => {
    const displays = {
      objection: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
      buying_signal: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
      pain_point: { icon: Heart, color: 'text-orange-500', bg: 'bg-orange-50' },
      question: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
      interest: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50' },
      concern: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' }
    };

    return displays[pattern.type as keyof typeof displays] || {
      icon: Target,
      color: 'text-gray-500',
      bg: 'bg-gray-50'
    };
  };

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timestamp));
  };

  // Handle message click
  const handleMessageClick = (message: Message) => {
    setSelectedMessage(selectedMessage === message.id ? null : message.id);
    onMessageSelect?.(message);
  };

  // Get speaker info
  const getSpeakerInfo = (speaker: 'rep' | 'prospect') => {
    if (speaker === 'rep') {
      return {
        name: 'Sales Rep',
        avatar: 'SR',
        color: 'bg-blue-500',
        icon: User
      };
    } else {
      return {
        name: 'Prospect',
        avatar: 'PR',
        color: 'bg-green-500',
        icon: Bot
      };
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Conversation Progress</span>
          <Badge variant="outline" className="capitalize">
            {currentStage.replace('_', ' ')}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            <AnimatePresence>
              {messages.map((message, index) => {
                const speakerInfo = getSpeakerInfo(message.speaker);
                const isSelected = selectedMessage === message.id;
                const hasPatterns = message.detected_patterns && message.detected_patterns.length > 0;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`group cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                    }`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className={`flex gap-3 p-3 rounded-lg hover:bg-muted/50 ${
                      isSelected ? 'bg-muted' : ''
                    }`}>
                      {/* Avatar */}
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className={`${speakerInfo.color} text-white text-xs`}>
                          {speakerInfo.avatar}
                        </AvatarFallback>
                      </Avatar>

                      {/* Message Content */}
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {speakerInfo.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          
                          {/* AI Analysis Indicators */}
                          {message.ai_analysis && (
                            <div className="flex items-center gap-1">
                              {message.ai_analysis.sentiment === 'positive' && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  Positive
                                </Badge>
                              )}
                              {message.ai_analysis.sentiment === 'negative' && (
                                <Badge variant="outline" className="text-xs text-red-600">
                                  Negative
                                </Badge>
                              )}
                              {message.ai_analysis.engagement_score > 0.7 && (
                                <Badge variant="outline" className="text-xs text-blue-600">
                                  High Engagement
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Message Text */}
                        <div className="text-sm leading-relaxed">
                          {message.content}
                        </div>

                        {/* Pattern Badges */}
                        {hasPatterns && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.detected_patterns!.map((pattern, patternIndex) => {
                              const display = getPatternDisplay(pattern);
                              const Icon = display.icon;
                              
                              return (
                                <motion.div
                                  key={patternIndex}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.2 + patternIndex * 0.1 }}
                                >
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${display.bg} ${display.color} border-0`}
                                  >
                                    <Icon className="h-3 w-3 mr-1" />
                                    {pattern.type.replace('_', ' ')}
                                    <span className="ml-1 opacity-70">
                                      {Math.round(pattern.confidence * 100)}%
                                    </span>
                                  </Badge>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 p-3 bg-muted/30 rounded-md space-y-2"
                            >
                              {/* AI Analysis Details */}
                              {message.ai_analysis && (
                                <div className="space-y-1">
                                  <h4 className="text-xs font-medium text-muted-foreground">
                                    AI Analysis
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Sentiment:</span>
                                      <span className="ml-1 capitalize">
                                        {message.ai_analysis.sentiment}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Engagement:</span>
                                      <span className="ml-1">
                                        {Math.round(message.ai_analysis.engagement_score * 100)}%
                                      </span>
                                    </div>
                                    {message.ai_analysis.buying_intent !== undefined && (
                                      <div>
                                        <span className="text-muted-foreground">Buying Intent:</span>
                                        <span className="ml-1">
                                          {Math.round(message.ai_analysis.buying_intent * 100)}%
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-muted-foreground">Urgency:</span>
                                      <span className="ml-1 capitalize">
                                        {message.ai_analysis.urgency_level}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Pattern Details */}
                              {hasPatterns && (
                                <div className="space-y-1">
                                  <h4 className="text-xs font-medium text-muted-foreground">
                                    Detected Patterns
                                  </h4>
                                  <div className="space-y-1">
                                    {message.detected_patterns!.map((pattern, idx) => (
                                      <div key={idx} className="text-xs">
                                        <span className="font-medium">
                                          {pattern.type.replace('_', ' ')}:
                                        </span>
                                        <span className="ml-1 text-muted-foreground">
                                          {pattern.description}
                                        </span>
                                        {pattern.keywords && (
                                          <div className="mt-1">
                                            <span className="text-muted-foreground">Keywords:</span>
                                            <span className="ml-1 italic">
                                              {pattern.keywords.join(', ')}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty State */}
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation to see AI analysis</p>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
