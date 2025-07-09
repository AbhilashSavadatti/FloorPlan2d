import { useState } from 'react';

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

export const useFloorPlanAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeFloorPlan = async (file: File): Promise<void> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:5000/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AnalysisData = await response.json();
      setAnalysisData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error analyzing floor plan:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisData(null);
    setError(null);
  };

  return {
    isAnalyzing,
    analysisData,
    error,
    analyzeFloorPlan,
    resetAnalysis
  };
};