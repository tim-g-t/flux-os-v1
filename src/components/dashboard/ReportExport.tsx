import React, { useState, useEffect } from 'react';
import {
  FileDown,
  FileText,
  Table,
  FileJson,
  Download,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  generatePDFReport,
  generateCSVReport,
  generateJSONReport,
  generateExcelReport,
  ReportOptions,
  PatientReportData
} from '@/utils/reportExport';
import { TransformedPatient, APIVitalReading } from '@/types/patient';
import {
  calculateNEWS2,
  calculateModifiedShockIndex,
  calculateRespiratoryIndex
} from '@/utils/clinicalScores';
import { VitalReading } from '@/types/vitals';

interface ReportExportProps {
  patients: TransformedPatient[];
  onClose?: () => void;
}

export const ReportExport: React.FC<ReportExportProps> = ({ patients, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'json' | 'excel'>('pdf');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [options, setOptions] = useState<Omit<ReportOptions, 'format'>>({
    includeVitals: true,
    includeRiskScores: true,
    includeCharts: false,
    includeTrends: true,
    selectedPatients: []
  });

  useEffect(() => {
    if (patients.length > 0) {
      setSelectedPatients(patients.slice(0, 5).map(p => p.id));
    }
  }, [patients]);

  const formatIcons = {
    pdf: <FileText className="h-4 w-4" />,
    csv: <Table className="h-4 w-4" />,
    json: <FileJson className="h-4 w-4" />,
    excel: <FileDown className="h-4 w-4" />
  };

  const formatDescriptions = {
    pdf: 'Professional PDF with charts and formatting',
    csv: 'Spreadsheet-compatible data export',
    json: 'Structured data for integration',
    excel: 'Enhanced spreadsheet with multiple sheets'
  };

  const handlePatientToggle = (patientId: string) => {
    setSelectedPatients(prev =>
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map(p => p.id));
    }
  };

  const prepareReportData = (): PatientReportData[] => {
    return selectedPatients.map(patientId => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return null;

      const currentVitals = patient.vitals?.[patient.vitals.length - 1];
      let riskScores;

      if (currentVitals) {
        const vitalReading: VitalReading = {
          hr: currentVitals.Pulse,
          bps: currentVitals.BloodPressure.Systolic,
          bpd: currentVitals.BloodPressure.Diastolic,
          rr: currentVitals.RespirationRate,
          temp: currentVitals.Temp,
          spo2: currentVitals.SpO2
        };

        const map = Math.round((currentVitals.BloodPressure.Systolic + 2 * currentVitals.BloodPressure.Diastolic) / 3);
        const pulsePressure = currentVitals.BloodPressure.Systolic - currentVitals.BloodPressure.Diastolic;
        const shockIndex = currentVitals.Pulse / currentVitals.BloodPressure.Systolic;

        riskScores = {
          news2: calculateNEWS2(vitalReading),
          msi: calculateModifiedShockIndex(vitalReading),
          respiratory: calculateRespiratoryIndex(vitalReading),
          map,
          pulsePressure,
          shockIndex
        };
      }

      const vitalsTrend = patient.vitals?.slice(-24).map(v => ({
        timestamp: v.time,
        hr: v.Pulse,
        bps: v.BloodPressure.Systolic,
        bpd: v.BloodPressure.Diastolic,
        rr: v.RespirationRate,
        spo2: v.SpO2,
        temp: v.Temp
      }));

      return {
        patient,
        currentVitals,
        riskScores,
        vitalsTrend
      };
    }).filter(Boolean) as PatientReportData[];
  };

  const handleGenerateReport = async () => {
    if (selectedPatients.length === 0) {
      toast({
        title: "No patients selected",
        description: "Please select at least one patient for the report",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const reportData = prepareReportData();
      const reportOptions: ReportOptions = {
        ...options,
        format: selectedFormat,
        selectedPatients
      };

      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      switch (selectedFormat) {
        case 'pdf':
          await generatePDFReport(reportData, reportOptions);
          break;
        case 'csv':
          generateCSVReport(reportData, reportOptions);
          break;
        case 'json':
          generateJSONReport(reportData, reportOptions);
          break;
        case 'excel':
          await generateExcelReport(reportData, reportOptions);
          break;
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      toast({
        title: "Report generated successfully",
        description: `Your ${selectedFormat.toUpperCase()} report has been downloaded`,
      });

      setTimeout(() => {
        setIsOpen(false);
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Report generation failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive"
      });
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const getPatientRiskLevel = (patient: TransformedPatient): 'low' | 'medium' | 'high' => {
    if (!patient.vitals || patient.vitals.length === 0) return 'low';

    const latestVital = patient.vitals[patient.vitals.length - 1];
    const vitalReading: VitalReading = {
      hr: latestVital.Pulse,
      bps: latestVital.BloodPressure.Systolic,
      bpd: latestVital.BloodPressure.Diastolic,
      rr: latestVital.RespirationRate,
      temp: latestVital.Temp,
      spo2: latestVital.SpO2
    };

    const news2 = calculateNEWS2(vitalReading);
    if (news2.risk === 'critical' || news2.risk === 'high') return 'high';
    if (news2.risk === 'medium') return 'medium';
    return 'low';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
          <Download className="mr-2 h-5 w-5" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[rgba(26,27,32,0.98)]">
        {!isGenerating ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="h-6 w-6 text-blue-500" />
                Generate Medical Report
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Customize and export patient data in your preferred format
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="format" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-3 bg-[rgba(64,66,73,0.5)]">
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
              </TabsList>

              <TabsContent value="format" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {(['pdf', 'csv', 'json', 'excel'] as const).map(format => (
                    <Card
                      key={format}
                      className={`cursor-pointer transition-all ${
                        selectedFormat === format
                          ? 'border-blue-500 bg-[rgba(59,130,246,0.1)]'
                          : 'border-[rgba(64,66,73,1)] hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedFormat(format)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {formatIcons[format]}
                            {format.toUpperCase()}
                          </span>
                          {selectedFormat === format && (
                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {formatDescriptions[format]}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="patients" className="space-y-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {selectedPatients.length} of {patients.length} patients selected
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="border-gray-600"
                  >
                    {selectedPatients.length === patients.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {patients.map(patient => {
                    const riskLevel = getPatientRiskLevel(patient);
                    return (
                      <div
                        key={patient.id}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-[rgba(64,66,73,0.3)] hover:bg-[rgba(64,66,73,0.5)] transition-colors"
                      >
                        <Checkbox
                          id={patient.id}
                          checked={selectedPatients.includes(patient.id)}
                          onCheckedChange={() => handlePatientToggle(patient.id)}
                        />
                        <Label
                          htmlFor={patient.id}
                          className="flex-1 cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-white">{patient.name}</div>
                              <div className="text-sm text-gray-400">
                                {patient.bed} • {patient.age}y {patient.gender}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'secondary' : 'outline'}
                            className="ml-2"
                          >
                            {riskLevel === 'high' ? (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            ) : riskLevel === 'medium' ? (
                              <Clock className="h-3 w-3 mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            )}
                            {riskLevel} risk
                          </Badge>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="options" className="space-y-4 mt-4">
                <Card className="border-[rgba(64,66,73,1)]">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Report Contents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="includeVitals"
                        checked={options.includeVitals}
                        onCheckedChange={(checked) =>
                          setOptions({ ...options, includeVitals: !!checked })
                        }
                      />
                      <Label htmlFor="includeVitals" className="cursor-pointer">
                        <div className="font-medium">Current Vital Signs</div>
                        <div className="text-sm text-gray-400">Include latest vital measurements</div>
                      </Label>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="includeRiskScores"
                        checked={options.includeRiskScores}
                        onCheckedChange={(checked) =>
                          setOptions({ ...options, includeRiskScores: !!checked })
                        }
                      />
                      <Label htmlFor="includeRiskScores" className="cursor-pointer">
                        <div className="font-medium">Clinical Risk Scores</div>
                        <div className="text-sm text-gray-400">NEWS2, MSI, Respiratory indices</div>
                      </Label>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="includeTrends"
                        checked={options.includeTrends}
                        onCheckedChange={(checked) =>
                          setOptions({ ...options, includeTrends: !!checked })
                        }
                      />
                      <Label htmlFor="includeTrends" className="cursor-pointer">
                        <div className="font-medium">24-Hour Trends</div>
                        <div className="text-sm text-gray-400">Historical vital sign analysis</div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[rgba(64,66,73,1)] bg-[rgba(59,130,246,0.05)]">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="text-sm text-gray-300">
                        <p className="font-medium mb-1">Report Generation Info</p>
                        <p className="text-gray-400">
                          Reports include anonymized data suitable for medical records.
                          All timestamps are in local timezone.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={selectedPatients.length === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Generate {selectedFormat.toUpperCase()}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                <FileDown className="h-8 w-8 text-blue-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-white">Generating Report</h3>
              <p className="text-gray-400">
                Creating your {selectedFormat.toUpperCase()} report with {selectedPatients.length} patients...
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={generationProgress} className="h-2" />
              <p className="text-center text-sm text-gray-400">
                {generationProgress}% complete
              </p>
            </div>

            {generationProgress > 30 && (
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  {generationProgress > 30 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  <span className={generationProgress > 30 ? 'text-green-400' : ''}>
                    Collecting patient data
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {generationProgress > 60 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  <span className={generationProgress > 60 ? 'text-green-400' : ''}>
                    Calculating risk scores
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {generationProgress > 80 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  <span className={generationProgress > 80 ? 'text-green-400' : ''}>
                    Formatting report
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};