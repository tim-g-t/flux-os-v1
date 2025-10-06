import React, { useState, useEffect } from 'react';
import { FileDown, Download } from 'lucide-react';
import { patientApiService } from '@/services/patientApiService';
import { TransformedPatient } from '@/types/patient';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generateCSVReport, generateExcelReport, PatientReportData } from '@/utils/reportExport';
import { toast } from '@/hooks/use-toast';
import {
  calculateNEWS2,
  calculateModifiedShockIndex,
  calculateRespiratoryIndex,
} from '@/utils/clinicalScores';
import { format } from 'date-fns';

type VitalMetric = 'heartRate' | 'bloodPressure' | 'respiratoryRate' | 'spo2' | 'temperature';
type RiskScore = 'news2' | 'msi' | 'respiratory' | 'shockIndex' | 'map' | 'pulsePressure' | 'qsofa' | 'apache2';
type TimeRange = '1h' | '4h' | '12h' | '24h' | '7d';
type ExportFormat = 'csv' | 'xlsx';

export const Reports: React.FC = () => {
  const [patients, setPatients] = useState<TransformedPatient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [selectedVitals, setSelectedVitals] = useState<VitalMetric[]>(['heartRate', 'bloodPressure', 'spo2']);
  const [selectedScores, setSelectedScores] = useState<RiskScore[]>(['news2', 'msi']);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadPatients = async () => {
      await patientApiService.fetchPatients();
      const apiPatients = patientApiService.getPatients();
      const transformedPatients: TransformedPatient[] = apiPatients.map(p => ({
        id: p.Bed,
        identifier: p.Identifier,
        name: p.Name,
        bed: p.Bed,
        age: p.Age,
        gender: p.Gender,
        vitals: p.Vitals,
      }));
      setPatients(transformedPatients);
      if (transformedPatients.length > 0) {
        setSelectedPatients([transformedPatients[0].bed]);
      }
    };
    loadPatients();
  }, []);

  const togglePatient = (bedId: string) => {
    setSelectedPatients(prev =>
      prev.includes(bedId) ? prev.filter(id => id !== bedId) : [...prev, bedId]
    );
  };

  const toggleAllPatients = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map(p => p.bed));
    }
  };

  const toggleVital = (vital: VitalMetric) => {
    setSelectedVitals(prev =>
      prev.includes(vital) ? prev.filter(v => v !== vital) : [...prev, vital]
    );
  };

  const toggleScore = (score: RiskScore) => {
    setSelectedScores(prev =>
      prev.includes(score) ? prev.filter(s => s !== score) : [...prev, score]
    );
  };

  const getTimeRangeHours = (range: TimeRange): number => {
    switch (range) {
      case '1h': return 1;
      case '4h': return 4;
      case '12h': return 12;
      case '24h': return 24;
      case '7d': return 168;
      default: return 24;
    }
  };

  const handleExport = async () => {
    if (selectedPatients.length === 0) {
      toast({
        title: 'No Patients Selected',
        description: 'Please select at least one patient to export.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedVitals.length === 0 && selectedScores.length === 0) {
      toast({
        title: 'No Metrics Selected',
        description: 'Please select at least one vital sign or risk score.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const reportData: PatientReportData[] = [];
      const hours = getTimeRangeHours(timeRange);

      for (let i = 0; i < selectedPatients.length; i++) {
        const bedId = selectedPatients[i];
        const patient = patients.find(p => p.bed === bedId);
        
        if (!patient) continue;

        setProgress(((i + 1) / selectedPatients.length) * 50);

        const filteredVitals = patientApiService.getFilteredVitals(bedId, hours);
        const latestVital = patient.vitals[patient.vitals.length - 1];

        const vitalsTrend = filteredVitals.map(v => ({
          timestamp: v.time,
          hr: v.Pulse,
          bps: v.BloodPressure.Systolic,
          bpd: v.BloodPressure.Diastolic,
          rr: v.RespirationRate,
          spo2: v.SpO2,
          temp: v.Temp,
        }));

        const riskScores = latestVital ? {
          news2: calculateNEWS2({
            hr: latestVital.Pulse,
            bps: latestVital.BloodPressure.Systolic,
            bpd: latestVital.BloodPressure.Diastolic,
            rr: latestVital.RespirationRate,
            temp: latestVital.Temp,
            spo2: latestVital.SpO2,
          }),
          msi: calculateModifiedShockIndex({
            hr: latestVital.Pulse,
            bps: latestVital.BloodPressure.Systolic,
            bpd: latestVital.BloodPressure.Diastolic,
            rr: latestVital.RespirationRate,
            temp: latestVital.Temp,
            spo2: latestVital.SpO2,
          }),
          respiratory: calculateRespiratoryIndex({
            hr: latestVital.Pulse,
            bps: latestVital.BloodPressure.Systolic,
            bpd: latestVital.BloodPressure.Diastolic,
            rr: latestVital.RespirationRate,
            temp: latestVital.Temp,
            spo2: latestVital.SpO2,
          }),
          map: (latestVital.BloodPressure.Systolic + 2 * latestVital.BloodPressure.Diastolic) / 3,
          pulsePressure: latestVital.BloodPressure.Systolic - latestVital.BloodPressure.Diastolic,
          shockIndex: latestVital.Pulse / latestVital.BloodPressure.Systolic,
        } : undefined;

        reportData.push({
          patient,
          currentVitals: latestVital,
          riskScores,
          vitalsTrend,
        });
      }

      setProgress(75);

      const options = {
        includeVitals: selectedVitals.length > 0,
        includeRiskScores: selectedScores.length > 0,
        includeCharts: false,
        includeTrends: true,
        format: exportFormat === 'xlsx' ? 'excel' as const : 'csv' as const,
      };

      if (exportFormat === 'csv') {
        generateCSVReport(reportData, options);
      } else {
        await generateExcelReport(reportData, options);
      }

      setProgress(100);

      toast({
        title: 'Report Generated',
        description: `Successfully exported ${selectedPatients.length} patient report(s) as ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while generating the report.',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 1000);
    }
  };

  const vitalOptions: { id: VitalMetric; label: string }[] = [
    { id: 'heartRate', label: 'Heart Rate (HR)' },
    { id: 'bloodPressure', label: 'Blood Pressure (BP)' },
    { id: 'respiratoryRate', label: 'Respiratory Rate (RR)' },
    { id: 'spo2', label: 'SpO2' },
    { id: 'temperature', label: 'Temperature' },
  ];

  const scoreOptions: { id: RiskScore; label: string }[] = [
    { id: 'news2', label: 'NEWS2' },
    { id: 'msi', label: 'Modified Shock Index' },
    { id: 'respiratory', label: 'Respiratory Index' },
    { id: 'shockIndex', label: 'Shock Index' },
    { id: 'map', label: 'Mean Arterial Pressure (MAP)' },
    { id: 'pulsePressure', label: 'Pulse Pressure' },
  ];

  const timeRangeOptions: { id: TimeRange; label: string }[] = [
    { id: '1h', label: 'Last 1 Hour' },
    { id: '4h', label: 'Last 4 Hours' },
    { id: '12h', label: 'Last 12 Hours' },
    { id: '24h', label: 'Last 24 Hours' },
    { id: '7d', label: 'Last 7 Days' },
  ];

  const getRiskLevel = (patient: TransformedPatient): string => {
    const latestVital = patient.vitals[patient.vitals.length - 1];
    if (!latestVital) return 'Unknown';

    const news2 = calculateNEWS2({
      hr: latestVital.Pulse,
      bps: latestVital.BloodPressure.Systolic,
      bpd: latestVital.BloodPressure.Diastolic,
      rr: latestVital.RespirationRate,
      temp: latestVital.Temp,
      spo2: latestVital.SpO2,
    });

    return news2.risk;
  };

  const getRiskColor = (risk: string): string => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Clinical Reports</h1>
        <p className="text-muted-foreground">Generate and export patient data reports</p>
      </div>

      <div className="space-y-6">
        {/* Patient Selection */}
        <Card className="bg-[rgba(26,27,32,1)] border-[rgba(64,66,73,1)] rounded-[32px] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Select Patients</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllPatients}
              className="rounded-full"
            >
              {selectedPatients.length === patients.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => {
              const isSelected = selectedPatients.includes(patient.bed);
              const risk = getRiskLevel(patient);
              return (
                <div
                  key={patient.bed}
                  onClick={() => togglePatient(patient.bed)}
                  className={`
                    p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-[hsl(224,76%,48%)] bg-[hsl(224,76%,48%)]/10' 
                      : 'border-border hover:border-muted-foreground/50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Checkbox checked={isSelected} className="mt-1" />
                    <span className={`text-xs font-medium ${getRiskColor(risk)}`}>
                      {risk.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{patient.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {patient.bed} • {patient.age}y • {patient.gender}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Metrics Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vital Signs */}
          <Card className="bg-[rgba(26,27,32,1)] border-[rgba(64,66,73,1)] rounded-[32px] p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Vital Signs</h2>
            <div className="space-y-3">
              {vitalOptions.map((vital) => (
                <div key={vital.id} className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedVitals.includes(vital.id)}
                    onCheckedChange={() => toggleVital(vital.id)}
                  />
                  <label className="text-sm text-foreground cursor-pointer" onClick={() => toggleVital(vital.id)}>
                    {vital.label}
                  </label>
                </div>
              ))}
            </div>
          </Card>

          {/* Risk Scores */}
          <Card className="bg-[rgba(26,27,32,1)] border-[rgba(64,66,73,1)] rounded-[32px] p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Risk Scores</h2>
            <div className="space-y-3">
              {scoreOptions.map((score) => (
                <div key={score.id} className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedScores.includes(score.id)}
                    onCheckedChange={() => toggleScore(score.id)}
                  />
                  <label className="text-sm text-foreground cursor-pointer" onClick={() => toggleScore(score.id)}>
                    {score.label}
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Time Range & Export Format */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Range */}
          <Card className="bg-[rgba(26,27,32,1)] border-[rgba(64,66,73,1)] rounded-[32px] p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Time Range</h2>
            <div className="grid grid-cols-2 gap-3">
              {timeRangeOptions.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`
                    p-3 rounded-xl border-2 text-sm font-medium transition-all
                    ${timeRange === range.id
                      ? 'border-[hsl(224,76%,48%)] bg-[hsl(224,76%,48%)]/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Export Format */}
          <Card className="bg-[rgba(26,27,32,1)] border-[rgba(64,66,73,1)] rounded-[32px] p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Export Format</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('csv')}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${exportFormat === 'csv'
                    ? 'border-[hsl(224,76%,48%)] bg-[hsl(224,76%,48%)]/10'
                    : 'border-border hover:border-muted-foreground/50'
                  }
                `}
              >
                <FileDown className="h-6 w-6 mx-auto mb-2 text-foreground" />
                <p className="text-sm font-medium text-foreground">CSV</p>
                <p className="text-xs text-muted-foreground">Spreadsheet</p>
              </button>
              <button
                onClick={() => setExportFormat('xlsx')}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${exportFormat === 'xlsx'
                    ? 'border-[hsl(224,76%,48%)] bg-[hsl(224,76%,48%)]/10'
                    : 'border-border hover:border-muted-foreground/50'
                  }
                `}
              >
                <FileDown className="h-6 w-6 mx-auto mb-2 text-foreground" />
                <p className="text-sm font-medium text-foreground">XLSX</p>
                <p className="text-xs text-muted-foreground">Excel</p>
              </button>
            </div>
          </Card>
        </div>

        {/* Summary & Export */}
        <Card className="bg-[rgba(26,27,32,1)] border-[rgba(64,66,73,1)] rounded-[32px] p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Export Summary</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• {selectedPatients.length} patient(s) selected</p>
                <p>• {selectedVitals.length} vital sign(s) • {selectedScores.length} risk score(s)</p>
                <p>• Time range: {timeRangeOptions.find(r => r.id === timeRange)?.label}</p>
                <p>• Format: {exportFormat.toUpperCase()}</p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              disabled={isGenerating || selectedPatients.length === 0}
              className="rounded-full px-8 py-6 text-base font-semibold bg-[hsl(224,76%,48%)] hover:bg-[hsl(224,76%,40%)]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Generating {progress}%
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
