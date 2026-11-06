import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Shield,
  Coffee,
  Armchair,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Doctor, DoctorSchedule, ScheduleBlock } from '../types';

interface DoctorSchedulePlannerProps {
  doctors: Doctor[];
  onUpdate?: () => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

const CHAIR_OPTIONS = [
  'Sillón Ortodoncia 1',
  'Sillón Estética 2',
  'Sillón Quirúrgico 3',
  'Sillón Pediátrico 4',
  'Sillón Odontología General 5'
];

export const DoctorSchedulePlanner: React.FC<DoctorSchedulePlannerProps> = ({
  doctors,
  onUpdate
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(doctors[0]?.id || 1);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulador de disponibilidad en tiempo real
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [simulating, setSimulating] = useState(false);

  // Modal para nuevo bloqueo de agenda
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({
    title: '',
    start_datetime: '',
    end_datetime: '',
    reason: ''
  });

  const currentDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorSchedules(selectedDoctorId);
      loadBlocks();
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    if (selectedDoctorId && testDate) {
      simulateSlots();
    }
  }, [selectedDoctorId, testDate]);

  const loadDoctorSchedules = async (docId: number) => {
    try {
      const data = await api.getDoctorSchedules(docId);
      // Asegurarse de tener 7 días
      const fullWeek: DoctorSchedule[] = DAYS_OF_WEEK.map(d => {
        const found = data.find(s => s.day_of_week === d.id);
        return found || {
          doctor_id: docId,
          day_of_week: d.id,
          start_time: '08:30',
          end_time: '18:00',
          break_start: '13:00',
          break_end: '14:30',
          slot_duration_minutes: 30,
          dental_chair: 'Sillón Ortodoncia 1',
          is_active: d.id !== 0 ? 1 : 0 // Domingo inactivo por defecto
        };
      });
      setSchedules(fullWeek);
    } catch (err) {
      console.error('Error cargando horarios del doctor:', err);
    }
  };

  const loadBlocks = async () => {
    try {
      const data = await api.getScheduleBlocks();
      setBlocks(data);
    } catch (err) {
      console.error('Error cargando bloqueos:', err);
    }
  };

  const simulateSlots = async () => {
    setSimulating(true);
    try {
      const res = await api.getDoctorAvailability(selectedDoctorId, testDate);
      setAvailableSlots(res.slots || []);
    } catch (err) {
      console.error('Error simulando disponibilidad:', err);
      setAvailableSlots([]);
    } finally {
      setSimulating(false);
    }
  };

  const handleScheduleChange = (dayOfWeek: number, field: keyof DoctorSchedule, value: any) => {
    setSchedules(prev =>
      prev.map(s => (s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveSchedules = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.saveDoctorSchedules(selectedDoctorId, schedules);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      simulateSlots();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error guardando los horarios de atención.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createScheduleBlock({
        doctor_id: selectedDoctorId,
        title: blockForm.title,
        start_datetime: blockForm.start_datetime,
        end_datetime: blockForm.end_datetime,
        reason: blockForm.reason
      });
      setShowBlockModal(false);
      setBlockForm({ title: '', start_datetime: '', end_datetime: '', reason: '' });
      loadBlocks();
      simulateSlots();
    } catch (err) {
      console.error(err);
      alert('Error registrando bloqueo');
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!confirm('¿Desea desbloquear este período de tiempo?')) return;
    try {
      await api.deleteScheduleBlock(id);
      loadBlocks();
      simulateSlots();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Encabezado y Selector de Doctor */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <Clock size={14} />
              Planificación de Horarios y Turnos de Atención
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Sillones Dentales y Disponibilidad
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            Gestión de Horarios por Especialista
          </h2>
          <p className="text-sm text-slate-500">
            Defina turnos semanales, pausas de almuerzo, tiempo por turno y sillón asignado para evitar solapamientos.
          </p>
        </div>

        {/* Selector de Doctor */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <UserCheck size={18} className="text-teal-600 ml-2" />
            <span className="text-xs font-semibold text-slate-700">Doctor:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
              className="text-xs font-bold p-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowBlockModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
          >
            <Clock size={15} />
            Bloquear Horario / Vacaciones
          </button>

          <button
            onClick={handleSaveSchedules}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar Horarios'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>¡Horarios semanales del doctor actualizados con éxito en la base de datos!</span>
        </div>
      )}

      {/* Perfil del Doctor Actual */}
      {currentDoctor && (
        <div className="flex items-center gap-4 bg-gradient-to-r from-teal-50/50 via-slate-50 to-white p-4 rounded-xl border border-teal-100">
          <img
            src={currentDoctor.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256'}
            alt={currentDoctor.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
          />
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              {currentDoctor.name}
              <span
                className="w-3 h-3 rounded-full inline-block shadow-xs"
                style={{ backgroundColor: currentDoctor.color }}
                title="Color de cita en agenda"
              />
            </h3>
            <p className="text-xs font-medium text-teal-700">{currentDoctor.specialty} | Matrícula: {currentDoctor.license_number}</p>
            <p className="text-xs text-slate-500">Email: {currentDoctor.email} | Tel: {currentDoctor.phone}</p>
          </div>
        </div>
      )}

      {/* MATRIZ DE PLANIFICACIÓN SEMANAL */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Calendar size={16} className="text-teal-600" />
          Planificación Semanal de Jornada de Atención
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Día</th>
                <th className="p-3">Atención Activa</th>
                <th className="p-3">Hora Inicio</th>
                <th className="p-3">Hora Fin</th>
                <th className="p-3">Receso Almuerzo</th>
                <th className="p-3">Duración Turno</th>
                <th className="p-3">Sillón Asignado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedules.map(sch => {
                const dayObj = DAYS_OF_WEEK.find(d => d.id === sch.day_of_week);
                const isActive = Boolean(sch.is_active);

                return (
                  <tr
                    key={sch.day_of_week}
                    className={`transition-colors ${
                      isActive ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/60 opacity-60'
                    }`}
                  >
                    {/* Día */}
                    <td className="p-3 font-bold text-slate-800">
                      {dayObj?.label}
                    </td>

                    {/* Activo / Inactivo */}
                    <td className="p-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => handleScheduleChange(sch.day_of_week, 'is_active', e.target.checked ? 1 : 0)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                        <span className="ml-2 text-[11px] font-semibold text-slate-600">
                          {isActive ? 'Atiende' : 'Libre'}
                        </span>
                      </label>
                    </td>

                    {/* Hora Inicio */}
                    <td className="p-3">
                      <input
                        type="time"
                        disabled={!isActive}
                        value={sch.start_time}
                        onChange={(e) => handleScheduleChange(sch.day_of_week, 'start_time', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:bg-slate-100 font-medium"
                      />
                    </td>

                    {/* Hora Fin */}
                    <td className="p-3">
                      <input
                        type="time"
                        disabled={!isActive}
                        value={sch.end_time}
                        onChange={(e) => handleScheduleChange(sch.day_of_week, 'end_time', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:bg-slate-100 font-medium"
                      />
                    </td>

                    {/* Receso Almuerzo */}
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          disabled={!isActive}
                          value={sch.break_start || ''}
                          onChange={(e) => handleScheduleChange(sch.day_of_week, 'break_start', e.target.value || null)}
                          className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:bg-slate-100 font-medium w-24"
                        />
                        <span className="text-slate-400">a</span>
                        <input
                          type="time"
                          disabled={!isActive}
                          value={sch.break_end || ''}
                          onChange={(e) => handleScheduleChange(sch.day_of_week, 'break_end', e.target.value || null)}
                          className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:bg-slate-100 font-medium w-24"
                        />
                      </div>
                    </td>

                    {/* Duración de Turno */}
                    <td className="p-3">
                      <select
                        disabled={!isActive}
                        value={sch.slot_duration_minutes}
                        onChange={(e) => handleScheduleChange(sch.day_of_week, 'slot_duration_minutes', Number(e.target.value))}
                        className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:bg-slate-100 font-medium"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={20}>20 minutos</option>
                        <option value={30}>30 minutos (Estándar)</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>60 minutos (1 hora)</option>
                      </select>
                    </td>

                    {/* Sillón Asignado */}
                    <td className="p-3">
                      <select
                        disabled={!isActive}
                        value={sch.dental_chair}
                        onChange={(e) => handleScheduleChange(sch.day_of_week, 'dental_chair', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:bg-slate-100 font-medium"
                      >
                        {CHAIR_OPTIONS.map(chair => (
                          <option key={chair} value={chair}>{chair}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIMULADOR EN VIVO DE DISPONIBILIDAD DE FRICCIÓN CERO */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Sparkles size={15} className="text-teal-600" />
              Simulador de Franjas y Turnos Disponibles para Agendamiento
            </h4>
            <p className="text-xs text-slate-500">
              Verifique cómo el algoritmo calcula los turnos libres del doctor considerando recesos y citas agendadas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Fecha de Prueba:</span>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="text-xs p-2 bg-white rounded-lg border border-slate-300 font-semibold text-slate-700"
            />
          </div>
        </div>

        {simulating ? (
          <div className="py-6 text-center text-xs text-slate-500">Calculando turnos...</div>
        ) : availableSlots.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs text-center">
            El doctor no tiene disponibilidad en esta fecha (Día de descanso o bloqueado).
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {availableSlots.map(slot => (
                <div
                  key={slot.time}
                  className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                    slot.isBreak
                      ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed'
                      : slot.isBooked
                      ? 'bg-rose-50 border-rose-200 text-rose-700 cursor-not-allowed line-through'
                      : 'bg-white border-teal-300 text-teal-800 shadow-xs hover:bg-teal-50'
                  }`}
                  title={
                    slot.isBreak
                      ? 'Horario de Almuerzo'
                      : slot.isBooked
                      ? 'Ocupado con cita'
                      : 'Turno libre para agendar'
                  }
                >
                  <div className="text-[13px] font-bold">{slot.time}</div>
                  <div className="text-[9px] opacity-75">
                    {slot.isBreak ? '☕ Receso' : slot.isBooked ? '🔴 Ocupado' : '🟢 Libre'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-4 text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Disponible ({availableSlots.filter(s => s.available).length})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Ocupado ({availableSlots.filter(s => s.isBooked).length})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Almuerzo</span>
            </div>
          </div>
        )}
      </div>

      {/* BLOQUEOS DE AGENDA Y VACACIONES */}
      <div className="space-y-3 pt-3 border-t border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Clock size={15} className="text-rose-600" />
          Períodos Bloqueados y Ausencias Registradas ({blocks.length})
        </h4>

        {blocks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No hay ausencias ni vacaciones programadas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blocks.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs"
              >
                <div>
                  <h5 className="font-bold text-rose-900">{b.title}</h5>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Doctor: {b.doctor_name || 'Toda la clínica'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Desde: {b.start_datetime} | Hasta: {b.end_datetime}
                  </p>
                  {b.reason && <p className="text-[10px] text-rose-700 italic mt-0.5">Motivo: {b.reason}</p>}
                </div>
                <button
                  onClick={() => handleDeleteBlock(b.id)}
                  className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-100 rounded-lg transition-colors"
                  title="Eliminar bloqueo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CREAR BLOQUEO DE AGENDA */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Registrar Bloqueo de Agenda / Vacaciones
              </h3>
              <button
                onClick={() => setShowBlockModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Título del Bloqueo:*</label>
                <input
                  type="text"
                  required
                  value={blockForm.title}
                  onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })}
                  placeholder="ej: Congreso de Ortodoncia / Vacaciones"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha/Hora Inicio:*</label>
                  <input
                    type="datetime-local"
                    required
                    value={blockForm.start_datetime}
                    onChange={(e) => setBlockForm({ ...blockForm, start_datetime: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha/Hora Fin:*</label>
                  <input
                    type="datetime-local"
                    required
                    value={blockForm.end_datetime}
                    onChange={(e) => setBlockForm({ ...blockForm, end_datetime: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Motivo o Notas:</label>
                <textarea
                  rows={2}
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  placeholder="Detalles adicionales..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm"
                >
                  Confirmar Bloqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
