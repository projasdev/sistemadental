import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Smile,
  Users,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  Filter,
  CreditCard
} from 'lucide-react';
import { api } from '../services/api';

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'];

export const ReportsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [appointmentReports, setAppointmentReports] = useState<any>(null);
  const [orthoReports, setOrthoReports] = useState<any>(null);
  const [financialReports, setFinancialReports] = useState<any>(null);

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const [appt, ortho, fin] = await Promise.all([
        api.getAppointmentReports(),
        api.getOrthodonticReports(),
        api.getFinancialReports()
      ]);
      setAppointmentReports(appt);
      setOrthoReports(ortho);
      setFinancialReports(fin);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-xs text-slate-500">
        Cargando estadísticas y reportes clínicos...
      </div>
    );
  }

  // Preparación de datos para gráficos
  const statusPieData = appointmentReports?.byStatus.map((item: any) => ({
    name: item.status,
    value: item.count
  })) || [];

  const doctorBarData = appointmentReports?.byDoctor.map((item: any) => ({
    name: item.doctor_name.replace('Dr. ', '').replace('Dra. ', ''),
    Total: item.total_appointments,
    Atendidas: item.completed,
    Canceladas: item.cancelled
  })) || [];

  const orthoPhaseData = orthoReports?.byPhase.map((item: any) => ({
    name: item.phase,
    Pacientes: item.count
  })) || [];

  const monthlyRevData = financialReports?.monthly.map((item: any) => ({
    mes: item.month,
    Total: item.total
  })) || [];

  return (
    <div className="space-y-6">
      {/* Encabezado de Reportes con botón de exportar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <TrendingUp size={14} />
              Módulo de Inteligencia de Negocios y Reportes
            </span>
            <span className="text-xs text-slate-500 font-medium">Auditoría Clínica</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            Reportes Odontológicos y Financieros
          </h2>
          <p className="text-sm text-slate-500">
            Métricas de ocupación, fidelización de ortodoncia, efectividad de turnos y recaudación.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors self-start sm:self-center"
        >
          <Printer size={16} />
          Imprimir / Exportar Reporte
        </button>
      </div>

      {/* FILA 1: INGRESOS Y EFECTIVIDAD DE CITAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolución de Ingresos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600" />
                Ingresos Recaudados por Mes ($)
              </h3>
              <p className="text-xs text-slate-500">Histórico de cobranzas y mensualidades</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Actualizado
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Distribución de Citas por Estado */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-sky-600" />
                Distribución de Citas por Estado
              </h3>
              <p className="text-xs text-slate-500">Tasa de cumplimiento y cancelaciones</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {statusPieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FILA 2: ORTODONCIA POR FASE Y CITAS POR DOCTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ortodoncia: Pacientes por Fase */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Smile size={18} className="text-indigo-600" />
                Pacientes de Ortodoncia por Fase de Tratamiento
              </h3>
              <p className="text-xs text-slate-500">Distribución de casos activos en clínica</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              Ortodoncia Activa
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orthoPhaseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="Pacientes" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Desempeño y Citas por Doctor */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-teal-600" />
                Volumen y Citas Atendidas por Especialista
              </h3>
              <p className="text-xs text-slate-500">Atenciones completadas vs cancelaciones</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Total" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Atendidas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Canceladas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FILA 3: ÚLTIMAS TRANSACCIONES FINANCIERAS Y PAGOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CreditCard size={18} className="text-sky-600" />
              Auditoría de Pagos y Recaudación Reciente
            </h3>
            <p className="text-xs text-slate-500">Registro de pagos por paciente, doctor y método de pago</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Concepto</th>
                <th className="p-3">Especialista</th>
                <th className="p-3">Método</th>
                <th className="p-3 text-right">Monto ($)</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financialReports?.recentPayments?.map((pay: any) => (
                <tr key={pay.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">{pay.payment_date}</td>
                  <td className="p-3 font-bold text-slate-800">{pay.first_name} {pay.last_name}</td>
                  <td className="p-3 text-slate-700">{pay.concept}</td>
                  <td className="p-3 text-slate-600">{pay.doctor_name || 'Clínica Dental'}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                      {pay.payment_method}
                    </span>
                  </td>
                  <td className="p-3 text-right font-extrabold text-emerald-700">${pay.amount.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                      {pay.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
