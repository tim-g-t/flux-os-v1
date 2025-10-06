import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PatientCard } from './PatientCard';
import { VitalSigns } from './VitalSigns';
import { ClinicalRiskDashboard } from './ClinicalRiskDashboard';
import { PatientMonitoringChart } from './PatientMonitoringChart';
import { PatientOverviewAPI } from './PatientOverviewAPI';
import { patientApiService } from '@/services/patientApiService';
import { APIPatient } from '@/types/patient';
import Settings from '@/pages/Settings';
import { useICUTimer } from '@/hooks/useICUTimer';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const icuDuration = useICUTimer(142);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['heartRate']);
  const [activeView, setActiveView] = useState<string>('Dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('bed_01'); // Default to first patient
  const [selectedPatient, setSelectedPatient] = useState<APIPatient | null>(null);

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
    // If Reports is selected, navigate to reports page
    if (view === 'Reports') {
      navigate('/reports');
    }
    // If Settings is selected, navigate to settings page
    if (view === 'Settings') {
      navigate('/settings');
    }
    // Help & Support navigates to dedicated support page
    if (view === 'Help & Support') {
      navigate('/support');
    }
  };

  const handlePatientSelect = (patientId: string) => {
    console.log('Patient selected:', patientId);
    setSelectedPatientId(patientId);

    // Get the selected patient data
    const patient = patientApiService.getPatientByBedId(patientId);
    setSelectedPatient(patient);
  };

  // Load initial patient data
  useEffect(() => {
    const loadInitialPatient = async () => {
      // Wait for patients to be loaded
      const patients = patientApiService.getPatients();
      if (patients.length === 0) {
        // If not loaded yet, fetch them
        await patientApiService.fetchPatients();
      }

      // Get the default patient
      const patient = patientApiService.getPatientByBedId(selectedPatientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    };

    loadInitialPatient();

    // Subscribe to patient updates with version tracking
    const unsubscribe = patientApiService.subscribe((updatedPatients, updateVersion) => {
      // Update selected patient when data changes
      const patient = patientApiService.getPatientByBedId(selectedPatientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedPatientId]);

  return (
    <div className="bg-black min-h-screen pl-4 lg:pl-6 pt-6 lg:pt-10 pr-4 lg:pr-6">
      <div className="gap-3 lg:gap-5 flex max-md:flex-col max-md:items-stretch">
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
        <main className="flex-1 lg:ml-5 max-md:ml-0 pb-8 lg:pb-16">
          {activeView === 'Dashboard' ? (
            <div className="w-full">
              <PatientOverviewAPI onPatientSelect={handlePatientSelect} />
            </div>
          ) : activeView === 'Settings' ? (
            <>
              <Header />
              <div className="mt-8">
                <Settings />
              </div>
            </>
          ) : (
            <>
              <Header />
              <div className="bg-[rgba(26,27,32,1)] border w-full mt-4 lg:mt-8 pt-4 lg:pt-6 px-3 lg:px-6 pb-6 lg:pb-8 rounded-2xl lg:rounded-[32px] border-[rgba(64,66,73,1)] border-solid">
                <div className="w-full">
                  <div className="gap-3 lg:gap-5 flex items-stretch flex-col xl:flex-row">
                    <PatientCard
                      bedNumber={selectedPatient ? selectedPatient.Bed : 'Loading...'}
                      patientName={selectedPatient ? selectedPatient.Name : 'Loading...'}
                      demographics={selectedPatient ? `${selectedPatient.Age} y / ${selectedPatient.Gender.toLowerCase()}` : 'Loading...'}
                      duration={icuDuration}
                      backgroundImage="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true"
                    />
                    <VitalSigns
                      selectedMetrics={selectedMetrics}
                      onMetricToggle={toggleMetric}
                      patientId={selectedPatientId}
                    />
                  </div>
                </div>
                <div className="mt-4 lg:mt-6">
                  <PatientMonitoringChart
                    selectedMetrics={selectedMetrics}
                    patientId={selectedPatientId}
                  />
                </div>
                <ClinicalRiskDashboard
                  patientId={selectedPatientId}
                  patientName={selectedPatient ? selectedPatient.Name : 'Patient'}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
