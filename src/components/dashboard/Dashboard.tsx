import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PatientCard } from './PatientCard';
import { VitalSigns } from './VitalSigns';
import { LiveRiskScores } from './LiveRiskScores';
import { PatientMonitoringChart } from './PatientMonitoringChart';
import { PatientOverview } from './PatientOverview';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['heartRate']);
  const [activeView, setActiveView] = useState<string>('Dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('bed_01'); // Default to first patient
  const { patients, loading, error, setServerEndpoint } = usePatients();

  // Auto-configure server endpoint on component mount
  useEffect(() => {
    // Set your server endpoint here - replace with your actual API URL
    const serverUrl = 'https://your-api-endpoint.com/patients';
    console.log('🚀 Dashboard: Configuring server endpoint:', serverUrl);
    
    // Uncomment the line below and set your actual server URL
    // setServerEndpoint(serverUrl);
    
    console.log('📊 Dashboard: Current patients loaded:', patients.length);
  }, [setServerEndpoint, patients.length]);

  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    // If Patient Detail is selected, navigate to the selected patient's detail page
    if (view === 'Patient Detail') {
      console.log('Navigating to patient detail for:', selectedPatientId);
      navigate(`/patient/${selectedPatientId}`);
    }
  };

  const handlePatientSelect = (patientId: string) => {
    console.log('Patient selected:', patientId);
    setSelectedPatientId(patientId);
  };

  return (
    <div className="bg-black min-h-screen pl-[27px] pt-10 pr-6 max-md:pl-5">
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
        <main className="w-[83%] ml-5 max-md:w-full max-md:ml-0 pb-16 pr-6">
          {activeView === 'Dashboard' ? (
            <div className="w-full">
              <PatientOverview onPatientSelect={handlePatientSelect} />
            </div>
          ) : (
            <>
              <Header />
              <div className="bg-[rgba(26,27,32,1)] border w-full mt-8 pt-6 px-6 pb-8 rounded-[32px] border-[rgba(64,66,73,1)] border-solid max-md:max-w-full max-md:px-5">
                <div className="max-md:max-w-full max-md:mr-[9px]">
                  <div className="gap-5 flex items-stretch max-md:flex-col">
                    <PatientCard
                      bedNumber="Bed 15"
                      patientName="Simon A."
                      demographics="45 y / male"
                      duration="142h"
                      backgroundImage="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true"
                    />
                    <VitalSigns selectedMetrics={selectedMetrics} onMetricToggle={toggleMetric} bedId={selectedPatientId} />
                  </div>
                </div>
                <div className="mt-6">
                  <PatientMonitoringChart selectedMetrics={selectedMetrics} bedId={selectedPatientId} />
                </div>
                <LiveRiskScores bedId={selectedPatientId} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
