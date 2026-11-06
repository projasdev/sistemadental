import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Smile,
  BarChart3,
  FileText,
  Home,
  Stethoscope,
  Eye,
  Pill
} from 'lucide-react';
import { api } from './services/api';
import { Doctor, Patient, Appointment, DashboardKPIs } from './types';
import { DashboardHome } from './components/DashboardHome';
import { AppointmentsCalendar } from './components/AppointmentsCalendar';
import { DoctorSchedulePlanner } from './components/DoctorSchedulePlanner';
import { PatientsManager } from './components/PatientsManager';
import { Odontogram } from './components/Odontogram';
import { OrthodonticsModule } from './components/OrthodonticsModule';
import { ClinicalRecordModule } from './components/ClinicalRecordModule';
import { ReportsDashboard } from './components/ReportsDashboard';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [clinicalSubTab, setClinicalSubTab] = useState<'anamnesis' | 'evolutions' | 'radiology' | 'prescriptions'>('anamnesis');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs>({
    appointmentsToday: 0,
    waitingPatients: 0,
    activeOrthoCases: 0,
    monthlyRevenue: 0,
    attendanceRate: 100
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [doctorsToday, setDoctorsToday] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [docsData, ptsData, dashData] = await Promise.all([
        api.getDoctors(),
        api.getPatients(),
        api.getDashboardReports()
      ]);

      setDoctors(docsData);
      setPatients(ptsData);
      if (ptsData.length > 0 && !selectedPatient) {
        setSelectedPatient(ptsData[0]);
      } else if (selectedPatient) {
        const refreshed = ptsData.find(p => p.id === selectedPatient.id);
        if (refreshed) setSelectedPatient(refreshed);
      }
      setKpis(dashData.kpis);
      setTodayAppointments(dashData.todayAppointments);
      setDoctorsToday(dashData.doctorsToday);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOdontogram = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentTab('odontogram');
  };

  const handleOpenOrthodontics = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentTab('orthodontics');
  };

  const handleOpenClinicalRecord = (
    patient: Patient,
    subTab: 'anamnesis' | 'evolutions' | 'radiology' | 'prescriptions' = 'anamnesis'
  ) => {
    setSelectedPatient(patient);
    setClinicalSubTab(subTab);
    setCurrentTab('clinical-record');
  };

  const handleScheduleAppointment = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentTab('appointments');
  };

  const handleStatusChange = async (id: number, status: any) => {
    try {
      await api.updateAppointmentStatus(id, status);
      loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* NAVBAR SUPERIOR MODERNO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Logo y Nombre de la Clínica */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Smile size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-800 tracking-tight">DentalGravity</span>
                <span className="text-[10px] uppercase font-bold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">Pro</span>
              </div>
              <p className="text-[10px] text-slate-500 -mt-0.5">Historia Clínica, Rayos X, Ortodoncia y Recetas</p>
            </div>
          </div>

          {/* Menú de Navegación Principal */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'dashboard' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Home size={13} />
              Inicio
            </button>
            <button
              onClick={() => setCurrentTab('appointments')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'appointments' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Calendar size={13} />
              Citas
            </button>
            <button
              onClick={() => setCurrentTab('schedules')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'schedules' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Clock size={13} />
              Horarios
            </button>
            <button
              onClick={() => setCurrentTab('patients')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'patients' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Users size={13} />
              Pacientes
            </button>
            <button
              onClick={() => {
                setClinicalSubTab('anamnesis');
                setCurrentTab('clinical-record');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'clinical-record' && (clinicalSubTab === 'anamnesis' || clinicalSubTab === 'evolutions')
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Stethoscope size={13} />
              Historia y Evolución
            </button>
            <button
              onClick={() => {
                setClinicalSubTab('radiology');
                setCurrentTab('clinical-record');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'clinical-record' && clinicalSubTab === 'radiology'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Eye size={13} />
              Rayos X
            </button>
            <button
              onClick={() => {
                setClinicalSubTab('prescriptions');
                setCurrentTab('clinical-record');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'clinical-record' && clinicalSubTab === 'prescriptions'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Pill size={13} />
              Recetas (Rx)
            </button>
            <button
              onClick={() => setCurrentTab('odontogram')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'odontogram' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              Odontograma
            </button>
            <button
              onClick={() => setCurrentTab('orthodontics')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'orthodontics' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Smile size={13} />
              Ortodoncia
            </button>
            <button
              onClick={() => setCurrentTab('reports')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'reports' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              Reportes
            </button>
          </nav>

          {/* Selector de Paciente Activo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold pl-1">Paciente:</span>
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  const p = patients.find(pt => pt.id === Number(e.target.value));
                  if (p) setSelectedPatient(p);
                }}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg p-1 outline-none"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} {p.has_orthodontics ? '📐' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Barra de pestañas para pantallas medianas/móviles */}
        <div className="flex xl:hidden overflow-x-auto px-4 py-2 bg-slate-100 border-t border-slate-200 gap-1 text-xs">
          <button onClick={() => setCurrentTab('dashboard')} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'dashboard' ? 'bg-white text-sky-700' : 'text-slate-600'}`}>Inicio</button>
          <button onClick={() => setCurrentTab('appointments')} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'appointments' ? 'bg-white text-sky-700' : 'text-slate-600'}`}>Citas</button>
          <button onClick={() => setCurrentTab('schedules')} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'schedules' ? 'bg-white text-sky-700' : 'text-slate-600'}`}>Horarios</button>
          <button onClick={() => setCurrentTab('patients')} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'patients' ? 'bg-white text-sky-700' : 'text-slate-600'}`}>Pacientes</button>
          <button onClick={() => { setClinicalSubTab('anamnesis'); setCurrentTab('clinical-record'); }} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'clinical-record' && clinicalSubTab === 'anamnesis' ? 'bg-white text-emerald-700' : 'text-slate-600'}`}>Historia y Evolución</button>
          <button onClick={() => { setClinicalSubTab('radiology'); setCurrentTab('clinical-record'); }} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'clinical-record' && clinicalSubTab === 'radiology' ? 'bg-white text-indigo-700' : 'text-slate-600'}`}>Rayos X</button>
          <button onClick={() => { setClinicalSubTab('prescriptions'); setCurrentTab('clinical-record'); }} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'clinical-record' && clinicalSubTab === 'prescriptions' ? 'bg-white text-purple-700' : 'text-slate-600'}`}>Recetas (Rx)</button>
          <button onClick={() => setCurrentTab('odontogram')} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'odontogram' ? 'bg-white text-sky-700' : 'text-slate-600'}`}>Odontograma</button>
          <button onClick={() => setCurrentTab('orthodontics')} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'orthodontics' ? 'bg-white text-sky-700' : 'text-slate-600'}`}>Ortodoncia</button>
          <button onClick={() => setCurrentTab('reports')} className={`px-2.5 py-1 rounded-md font-semibold shrink-0 ${currentTab === 'reports' ? 'bg-white text-sky-700' : 'text-slate-600'}`}>Reportes</button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL DINÁMICO */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Cargando Sistema Dental y Base de Datos...</p>
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardHome
                kpis={kpis}
                todayAppointments={todayAppointments}
                doctorsToday={doctorsToday}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenOdontogram={handleOpenOdontogram}
                onOpenOrthodontics={handleOpenOrthodontics}
                onStatusChange={handleStatusChange}
              />
            )}

            {currentTab === 'appointments' && (
              <AppointmentsCalendar
                doctors={doctors}
                patients={patients}
                onOpenOdontogram={handleOpenOdontogram}
                onOpenOrthodontics={handleOpenOrthodontics}
                onRefresh={loadInitialData}
              />
            )}

            {currentTab === 'schedules' && (
              <DoctorSchedulePlanner
                doctors={doctors}
                onUpdate={loadInitialData}
              />
            )}

            {currentTab === 'patients' && (
              <PatientsManager
                patients={patients}
                onOpenOdontogram={handleOpenOdontogram}
                onOpenOrthodontics={handleOpenOrthodontics}
                onOpenClinicalRecord={handleOpenClinicalRecord}
                onScheduleAppointment={handleScheduleAppointment}
                onRefresh={loadInitialData}
              />
            )}

            {currentTab === 'clinical-record' && selectedPatient && (
              <ClinicalRecordModule
                patient={selectedPatient}
                doctors={doctors}
                initialSubTab={clinicalSubTab}
                onUpdate={loadInitialData}
              />
            )}

            {currentTab === 'odontogram' && selectedPatient && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-sky-50 p-3 rounded-xl border border-sky-200">
                  <div className="text-xs text-sky-800">
                    Mostrando odontograma de: <strong className="font-bold">{selectedPatient.first_name} {selectedPatient.last_name}</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenClinicalRecord(selectedPatient, 'anamnesis')}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      📋 Ver Historia Clínica y Rayos X →
                    </button>
                    <button
                      onClick={() => setCurrentTab('patients')}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900"
                    >
                      Cambiar Paciente →
                    </button>
                  </div>
                </div>
                <Odontogram patient={selectedPatient} onUpdate={loadInitialData} />
              </div>
            )}

            {currentTab === 'orthodontics' && selectedPatient && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                  <div className="text-xs text-indigo-900">
                    Tratamiento de ortodoncia de: <strong className="font-bold">{selectedPatient.first_name} {selectedPatient.last_name}</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenClinicalRecord(selectedPatient, 'radiology')}
                      className="text-xs font-bold text-indigo-700 hover:underline"
                    >
                      🩻 Ver Rayos X / Ortopantomografía →
                    </button>
                    <button
                      onClick={() => setCurrentTab('patients')}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      Cambiar Paciente →
                    </button>
                  </div>
                </div>
                <OrthodonticsModule patient={selectedPatient} doctors={doctors} onUpdate={loadInitialData} />
              </div>
            )}

            {currentTab === 'reports' && (
              <ReportsDashboard />
            )}
          </>
        )}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DentalGravity Pro © 2026 — Sistema Integral de Gestión Dental, Historia Clínica, Rayos X, Odontogramas y Recetas</span>
          <span className="flex items-center gap-1.5 font-semibold text-teal-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Base de datos SQLite activa y sincronizada
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
