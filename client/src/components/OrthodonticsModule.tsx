import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  Smile,
  Shield,
  Clock,
  Award,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import {
  Patient,
  Doctor,
  OrthodonticPlan,
  OrthodonticBracket,
  OrthodonticControl,
  BracketStatus
} from '../types';

interface OrthodonticsModuleProps {
  patient: Patient;
  doctors: Doctor[];
  onUpdate?: () => void;
}

const LIGATURE_COLORS = [
  { name: 'Azul Rey', hex: '#2563eb' },
  { name: 'Celeste Neón', hex: '#0ea5e9' },
  { name: 'Rosa Fucsia', hex: '#ec4899' },
  { name: 'Morado Uva', hex: '#8b5cf6' },
  { name: 'Turquesa Mar', hex: '#06b6d4' },
  { name: 'Verde Menta', hex: '#10b981' },
  { name: 'Rojo Rubí', hex: '#ef4444' },
  { name: 'Gris Plata', hex: '#94a3b8' },
  { name: 'Negro Azabache', hex: '#1e293b' },
  { name: 'Naranja Cítrico', hex: '#f97316' },
  { name: 'Blanco Nieve', hex: '#e2e8f0' },
  { name: 'Dorado Champán', hex: '#eab308' },
];

const ORTHO_PHASES = [
  { id: 'Diagnóstico y Planificación', percent: 10, label: '1. Diagnóstico' },
  { id: 'Alineación y Nivelación', percent: 30, label: '2. Alineación y Nivelación' },
  { id: 'Corrección Sagital / Molar', percent: 50, label: '3. Corrección Sagital / Canina' },
  { id: 'Cierre de Espacios', percent: 75, label: '4. Cierre de Espacios' },
  { id: 'Detallado y Finalización', percent: 90, label: '5. Detallado y Oclusión' },
  { id: 'Retención y Contención', percent: 100, label: '6. Retención Activa' },
];

const BRACKET_STATUSES: Array<{ id: BracketStatus; label: string; color: string; badge: string }> = [
  { id: 'bracket_ok', label: 'Bracket Cementado OK', color: '#10b981', badge: 'bg-emerald-100 text-emerald-800' },
  { id: 'bracket_caido', label: '¡Bracket Desprendido!', color: '#ef4444', badge: 'bg-red-100 text-red-800' },
  { id: 'tubo', label: 'Tubo Molar', color: '#3b82f6', badge: 'bg-blue-100 text-blue-800' },
  { id: 'banda', label: 'Banda Molar', color: '#8b5cf6', badge: 'bg-purple-100 text-purple-800' },
  { id: 'boton', label: 'Botón Palatino / Lingual', color: '#f59e0b', badge: 'bg-amber-100 text-amber-800' },
  { id: 'sin_bracket', label: 'Sin Bracket / Exodoncia', color: '#94a3b8', badge: 'bg-slate-100 text-slate-700' },
];

export const OrthodonticsModule: React.FC<OrthodonticsModuleProps> = ({
  patient,
  doctors,
  onUpdate
}) => {
  const [plan, setPlan] = useState<OrthodonticPlan | null>(null);
  const [bracketsMap, setBracketsMap] = useState<Record<number, OrthodonticBracket>>({});
  const [controls, setControls] = useState<OrthodonticControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [showNewControlModal, setShowNewControlModal] = useState(false);
  const [selectedToothBracket, setSelectedToothBracket] = useState<number | null>(null);

  // Formulario de Plan de Ortodoncia
  const [formData, setFormData] = useState({
    doctor_id: doctors[0]?.id || 1,
    start_date: new Date().toISOString().split('T')[0],
    estimated_months: 18,
    bracket_type: 'Metálicos MBT 0.022',
    current_phase: 'Alineación y Nivelación',
    progress_percent: 25,
    upper_arch_current: 'NiTi .014',
    lower_arch_current: 'NiTi .014',
    ligature_type: 'Elastoméricas individuales',
    ligature_color: '#2563eb',
    elastics: '',
    appliances: '',
    total_cost: 1500,
    monthly_fee: 70,
    status: 'Activo',
    notes: ''
  });

  // Formulario de Nuevo Control
  const [newControlForm, setNewControlForm] = useState({
    doctor_id: doctors[0]?.id || 1,
    date: new Date().toISOString().split('T')[0],
    phase: 'Alineación y Nivelación',
    upper_arch: 'NiTi .016',
    lower_arch: 'NiTi .014',
    ligatures: 'Cadeneta Continua',
    ligature_color: '#2563eb',
    elastics_prescribed: 'Elásticos 3/16 Clase II 4.5oz nocturnos',
    adjustments_made: '',
    hygiene_score: 'Buena',
    pain_level: 1,
    brackets_replaced_count: 0,
    next_appointment_goals: 'Verificar nivelación y evaluar arcos de acero.',
    doctor_notes: '',
    cost: 70,
    paid: 1
  });

  useEffect(() => {
    loadOrthoData();
  }, [patient.id]);

  const loadOrthoData = async () => {
    setLoading(true);
    try {
      const data = await api.getOrthodontics(patient.id);
      if (data.plan) {
        setPlan(data.plan);
        setFormData({
          doctor_id: data.plan.doctor_id,
          start_date: data.plan.start_date,
          estimated_months: data.plan.estimated_months,
          bracket_type: data.plan.bracket_type,
          current_phase: data.plan.current_phase,
          progress_percent: data.plan.progress_percent,
          upper_arch_current: data.plan.upper_arch_current,
          lower_arch_current: data.plan.lower_arch_current,
          ligature_type: data.plan.ligature_type,
          ligature_color: data.plan.ligature_color,
          elastics: data.plan.elastics || '',
          appliances: data.plan.appliances || '',
          total_cost: data.plan.total_cost,
          monthly_fee: data.plan.monthly_fee,
          status: data.plan.status,
          notes: data.plan.notes || ''
        });
      }

      const map: Record<number, OrthodonticBracket> = {};
      data.bracketsMap.forEach(b => {
        map[b.tooth_number] = b;
      });
      setBracketsMap(map);
      setControls(data.controls);
    } catch (err) {
      console.error('Error cargando ortodoncia:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    setSavingPlan(true);
    try {
      await api.saveOrthodonticPlan(patient.id, formData);
      await loadOrthoData();
      alert('Plan de ortodoncia guardado exitosamente.');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error guardando el plan de ortodoncia.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleBracketClick = async (toothNum: number, newStatus: BracketStatus) => {
    try {
      await api.updateBracketStatus(patient.id, {
        tooth_number: toothNum,
        bracket_status: newStatus,
        prescription: formData.bracket_type,
        notes: newStatus === 'bracket_caido' ? 'Desprendido por oclusión' : 'OK'
      });
      setBracketsMap(prev => ({
        ...prev,
        [toothNum]: {
          ...prev[toothNum],
          patient_id: patient.id,
          tooth_number: toothNum,
          bracket_status: newStatus
        }
      }));
      setSelectedToothBracket(null);
    } catch (err) {
      console.error(err);
      alert('Error actualizando estado del bracket');
    }
  };

  const handleCreateControl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOrthodonticControl(patient.id, newControlForm);
      setShowNewControlModal(false);
      await loadOrthoData();
      alert('¡Sesión de control registrada exitosamente!');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error registrando sesión de control');
    }
  };

  // Piezas dentales para arcada ortodóntica
  const upperTeeth = [17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27];
  const lowerTeeth = [47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37];

  // Identificar si hay brackets caídos
  const brokenCount = Object.values(bracketsMap).filter(b => b.bracket_status === 'bracket_caido').length;

  const renderBracketItem = (toothNum: number) => {
    const bracket = bracketsMap[toothNum];
    const status = bracket?.bracket_status || ([16, 26, 36, 46, 17, 27, 37, 47].includes(toothNum) ? 'tubo' : 'bracket_ok');
    const isBroken = status === 'bracket_caido';
    const isTube = status === 'tubo' || status === 'banda';
    const isButton = status === 'boton';
    const isMissing = status === 'sin_bracket';

    return (
      <div
        key={toothNum}
        onClick={() => setSelectedToothBracket(toothNum)}
        className={`relative flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
          isBroken
            ? 'bg-red-50 border-red-300 ring-2 ring-red-400 animate-pulse'
            : 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md'
        }`}
        title={`Pieza ${toothNum} - Estado: ${status}`}
      >
        <span className="text-[11px] font-bold text-slate-600 mb-1">{toothNum}</span>

        {/* Representación gráfica del Bracket / Tubo */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          {isBroken ? (
            <div className="w-7 h-7 rounded-lg bg-red-100 border-2 border-dashed border-red-500 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
          ) : isTube ? (
            <div className="w-7 h-6 rounded bg-slate-700 border border-slate-900 flex items-center justify-center shadow-sm">
              <div className="w-5 h-1.5 bg-slate-300 rounded-sm" />
            </div>
          ) : isButton ? (
            <div className="w-5 h-5 rounded-full bg-amber-400 border border-amber-600 shadow-sm flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-700" />
            </div>
          ) : isMissing ? (
            <div className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-300">
              —
            </div>
          ) : (
            /* Bracket Estándar con la ligadura de color activa */
            <div
              className="w-7 h-7 rounded-md border shadow-sm flex items-center justify-center relative"
              style={{
                backgroundColor: '#e2e8f0',
                borderColor: '#94a3b8'
              }}
            >
              {/* Aro de ligadura elastomérica en 4 aletas */}
              <div
                className="w-6 h-6 rounded-md opacity-90 flex items-center justify-center transition-colors"
                style={{ backgroundColor: formData.ligature_color }}
              >
                {/* Ranura central metálica (Slot .022) */}
                <div className="w-5 h-1.5 bg-slate-800 rounded-xs" />
              </div>
            </div>
          )}
        </div>

        {/* Etiqueta de tipo */}
        <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">
          {isBroken ? '¡CAÍDO!' : isTube ? 'TUBO' : isButton ? 'BOTÓN' : isMissing ? 'S/B' : 'OK'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Encabezado y datos del paciente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <Smile size={14} />
              Módulo de Ortodoncia y Ortopedia
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Aparatos Fijos y Alineadores
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            Ficha de Ortodoncia: {patient.first_name} {patient.last_name}
          </h2>
          <p className="text-sm text-slate-500">
            Fase Actual: <span className="font-bold text-indigo-700">{formData.current_phase}</span> |
            Aparatología: <span className="font-semibold text-slate-700">{formData.bracket_type}</span> |
            Progreso: <span className="font-semibold text-emerald-600">{formData.progress_percent}%</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNewControlModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
          >
            <Plus size={16} />
            Registrar Cita de Control
          </button>
          <button
            onClick={savePlan}
            disabled={savingPlan}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
          >
            <Save size={16} />
            {savingPlan ? 'Guardando...' : 'Guardar Plan'}
          </button>
        </div>
      </div>

      {/* Alerta si hay brackets desprendidos */}
      {brokenCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl text-red-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                ¡Atención! {brokenCount} bracket(s) desprendido(s) reportado(s)
              </h4>
              <p className="text-xs text-red-700">
                Se requiere recementado urgente para evitar pérdida de anclaje o retrasos en la fase de alineación.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewControlModal(true)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
          >
            Recementar en Control
          </button>
        </div>
      )}

      {/* BARRA DE PROGRESO DE FASES DE ORTODONCIA */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Activity size={15} className="text-indigo-600" />
            Progreso General del Tratamiento de Ortodoncia ({formData.progress_percent}%)
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Estimado: {formData.estimated_months} meses
          </span>
        </div>

        {/* Barra de progreso visual */}
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${formData.progress_percent}%` }}
          />
        </div>

        {/* Fases secuenciales */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2">
          {ORTHO_PHASES.map((p, idx) => {
            const isCurrent = formData.current_phase === p.id;
            const isCompleted = formData.progress_percent >= p.percent;

            return (
              <button
                key={p.id}
                onClick={() => setFormData({ ...formData, current_phase: p.id, progress_percent: p.percent })}
                className={`p-2 rounded-lg text-left border transition-all text-xs ${
                  isCurrent
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Paso {idx + 1}</span>
                  {isCompleted && <CheckCircle2 size={12} className="text-emerald-600" />}
                </div>
                <div className="line-clamp-1">{p.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAPA VISUAL DE BRACKETS Y ARCOS POR ARCADA */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              Mapa Visual de Brackets por Diente
            </h3>
            <p className="text-xs text-slate-500">
              Haga clic sobre cualquier pieza para cambiar su estado (OK, Caído, Tubo, Banda)
            </p>
          </div>

          {/* Selector de color de ligas */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-slate-700">Color de Ligas:</span>
            <div className="flex items-center gap-1">
              {LIGATURE_COLORS.slice(0, 8).map(c => (
                <button
                  key={c.hex}
                  onClick={() => setFormData({ ...formData, ligature_color: c.hex })}
                  title={c.name}
                  className={`w-4 h-4 rounded-full border transition-transform ${
                    formData.ligature_color === c.hex ? 'scale-125 ring-2 ring-slate-800 ring-offset-1' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ARCADA SUPERIOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-600">Arcada Superior (17 al 27)</span>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Arco Actual: {formData.upper_arch_current}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1 md:gap-2 overflow-x-auto p-3 bg-white rounded-xl border border-slate-200 shadow-inner">
            {upperTeeth.map(t => renderBracketItem(t))}
          </div>
        </div>

        {/* ARCADA INFERIOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-600">Arcada Inferior (47 al 37)</span>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Arco Actual: {formData.lower_arch_current}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1 md:gap-2 overflow-x-auto p-3 bg-white rounded-xl border border-slate-200 shadow-inner">
            {lowerTeeth.map(t => renderBracketItem(t))}
          </div>
        </div>

        {/* Leyenda del Mapa de Brackets */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200">
          {BRACKET_STATUSES.map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${s.badge}`} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DETALLES TÉCNICOS DEL PLAN DE ORTODONCIA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Columna 1: Arcos y Materiales */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers size={14} className="text-indigo-600" />
            Arcos y Prescripción
          </h4>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Tipo de Brackets:</label>
            <select
              value={formData.bracket_type}
              onChange={(e) => setFormData({ ...formData, bracket_type: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="Metálicos MBT 0.022">Metálicos MBT 0.022</option>
              <option value="Metálicos Roth 0.022">Metálicos Roth 0.022</option>
              <option value="Autoligables Damon Q">Autoligables Pasivos Damon Q</option>
              <option value="Cerámicos Estéticos">Cerámicos Policarboxilato</option>
              <option value="Zafiro Cristal Puro">Zafiro Cristal Puro</option>
              <option value="Alineadores Invisibles">Alineadores Termoplásticos</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Arco Superior:</label>
              <input
                type="text"
                value={formData.upper_arch_current}
                onChange={(e) => setFormData({ ...formData, upper_arch_current: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                placeholder="ej: NiTi .014"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Arco Inferior:</label>
              <input
                type="text"
                value={formData.lower_arch_current}
                onChange={(e) => setFormData({ ...formData, lower_arch_current: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                placeholder="ej: NiTi .014"
              />
            </div>
          </div>
        </div>

        {/* Columna 2: Mecánica y Elásticos */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Activity size={14} className="text-amber-600" />
            Mecánica y Elásticos
          </h4>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Elásticos Intermaxilares:</label>
            <input
              type="text"
              value={formData.elastics}
              onChange={(e) => setFormData({ ...formData, elastics: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              placeholder="ej: 3/16 Clase II 4.5oz nocturnos"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Aparatos Auxiliares / Disyuntores:</label>
            <input
              type="text"
              value={formData.appliances}
              onChange={(e) => setFormData({ ...formData, appliances: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              placeholder="ej: Botón de Nance, Tubos cementados en molares"
            />
          </div>
        </div>

        {/* Columna 3: Doctor y Finanzas */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-600" />
            Especialista y Finanzas
          </h4>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Ortodoncista Tratante:</label>
            <select
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: Number(e.target.value) })}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Costo Total ($):</label>
              <input
                type="number"
                value={formData.total_cost}
                onChange={(e) => setFormData({ ...formData, total_cost: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Cuota Mensual ($):</label>
              <input
                type="number"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* LÍNEA DE TIEMPO / BITÁCORA DE CONTROLES DE ORTODONCIA */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              Historial y Evolución de Citas de Control ({controls.length})
            </h3>
            <p className="text-xs text-slate-500">
              Registro secuencial de cambios de arco, ajustes de torque, higiene y recementados
            </p>
          </div>

          <button
            onClick={() => setShowNewControlModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Nueva Sesión
          </button>
        </div>

        {controls.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
            No hay sesiones de control registradas todavía para este paciente.
          </div>
        ) : (
          <div className="space-y-3">
            {controls.map((ctrl) => (
              <div
                key={ctrl.id}
                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white bg-indigo-600 px-2 py-0.5 rounded-md text-[11px]">
                      Sesión #{ctrl.session_number}
                    </span>
                    <span className="font-semibold text-slate-700">{ctrl.date}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{ctrl.doctor_name || 'Dr. Tratante'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                      Fase: {ctrl.phase}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      ctrl.hygiene_score === 'Excelente' || ctrl.hygiene_score === 'Buena'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      Higiene: {ctrl.hygiene_score}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-medium text-slate-800 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-700">Ajustes Realizados: </span>
                  {ctrl.adjustments_made}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400">Arcos colocados: </span>
                    <span className="font-semibold">{ctrl.upper_arch || '—'} / {ctrl.lower_arch || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Brackets recementados: </span>
                    <span className="font-semibold">{ctrl.brackets_replaced_count}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Próximos objetivos: </span>
                    <span className="font-medium text-indigo-700">{ctrl.next_appointment_goals || 'Control mensual'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PARA CAMBIO DE ESTADO DE UN BRACKET EN PIEZA ESPECÍFICA */}
      {selectedToothBracket !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                Ajustar Pieza Dental {selectedToothBracket}
              </h3>
              <button
                onClick={() => setSelectedToothBracket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Seleccione el nuevo estado del aditamento ortodóntico para este diente:
            </p>

            <div className="space-y-2">
              {BRACKET_STATUSES.map(st => (
                <button
                  key={st.id}
                  onClick={() => handleBracketClick(selectedToothBracket, st.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-xs font-semibold text-left transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
                    {st.label}
                  </span>
                  <span className="text-slate-400 text-[10px]">Elegir</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA REGISTRAR NUEVA SESIÓN DE CONTROL DE ORTODONCIA */}
      {showNewControlModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Registrar Sesión de Control de Ortodoncia
                </h3>
                <p className="text-xs text-slate-500">
                  Paciente: {patient.first_name} {patient.last_name}
                </p>
              </div>
              <button
                onClick={() => setShowNewControlModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateControl} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha de Sesión:</label>
                  <input
                    type="date"
                    required
                    value={newControlForm.date}
                    onChange={(e) => setNewControlForm({ ...newControlForm, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Doctor que Atiende:</label>
                  <select
                    value={newControlForm.doctor_id}
                    onChange={(e) => setNewControlForm({ ...newControlForm, doctor_id: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fase del Tratamiento:</label>
                  <select
                    value={newControlForm.phase}
                    onChange={(e) => setNewControlForm({ ...newControlForm, phase: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    {ORTHO_PHASES.map(ph => (
                      <option key={ph.id} value={ph.id}>{ph.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Arcos y Ligas colocadas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Arco Superior Colocado:</label>
                  <input
                    type="text"
                    value={newControlForm.upper_arch}
                    onChange={(e) => setNewControlForm({ ...newControlForm, upper_arch: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    placeholder="ej: NiTi .016"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Arco Inferior Colocado:</label>
                  <input
                    type="text"
                    value={newControlForm.lower_arch}
                    onChange={(e) => setNewControlForm({ ...newControlForm, lower_arch: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    placeholder="ej: NiTi .016"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Ligaduras:</label>
                  <select
                    value={newControlForm.ligatures}
                    onChange={(e) => setNewControlForm({ ...newControlForm, ligatures: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Elastoméricas individuales">Elastoméricas individuales</option>
                    <option value="Cadeneta Continua">Cadeneta Continua</option>
                    <option value="Cadeneta Corta">Cadeneta Corta</option>
                    <option value="Ligadura Metálica Kobayahsi">Ligadura Metálica Kobayahsi</option>
                    <option value="Autoligado (Clip)">Autoligado Pasivo</option>
                  </select>
                </div>
              </div>

              {/* Ajustes Clínicos Realizados */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ajustes Clínicos y Procedimientos Realizados:*
                </label>
                <textarea
                  required
                  rows={3}
                  value={newControlForm.adjustments_made}
                  onChange={(e) => setNewControlForm({ ...newControlForm, adjustments_made: e.target.value })}
                  placeholder="Ej: Cambio de arcos a NiTi .016 superior e inferior. Cadeneta continua de molar a molar para cierre de diastema. Se recementó bracket caído en pieza 14."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Elásticos, Higiene y Brackets recementados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Elásticos Prescritos:</label>
                  <input
                    type="text"
                    value={newControlForm.elastics_prescribed}
                    onChange={(e) => setNewControlForm({ ...newControlForm, elastics_prescribed: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    placeholder="ej: 3/16 Clase II 4.5oz"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nivel de Higiene Bucal:</label>
                  <select
                    value={newControlForm.hygiene_score}
                    onChange={(e) => setNewControlForm({ ...newControlForm, hygiene_score: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Buena">Buena</option>
                    <option value="Regular">Regular (Reforzar técnica)</option>
                    <option value="Deficiente">Deficiente (Alerta gingivitis)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Brackets Reparados:</label>
                  <input
                    type="number"
                    min="0"
                    value={newControlForm.brackets_replaced_count}
                    onChange={(e) => setNewControlForm({ ...newControlForm, brackets_replaced_count: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Próximos objetivos */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Objetivo para la Siguiente Cita:</label>
                <input
                  type="text"
                  value={newControlForm.next_appointment_goals}
                  onChange={(e) => setNewControlForm({ ...newControlForm, next_appointment_goals: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  placeholder="ej: Evaluar nivelación y paralelismo de raíces, posible cambio a acero .019x.025"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewControlModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
                >
                  Guardar Sesión de Control
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
