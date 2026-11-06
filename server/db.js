const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'dental_clinic.db');
const db = new DatabaseSync(dbPath);

// Habilitar claves foráneas
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  db.exec(`
    -- Tabla de Doctores / Odontólogos
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      license_number TEXT,
      color TEXT DEFAULT '#0d9488',
      avatar TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de Horarios de Doctores (Planificación semanal de atención)
    CREATE TABLE IF NOT EXISTS doctor_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL, -- 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
      start_time TEXT NOT NULL,     -- HH:MM (ej. "08:00")
      end_time TEXT NOT NULL,       -- HH:MM (ej. "18:00")
      break_start TEXT,            -- HH:MM (ej. "13:00")
      break_end TEXT,              -- HH:MM (ej. "14:00")
      slot_duration_minutes INTEGER DEFAULT 30,
      dental_chair TEXT DEFAULT 'Sillón Principal 1',
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    -- Bloqueos de Horario / Vacaciones / Urgencias / Ausencias
    CREATE TABLE IF NOT EXISTS schedule_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER,
      title TEXT NOT NULL,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT NOT NULL,
      reason TEXT,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    -- Tabla de Pacientes
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dni TEXT NOT NULL UNIQUE,
      birthdate TEXT,
      gender TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      medical_history TEXT, -- Alergias, hipertensión, diabetes, etc.
      has_orthodontics INTEGER DEFAULT 0,
      photo_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de Citas Dentales
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL, -- YYYY-MM-DD
      start_time TEXT NOT NULL,       -- HH:MM
      end_time TEXT NOT NULL,         -- HH:MM
      duration_minutes INTEGER DEFAULT 30,
      treatment_type TEXT NOT NULL,
      status TEXT DEFAULT 'Programada', -- Programada, Confirmada, En Espera, En Atencion, Finalizada, Cancelada, No Asistio
      dental_chair TEXT DEFAULT 'Sillón 1',
      notes TEXT,
      cost REAL DEFAULT 0.0,
      paid REAL DEFAULT 0.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    -- Historial / Registro de Odontograma General
    CREATE TABLE IF NOT EXISTS odontogram_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER,
      date TEXT NOT NULL,
      general_diagnosis TEXT,
      treatment_plan TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
    );

    -- Estado detallado de cada pieza dental por paciente
    CREATE TABLE IF NOT EXISTS odontogram_teeth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      tooth_number INTEGER NOT NULL, -- 11-48 permanentes, 51-85 temporales
      condition TEXT DEFAULT 'sano', -- sano, caries, obturado, corona, endodoncia, ausente, implante, protesis, sellante, fractura
      surfaces TEXT DEFAULT '{}',    -- JSON: { vestibular: 'caries', oclusal: 'obturado', ... }
      notes TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(patient_id, tooth_number),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- Módulo de Ortodoncia: Plan y Ficha Activa
    CREATE TABLE IF NOT EXISTS orthodontic_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL UNIQUE,
      doctor_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      estimated_months INTEGER DEFAULT 18,
      bracket_type TEXT NOT NULL, -- Metálicos Roth, Metálicos MBT, Autoligables Damon, Cerámicos Estéticos, Zafiro, Alineadores
      current_phase TEXT DEFAULT 'Alineación y Nivelación',
      progress_percent INTEGER DEFAULT 15,
      upper_arch_current TEXT DEFAULT 'NiTi .014',
      lower_arch_current TEXT DEFAULT 'NiTi .014',
      ligature_type TEXT DEFAULT 'Elastoméricas',
      ligature_color TEXT DEFAULT '#3b82f6',
      elastics TEXT,
      appliances TEXT,
      total_cost REAL DEFAULT 1500.0,
      monthly_fee REAL DEFAULT 70.0,
      status TEXT DEFAULT 'Activo', -- Activo, Pausado, Finalizado, Retención
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    -- Mapeo de Brackets / Aditamentos por Diente en Ortodoncia
    CREATE TABLE IF NOT EXISTS orthodontic_brackets_map (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      tooth_number INTEGER NOT NULL,
      bracket_status TEXT DEFAULT 'bracket_ok', -- bracket_ok, bracket_caido, tubo, banda, boton, sin_bracket
      prescription TEXT,
      notes TEXT,
      UNIQUE(patient_id, tooth_number),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- Evolución y Controles de Ortodoncia (Bitácora de Sesiones de Control)
    CREATE TABLE IF NOT EXISTS orthodontic_controls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_id INTEGER,
      date TEXT NOT NULL,
      session_number INTEGER NOT NULL,
      phase TEXT NOT NULL,
      upper_arch TEXT,
      lower_arch TEXT,
      ligatures TEXT,
      ligature_color TEXT,
      elastics_prescribed TEXT,
      adjustments_made TEXT NOT NULL,
      hygiene_score TEXT DEFAULT 'Buena', -- Excelente, Buena, Regular, Deficiente
      pain_level INTEGER DEFAULT 1,       -- 1 al 5
      brackets_replaced_count INTEGER DEFAULT 0,
      next_appointment_goals TEXT,
      doctor_notes TEXT,
      cost REAL DEFAULT 70.0,
      paid INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
    );

    -- Tabla de Pagos y Finanzas
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      appointment_id INTEGER,
      doctor_id INTEGER,
      concept TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'Efectivo', -- Efectivo, Tarjeta, Transferencia, Yape/Plin, Seguro
      payment_date TEXT NOT NULL,
      status TEXT DEFAULT 'Pagado',
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- =================================================================
    -- NUEVAS TABLAS CLÍNICAS: HISTORIA CLÍNICA, EVOLUCIÓN, RAYOS X, RECETAS
    -- =================================================================

    -- 1. Historia Clínica Estomatológica Completa (Anamnesis y Examen Clínico)
    CREATE TABLE IF NOT EXISTS clinical_histories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL UNIQUE,
      doctor_id INTEGER,
      blood_type TEXT DEFAULT 'O+',
      allergies TEXT,                  -- Alergia a anestésicos, antibióticos, AINEs, látex
      systemic_diseases TEXT,          -- Diabetes, HTA, cardiopatías, asma, coagulopatías
      current_medications TEXT,        -- Medicación habitual
      habits TEXT,                     -- Bruxismo, tabaquismo, respiración bucal, onicofagia
      blood_pressure TEXT DEFAULT '120/80 mmHg',
      heart_rate TEXT DEFAULT '72 lpm',
      temperature TEXT DEFAULT '36.6 °C',
      extraoral_exam TEXT,             -- ATM, músculos masticadores, ganglios, simetría facial
      intraoral_exam TEXT,             -- Labios, lengua, paladar, encías, bolsas periodontales
      occlusion_class TEXT DEFAULT 'Clase I de Angle', -- Clase I, Clase II Div 1, Clase II Div 2, Clase III
      oral_hygiene_index TEXT DEFAULT 'Buena (IHO-S Bajo)',
      presumptive_diagnosis TEXT,
      definitive_diagnosis TEXT,       -- Diagnóstico con código CIE-10 (ej. K02.1 Caries de la dentina)
      prognosis TEXT DEFAULT 'Favorable',
      informed_consent_signed INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
    );

    -- 2. Bitácora de Evolución Clínica y Procedimientos Odontológicos por Sesión
    CREATE TABLE IF NOT EXISTS clinical_evolutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      evolution_date TEXT NOT NULL,
      tooth_number TEXT,               -- Pieza dental (ej. "16", "21-22", "Arcada Superior", "General")
      procedure_performed TEXT NOT NULL, -- Ej: Endodoncia, Exodoncia, Resina compuesta, Profilaxis
      anesthesia_used TEXT,            -- Ej: Lidocaína 2% con epinefrina 1:80,000 (2 cartuchos)
      materials_used TEXT,             -- Ej: Resina 3M Filtek Z350, Ionómero de vidrio, Gutapercha
      clinical_notes TEXT NOT NULL,    -- Descripción detallada del acto operatorio y evolución
      post_op_indications TEXT,        -- Indicaciones dadas al paciente
      next_step TEXT,                  -- Plan para la próxima sesión
      treatment_status TEXT DEFAULT 'Completado', -- En Proceso, Completado, Control
      cost REAL DEFAULT 0.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    -- 3. Exámenes de Radiodiagnóstico, Rayos X e Imágenes Clínicas
    CREATE TABLE IF NOT EXISTS radiology_exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      exam_date TEXT NOT NULL,
      exam_type TEXT NOT NULL,         -- Radiografía Panorámica, Periapical, Cefalométrica, Tomografía CBCT, Bitewing, Fotografía Intraoral
      tooth_area TEXT,                 -- Zona o pieza dental (ej. "Arcada Completa", "Pieza 36", " Perfil Lateral")
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,         -- URL o Base64 de la imagen radiográfica
      radiological_findings TEXT,      -- Informe / hallazgos radiológicos detallados
      radiation_dose TEXT DEFAULT 'Baja (Digital RVG)',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    -- 4. Recetas Odontológicas y Prescripciones Médicas (Rx)
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      prescription_date TEXT NOT NULL,
      diagnosis TEXT NOT NULL,         -- Diagnóstico que motiva la receta (ej. Pulpitis irreversible / Post-exodoncia)
      medications_json TEXT NOT NULL,  -- JSON Array: [{ name, concentration, form, quantity, dosage_instructions, duration }]
      general_recommendations TEXT,    -- Dieta blanda, hielo local, no fumar, etc.
      valid_until TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ Base de datos inicializada correctamente con SQLite nativo.');
}

module.exports = {
  db,
  initDatabase
};
