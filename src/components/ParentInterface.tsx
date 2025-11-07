import io from "socket.io-client";
const socket = io("http://172.26.152.203:5000");  // same IP as your Pi
//const socket = props.socket;

import { VoiceRecorder } from "./VoiceRecorder";
import { useState} from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { VideoFeed } from "./VideoFeed";
import { PhotoGallery } from "./PhotoGallery";
import { AudioControls } from "./AudioControls";
import { MilestoneTracker } from "./MilestoneTracker";
import CryingClassification from "./CryingClassification";


import {
  Baby,
  Camera,
  Heart,
  Volume2,
  Image,
  ArrowLeft,
  Phone,
  Video,
  MessageCircle,
  Activity,
  Thermometer,
  Droplets,
  Trophy,
} from "lucide-react";

import { useEffect } from "react";
//import { useToast } from "./ui/use-toast";   // make sure this file exists (see below)

// ✅ Add sensorData prop so readings come from App.tsx
interface ParentInterfaceProps {
  sensorData: {
    heartRate: number;
    oxygenLevel: number;
    temperature: number;
    humidity: number;
    gyroscope: { x: number; y: number; z: number };
  };
  socket: any;
  onBackToSelection: () => void;
}

export function ParentInterface({ sensorData, socket,onBackToSelection}: ParentInterfaceProps) {
  const [capturedPhotoData, setCapturedPhotoData] = useState<
    { id: string; timestamp: Date; liveImage: string } | undefined
  >();
  const [cryingIntensity, setCryingIntensity] = useState(0);
  //const { toast } = useToast();

    // useEffect(() => {
    // if (!socket) return;

    // socket.on("connect", () => {
    //   console.log("✅ Connected to baby monitor server");
    // });

    // socket.on("baby_alert", (data: any) => {
    //   console.log("📩 Baby alert received:", data);

      // show toast popup
  //     toast({
  //       title: data.status === "crying" ? "🚨 Baby Crying Detected" : "✅ Baby Calm Again",
  //       description: data.message,
  //       variant: data.status === "crying" ? "destructive" : "default",
  //     });
  //   });

  //   return () => {
  //     socket.off("baby_alert");
  //     socket.off("connect");
  //   };
  // }, [socket, toast]);

  // 🔹 Removed Raspberry Pi socket connection (this now comes from App.tsx)
  // 🔹 sensorData will update automatically from parent component

  // 🔹 Handlers
  const handlePhotoCapture = (photoData: {
    id: string;
    timestamp: Date;
    liveImage: string;
  }) => {
    setCapturedPhotoData(photoData);
    setTimeout(() => setCapturedPhotoData(undefined), 100);
  };

  const handleCryingDetected = (intensity: number) => {
    setCryingIntensity(intensity);
  };

  const handleEmergencyCall = () => console.log("🚨 Emergency call initiated");
  const handleVideoCall = () => console.log("📞 Video call initiated");

  // ==========================================================
  // ====================  MAIN RETURN  ========================
  // ==========================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* ---------- Header ---------- */}
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
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Baby className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Baby Emma</h1>
                  <p className="text-sm text-muted-foreground">
                    Your precious little one
                  </p>
                </div>
              </div>
            </div>

            {/* ---------- Header Right Section ---------- */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleVideoCall}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Video className="h-4 w-4 mr-1" />
                  Video Call Staff
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEmergencyCall}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Emergency
                </Button>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Baby is doing well
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Room 204A • Last update: just now
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Main Tabs ---------- */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="video" className="space-y-6">
          <TabsList className="flex w-full flex-wrap gap-2 lg:grid lg:grid-cols-5 lg:w-auto">
            <TabsTrigger value="video" className="w-full justify-center gap-2 h-10">
              <Camera className="h-5 w-5" />
              <span className="hidden sm:inline">Live View & Talk</span>
            </TabsTrigger>

            <TabsTrigger value="vitals" className="w-full justify-center gap-2 h-10">
              <Heart className="h-5 w-5" />
              <span className="hidden sm:inline">Health & Growth</span>
            </TabsTrigger>

            <TabsTrigger value="milestones" className="w-full justify-center gap-2 h-10">
              <Baby className="h-5 w-5" />
              <span className="hidden sm:inline">Milestones</span>
            </TabsTrigger>

            <TabsTrigger value="memories" className="w-full justify-center gap-2 h-10">
              <Image className="h-5 w-5" />
              <span className="hidden sm:inline">Photo Memories</span>
            </TabsTrigger>

            <TabsTrigger value="cry" className="w-full justify-center gap-2 h-10">
              <Volume2 className="h-5 w-5" />
              <span className="hidden sm:inline">Crying Classification</span>
            </TabsTrigger>
          </TabsList>


          {/* ---------- Video Tab ---------- */}
          <TabsContent value="video" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <VideoFeed
                  onCapturePhoto={handlePhotoCapture}
                  showAudioControls={true}
                  //onCryingDetected={handleCryingDetected} socket={undefined}                />
                  onCryingDetected={handleCryingDetected} socket={socket} />

        <>
          💬 Press & Hold to Talk Button
          <div className="mt-4 flex justify-center">
            <Button
              onMouseDown={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                  // create recorder
                  const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
                  console.log(socket.connected);
                  socket.emit("talk_start");
                  console.log("🎙️ talk_start emitted");

                  recorder.addEventListener("dataavailable", async (event) => {
                    if (event.data && event.data.size > 0) {
                      const buf = await event.data.arrayBuffer();
                      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
                      socket.emit("talk_chunk", { audio: base64 });
                      console.log("📤 Sent chunk", event.data.size, "bytes");
                    }
                  });

                  recorder.addEventListener("stop", () => {
                    socket.emit("talk_stop");
                    console.log("🔇 talk_stop emitted");
                    stream.getTracks().forEach((t) => t.stop());
                  });

                  recorder.start(250); // send every 250 ms
                  (window as any).talkRecorder = recorder;
                } catch (err) {
                  console.error("🎤 Mic access failed:", err);
                }
              }}
              onMouseUp={() => {
                const rec = (window as any).talkRecorder;
                if (rec && rec.state !== "inactive") rec.stop();
              }}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white"
            >
              🎤 Press & Hold to Talk
            </Button>
          </div>
        </>

          {/* </div> */}

              </div>

              {/* Quick Info */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-pink-800">
                      Quick Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Heart Rate</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        Normal
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Temperature</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        Stable
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Activity</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        Sleeping
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Care Team */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-800">
                      Care Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <div className="font-medium">Dr. Gokul</div>
                        <div className="text-muted-foreground">
                          Primary Neonatologist
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Nurse Sin Tian</div>
                        <div className="text-muted-foreground">
                          Day Shift • On duty
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ---------- Vitals Tab (Live Data) ---------- */}
          <TabsContent value="vitals">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Heart Rate */}
              <Card className="text-center">
                <CardHeader className="pb-3">
                  <Heart className="h-8 w-8 text-red-500 mx-auto" />
                  <CardTitle>Heart Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {Math.round(sensorData?.heartRate ?? 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">BPM</div>
                </CardContent>
              </Card>

              {/* Temperature */}
              <Card className="text-center">
                <CardHeader className="pb-3">
                  <Thermometer className="h-8 w-8 text-orange-500 mx-auto" />
                  <CardTitle>Temperature</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {((sensorData?.temperature ?? 0) * 9) / 5 + 32}°F
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(sensorData?.temperature ?? 0).toFixed(1)}°C
                  </div>
                </CardContent>
              </Card>

              {/* Oxygen Level */}
              <Card className="text-center">
                <CardHeader className="pb-3">
                  <Activity className="h-8 w-8 text-blue-500 mx-auto" />
                  <CardTitle>Oxygen Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(sensorData?.oxygenLevel ?? 0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">SpO₂</div>
                </CardContent>
              </Card>

              {/* Humidity */}
              <Card className="text-center">
                <CardHeader className="pb-3">
                  <Droplets className="h-8 w-8 text-cyan-500 mx-auto" />
                  <CardTitle>Humidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-600">
                    {Math.round(sensorData?.humidity ?? 0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">RH</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ---------- Milestones Tab ---------- */}
          <TabsContent value="milestones">
            <MilestoneTracker />
          </TabsContent>

          {/* ---------- Memories Tab ---------- */}
          <TabsContent value="memories">
            <PhotoGallery newPhotoData={capturedPhotoData} />
          </TabsContent>

          {/* ---------- Crying Classification Tab ---------- */}
          <TabsContent value="cry" className="space-y-6">
            <CryingClassification socket={socket} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
