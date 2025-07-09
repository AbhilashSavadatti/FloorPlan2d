import React, { useState } from 'react';
import { FloorPlanUploader } from '@/components/FloorPlanUploader';
import { AnalysisResults } from '@/components/AnalysisResults';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useFloorPlanAnalysis } from '@/hooks/useFloorPlanAnalysis';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Zap, 
  Eye, 
  Download, 
  ArrowRight,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export default function Index() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isAnalyzing, analysisData, error, analyzeFloorPlan, resetAnalysis } = useFloorPlanAnalysis();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    resetAnalysis();
  };

  const handleAnalyze = async () => {
    if (selectedFile) {
      await analyzeFloorPlan(selectedFile);
    }
  };

  const handleStartOver = () => {
    setSelectedFile(null);
    resetAnalysis();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FloorPlan AI
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Professional AI Analysis</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        {!selectedFile && !analysisData && (
          <div className="text-center space-y-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Turn your Floor plan into a digital plan
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your floor plan image and get instant AI-powered analysis with object detection, 
                room mapping, and professional digital conversion.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold">AI Object Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically detect walls, doors, windows, and other architectural elements
                </p>
              </Card>

              <Card className="p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Room Mapping</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligent room detection and area calculation for space planning
                </p>
              </Card>

              <Card className="p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold">Instant Results</h3>
                <p className="text-sm text-muted-foreground">
                  Get professional analysis results in seconds with interactive visualization
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {!analysisData && !isAnalyzing && (
            <div className="max-w-2xl mx-auto space-y-6">
              <FloorPlanUploader 
                onFileSelect={handleFileSelect} 
                isAnalyzing={isAnalyzing}
              />
              
              {selectedFile && (
                <div className="text-center">
                  <Button 
                    onClick={handleAnalyze} 
                    size="lg" 
                    className="px-8"
                    disabled={isAnalyzing}
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Analyze Floor Plan
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertDescription>
                {error}. Please try uploading your image again or check your connection.
              </AlertDescription>
            </Alert>
          )}

          {isAnalyzing && (
            <div className="max-w-2xl mx-auto">
              <LoadingSpinner message="Analyzing your floor plan with advanced AI algorithms..." />
            </div>
          )}

          {analysisData && selectedFile && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Analysis Complete</h2>
                  <p className="text-muted-foreground">
                    Your floor plan has been successfully analyzed
                  </p>
                </div>
                <Button variant="outline" onClick={handleStartOver}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
              </div>
              
              <AnalysisResults data={analysisData} originalImage={selectedFile} />
            </div>
          )}
        </div>

        {/* Footer */}
        {!analysisData && !isAnalyzing && (
          <footer className="mt-16 pt-8 border-t">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Powered by advanced AI and computer vision technology
              </p>
              <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
                <span>✓ Secure Processing</span>
                <span>✓ No Data Stored</span>
                <span>✓ Professional Results</span>
              </div>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}