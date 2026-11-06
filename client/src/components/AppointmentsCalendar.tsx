import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  Search,
  User,
  Armchair,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Smile,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { Appointment, Doctor, Patient, AppointmentStatus } from '../types';

interface AppointmentsCalendarProps {
  doctors: Doctor[];
  patients: Patient[];
  onOpenOdontogram: (patient: Patient) => void;
  onOpenOrthodontics: (patient: Patient) => void;
  onRefresh?: () => void;
}

const STATUS_BADGES: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  Programada: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Confirmada: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'En Espera': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'En Atencion': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Finalizada: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  Cancelada: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'No Asistio': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const TREATMENT_TYPES = [
  'Control de Ortodoncia y Recementado',
  'Control de Ortodoncia (Alineación / Cierre)',
  'Instalación de Brackets Fijos',
  'Control de Alineadores Invisibles',
  'Diagnóstico y Odontograma Inicial',
  'Limpieza Dental Profunda (Profilaxis)',
  'Resina / Obturación Estética',
  'Tratamiento de Conducto (Endodoncia)',
  'Exodoncia Simple / Tercer Molar',
  'Evaluación Pre-Quirúrgica Implante',
  'Blanqueamiento Dental Láser',
  'Urgencia Dental / Bracket Caído'
];

export const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({
  doctors,
  patients,
  onOpenOdontogram,
  onOpenOrthodontics,
  onRefresh
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterDoctorId, setFilterDoctorId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Modal para nueva cita
  const [showNewModal, setShowNewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    patient_id: patients[0]?.id || 1,
    doctor_id: doctors[0]?.id || 1,
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    duration_minutes: 30,
    treatment_type: TREATMENT_TYPES[0],
    dental_chair: 'Sillón Ortodoncia 1',
    notes: '',
    cost: 70
  });

  // Franjas horarias disponibles para el formulario
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, filterDoctorId, filterStatus]);

  useEffect(() => {
    if (showNewModal && bookingForm.doctor_id && bookingForm.appointment_date) {
      loadSlotsForForm(bookingForm.doctor_id, bookingForm.appointment_date);
    }
  }, [showNewModal, bookingForm.doctor_id, bookingForm.appointment_date]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments({
        date: viewMode === 'day' ? selectedDate : undefined,
        doctorId: filterDoctorId !== 'all' ? Number(filterDoctorId) : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      setAppointments(data);
    } catch (err) {
      console.error('Error cargando citas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlotsForForm = async (docId: number, date: string) => {
    try {
      const res = await api.getDoctorAvailability(docId, date);
      setAvailableSlots(res.slots || []);
      if (res.slots && res.slots.length > 0) {
        const firstFree = res.slots.find(s => s.available);
        if (firstFree) {
          setBookingForm(prev => ({ ...prev, start_time: firstFree.time, dental_chair: firstFree.dentalChair }));
        }
      }
    } catch (err) {
      console.error(err);
      setAvailableSlots([]);
    }
  };

  const handleStatusChange = async (appointmentId: number, newStatus: AppointmentStatus) => {
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      await loadAppointments();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error cambiando estado de la cita');
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAppointment(bookingForm);
      setShowNewModal(false);
      await loadAppointments();
      if (onRefresh) onRefresh();
      alert('¡Cita programada exitosamente!');
    } catch (err: any) {
      alert(err.message || 'Error programando cita');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (offsetDays: number) => {
    const current = new Date(`${selectedDate}T00:00:00`);
    current.setDate(current.getDate() + offsetDays);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Filtrado de búsqueda
  const filteredAppointments = appointments.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${a.first_name} ${a.last_name}`.toLowerCase();
    const dni = (a.dni || '').toLowerCase();
    const treatment = (a.treatment_type || '').toLowerCase();
    return fullName.includes(term) || dni.includes(term) || treatment.includes(term);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Barra superior de herramientas y acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <CalendarIcon size={14} />
              Gestión Integral de Citas y Turnos
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Agenda y Detección de Colisiones
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            Agenda Odontológica
          </h2>
          <p className="text-sm text-slate-500">
            Control de citas, salas de espera, estados de atención y acceso directo a historia clínica.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Navegación por fecha */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
              title="Día anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 px-2 py-1 outline-none"
            />
            <button
              onClick={() => handleDateChange(1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
              title="Día siguiente"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-white rounded-md transition-colors"
            >
              Hoy
            </button>
          </div>

          {/* Selector de modo de vista */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Agenda Diaria
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tabla General
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all"
          >
            <Plus size={16} />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Filtro por Doctor */}
          <select
            value={filterDoctorId}
            onChange={(e) => setFilterDoctorId(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">Todos los Especialistas</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">Todos los Estados</option>
            <option value="Programada">Programada</option>
            <option value="Confirmada">Confirmada</option>
            <option value="En Espera">En Espera (Sala)</option>
            <option value="En Atencion">En Consulta</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold self-end sm:self-center">
          {filteredAppointments.length} cita(s) encontrada(s)
        </div>
      </div>

      {/* VISTA AGENDA DIARIA */}
      {viewMode === 'day' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Cargando citas...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
              <CalendarIcon size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm text-slate-700">No hay citas programadas para este día</p>
              <p className="text-xs text-slate-400 mt-1">Haga clic en "+ Nueva Cita" para agendar una atención.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments.map(appt => {
                const statusStyle = STATUS_BADGES[appt.status] || STATUS_BADGES.Programada;
                const patientObj: Patient = {
                  id: appt.patient_id,
                  first_name: appt.first_name || '',
                  last_name: appt.last_name || '',
                  dni: appt.dni || '',
                  phone: appt.patient_phone || '',
                  has_orthodontics: appt.has_orthodontics || 0,
                  photo_url: appt.patient_photo
                };

                return (
                  <div
                    key={appt.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Cabecera de la Cita */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {appt.start_time} - {appt.end_time}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">({appt.duration_minutes} min)</span>
                        </div>

                        <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {appt.status}
                        </span>
                      </div>

                      {/* Paciente y Doctor */}
                      <div className="pt-3 flex items-start gap-3">
                        <img
                          src={appt.patient_photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'}
                          alt={appt.first_name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">
                            {appt.first_name} {appt.last_name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">DNI: {appt.dni} | Tel: {appt.patient_phone}</p>
                          <p className="text-[11px] font-semibold text-teal-700 flex items-center gap-1 mt-1 truncate">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: appt.doctor_color }} />
                            {appt.doctor_name}
                          </p>
                        </div>
                      </div>

                      {/* Motivo de Consulta y Sillón */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Activity size={13} className="text-sky-600" />
                          {appt.treatment_type}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Armchair size={12} className="text-slate-400" />
                            {appt.dental_chair}
                          </span>
                          <span className="font-bold text-slate-700">${appt.cost}</span>
                        </div>
                        {appt.notes && (
                          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60 line-clamp-2">
                            "{appt.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botones de Cambio Rápido de Estado y Acceso Clínico */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-400 font-medium">Estado:</span>
                        <div className="flex items-center gap-1">
                          {appt.status !== 'En Espera' && appt.status !== 'En Atencion' && appt.status !== 'Finalizada' && (
                            <button
                              onClick={() => handleStatusChange(appt.id, 'En Espera')}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md font-semibold text-[10px]"
                            >
                              En Sala
                            </button>
                          )}
                          {appt.status !== 'En Atencion' && appt.status !== 'Finalizada' && (
                            <button
                              onClick={() => handleStatusChange(appt.id, 'En Atencion')}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-md font-semibold text-[10px]"
                            >
                              Atender
                            </button>
                          )}
                          {appt.status !== 'Finalizada' && (
                            <button
                              onClick={() => handleStatusChange(appt.id, 'Finalizada')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-semibold text-[10px]"
                            >
                              Finalizar
                            </button>
                          )}
                          {appt.status !== 'Cancelada' && (
                            <button
                              onClick={() => handleStatusChange(appt.id, 'Cancelada')}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md font-semibold text-[10px]"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Accesos rápidos a Odontograma y Ortodoncia */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => onOpenOdontogram(patientObj)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-lg text-[11px] transition-colors"
                        >
                          <FileText size={13} />
                          Odontograma
                        </button>
                        <button
                          onClick={() => onOpenOrthodontics(patientObj)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-lg text-[11px] transition-colors"
                        >
                          <Smile size={13} />
                          Ortodoncia
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VISTA TABLA GENERAL */
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Tratamiento</th>
                <th className="p-3">Sillón</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map(appt => {
                const statusStyle = STATUS_BADGES[appt.status] || STATUS_BADGES.Programada;
                const patientObj: Patient = {
                  id: appt.patient_id,
                  first_name: appt.first_name || '',
                  last_name: appt.last_name || '',
                  dni: appt.dni || '',
                  phone: appt.patient_phone || '',
                  has_orthodontics: appt.has_orthodontics || 0,
                  photo_url: appt.patient_photo
                };

                return (
                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                      {appt.appointment_date} <span className="text-sky-600 block text-[11px]">{appt.start_time} - {appt.end_time}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      {appt.first_name} {appt.last_name}
                      <span className="block text-[10px] font-normal text-slate-400">DNI: {appt.dni}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">
                      {appt.doctor_name}
                    </td>
                    <td className="p-3 font-medium text-slate-800">
                      {appt.treatment_type}
                    </td>
                    <td className="p-3 text-slate-600">
                      {appt.dental_chair}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenOdontogram(patientObj)}
                          className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded font-semibold text-[10px]"
                        >
                          Odontograma
                        </button>
                        <button
                          onClick={() => onOpenOrthodontics(patientObj)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded font-semibold text-[10px]"
                        >
                          Ortodoncia
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CREAR NUEVA CITA CON DETECCIÓN INTELIGENTE DE COLISIONES */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Agendar Nueva Cita Odontológica
                </h3>
                <p className="text-xs text-slate-500">
                  El sistema valida disponibilidad en tiempo real para evitar solapamientos
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Paciente y Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Paciente:*</label>
                  <select
                    value={bookingForm.patient_id}
                    onChange={(e) => setBookingForm({ ...bookingForm, patient_id: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} (DNI: {p.dni})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Especialista:*</label>
                  <select
                    value={bookingForm.doctor_id}
                    onChange={(e) => setBookingForm({ ...bookingForm, doctor_id: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.specialty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha y Selección de Turno Disponible */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Fecha de Cita:*</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.appointment_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })}
                    className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                  />
                </div>

                {/* Franjas disponibles calculadas dinámicamente */}
                <div>
                  <label className="text-xs text-slate-600 block mb-1">
                    Seleccione un Turno Disponible para este Doctor:
                  </label>
                  {availableSlots.length === 0 ? (
                    <p className="text-xs text-amber-700 italic">No hay turnos disponibles para esta fecha.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                      {availableSlots.map(s => (
                        <button
                          key={s.time}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setBookingForm({ ...bookingForm, start_time: s.time, dental_chair: s.dentalChair })}
                          className={`p-1.5 rounded text-center text-xs font-bold transition-all ${
                            bookingForm.start_time === s.time
                              ? 'bg-sky-600 text-white shadow-xs'
                              : s.available
                              ? 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tipo de Tratamiento y Sillón */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Motivo / Tratamiento:*</label>
                  <select
                    value={bookingForm.treatment_type}
                    onChange={(e) => setBookingForm({ ...bookingForm, treatment_type: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    {TREATMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Sillón Dental:</label>
                  <input
                    type="text"
                    value={bookingForm.dental_chair}
                    onChange={(e) => setBookingForm({ ...bookingForm, dental_chair: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Duración y Costo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Duración (minutos):</label>
                  <select
                    value={bookingForm.duration_minutes}
                    onChange={(e) => setBookingForm({ ...bookingForm, duration_minutes: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos (Estándar)</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={90}>90 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Costo Estimado ($):</label>
                  <input
                    type="number"
                    value={bookingForm.cost}
                    onChange={(e) => setBookingForm({ ...bookingForm, cost: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notas de la Cita:</label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Instrucciones previas, indicaciones o requerimientos del paciente..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Verificando...' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
