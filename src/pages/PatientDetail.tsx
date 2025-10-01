import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { PatientCard } from '@/components/dashboard/PatientCard';
import { VitalSigns } from '@/components/dashboard/VitalSigns';
import { ClinicalRiskDashboard } from '@/components/dashboard/ClinicalRiskDashboard';
import { PatientMonitoringChart } from '@/components/dashboard/PatientMonitoringChart';
import { VitalReading } from '@/types/vitals';
import { patientApiService } from '@/services/patientApiService';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';

export const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['heartRate']);
  const [activeView, setActiveView] = useState<string>('Patient Detail');
  const [patient, setPatient] = useState<{
    id: string;
    name: string;
    age: number;
    gender: string;
    bed: string;
    vitals?: any[];
    backgroundImage: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);

        const data = await patientApiService.getPatients();

        // Extract bed number from patientId (e.g., 'bed_01' -> 1)
        const bedNumber = parseInt(patientId?.replace('bed_', '') || '0');

        // Find patient by Identifier
        const foundPatient = data.find(p => p.Identifier === bedNumber);

        if (foundPatient) {

          // Format patient data to match expected structure
          setPatient({
            id: patientId,
            name: foundPatient.Name,
            age: foundPatient.Age,
            gender: foundPatient.Gender,
            bed: foundPatient.Bed,
            vitals: foundPatient.Vitals, // Adding vitals data
            backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true"
          });
        } else {
          setError('Patient not found');
        }
      } catch (err) {
        console.error('Failed to fetch patient data:', err);
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();

    // Subscribe to real-time patient updates with version tracking
    const unsubscribe = patientApiService.subscribe((updatedPatients, updateVersion) => {
      const bedNumber = parseInt(patientId?.replace('bed_', '') || '0');
      const updatedPatient = updatedPatients.find(p => p.Identifier === bedNumber);

      if (updatedPatient) {
        setPatient({
          id: patientId,
          name: updatedPatient.Name,
          age: updatedPatient.Age,
          gender: updatedPatient.Gender,
          bed: updatedPatient.Bed,
          vitals: updatedPatient.Vitals, // Updated vitals data
          backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true"
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [patientId]);

  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen pl-[27px] pt-10 max-md:pl-5">
        <div className="text-white text-xl">Loading patient data...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="bg-black min-h-screen pl-[27px] pt-10 max-md:pl-5">
        <div className="text-white text-xl">{error || 'Patient not found'}</div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
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
                  bedNumber={patient.bed || patient.id.replace('bed_', 'Bed ')}
                  patientName={patient.name}
                  demographics={`${patient.age}y / ${patient.gender}`}
                  duration="142h"
                  backgroundImage={patient.backgroundImage}
                />
                <VitalSigns
                  selectedMetrics={selectedMetrics}
                  onMetricToggle={toggleMetric}
                  patientId={patientId}
                />
              </div>
            </div>
            <div className="mt-6">
              <PatientMonitoringChart
                selectedMetrics={selectedMetrics}
                patientId={patientId}
              />
            </div>
            <ClinicalRiskDashboard
              patientId={patientId}
              patientName={patient.name}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientDetail;