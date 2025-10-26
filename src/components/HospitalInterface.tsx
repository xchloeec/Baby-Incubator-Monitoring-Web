import { useState } from 'react';
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
  Phone
} from 'lucide-react';

// ✅ Add sensorData prop (no change to existing ones)
interface HospitalInterfaceProps {
  onBackToSelection: () => void;
  sensorData?: {
    heartRate: number;
    oxygenLevel: number;
    temperature: number;
    humidity: number;
    gyroscope: { x: number; y: number; z: number };
  };
}

export function HospitalInterface({ onBackToSelection, sensorData }: HospitalInterfaceProps) {
  const [emergencyAlerts, setEmergencyAlerts] = useState<string[]>([]);
  const [cryingIntensity, setCryingIntensity] = useState(0);
  const [capturedPhotoData, setCapturedPhotoData] = useState<{ id: string; timestamp: Date; liveImage: string } | undefined>();

  const handleEmergencyAlert = (message: string) => {
    setEmergencyAlerts(prev => [...prev, message]);
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
                    Patient: Emma Johnson • DOB: Oct 1, 2024 • 7 days old
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Staff Info */}
              <div className="text-right">
                <div className="text-sm font-medium">Dr. Sarah Johnson</div>
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
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Live Feed</span>
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Controls</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Nursing Notes</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Documentation</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
              {emergencyAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] text-xs">
                  {emergencyAlerts.length}
                </Badge>
              )}
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
                <VideoFeed onCapturePhoto={handlePhotoCapture} />
              </div>
            </div>

            {/* ✅ Pass live sensorData into SensorPanel */}
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
                      <span className="font-medium">Maria Garcia, RN</span>
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
                    <div>Dr. Sarah Johnson - Neonatologist</div>
                    <div>Dr. Mike Chen - Respiratory Therapist</div>
                    <div>Lisa Park, RD - Nutritionist</div>
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
            <VideoFeed onCapturePhoto={handlePhotoCapture} />
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls">
            <PositionControl />
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
            <AlertSystem 
              emergencyAlerts={emergencyAlerts}
              cryingIntensity={cryingIntensity}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
