# 🦷 DentalGravity Pro — Sistema Integral de Gestión Dental, Citas, Odontogramas y Ortodoncia

Una solución web **Full Stack** de nivel profesional y alto rendimiento diseñada para clínicas odontológicas, especialistas en ortodoncia, odontopediatría y cirugía oral.

---

## 🌟 Características Principales del Sistema

### 1. 🗄️ Base de Datos Relacional y Modelo de Datos
- **Motor:** SQLite sincronizado de alto rendimiento (`node:sqlite`) con transacciones seguras y claves foráneas.
- **Persistencia completa:**
  - Doctores y especialidades.
  - Planificación semanal de turnos y sillones dentales.
  - Bloqueos de agenda (vacaciones, congresos, ausencias).
  - Pacientes con historia médica, antecedentes y alertas de alergias.
  - Citas con estados en tiempo real (Programada, Confirmada, En Espera, En Consulta, Finalizada, Cancelada).
  - Piezas dentales del odontograma con 5 superficies anatómicas independientes.
  - Planes de ortodoncia, mapa de brackets individuales y bitácora cronológica de controles.
  - Finanzas, cobranzas y métodos de pago.

---

### 2. 🦷 Odontograma Clínico Interactivo (Notación FDI Internacional)
- **Dentición Doble:**
  - **Adulto / Permanente (32 piezas):** Cuadrantes 18-11, 21-28, 48-41, 31-38.
  - **Infantil / Temporal (20 piezas):** Cuadrantes 55-51, 61-65, 85-81, 71-75.
- **5 Superficies Anatómicas por Diente:** Vestibular, Palatino/Lingual, Mesial, Distal y Oclusal/Incisal.
- **Paleta de Diagnósticos Clínicos:**
  - 🔴 **Caries Dental:** Lesión activa en superficie seleccionada.
  - 🔵 **Obturación / Resina:** Restauración estética terminada.
  - 🟡 **Corona:** Prótesis fija / corona total.
  - 🟣 **Endodoncia:** Tratamiento de conductos con visualización radicular.
  - 🟢 **Sellante:** Sellante preventivo de fosas y fisuras.
  - ❌ **Ausente / Exodoncia:** Diente perdido o con extracción requerida.
  - 🔩 **Implante:** Implante osteointegrado de titanio.
  - ⚡ **Fractura Dental:** Traumatismo o fisura.
  - ⚪ **Diente Sano:** Limpiar o restablecer estado normal.
- **Diagnóstico General y Plan de Tratamiento:** Campos clínicos guardados en la ficha histórica.
- **Notas Clínicas Individuales:** Clic en cualquier número de pieza para registrar material específico o evolución.

---

### 3. 📐 Módulo Especializado de Tratamiento de Ortodoncia
- **Mapa Visual de Brackets por Arcada:**
  - Arcada Superior (17 al 27) y Arcada Inferior (47 al 37).
  - Estados por diente: `Bracket OK`, `¡Bracket Desprendido!`, `Tubo Molar`, `Banda Molar`, `Botón Palatino`, `Sin Bracket`.
  - **Alerta de Brackets Caídos:** Detección automática en el dashboard para coordinar recementado oportuno.
- **Selector Interactivo de Colores de Ligas:**
  - Paleta en vivo de 12 colores de ligaduras elastoméricas (Azul Rey, Celeste Neón, Rosa Fucsia, Morado Uva, Turquesa, Verde Menta, Rojo Rubí, Gris Plata, etc.).
- **Seguimiento de Arcos:**
  - Registro de Arco Superior e Inferior (ej: NiTi Térmico .012, .014, .016; Acero .016x.022, .019x.025; TMA).
- **Mecánica Activa y Elásticos:**
  - Elásticos intermaxilares (Clase II, Clase III, mordida cruzada, vector y fuerza en onzas).
  - Aparatos auxiliares (Disyuntor Hyrax, Botón de Nance, etc.).
- **Fases del Tratamiento con Barra de Progreso:**
  1. Diagnóstico y Planificación (10%)
  2. Alineación y Nivelación (30%)
  3. Corrección Sagital / Relación Canina (50%)
  4. Cierre de Espacios (75%)
  5. Detallado y Finalización (90%)
  6. Retención Activa (100%)
- **Bitácora Cronológica de Sesiones de Control:**
  - Registro de cada cita con fecha, doctor, arcos colocados, ajustes de torque, higiene bucal (Excelente/Buena/Regular/Deficiente), brackets reparados y objetivos para la siguiente cita.

---

### 4. ⏰ Planificación de Horarios y Turnos de Doctores
- **Matriz Semanal de Atención (Lunes a Domingo):**
  - Configuración independiente por cada especialista.
  - Horario de inicio y fin de jornada.
  - Intervalo de receso / almuerzo.
  - Duración de los turnos de consulta (15, 20, 30, 45, 60 minutos).
  - Sillón asignado por turno (Sillón Ortodoncia 1, Sillón Estética 2, Sillón Quirúrgico 3, etc.).
- **Simulador de Disponibilidad en Tiempo Real:**
  - Calcula al instante los turnos libres del doctor en cualquier fecha seleccionada, descontando recesos y citas agendadas.
- **Bloqueos de Agenda:**
  - Registro de vacaciones, asistencia a congresos o ausencias justificadas.

---

### 5. 📅 Gestión Integral de Citas Dentales
- **Vistas:**
  - **Agenda Diaria:** Tarjetas visuales de pacientes con horarios, sillón asignado y motivo de consulta.
  - **Tabla General:** Búsqueda rápida por paciente, doctor, estado o tratamiento.
- **Ciclo de Vida de la Cita:**
  - `Programada` -> `Confirmada` -> `En Sala de Espera` -> `En Consulta` -> `Finalizada`.
- **Detección Inteligente de Colisiones:**
  - El modal de reserva valida automáticamente que el especialista no tenga otra cita superpuesta en el mismo horario.
- **Atajos Clínicos Directos:**
  - Desde la cita se puede abrir inmediatamente el Odontograma o la Ficha de Ortodoncia del paciente.

---

### 6. 📊 Reportes y Analíticas (Business Intelligence)
- Gráficos interactivos construidos con **Recharts**:
  - **Evolución Mensual de Ingresos:** Gráfico de área con recaudación histórica.
  - **Distribución de Citas por Estado:** Gráfico Donut de tasa de asistencia y cancelaciones.
  - **Ortodoncia por Fase de Tratamiento:** Gráfico de barras horizontal con el volumen de pacientes activos en cada etapa.
  - **Citas por Especialista:** Comparativa de pacientes atendidos por doctor.
  - **Auditoría Financiera Reciente:** Tabla de pagos por paciente, doctor y método de pago (Efectivo, Tarjeta, Transferencia, Yape/Plin).
  - **Exportación:** Botón directo para imprimir o guardar reporte en PDF.

---

## 🚀 Cómo Ejecutar la Aplicación

### Opción 1: Servidor Integrado Full Stack (Recomendado)
Desde la raíz del proyecto:
```bash
# Iniciar el servidor Full Stack (API + Frontend en puerto 5000)
npm start
```
Abrir en el navegador:
👉 **`http://localhost:5000`**

### Opción 2: Modo Desarrollo con Hot Reloading
1. En una terminal (Backend):
   ```bash
   node server/server.js
   ```
2. En otra terminal (Frontend Vite):
   ```bash
   npm --prefix client run dev
   ```
Abrir en el navegador:
👉 **`http://localhost:3000`**

---

## 📂 Estructura del Código Fuente

```text
gravity/
├── server/
│   ├── db.js                 # Inicialización y esquema de la base de datos SQLite
│   ├── seed.js               # Datos de prueba clínicos realistas (doctores, citas, ortodoncia)
│   ├── server.js             # API REST en Express con endpoints completos
│   └── package.json          # Dependencias del backend
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardHome.tsx          # Panel principal con KPIs en vivo
│   │   │   ├── AppointmentsCalendar.tsx   # Agenda interactiva y nueva cita
│   │   │   ├── DoctorSchedulePlanner.tsx  # Planificador semanal de turnos y sillones
│   │   │   ├── PatientsManager.tsx        # Historias clínicas y antecedentes
│   │   │   ├── Odontogram.tsx             # Odontograma SVG interactivo 32/20 piezas
│   │   │   ├── OrthodonticsModule.tsx     # Mapa de brackets, arcos, ligas y bitácora
│   │   │   └── ReportsDashboard.tsx       # Gráficos Recharts y reportes financieros
│   │   ├── services/
│   │   │   └── api.ts                     # Cliente tipado para consumo de la API
│   │   ├── types/
│   │   │   └── index.ts                   # Interfaces TypeScript completas
│   │   ├── App.tsx                        # Componente raíz con navegación fluida
│   │   ├── main.tsx                       # Punto de entrada de React
│   │   └── index.css                      # Estilos con Tailwind CSS v4
│   ├── index.html                         # Documento HTML principal
│   └── vite.config.ts                     # Configuración de Vite y proxy de API
└── README.md                              # Documentación completa del sistema
```

---

## 👨‍⚕️ Doctores y Especialistas Preconfigurados

1. **Dr. Mateo Morales** — Especialista en Ortodoncia y Ortopedia Dentofacial (COP-34821)
2. **Dra. Sofía Valenzuela** — Odontología General y Estética (COP-41920)
3. **Dr. Andrés Navarro** — Cirugía Oral y Periodoncia (COP-29104)
4. **Dra. Camila Rivas** — Odontopediatría y Ortodoncia Interceptiva (COP-52319)
