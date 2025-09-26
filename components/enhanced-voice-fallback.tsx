'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { initializeSpeechRecognition, processSpeechResult } from '@/lib/ai-detection';
import { SpeechRecognitionResult, VoiceSettings } from '@/types/conversation';

interface EnhancedVoiceFallbackProps {
  onTranscript: (transcript: string, speaker: 'rep' | 'prospect', confidence: number) => void;
  onPatternDetected?: (patterns: any[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function EnhancedVoiceFallback({
  onTranscript,
  onPatternDetected,
  disabled = false,
  placeholder = "Type what was said in the conversation..."
}: EnhancedVoiceFallbackProps) {
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true); // Mic practice checkbox
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastSpeaker, setLastSpeaker] = useState<'rep' | 'prospect'>('rep');
  
  // Text input state
  const [textInput, setTextInput] = useState('');
  
  // Voice settings
  const [voiceSettings] = useState<VoiceSettings>({
    enabled: true,
    continuous: true,
    interimResults: true,
    language: 'en-US',
    confidence_threshold: 0.7
  });

  // Refs
  const recognitionRef = useRef<any | null>(null);
  const isProcessingRef = useRef(false);
  const lastProcessTimeRef = useRef(0);

  // Initialize speech recognition
  useEffect(() => {
    const recognition = initializeSpeechRecognition();
    if (recognition) {
      setVoiceSupported(true);
      recognitionRef.current = recognition;
      
      // Configure recognition
      recognition.continuous = voiceSettings.continuous;
      recognition.interimResults = voiceSettings.interimResults;
      recognition.lang = voiceSettings.language;
      
      // Event handlers
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Auto-restart on certain errors
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          setTimeout(() => {
            if (micEnabled && !disabled) {
              startListening();
            }
          }, 1000);
        }
      };

      recognition.onresult = (event: any) => {
        handleSpeechResult(event);
      };
    } else {
      setVoiceSupported(false);
      console.warn('Speech recognition not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [voiceSettings, micEnabled, disabled]);

  // Handle speech recognition results with optimized latency
  const handleSpeechResult = useCallback((event: any) => {
    const now = Date.now();
    
    // Throttle processing to reduce latency (max every 100ms)
    if (now - lastProcessTimeRef.current < 100 && !isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    lastProcessTimeRef.current = now;

    try {
      let interimTranscript = '';
      let finalTranscript = '';
      let maxConfidence = 0;

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0.8;

        maxConfidence = Math.max(maxConfidence, confidence);

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update state with minimal re-renders
      if (interimTranscript !== currentTranscript) {
        setCurrentTranscript(interimTranscript);
        setConfidence(maxConfidence);
      }

      // Process final results
      if (finalTranscript.trim()) {
        const speechResult: SpeechRecognitionResult = {
          transcript: finalTranscript.trim(),
          confidence: maxConfidence,
          isFinal: true
        };

        // Process with AI detection (optimized)
        const processed = processSpeechResult(speechResult, { previousSpeaker: lastSpeaker });
        
        // Update speaker
        setLastSpeaker(processed.speaker);
        
        // Send to parent with minimal delay
        onTranscript(processed.speaker === 'rep' ? finalTranscript.trim() : finalTranscript.trim(), processed.speaker, processed.confidence);
        
        // Send patterns if callback provided
        if (onPatternDetected && processed.patterns.length > 0) {
          onPatternDetected(processed.patterns);
        }

        // Clear transcripts
        setFinalTranscript('');
        setCurrentTranscript('');
      }
    } catch (error) {
      console.error('Error processing speech result:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [currentTranscript, lastSpeaker, onTranscript, onPatternDetected]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !micEnabled || disabled || isListening) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }, [micEnabled, disabled, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }, [isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Handle text input submission
  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;

    // Process text input similar to voice
    const processed = processSpeechResult(
      { transcript: textInput.trim(), confidence: 1.0, isFinal: true },
      { previousSpeaker: lastSpeaker }
    );

    setLastSpeaker(processed.speaker);
    onTranscript(textInput.trim(), processed.speaker, 1.0);

    if (onPatternDetected && processed.patterns.length > 0) {
      onPatternDetected(processed.patterns);
    }

    setTextInput('');
  }, [textInput, lastSpeaker, onTranscript, onPatternDetected]);

  // Handle Enter key in textarea
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }, [handleTextSubmit]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Input
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isListening ? "default" : "secondary"}>
              {isListening ? "Voice Ready" : "Waiting for input"}
            </Badge>
            <Badge variant="outline">
              {lastSpeaker === 'rep' ? 'Sales Rep' : 'Prospect'}
            </Badge>
            <Badge variant="outline">
              Discovery - Surface
            </Badge>
          </div>
          
          {/* Mic Practice Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mic-practice"
              checked={micEnabled}
              onCheckedChange={(checked) => setMicEnabled(checked === true)}
              disabled={disabled}
            />
            <label
              htmlFor="mic-practice"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable Mic Practice
            </label>
          </div>
        </div>

        {/* Voice Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voice Control</span>
            <Badge variant={voiceSupported ? "default" : "destructive"}>
              {voiceSupported ? "✓ Voice supported" : "✗ Voice not supported"}
            </Badge>
          </div>

          {/* Microphone Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              variant={isListening ? "destructive" : "default"}
              className={`w-20 h-20 rounded-full transition-all duration-200 ${
                isListening ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''
              }`}
              onClick={toggleListening}
              disabled={!voiceSupported || !micEnabled || disabled}
            >
              {isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
          </div>
        </div>

        {/* Live Transcript */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Live Transcript:</span>
          <div className="min-h-[60px] p-3 bg-muted rounded-md">
            {currentTranscript ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground italic">
                  {currentTranscript}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Confidence: {Math.round(confidence * 100)}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Speaker: {lastSpeaker === 'rep' ? 'Rep' : 'Prospect'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {micEnabled 
                  ? "Click the microphone to start speaking..." 
                  : "Enable mic practice to use voice recognition"
                }
              </p>
            )}
          </div>
        </div>

        {/* Text Fallback */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Or type manually:</span>
          <div className="flex gap-2">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="min-h-[80px] resize-none"
              disabled={disabled}
            />
            <Button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || disabled}
              size="sm"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to send
          </p>
        </div>

        {/* Performance Info */}
        {voiceSupported && micEnabled && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Optimized for ≤500ms latency</p>
            <p>• Automatic speaker detection enabled</p>
            <p>• Real-time pattern recognition active</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
