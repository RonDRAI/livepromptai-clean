'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  AlertTriangle, 
  Heart, 
  MessageSquare, 
  Zap, 
  Target,
  Eye,
  BarChart3,
  Filter
} from 'lucide-react';
import { DetectedPattern } from '@/types/conversation';
import { motion, AnimatePresence } from 'framer-motion';

interface PatternDetectionDisplayProps {
  patterns: DetectedPattern[];
  showFilters?: boolean;
  maxPatterns?: number;
  onPatternClick?: (pattern: DetectedPattern) => void;
}

export function PatternDetectionDisplay({
  patterns,
  showFilters = true,
  maxPatterns = 10,
  onPatternClick
}: PatternDetectionDisplayProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'confidence' | 'timestamp' | 'type'>('confidence');
  const [showAll, setShowAll] = useState(false);

  // Get unique pattern types
  const patternTypes = Array.from(new Set(patterns.map(p => p.type)));

  // Filter and sort patterns
  const filteredPatterns = patterns
    .filter(pattern => selectedTypes.size === 0 || selectedTypes.has(pattern.type))
    .sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    })
    .slice(0, showAll ? undefined : maxPatterns);

  // Get pattern display info
  const getPatternDisplay = (type: string) => {
    const displays = {
      objection: { 
        icon: AlertTriangle, 
        color: 'text-red-500', 
        bg: 'bg-red-50', 
        border: 'border-red-200',
        label: 'Objection' 
      },
      buying_signal: { 
        icon: TrendingUp, 
        color: 'text-green-500', 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        label: 'Buying Signal' 
      },
      pain_point: { 
        icon: Heart, 
        color: 'text-orange-500', 
        bg: 'bg-orange-50', 
        border: 'border-orange-200',
        label: 'Pain Point' 
      },
      question: { 
        icon: MessageSquare, 
        color: 'text-blue-500', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200',
        label: 'Question' 
      },
      interest: { 
        icon: Zap, 
        color: 'text-purple-500', 
        bg: 'bg-purple-50', 
        border: 'border-purple-200',
        label: 'Interest' 
      },
      concern: { 
        icon: AlertTriangle, 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200',
        label: 'Concern' 
      }
    };

    return displays[type as keyof typeof displays] || {
      icon: Target,
      color: 'text-gray-500',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      label: type.replace('_', ' ')
    };
  };

  // Toggle pattern type filter
  const toggleTypeFilter = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  // Get pattern statistics
  const patternStats = patternTypes.map(type => ({
    type,
    count: patterns.filter(p => p.type === type).length,
    avgConfidence: patterns
      .filter(p => p.type === type)
      .reduce((acc, p) => acc + p.confidence, 0) / 
      patterns.filter(p => p.type === type).length || 0
  }));

  // Format timestamp
  const formatTime = (timestamp?: Date) => {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timestamp));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Pattern Detection
          </div>
          <Badge variant="outline">
            {patterns.length} patterns detected
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pattern Statistics */}
        <div className="grid grid-cols-2 gap-2">
          {patternStats.slice(0, 4).map(stat => {
            const display = getPatternDisplay(stat.type);
            const Icon = display.icon;
            
            return (
              <motion.div
                key={stat.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`p-2 rounded-md ${display.bg} ${display.border} border`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${display.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">
                        {display.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {stat.count}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(stat.avgConfidence * 100)}% avg
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        {showFilters && patternTypes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filters</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortBy(sortBy === 'confidence' ? 'timestamp' : 'confidence')}
                  className="h-7 px-2 text-xs"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {sortBy === 'confidence' ? 'By Confidence' : 'By Time'}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {patternTypes.map(type => {
                const display = getPatternDisplay(type);
                const isSelected = selectedTypes.has(type);
                
                return (
                  <Button
                    key={type}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTypeFilter(type)}
                    className="h-6 px-2 text-xs"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    {display.label}
                  </Button>
                );
              })}
              {selectedTypes.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTypes(new Set())}
                  className="h-6 px-2 text-xs text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Pattern List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recent Patterns</span>
            {patterns.length > maxPatterns && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="h-6 px-2 text-xs"
              >
                {showAll ? 'Show Less' : `Show All (${patterns.length})`}
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {filteredPatterns.map((pattern, index) => {
                const display = getPatternDisplay(pattern.type);
                const Icon = display.icon;

                return (
                  <motion.div
                    key={`${pattern.type}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`p-3 rounded-md border transition-all duration-200 ${
                      onPatternClick ? 'cursor-pointer hover:shadow-sm' : ''
                    } ${display.bg} ${display.border}`}
                    onClick={() => onPatternClick?.(pattern)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Pattern Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${display.bg} border ${display.border} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${display.color}`} />
                      </div>

                      {/* Pattern Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {display.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(pattern.confidence * 100)}%
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {pattern.description}
                        </p>

                        {/* Confidence Bar */}
                        <div className="mb-2">
                          <Progress 
                            value={pattern.confidence * 100} 
                            className="h-1"
                          />
                        </div>

                        {/* Keywords */}
                        {pattern.keywords && pattern.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {pattern.keywords.slice(0, 3).map((keyword, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary" 
                                className="text-xs px-1 py-0"
                              >
                                {keyword}
                              </Badge>
                            ))}
                            {pattern.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{pattern.keywords.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Context */}
                        {pattern.context && (
                          <div className="mt-2 text-xs text-muted-foreground italic">
                            "{pattern.context.substring(0, 100)}..."
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredPatterns.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {selectedTypes.size > 0 ? 'No patterns match your filters' : 'No patterns detected yet'}
                </p>
                <p className="text-xs">
                  {selectedTypes.size > 0 ? 'Try adjusting your filters' : 'Patterns will appear as the conversation develops'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pattern Insights */}
        {patterns.length > 0 && (
          <div className="p-3 bg-muted/30 rounded-md">
            <h4 className="text-sm font-medium mb-2">Pattern Insights</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Most common pattern:</span>
                <span className="font-medium">
                  {patternStats.sort((a, b) => b.count - a.count)[0]?.type.replace('_', ' ') || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Highest confidence:</span>
                <span className="font-medium">
                  {Math.round(Math.max(...patterns.map(p => p.confidence)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total patterns:</span>
                <span className="font-medium">{patterns.length}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
