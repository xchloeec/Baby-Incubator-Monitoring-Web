import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Heart, Thermometer, Droplets, Compass, AlertTriangle } from 'lucide-react';

interface SensorData {
  heartRate: number;
  temperature: number;
  humidity: number;
  gyroscope: { x: number; y: number; z: number };
  oxygenLevel: number;
}

interface SensorPanelProps {
  onEmergencyAlert: (message: string) => void;
  sensorData?: SensorData; // ✅ NEW: allow live data from parent
}

export function SensorPanel({ onEmergencyAlert, sensorData }: SensorPanelProps) {
  const [internalData, setInternalData] = useState<SensorData>({
    heartRate: 0,
    temperature: 0,
    humidity: 0,
    gyroscope: { x: 0, y: 0, z: 0 },
    oxygenLevel: 0
  });

  const [alerts, setAlerts] = useState<string[]>([]);

  // ✅ NEW: whenever parent sends updated live readings, update local state
  useEffect(() => {
    if (sensorData) setInternalData(sensorData);
  }, [sensorData]);

  // 🧠 Status helpers
  const getHeartRateStatus = (hr: number) => {
    if (hr < 130) return { status: 'Low', color: 'destructive' };
    if (hr > 170) return { status: 'High', color: 'destructive' };
    return { status: 'Normal', color: 'default' };
  };

  const getTempStatus = (temp: number) => {
    if (temp < 36.2) return { status: 'Low', color: 'destructive' };
    if (temp > 37.5) return { status: 'High', color: 'destructive' };
    return { status: 'Normal', color: 'default' };
  };

  const getOxygenStatus = (level: number) => {
    if (level < 95) return { status: 'Low', color: 'destructive' };
    return { status: 'Normal', color: 'default' };
  };

  // 🩺 UI
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* ❤️ Heart Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Heart Rate
          </CardTitle>
          <Badge variant={getHeartRateStatus(internalData.heartRate).color as any}>
            {getHeartRateStatus(internalData.heartRate).status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{Math.round(internalData.heartRate)} BPM</div>
            <Progress
              value={(internalData.heartRate - 120) / (180 - 120) * 100}
              className="h-2"
            />
            <p className="text-sm text-muted-foreground">Normal: 130–170 BPM</p>
          </div>
        </CardContent>
      </Card>

      {/* 🌡️ Temperature */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-orange-500" />
            Temperature
          </CardTitle>
          <Badge variant={getTempStatus(internalData.temperature).color as any}>
            {getTempStatus(internalData.temperature).status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{internalData.temperature.toFixed(1)}°C</div>
            <Progress
              value={(internalData.temperature - 35) / (38 - 35) * 100}
              className="h-2"
            />
            <p className="text-sm text-muted-foreground">Normal: 36.2–37.5°C</p>
          </div>
        </CardContent>
      </Card>

      {/* 💧 Humidity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Humidity
          </CardTitle>
          <Badge variant="default">Normal</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{Math.round(internalData.humidity)}%</div>
            <Progress value={internalData.humidity} className="h-2" />
            <p className="text-sm text-muted-foreground">Target: 50–70%</p>
          </div>
        </CardContent>
      </Card>

      {/* 🫁 Oxygen Level */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-500" />
            Oxygen Level
          </CardTitle>
          <Badge variant={getOxygenStatus(internalData.oxygenLevel).color as any}>
            {getOxygenStatus(internalData.oxygenLevel).status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{Math.round(internalData.oxygenLevel)}%</div>
            <Progress value={internalData.oxygenLevel} className="h-2" />
            <p className="text-sm text-muted-foreground">Normal: 95–100%</p>
          </div>
        </CardContent>
      </Card>

      {/* 🧭 Gyroscope */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-purple-500" />
            Position & Movement
          </CardTitle>
          <Badge variant="default">Stable</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">X-Axis</div>
              <div className="text-lg font-semibold">{internalData.gyroscope.x.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Y-Axis</div>
              <div className="text-lg font-semibold">{internalData.gyroscope.y.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Z-Axis</div>
              <div className="text-lg font-semibold">{internalData.gyroscope.z.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⚠️ Active Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {alerts.map((alert, index) => (
                <div key={index} className="text-sm font-medium text-destructive">
                  • {alert}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
