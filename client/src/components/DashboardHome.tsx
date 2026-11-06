import React from 'react';
import {
  Calendar,
  Users,
  Smile,
  DollarSign,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Armchair,
  FileText,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Appointment, Doctor, Patient, DashboardKPIs } from '../types';

interface DashboardHomeProps {
  kpis: DashboardKPIs;
  todayAppointments: Appointment[];
  doctorsToday: Array<{
    name: string;
    specialty: string;
    avatar: string;
    start_time: string;
    end_time: string;
    dental_chair: string;
  }>;
  onNavigate: (tab: string) => void;
  onOpenOdontogram: (patient: Patient) => void;
  onOpenOrthodontics: (patient: Patient) => void;
  onStatusChange: (id: number, status: any) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  kpis,
  todayAppointments,
  doctorsToday,
  onNavigate,
  onOpenOdontogram,
  onOpenOrthodontics,
  onStatusChange
}) => {
  return (
    <div className="space-y-6">
      {/* TARJETAS DE KPIS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Citas de Hoy */}
        <div
          onClick={() => onNavigate('appointments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Citas de Hoy
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              <Calendar size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">{kpis.appointmentsToday}</div>
          <p className="text-xs text-sky-600 font-semibold mt-1">Ver agenda diaria →</p>
        </div>

        {/* Sala de Espera */}
        <div
          onClick={() => onNavigate('appointments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sala de Espera
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{kpis.waitingPatients}</div>
          <p className="text-xs text-amber-700 font-semibold mt-1">
            {kpis.waitingPatients > 0 ? 'Pacientes listos para entrar' : 'Sin espera actual'}
          </p>
        </div>

        {/* Ortodoncia Activa */}
        <div
          onClick={() => onNavigate('patients')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ortodoncia Activa
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Smile size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-700">{kpis.activeOrthoCases}</div>
          <p className="text-xs text-indigo-600 font-semibold mt-1">Planes en evolución →</p>
        </div>

        {/* Ingresos del Mes */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ingresos del Mes
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">${kpis.monthlyRevenue}</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Cobranzas al día →</p>
        </div>

        {/* Asistencia */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tasa Asistencia
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-teal-700">{kpis.attendanceRate}%</div>
          <p className="text-xs text-teal-600 font-semibold mt-1">Alta adherencia clínica</p>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: CITAS DE HOY EN VIVO Y DOCTORES EN TURNO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2/3): Agenda de Hoy en Vivo */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-sky-600" />
                Citas de Hoy en Consulta
              </h3>
              <p className="text-xs text-slate-500">
                Seguimiento de pacientes programados y en atención médica
              </p>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              Ver calendario completo <ArrowRight size={14} />
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No hay citas programadas para el día de hoy.
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map(appt => {
                const patientObj: Patient = {
                  id: appt.patient_id,
                  first_name: appt.first_name || '',
                  last_name: appt.last_name || '',
                  dni: appt.dni || '',
                  phone: appt.patient_phone || '',
                  has_orthodontics: 1
                };

                return (
                  <div
                    key={appt.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs shrink-0">
                        <span className="text-xs font-bold text-sky-700 block">{appt.start_time}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{appt.duration_minutes}m</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {appt.first_name} {appt.last_name}
                        </h4>
                        <p className="text-xs font-medium text-slate-600">{appt.treatment_type}</p>
                        <p className="text-[11px] text-teal-700 font-semibold mt-0.5">
                          {appt.doctor_name} — {appt.dental_chair}
                        </p>
                      </div>
                    </div>

                    {/* Botones de acción clínica inmediata */}
                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={() => onOpenOdontogram(patientObj)}
                        className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <FileText size={13} />
                        Odontograma
                      </button>
                      <button
                        onClick={() => onOpenOrthodontics(patientObj)}
                        className="px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Smile size={13} />
                        Ortodoncia
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha (1/3): Doctores en Turno Hoy */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Armchair size={18} className="text-teal-600" />
              Especialistas en Turno Hoy
            </h3>
            <p className="text-xs text-slate-500">Planificación de turnos y sillones asignados</p>
          </div>

          <div className="space-y-3">
            {doctorsToday.map((doc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3"
              >
                <img
                  src={doc.avatar}
                  alt={doc.name}
                  className="w-11 h-11 rounded-full object-cover border border-white shadow-xs shrink-0"
                />
                <div className="overflow-hidden">
                  <h4 className="font-bold text-slate-800 text-xs truncate">{doc.name}</h4>
                  <p className="text-[11px] text-teal-700 font-medium truncate">{doc.specialty}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {doc.start_time} - {doc.end_time} | {doc.dental_chair}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('schedules')}
            className="w-full py-2.5 text-center text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
          >
            Modificar Planificación de Horarios →
          </button>
        </div>
      </div>
    </div>
  );
};
