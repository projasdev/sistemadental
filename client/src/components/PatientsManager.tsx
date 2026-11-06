import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  FileText,
  Smile,
  AlertTriangle,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Patient } from '../types';

interface PatientsManagerProps {
  patients: Patient[];
  onOpenOdontogram: (patient: Patient) => void;
  onOpenOrthodontics: (patient: Patient) => void;
  onOpenClinicalRecord?: (patient: Patient, subTab?: 'anamnesis' | 'evolutions' | 'radiology' | 'prescriptions') => void;
  onScheduleAppointment: (patient: Patient) => void;
  onRefresh: () => void;
}

export const PatientsManager: React.FC<PatientsManagerProps> = ({
  patients,
  onOpenOdontogram,
  onOpenOrthodontics,
  onOpenClinicalRecord,
  onScheduleAppointment,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    birthdate: '2000-01-01',
    gender: 'Femenino',
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    medical_history: '',
    has_orthodontics: 0,
    photo_url: ''
  });

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setForm({
      first_name: '',
      last_name: '',
      dni: '',
      birthdate: '2000-01-01',
      gender: 'Femenino',
      phone: '',
      email: '',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      medical_history: '',
      has_orthodontics: 0,
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setEditingPatient(p);
    setForm({
      first_name: p.first_name,
      last_name: p.last_name,
      dni: p.dni,
      birthdate: p.birthdate || '2000-01-01',
      gender: p.gender || 'Femenino',
      phone: p.phone,
      email: p.email || '',
      address: p.address || '',
      emergency_contact: p.emergency_contact || '',
      emergency_phone: p.emergency_phone || '',
      medical_history: p.medical_history || '',
      has_orthodontics: p.has_orthodontics || 0,
      photo_url: p.photo_url || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPatient) {
        await api.updatePatient(editingPatient.id, form);
        alert('Paciente actualizado con éxito.');
      } else {
        await api.createPatient(form);
        alert('Paciente registrado exitosamente.');
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error guardando datos del paciente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este paciente y todos sus registros clínicos asociados?')) return;
    try {
      await api.deletePatient(id);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error eliminando paciente');
    }
  };

  const filteredPatients = patients.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(term) || p.dni.includes(term) || p.phone.includes(term);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <Users size={14} />
              Historias Clínicas y Pacientes
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Filiación y Antecedentes Médicos
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            Directorio de Pacientes
          </h2>
          <p className="text-sm text-slate-500">
            {patients.length} pacientes registrados con acceso a odontograma y ortodoncia.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
        >
          <Plus size={16} />
          Nuevo Paciente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, DNI o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Grid de Pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map(p => (
          <div
            key={p.id}
            className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Cabecera de la ficha */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={p.photo_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'}
                    alt={p.first_name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-base leading-tight">
                      {p.first_name} {p.last_name}
                    </h3>
                    <p className="text-xs text-slate-500">DNI: <span className="font-semibold text-slate-700">{p.dni}</span></p>
                    <p className="text-xs text-slate-500">{p.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Editar datos"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Indicador de Ortodoncia y Antecedentes */}
              <div className="mt-4 space-y-2">
                {Boolean(p.has_orthodontics) ? (
                  <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
                    <Smile size={16} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-bold text-indigo-900">Ortodoncia Activa</span>
                      {p.ortho_phase && (
                        <p className="text-[11px] text-indigo-700 font-medium">Fase: {p.ortho_phase}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500">
                    <HeartPulse size={15} className="text-slate-400" />
                    <span>Odontología General</span>
                  </div>
                )}

                {/* Alerta de Antecedentes Médicos / Alergias */}
                {p.medical_history && (
                  <div className="p-2 bg-rose-50/60 border border-rose-100 rounded-xl text-[11px] text-rose-800 flex items-start gap-1.5">
                    <AlertTriangle size={13} className="text-rose-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      <strong className="font-bold">Alerta Médica:</strong> {p.medical_history}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones Clínicas Inmediatas */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onOpenClinicalRecord && onOpenClinicalRecord(p, 'anamnesis')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] transition-colors"
                >
                  📋 Historia
                </button>
                <button
                  onClick={() => onOpenClinicalRecord && onOpenClinicalRecord(p, 'radiology')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px] transition-colors"
                >
                  🩻 Rayos X
                </button>
                <button
                  onClick={() => onOpenClinicalRecord && onOpenClinicalRecord(p, 'prescriptions')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-lg text-[11px] transition-colors"
                >
                  💊 Recetas
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onOpenOdontogram(p)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-xl text-xs transition-colors"
                >
                  <FileText size={14} />
                  Odontograma
                </button>
                <button
                  onClick={() => onOpenOrthodontics(p)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-xl text-xs transition-colors"
                >
                  <Smile size={14} />
                  Ortodoncia
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAR / EDITAR PACIENTE */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {editingPatient ? 'Editar Datos del Paciente' : 'Registrar Nuevo Paciente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nombres:*</label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Apellidos:*</label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">DNI / Documento:*</label>
                  <input
                    type="text"
                    required
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Teléfono:*</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Género:</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email:</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha de Nacimiento:</label>
                  <input
                    type="date"
                    value={form.birthdate}
                    onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Antecedentes Médicos y Alergias */}
              <div>
                <label className="text-xs font-bold text-rose-700 block mb-1 flex items-center gap-1">
                  <AlertTriangle size={13} />
                  Antecedentes Médicos y Alergias (Crítico para Anestesia y Tratamientos):
                </label>
                <textarea
                  rows={2}
                  value={form.medical_history}
                  onChange={(e) => setForm({ ...form, medical_history: e.target.value })}
                  placeholder="ej: Alergia a la penicilina, hipertensión arterial controlada, diabetes..."
                  className="w-full text-xs p-2.5 rounded-lg border border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Contacto de Emergencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Contacto de Emergencia:</label>
                  <input
                    type="text"
                    value={form.emergency_contact}
                    onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                    placeholder="Nombre y parentesco"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Teléfono de Emergencia:</label>
                  <input
                    type="text"
                    value={form.emergency_phone}
                    onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
                >
                  {submitting ? 'Guardando...' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
