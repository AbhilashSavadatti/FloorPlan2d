import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FloorPlanUploaderProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export const FloorPlanUploader: React.FC<FloorPlanUploaderProps> = ({
  onFileSelect,
  isAnalyzing
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false,
    disabled: isAnalyzing
  });

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Upload Floor Plan</h3>
          <p className="text-muted-foreground text-sm">
            Upload your floor plan image to get started with AI analysis
          </p>
        </div>

        {!preview ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/25 hover:border-primary/50'
            } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop your floor plan here' : 'Drag & drop your floor plan'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse files
            </p>
            <Button variant="outline" disabled={isAnalyzing}>
              <FileImage className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supports PNG, JPG, JPEG (Max 16MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Floor plan preview"
                className="w-full h-64 object-contain border rounded-lg bg-muted"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearFile}
                disabled={isAnalyzing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedFile?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};