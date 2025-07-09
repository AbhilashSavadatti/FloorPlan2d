import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Ruler, DoorOpen, BedDouble, Square } from 'lucide-react';

interface CADGeneratorProps {
  detections: Array<{
    label: string;
    confidence: number;
    box: { x1: number; y1: number; x2: number; y2: number };
  }>;
  imageUrl: string;
}

interface CADDrawing {
  type: 'ceiling_plan' | 'wall_elevation' | 'door_elevation' | 'window_elevation' | 'bed_head_elevation' | 'furniture_elevation' | string;
  prompt: string;
  imageUrl: string;
  loading: boolean;
  error?: string;
}

export const CADGenerator: React.FC<CADGeneratorProps> = ({ detections, imageUrl }) => {
  const [drawings, setDrawings] = useState<CADDrawing[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elevationHeight, setElevationHeight] = useState<number>(2700); // Default 2.7m in mm
  const [includeDoors, setIncludeDoors] = useState<boolean>(true);
  const [includeWindows, setIncludeWindows] = useState<boolean>(true);
  const [includeBedHeads, setIncludeBedHeads] = useState<boolean>(true);

  // Track detected elements and their counts
  const [elementCounts, setElementCounts] = useState<{[key: string]: number}>({});
  const [hasBed, setHasBed] = useState(false);
  const [hasWindow, setHasWindow] = useState(false);
  const [hasDoor, setHasDoor] = useState(false);
  const [hasWall, setHasWall] = useState(false);
  const [hasFurniture, setHasFurniture] = useState(false);

  // Update detected elements when detections change
  useEffect(() => {
    const counts: {[key: string]: number} = {};
    let bed = false;
    let window = false;
    let door = false;
    let wall = false;
    let furniture = false;

    detections.forEach(detection => {
      counts[detection.label] = (counts[detection.label] || 0) + 1;
      if (detection.label === 'bed') bed = true;
      if (detection.label === 'window') window = true;
      if (detection.label === 'door') door = true;
      if (detection.label === 'wall') wall = true;
      if (['bed', 'sofa', 'table', 'chair', 'toilet', 'sink'].includes(detection.label)) {
        furniture = true;
      }
    });

    setElementCounts(counts);
    setHasBed(bed);
    setHasWindow(window);
    setHasDoor(door);
    setHasWall(wall);
    setHasFurniture(furniture);
  }, [detections]);

  const generatePrompts = (): CADDrawing[] => {
    // Convert elevation height to meters for the prompt
    const heightInMeters = (elevationHeight / 1000).toFixed(2);
    const drawings: CADDrawing[] = [];

    // 1. Ceiling Plan (Always included)
    drawings.push({
      type: 'ceiling_plan',
      prompt: `2D Reflected Ceiling Plan (RCP) in CAD technical drawing style, black and white line art, no colors, no shading, no textures, only black lines on white background, vector-based, showing:
      - Ceiling grid with exact dimensions
      - Lighting fixtures as simple symbols
      - HVAC diffusers and vents as simple shapes
      - Smoke detectors and emergency lighting symbols
      - Scale 1:50 with dimension lines and annotations
      - Simple line weights (thick for walls, thin for details)
      - No perspective, no shadows, no colors, no gradients`,
      imageUrl: '',
      loading: false,
    });

    // 2. Wall Elevations (Always included)
    drawings.push({
      type: 'wall_elevation',
      prompt: `2D Wall Elevation, ${heightInMeters}m height, CAD technical drawing, black lines on white background, no colors, no shading, line art only, showing:
      - Simple line drawing of wall elevation
      - Floor and ceiling lines with exact dimensions
      - Basic wall outline with thickness
      - Electrical outlets as simple symbols
      - Light switches and controls
      - Scale 1:50 with dimension lines
      - No perspective, no shadows, no colors, no textures`,
      imageUrl: '',
      loading: false,
    });

    // 3. Door Elevations (Always included, at least one)
    const doorCount = hasDoor ? Math.min(elementCounts['door'] || 1, 3) : 1;
    for (let i = 0; i < doorCount; i++) {
      drawings.push({
        type: 'door_elevation',
        prompt: `2D Door Elevation, CAD technical drawing, black lines on white background, no colors, no shading, line art only, showing:
        - Simple rectangular door shape
        - Swing direction with arc
        - Door handle and lock details as simple symbols
        - Frame and architrave in thin lines
        - Clearance zones with dotted lines
        - Scale 1:20 with exact dimensions
        - No perspective, no shadows, no colors, no textures`,
        imageUrl: '',
        loading: false,
      });
    }

    // 4. Window Elevations (Always included, at least one)
    const windowCount = hasWindow ? Math.min(elementCounts['window'] || 1, 3) : 1;
    for (let i = 0; i < windowCount; i++) {
      drawings.push({
        type: 'window_elevation',
        prompt: `2D Window Elevation, CAD technical drawing, black lines on white background, no colors, no shading, line art only, showing:
        - Simple rectangular window frame
        - Glass panes as thin lines
        - Window opening mechanism (if applicable)
        - Sill and frame details
        - Wall thickness shown in section
        - Scale 1:20 with exact dimensions
        - No perspective, no shadows, no colors, no textures`,
        imageUrl: '',
        loading: false,
      });
    }

    // 5. Bed Head Detail (Always included)
    drawings.push({
      type: 'bed_head_elevation',
      prompt: `2D Bed Head Elevation, CAD technical drawing, black lines on white background, no colors, no shading, line art only, showing:
      - Simple headboard outline
      - Wall surface with exact dimensions
      - Electrical outlets as simple symbols
      - Light switches and controls
      - Nightstand with basic dimensions
      - Scale 1:20 with dimension lines
      - No perspective, no shadows, no colors, no textures`,
      imageUrl: '',
      loading: false,
    });

    return drawings;
  };

  const generateCADImages = async () => {
    try {
      setIsGenerating(true);
      const newDrawings = generatePrompts();
      setDrawings(newDrawings);

      // Generate images for each drawing type with rate limiting
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Process drawings in sequence to avoid rate limiting
      for (let i = 0; i < newDrawings.length; i++) {
        const drawing = newDrawings[i];
        
        // Update loading state for this drawing
        setDrawings(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], loading: true };
          return updated;
        });

        // Add a delay between requests (2 seconds between each)
        if (i > 0) {
          await delay(2000);
        }

        try {
          // Create a more reliable prompt URL
          let promptText = drawing.prompt;
          
          // Add style modifiers to ensure clean CAD output
          promptText += ' technical drawing, CAD style, blueprint, vector art, ';
          promptText += 'black and white, line art, no colors, no shading, no textures, ';
          promptText += 'engineering drawing, architectural drawing, ';
          promptText += 'clean lines, precise measurements, no shadows, no perspective';
          
          promptText = promptText
            .replace(/\n/g, ' ')  // Remove newlines
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .trim();
          
          const encodedPrompt = encodeURIComponent(promptText);
          
          // Use pollinations.ai with a simple GET request and cache buster
          // Add timestamp to prevent caching
          const timestamp = new Date().getTime();
          const response = await fetch(`https://image.pollinations.ai/prompt/${encodedPrompt}?t=${timestamp}`, {
            method: 'GET',
            headers: {
              'Accept': 'image/*'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Convert the response to a blob URL
          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('Received empty image response');
          }
          
          const imageUrl = URL.createObjectURL(blob);

          // Update the drawing with the new image URL
          setDrawings(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], imageUrl, loading: false };
            return updated;
          });
        } catch (error) {
          console.error(`Error generating ${drawing.type} image:`, error);
          setDrawings(prev => {
            const updated = [...prev];
            updated[i] = { 
              ...updated[i], 
              loading: false,
              error: `Failed to generate: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Error in generateCADImages:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Get display name for drawing type
  const getDisplayName = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">CAD Drawing Generator</h3>
        
        <div className="space-y-4">
          {/* Elevation Height Input */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Drawing Settings
            </h4>
            <div className="space-y-2">
              <Label htmlFor="elevationHeight">Wall Height (mm)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="elevationHeight"
                  type="number"
                  value={elevationHeight}
                  onChange={(e) => setElevationHeight(Number(e.target.value))}
                  min="2000"
                  max="4000"
                  step="50"
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  ({(elevationHeight / 1000).toFixed(2)}m)
                </span>
              </div>
            </div>
          </div>

          {/* Detail Options */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-3">Element Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="includeDoors"
                  checked={includeDoors}
                  onChange={(e) => setIncludeDoors(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={!hasDoor}
                />
                <Label htmlFor="includeDoors" className="flex items-center gap-2 cursor-pointer">
                  <DoorOpen className="h-4 w-4" />
                  <span>Door Details {hasDoor && `(${elementCounts['door'] || 0})`}</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="includeWindows"
                  checked={includeWindows}
                  onChange={(e) => setIncludeWindows(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={!hasWindow}
                />
                <Label htmlFor="includeWindows" className="flex items-center gap-2 cursor-pointer">
                  <Square className="h-4 w-4" />
                  <span>Window Details {hasWindow && `(${elementCounts['window'] || 0})`}</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="includeBedHeads"
                  checked={includeBedHeads}
                  onChange={(e) => setIncludeBedHeads(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={!hasBed}
                />
                <Label htmlFor="includeBedHeads" className="flex items-center gap-2 cursor-pointer">
                  <BedDouble className="h-4 w-4" />
                  <span>Bed Details {hasBed && `(${elementCounts['bed'] || 0})`}</span>
                </Label>
              </div>
            </div>
          </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button 
            onClick={generateCADImages} 
            disabled={isGenerating}
            className="flex-1 sm:flex-none sm:px-8"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Ruler className="h-4 w-4 mr-2" />
                Generate All CAD Drawings
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="flex-1 sm:flex-none"
          >
            View Drawings Below
          </Button>
        </div>
      </div>
      </div>

      {drawings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drawings.map((drawing, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{getDisplayName(drawing.type)}</h4>
                {drawing.imageUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => downloadImage(drawing.imageUrl, drawing.type)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                {drawing.loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : drawing.imageUrl ? (
                  <img 
                    src={drawing.imageUrl} 
                    alt={drawing.type} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">
                    {isGenerating ? 'Generating...' : 'Not generated yet'}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
