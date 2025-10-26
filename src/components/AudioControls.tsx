import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, AlertTriangle } from 'lucide-react';

interface AudioControlsProps {
  onCryingDetected: (intensity: number) => void;
}

export function AudioControls({ onCryingDetected }: AudioControlsProps) {
  const [isMicActive, setIsMicActive] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [cryingDetected, setCryingDetected] = useState(false);
  const [cryingIntensity, setCryingIntensity] = useState(0);
  const [lastSpokenMessage, setLastSpokenMessage] = useState('');

  // Simulate audio monitoring and crying detection
  useEffect(() => {
    if (!isMicActive) return;

    const interval = setInterval(() => {
      // Simulate ambient audio levels
      const baseLevel = Math.random() * 20;
      setAudioLevel(baseLevel);

      // Simulate crying detection (random occurrence)
      if (Math.random() < 0.1) { // 10% chance per interval
        const intensity = Math.random() * 100;
        setCryingDetected(true);
        setCryingIntensity(intensity);
        onCryingDetected(intensity);
        
        // Reset crying detection after 3 seconds
        setTimeout(() => {
          setCryingDetected(false);
          setCryingIntensity(0);
        }, 3000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMicActive, onCryingDetected]);

  const toggleMicrophone = () => {
    setIsMicActive(!isMicActive);
    if (!isMicActive) {
      setAudioLevel(0);
      setCryingDetected(false);
    }
  };

  const startSpeaking = () => {
    setIsSpeaking(true);
    setLastSpokenMessage(new Date().toLocaleTimeString());
  };

  const stopSpeaking = () => {
    setIsSpeaking(false);
  };

  const quickMessages = [
    "Mommy is here, sweetheart",
    "Daddy loves you",
    "Everything is okay, baby",
    "Sleep well, little one",
    "You're being so brave"
  ];

  const speakQuickMessage = (message: string) => {
    setIsSpeaking(true);
    setLastSpokenMessage(`"${message}" - ${new Date().toLocaleTimeString()}`);
    
    // Simulate message duration
    setTimeout(() => {
      setIsSpeaking(false);
    }, 3000);
  };

  return (
    <div className="space-y-4">
      {/* Audio Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Audio Monitoring
            </span>
            <Badge variant={isMicActive ? 'default' : 'secondary'}>
              {isMicActive ? 'Active' : 'Disabled'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Microphone</span>
              <Button
                variant={isMicActive ? 'default' : 'outline'}
                size="sm"
                onClick={toggleMicrophone}
              >
                {isMicActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {isMicActive ? 'On' : 'Off'}
              </Button>
            </div>

            {isMicActive && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audio Level</span>
                    <span className="text-sm text-muted-foreground">{Math.round(audioLevel)}%</span>
                  </div>
                  <Progress value={audioLevel} className="h-2" />
                </div>

                {cryingDetected && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Crying Detected</span>
                    </div>
                    <div className="text-sm text-orange-600 mt-1">
                      Intensity: {Math.round(cryingIntensity)}%
                    </div>
                    <Progress 
                      value={cryingIntensity} 
                      className="h-2 mt-2" 
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-Way Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Speak to Baby
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Push to Talk */}
            <div className="space-y-2">
              <Button
                variant={isSpeaking ? 'destructive' : 'default'}
                size="lg"
                className="w-full"
                onMouseDown={startSpeaking}
                onMouseUp={stopSpeaking}
                onTouchStart={startSpeaking}
                onTouchEnd={stopSpeaking}
              >
                {isSpeaking ? (
                  <>
                    <PhoneOff className="h-5 w-5 mr-2" />
                    Speaking... (Release to stop)
                  </>
                ) : (
                  <>
                    <Phone className="h-5 w-5 mr-2" />
                    Hold to Speak
                  </>
                )}
              </Button>
              
              {isSpeaking && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-600">Live to baby</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Messages */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Quick Messages</div>
              <div className="grid grid-cols-1 gap-2">
                {quickMessages.map((message, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => speakQuickMessage(message)}
                    disabled={isSpeaking}
                    className="text-left justify-start h-auto p-2"
                  >
                    <Volume2 className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="text-xs">{message}</span>
                  </Button>
                ))}
              </div>
            </div>

            {lastSpokenMessage && (
              <div className="p-2 bg-muted rounded text-sm">
                <div className="text-muted-foreground">Last message:</div>
                <div>{lastSpokenMessage}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Speaker Volume</span>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Microphone Sensitivity</span>
                <span className="text-sm text-muted-foreground">High</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Crying Detection</span>
              <Badge variant="default">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}