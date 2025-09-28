import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePatients } from '@/hooks/usePatients';

export const DataSourceConfig: React.FC = () => {
  const { setServerEndpoint, setLocalFile } = usePatients();
  const [serverUrl, setServerUrl] = useState('http://a0g88w80ssoos8gkgcs408gs.157.90.23.234.sslip.io/data');
  const [localFile, setLocalFileUrl] = useState('/patients.json');
  const [currentSource, setCurrentSource] = useState<'local' | 'server'>('local');

  const handleUseServer = () => {
    if (serverUrl.trim()) {
      setServerEndpoint(serverUrl.trim());
      setCurrentSource('server');
    }
  };

  const handleUseLocal = () => {
    if (localFile.trim()) {
      setLocalFile(localFile.trim());
      setCurrentSource('local');
    }
  };

  return (
    <Card className="bg-[rgba(26,27,32,1)] border-[rgba(64,66,73,1)] text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>Data Source Configuration</span>
          <Badge variant={currentSource === 'server' ? 'destructive' : 'secondary'}>
            {currentSource === 'server' ? 'External Server' : 'Local File'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Server Configuration */}
        <div className="space-y-3">
          <h4 className="text-lg font-medium text-white">External Server</h4>
          <p className="text-sm text-[rgba(217,217,217,1)]">
            Connect to an external server that provides patient data in PatientResponse format
          </p>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://your-server.com/api/patients"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="bg-[rgba(64,66,73,1)] border-[rgba(100,106,113,1)] text-white"
            />
            <Button 
              onClick={handleUseServer}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Connect
            </Button>
          </div>
        </div>

        {/* Local File Configuration */}
        <div className="space-y-3">
          <h4 className="text-lg font-medium text-white">Local JSON File</h4>
          <p className="text-sm text-[rgba(217,217,217,1)]">
            Load patient data from a local JSON file (supports both old and new formats)
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="/patients.json"
              value={localFile}
              onChange={(e) => setLocalFileUrl(e.target.value)}
              className="bg-[rgba(64,66,73,1)] border-[rgba(100,106,113,1)] text-white"
            />
            <Button 
              onClick={handleUseLocal}
              className="bg-green-600 hover:bg-green-700"
            >
              Load
            </Button>
          </div>
        </div>

        {/* Format Information */}
        <div className="mt-6 p-4 bg-[rgba(64,66,73,1)] rounded-lg">
          <h5 className="font-medium text-white mb-2">Expected Server Format:</h5>
          <pre className="text-xs text-[rgba(217,217,217,1)] overflow-auto">
{`[
  {
    "Identifier": 1,
    "Name": "Patient Name",
    "Bed": "Bed 01",
    "Gender": "Male",
    "Age": 45,
    "Vital": {
      "2024-01-20T08:00:00Z": {
        "hr": 72, "bps": 118, "bpd": 78,
        "rr": 16, "temp": 98.4, "spo2": 98
      }
    }
  }
]`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};