'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Target, 
  CheckCircle, 
  Presentation, 
  AlertTriangle, 
  Handshake,
  Clock
} from 'lucide-react';
import { ConversationStage } from '@/types/conversation';
import { motion } from 'framer-motion';

interface ConversationStageIndicatorProps {
  currentStage: string;
  stageProgress: number;
  stages?: ConversationStage[];
  onStageClick?: (stageId: string) => void;
}

const defaultStages: ConversationStage[] = [
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

export function ConversationStageIndicator({
  currentStage,
  stageProgress,
  stages = defaultStages,
  onStageClick
}: ConversationStageIndicatorProps) {
  // Get stage icon
  const getStageIcon = (stageId: string) => {
    const icons = {
      discovery_surface: Search,
      discovery_deep: Target,
      qualification: CheckCircle,
      presentation: Presentation,
      objection_handling: AlertTriangle,
      closing: Handshake
    };
    return icons[stageId as keyof typeof icons] || Search;
  };

  // Get stage color
  const getStageColor = (stage: ConversationStage) => {
    if (stage.completed) return 'text-green-500 bg-green-50 border-green-200';
    if (stage.current) return 'text-blue-500 bg-blue-50 border-blue-200';
    return 'text-gray-400 bg-gray-50 border-gray-200';
  };

  // Calculate overall progress
  const overallProgress = stages.reduce((acc, stage, index) => {
    if (stage.completed) return acc + (100 / stages.length);
    if (stage.current) return acc + (stageProgress / stages.length);
    return acc;
  }, 0);

  // Find current stage index
  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
  const currentStageData = stages[currentStageIndex];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Conversation Progress
          </div>
          <Badge variant="outline">
            {Math.round(overallProgress)}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">
              Stage {currentStageIndex + 1} of {stages.length}
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Current Stage Detail */}
        {currentStageData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-center gap-2 mb-2">
              {React.createElement(getStageIcon(currentStage), {
                className: "h-4 w-4 text-blue-500"
              })}
              <span className="font-medium text-sm text-blue-700">
                Current: {currentStageData.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(stageProgress)}%
              </Badge>
            </div>
            <p className="text-xs text-blue-600 mb-2">
              {currentStageData.description}
            </p>
            <Progress value={stageProgress} className="h-1" />
          </motion.div>
        )}

        {/* Stage Timeline */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Stage Timeline</h4>
          <div className="space-y-1">
            {stages.map((stage, index) => {
              const Icon = getStageIcon(stage.id);
              const isActive = stage.id === currentStage;
              const isPast = index < currentStageIndex;
              const isFuture = index > currentStageIndex;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-2 rounded-md transition-all duration-200 ${
                    onStageClick ? 'cursor-pointer hover:bg-muted/50' : ''
                  } ${isActive ? 'bg-blue-50' : ''}`}
                  onClick={() => onStageClick?.(stage.id)}
                >
                  {/* Stage Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    stage.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {stage.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium truncate ${
                        stage.completed 
                          ? 'text-green-700' 
                          : isActive 
                            ? 'text-blue-700'
                            : 'text-gray-500'
                      }`}>
                        {stage.name}
                      </span>
                      
                      {/* Stage Status */}
                      {stage.completed && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Complete
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Active
                        </Badge>
                      )}
                      {isFuture && (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate">
                      {stage.description}
                    </p>

                    {/* Progress Bar for Active Stage */}
                    {isActive && (
                      <div className="mt-1">
                        <Progress value={stageProgress} className="h-1" />
                      </div>
                    )}
                  </div>

                  {/* Connection Line */}
                  {index < stages.length - 1 && (
                    <div className={`absolute left-7 mt-8 w-0.5 h-4 ${
                      isPast || isActive ? 'bg-blue-300' : 'bg-gray-200'
                    }`} style={{ marginLeft: '1rem' }} />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stage Recommendations */}
        {currentStageData && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Stage Objectives</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              {getStageObjectives(currentStage).map((objective, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{objective}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Stage Preview */}
        {currentStageIndex < stages.length - 1 && (
          <div className="p-2 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Next:</span>
              <span className="font-medium">
                {stages[currentStageIndex + 1].name}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get stage objectives
function getStageObjectives(stageId: string): string[] {
  const objectives = {
    discovery_surface: [
      'Build rapport and trust',
      'Understand current situation',
      'Identify initial pain points'
    ],
    discovery_deep: [
      'Quantify pain and impact',
      'Understand decision process',
      'Identify key stakeholders'
    ],
    qualification: [
      'Confirm budget availability',
      'Establish timeline',
      'Verify decision authority'
    ],
    presentation: [
      'Present tailored solution',
      'Demonstrate key benefits',
      'Address initial questions'
    ],
    objection_handling: [
      'Address all concerns',
      'Provide social proof',
      'Rebuild confidence'
    ],
    closing: [
      'Secure commitment',
      'Define next steps',
      'Set implementation timeline'
    ]
  };

  return objectives[stageId as keyof typeof objectives] || [
    'Continue conversation',
    'Gather more information',
    'Build relationship'
  ];
}
