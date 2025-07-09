import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Brain } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Analyzing your floor plan with AI..." 
}) => {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary/60" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Processing Floor Plan</h3>
          <p className="text-muted-foreground">{message}</p>
        </div>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </Card>
  );
};