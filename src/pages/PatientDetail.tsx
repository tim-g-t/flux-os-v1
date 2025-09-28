import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { PatientCard } from '@/components/dashboard/PatientCard';
import { VitalSigns } from '@/components/dashboard/VitalSigns';
import { LiveRiskScores } from '@/components/dashboard/LiveRiskScores';
import { PatientMonitoringChart } from '@/components/dashboard/PatientMonitoringChart';
import { usePatients } from '@/hooks/usePatients';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';


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

  const { getPatient, loading, error } = usePatients();
  const bedId = patientId || '';
  const patient = bedId ? getPatient(bedId) : null;

  if (loading) {
    return (
      <div className="bg-black min-h-screen pl-[27px] pt-10 max-md:pl-5">
        <div className="text-white text-xl">Loading patient...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black min-h-screen pl-[27px] pt-10 max-md:pl-5">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

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
                  backgroundImage="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true"
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