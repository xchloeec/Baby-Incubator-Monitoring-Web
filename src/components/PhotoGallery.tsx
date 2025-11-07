import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Camera, Download, Share, Heart, Calendar, Clock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const PI_BASE = "http://192.168.137.6:5000";

interface Photo {
  id: string;
  url: string;
  timestamp: Date;
  description: string;
  isFavorite: boolean;
  tags: string[];
}

interface PhotoGalleryProps {
  newPhotoData?: { id: string; timestamp: Date; liveImage: string };
}

function toDateSafe(v: unknown): Date {
  if (typeof v === "number" && Number.isFinite(v)) return new Date(v * 1000);
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return new Date(t);
  }
  if (v instanceof Date) return v;
  return new Date();
}

export function PhotoGallery({ newPhotoData }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([
    {
      id: '1',
      url: 'https://media.istockphoto.com/id/1321458945/photo/newborn-baby-sleep-at-first-days-of-life-portrait-of-new-born-child-boy-one-week-old-sleeping.jpg?s=612x612&w=0&k=20&c=yDYOLloEdbFExU73HCHUgNjkqLlbniBU91it80IzsnY=',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      description: 'Sweet dreams in the incubator',
      isFavorite: true,
      tags: ['sleeping', 'peaceful', 'incubator']
    },
    {
      id: '2',
      url: 'https://media.istockphoto.com/id/1389431211/photo/newborn-baby-sleeping-smiling-cute-infant-child-in-wrap-bodysuit-new-born-little-boy-smile-in.jpg?s=612x612&w=0&k=20&c=ASQjS9UCWpddE0sDVEgxrAyke6BOF-im7LpI0sXECck=',
      timestamp: new Date(Date.now() - 43200000), // 12 hours ago
      description: 'Resting comfortably',
      isFavorite: false,
      tags: ['awake', 'comfort', 'monitoring']
    },
    {
      id: '3',
      url: 'https://raisingchildren.net.au/__data/assets/image/0026/47816/newborn-behaviour-nutshellnarrow.jpg',
      timestamp: new Date(Date.now() - 21600000), // 6 hours ago
      description: 'Growing stronger every day',
      isFavorite: true,
      tags: ['growth', 'development', 'milestone']
    },
    {
      id: '4',
      url: 'https://static.vecteezy.com/system/resources/thumbnails/052/112/653/small/beautiful-newborn-baby-smiling-on-white-cottony-background-photo.jpg',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      description: 'Precious moments captured',
      isFavorite: true,
      tags: ['portrait', 'bonding', 'love']
    },
    {
      id: '5',
      url: 'https://raisingchildren.net.au/__data/assets/image/0026/48095/newborn-first-weeknarrow.jpg',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      description: 'Medical care in progress',
      isFavorite: false,
      tags: ['medical', 'care', 'monitoring']
    },
    {
      id: '6',
      url: 'https://www.shutterstock.com/image-photo/newborn-baby-boy-who-just-600nw-2278473701.jpg',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      description: 'Safe in the incubator environment',
      isFavorite: true,
      tags: ['safety', 'incubator', 'protected']
    }
  ]);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all');

  // Add new photo when captured from live feed
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await fetch(`${PI_BASE}/api/photos`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const converted: Photo[] = data.map((p: any) => ({
          id: String(p.id),
          url: p.url.startsWith('http') ? p.url : `${PI_BASE}${p.url}`,
          timestamp: toDateSafe(p.timestamp),
          description: p.description || 'Captured moment',
          isFavorite: false,
          tags: p.tags ?? ['baby', 'capture'],
        }));

        if (isMounted) setPhotos(converted);
      } catch (err) {
        console.error('Failed to fetch /api/photos:', err);
      }
    })();

    return () => { isMounted = false; };
  }, []);
  //   if (newPhotoData) {
  //     const descriptions = [
  //       'Live feed capture - Sweet dreams',
  //       'Camera snapshot - Precious moment',
  //       'Live moment - Growing strong',
  //       'Video capture - Peaceful rest',
  //       'Feed screenshot - Adorable baby',
  //       'Live camera - Beautiful memory'
  //     ];
      
  //     const newPhoto: Photo = {
  //       id: newPhotoData.id,
  //       url: newPhotoData.liveImage,
  //       timestamp: newPhotoData.timestamp,
  //       description: descriptions[Math.floor(Math.random() * descriptions.length)],
  //       isFavorite: false,
  //       tags: ['recent', 'captured', 'live-feed', 'screenshot']
  //     };
  //     setPhotos(prev => [newPhoto, ...prev]);
  //   }
  // }, [newPhotoData]);

  const toggleFavorite = (photoId: string) => {
    setPhotos(prev => prev.map(photo =>
      photo.id === photoId ? { ...photo, isFavorite: !photo.isFavorite } : photo
    ));
  };

  const getFilteredPhotos = () => {
    switch (filter) {
      case 'favorites':
        return photos.filter(photo => photo.isFavorite);
      case 'recent':
        return photos.filter(photo => {
          const oneDayAgo = new Date(Date.now() - 86400000);
          return photo.timestamp > oneDayAgo;
        });
      default:
        return photos;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const downloadPhoto = (photo: Photo) => {
    // In a real app, this would download the actual image
    console.log('Downloading photo:', photo.id);
  };

  const sharePhoto = (photo: Photo) => {
    // In a real app, this would share the photo
    console.log('Sharing photo:', photo.id);
  };

    const filteredPhotos = (() => {
    if (filter === 'favorites') return photos.filter(p => p.isFavorite);
    if (filter === 'recent') {
      const oneDayAgo = new Date(Date.now() - 86400000);
      return photos.filter(p => p.timestamp > oneDayAgo);
    }
    return photos;
  })();

  return (
    <div className="space-y-4">
      {/* Gallery Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo Gallery
            </span>
            <Badge variant="outline">{photos.length} photos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({photos.length})
            </Button>
            <Button
              variant={filter === 'favorites' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('favorites')}
            >
              <Heart className="h-4 w-4 mr-1" />
              Favorites ({photos.filter(p => p.isFavorite).length})
            </Button>
            <Button
              variant={filter === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('recent')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Recent
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photo Grid */}
      <Card>
        <CardContent className="pt-6">
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No photos found</p>
              <p className="text-sm text-muted-foreground">
                {filter === 'favorites' ? 'No favorite photos yet' : 
                 filter === 'recent' ? 'No recent photos' : 
                 'Start capturing precious moments'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer">
                        <ImageWithFallback
                          src={photo.url}
                          alt={photo.description}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {photo.timestamp.toLocaleString()}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <ImageWithFallback
                          src={photo.url}
                          alt={photo.description}
                          className="w-full rounded-lg"
                        />
                        <div className="space-y-2">
                          <p className="font-medium">{photo.description}</p>
                          <div className="flex gap-1 flex-wrap">
                            {photo.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleFavorite(photo.id)}
                              className={photo.isFavorite ? 'text-red-600' : ''}
                            >
                              <Heart className={`h-4 w-4 mr-1 ${photo.isFavorite ? 'fill-current' : ''}`} />
                              {photo.isFavorite ? 'Favorited' : 'Add to Favorites'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPhoto(photo)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sharePhoto(photo)}
                            >
                              <Share className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Overlay with timestamp and favorite indicator */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                    <div className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {formatDate(photo.timestamp)}
                    </div>
                    {photo.isFavorite && (
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(photo.id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Heart className={`h-3 w-3 ${photo.isFavorite ? 'fill-current text-red-600' : ''}`} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Growth Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Growth Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {photos.slice(0, 3).map((photo, index) => (
              <div key={photo.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <ImageWithFallback
                  src={photo.url}
                  alt={photo.description}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{photo.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {photo.timestamp.toLocaleDateString()}
                  </div>
                </div>
                {photo.isFavorite && (
                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}