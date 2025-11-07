import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, Zap } from 'lucide-react';

// The shape of a preset "pose" shown in the UI
interface Position {
  name: string;
  x: number;
  y: number;
  z: number;
  description: string;
}

// Props coming in from parent: live bed state streamed from Pi + the connected socket
type PositionControlProps = {
  bedState: {
    label: string;
    description: string;
    x: number;
    y: number;
    z: number;
    stable: boolean;
  };
  socket: any;
};

// All the preset cards shown in "Preset Positions"
const presetPositions: Position[] = [
  { name: 'Neutral',          x: 0,   y: 0,   z: 0,   description: 'Flat, centered position' },
  { name: 'Left Side',        x: -15, y: 0,   z: 0,   description: 'Gentle left tilt for digestion' },
  { name: 'Right Side',       x: 15,  y: 0,   z: 0,   description: 'Gentle right tilt' },
  { name: 'Head Elevated',    x: 0,   y: 10,  z: 0,   description: 'Slight head elevation' },
  { name: 'Feeding Position', x: -10, y: 15,  z: 0,   description: 'Optimal for feeding' },
  { name: 'Sleep Position',   x: 5,   y: -5,  z: 0,   description: 'Comfortable sleep angle' }
];


export function PositionControl({ bedState, socket }: PositionControlProps) {

  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);

  // Tracks which preset/custom pose we *intend* to be in (for button highlighting / labels)
  const [currentPosition, setCurrentPosition] = useState<Position>(presetPositions[0]);

  // Whether we're currently "in motion" / temporarily locking buttons
  const [isMoving, setIsMoving] = useState(false);

  // Local manual adjustment state (X/Y/Z request we're building with arrows)
  const [customPosition, setCustomPosition] = useState({ x: 0, y: 0, z: 0 });

  // Helper: convert a preset name into the mode string the Pi expects
  function mapNameToMode(name: string): string {
    switch (name) {
      case 'Neutral':
        return 'flat';
      case 'Left Side':
        return 'left_side';
      case 'Right Side':
        return 'right_side';
      case 'Head Elevated':
        return 'head_elevated';
      case 'Feeding Position':
        return 'feeding';
      case 'Sleep Position':
        return 'sleep';
      default:
        return 'flat';
    }
  }

  // Called when a preset (Neutral / Left Side / etc.) is tapped
  const handlePresetPosition = async (position: Position) => {
    if (isMoving) return;
    setIsMoving(true);

    // Update local "intended" state so UI highlights the active card and description
    setCurrentPosition(position);

    // Sync manual state to that preset as well (so manual panel reflects it)
    setCustomPosition({ x: position.x, y: position.y, z: position.z });

    // Tell the Pi which named pose to move to
    const mode = mapNameToMode(position.name);
    if (socket) {
      socket.emit("set_bed_position", { mode });
    }

    // Small delay so we can show "Moving..." and avoid spamming emits
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsMoving(false);
  };

  // Called when nurse nudges X / Y axis arrows under "Manual Adjustment"
  const handleCustomAdjustment = async (axis: 'x' | 'y' | 'z', delta: number) => {
    if (isMoving) return;
    setIsMoving(true);

    // 1. Optimistically update local UI so user sees it move immediately
    //    (we still keep this for display)
    const newPosition = { ...customPosition };
    newPosition[axis] = newPosition[axis] + delta;
    setCustomPosition(newPosition);

    setCurrentPosition({
      name: 'Custom',
      x: newPosition.x,
      y: newPosition.y,
      z: newPosition.z,
      description: `X: ${newPosition.x}°, Y: ${newPosition.y}°, Z: ${newPosition.z}°`
    });

    // 2. Tell the Pi "nudge this axis by this delta"
    if (socket) {
      socket.emit("set_manual_offset", {
        axis,   // 'x' | 'y' | 'z'
        delta,  // +5 or -5 from the button
      });
    }

    // 3. cooldown so we don't spam
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsMoving(false);
  };


  // Big red "Reset to Neutral Position" button
  const resetToNeutral = () => {
    handlePresetPosition(presetPositions[0]); // index 0 is Neutral
  };

  return (
    <div className="space-y-4">

      {/* === CURRENT POSITION CARD (live telemetry from Pi) === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Current Position
            </span>

            <Badge variant={bedState.stable ? "default" : "secondary"}>
              {bedState.stable ? "Stable" : "Moving..."}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="font-semibold">{bedState.label}</div>
              <div className="text-sm text-muted-foreground">
                {bedState.description}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">X-Axis</div>
                <div className="text-lg font-semibold">{bedState.x}°</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Y-Axis</div>
                <div className="text-lg font-semibold">{bedState.y}°</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Z-Axis</div>
                <div className="text-lg font-semibold">{bedState.z}°</div>
              </div>
            </div>

            {!bedState.stable && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 animate-pulse" />
                Servo motors adjusting position...
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* === PRESET POSITIONS === */}
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

            {/* === SOOTHING / MOTION MODES === */}
      <Card>
        <CardHeader>
          <CardTitle>Comfort Motion</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Timer selection */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Session Duration</div>
            {/* super simple, fixed options for now */}
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 20, 30].map((min) => (
                <Button
                  key={min}
                  variant="outline"
                  size="sm"
                  disabled={isMoving}
                  onClick={() => {
                    // store in local state so we know what to send
                    setSelectedMinutes(min);
                  }}
                >
                  {min} min
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Currently selected: {selectedMinutes} min
            </div>
          </div>

          {/* Rocking row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border rounded p-3">
            <div>
              <div className="text-sm font-semibold">Gentle Rocking</div>
              <div className="text-xs text-muted-foreground">
                Side-to-side soothing motion
              </div>
            </div>
            <Button
              size="sm"
              disabled={isMoving}
              onClick={() => {
                if (socket) {
                  socket.emit("start_motion", {
                    type: "rock",
                    minutes: selectedMinutes,
                  });
                }
              }}
            >
              Start Rocking
            </Button>
          </div>

          {/* Breathing row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border rounded p-3">
            <div>
              <div className="text-sm font-semibold">Womb Breathing</div>
              <div className="text-xs text-muted-foreground">
                Slow lift / settle, like caregiver breathing
              </div>
            </div>
            <Button
              size="sm"
              disabled={isMoving}
              onClick={() => {
                if (socket) {
                  socket.emit("start_motion", {
                    type: "breathe",
                    minutes: selectedMinutes,
                  });
                }
              }}
            >
              Start Breathing
            </Button>
          </div>

          {/* Stop button */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              if (socket) socket.emit("stop_motion");
            }}
          >
            Stop Motion Now
          </Button>

        </CardContent>
      </Card>


      {/* === MANUAL ADJUSTMENT === */}
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

            {/* Reset to Neutral */}
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