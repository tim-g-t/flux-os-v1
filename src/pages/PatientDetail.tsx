import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { PatientCard } from '@/components/dashboard/PatientCard';
import { VitalSigns } from '@/components/dashboard/VitalSigns';
import { LiveRiskScores } from '@/components/dashboard/LiveRiskScores';
import { PatientMonitoringChart } from '@/components/dashboard/PatientMonitoringChart';
import { VitalReading } from '@/services/vitalsService';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';

// Mock patient data (same as in PatientOverview for consistency)
const generateSpecificVitals = (riskLevel: 'normal' | 'warning' | 'critical', avoidCriticalRiskScores: boolean = false): VitalReading => {
  switch (riskLevel) {
    case 'normal':
      return {
        hr: 75 + Math.floor(Math.random() * 15),
        bps: 110 + Math.floor(Math.random() * 20),
        bpd: 75 + Math.floor(Math.random() * 10),
        rr: 14 + Math.floor(Math.random() * 4),
        temp: 98.0 + Math.random() * 1.5,
        spo2: 97 + Math.floor(Math.random() * 3)
      };
    case 'warning':
      return {
        hr: Math.random() > 0.5 ? 65 + Math.floor(Math.random() * 5) : 101 + Math.floor(Math.random() * 9),
        bps: 125 + Math.floor(Math.random() * 10),
        bpd: 75 + Math.floor(Math.random() * 10),
        rr: 15 + Math.floor(Math.random() * 4),
        temp: 98.0 + Math.random() * 1.5,
        spo2: 94 + Math.floor(Math.random() * 2)
      };
    case 'critical':
      if (avoidCriticalRiskScores) {
        return {
          hr: 62 + Math.floor(Math.random() * 6),
          bps: 85 + Math.floor(Math.random() * 10),
          bpd: 70 + Math.floor(Math.random() * 10),
          rr: 13 + Math.floor(Math.random() * 4),
          temp: 96.8 + Math.random() * 1.0,
          spo2: 91 + Math.floor(Math.random() * 3)
        };
      } else {
        const baseVitals = {
          hr: 75 + Math.floor(Math.random() * 10),
          bps: 115 + Math.floor(Math.random() * 15),
          bpd: 75 + Math.floor(Math.random() * 10),
          rr: 14 + Math.floor(Math.random() * 4),
          temp: 98.0 + Math.random() * 1.5,
          spo2: 96 + Math.floor(Math.random() * 3)
        };
        
        const criticalType = Math.floor(Math.random() * 2);
        switch (criticalType) {
          case 0:
            baseVitals.hr = Math.random() > 0.5 ? 52 + Math.floor(Math.random() * 6) : 122 + Math.floor(Math.random() * 8);
            break;
          case 1:
            baseVitals.spo2 = 86 + Math.floor(Math.random() * 3);
            break;
        }
        
        return baseVitals;
      }
  }
};

const mockPatients = [
  { id: 'bed_01', name: 'Simon A.', age: 45, gender: 'Male', vitals: generateSpecificVitals('normal'), backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true" },
  { id: 'bed_02', name: 'Maria C.', age: 62, gender: 'Female', vitals: generateSpecificVitals('normal'), backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true" },
  { id: 'bed_03', name: 'David L.', age: 38, gender: 'Male', vitals: generateSpecificVitals('normal'), backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true" },
  { id: 'bed_04', name: 'Robert M.', age: 71, gender: 'Male', vitals: generateSpecificVitals('normal'), backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true" },
  { id: 'bed_05', name: 'Sarah K.', age: 54, gender: 'Female', vitals: generateSpecificVitals('warning'), backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true" },
  { id: 'bed_06', name: 'Anna T.', age: 42, gender: 'Female', vitals: generateSpecificVitals('critical'), backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true" },
  { id: 'bed_07', name: 'Elena R.', age: 29, gender: 'Female', vitals: generateSpecificVitals('normal'), backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true" },
  { id: 'bed_08', name: 'James P.', age: 66, gender: 'Male', vitals: generateSpecificVitals('normal'), backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true" }
];

export const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['heartRate']);
  const [activeView, setActiveView] = useState<string>('Patient Detail');

  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const patient = mockPatients.find(p => p.id === patientId);

  if (!patient) {
    return (
      <div className="bg-black min-h-screen pl-[27px] pt-10 max-md:pl-5">
        <div className="text-white text-xl">Patient not found</div>
      </div>
    );
  }

  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view === 'Dashboard') {
      navigate('/');
    }
  };

  return (
    <div className="bg-black min-h-screen pl-[27px] pt-10 pr-12 max-md:pl-5">
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
        <main className="w-[83%] ml-5 max-md:w-full max-md:ml-0 pb-16 pr-6">
          <Header />
          <div className="bg-[rgba(26,27,32,1)] border w-full mt-8 pt-6 px-6 pb-8 rounded-[32px] border-[rgba(64,66,73,1)] border-solid max-md:max-w-full max-md:px-5">
            <div className="max-md:max-w-full max-md:mr-[9px]">
              <div className="gap-5 flex items-stretch max-md:flex-col">
                <PatientCard
                  bedNumber={patient.id.replace('bed_', 'Bed ')}
                  patientName={patient.name}
                  demographics={`${patient.age} y / ${patient.gender.toLowerCase()}`}
                  duration="142h"
                  backgroundImage={patient.backgroundImage}
                />
                <VitalSigns 
                  selectedMetrics={selectedMetrics}
                  onMetricToggle={toggleMetric}
                  bedId={patient.id}
                />
              </div>
            </div>
            <div className="flex gap-6 mt-6 max-md:flex-col">
              <div className="flex-1">
                <PatientMonitoringChart 
                  bedId={patient.id}
                  selectedMetrics={selectedMetrics} 
                />
              </div>
            </div>
            <div className="mt-6">
              <LiveRiskScores bedId={patient.id} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientDetail;