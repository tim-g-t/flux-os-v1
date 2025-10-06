import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { TransformedPatient, APIVitalReading } from '@/types/patient';
import {
  calculateNEWS2,
  calculateModifiedShockIndex,
  calculateRespiratoryIndex,
  calculateRiskTrajectory,
  ClinicalScore
} from '@/utils/clinicalScores';
import { VitalReading } from '@/types/vitals';

export interface ReportOptions {
  includeVitals: boolean;
  includeRiskScores: boolean;
  includeCharts: boolean;
  includeTrends: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  selectedPatients?: string[];
  format: 'pdf' | 'csv' | 'json' | 'excel';
}

export interface PatientReportData {
  patient: TransformedPatient;
  currentVitals?: APIVitalReading;
  riskScores?: {
    news2: ClinicalScore;
    msi: ClinicalScore;
    respiratory: ClinicalScore;
    shockIndex?: number;
    qSOFA?: number;
    map?: number;
    pulsePressure?: number;
  };
  vitalsTrend?: {
    timestamp: string;
    hr: number;
    bps: number;
    bpd: number;
    rr: number;
    spo2: number;
    temp: number;
  }[];
}

const getRiskColor = (risk: 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (risk) {
    case 'low': return '#10B981';
    case 'medium': return '#F59E0B';
    case 'high': return '#EF4444';
    case 'critical': return '#DC2626';
    default: return '#6B7280';
  }
};

const getRiskEmoji = (risk: 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (risk) {
    case 'low': return '✓';
    case 'medium': return '⚠';
    case 'high': return '⚠';
    case 'critical': return '⚡';
    default: return '';
  }
};

export const generatePDFReport = async (
  data: PatientReportData[],
  options: ReportOptions
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  pdf.setFillColor(26, 27, 32);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FLUX-OS Medical Report', margin, 25);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated: ${format(new Date(), 'PPpp')}`, margin, 35);

  let yPosition = 50;

  data.forEach((patientData, index) => {
    if (index > 0) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Patient: ${patientData.patient.name}`, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Bed: ${patientData.patient.bed} | Age: ${patientData.patient.age} | Gender: ${patientData.patient.gender}`, margin, yPosition);
    yPosition += 15;

    if (options.includeVitals && patientData.currentVitals) {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Current Vitals', margin, yPosition);
      yPosition += 8;

      const vitalsData = [
        ['Vital Sign', 'Value', 'Unit'],
        ['Heart Rate', patientData.currentVitals.Pulse.toString(), 'bpm'],
        ['Blood Pressure', `${patientData.currentVitals.BloodPressure.Systolic}/${patientData.currentVitals.BloodPressure.Diastolic}`, 'mmHg'],
        ['Respiratory Rate', patientData.currentVitals.RespirationRate.toString(), 'breaths/min'],
        ['SpO2', patientData.currentVitals.SpO2.toString(), '%'],
        ['Temperature', patientData.currentVitals.Temp.toFixed(1), '°F'],
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [vitalsData[0]],
        body: vitalsData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [64, 66, 73],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 40 }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    if (options.includeRiskScores && patientData.riskScores) {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clinical Risk Scores', margin, yPosition);
      yPosition += 8;

      const riskData = [
        ['Score', 'Value', 'Risk Level', 'Status'],
        [
          'NEWS2',
          patientData.riskScores.news2.value.toString(),
          patientData.riskScores.news2.risk.toUpperCase(),
          getRiskEmoji(patientData.riskScores.news2.risk)
        ],
        [
          'Modified Shock Index',
          patientData.riskScores.msi.value.toFixed(2),
          patientData.riskScores.msi.risk.toUpperCase(),
          getRiskEmoji(patientData.riskScores.msi.risk)
        ],
        [
          'Respiratory Index',
          patientData.riskScores.respiratory.value.toString(),
          patientData.riskScores.respiratory.risk.toUpperCase(),
          getRiskEmoji(patientData.riskScores.respiratory.risk)
        ]
      ];

      if (patientData.riskScores.map) {
        riskData.push([
          'MAP',
          patientData.riskScores.map.toFixed(0),
          patientData.riskScores.map < 65 ? 'HIGH' : patientData.riskScores.map < 70 ? 'MEDIUM' : 'LOW',
          patientData.riskScores.map < 65 ? '⚡' : patientData.riskScores.map < 70 ? '⚠' : '✓'
        ]);
      }

      autoTable(pdf, {
        startY: yPosition,
        head: [riskData[0]],
        body: riskData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [64, 66, 73],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: margin, right: margin },
        didDrawCell: (data) => {
          if (data.column.index === 2 && data.row.section === 'body') {
            const risk = data.cell.text[0].toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
            const color = getRiskColor(risk);
            const rgb = color.match(/\d+/g);
            if (rgb) {
              pdf.setTextColor(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
            }
          }
        }
      });

      yPosition = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    if (options.includeTrends && patientData.vitalsTrend && patientData.vitalsTrend.length > 0) {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('24-Hour Vital Trends Summary', margin, yPosition);
      yPosition += 8;

      const last24Hours = patientData.vitalsTrend.slice(-24);
      const avgHr = last24Hours.reduce((sum, v) => sum + v.hr, 0) / last24Hours.length;
      const avgBps = last24Hours.reduce((sum, v) => sum + v.bps, 0) / last24Hours.length;
      const avgRr = last24Hours.reduce((sum, v) => sum + v.rr, 0) / last24Hours.length;
      const avgSpo2 = last24Hours.reduce((sum, v) => sum + v.spo2, 0) / last24Hours.length;

      const maxHr = Math.max(...last24Hours.map(v => v.hr));
      const minHr = Math.min(...last24Hours.map(v => v.hr));
      const maxBps = Math.max(...last24Hours.map(v => v.bps));
      const minBps = Math.min(...last24Hours.map(v => v.bps));

      const trendsData = [
        ['Vital', 'Average', 'Min', 'Max', 'Trend'],
        ['Heart Rate', `${avgHr.toFixed(0)} bpm`, `${minHr}`, `${maxHr}`, '→'],
        ['Systolic BP', `${avgBps.toFixed(0)} mmHg`, `${minBps}`, `${maxBps}`, '→'],
        ['Respiratory', `${avgRr.toFixed(0)} /min`, '-', '-', '→'],
        ['SpO2', `${avgSpo2.toFixed(0)} %`, '-', '-', '→']
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [trendsData[0]],
        body: trendsData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [64, 66, 73],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10
        },
        margin: { left: margin, right: margin }
      });

      yPosition = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text(`Patient ID: ${patientData.patient.identifier}`, margin, pageHeight - 10);
    pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 20, pageHeight - 10);
  });

  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  pdf.save(`FLUX-OS_Report_${timestamp}.pdf`);
};

export const generateCSVReport = (
  data: PatientReportData[],
  options: ReportOptions
): void => {
  const headers = [
    'Patient Name',
    'Bed',
    'Age',
    'Gender',
    'Timestamp',
    'Heart Rate',
    'Systolic BP',
    'Diastolic BP',
    'Respiratory Rate',
    'SpO2',
    'Temperature'
  ];

  if (options.includeRiskScores) {
    headers.push('NEWS2', 'NEWS2 Risk', 'MSI', 'MSI Risk', 'Respiratory Index', 'Resp Risk');
  }

  const rows: string[][] = [];

  data.forEach(patientData => {
    if (patientData.vitalsTrend) {
      patientData.vitalsTrend.forEach(vital => {
        const row = [
          patientData.patient.name,
          patientData.patient.bed,
          patientData.patient.age.toString(),
          patientData.patient.gender,
          vital.timestamp,
          vital.hr.toString(),
          vital.bps.toString(),
          vital.bpd.toString(),
          vital.rr.toString(),
          vital.spo2.toString(),
          vital.temp.toFixed(1)
        ];

        if (options.includeRiskScores && patientData.riskScores) {
          row.push(
            patientData.riskScores.news2.value.toString(),
            patientData.riskScores.news2.risk,
            patientData.riskScores.msi.value.toFixed(2),
            patientData.riskScores.msi.risk,
            patientData.riskScores.respiratory.value.toString(),
            patientData.riskScores.respiratory.risk
          );
        }

        rows.push(row);
      });
    }
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  saveAs(blob, `FLUX-OS_Report_${timestamp}.csv`);
};

export const generateJSONReport = (
  data: PatientReportData[],
  options: ReportOptions
): void => {
  const reportData = {
    generatedAt: new Date().toISOString(),
    reportType: 'FLUX-OS Medical Report',
    options: options,
    patients: data.map(patientData => ({
      patient: {
        id: patientData.patient.identifier,
        name: patientData.patient.name,
        bed: patientData.patient.bed,
        age: patientData.patient.age,
        gender: patientData.patient.gender
      },
      currentVitals: options.includeVitals ? patientData.currentVitals : undefined,
      riskScores: options.includeRiskScores ? patientData.riskScores : undefined,
      vitalsTrend: options.includeTrends ? patientData.vitalsTrend : undefined,
      analysis: options.includeRiskScores && patientData.riskScores ? {
        overallRisk: determineOverallRisk(patientData.riskScores),
        recommendations: generateRecommendations(patientData.riskScores)
      } : undefined
    }))
  };

  const jsonContent = JSON.stringify(reportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  saveAs(blob, `FLUX-OS_Report_${timestamp}.json`);
};

interface ExcelSheetData {
  name: string;
  data: (string | number)[][];
}

export const generateExcelReport = async (
  data: PatientReportData[],
  options: ReportOptions
): Promise<void> => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create Summary Sheet
  const summaryData: (string | number)[][] = [
    ['FLUX-OS Medical Report'],
    ['Generated:', format(new Date(), 'PPpp')],
    [],
    ['Patient', 'Bed', 'Age', 'Gender', 'Current HR', 'Current BP', 'SpO2', 'Temp (°F)']
  ];

  data.forEach(patientData => {
    if (patientData.currentVitals) {
      summaryData.push([
        patientData.patient.name,
        patientData.patient.bed,
        patientData.patient.age,
        patientData.patient.gender,
        patientData.currentVitals.Pulse,
        `${patientData.currentVitals.BloodPressure.Systolic}/${patientData.currentVitals.BloodPressure.Diastolic}`,
        patientData.currentVitals.SpO2,
        patientData.currentVitals.Temp.toFixed(1)
      ]);
    }
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Create Vitals Time Series Sheet (if requested)
  if (options.includeVitals && options.includeTrends) {
    const vitalsData: (string | number)[][] = [
      ['Patient', 'Bed', 'Timestamp', 'Heart Rate (bpm)', 'BP Systolic', 'BP Diastolic', 'Respiratory Rate', 'SpO2 (%)', 'Temperature (°F)']
    ];

    data.forEach(patientData => {
      if (patientData.vitalsTrend) {
        patientData.vitalsTrend.forEach(vital => {
          vitalsData.push([
            patientData.patient.name,
            patientData.patient.bed,
            vital.timestamp,
            vital.hr,
            vital.bps,
            vital.bpd,
            vital.rr,
            vital.spo2,
            vital.temp.toFixed(1)
          ]);
        });
      }
    });

    const vitalsSheet = XLSX.utils.aoa_to_sheet(vitalsData);
    XLSX.utils.book_append_sheet(wb, vitalsSheet, 'Vitals Time Series');
  }

  // Create Risk Scores Sheet (if requested)
  if (options.includeRiskScores) {
    const scoresData: (string | number)[][] = [
      ['Patient', 'Bed', 'NEWS2', 'NEWS2 Risk', 'Modified Shock Index', 'MSI Risk', 'Respiratory Index', 'Resp Risk', 'MAP', 'Pulse Pressure', 'Shock Index']
    ];

    data.forEach(patientData => {
      if (patientData.riskScores) {
        scoresData.push([
          patientData.patient.name,
          patientData.patient.bed,
          patientData.riskScores.news2.value,
          patientData.riskScores.news2.risk,
          patientData.riskScores.msi.value.toFixed(2),
          patientData.riskScores.msi.risk,
          patientData.riskScores.respiratory.value,
          patientData.riskScores.respiratory.risk,
          patientData.riskScores.map?.toFixed(0) || 'N/A',
          patientData.riskScores.pulsePressure?.toFixed(0) || 'N/A',
          patientData.riskScores.shockIndex?.toFixed(2) || 'N/A'
        ]);
      }
    });

    const scoresSheet = XLSX.utils.aoa_to_sheet(scoresData);
    XLSX.utils.book_append_sheet(wb, scoresSheet, 'Risk Scores');
  }

  // Create Report Info Sheet
  const infoData: (string | number)[][] = [
    ['Report Metadata'],
    [],
    ['Generated At:', format(new Date(), 'PPpp')],
    ['Number of Patients:', data.length],
    ['Includes Vitals:', options.includeVitals ? 'Yes' : 'No'],
    ['Includes Risk Scores:', options.includeRiskScores ? 'Yes' : 'No'],
    ['Includes Trends:', options.includeTrends ? 'Yes' : 'No'],
    [],
    ['Patients Included:'],
    ['Name', 'Bed', 'Age', 'Gender']
  ];

  data.forEach(patientData => {
    infoData.push([
      patientData.patient.name,
      patientData.patient.bed,
      patientData.patient.age,
      patientData.patient.gender
    ]);
  });

  const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Report Info');

  // Generate and download the file
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  XLSX.writeFile(wb, `FLUX-OS_Report_${timestamp}.xlsx`);
};

interface RiskScoresData {
  news2: ClinicalScore;
  msi: ClinicalScore;
  respiratory: ClinicalScore;
  map?: number;
}

function determineOverallRisk(riskScores: RiskScoresData): string {
  const risks = [
    riskScores.news2.risk,
    riskScores.msi.risk,
    riskScores.respiratory.risk
  ];

  if (risks.includes('critical')) return 'critical';
  if (risks.filter(r => r === 'high').length >= 2) return 'high';
  if (risks.includes('high')) return 'medium-high';
  if (risks.filter(r => r === 'medium').length >= 2) return 'medium';
  return 'low';
}

function generateRecommendations(riskScores: RiskScoresData): string[] {
  const recommendations: string[] = [];

  if (riskScores.news2.risk === 'critical' || riskScores.news2.value >= 7) {
    recommendations.push('Immediate clinical review required');
  }

  if (riskScores.msi.risk === 'high' || riskScores.msi.risk === 'critical') {
    recommendations.push('Monitor hemodynamic status closely');
  }

  if (riskScores.respiratory.risk === 'high' || riskScores.respiratory.risk === 'critical') {
    recommendations.push('Assess respiratory support needs');
  }

  if (riskScores.map && riskScores.map < 65) {
    recommendations.push('Low MAP - assess perfusion status');
  }

  return recommendations;
}