export interface DoctorSchedule {
  id?: number;
  doctor_id: number;
  day_of_week: number; // 0=Dom, 1=Lun, ..., 6=Sab
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  slot_duration_minutes: number;
  dental_chair: string;
  is_active: number;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  license_number: string;
  color: string;
  avatar: string;
  active: number;
  schedules?: DoctorSchedule[];
  today_appointments?: number;
  pending_appointments?: number;
}

export interface ScheduleBlock {
  id: number;
  doctor_id: number | null;
  doctor_name?: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  reason?: string;
}

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  dni: string;
  birthdate?: string;
  gender?: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_history?: string;
  has_orthodontics: number;
  photo_url?: string;
  total_appointments?: number;
  last_visit?: string;
  ortho_phase?: string;
}

export type AppointmentStatus =
  | 'Programada'
  | 'Confirmada'
  | 'En Espera'
  | 'En Atencion'
  | 'Finalizada'
  | 'Cancelada'
  | 'No Asistio';

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  treatment_type: string;
  status: AppointmentStatus;
  dental_chair: string;
  notes?: string;
  cost: number;
  paid: number;
  first_name?: string;
  last_name?: string;
  dni?: string;
  patient_phone?: string;
  patient_photo?: string;
  has_orthodontics?: number;
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_color?: string;
  doctor_avatar?: string;
}

export type ToothCondition =
  | 'sano'
  | 'caries'
  | 'obturado'
  | 'corona'
  | 'endodoncia'
  | 'ausente'
  | 'implante'
  | 'protesis'
  | 'sellante'
  | 'fractura';

export interface ToothSurfaces {
  vestibular?: ToothCondition;
  lingual?: ToothCondition;
  palatino?: ToothCondition;
  mesial?: ToothCondition;
  distal?: ToothCondition;
  oclusal?: ToothCondition;
  incisal?: ToothCondition;
  completo?: ToothCondition;
}

export interface OdontogramTooth {
  id?: number;
  patient_id: number;
  tooth_number: number;
  condition: ToothCondition;
  surfaces: ToothSurfaces;
  notes?: string;
}

export interface OdontogramRecord {
  id: number;
  patient_id: number;
  doctor_id?: number;
  doctor_name?: string;
  date: string;
  general_diagnosis: string;
  treatment_plan: string;
  notes?: string;
}

export type BracketStatus =
  | 'bracket_ok'
  | 'bracket_caido'
  | 'tubo'
  | 'banda'
  | 'boton'
  | 'sin_bracket';

export interface OrthodonticBracket {
  id?: number;
  patient_id: number;
  tooth_number: number;
  bracket_status: BracketStatus;
  prescription?: string;
  notes?: string;
}

export interface OrthodonticPlan {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  doctor_specialty?: string;
  start_date: string;
  estimated_months: number;
  bracket_type: string;
  current_phase: string;
  progress_percent: number;
  upper_arch_current: string;
  lower_arch_current: string;
  ligature_type: string;
  ligature_color: string;
  elastics?: string;
  appliances?: string;
  total_cost: number;
  monthly_fee: number;
  status: string;
  notes?: string;
}

export interface OrthodonticControl {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  appointment_id?: number;
  date: string;
  session_number: number;
  phase: string;
  upper_arch?: string;
  lower_arch?: string;
  ligatures?: string;
  ligature_color?: string;
  elastics_prescribed?: string;
  adjustments_made: string;
  hygiene_score: string;
  pain_level: number;
  brackets_replaced_count: number;
  next_appointment_goals?: string;
  doctor_notes?: string;
  cost: number;
  paid: number;
}

export interface DashboardKPIs {
  appointmentsToday: number;
  waitingPatients: number;
  activeOrthoCases: number;
  monthlyRevenue: number;
  attendanceRate: number;
}

export interface ClinicalHistory {
  id?: number;
  patient_id: number;
  doctor_id?: number;
  doctor_name?: string;
  doctor_specialty?: string;
  blood_type: string;
  allergies: string;
  systemic_diseases: string;
  current_medications: string;
  habits: string;
  blood_pressure: string;
  heart_rate: string;
  temperature: string;
  extraoral_exam: string;
  intraoral_exam: string;
  occlusion_class: string;
  oral_hygiene_index: string;
  presumptive_diagnosis: string;
  definitive_diagnosis: string;
  prognosis: string;
  informed_consent_signed: number;
  updated_at?: string;
}

export interface ClinicalEvolution {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_license?: string;
  evolution_date: string;
  tooth_number: string;
  procedure_performed: string;
  anesthesia_used: string;
  materials_used: string;
  clinical_notes: string;
  post_op_indications: string;
  next_step: string;
  treatment_status: string;
  cost: number;
}

export interface RadiologyExam {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  doctor_specialty?: string;
  exam_date: string;
  exam_type: string;
  tooth_area: string;
  title: string;
  image_url: string;
  radiological_findings: string;
  radiation_dose: string;
}

export interface MedicationItem {
  name: string;
  concentration: string;
  form: string;
  quantity: string;
  dosage_instructions: string;
  duration: string;
}

export interface Prescription {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_license?: string;
  doctor_phone?: string;
  prescription_date: string;
  diagnosis: string;
  medications: MedicationItem[];
  general_recommendations: string;
  valid_until: string;
}

