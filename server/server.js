const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./db');
const { seed } = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '30mb' }));

// Inicializar y sembrar si está vacía
initDatabase();
seed();

// ==========================================
// 1. ENDPOINTS: DOCTORES Y HORARIOS
// ==========================================

// Obtener todos los doctores
app.get('/api/doctors', (req, res) => {
  try {
    const doctors = db.prepare(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id AND a.appointment_date = DATE('now', 'localtime')) as today_appointments,
        (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id AND a.status IN ('Programada', 'Confirmada', 'En Espera', 'En Atencion')) as pending_appointments
      FROM doctors d
      WHERE d.active = 1
      ORDER BY d.id ASC
    `).all();

    // Adjuntar horarios semanales
    const getSchedules = db.prepare('SELECT * FROM doctor_schedules WHERE doctor_id = ? AND is_active = 1 ORDER BY day_of_week ASC');
    const doctorsWithSchedules = doctors.map(doc => ({
      ...doc,
      schedules: getSchedules.all(doc.id)
    }));

    res.json(doctorsWithSchedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear doctor
app.post('/api/doctors', (req, res) => {
  try {
    const { name, specialty, email, phone, license_number, color, avatar } = req.body;
    const stmt = db.prepare(`
      INSERT INTO doctors (name, specialty, email, phone, license_number, color, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, specialty, email || '', phone || '', license_number || '', color || '#0d9488', avatar || '');
    
    // Asignar horario estándar por defecto (Lun a Vie 09:00 - 18:00)
    const insertSchedule = db.prepare(`
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration_minutes, dental_chair)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    [1, 2, 3, 4, 5].forEach(day => {
      insertSchedule.run(result.lastInsertRowid, day, '09:00', '18:00', '13:00', '14:00', 30, 'Sillón Principal');
    });

    res.status(201).json({ id: result.lastInsertRowid, message: 'Doctor creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar doctor
app.put('/api/doctors/:id', (req, res) => {
  try {
    const { name, specialty, email, phone, license_number, color, avatar, active } = req.body;
    db.prepare(`
      UPDATE doctors 
      SET name = ?, specialty = ?, email = ?, phone = ?, license_number = ?, color = ?, avatar = ?, active = ?
      WHERE id = ?
    `).run(name, specialty, email, phone, license_number, color, avatar, active ?? 1, req.params.id);

    res.json({ message: 'Doctor actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener horarios de un doctor
app.get('/api/doctors/:id/schedules', (req, res) => {
  try {
    const schedules = db.prepare('SELECT * FROM doctor_schedules WHERE doctor_id = ? ORDER BY day_of_week ASC').all(req.params.id);
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar/Actualizar planificación de horarios de un doctor
app.post('/api/doctors/:id/schedules', (req, res) => {
  try {
    const doctorId = req.params.id;
    const { schedules } = req.body; // Array de { day_of_week, start_time, end_time, break_start, break_end, slot_duration_minutes, dental_chair, is_active }

    db.exec('BEGIN TRANSACTION;');
    db.prepare('DELETE FROM doctor_schedules WHERE doctor_id = ?').run(doctorId);

    const insert = db.prepare(`
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration_minutes, dental_chair, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    schedules.forEach(s => {
      insert.run(
        doctorId,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.break_start || null,
        s.break_end || null,
        s.slot_duration_minutes || 30,
        s.dental_chair || 'Sillón 1',
        s.is_active ? 1 : 0
      );
    });

    db.exec('COMMIT;');
    res.json({ message: 'Horarios guardados correctamente' });
  } catch (error) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: error.message });
  }
});

// Bloqueos de agenda
app.get('/api/schedule-blocks', (req, res) => {
  try {
    const blocks = db.prepare(`
      SELECT b.*, d.name as doctor_name
      FROM schedule_blocks b
      LEFT JOIN doctors d ON b.doctor_id = d.id
      ORDER BY b.start_datetime ASC
    `).all();
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/schedule-blocks', (req, res) => {
  try {
    const { doctor_id, title, start_datetime, end_datetime, reason } = req.body;
    const result = db.prepare(`
      INSERT INTO schedule_blocks (doctor_id, title, start_datetime, end_datetime, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(doctor_id || null, title, start_datetime, end_datetime, reason || '');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Bloqueo registrado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/schedule-blocks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM schedule_blocks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Bloqueo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disponibilidad de turnos de un doctor en una fecha específica
app.get('/api/doctors/:id/availability', (req, res) => {
  try {
    const doctorId = req.params.id;
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ error: 'Parámetro "date" es requerido' });

    // Determinar día de la semana (0=Dom, ..., 6=Sab)
    const targetDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = targetDate.getDay();

    const schedule = db.prepare(`
      SELECT * FROM doctor_schedules 
      WHERE doctor_id = ? AND day_of_week = ? AND is_active = 1
    `).get(doctorId, dayOfWeek);

    if (!schedule) {
      return res.json({ available: false, reason: 'El doctor no atiende en este día de la semana', slots: [] });
    }

    // Obtener citas ya agendadas ese día para ese doctor
    const existingAppointments = db.prepare(`
      SELECT start_time, end_time, status FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('Cancelada')
    `).all(doctorId, date);

    // Generar franjas horarias
    const slots = [];
    const slotDuration = schedule.slot_duration_minutes || 30;

    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    
    let currentMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;

    let breakStartMin = null;
    let breakEndMin = null;
    if (schedule.break_start && schedule.break_end) {
      const [bsh, bsm] = schedule.break_start.split(':').map(Number);
      const [beh, bem] = schedule.break_end.split(':').map(Number);
      breakStartMin = bsh * 60 + bsm;
      breakEndMin = beh * 60 + bem;
    }

    while (currentMin + slotDuration <= endTotalMin) {
      const slotStart = `${String(Math.floor(currentMin / 60)).padStart(2, '0')}:${String(currentMin % 60).padStart(2, '0')}`;
      const nextMin = currentMin + slotDuration;
      const slotEnd = `${String(Math.floor(nextMin / 60)).padStart(2, '0')}:${String(nextMin % 60).padStart(2, '0')}`;

      // Verificar si cae en receso
      let isBreak = false;
      if (breakStartMin !== null && breakEndMin !== null) {
        if (currentMin >= breakStartMin && currentMin < breakEndMin) {
          isBreak = true;
        }
      }

      // Verificar si ya está ocupado por una cita
      const isBooked = existingAppointments.some(appt => {
        return (slotStart < appt.end_time && slotEnd > appt.start_time);
      });

      slots.push({
        time: slotStart,
        endTime: slotEnd,
        available: !isBreak && !isBooked,
        isBreak,
        isBooked,
        dentalChair: schedule.dental_chair
      });

      currentMin = nextMin;
    }

    res.json({
      available: true,
      schedule,
      slots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. ENDPOINTS: PACIENTES
// ==========================================

app.get('/api/patients', (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT p.*,
        (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) as total_appointments,
        (SELECT MAX(appointment_date) FROM appointments a WHERE a.patient_id = p.id) as last_visit,
        (SELECT current_phase FROM orthodontic_plans o WHERE o.patient_id = p.id AND o.status = 'Activo') as ortho_phase
      FROM patients p
    `;
    const params = [];

    if (search) {
      query += ` WHERE p.first_name LIKE ? OR p.last_name LIKE ? OR p.dni LIKE ? OR p.phone LIKE ?`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY p.last_name ASC, p.first_name ASC`;
    const patients = db.prepare(query).all(...params);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patients/:id', (req, res) => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });

    // Historial de citas
    const appointments = db.prepare(`
      SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty, d.color as doctor_color
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `).all(patient.id);

    // Plan de Ortodoncia si tiene
    const orthoPlan = db.prepare(`
      SELECT o.*, d.name as doctor_name
      FROM orthodontic_plans o
      JOIN doctors d ON o.doctor_id = d.id
      WHERE o.patient_id = ?
    `).get(patient.id);

    res.json({
      ...patient,
      appointments,
      orthoPlan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patients', (req, res) => {
  try {
    const {
      first_name, last_name, dni, birthdate, gender,
      phone, email, address, emergency_contact, emergency_phone,
      medical_history, has_orthodontics, photo_url
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO patients (
        first_name, last_name, dni, birthdate, gender,
        phone, email, address, emergency_contact, emergency_phone,
        medical_history, has_orthodontics, photo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      first_name, last_name, dni, birthdate || null, gender || 'No especificado',
      phone || '', email || '', address || '', emergency_contact || '', emergency_phone || '',
      medical_history || '', has_orthodontics ? 1 : 0, photo_url || ''
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Paciente registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/patients/:id', (req, res) => {
  try {
    const {
      first_name, last_name, dni, birthdate, gender,
      phone, email, address, emergency_contact, emergency_phone,
      medical_history, has_orthodontics, photo_url
    } = req.body;

    db.prepare(`
      UPDATE patients SET
        first_name = ?, last_name = ?, dni = ?, birthdate = ?, gender = ?,
        phone = ?, email = ?, address = ?, emergency_contact = ?, emergency_phone = ?,
        medical_history = ?, has_orthodontics = ?, photo_url = ?
      WHERE id = ?
    `).run(
      first_name, last_name, dni, birthdate, gender,
      phone, email, address, emergency_contact, emergency_phone,
      medical_history, has_orthodontics ? 1 : 0, photo_url, req.params.id
    );

    res.json({ message: 'Paciente actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/patients/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
    res.json({ message: 'Paciente eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. ENDPOINTS: CITAS (APPOINTMENTS)
// ==========================================

app.get('/api/appointments', (req, res) => {
  try {
    const { date, startDate, endDate, doctorId, patientId, status } = req.query;

    let query = `
      SELECT 
        a.*,
        p.first_name, p.last_name, p.dni, p.phone as patient_phone, p.photo_url as patient_photo, p.has_orthodontics,
        d.name as doctor_name, d.specialty as doctor_specialty, d.color as doctor_color, d.avatar as doctor_avatar
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ` AND a.appointment_date = ?`;
      params.push(date);
    }
    if (startDate && endDate) {
      query += ` AND a.appointment_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    if (doctorId) {
      query += ` AND a.doctor_id = ?`;
      params.push(doctorId);
    }
    if (patientId) {
      query += ` AND a.patient_id = ?`;
      params.push(patientId);
    }
    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY a.appointment_date ASC, a.start_time ASC`;
    const appointments = db.prepare(query).all(...params);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const {
      patient_id, doctor_id, appointment_date, start_time,
      duration_minutes, treatment_type, status, dental_chair, notes, cost
    } = req.body;

    const duration = duration_minutes || 30;

    // Calcular end_time a partir de start_time y duración
    const [h, m] = start_time.split(':').map(Number);
    const endMinutesTotal = h * 60 + m + duration;
    const end_time = `${String(Math.floor(endMinutesTotal / 60)).padStart(2, '0')}:${String(endMinutesTotal % 60).padStart(2, '0')}`;

    // Verificar si hay colisión de horario con otra cita activa del mismo doctor
    const collision = db.prepare(`
      SELECT id FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('Cancelada')
      AND (
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND start_time < ?)
      )
    `).get(doctor_id, appointment_date, end_time, start_time, start_time, end_time);

    if (collision) {
      return res.status(409).json({
        error: 'El doctor ya tiene una cita agendada en ese horario. Por favor seleccione otro turno.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, start_time, end_time, duration_minutes,
        treatment_type, status, dental_chair, notes, cost, paid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      patient_id, doctor_id, appointment_date, start_time, end_time, duration,
      treatment_type, status || 'Programada', dental_chair || 'Sillón 1', notes || '', cost || 0.0, 0.0
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Cita programada con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/appointments/:id', (req, res) => {
  try {
    const {
      patient_id, doctor_id, appointment_date, start_time,
      duration_minutes, treatment_type, status, dental_chair, notes, cost, paid
    } = req.body;

    const duration = duration_minutes || 30;
    const [h, m] = start_time.split(':').map(Number);
    const endMinutesTotal = h * 60 + m + duration;
    const end_time = `${String(Math.floor(endMinutesTotal / 60)).padStart(2, '0')}:${String(endMinutesTotal % 60).padStart(2, '0')}`;

    db.prepare(`
      UPDATE appointments SET
        patient_id = ?, doctor_id = ?, appointment_date = ?, start_time = ?, end_time = ?,
        duration_minutes = ?, treatment_type = ?, status = ?, dental_chair = ?, notes = ?, cost = ?, paid = ?
      WHERE id = ?
    `).run(
      patient_id, doctor_id, appointment_date, start_time, end_time,
      duration, treatment_type, status, dental_chair, notes, cost || 0.0, paid || 0.0, req.params.id
    );

    res.json({ message: 'Cita actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambio rápido de estado de la cita (ej: Confirmada, En Sala, En Consulta, Finalizada)
app.patch('/api/appointments/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: `Estado de la cita cambiado a ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Cita eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. ENDPOINTS: ODONTOGRAMA INTERACTIVO
// ==========================================

// Obtener estado completo del odontograma de un paciente
app.get('/api/odontogram/:patientId', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const teeth = db.prepare('SELECT * FROM odontogram_teeth WHERE patient_id = ?').all(patientId);
    const records = db.prepare(`
      SELECT r.*, d.name as doctor_name
      FROM odontogram_records r
      LEFT JOIN doctors d ON r.doctor_id = d.id
      WHERE r.patient_id = ?
      ORDER BY r.date DESC, r.id DESC
    `).all(patientId);

    res.json({
      teeth: teeth.map(t => ({
        ...t,
        surfaces: JSON.parse(t.surfaces || '{}')
      })),
      records
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar/Actualizar una pieza dental en el odontograma
app.post('/api/odontogram/:patientId/tooth', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { tooth_number, condition, surfaces, notes } = req.body;

    const surfacesStr = typeof surfaces === 'object' ? JSON.stringify(surfaces) : (surfaces || '{}');

    db.prepare(`
      INSERT INTO odontogram_teeth (patient_id, tooth_number, condition, surfaces, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(patient_id, tooth_number) DO UPDATE SET
        condition = excluded.condition,
        surfaces = excluded.surfaces,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `).run(patientId, tooth_number, condition || 'sano', surfacesStr, notes || '');

    res.json({ message: `Diente ${tooth_number} actualizado en el odontograma` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar evolución o registro de diagnóstico del odontograma
app.post('/api/odontogram/:patientId/record', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { doctor_id, date, general_diagnosis, treatment_plan, notes } = req.body;

    const result = db.prepare(`
      INSERT INTO odontogram_records (patient_id, doctor_id, date, general_diagnosis, treatment_plan, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      patientId,
      doctor_id || null,
      date || new Date().toISOString().split('T')[0],
      general_diagnosis || '',
      treatment_plan || '',
      notes || ''
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Diagnóstico guardado en la ficha odontológica' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. ENDPOINTS: MÓDULO DE ORTODONCIA
// ==========================================

// Obtener plan de ortodoncia, mapa de brackets y controles del paciente
app.get('/api/orthodontics/:patientId', (req, res) => {
  try {
    const patientId = req.params.patientId;

    const plan = db.prepare(`
      SELECT o.*, d.name as doctor_name, d.specialty as doctor_specialty
      FROM orthodontic_plans o
      JOIN doctors d ON o.doctor_id = d.id
      WHERE o.patient_id = ?
    `).get(patientId);

    const bracketsMap = db.prepare(`
      SELECT * FROM orthodontic_brackets_map WHERE patient_id = ? ORDER BY tooth_number ASC
    `).all(patientId);

    const controls = db.prepare(`
      SELECT c.*, d.name as doctor_name
      FROM orthodontic_controls c
      JOIN doctors d ON c.doctor_id = d.id
      WHERE c.patient_id = ?
      ORDER BY c.session_number DESC, c.date DESC
    `).all(patientId);

    res.json({
      plan: plan || null,
      bracketsMap,
      controls
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear o actualizar plan de ortodoncia
app.post('/api/orthodontics/:patientId/plan', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const {
      doctor_id, start_date, estimated_months, bracket_type,
      current_phase, progress_percent, upper_arch_current, lower_arch_current,
      ligature_type, ligature_color, elastics, appliances, total_cost, monthly_fee, status, notes
    } = req.body;

    // Actualizar también la bandera en el paciente
    db.prepare('UPDATE patients SET has_orthodontics = 1 WHERE id = ?').run(patientId);

    const existing = db.prepare('SELECT id FROM orthodontic_plans WHERE patient_id = ?').get(patientId);

    if (existing) {
      db.prepare(`
        UPDATE orthodontic_plans SET
          doctor_id = ?, start_date = ?, estimated_months = ?, bracket_type = ?,
          current_phase = ?, progress_percent = ?, upper_arch_current = ?, lower_arch_current = ?,
          ligature_type = ?, ligature_color = ?, elastics = ?, appliances = ?,
          total_cost = ?, monthly_fee = ?, status = ?, notes = ?
        WHERE patient_id = ?
      `).run(
        doctor_id, start_date, estimated_months, bracket_type,
        current_phase, progress_percent, upper_arch_current, lower_arch_current,
        ligature_type, ligature_color, elastics, appliances,
        total_cost, monthly_fee, status || 'Activo', notes || '', patientId
      );
    } else {
      db.prepare(`
        INSERT INTO orthodontic_plans (
          patient_id, doctor_id, start_date, estimated_months, bracket_type,
          current_phase, progress_percent, upper_arch_current, lower_arch_current,
          ligature_type, ligature_color, elastics, appliances, total_cost, monthly_fee, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        patientId, doctor_id, start_date, estimated_months, bracket_type,
        current_phase || 'Alineación y Nivelación', progress_percent || 0,
        upper_arch_current || 'NiTi .012', lower_arch_current || 'NiTi .012',
        ligature_type || 'Elastoméricas', ligature_color || '#3b82f6',
        elastics || '', appliances || '', total_cost || 1200.0, monthly_fee || 60.0,
        status || 'Activo', notes || ''
      );

      // Inicializar mapa de brackets para todos los dientes de arcada ortodóntica (17..27 y 47..37)
      const teethList = [
        17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27,
        47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37
      ];
      const insertBracket = db.prepare(`
        INSERT OR IGNORE INTO orthodontic_brackets_map (patient_id, tooth_number, bracket_status, prescription, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      teethList.forEach(t => {
        const isMolar = [16, 26, 36, 46, 17, 27, 37, 47].includes(t);
        insertBracket.run(patientId, t, isMolar ? 'tubo' : 'bracket_ok', `${bracket_type} 0.022`, 'OK');
      });
    }

    res.json({ message: 'Plan de ortodoncia actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar bracket individual en el mapa ortodóntico
app.post('/api/orthodontics/:patientId/bracket', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { tooth_number, bracket_status, prescription, notes } = req.body;

    db.prepare(`
      INSERT INTO orthodontic_brackets_map (patient_id, tooth_number, bracket_status, prescription, notes)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(patient_id, tooth_number) DO UPDATE SET
        bracket_status = excluded.bracket_status,
        prescription = excluded.prescription,
        notes = excluded.notes
    `).run(patientId, tooth_number, bracket_status, prescription || '', notes || '');

    res.json({ message: `Estado del bracket en pieza ${tooth_number} actualizado` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar sesión de control de ortodoncia
app.post('/api/orthodontics/:patientId/control', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const {
      doctor_id, appointment_id, date, phase, upper_arch, lower_arch,
      ligatures, ligature_color, elastics_prescribed, adjustments_made,
      hygiene_score, pain_level, brackets_replaced_count, next_appointment_goals,
      doctor_notes, cost, paid
    } = req.body;

    // Obtener siguiente número de sesión
    const lastSession = db.prepare('SELECT MAX(session_number) as max_session FROM orthodontic_controls WHERE patient_id = ?').get(patientId);
    const session_number = (lastSession?.max_session || 0) + 1;

    const stmt = db.prepare(`
      INSERT INTO orthodontic_controls (
        patient_id, doctor_id, appointment_id, date, session_number, phase,
        upper_arch, lower_arch, ligatures, ligature_color, elastics_prescribed,
        adjustments_made, hygiene_score, pain_level, brackets_replaced_count,
        next_appointment_goals, doctor_notes, cost, paid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      patient_id, doctor_id, appointment_id || null, date || new Date().toISOString().split('T')[0],
      session_number, phase, upper_arch, lower_arch,
      ligatures || 'Elastoméricas', ligature_color || '#3b82f6', elastics_prescribed || '',
      adjustments_made, hygiene_score || 'Buena', pain_level || 1, brackets_replaced_count || 0,
      next_appointment_goals || '', doctor_notes || '', cost || 60.0, paid ? 1 : 0
    );

    // Actualizar el plan activo con los nuevos arcos, ligas y fase
    db.prepare(`
      UPDATE orthodontic_plans SET
        current_phase = ?, upper_arch_current = ?, lower_arch_current = ?,
        ligature_type = ?, ligature_color = ?, elastics = ?
      WHERE patient_id = ?
    `).run(phase, upper_arch, lower_arch, ligatures || 'Elastoméricas', ligature_color || '#3b82f6', elastics_prescribed || '', patientId);

    // Si hubo recementado de brackets, marcar como reparados en el mapa
    if (brackets_replaced_count > 0) {
      db.prepare(`
        UPDATE orthodontic_brackets_map SET bracket_status = 'bracket_ok', notes = 'Recementado en sesión ' || ?
        WHERE patient_id = ? AND bracket_status = 'bracket_caido'
      `).run(session_number, patientId);
    }

    res.status(201).json({ id: result.lastInsertRowid, session_number, message: 'Control de ortodoncia registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. ENDPOINTS: REPORTES Y ANALÍTICAS
// ==========================================

// KPIs de Inicio / Dashboard
app.get('/api/reports/dashboard', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Citas de hoy
    const appointmentsToday = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?').get(today).count;
    
    // Pacientes en sala de espera hoy
    const waitingPatients = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status = 'En Espera'`).get(today).count;

    // Total de pacientes activos en ortodoncia
    const activeOrthoCases = db.prepare(`SELECT COUNT(*) as count FROM orthodontic_plans WHERE status = 'Activo'`).get().count;

    // Ingresos del mes en curso
    const monthPrefix = today.substring(0, 7); // YYYY-MM
    const monthlyRevenue = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date LIKE ?`).get(`${monthPrefix}%`).total;

    // Tasa de asistencia histórica
    const totalDone = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE status = 'Finalizada'`).get().count;
    const totalMissed = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE status = 'No Asistio'`).get().count;
    const attendanceRate = (totalDone + totalMissed > 0) ? Math.round((totalDone / (totalDone + totalMissed)) * 100) : 95;

    // Citas de hoy con detalle
    const todayAppointments = db.prepare(`
      SELECT a.*, p.first_name, p.last_name, p.dni, p.phone as patient_phone, d.name as doctor_name, d.color as doctor_color
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.appointment_date = ?
      ORDER BY a.start_time ASC
    `).all(today);

    // Doctores activos y sus turnos hoy
    const dayOfWeek = new Date().getDay();
    const doctorsToday = db.prepare(`
      SELECT d.name, d.specialty, d.avatar, s.start_time, s.end_time, s.dental_chair
      FROM doctor_schedules s
      JOIN doctors d ON s.doctor_id = d.id
      WHERE s.day_of_week = ? AND s.is_active = 1
    `).all(dayOfWeek);

    res.json({
      kpis: {
        appointmentsToday,
        waitingPatients,
        activeOrthoCases,
        monthlyRevenue,
        attendanceRate
      },
      todayAppointments,
      doctorsToday
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reporte de Citas
app.get('/api/reports/appointments', (req, res) => {
  try {
    // Por estado
    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM appointments GROUP BY status
    `).all();

    // Por doctor
    const byDoctor = db.prepare(`
      SELECT d.name as doctor_name, d.specialty, COUNT(a.id) as total_appointments,
        SUM(CASE WHEN a.status = 'Finalizada' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN a.status = 'Cancelada' THEN 1 ELSE 0 END) as cancelled
      FROM doctors d
      LEFT JOIN appointments a ON d.id = a.doctor_id
      GROUP BY d.id
    `).all();

    // Por tipo de tratamiento
    const byTreatment = db.prepare(`
      SELECT treatment_type, COUNT(*) as count FROM appointments GROUP BY treatment_type ORDER BY count DESC LIMIT 6
    `).all();

    res.json({
      byStatus,
      byDoctor,
      byTreatment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reporte de Ortodoncia
app.get('/api/reports/orthodontics', (req, res) => {
  try {
    // Distribución por fase de ortodoncia
    const byPhase = db.prepare(`
      SELECT current_phase as phase, COUNT(*) as count
      FROM orthodontic_plans
      WHERE status = 'Activo'
      GROUP BY current_phase
    `).all();

    // Distribución por tipo de bracket
    const byBracketType = db.prepare(`
      SELECT bracket_type, COUNT(*) as count
      FROM orthodontic_plans
      GROUP BY bracket_type
    `).all();

    // Estadísticas de caídas de brackets
    const brokenBrackets = db.prepare(`
      SELECT COUNT(*) as count FROM orthodontic_brackets_map WHERE bracket_status = 'bracket_caido'
    `).get().count;

    // Pacientes con brackets desprendidos actualmente
    const patientsWithBrokenBrackets = db.prepare(`
      SELECT DISTINCT p.id, p.first_name, p.last_name, p.phone, b.tooth_number
      FROM orthodontic_brackets_map b
      JOIN patients p ON b.patient_id = p.id
      WHERE b.bracket_status = 'bracket_caido'
    `).all();

    res.json({
      byPhase,
      byBracketType,
      brokenBrackets,
      patientsWithBrokenBrackets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reporte Financiero
app.get('/api/reports/financial', (req, res) => {
  try {
    // Pagos recientes
    const recentPayments = db.prepare(`
      SELECT p.*, pt.first_name, pt.last_name, d.name as doctor_name
      FROM payments p
      JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      ORDER BY p.payment_date DESC
      LIMIT 10
    `).all();

    // Total recaudado por método de pago
    const byMethod = db.prepare(`
      SELECT payment_method, SUM(amount) as total
      FROM payments
      GROUP BY payment_method
    `).all();

    // Ingresos mensuales acumulados
    const monthly = db.prepare(`
      SELECT SUBSTR(payment_date, 1, 7) as month, SUM(amount) as total
      FROM payments
      GROUP BY SUBSTR(payment_date, 1, 7)
      ORDER BY month ASC
    `).all();

    res.json({
      recentPayments,
      byMethod,
      monthly
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// 7. ENDPOINTS: HISTORIA CLÍNICA, EVOLUCIÓN, RADIODIAGNÓSTICO Y RECETAS
// =========================================================================

// 7.1 Obtener Ficha de Historia Clínica Integral, Evoluciones, Rayos X y Recetas de un Paciente
app.get('/api/clinical-record/:patientId', (req, res) => {
  try {
    const patientId = req.params.patientId;

    const history = db.prepare(`
      SELECT h.*, d.name as doctor_name, d.specialty as doctor_specialty
      FROM clinical_histories h
      LEFT JOIN doctors d ON h.doctor_id = d.id
      WHERE h.patient_id = ?
    `).get(patientId);

    const evolutions = db.prepare(`
      SELECT e.*, d.name as doctor_name, d.specialty as doctor_specialty, d.license_number as doctor_license
      FROM clinical_evolutions e
      JOIN doctors d ON e.doctor_id = d.id
      WHERE e.patient_id = ?
      ORDER BY e.evolution_date DESC, e.id DESC
    `).all(patientId);

    const radiologyExams = db.prepare(`
      SELECT r.*, d.name as doctor_name, d.specialty as doctor_specialty
      FROM radiology_exams r
      JOIN doctors d ON r.doctor_id = d.id
      WHERE r.patient_id = ?
      ORDER BY r.exam_date DESC, r.id DESC
    `).all(patientId);

    const prescriptions = db.prepare(`
      SELECT pr.*, d.name as doctor_name, d.specialty as doctor_specialty, d.license_number as doctor_license, d.phone as doctor_phone
      FROM prescriptions pr
      JOIN doctors d ON pr.doctor_id = d.id
      WHERE pr.patient_id = ?
      ORDER BY pr.prescription_date DESC, pr.id DESC
    `).all(patientId).map(p => ({
      ...p,
      medications: JSON.parse(p.medications_json || '[]')
    }));

    res.json({
      history: history || null,
      evolutions,
      radiologyExams,
      prescriptions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7.2 Guardar o Actualizar Historia Clínica Estomatológica (Anamnesis, Triaje, Examen Clínico)
app.post('/api/clinical-history/:patientId', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const {
      doctor_id, blood_type, allergies, systemic_diseases, current_medications,
      habits, blood_pressure, heart_rate, temperature, extraoral_exam,
      intraoral_exam, occlusion_class, oral_hygiene_index, presumptive_diagnosis,
      definitive_diagnosis, prognosis, informed_consent_signed
    } = req.body;

    // Sincronizar también el resumen de alergias/antecedentes en la tabla patients
    if (allergies || systemic_diseases) {
      const combinedMedical = [allergies, systemic_diseases].filter(Boolean).join(' | ');
      db.prepare('UPDATE patients SET medical_history = ? WHERE id = ?').run(combinedMedical, patientId);
    }

    const existing = db.prepare('SELECT id FROM clinical_histories WHERE patient_id = ?').get(patientId);

    if (existing) {
      db.prepare(`
        UPDATE clinical_histories SET
          doctor_id = ?, blood_type = ?, allergies = ?, systemic_diseases = ?,
          current_medications = ?, habits = ?, blood_pressure = ?, heart_rate = ?,
          temperature = ?, extraoral_exam = ?, intraoral_exam = ?, occlusion_class = ?,
          oral_hygiene_index = ?, presumptive_diagnosis = ?, definitive_diagnosis = ?,
          prognosis = ?, informed_consent_signed = ?, updated_at = CURRENT_TIMESTAMP
        WHERE patient_id = ?
      `).run(
        doctor_id || 1, blood_type || 'O+', allergies || '', systemic_diseases || '',
        current_medications || '', habits || '', blood_pressure || '120/80 mmHg', heart_rate || '72 lpm',
        temperature || '36.6 °C', extraoral_exam || '', intraoral_exam || '', occlusion_class || 'Clase I de Angle',
        oral_hygiene_index || 'Buena', presumptive_diagnosis || '', definitive_diagnosis || '',
        prognosis || 'Favorable', informed_consent_signed ? 1 : 0, patientId
      );
    } else {
      db.prepare(`
        INSERT INTO clinical_histories (
          patient_id, doctor_id, blood_type, allergies, systemic_diseases,
          current_medications, habits, blood_pressure, heart_rate, temperature,
          extraoral_exam, intraoral_exam, occlusion_class, oral_hygiene_index,
          presumptive_diagnosis, definitive_diagnosis, prognosis, informed_consent_signed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        patientId, doctor_id || 1, blood_type || 'O+', allergies || '', systemic_diseases || '',
        current_medications || '', habits || '', blood_pressure || '120/80 mmHg', heart_rate || '72 lpm',
        temperature || '36.6 °C', extraoral_exam || '', intraoral_exam || '', occlusion_class || 'Clase I de Angle',
        oral_hygiene_index || 'Buena', presumptive_diagnosis || '', definitive_diagnosis || '',
        prognosis || 'Favorable', informed_consent_signed ? 1 : 0
      );
    }

    res.json({ message: 'Historia clínica estomatológica actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7.3 Registrar nueva Evolución Clínica / Acto Operatorio por Sesión
app.post('/api/evolutions/:patientId', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const {
      doctor_id, evolution_date, tooth_number, procedure_performed,
      anesthesia_used, materials_used, clinical_notes, post_op_indications,
      next_step, treatment_status, cost
    } = req.body;

    const result = db.prepare(`
      INSERT INTO clinical_evolutions (
        patient_id, doctor_id, evolution_date, tooth_number, procedure_performed,
        anesthesia_used, materials_used, clinical_notes, post_op_indications,
        next_step, treatment_status, cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      patientId,
      doctor_id || 1,
      evolution_date || new Date().toISOString().split('T')[0],
      tooth_number || 'General',
      procedure_performed,
      anesthesia_used || 'No requerida',
      materials_used || '',
      clinical_notes,
      post_op_indications || '',
      next_step || '',
      treatment_status || 'Completado',
      cost || 0.0
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Evolución clínica registrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/evolutions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM clinical_evolutions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Registro de evolución eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7.4 Subir / Registrar Examen de Radiodiagnóstico o Rayos X
app.post('/api/radiology/:patientId', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const {
      doctor_id, exam_date, exam_type, tooth_area,
      title, image_url, radiological_findings, radiation_dose
    } = req.body;

    const result = db.prepare(`
      INSERT INTO radiology_exams (
        patient_id, doctor_id, exam_date, exam_type, tooth_area,
        title, image_url, radiological_findings, radiation_dose
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      patientId,
      doctor_id || 1,
      exam_date || new Date().toISOString().split('T')[0],
      exam_type || 'Radiografía Periapical Digital',
      tooth_area || 'General',
      title,
      image_url,
      radiological_findings || '',
      radiation_dose || 'Baja (Digital RVG)'
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Examen radiológico subido exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/radiology/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM radiology_exams WHERE id = ?').run(req.params.id);
    res.json({ message: 'Estudio radiológico eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7.5 Emitir Receta Odontológica (Prescripción Rx)
app.post('/api/prescriptions/:patientId', (req, res) => {
  try {
    const patientId = req.params.patientId;
    const {
      doctor_id, prescription_date, diagnosis,
      medications, general_recommendations, valid_until
    } = req.body;

    const medicationsStr = typeof medications === 'string' ? medications : JSON.stringify(medications || []);

    const result = db.prepare(`
      INSERT INTO prescriptions (
        patient_id, doctor_id, prescription_date, diagnosis,
        medications_json, general_recommendations, valid_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      patientId,
      doctor_id || 1,
      prescription_date || new Date().toISOString().split('T')[0],
      diagnosis,
      medicationsStr,
      general_recommendations || '',
      valid_until || ''
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Receta médica odontológica emitida exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/prescriptions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM prescriptions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Receta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir frontend compilado
const path = require('node:path');
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Odontológico DentalGravity ejecutándose en el puerto ${PORT}`);
});

