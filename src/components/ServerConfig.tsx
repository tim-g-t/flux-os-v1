import React, { useState } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ServerConfig: React.FC = () => {
  const [serverUrl, setServerUrl] = useState('');
  const { setServerEndpoint, setLocalFile } = usePatients();

  const handleConnectToServer = () => {
    if (serverUrl.trim()) {
      console.log('🔗 Connecting to server:', serverUrl);
      setServerEndpoint(serverUrl);
    }
  };

  const handleUseLocalData = () => {
    console.log('📁 Using local data');
    setLocalFile('/patients.json');
  };

  const handleUseDemoServer = () => {
    // Example server URL for testing - replace with actual API
    const demoUrl = 'https://api.example.com/patients';
    console.log('🧪 Connecting to demo server:', demoUrl);
    setServerUrl(demoUrl);
    setServerEndpoint(demoUrl);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Data Source Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="url"
            placeholder="Enter server URL (e.g., https://api.example.com/patients)"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
          />
          <Button onClick={handleConnectToServer} className="w-full">
            Connect to Server
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUseDemoServer} className="flex-1">
            Use Demo Server
          </Button>
          <Button variant="outline" onClick={handleUseLocalData} className="flex-1">
            Use Local Data
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">Expected API Response Format:</p>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
{`[
  {
    "Identifier": 1,
    "Name": "Patient Name",
    "Bed": "Bed_1",
    "Gender": "Male",
    "Age": 68,
    "Vitals": [
      {
        "time": "2025-09-24T17:19:22.866716",
        "Pulse": 71,
        "BloodPressure": {
          "Systolic": 110,
          "Diastolic": 77,
          "Mean": 88
        },
        "RespirationRate": 15,
        "SpO2": 98,
        "Temp": 97.9
      }
    ]
  }
]`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};