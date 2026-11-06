import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Printer,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { OdontogramTooth, ToothCondition, ToothSurfaces, Patient } from '../types';

interface OdontogramProps {
  patient: Patient;
  onUpdate?: () => void;
}

const CONDITIONS: Array<{
  id: ToothCondition;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}> = [
  { id: 'caries', label: 'Caries Dental', color: '#ef4444', badgeBg: 'bg-red-100', badgeText: 'text-red-700', description: 'Lesión activa (Rojo)' },
  { id: 'obturado', label: 'Obturación / Resina', color: '#3b82f6', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', description: 'Restauración estética (Azul)' },
  { id: 'corona', label: 'Corona / Prótesis', color: '#f59e0b', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', description: 'Corona fija total (Dorado)' },
  { id: 'endodoncia', label: 'Endodoncia', color: '#8b5cf6', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', description: 'Tratamiento conducto (Morado)' },
  { id: 'sellante', label: 'Sellante Fosas', color: '#10b981', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', description: 'Sellante preventivo (Verde)' },
  { id: 'ausente', label: 'Pieza Ausente', color: '#475569', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700', description: 'Diente perdido / extraído (Cruz)' },
  { id: 'implante', label: 'Implante Dental', color: '#06b6d4', badgeBg: 'bg-cyan-100', badgeText: 'text-cyan-700', description: 'Implante de titanio (Cian)' },
  { id: 'fractura', label: 'Fractura Dental', color: '#e11d48', badgeBg: 'bg-rose-100', badgeText: 'text-rose-700', description: 'Traumatismo / fractura (Rosa)' },
  { id: 'sano', label: 'Diente Sano / Limpiar', color: '#ffffff', badgeBg: 'bg-gray-100', badgeText: 'text-gray-700', description: 'Restablecer a normal' },
];

export const Odontogram: React.FC<OdontogramProps> = ({ patient, onUpdate }) => {
  const [selectedTool, setSelectedTool] = useState<ToothCondition>('caries');
  const [dentitionType, setDentitionType] = useState<'adult' | 'child'>('adult');
  const [teethMap, setTeethMap] = useState<Record<number, OdontogramTooth>>({});
  const [selectedToothForNote, setSelectedToothForNote] = useState<number | null>(null);
  const [toothNoteInput, setToothNoteInput] = useState<string>('');
  const [diagnosisText, setDiagnosisText] = useState<string>('');
  const [treatmentPlanText, setTreatmentPlanText] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pastRecords, setPastRecords] = useState<any[]>([]);

  // Cargar datos del paciente
  useEffect(() => {
    loadOdontogram();
  }, [patient.id]);

  const loadOdontogram = async () => {
    try {
      const data = await api.getOdontogram(patient.id);
      const map: Record<number, OdontogramTooth> = {};
      data.teeth.forEach(t => {
        map[t.tooth_number] = t;
      });
      setTeethMap(map);
      setPastRecords(data.records);
      if (data.records && data.records.length > 0) {
        setDiagnosisText(data.records[0].general_diagnosis || '');
        setTreatmentPlanText(data.records[0].treatment_plan || '');
      }
    } catch (err) {
      console.error('Error cargando odontograma:', err);
    }
  };

  // Listas de piezas permanentes FDI
  const upperRightAdult = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeftAdult = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRightAdult = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeftAdult = [31, 32, 33, 34, 35, 36, 37, 38];

  // Listas de piezas infantiles temporales
  const upperRightChild = [55, 54, 53, 52, 51];
  const upperLeftChild = [61, 62, 63, 64, 65];
  const lowerRightChild = [85, 84, 83, 82, 81];
  const lowerLeftChild = [71, 72, 73, 74, 75];

  const handleSurfaceClick = (toothNum: number, surfaceKey: keyof ToothSurfaces) => {
    const current = teethMap[toothNum] || {
      patient_id: patient.id,
      tooth_number: toothNum,
      condition: 'sano',
      surfaces: {},
      notes: ''
    };

    let newSurfaces = { ...current.surfaces };

    if (selectedTool === 'sano') {
      delete newSurfaces[surfaceKey];
    } else {
      newSurfaces[surfaceKey] = selectedTool;
    }

    // Si todas las superficies están sanas y no hay condición global
    const hasRemainingConditions = Object.values(newSurfaces).some(c => c && c !== 'sano');
    const newGlobalCondition = hasRemainingConditions ? (selectedTool !== 'sano' ? selectedTool : 'sano') : 'sano';

    const updatedTooth: OdontogramTooth = {
      ...current,
      condition: newGlobalCondition,
      surfaces: newSurfaces
    };

    setTeethMap(prev => ({ ...prev, [toothNum]: updatedTooth }));
  };

  const handleToothGlobalClick = (toothNum: number) => {
    const current = teethMap[toothNum] || {
      patient_id: patient.id,
      tooth_number: toothNum,
      condition: 'sano',
      surfaces: {},
      notes: ''
    };

    if (['ausente', 'implante', 'corona', 'endodoncia', 'sano'].includes(selectedTool)) {
      const updatedTooth: OdontogramTooth = {
        ...current,
        condition: selectedTool,
        surfaces: selectedTool === 'sano' ? {} : current.surfaces
      };
      setTeethMap(prev => ({ ...prev, [toothNum]: updatedTooth }));
    } else {
      // Si la herramienta es de superficie, abrir modal de notas o seleccionar pieza
      setSelectedToothForNote(toothNum);
      setToothNoteInput(current.notes || '');
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      // Guardar cada diente modificado
      const promises = Object.values(teethMap).map(t =>
        api.saveToothCondition(patient.id, {
          tooth_number: t.tooth_number,
          condition: t.condition,
          surfaces: t.surfaces,
          notes: t.notes
        })
      );
      await Promise.all(promises);

      // Guardar registro de diagnóstico
      if (diagnosisText || treatmentPlanText) {
        await api.saveOdontogramRecord(patient.id, {
          general_diagnosis: diagnosisText,
          treatment_plan: treatmentPlanText,
          date: new Date().toISOString().split('T')[0]
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error guardando cambios del odontograma:', err);
      alert('Hubo un error al guardar los cambios en la base de datos.');
    } finally {
      setSaving(false);
    }
  };

  const getSurfaceColor = (toothNum: number, surfaceKey: keyof ToothSurfaces) => {
    const tooth = teethMap[toothNum];
    if (!tooth) return '#ffffff';
    if (tooth.condition === 'ausente') return '#cbd5e1';
    const cond = tooth.surfaces?.[surfaceKey];
    if (!cond || cond === 'sano') return '#ffffff';

    const match = CONDITIONS.find(c => c.id === cond);
    return match ? match.color : '#ffffff';
  };

  // Renderizador SVG de cada diente
  const renderTooth = (toothNum: number, isUpper: boolean) => {
    const tooth = teethMap[toothNum];
    const isMissing = tooth?.condition === 'ausente';
    const isImplant = tooth?.condition === 'implante';
    const isCrown = tooth?.condition === 'corona';
    const isEndo = tooth?.condition === 'endodoncia';
    const hasNote = Boolean(tooth?.notes);

    // Orientación anatómica de superficies según arcada y cuadrante
    const isRightQuadrant = [18, 17, 16, 15, 14, 13, 12, 11, 48, 47, 46, 45, 44, 43, 42, 41, 55, 54, 53, 52, 51, 85, 84, 83, 82, 81].includes(toothNum);

    const topSurface: keyof ToothSurfaces = isUpper ? 'vestibular' : 'lingual';
    const bottomSurface: keyof ToothSurfaces = isUpper ? 'palatino' : 'vestibular';
    const leftSurface: keyof ToothSurfaces = isRightQuadrant ? 'distal' : 'mesial';
    const rightSurface: keyof ToothSurfaces = isRightQuadrant ? 'mesial' : 'distal';
    const centerSurface: keyof ToothSurfaces = 'oclusal';

    return (
      <div key={toothNum} className="flex flex-col items-center group relative p-1 transition-all">
        {/* Número de pieza dental FDI */}
        <button
          onClick={() => handleToothGlobalClick(toothNum)}
          title={`Pieza ${toothNum} - Clic para opciones`}
          className={`text-xs font-bold rounded px-1.5 py-0.5 mb-1 transition-colors ${
            hasNote ? 'bg-amber-500 text-white' : 'bg-slate-100 hover:bg-sky-100 text-slate-700'
          }`}
        >
          {toothNum}
        </button>

        {/* Gráfico SVG interactivo */}
        <div className="relative w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-200 p-0.5 flex items-center justify-center cursor-pointer hover:border-sky-400">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Superficie Superior */}
            <polygon
              points="0,0 100,0 75,25 25,25"
              fill={getSurfaceColor(toothNum, topSurface)}
              stroke="#64748b"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, topSurface);
              }}
            />

            {/* Superficie Derecha */}
            <polygon
              points="100,0 100,100 75,75 75,25"
              fill={getSurfaceColor(toothNum, rightSurface)}
              stroke="#64748b"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, rightSurface);
              }}
            />

            {/* Superficie Inferior */}
            <polygon
              points="100,100 0,100 25,75 75,75"
              fill={getSurfaceColor(toothNum, bottomSurface)}
              stroke="#64748b"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, bottomSurface);
              }}
            />

            {/* Superficie Izquierda */}
            <polygon
              points="0,100 0,0 25,25 25,75"
              fill={getSurfaceColor(toothNum, leftSurface)}
              stroke="#64748b"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, leftSurface);
              }}
            />

            {/* Centro (Oclusal / Incisal) */}
            <polygon
              points="25,25 75,25 75,75 25,75"
              fill={getSurfaceColor(toothNum, centerSurface)}
              stroke="#64748b"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, centerSurface);
              }}
            />

            {/* Overlay si está ausente (Cruz) */}
            {isMissing && (
              <g stroke="#ef4444" strokeWidth="6" strokeLinecap="round">
                <line x1="10" y1="10" x2="90" y2="90" />
                <line x1="90" y1="10" x2="10" y2="90" />
              </g>
            )}

            {/* Overlay si es implante (Tornillo cian) */}
            {isImplant && (
              <g stroke="#06b6d4" strokeWidth="4" fill="none">
                <line x1="50" y1="10" x2="50" y2="90" strokeWidth="5" />
                <line x1="30" y1="30" x2="70" y2="30" />
                <line x1="35" y1="50" x2="65" y2="50" />
                <line x1="40" y1="70" x2="60" y2="70" />
                <circle cx="50" cy="20" r="14" fill="#06b6d4" opacity="0.3" />
              </g>
            )}

            {/* Overlay si es corona (Círculo dorado) */}
            {isCrown && (
              <circle cx="50" cy="50" r="44" fill="none" stroke="#f59e0b" strokeWidth="5" strokeDasharray="6,3" />
            )}

            {/* Overlay si es endodoncia (Línea central morada) */}
            {isEndo && (
              <line x1="50" y1="5" x2="50" y2="95" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" />
            )}
          </svg>
        </div>

        {/* Indicador de estado */}
        <div className="mt-1 flex gap-1 items-center">
          {tooth?.condition && tooth.condition !== 'sano' && (
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
              style={{ backgroundColor: CONDITIONS.find(c => c.id === tooth.condition)?.color || '#94a3b8' }}
              title={`Estado: ${tooth.condition}`}
            />
          )}
          {hasNote && (
            <button
              onClick={() => {
                setSelectedToothForNote(toothNum);
                setToothNoteInput(tooth?.notes || '');
              }}
              className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold"
              title={tooth.notes}
            >
              📝
            </button>
          )}
        </div>
      </div>
    );
  };

  // Cálculo de resumen clínico rápido
  const stats = {
    cariesCount: Object.values(teethMap).filter(t => t.condition === 'caries' || Object.values(t.surfaces || {}).includes('caries')).length,
    obturadoCount: Object.values(teethMap).filter(t => t.condition === 'obturado' || Object.values(t.surfaces || {}).includes('obturado')).length,
    ausenteCount: Object.values(teethMap).filter(t => t.condition === 'ausente').length,
    coronaCount: Object.values(teethMap).filter(t => t.condition === 'corona').length,
    implanteCount: Object.values(teethMap).filter(t => t.condition === 'implante').length,
    endoCount: Object.values(teethMap).filter(t => t.condition === 'endodoncia').length,
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Encabezado con información del paciente y controles principales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-1 rounded-full font-semibold">
              Odontograma Clínico Interactivo
            </span>
            <span className="text-xs text-slate-500">Notación FDI Internacional</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            {patient.first_name} {patient.last_name}
          </h2>
          <p className="text-sm text-slate-500">
            DNI: <span className="font-medium text-slate-700">{patient.dni}</span> | 
            Tel: <span className="font-medium text-slate-700">{patient.phone}</span> |
            Alergias: <span className="font-semibold text-rose-600">{patient.medical_history || 'Ninguna registrada'}</span>
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector Dentición Adulto / Infantil */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setDentitionType('adult')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                dentitionType === 'adult'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Permanente (32)
            </button>
            <button
              onClick={() => setDentitionType('child')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                dentitionType === 'child'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Temporal / Niños (20)
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Printer size={15} />
            Imprimir
          </button>

          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar Odontograma'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>¡Odontograma y diagnósticos clínicos actualizados exitosamente en la base de datos!</span>
        </div>
      )}

      {/* Paleta de Herramientas Odontológicas */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Sparkles size={14} className="text-sky-600" />
            Paleta de Diagnósticos y Tratamientos:
          </span>
          <span className="text-xs text-slate-500">
            Haga clic en una herramienta y luego sobre la superficie del diente
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {CONDITIONS.map(cond => {
            const isSelected = selectedTool === cond.id;
            return (
              <button
                key={cond.id}
                onClick={() => setSelectedTool(cond.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                  isSelected
                    ? 'ring-2 ring-sky-500 bg-white border-sky-400 shadow-md transform -translate-y-0.5'
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border border-slate-300 shadow-inner mb-1"
                  style={{ backgroundColor: cond.color }}
                />
                <span className="font-semibold leading-tight line-clamp-1">{cond.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resumen Estadístico Rápido de Hallazgos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-red-50 border border-red-100 p-2.5 rounded-xl text-center">
          <span className="text-xs text-red-600 font-semibold block">Caries</span>
          <span className="text-xl font-bold text-red-700">{stats.cariesCount}</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-center">
          <span className="text-xs text-blue-600 font-semibold block">Obturaciones</span>
          <span className="text-xl font-bold text-blue-700">{stats.obturadoCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-center">
          <span className="text-xs text-amber-600 font-semibold block">Coronas</span>
          <span className="text-xl font-bold text-amber-700">{stats.coronaCount}</span>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-xl text-center">
          <span className="text-xs text-purple-600 font-semibold block">Endodoncias</span>
          <span className="text-xl font-bold text-purple-700">{stats.endoCount}</span>
        </div>
        <div className="bg-cyan-50 border border-cyan-100 p-2.5 rounded-xl text-center">
          <span className="text-xs text-cyan-600 font-semibold block">Implantes</span>
          <span className="text-xl font-bold text-cyan-700">{stats.implanteCount}</span>
        </div>
        <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-center">
          <span className="text-xs text-slate-600 font-semibold block">Ausentes</span>
          <span className="text-xl font-bold text-slate-700">{stats.ausenteCount}</span>
        </div>
      </div>

      {/* MAPA GRÁFICO DEL ODONTOGRAMA */}
      <div className="bg-gradient-to-b from-slate-50 to-white p-6 rounded-2xl border border-slate-200 overflow-x-auto">
        {dentitionType === 'adult' ? (
          <div className="space-y-8 min-w-[750px]">
            {/* ARCADA SUPERIOR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded">
                  Cuadrante 1 (Superior Derecho)
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-3 py-1 rounded-full">
                  MAXILAR SUPERIOR
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded">
                  Cuadrante 2 (Superior Izquierdo)
                </span>
              </div>
              <div className="flex items-center justify-center gap-1 md:gap-2 bg-slate-100/60 p-4 rounded-xl border border-slate-200">
                {/* Cuadrante 1 (18 al 11) */}
                <div className="flex gap-1 md:gap-2">
                  {upperRightAdult.map(t => renderTooth(t, true))}
                </div>

                {/* Línea media divisoria */}
                <div className="w-0.5 h-20 bg-sky-400 mx-2 shadow-sm rounded-full" title="Línea Media Dental" />

                {/* Cuadrante 2 (21 al 28) */}
                <div className="flex gap-1 md:gap-2">
                  {upperLeftAdult.map(t => renderTooth(t, true))}
                </div>
              </div>
            </div>

            {/* ARCADA INFERIOR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded">
                  Cuadrante 4 (Inferior Derecho)
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-3 py-1 rounded-full">
                  MANDÍBULA INFERIOR
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded">
                  Cuadrante 3 (Inferior Izquierdo)
                </span>
              </div>
              <div className="flex items-center justify-center gap-1 md:gap-2 bg-slate-100/60 p-4 rounded-xl border border-slate-200">
                {/* Cuadrante 4 (48 al 41) */}
                <div className="flex gap-1 md:gap-2">
                  {lowerRightAdult.map(t => renderTooth(t, false))}
                </div>

                {/* Línea media divisoria */}
                <div className="w-0.5 h-20 bg-sky-400 mx-2 shadow-sm rounded-full" title="Línea Media Dental" />

                {/* Cuadrante 3 (31 al 38) */}
                <div className="flex gap-1 md:gap-2">
                  {lowerLeftAdult.map(t => renderTooth(t, false))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* DENTICIÓN TEMPORAL / INFANTIL */
          <div className="space-y-8 min-w-[500px]">
            {/* Superior Infantil */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Cuadrante 5 (55-51)</span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                  MAXILAR TEMPORAL
                </span>
                <span className="text-xs font-bold text-slate-500">Cuadrante 6 (61-65)</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                <div className="flex gap-2">
                  {upperRightChild.map(t => renderTooth(t, true))}
                </div>
                <div className="w-0.5 h-20 bg-amber-400 mx-2" />
                <div className="flex gap-2">
                  {upperLeftChild.map(t => renderTooth(t, true))}
                </div>
              </div>
            </div>

            {/* Inferior Infantil */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Cuadrante 8 (85-81)</span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                  MANDÍBULA TEMPORAL
                </span>
                <span className="text-xs font-bold text-slate-500">Cuadrante 7 (71-75)</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                <div className="flex gap-2">
                  {lowerRightChild.map(t => renderTooth(t, false))}
                </div>
                <div className="w-0.5 h-20 bg-amber-400 mx-2" />
                <div className="flex gap-2">
                  {lowerLeftChild.map(t => renderTooth(t, false))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diagnóstico General y Plan de Tratamiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText size={15} className="text-sky-600" />
            Diagnóstico Clínico General:
          </label>
          <textarea
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
            rows={3}
            placeholder="Ej: Maloclusión Clase I, apiñamiento moderado anteroinferior, caries oclusal en pieza 14..."
            className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            Plan de Tratamiento Odontológico Propuesto:
          </label>
          <textarea
            value={treatmentPlanText}
            onChange={(e) => setTreatmentPlanText(e.target.value)}
            rows={3}
            placeholder="Ej: 1. Profilaxis y resina pieza 14. 2. Instalación de brackets metálicos MBT. 3. Alineación y nivelación..."
            className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Modal de Notas para una Pieza Dental Específica */}
      {selectedToothForNote && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                Observaciones Clínicas - Pieza {selectedToothForNote}
              </h3>
              <button
                onClick={() => setSelectedToothForNote(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Especifique detalles clínicos, tipo de material, fracturas o prescripción para este diente.
            </p>

            <textarea
              value={toothNoteInput}
              onChange={(e) => setToothNoteInput(e.target.value)}
              rows={4}
              placeholder="Ej: Resina compuesta Filtek Z350 XT en buen estado. Sensibilidad pulpar ausente..."
              className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedToothForNote(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedToothForNote) {
                    const current = teethMap[selectedToothForNote] || {
                      patient_id: patient.id,
                      tooth_number: selectedToothForNote,
                      condition: 'sano',
                      surfaces: {},
                      notes: ''
                    };
                    setTeethMap(prev => ({
                      ...prev,
                      [selectedToothForNote]: {
                        ...current,
                        notes: toothNoteInput
                      }
                    }));
                  }
                  setSelectedToothForNote(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700"
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
