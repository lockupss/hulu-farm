'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function DiseaseDetection() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const diseases = [
    {
      name: 'Maize Leaf Blight',
      symptoms: 'Brown lesions on leaves with yellow halos',
      treatment: 'Use resistant varieties, fungicide spray at early stages',
      severity: 'High',
    },
    {
      name: 'Wheat Powdery Mildew',
      symptoms: 'White powdery coating on leaves',
      treatment: 'Sulfur-based fungicides, improve air circulation',
      severity: 'Medium',
    },
    {
      name: 'Bean Anthracnose',
      symptoms: 'Dark sunken spots on leaves and pods',
      treatment: 'Fungicides, crop rotation, seed treatment',
      severity: 'High',
    },
    {
      name: 'Teff Rust',
      symptoms: 'Orange/brown pustules on leaf surface',
      treatment: 'Resistant varieties, fungicide application',
      severity: 'Medium',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Disease Detection & Management</h1>
        <p className="text-muted-foreground mt-2">Identify and manage crop diseases with AI-powered image analysis</p>
      </div>

      {/* Image Upload */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Plant Image for Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer transition">
            <div className="text-5xl mb-4">🍃</div>
            <p className="font-medium mb-2">Drag and drop your image here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <Button variant="outline">Select Image</Button>
          </div>
          {uploadedImage && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-primary font-medium text-sm">✓ Image uploaded successfully. AI analysis in progress...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection Results */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Detection Results</CardTitle>
          <CardDescription>Analysis results from uploaded plant images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <p className="font-medium">Maize Leaf Blight Detected</p>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">Confidence: 94%</span>
            </div>
            <p className="text-sm text-muted-foreground">Uploaded 2 hours ago</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <p className="font-medium">Plant Health: Excellent</p>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Confidence: 98%</span>
            </div>
            <p className="text-sm text-muted-foreground">Uploaded yesterday</p>
          </div>
        </CardContent>
      </Card>

      {/* Disease Database */}
      <Card>
        <CardHeader>
          <CardTitle>Common Crop Diseases</CardTitle>
          <CardDescription>Information and treatment recommendations for major diseases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {diseases.map((disease, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{disease.name}</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${disease.severity === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                    {disease.severity} Severity
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Symptoms</p>
                    <p className="text-sm">{disease.symptoms}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Treatment</p>
                    <p className="text-sm">{disease.treatment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
