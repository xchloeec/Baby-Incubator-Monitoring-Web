import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, Zap } from 'lucide-react';

interface Position {
  name: string;
  x: number;
  y: number;
  z: number;
  description: string;
}

const presetPositions: Position[] = [
  { name: 'Neutral', x: 0, y: 0, z: 0, description: 'Flat, centered position' },
  { name: 'Left Side', x: -15, y: 0, z: 0, description: 'Gentle left tilt for digestion' },
  { name: 'Right Side', x: 15, y: 0, z: 0, description: 'Gentle right tilt' },
  { name: 'Head Elevated', x: 0, y: 10, z: 0, description: 'Slight head elevation' },
  { name: 'Feeding Position', x: -10, y: 15, z: 0, description: 'Optimal for feeding' },
  { name: 'Sleep Position', x: 5, y: -5, z: 0, description: 'Comfortable sleep angle' }
];

export function PositionControl() {
  const [currentPosition, setCurrentPosition] = useState<Position>(presetPositions[0]);
  const [isMoving, setIsMoving] = useState(false);
  const [customPosition, setCustomPosition] = useState({ x: 0, y: 0, z: 0 });

  const handlePresetPosition = async (position: Position) => {
    setIsMoving(true);
    setCurrentPosition(position);
    setCustomPosition({ x: position.x, y: position.y, z: position.z });
    
    // Simulate servo motor movement time
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsMoving(false);
  };

  const handleCustomAdjustment = async (axis: 'x' | 'y' | 'z', delta: number) => {
    if (isMoving) return;
    
    setIsMoving(true);
    const newPosition = { ...customPosition };
    newPosition[axis] = Math.max(-30, Math.min(30, newPosition[axis] + delta));
    setCustomPosition(newPosition);
    
    // Update current position to custom
    setCurrentPosition({
      name: 'Custom',
      x: newPosition.x,
      y: newPosition.y,
      z: newPosition.z,
      description: `X: ${newPosition.x}°, Y: ${newPosition.y}°, Z: ${newPosition.z}°`
    });

    // Simulate servo motor movement time
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsMoving(false);
  };

  const resetToNeutral = () => {
    handlePresetPosition(presetPositions[0]);
  };

  return (
    <div className="space-y-4">
      {/* Current Position Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Current Position
            </span>
            <Badge variant={isMoving ? 'secondary' : 'default'}>
              {isMoving ? 'Moving...' : 'Stable'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="font-semibold">{currentPosition.name}</div>
              <div className="text-sm text-muted-foreground">{currentPosition.description}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">X-Axis</div>
                <div className="text-lg font-semibold">{currentPosition.x}°</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Y-Axis</div>
                <div className="text-lg font-semibold">{currentPosition.y}°</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Z-Axis</div>
                <div className="text-lg font-semibold">{currentPosition.z}°</div>
              </div>
            </div>

            {isMoving && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 animate-pulse" />
                Servo motors adjusting position...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preset Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Preset Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {presetPositions.map((position, index) => (
              <Button
                key={index}
                variant={currentPosition.name === position.name ? 'default' : 'outline'}
                onClick={() => handlePresetPosition(position)}
                disabled={isMoving}
                className="h-auto p-3 text-left"
              >
                <div>
                  <div className="font-semibold text-sm">{position.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {position.x}°, {position.y}°, {position.z}°
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* X-Axis Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">X-Axis (Left/Right Tilt)</span>
                <span className="text-sm text-muted-foreground">{customPosition.x}°</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCustomAdjustment('x', -5)}
                  disabled={isMoving || customPosition.x <= -30}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Left
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCustomAdjustment('x', 5)}
                  disabled={isMoving || customPosition.x >= 30}
                >
                  <ArrowRight className="h-4 w-4" />
                  Right
                </Button>
              </div>
            </div>

            {/* Y-Axis Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Y-Axis (Head/Foot Elevation)</span>
                <span className="text-sm text-muted-foreground">{customPosition.y}°</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCustomAdjustment('y', 5)}
                  disabled={isMoving || customPosition.y >= 30}
                >
                  <ArrowUp className="h-4 w-4" />
                  Head Up
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCustomAdjustment('y', -5)}
                  disabled={isMoving || customPosition.y <= -30}
                >
                  <ArrowDown className="h-4 w-4" />
                  Head Down
                </Button>
              </div>
            </div>

            {/* Quick Reset */}
            <Button
              variant="destructive"
              size="sm"
              onClick={resetToNeutral}
              disabled={isMoving || (currentPosition.name === 'Neutral')}
              className="w-full flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Reset to Neutral Position
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}