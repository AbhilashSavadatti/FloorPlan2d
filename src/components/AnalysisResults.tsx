import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, ZoomIn, ZoomOut, RotateCcw, Eye, Home, Building, Ruler, LayoutGrid } from 'lucide-react';
import { CADGenerator } from './CADGenerator';

interface Detection {
  label: string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface Room {
  id: number;
  area: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface AnalysisData {
  detections: Detection[];
  object_counts: Record<string, number>;
  rooms: Room[];
  image_size: {
    width: number;
    height: number;
  };
}

interface AnalysisResultsProps {
  data: AnalysisData;
  originalImage: File;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data, originalImage }) => {
  const [activeTab, setActiveTab] = useState('original');
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [originalImage]);

  const drawDetections = (canvas: HTMLCanvasElement, image: HTMLImageElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    // Draw detection boxes
    data.detections.forEach((detection) => {
      const { box, label, confidence } = detection;
      const color = getColorForLabel(label);

      // Draw rectangle
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);

      // Draw label background
      ctx.fillStyle = color;
      const text = `${label} ${(confidence * 100).toFixed(1)}%`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(box.x1, box.y1 - 20, textWidth + 10, 20);

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(text, box.x1 + 5, box.y1 - 5);
    });
  };

  const drawRooms = (canvas: HTMLCanvasElement, image: HTMLImageElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    // Draw rooms
    data.rooms.forEach((room) => {
      const { box, id } = room;

      // Draw semi-transparent fill
      ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.fillRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);

      // Draw border
      ctx.strokeStyle = '#00aa00';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);

      // Draw room number
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Room ${id}`, box.x1 + 10, box.y1 + 20);
    });
  };

  const getColorForLabel = (label: string): string => {
    const colors: Record<string, string> = {
      'Wall': '#e74c3c',
      'Door': '#3498db',
      'Window': '#9b59b6',
      'Column': '#f1c40f',
      'Stair Case': '#1abc9c',
      'Curtain Wall': '#e67e22',
      'Dimension': '#95a5a6',
      'Railing': '#2ecc71',
      'Sliding Door': '#d35400'
    };
    return colors[label] || '#000000';
  };

  const handleCanvasRender = (tabName: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const image = new Image();
    image.onload = () => {
      if (tabName === 'detections') {
        drawDetections(canvas, image);
      } else if (tabName === 'rooms') {
        drawRooms(canvas, image);
      } else {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
        }
      }
    };
    image.src = imageUrl;
  };

  useEffect(() => {
    handleCanvasRender(activeTab);
  }, [activeTab, imageUrl, data]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const handleResetZoom = () => setScale(1);

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `floor-plan-${activeTab}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const totalObjects = Object.values(data.object_counts).reduce((sum, count) => sum + count, 0);
  const totalArea = data.rooms.reduce((sum, room) => sum + room.area, 0);

  return (
    <Card className="w-full max-w-6xl mx-auto p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Objects Detected</p>
              <p className="text-2xl font-bold">{totalObjects}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Rooms Found</p>
              <p className="text-2xl font-bold">{data.rooms.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Total Area</p>
              <p className="text-2xl font-bold">{Math.round(totalArea).toLocaleString()} px²</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Viewer */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Floor Plan Analysis</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCanvas}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="original">Original</TabsTrigger>
                <TabsTrigger value="detections">Detections</TabsTrigger>
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="cad">
                  <Ruler className="h-4 w-4 mr-2" />
                  CAD Generator
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-4">
                {activeTab === 'cad' ? (
                  <div className="p-4 bg-white rounded-lg border">
                    <CADGenerator 
                      detections={data.detections} 
                      imageUrl={imageUrl}
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-auto bg-muted/50 p-4">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto border bg-white"
                      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-4">
          {/* Object Counts */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Detected Objects</h3>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {Object.entries(data.object_counts).map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{label}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Rooms List */}
          {data.rooms.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Room Details</h3>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {data.rooms.map((room) => (
                    <div key={room.id} className="p-3 bg-muted rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Room {room.id}</span>
                        <Badge variant="outline">{Math.round(room.area).toLocaleString()} px²</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Position: ({Math.round(room.box.x1)}, {Math.round(room.box.y1)}) - 
                        ({Math.round(room.box.x2)}, {Math.round(room.box.y2)})
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </div>
    </Card>
  );
};