import React, { useState, useEffect } from 'react';
import {
  FileText,
  Activity,
  Eye,
  Pill,
  Plus,
  Save,
  Printer,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Contrast,
  Sun,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  Calendar,
  Sparkles,
  Syringe,
  ClipboardList
} from 'lucide-react';
import { api } from '../services/api';
import {
  Patient,
  Doctor,
  ClinicalHistory,
  ClinicalEvolution,
  RadiologyExam,
  Prescription,
  MedicationItem
} from '../types';

interface ClinicalRecordModuleProps {
  patient: Patient;
  doctors: Doctor[];
  initialSubTab?: 'anamnesis' | 'evolutions' | 'radiology' | 'prescriptions';
  onUpdate?: () => void;
}

// Catálogo Vademécum Odontológico para prescripción en 1 clic
const DENTAL_VADEMECUM: MedicationItem[] = [
  {
    name: 'Amoxicilina',
    concentration: '500 mg',
    form: 'Cápsulas',
    quantity: '21 cápsulas',
    dosage_instructions: 'Tomar 01 cápsula vía oral cada 8 horas por 7 días completos (iniciar después del procedimiento).',
    duration: '7 días'
  },
  {
    name: 'Amoxicilina + Ácido Clavulánico',
    concentration: '875 mg / 125 mg',
    form: 'Comprimidos recubiertos',
    quantity: '14 comprimidos',
    dosage_instructions: 'Tomar 01 comprimido vía oral cada 12 horas junto con los alimentos por 7 días.',
    duration: '7 días'
  },
  {
    name: 'Clindamicina (Elección en Alergia a Penicilina)',
    concentration: '300 mg',
    form: 'Cápsulas',
    quantity: '21 cápsulas',
    dosage_instructions: 'Tomar 01 cápsula vía oral cada 8 horas con abundante agua por 7 días.',
    duration: '7 días'
  },
  {
    name: 'Azitromicina',
    concentration: '500 mg',
    form: 'Tabletas recubiertas',
    quantity: '03 tabletas',
    dosage_instructions: 'Tomar 01 tableta vía oral cada 24 horas (una vez al día) por 3 días.',
    duration: '3 días'
  },
  {
    name: 'Ibuprofeno',
    concentration: '400 mg',
    form: 'Tabletas',
    quantity: '09 tabletas',
    dosage_instructions: 'Tomar 01 tableta vía oral cada 8 horas después de los alimentos por 3 días.',
    duration: '3 días'
  },
  {
    name: 'Dexketoprofeno Trometamol',
    concentration: '25 mg',
    form: 'Comprimidos',
    quantity: '09 comprimidos',
    dosage_instructions: 'Tomar 01 comprimido vía oral cada 8 horas por 3 días para dolor e inflamación.',
    duration: '3 días'
  },
  {
    name: 'Ketorolaco Sublingual',
    concentration: '10 mg',
    form: 'Tabletas sublinguales',
    quantity: '04 tabletas',
    dosage_instructions: 'Colocar 01 tableta debajo de la lengua cada 8 o 12 horas solo en caso de dolor intenso.',
    duration: '2 días'
  },
  {
    name: 'Paracetamol',
    concentration: '500 mg',
    form: 'Tabletas',
    quantity: '09 tabletas',
    dosage_instructions: 'Tomar 01 tableta vía oral cada 8 horas en caso de dolor o molestia post-atención.',
    duration: '3 días'
  },
  {
    name: 'Etoricoxib',
    concentration: '90 mg',
    form: 'Comprimidos recubiertos',
    quantity: '03 comprimidos',
    dosage_instructions: 'Tomar 01 comprimido vía oral cada 24 horas por 3 días.',
    duration: '3 días'
  },
  {
    name: 'Colutorio Digluconato de Clorhexidina',
    concentration: '0.12%',
    form: 'Frasco Enjuague 250 ml',
    quantity: '01 frasco',
    dosage_instructions: 'Realizar enjuagues suaves con 15 ml sin diluir durante 30 segundos cada 12 horas por 7 días.',
    duration: '7 días'
  }
];

const CIE10_DENTAL_CODES = [
  'K02.0 Caries limitada al esmalte (Mancha blanca)',
  'K02.1 Caries de la dentina',
  'K04.0 Pulpitis (Reversible / Irreversible)',
  'K04.1 Necrosis de la pulpa',
  'K04.4 Periodontitis apical aguda de origen pulpar',
  'K05.0 Gingivitis aguda asociada a placa',
  'K05.3 Periodontitis crónica',
  'K01.1 Dientes impactados / Terceros molares retenidos',
  'K07.2 Anomalías de la relación entre los arcos dentarios',
  'K07.3 Anomalías de la posición del diente (Apiñamiento)',
  'K08.1 Pérdida de dientes debida a extracción o caries'
];

export const ClinicalRecordModule: React.FC<ClinicalRecordModuleProps> = ({
  patient,
  doctors,
  initialSubTab = 'anamnesis',
  onUpdate
}) => {
  const [subTab, setSubTab] = useState<'anamnesis' | 'evolutions' | 'radiology' | 'prescriptions'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [savingHistory, setSavingHistory] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Datos cargados del servidor
  const [evolutions, setEvolutions] = useState<ClinicalEvolution[]>([]);
  const [radiologyExams, setRadiologyExams] = useState<RadiologyExam[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // 1. Estado de Historia Clínica (Anamnesis)
  const [historyForm, setHistoryForm] = useState<ClinicalHistory>({
    patient_id: patient.id,
    doctor_id: doctors[0]?.id || 1,
    blood_type: 'O+',
    allergies: patient.medical_history || '',
    systemic_diseases: 'Ninguna reportada',
    current_medications: 'Ninguna',
    habits: 'Cepillado 3 veces al día',
    blood_pressure: '120/80 mmHg',
    heart_rate: '72 lpm',
    temperature: '36.5 °C',
    extraoral_exam: 'Simetría facial conservada, ATM sin chasquidos ni dolor a la palpación, apertura bucal normal.',
    intraoral_exam: 'Mucosas húmedas y normocoloreadas, encías saludables, tejidos periodontales estables.',
    occlusion_class: 'Clase I de Angle',
    oral_hygiene_index: 'Buena (IHO-S Bajo)',
    presumptive_diagnosis: '',
    definitive_diagnosis: 'K02.1 Caries de la dentina',
    prognosis: 'Favorable',
    informed_consent_signed: 1
  });

  // 2. Modal y formulario de Nueva Evolución Clínica
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolutionForm, setEvolutionForm] = useState({
    doctor_id: doctors[0]?.id || 1,
    evolution_date: new Date().toISOString().split('T')[0],
    tooth_number: 'Pieza 16',
    procedure_performed: 'Restauración Estética con Resina Compuesta',
    anesthesia_used: 'Lidocaína 2% con epinefrina 1:80,000 (1 cartucho infiltrativa)',
    materials_used: 'Ácido fosfórico 37%, Adhesivo Universal, Resina 3M Filtek Z350 XT',
    clinical_notes: '',
    post_op_indications: 'No ingerir alimentos duros por 2 horas. Mantener higiene habitual.',
    next_step: 'Control oclusal y pulido en próxima sesión.',
    treatment_status: 'Completado',
    cost: 90
  });

  // 3. Visor Radiográfico y Modal de Subida de Rayos X
  const [selectedXray, setSelectedXray] = useState<RadiologyExam | null>(null);
  const [xrayZoom, setXrayZoom] = useState<number>(100);
  const [xrayInvert, setXrayInvert] = useState<boolean>(false);
  const [xrayContrast, setXrayContrast] = useState<number>(100);
  const [xrayBrightness, setXrayBrightness] = useState<number>(100);
  const [xrayRotation, setXrayRotation] = useState<number>(0);

  const [showRadiologyModal, setShowRadiologyModal] = useState(false);
  const [radiologyForm, setRadiologyForm] = useState({
    doctor_id: doctors[0]?.id || 1,
    exam_date: new Date().toISOString().split('T')[0],
    exam_type: 'Radiografía Panorámica (Ortopantomografía)',
    tooth_area: 'Maxilar Superior e Inferior',
    title: '',
    image_url: '',
    radiological_findings: '',
    radiation_dose: 'Baja (Digital RVG)'
  });

  // 4. Recetario Odontológico (Rx) y Vista de Impresión
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [printingPrescription, setPrintingPrescription] = useState<Prescription | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    doctor_id: doctors[0]?.id || 1,
    prescription_date: new Date().toISOString().split('T')[0],
    diagnosis: 'K04.0 Terapia Dental / Control Post-Operatorio',
    medications: [] as MedicationItem[],
    general_recommendations: 'Tomar los medicamentos puntualmente. Dieta blanda y evitar alimentos irritantes o calientes por 48 horas.',
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });

  // Campos temporales para agregar un medicamento manual a la receta
  const [customMed, setCustomMed] = useState<MedicationItem>({
    name: '',
    concentration: '',
    form: 'Tabletas',
    quantity: '',
    dosage_instructions: '',
    duration: '5 días'
  });

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    loadClinicalRecord();
  }, [patient.id]);

  const loadClinicalRecord = async () => {
    setLoading(true);
    try {
      const data = await api.getClinicalRecord(patient.id);
      if (data.history) {
        setHistoryForm(data.history);
      } else {
        setHistoryForm({
          patient_id: patient.id,
          doctor_id: doctors[0]?.id || 1,
          blood_type: 'O+',
          allergies: patient.medical_history || 'Ninguna conocida',
          systemic_diseases: 'Ninguna reportada',
          current_medications: 'Ninguna',
          habits: 'Higiene oral regular',
          blood_pressure: '120/80 mmHg',
          heart_rate: '72 lpm',
          temperature: '36.5 °C',
          extraoral_exam: 'Simetría facial conservada, ATM sin alteraciones.',
          intraoral_exam: 'Mucosas saludables e hidratadas.',
          occlusion_class: 'Clase I de Angle',
          oral_hygiene_index: 'Buena',
          presumptive_diagnosis: '',
          definitive_diagnosis: 'K02.1 Caries de la dentina',
          prognosis: 'Favorable',
          informed_consent_signed: 1
        });
      }
      setEvolutions(data.evolutions || []);
      setRadiologyExams(data.radiologyExams || []);
      if (data.radiologyExams && data.radiologyExams.length > 0) {
        setSelectedXray(data.radiologyExams[0]);
      } else {
        setSelectedXray(null);
      }
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error('Error cargando expediente clínico:', err);
    } finally {
      setLoading(false);
    }
  };

  // Guardar Historia Clínica (Anamnesis)
  const handleSaveHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHistory(true);
    try {
      await api.saveClinicalHistory(patient.id, historyForm);
      setSaveMessage('¡Historia clínica estomatológica guardada correctamente!');
      setTimeout(() => setSaveMessage(''), 3500);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error guardando la historia clínica');
    } finally {
      setSavingHistory(false);
    }
  };

  // Guardar Nueva Evolución
  const handleCreateEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEvolution(patient.id, evolutionForm);
      setShowEvolutionModal(false);
      setEvolutionForm({
        ...evolutionForm,
        clinical_notes: ''
      });
      await loadClinicalRecord();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error registrando evolución clínica');
    }
  };

  const handleDeleteEvolution = async (id: number) => {
    if (!confirm('¿Eliminar este registro de evolución clínica?')) return;
    try {
      await api.deleteEvolution(id);
      await loadClinicalRecord();
    } catch (err) {
      console.error(err);
    }
  };

  // Subida de archivo de Rayos X (convierte imagen local a Base64 DataURL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRadiologyForm(prev => ({
          ...prev,
          image_url: reader.result as string,
          title: prev.title || file.name.replace(/\.[^/.]+$/, '')
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateRadiology = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!radiologyForm.image_url) {
      alert('Por favor suba una imagen radiográfica o elija una plantilla digital.');
      return;
    }
    try {
      await api.createRadiologyExam(patient.id, radiologyForm);
      setShowRadiologyModal(false);
      setRadiologyForm({
        doctor_id: doctors[0]?.id || 1,
        exam_date: new Date().toISOString().split('T')[0],
        exam_type: 'Radiografía Periapical Digital (RVG)',
        tooth_area: 'Pieza 36',
        title: '',
        image_url: '',
        radiological_findings: '',
        radiation_dose: 'Baja (Digital RVG)'
      });
      await loadClinicalRecord();
    } catch (err) {
      console.error(err);
      alert('Error subiendo el examen de radiodiagnóstico');
    }
  };

  const handleDeleteRadiology = async (id: number) => {
    if (!confirm('¿Eliminar este examen radiológico?')) return;
    try {
      await api.deleteRadiologyExam(id);
      await loadClinicalRecord();
    } catch (err) {
      console.error(err);
    }
  };

  // Recetario Odontológico
  const addMedicationFromVademecum = (med: MedicationItem) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medications: [...prev.medications, { ...med }]
    }));
  };

  const addCustomMedication = () => {
    if (!customMed.name || !customMed.dosage_instructions) {
      alert('Ingrese al menos el nombre del medicamento y sus indicaciones.');
      return;
    }
    setPrescriptionForm(prev => ({
      ...prev,
      medications: [...prev.medications, { ...customMed }]
    }));
    setCustomMed({
      name: '',
      concentration: '',
      form: 'Tabletas',
      quantity: '',
      dosage_instructions: '',
      duration: '5 días'
    });
  };

  const removeMedicationItem = (idx: number) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== idx)
    }));
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prescriptionForm.medications.length === 0) {
      alert('Agregue al menos un medicamento a la receta médica.');
      return;
    }
    try {
      await api.createPrescription(patient.id, prescriptionForm);
      setShowPrescriptionModal(false);
      setPrescriptionForm({
        ...prescriptionForm,
        medications: []
      });
      await loadClinicalRecord();
    } catch (err) {
      console.error(err);
      alert('Error guardando la receta odontológica');
    }
  };

  const handleDeletePrescription = async (id: number) => {
    if (!confirm('¿Eliminar esta receta médica?')) return;
    try {
      await api.deletePrescription(id);
      await loadClinicalRecord();
    } catch (err) {
      console.error(err);
    }
  };

  const resetXrayFilters = () => {
    setXrayZoom(100);
    setXrayInvert(false);
    setXrayContrast(100);
    setXrayBrightness(100);
    setXrayRotation(0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* CABECERA DEL EXPEDIENTE CLÍNICO INTEGRAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <img
            src={patient.photo_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'}
            alt={patient.first_name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-500 shadow-sm shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Stethoscope size={13} />
                Expediente Clínico Estomatológico Integral
              </span>
              <span className="text-xs font-semibold text-slate-500">
                HC N° {String(patient.id).padStart(5, '0')}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mt-1">
              {patient.first_name} {patient.last_name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              DNI: <strong className="text-slate-700">{patient.dni}</strong> | Tel: <strong className="text-slate-700">{patient.phone}</strong> | Grupo Sanguíneo: <strong className="text-rose-600">{historyForm.blood_type}</strong>
            </p>
          </div>
        </div>

        {/* Alerta Médica Visible en todo momento para seguridad del Doctor */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 max-w-md flex items-start gap-2.5">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-extrabold text-rose-900 uppercase block">Alerta de Alergias / Antecedentes:</span>
            <span className="text-rose-800 font-medium">
              {historyForm.allergies || patient.medical_history || 'Sin alergias medicamentosas registradas.'}
            </span>
          </div>
        </div>
      </div>

      {/* SUB-NAVEGACIÓN DE LOS 4 MÓDULOS CLÍNICOS DEL DOCTOR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setSubTab('anamnesis')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            subTab === 'anamnesis'
              ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList size={16} />
          1. Historia Clínica y Anamnesis
        </button>

        <button
          onClick={() => setSubTab('evolutions')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            subTab === 'evolutions'
              ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity size={16} />
          2. Evolución Clínica ({evolutions.length})
        </button>

        <button
          onClick={() => setSubTab('radiology')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            subTab === 'radiology'
              ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye size={16} />
          3. Rayos X y Radiodiagnóstico ({radiologyExams.length})
        </button>

        <button
          onClick={() => setSubTab('prescriptions')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            subTab === 'prescriptions'
              ? 'bg-white text-purple-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill size={16} />
          4. Recetario Odontológico Rx ({prescriptions.length})
        </button>
      </div>

      {saveMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
          <CheckCircle2 size={16} className="text-emerald-600" />
          {saveMessage}
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 1: HISTORIA CLÍNICA ESTOMATOLÓGICA Y ANAMNESIS
         ===================================================================== */}
      {subTab === 'anamnesis' && (
        <form onSubmit={handleSaveHistory} className="space-y-6">
          {/* Fila de Signos Vitales / Triaje */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <HeartPulse size={15} className="text-rose-600" />
              Triaje Odontológico y Funciones Vitales
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Grupo Sanguíneo:</label>
                <select
                  value={historyForm.blood_type}
                  onChange={(e) => setHistoryForm({ ...historyForm, blood_type: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="O+">O Positivo (O+)</option>
                  <option value="O-">O Negativo (O-)</option>
                  <option value="A+">A Positivo (A+)</option>
                  <option value="A-">A Negativo (A-)</option>
                  <option value="B+">B Positivo (B+)</option>
                  <option value="AB+">AB Positivo (AB+)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Presión Arterial (PA):</label>
                <input
                  type="text"
                  value={historyForm.blood_pressure}
                  onChange={(e) => setHistoryForm({ ...historyForm, blood_pressure: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  placeholder="120/80 mmHg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Frec. Cardíaca (FC):</label>
                <input
                  type="text"
                  value={historyForm.heart_rate}
                  onChange={(e) => setHistoryForm({ ...historyForm, heart_rate: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  placeholder="72 lpm"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Temperatura:</label>
                <input
                  type="text"
                  value={historyForm.temperature}
                  onChange={(e) => setHistoryForm({ ...historyForm, temperature: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  placeholder="36.5 °C"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Índice Higiene Oral:</label>
                <select
                  value={historyForm.oral_hygiene_index}
                  onChange={(e) => setHistoryForm({ ...historyForm, oral_hygiene_index: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Excelente (IHO-S: 0.0 - 0.6)">Excelente (IHO-S Bajo)</option>
                  <option value="Buena (IHO-S: 0.7 - 1.2)">Buena</option>
                  <option value="Regular (IHO-S: 1.3 - 1.8)">Regular</option>
                  <option value="Deficiente (Alto Riesgo)">Deficiente (Riesgo Periodontal)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anamnesis y Antecedentes Patológicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-rose-700 block mb-1">
                ⚠️ Alergias a Medicamentos / Anestésicos Locales / Látex:
              </label>
              <textarea
                rows={2}
                value={historyForm.allergies}
                onChange={(e) => setHistoryForm({ ...historyForm, allergies: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500"
                placeholder="Ej: Alergia a Penicilinas, AINEs, Lidocaína..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Enfermedades Sistémicas (Diabetes, HTA, Cardiopatías, Coagulación):
              </label>
              <textarea
                rows={2}
                value={historyForm.systemic_diseases}
                onChange={(e) => setHistoryForm({ ...historyForm, systemic_diseases: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
                placeholder="Antecedentes médicos de relevancia..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Medicación Actual del Paciente:
              </label>
              <input
                type="text"
                value={historyForm.current_medications}
                onChange={(e) => setHistoryForm({ ...historyForm, current_medications: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                placeholder="Ej: Losartán 50mg, Metformina 850mg, Anticoagulantes..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Hábitos Bucales y Parafunciones (Bruxismo, Respiración Bucal, Tabaco):
              </label>
              <input
                type="text"
                value={historyForm.habits}
                onChange={(e) => setHistoryForm({ ...historyForm, habits: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* Examen Clínico Extraoral e Intraoral */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Examen Clínico Extraoral (ATM, Músculos Masticadores, Ganglios):
              </label>
              <textarea
                rows={3}
                value={historyForm.extraoral_exam}
                onChange={(e) => setHistoryForm({ ...historyForm, extraoral_exam: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Examen Clínico Intraoral (Tejidos Blandos, Encías, Paladar, Lengua):
              </label>
              <textarea
                rows={3}
                value={historyForm.intraoral_exam}
                onChange={(e) => setHistoryForm({ ...historyForm, intraoral_exam: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Diagnósticos CIE-10 y Consentimiento Informado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Clasificación de Oclusión:</label>
              <select
                value={historyForm.occlusion_class}
                onChange={(e) => setHistoryForm({ ...historyForm, occlusion_class: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="Clase I de Angle">Clase I de Angle (Normoclusión molar)</option>
                <option value="Clase II División 1 de Angle">Clase II División 1 (Overjet aumentado)</option>
                <option value="Clase II División 2 de Angle">Clase II División 2 (Mordida profunda)</option>
                <option value="Clase III de Angle">Clase III de Angle (Mesioclusión / Protrusión)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Diagnóstico Estomatológico Definitivo (CIE-10):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={historyForm.definitive_diagnosis}
                  onChange={(e) => setHistoryForm({ ...historyForm, definitive_diagnosis: e.target.value })}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300"
                  placeholder="Escriba o seleccione un código CIE-10..."
                />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setHistoryForm({
                        ...historyForm,
                        definitive_diagnosis: historyForm.definitive_diagnosis
                          ? `${historyForm.definitive_diagnosis} / ${e.target.value}`
                          : e.target.value
                      });
                    }
                  }}
                  className="text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 max-w-[200px]"
                >
                  <option value="">+ Catálogo CIE-10</option>
                  {CIE10_DENTAL_CODES.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200">
            <label className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(historyForm.informed_consent_signed)}
                onChange={(e) => setHistoryForm({ ...historyForm, informed_consent_signed: e.target.checked ? 1 : 0 })}
                className="rounded text-emerald-600"
              />
              <ShieldCheck size={16} className="text-emerald-600" />
              Consentimiento Informado Odontoestomatológico Firmado por el Paciente
            </label>

            <button
              type="submit"
              disabled={savingHistory}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Save size={16} />
              {savingHistory ? 'Guardando...' : 'Guardar Historia Clínica'}
            </button>
          </div>
        </form>
      )}

      {/* =====================================================================
          PESTAÑA 2: EVOLUCIÓN CLÍNICA Y ACTOS OPERATORIOS POR SESIÓN
         ===================================================================== */}
      {subTab === 'evolutions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Activity size={17} className="text-emerald-600" />
                Bitácora de Evolución Clínica y Procedimientos Realizados
              </h3>
              <p className="text-xs text-emerald-800">
                Registre cada sesión operatoria, pieza intervenida, anestesia, materiales e indicaciones post-atención.
              </p>
            </div>
            <button
              onClick={() => setShowEvolutionModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
            >
              <Plus size={15} />
              Subir Nueva Evolución
            </button>
          </div>

          {evolutions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
              No hay evoluciones registradas aún. Haga clic en "+ Subir Nueva Evolución" para documentar la consulta.
            </div>
          ) : (
            <div className="space-y-4">
              {evolutions.map((ev, index) => (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-md">
                        Sesión #{evolutions.length - index}
                      </span>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        {ev.evolution_date}
                      </span>
                      <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                        🦷 {ev.tooth_number}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 font-semibold">
                        Atendido por: <strong className="text-slate-800">{ev.doctor_name}</strong>
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {ev.treatment_status}
                      </span>
                      <button
                        onClick={() => handleDeleteEvolution(ev.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Eliminar registro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">{ev.procedure_performed}</h4>
                    <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {ev.clinical_notes}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-1">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">💉 Anestesia Utilizada:</span>
                      <span className="font-semibold text-slate-700">{ev.anesthesia_used || 'No requerida'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">🧪 Biomateriales / Insumos:</span>
                      <span className="font-semibold text-slate-700">{ev.materials_used || 'Estándar'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">📋 Próximo Paso / Control:</span>
                      <span className="font-semibold text-emerald-700">{ev.next_step || 'Control periódico'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 3: RAYOS X, RADIODIAGNÓSTICO Y VISOR INTERACTIVO
         ===================================================================== */}
      {subTab === 'radiology' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/70 p-4 rounded-xl border border-indigo-200">
            <div>
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <Eye size={17} className="text-indigo-600" />
                Centro de Radiodiagnóstico Digital, Rayos X y Tomografía CBCT
              </h3>
              <p className="text-xs text-indigo-800">
                Suba radiografías periapicales, panorámicas o tomografías y analícelas con filtros de inversión negativa y contraste.
              </p>
            </div>
            <button
              onClick={() => setShowRadiologyModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
            >
              <Upload size={15} />
              Subir Examen de Rayos X
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista lateral de estudios radiográficos del paciente */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Estudios del Paciente ({radiologyExams.length})
              </h4>
              {radiologyExams.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                  Sin imágenes radiográficas registradas.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                  {radiologyExams.map(exam => {
                    const isSelected = selectedXray?.id === exam.id;
                    return (
                      <div
                        key={exam.id}
                        onClick={() => {
                          setSelectedXray(exam);
                          resetXrayFilters();
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={exam.image_url}
                          alt={exam.title}
                          className="w-16 h-14 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase text-indigo-600 block">
                            {exam.exam_type}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800 truncate">{exam.title}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            📅 {exam.exam_date} • 🦷 {exam.tooth_area}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRadiology(exam.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visor Radiográfico Digital Interactivo (Negatoscopio Digital) */}
            <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-4 text-white space-y-4 shadow-xl">
              {selectedXray ? (
                <>
                  {/* Barra de controles del visor de Rayos X */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold block">
                        VISOR RADIOLÓGICO RVG / DICOM — {selectedXray.exam_type}
                      </span>
                      <h4 className="text-sm font-bold text-white">{selectedXray.title}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setXrayZoom(z => Math.max(50, z - 25))}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                        title="Reducir Zoom"
                      >
                        <ZoomOut size={15} />
                      </button>
                      <span className="text-xs font-mono px-1.5">{xrayZoom}%</span>
                      <button
                        onClick={() => setXrayZoom(z => Math.min(250, z + 25))}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                        title="Aumentar Zoom"
                      >
                        <ZoomIn size={15} />
                      </button>

                      {/* Botón de Filtro Negativo Radiográfico */}
                      <button
                        onClick={() => setXrayInvert(!xrayInvert)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          xrayInvert ? 'bg-sky-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title="Invertir polaridad (Modo Negativo para análisis de hueso y ápices)"
                      >
                        <Contrast size={14} />
                        {xrayInvert ? 'Negativo ON' : 'Invertir Rx'}
                      </button>

                      <button
                        onClick={() => setXrayRotation(r => (r + 90) % 360)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                        title="Rotar 90°"
                      >
                        <RotateCw size={15} />
                      </button>

                      <button
                        onClick={resetXrayFilters}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-400 hover:text-white"
                        title="Restablecer filtros"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Controles deslizantes de Brillo y Contraste */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <Sun size={14} className="text-amber-400 shrink-0" />
                      <span className="text-slate-400 text-[11px] w-16">Brillo:</span>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={xrayBrightness}
                        onChange={(e) => setXrayBrightness(Number(e.target.value))}
                        className="w-full accent-sky-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Contrast size={14} className="text-sky-400 shrink-0" />
                      <span className="text-slate-400 text-[11px] w-16">Contraste:</span>
                      <input
                        type="range"
                        min="50"
                        max="220"
                        value={xrayContrast}
                        onChange={(e) => setXrayContrast(Number(e.target.value))}
                        className="w-full accent-sky-400"
                      />
                    </div>
                  </div>

                  {/* Lienzo del Negatoscopio Digital */}
                  <div className="bg-black rounded-xl border border-slate-800 h-80 flex items-center justify-center overflow-auto p-2 relative">
                    <img
                      src={selectedXray.image_url}
                      alt={selectedXray.title}
                      style={{
                        transform: `scale(${xrayZoom / 100}) rotate(${xrayRotation}deg)`,
                        filter: `${xrayInvert ? 'invert(100%)' : ''} contrast(${xrayContrast}%) brightness(${xrayBrightness}%)`,
                        transition: 'transform 0.2s ease, filter 0.15s ease'
                      }}
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  </div>

                  {/* Informe / Hallazgos Radiológicos */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>🦷 Región: <strong className="text-slate-200">{selectedXray.tooth_area}</strong></span>
                      <span>⚡ Dosis: <strong className="text-emerald-400">{selectedXray.radiation_dose}</strong></span>
                      <span>👨‍⚕️ Dr: <strong className="text-slate-200">{selectedXray.doctor_name}</strong></span>
                    </div>
                    <p className="text-xs text-slate-200 pt-1 leading-relaxed">
                      <strong className="text-sky-400">Informe Radiológico: </strong>
                      {selectedXray.radiological_findings || 'Sin hallazgos patológicos adicionales reportados.'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Eye size={36} className="mb-2 opacity-40" />
                  Seleccione o suba un estudio de Rayos X para inspeccionarlo en el negatoscopio digital.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 4: RECETARIO ODONTOLÓGICO Y PRESCRIPCIONES (RX)
         ===================================================================== */}
      {subTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/70 p-4 rounded-xl border border-purple-200">
            <div>
              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                <Pill size={17} className="text-purple-600" />
                Recetario Odontológico y Prescripción Farmacológica (Rx)
              </h3>
              <p className="text-xs text-purple-800">
                Emita recetas con el Vademécum Odontológico integrado e imprima el formato oficial membretado.
              </p>
            </div>
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
            >
              <Plus size={15} />
              Emitir Nueva Receta (Rx)
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
              No hay recetas emitidas para este paciente. Haga clic en "+ Emitir Nueva Receta (Rx)".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          Receta N° RX-{String(rx.id).padStart(4, '0')}
                        </span>
                        <span className="text-xs font-bold text-slate-600 ml-2">{rx.prescription_date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPrintingPrescription(rx)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                        >
                          <Printer size={13} />
                          Ver / Imprimir Receta
                        </button>
                        <button
                          onClick={() => handleDeletePrescription(rx.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-slate-400 font-semibold">Diagnóstico: </span>
                      <strong className="text-slate-800">{rx.diagnosis}</strong>
                      <span className="block text-[11px] text-teal-700 font-semibold mt-0.5">
                        Prescrito por: {rx.doctor_name} ({rx.doctor_license || 'COP'})
                      </span>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-[10px] font-extrabold uppercase text-purple-800 block">
                        Rp. Medicamentos Prescritos ({rx.medications.length}):
                      </span>
                      {rx.medications.map((m, i) => (
                        <div key={i} className="text-xs border-b last:border-b-0 border-slate-200/60 pb-1.5 last:pb-0">
                          <div className="font-bold text-slate-800">
                            {i + 1}. {m.name} {m.concentration} — <span className="text-purple-700">{m.quantity} ({m.form})</span>
                          </div>
                          <div className="text-[11px] text-slate-600 pl-3">
                            ↳ <em>{m.dosage_instructions}</em>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.general_recommendations && (
                    <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/70">
                      <strong className="text-amber-900">Indicaciones:</strong> {rx.general_recommendations}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL 1: SUBIR NUEVA EVOLUCIÓN CLÍNICA
         ===================================================================== */}
      {showEvolutionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Registrar Evolución Clínica / Acto Operatorio
                </h3>
                <p className="text-xs text-slate-500">Paciente: {patient.first_name} {patient.last_name}</p>
              </div>
              <button onClick={() => setShowEvolutionModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateEvolution} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha de Atención:</label>
                  <input
                    type="date"
                    required
                    value={evolutionForm.evolution_date}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, evolution_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Odontólogo Tratante:</label>
                  <select
                    value={evolutionForm.doctor_id}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, doctor_id: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Pieza Dental / Zona:</label>
                  <input
                    type="text"
                    required
                    value={evolutionForm.tooth_number}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, tooth_number: e.target.value })}
                    placeholder="Ej: Pieza 36, Arcada Sup..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Procedimiento Realizado:*</label>
                <input
                  type="text"
                  required
                  value={evolutionForm.procedure_performed}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, procedure_performed: e.target.value })}
                  placeholder="Ej: Restauración Clase II con Resina / Endodoncia / Exodoncia..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Anestesia Aplicada:</label>
                  <input
                    type="text"
                    value={evolutionForm.anesthesia_used}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, anesthesia_used: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Biomateriales / Insumos:</label>
                  <input
                    type="text"
                    value={evolutionForm.materials_used}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, materials_used: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descripción Detallada de la Evolución y Acto Operatorio:*
                </label>
                <textarea
                  rows={3}
                  required
                  value={evolutionForm.clinical_notes}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, clinical_notes: e.target.value })}
                  placeholder="Describa el protocolo clínico realizado, hallazgos operatorios y respuesta del paciente..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Indicaciones Post-Operatorias:</label>
                  <input
                    type="text"
                    value={evolutionForm.post_op_indications}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, post_op_indications: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Próximo Control / Plan:</label>
                  <input
                    type="text"
                    value={evolutionForm.next_step}
                    onChange={(e) => setEvolutionForm({ ...evolutionForm, next_step: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEvolutionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Guardar Evolución Clínica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SUBIR EXAMEN DE RAYOS X / RADIODIAGNÓSTICO
         ===================================================================== */}
      {showRadiologyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Subir Examen de Rayos X o Radiodiagnóstico
                </h3>
                <p className="text-xs text-slate-500">Admite radiografías digitales desde su equipo (JPG, PNG, SVG)</p>
              </div>
              <button onClick={() => setShowRadiologyModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateRadiology} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Estudio:*</label>
                  <select
                    value={radiologyForm.exam_type}
                    onChange={(e) => setRadiologyForm({ ...radiologyForm, exam_type: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    <option value="Radiografía Panorámica (Ortopantomografía)">Radiografía Panorámica (Ortopantomografía)</option>
                    <option value="Radiografía Periapical Digital (RVG)">Radiografía Periapical Digital (RVG)</option>
                    <option value="Radiografía Bitewing / Aleta de Mordida">Radiografía Bitewing / Aleta de Mordida</option>
                    <option value="Telerradiografía Lateral (Cefalometría)">Telerradiografía Lateral (Cefalometría)</option>
                    <option value="Tomografía Cone Beam 3D (CBCT)">Tomografía Cone Beam 3D (CBCT)</option>
                    <option value="Fotografía Clínica Intraoral">Fotografía Clínica Intraoral</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha del Estudio:</label>
                  <input
                    type="date"
                    required
                    value={radiologyForm.exam_date}
                    onChange={(e) => setRadiologyForm({ ...radiologyForm, exam_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Título del Estudio:*</label>
                  <input
                    type="text"
                    required
                    value={radiologyForm.title}
                    onChange={(e) => setRadiologyForm({ ...radiologyForm, title: e.target.value })}
                    placeholder="Ej: Rx Periapical Control Endodoncia Pza 36"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Pieza o Región Anatómica:</label>
                  <input
                    type="text"
                    value={radiologyForm.tooth_area}
                    onChange={(e) => setRadiologyForm({ ...radiologyForm, tooth_area: e.target.value })}
                    placeholder="Ej: Pieza 36 / Maxilar Completo"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Subir Archivo de Imagen o Seleccionar Radiografía Digital de Prueba */}
              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-indigo-300 space-y-3">
                <label className="block text-xs font-bold text-indigo-900">
                  Seleccionar Archivo de Imagen Radiográfica desde su Computadora:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />

                {radiologyExams.length > 0 && !radiologyForm.image_url && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setRadiologyForm({
                        ...radiologyForm,
                        image_url: radiologyExams[0].image_url,
                        title: radiologyForm.title || 'Control Radiográfico Digital RVG'
                      })}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      ✨ O usar plantilla de sensor radiográfico digital RVG de demostración
                    </button>
                  </div>
                )}

                {radiologyForm.image_url && (
                  <div className="flex items-center gap-3 pt-2">
                    <img src={radiologyForm.image_url} alt="Previsualización" className="w-20 h-16 object-cover rounded-lg bg-black border" />
                    <span className="text-xs font-bold text-emerald-700">✓ Imagen radiográfica cargada y lista</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Informe / Hallazgos Radiológicos:
                </label>
                <textarea
                  rows={3}
                  value={radiologyForm.radiological_findings}
                  onChange={(e) => setRadiologyForm({ ...radiologyForm, radiological_findings: e.target.value })}
                  placeholder="Describa el estado periapical, soporte óseo alveolar, conductos radiculares o estructuras anatómicas..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRadiologyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Guardar Estudio Radiológico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: EMITIR NUEVA RECETA ODONTOLÓGICA (RX) CON VADEMÉCUM
         ===================================================================== */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Pill size={20} className="text-purple-600" />
                  Emitir Receta Médica Odontológica (Rx)
                </h3>
                <p className="text-xs text-slate-500">
                  Paciente: <strong>{patient.first_name} {patient.last_name}</strong> | Alergias: <strong className="text-rose-600">{historyForm.allergies || 'Ninguna'}</strong>
                </p>
              </div>
              <button onClick={() => setShowPrescriptionModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Odontólogo Prescriptor:</label>
                  <select
                    value={prescriptionForm.doctor_id}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctor_id: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.license_number})</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Diagnóstico Clínico:*</label>
                  <input
                    type="text"
                    required
                    value={prescriptionForm.diagnosis}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Vademécum Odontológico de 1 clic */}
              <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 space-y-2">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600" />
                  Vademécum Odontológico Rápido (Haga clic para añadir a la receta):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DENTAL_VADEMECUM.map((med, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addMedicationFromVademecum(med)}
                      className="text-[11px] bg-white hover:bg-purple-600 hover:text-white text-purple-900 font-semibold px-2.5 py-1 rounded-lg border border-purple-200 transition-colors shadow-2xs"
                    >
                      + {med.name} {med.concentration}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agregar medicamento manual */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">O agregar otro medicamento personalizado:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Medicamento (ej. Naproxeno)"
                    value={customMed.name}
                    onChange={(e) => setCustomMed({ ...customMed, name: e.target.value })}
                    className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Concentración (ej. 550 mg)"
                    value={customMed.concentration}
                    onChange={(e) => setCustomMed({ ...customMed, concentration: e.target.value })}
                    className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Cantidad (ej. 10 tabletas)"
                    value={customMed.quantity}
                    onChange={(e) => setCustomMed({ ...customMed, quantity: e.target.value })}
                    className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={addCustomMedication}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg px-3 py-2"
                  >
                    + Añadir Fármaco
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Posología / Indicaciones (ej. Tomar 1 tableta cada 12 horas por 5 días)"
                  value={customMed.dosage_instructions}
                  onChange={(e) => setCustomMed({ ...customMed, dosage_instructions: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              {/* Lista de medicamentos en la receta actual */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Medicamentos en esta Receta ({prescriptionForm.medications.length}):
                </label>
                {prescriptionForm.medications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Seleccione fármacos del vademécum superior.</p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {prescriptionForm.medications.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                        <div>
                          <strong className="text-slate-800">{idx + 1}. {m.name} {m.concentration}</strong> — <span className="text-purple-700 font-semibold">{m.quantity}</span>
                          <p className="text-[11px] text-slate-600">{m.dosage_instructions}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedicationItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Recomendaciones Generales y Cuidados:</label>
                <textarea
                  rows={2}
                  value={prescriptionForm.general_recommendations}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, general_recommendations: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Emitir y Guardar Receta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: FORMATO OFICIAL DE RECETA MÉDICA ODONTOLÓGICA IMPRIMIBLE
         ===================================================================== */}
      {printingPrescription && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 border-t-8 border-sky-600">
            {/* Cabecera Membretada de la Clínica */}
            <div className="flex items-start justify-between border-b-2 border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  CLÍNICA ODONTOLÓGICA DENTALGRAVITY PRO
                </h2>
                <p className="text-xs font-bold text-sky-700">
                  {printingPrescription.doctor_name} — {printingPrescription.doctor_specialty}
                </p>
                <p className="text-xs text-slate-500">
                  Colegiatura Oficial: <strong>{printingPrescription.doctor_license || 'COP-34821'}</strong> | Tel: {printingPrescription.doctor_phone || '+51 987 654 321'}
                </p>
              </div>
              <div className="text-right">
                <span className="bg-slate-900 text-white text-xs font-extrabold px-3 py-1 rounded-md block">
                  RECETA N° RX-{String(printingPrescription.id).padStart(4, '0')}
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Fecha: <strong>{printingPrescription.prescription_date}</strong>
                </span>
              </div>
            </div>

            {/* Datos del Paciente */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Paciente: </span>
                <strong className="text-slate-800">{patient.first_name} {patient.last_name}</strong>
              </div>
              <div>
                <span className="text-slate-400">DNI / Identificación: </span>
                <strong className="text-slate-800">{patient.dni}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Diagnóstico Definitivo: </span>
                <strong className="text-slate-800">{printingPrescription.diagnosis}</strong>
              </div>
            </div>

            {/* Cuerpo Rp. y Posología */}
            <div className="space-y-4 py-2">
              <h3 className="text-lg font-serif font-extrabold text-sky-800 italic border-b pb-1">
                Rp. / Prescripción e Indicaciones:
              </h3>
              <div className="space-y-4">
                {printingPrescription.medications.map((med, i) => (
                  <div key={i} className="space-y-1">
                    <div className="text-sm font-bold text-slate-900 flex justify-between">
                      <span>{i + 1}. {med.name} {med.concentration} ({med.form})</span>
                      <span className="text-sky-700">Cant: {med.quantity}</span>
                    </div>
                    <p className="text-xs text-slate-700 pl-4 border-l-2 border-sky-400">
                      <strong>Indicaciones:</strong> {med.dosage_instructions} ({med.duration})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendaciones generales */}
            {printingPrescription.general_recommendations && (
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950">
                <strong>Cuidados e Indicaciones no Farmacológicas: </strong>
                {printingPrescription.general_recommendations}
              </div>
            )}

            {/* Pie de Firma y Sello del Odontólogo */}
            <div className="pt-10 flex items-end justify-between border-t border-slate-200 text-xs">
              <div className="text-slate-400">
                Vigencia de la receta: {printingPrescription.valid_until || '30 días'}
              </div>
              <div className="text-center border-t border-slate-400 pt-2 px-8">
                <p className="font-bold text-slate-800">{printingPrescription.doctor_name}</p>
                <p className="text-[11px] text-slate-500">Cirujano Dentista — {printingPrescription.doctor_license || 'COP'}</p>
                <p className="text-[10px] text-slate-400">Firma y Sello Profesional</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t print:hidden">
              <button
                onClick={() => setPrintingPrescription(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
              >
                Cerrar Vista Previa
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm"
              >
                <Printer size={15} />
                Imprimir Receta Oficial / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
