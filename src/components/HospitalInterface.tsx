import { useEffect, useMemo, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { VideoFeed } from './VideoFeed';
import { SensorPanel } from './SensorPanel';
import { PositionControl } from './PositionControl';
import { PhotoGallery } from './PhotoGallery';
import { AlertSystem } from './AlertSystem';
import { NursingNotes } from './NursingNotes';
import CryingClassification from './CryingClassification';
import { Volume2 } from 'lucide-react';
import { 
  Activity, 
  Camera, 
  Settings, 
  Image, 
  AlertTriangle,
  Stethoscope,
  ArrowLeft,
  Shield,
  Users,
  Clock,
  FileText,
  Phone,
  Radio,
  FlaskConical,
  Zap,
  RefreshCw
} from 'lucide-react';

interface HospitalInterfaceProps {
  onBackToSelection: () => void;
  sensorData?: {
    heartRate: number;
    oxygenLevel: number;
    temperature: number;
    humidity: number;
    gyroscope: { x: number; y: number; z: number };
  };
  socket: any;
  bedState: {
    label: string;
    description: string;
    x: number;
    y: number;
    z: number;
    stable: boolean;
  };
}

export function HospitalInterface({ onBackToSelection, sensorData, socket, bedState }: HospitalInterfaceProps) {
  // --- Popup (non-intrusive toast) ---
  const [popup, setPopup] = useState<{title: string; description: string; tone: 'danger' | 'warn' | 'info'} | null>(null);
  const showPopup = (title: string, description: string, tone: 'danger'|'warn'|'info'='info') => {
    setPopup({ title, description, tone });
    window.setTimeout(() => setPopup(null), 4500);
  };

  
  const [emergencyAlerts, setEmergencyAlerts] = useState<string[]>([]);
  const [cryingIntensity, setCryingIntensity] = useState(0);
  const [capturedPhotoData, setCapturedPhotoData] = useState<{ id: string; timestamp: Date; liveImage: string } | undefined>();

  // NEW: Alerts data mode
  const [alertsDataMode, setAlertsDataMode] = useState<'realtime' | 'simulate'>('realtime');

  // ===== helpers =====
  const handleEmergencyAlert = (message: string) => {
    setEmergencyAlerts(prev => [...prev, message]);
    // 触发给 <AlertSystem /> 之后，把触发数组清空（你原本就这样做的）
    setTimeout(() => {
      setEmergencyAlerts(prev => prev.filter(alert => alert !== message));
    }, 100);
  };

  const handleCryingDetected = (intensity: number) => {
    setCryingIntensity(intensity);
  };

  const handlePhotoCapture = (photoData: { id: string; timestamp: Date; liveImage: string }) => {
    setCapturedPhotoData(photoData);
    setTimeout(() => setCapturedPhotoData(undefined), 100);
  };

  const randomEmergencyMessage = () => {
    const samples = [
      'SpO₂ dropped below 88%',
      'Heart rate exceeded safe range',
      'Temperature out of range',
      'Apnea event detected',
      'Humidity sensor anomaly',
      'Bed instability detected',
    ];
    return samples[Math.floor(Math.random() * samples.length)];
  };

  const oneShotRandomEmergency = () => {
    handleEmergencyAlert(randomEmergencyMessage());
  };

  const oneShotCryingSpike = () => {
    // 让它大概率 >70，触发 AlertSystem 的哭声告警
    const spike = 70 + Math.floor(Math.random() * 30); // 70~99
    handleCryingDetected(spike);
  };

  // ====== SIMULATION INTERVALS ======
  const simAlertTimerRef = useRef<number | null>(null);
  const simCryTimerRef = useRef<number | null>(null);

  const startSimulation = () => {
    stopSimulation();
    // 每 6 秒触发一次随机紧急告警
    simAlertTimerRef.current = window.setInterval(() => {
      oneShotRandomEmergency();
    }, 6000);
    // 每 4 秒刷新一次哭声，20% 概率大于 70
    simCryTimerRef.current = window.setInterval(() => {
      const high = Math.random() < 0.2;
      const val = high ? 70 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 60);
      handleCryingDetected(val);
    }, 4000);
  };

  const stopSimulation = () => {
    if (simAlertTimerRef.current) {
      clearInterval(simAlertTimerRef.current);
      simAlertTimerRef.current = null;
    }
    if (simCryTimerRef.current) {
      clearInterval(simCryTimerRef.current);
      simCryTimerRef.current = null;
    }
  };

  // ====== SOCKET (REALTIME) SUBSCRIPTIONS ======
  useEffect(() => {
  if (alertsDataMode !== 'realtime' || !socket) return;

  const onEmergency = (msg: any) => {
    const text = typeof msg === 'string' ? msg : (msg?.message ?? 'Emergency alert');
    handleEmergencyAlert(text);

    // NEW: popup
    const sev = (typeof msg === 'object' ? msg?.severity : undefined) as 'warning'|'info'|undefined;
    showPopup(
      sev === 'warning' ? 'Crying Detected' : 'System Notice',
      text,
      sev === 'warning' ? 'danger' : 'info'
    );
  };

  const onCrying = (val: any) => {
    const n = typeof val === 'number' ? val : Number(val?.intensity ?? 0);
    handleCryingDetected(isNaN(n) ? 0 : n);

    // Optional: toast only on high intensity
    if (!isNaN(n) && n >= 80) {
      showPopup('High Crying Intensity', `Detected ~${Math.round(n)}%`, 'warn');
    }
  };

  socket.on('emergency_alert', onEmergency);
  socket.on('crying_intensity', onCrying);
  return () => {
    socket.off('emergency_alert', onEmergency);
    socket.off('crying_intensity', onCrying);
  };
}, [alertsDataMode, socket]);


  // 切换模式时启动/停止模拟
  useEffect(() => {
    if (alertsDataMode === 'simulate') {
      startSimulation();
    } else {
      stopSimulation();
    }
    return () => stopSimulation();
  }, [alertsDataMode]);

   return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBackToSelection}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">NeoGuard Medical Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Patient: Cleo • DOB: Nov 6, 2025 • 7 days old
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Staff Info */}
              <div className="text-right">
                <div className="text-sm font-medium">Dr. Gokul</div>
                <div className="text-xs text-muted-foreground">Primary Neonatologist</div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Users className="h-4 w-4 mr-1" />
                  Consult
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-1" />
                  Notes
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                  <Phone className="h-4 w-4 mr-1" />
                  Emergency
                </Button>
              </div>
              
              {/* System Status */}
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    All Systems Operational
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Room 204A • Incubator #3 • Last sync: now
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex w-full flex-wrap gap-2 lg:grid lg:grid-cols-7 lg:w-auto">
            <TabsTrigger value="overview" className="w-full justify-center gap-2 h-10">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>

            <TabsTrigger value="video" className="w-full justify-center gap-2 h-10">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Live Feed</span>
            </TabsTrigger>

            <TabsTrigger value="controls" className="w-full justify-center gap-2 h-10">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Controls</span>
            </TabsTrigger>

            <TabsTrigger value="notes" className="w-full justify-center gap-2 h-10">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Nursing Notes</span>
            </TabsTrigger>

            <TabsTrigger value="gallery" className="w-full justify-center gap-2 h-10">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Documentation</span>
            </TabsTrigger>

            <TabsTrigger value="alerts" className="w-full justify-center gap-2 h-10">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
              {emergencyAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] text-xs">
                  {emergencyAlerts.length}
                </Badge>
              )}
            </TabsTrigger>

            {/* NEW: Crying Classification */}
            <TabsTrigger value="cry" className="w-full justify-center gap-2 h-10">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Crying Classification</span>
            </TabsTrigger>
          </TabsList>


          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Medical Summary */}
              <Card className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Shield className="h-5 w-5" />
                    Medical Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Gestational Age:</span>
                      <span className="font-medium">32 weeks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Birth Weight:</span>
                      <span className="font-medium">1.9 lbs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Current Weight:</span>
                      <span className="font-medium">2.1 lbs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Days in NICU:</span>
                      <span className="font-medium">7 days</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-2">Active Orders:</div>
                    <div className="space-y-1 text-xs">
                      <div>• Respiratory support</div>
                      <div>• Nutritional monitoring</div>
                      <div>• Growth assessment</div>
                      <div>• Audio monitoring active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Video Feed */}
              <div className="lg:col-span-3">
                <VideoFeed socket={socket} onCapturePhoto={handlePhotoCapture} />
              </div>
            </div>

            {/* Pass live sensorData into SensorPanel */}
            <SensorPanel 
              sensorData={sensorData} 
              onEmergencyAlert={handleEmergencyAlert} 
            />

            {/* Shift Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4" />
                    Current Shift
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Primary Nurse:</span>
                      <span className="font-medium">Sin Tian, RN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift:</span>
                      <span className="font-medium">7:00 AM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Round:</span>
                      <span className="font-medium">2:00 PM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Care Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>Dr. Gokul - Neonatologist</div>
                    <div>Dr. John - Respiratory Therapist</div>
                    <div>Chloe Chong, RD - Nutritionist</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Recent Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="text-xs text-muted-foreground">Today 10:30 AM</div>
                    <div>"Patient showing good weight gain. Respiratory status stable."</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video">
            <VideoFeed socket={socket} onCapturePhoto={handlePhotoCapture} />
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls">
            <PositionControl bedState={bedState} socket={socket} />
          </TabsContent>

          {/* Nursing Notes Tab */}
          <TabsContent value="notes">
            <NursingNotes />
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <PhotoGallery newPhotoData={capturedPhotoData} />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            {/* 顶部：模式切换 + 一键触发 */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alerts Test Controls
                  </span>
                  <div className="flex gap-2">
                    <Badge variant={alertsDataMode === 'realtime' ? 'default' : 'outline'}>
                      <Radio className="h-3 w-3 mr-1" />
                      Realtime
                    </Badge>
                    <Badge variant={alertsDataMode === 'simulate' ? 'default' : 'outline'}>
                      <FlaskConical className="h-3 w-3 mr-1" />
                      Simulate
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant={alertsDataMode === 'realtime' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAlertsDataMode('realtime')}
                  title="Use socket events (emergency_alert / crying_intensity)"
                >
                  <Radio className="h-4 w-4 mr-1" />
                  Realtime
                </Button>
                <Button
                  variant={alertsDataMode === 'simulate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAlertsDataMode('simulate')}
                  title="Generate random alerts & crying spikes periodically"
                >
                  <FlaskConical className="h-4 w-4 mr-1" />
                  Simulate
                </Button>

                <div className="w-px h-6 bg-muted mx-1" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={oneShotRandomEmergency}
                  title="Trigger one random emergency"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Add Random Emergency
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={oneShotCryingSpike}
                  title="Raise crying intensity once (>70 likely)"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Spike Crying
                </Button>
              </CardContent>
            </Card>

            {/* 真正的 AlertSystem 展示 */}
            <AlertSystem 
              emergencyAlerts={emergencyAlerts}
              cryingIntensity={cryingIntensity}
            />
          </TabsContent>

          {/* Crying Classification Tab */}
            <TabsContent value="cry" className="space-y-6">
              <CryingClassification socket={socket} />
            </TabsContent>

        </Tabs>
      </div>
    
      {/* Floating Popup */}
      {popup && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`w-[320px] rounded-2xl shadow-xl border p-4 bg-white
            ${popup.tone === 'danger' ? 'border-red-200' : popup.tone === 'warn' ? 'border-orange-200' : 'border-blue-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`h-2 w-2 mt-2 rounded-full
                ${popup.tone === 'danger' ? 'bg-red-500' : popup.tone === 'warn' ? 'bg-orange-500' : 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{popup.title}</div>
                <div className="text-sm text-muted-foreground break-words mt-1">
                  {popup.description}
                </div>
              </div>
              <button
                className="text-sm text-muted-foreground hover:opacity-70"
                onClick={() => setPopup(null)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}
