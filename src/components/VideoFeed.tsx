import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Camera, CameraOff, Maximize } from 'lucide-react';
//import io from 'socket.io-client';

interface VideoFeedProps {
  socket: any; //replace the import io
  onCapturePhoto: (photoData: { id: string; timestamp: Date; liveImage: string }) => void;
  showAudioControls?: boolean;
  onCryingDetected?: (intensity: number) => void;
}

// 🔗 Connect to your Pi backend (update IP if needed)
/////const socket = io('http://172.26.152.203:5000');  // or use https:// if SSL enabled


export function VideoFeed({ socket,onCapturePhoto }: VideoFeedProps) {
  const [isLive, setIsLive] = useState(false);
  const [frame, setFrame] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastCaptured, setLastCaptured] = useState<string>('');

  // --- Connect to live camera feed from Raspberry Pi ---
  useEffect(() => {
    socket.emit('start_camera');
    setIsLive(true);

    socket.on('camera_frame', (data: any) => {
      setFrame(`data:image/jpeg;base64,${data.image}`);
    });

    socket.on('disconnect', () => setIsLive(false));
    socket.on('connect', () => setIsLive(true));

    // 💡 listen for saved confirmation from backend
    socket.on('capture_saved', (data: any) => {
      if (data.status === 'success') {
        console.log('✅ Photo saved at:', data.path);
        alert('📸 Photo saved successfully!');
      } else {
        alert('⚠️ Failed to save photo.');
      }
    });

    return () => {
      socket.off('camera_frame');
      socket.off('capture_saved'); // 💡 clean up listener
    };
  }, []);

  // --- Capture current frame ---
  const handleCapture = async () => {
    const timestamp = new Date();
    const photoId = `baby-${Date.now()}`;

    if (!frame) return;

    // Set the last captured timestamp
    setLastCaptured(timestamp.toLocaleString());

    // 💡 Emit capture request to backend
    socket.emit('capture_frame', {
      photoId,
      timestamp,
      liveImage: frame, // Send the current frame data
    });

    onCapturePhoto({
      id: photoId,
      timestamp,
      liveImage: frame,
    });
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div className="space-y-4">
      <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : ''} bg-card`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Live Video Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isLive ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            {isLive && frame ? (
              <img
                src={frame}
                alt="Live feed from baby incubator"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CameraOff className="h-16 w-16 text-gray-500" />
              </div>
            )}

            {/* Timestamp overlay */}
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {new Date().toLocaleTimeString()}
            </div>

            {/* Status overlay */}
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              Incubator #3 – Room 204A
            </div>

            {/* Recording indicator */}
            {isLive && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-sm">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                REC
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-4 gap-2">
            <div className="flex gap-2">
              <Button
                onClick={handleCapture}
                disabled={!isLive || !frame}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Capture Moment
              </Button>
              <Button
                variant="outline"
                onClick={toggleFullscreen}
                disabled={!isLive}
                className="flex items-center gap-2"
              >
                <Maximize className="h-4 w-4" />
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
            </div>

            {lastCaptured && (
              <p className="text-sm text-muted-foreground">
                Last photo: {lastCaptured}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
