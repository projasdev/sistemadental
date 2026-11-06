import {
  Doctor,
  DoctorSchedule,
  ScheduleBlock,
  Patient,
  Appointment,
  OdontogramTooth,
  OdontogramRecord,
  OrthodonticPlan,
  OrthodonticBracket,
  OrthodonticControl,
  DashboardKPIs,
  ClinicalHistory,
  ClinicalEvolution,
  RadiologyExam,
  Prescription
} from '../types';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error en la solicitud: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Doctores y Horarios
  getDoctors: () => request<Doctor[]>('/doctors'),
  createDoctor: (data: Partial<Doctor>) => request<{ id: number; message: string }>('/doctors', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateDoctor: (id: number, data: Partial<Doctor>) => request<{ message: string }>(`/doctors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getDoctorSchedules: (doctorId: number) => request<DoctorSchedule[]>(`/doctors/${doctorId}/schedules`),
  saveDoctorSchedules: (doctorId: number, schedules: Partial<DoctorSchedule>[]) =>
    request<{ message: string }>(`/doctors/${doctorId}/schedules`, {
      method: 'POST',
      body: JSON.stringify({ schedules })
    }),
  getScheduleBlocks: () => request<ScheduleBlock[]>('/schedule-blocks'),
  createScheduleBlock: (data: Partial<ScheduleBlock>) => request<{ id: number }>('/schedule-blocks', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteScheduleBlock: (id: number) => request<{ message: string }>(`/schedule-blocks/${id}`, {
    method: 'DELETE'
  }),
  getDoctorAvailability: (doctorId: number, date: string) =>
    request<{
      available: boolean;
      reason?: string;
      schedule?: DoctorSchedule;
      slots: Array<{
        time: string;
        endTime: string;
        available: boolean;
        isBreak: boolean;
        isBooked: boolean;
        dentalChair: string;
      }>;
    }>(`/doctors/${doctorId}/availability?date=${date}`),

  // Pacientes
  getPatients: (search?: string) => request<Patient[]>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getPatientById: (id: number) => request<Patient & { appointments: Appointment[]; orthoPlan?: OrthodonticPlan }>(`/patients/${id}`),
  createPatient: (data: Partial<Patient>) => request<{ id: number; message: string }>('/patients', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updatePatient: (id: number, data: Partial<Patient>) => request<{ message: string }>(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deletePatient: (id: number) => request<{ message: string }>(`/patients/${id}`, {
    method: 'DELETE'
  }),

  // Citas
  getAppointments: (params?: { date?: string; startDate?: string; endDate?: string; doctorId?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.doctorId) query.append('doctorId', params.doctorId.toString());
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return request<Appointment[]>(`/appointments${qs ? `?${qs}` : ''}`);
  },
  createAppointment: (data: Partial<Appointment>) => request<{ id: number; message: string }>('/appointments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateAppointment: (id: number, data: Partial<Appointment>) => request<{ message: string }>(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  updateAppointmentStatus: (id: number, status: string) => request<{ message: string }>(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  deleteAppointment: (id: number) => request<{ message: string }>(`/appointments/${id}`, {
    method: 'DELETE'
  }),

  // Odontograma
  getOdontogram: (patientId: number) => request<{ teeth: OdontogramTooth[]; records: OdontogramRecord[] }>(`/odontogram/${patientId}`),
  saveToothCondition: (patientId: number, data: { tooth_number: number; condition: string; surfaces: any; notes?: string }) =>
    request<{ message: string }>(`/odontogram/${patientId}/tooth`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  saveOdontogramRecord: (patientId: number, data: Partial<OdontogramRecord>) =>
    request<{ id: number; message: string }>(`/odontogram/${patientId}/record`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Ortodoncia
  getOrthodontics: (patientId: number) => request<{
    plan: OrthodonticPlan | null;
    bracketsMap: OrthodonticBracket[];
    controls: OrthodonticControl[];
  }>(`/orthodontics/${patientId}`),
  saveOrthodonticPlan: (patientId: number, data: Partial<OrthodonticPlan>) =>
    request<{ message: string }>(`/orthodontics/${patientId}/plan`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateBracketStatus: (patientId: number, data: { tooth_number: number; bracket_status: string; prescription?: string; notes?: string }) =>
    request<{ message: string }>(`/orthodontics/${patientId}/bracket`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createOrthodonticControl: (patientId: number, data: Partial<OrthodonticControl>) =>
    request<{ id: number; session_number: number; message: string }>(`/orthodontics/${patientId}/control`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Reportes y Analíticas
  getDashboardReports: () => request<{
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
  }>('/reports/dashboard'),
  getAppointmentReports: () => request<{
    byStatus: Array<{ status: string; count: number }>;
    byDoctor: Array<{ doctor_name: string; specialty: string; total_appointments: number; completed: number; cancelled: number }>;
    byTreatment: Array<{ treatment_type: string; count: number }>;
  }>('/reports/appointments'),
  getOrthodonticReports: () => request<{
    byPhase: Array<{ phase: string; count: number }>;
    byBracketType: Array<{ bracket_type: string; count: number }>;
    brokenBrackets: number;
    patientsWithBrokenBrackets: Array<{ id: number; first_name: string; last_name: string; phone: string; tooth_number: number }>;
  }>('/reports/orthodontics'),
  getFinancialReports: () => request<{
    recentPayments: Array<{
      id: number;
      concept: string;
      amount: number;
      payment_method: string;
      payment_date: string;
      status: string;
      first_name: string;
      last_name: string;
      doctor_name?: string;
    }>;
    byMethod: Array<{ payment_method: string; total: number }>;
    monthly: Array<{ month: string; total: number }>;
  }>('/reports/financial'),

  // Historia Clínica, Evolución, Radiodiagnóstico (Rayos X) y Recetas (Rx)
  getClinicalRecord: (patientId: number) => request<{
    history: ClinicalHistory | null;
    evolutions: ClinicalEvolution[];
    radiologyExams: RadiologyExam[];
    prescriptions: Prescription[];
  }>(`/clinical-record/${patientId}`),
  saveClinicalHistory: (patientId: number, data: Partial<ClinicalHistory>) =>
    request<{ message: string }>(`/clinical-history/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createEvolution: (patientId: number, data: Partial<ClinicalEvolution>) =>
    request<{ id: number; message: string }>(`/evolutions/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteEvolution: (id: number) =>
    request<{ message: string }>(`/evolutions/${id}`, {
      method: 'DELETE'
    }),
  createRadiologyExam: (patientId: number, data: Partial<RadiologyExam>) =>
    request<{ id: number; message: string }>(`/radiology/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteRadiologyExam: (id: number) =>
    request<{ message: string }>(`/radiology/${id}`, {
      method: 'DELETE'
    }),
  createPrescription: (patientId: number, data: Partial<Prescription>) =>
    request<{ id: number; message: string }>(`/prescriptions/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deletePrescription: (id: number) =>
    request<{ message: string }>(`/prescriptions/${id}`, {
      method: 'DELETE'
    }),
};
