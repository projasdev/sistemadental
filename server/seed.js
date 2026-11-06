const { db, initDatabase } = require('./db');

// Generadores de imágenes radiográficas dentales SVG de alta definición para demostración clínica inmediata
const PANORAMIC_XRAY_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 450" width="900" height="450">
  <defs>
    <radialGradient id="xrayGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="65%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <filter id="blurBone">
      <feGaussianBlur stdDeviation="2.5" />
    </filter>
  </defs>
  <rect width="900" height="450" fill="url(#xrayGlow)"/>
  <!-- Marcas radiológicas -->
  <text x="30" y="40" fill="#94a3b8" font-family="monospace" font-size="16" font-weight="bold">R [DER]</text>
  <text x="810" y="40" fill="#94a3b8" font-family="monospace" font-size="16" font-weight="bold">L [IZQ]</text>
  <text x="340" y="30" fill="#cbd5e1" font-family="monospace" font-size="13">ORTOPANTOMOGRAFIA DIGITAL HD - RVG PANORAMIC</text>
  <!-- Contorno Maxilar y Mandibular -->
  <path d="M 110 120 Q 450 210 790 120" fill="none" stroke="#64748b" stroke-width="28" opacity="0.35" filter="url(#blurBone)"/>
  <path d="M 90 160 Q 110 350 450 370 Q 790 350 810 160" fill="none" stroke="#94a3b8" stroke-width="36" opacity="0.35" filter="url(#blurBone)"/>
  <!-- Senos Maxilares -->
  <ellipse cx="290" cy="125" rx="65" ry="35" fill="#090d16" stroke="#475569" stroke-width="2" opacity="0.7"/>
  <ellipse cx="610" cy="125" rx="65" ry="35" fill="#090d16" stroke="#475569" stroke-width="2" opacity="0.7"/>
  <!-- Dientes Superiores (Raíces + Coronas + Brackets/Arco) -->
  <g fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5" opacity="0.9">
    <!-- Molares y Premolares Sup Der -->
    <rect x="180" y="165" width="24" height="22" rx="5"/><path d="M185 165 L182 130 M198 165 L202 130" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="212" y="168" width="24" height="22" rx="5" fill="#ffffff"/><path d="M217 168 L215 132 M229 168 L233 132" stroke="#ffffff" stroke-width="4"/>
    <rect x="244" y="172" width="18" height="22" rx="4"/><path d="M253 172 L252 136" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="268" y="175" width="18" height="22" rx="4"/><path d="M277 175 L276 138" stroke="#cbd5e1" stroke-width="4"/>
    <!-- Anteriores Superiores -->
    <rect x="292" y="177" width="18" height="24" rx="4"/><path d="M301 177 L300 130" stroke="#cbd5e1" stroke-width="4.5"/>
    <rect x="316" y="179" width="17" height="23" rx="3"/><path d="M324 179 L324 140" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="339" y="180" width="21" height="25" rx="3"/><path d="M349 180 L349 138" stroke="#cbd5e1" stroke-width="5"/>
    <rect x="366" y="180" width="21" height="25" rx="3"/><path d="M376 180 L376 138" stroke="#cbd5e1" stroke-width="5"/>
    <rect x="393" y="179" width="17" height="23" rx="3"/><path d="M401 179 L401 140" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="416" y="177" width="18" height="24" rx="4"/><path d="M425 177 L426 130" stroke="#cbd5e1" stroke-width="4.5"/>
    <!-- Premolares y Molares Sup Izq -->
    <rect x="440" y="175" width="18" height="22" rx="4"/><path d="M449 175 L450 138" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="464" y="172" width="18" height="22" rx="4"/><path d="M473 172 L474 136" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="488" y="168" width="24" height="22" rx="5" fill="#ffffff"/><path d="M494 168 L492 132 M506 168 L510 132" stroke="#ffffff" stroke-width="4"/>
    <rect x="520" y="165" width="24" height="22" rx="5"/><path d="M525 165 L523 130 M538 165 L542 130" stroke="#cbd5e1" stroke-width="4"/>
  </g>
  <!-- Arco Ortodóntico Radiopaco Superior -->
  <path d="M 185 182 Q 362 198 538 182" fill="none" stroke="#ffffff" stroke-width="2.5"/>
  <!-- Dientes Inferiores -->
  <g fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5" opacity="0.9" transform="translate(80, 0)">
    <rect x="120" y="235" width="25" height="22" rx="5"/><path d="M126 257 L124 298 M139 257 L142 298" stroke="#cbd5e1" stroke-width="4.5"/>
    <rect x="152" y="238" width="25" height="22" rx="5"/><path d="M158 260 L156 300 M171 260 L174 300" stroke="#ffffff" stroke-width="4.5"/>
    <rect x="184" y="240" width="18" height="22" rx="4"/><path d="M193 262 L193 302" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="208" y="241" width="18" height="22" rx="4"/><path d="M217 263 L217 302" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="232" y="242" width="17" height="22" rx="4"/><path d="M240 264 L240 306" stroke="#cbd5e1" stroke-width="4.5"/>
    <rect x="255" y="242" width="15" height="21" rx="3"/><path d="M262 263 L262 300" stroke="#cbd5e1" stroke-width="3.5"/>
    <rect x="275" y="242" width="14" height="21" rx="3"/><path d="M282 263 L282 298" stroke="#cbd5e1" stroke-width="3.5"/>
    <rect x="294" y="242" width="14" height="21" rx="3"/><path d="M301 263 L301 298" stroke="#cbd5e1" stroke-width="3.5"/>
    <rect x="313" y="242" width="15" height="21" rx="3"/><path d="M320 263 L320 300" stroke="#cbd5e1" stroke-width="3.5"/>
    <rect x="333" y="242" width="17" height="22" rx="4"/><path d="M341 264 L341 306" stroke="#cbd5e1" stroke-width="4.5"/>
    <rect x="356" y="241" width="18" height="22" rx="4"/><path d="M365 263 L365 302" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="380" y="240" width="18" height="22" rx="4"/><path d="M389 262 L389 302" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="404" y="238" width="25" height="22" rx="5"/><path d="M410 260 L408 300 M423 260 L426 300" stroke="#cbd5e1" stroke-width="4.5"/>
    <rect x="436" y="235" width="25" height="22" rx="5"/><path d="M442 257 L440 298 M455 257 L458 298" stroke="#cbd5e1" stroke-width="4.5"/>
  </g>
  <!-- Conducto Mandibular / Nervio Dentario Inferior -->
  <path d="M 140 270 Q 260 335 390 335" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5,5" opacity="0.6"/>
  <path d="M 760 270 Q 640 335 510 335" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5,5" opacity="0.6"/>
  <text x="30" y="425" fill="#64748b" font-family="monospace" font-size="12">KV: 72 | mA: 8.0 | T: 14.2s | DOSIS: 12.4 uGy.m2 | ESCALA 1:1</text>
</svg>`);

const PERIAPICAL_XRAY_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#090d16"/>
  <rect x="20" y="20" width="460" height="460" rx="25" fill="#1e293b" stroke="#475569" stroke-width="3"/>
  <text x="40" y="55" fill="#94a3b8" font-family="monospace" font-size="14" font-weight="bold">RVG PERIAPICAL DIGITAL - PIEZAS 35, 36, 37</text>
  <!-- Hueso Alveolar Trabeculado -->
  <rect x="30" y="210" width="440" height="230" fill="#334155" opacity="0.5"/>
  <!-- Pieza 35 (Premolar) -->
  <rect x="75" y="135" width="75" height="75" rx="14" fill="#e2e8f0"/>
  <path d="M 95 210 L 105 375 L 125 210 Z" fill="#cbd5e1"/>
  <!-- Pieza 36 (Molar con Endodoncia Radiopaca Brillante + Corona) -->
  <rect x="195" y="125" width="115" height="85" rx="18" fill="#ffffff" stroke="#f8fafc" stroke-width="3"/>
  <path d="M 210 210 L 200 395 L 240 210 Z" fill="#cbd5e1"/>
  <path d="M 265 210 L 295 390 L 300 210 Z" fill="#cbd5e1"/>
  <!-- Gutapercha / Conductos Obturados en Blanco Puro -->
  <line x1="222" y1="165" x2="203" y2="388" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
  <line x1="280" y1="165" x2="293" y2="383" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
  <circle cx="203" cy="396" r="16" fill="#090d16" opacity="0.6"/>
  <!-- Pieza 37 (Segundo Molar) -->
  <rect x="350" y="135" width="100" height="80" rx="16" fill="#e2e8f0"/>
  <path d="M 365 215 L 365 380 L 395 215 Z" fill="#cbd5e1"/>
  <path d="M 405 215 L 430 378 L 438 215 Z" fill="#cbd5e1"/>
  <text x="40" y="460" fill="#38bdf8" font-family="monospace" font-size="12">CONTROL ENDODONTICO OBTURACION DE CONDUCTOS PZA 36</text>
</svg>`);

const CBCT_IMPLANT_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="#020617"/>
  <text x="25" y="40" fill="#38bdf8" font-family="monospace" font-size="14" font-weight="bold">TOMOGRAFIA CONE BEAM 3D (CBCT) - CORTE SAGITAL PZA 16</text>
  <!-- Grilla milimetrada tomográfica -->
  <g stroke="#1e293b" stroke-width="1">
    <line x1="0" y1="100" x2="500" y2="100"/><line x1="0" y1="200" x2="500" y2="200"/>
    <line x1="0" y1="300" x2="500" y2="300"/><line x1="0" y1="400" x2="500" y2="400"/>
    <line x1="100" y1="0" x2="100" y2="500"/><line x1="200" y1="0" x2="200" y2="500"/>
    <line x1="300" y1="0" x2="300" y2="500"/><line x1="400" y1="0" x2="400" y2="500"/>
  </g>
  <!-- Cortical ósea maxilar -->
  <path d="M 140 120 Q 250 140 360 120 L 340 350 Q 250 365 160 350 Z" fill="#334155" stroke="#94a3b8" stroke-width="4" opacity="0.8"/>
  <!-- Implante de Titanio Straumann simulado -->
  <g stroke="#ffffff" stroke-width="3" fill="#f8fafc">
    <rect x="225" y="165" width="50" height="150" rx="8" fill="#e2e8f0"/>
    <line x1="220" y1="185" x2="280" y2="185" stroke-width="4"/>
    <line x1="220" y1="205" x2="280" y2="205" stroke-width="4"/>
    <line x1="220" y1="225" x2="280" y2="225" stroke-width="4"/>
    <line x1="220" y1="245" x2="280" y2="245" stroke-width="4"/>
    <line x1="220" y1="265" x2="280" y2="265" stroke-width="4"/>
    <line x1="220" y1="285" x2="280" y2="285" stroke-width="4"/>
  </g>
  <!-- Medición digital en mm -->
  <line x1="310" y1="165" x2="310" y2="315" stroke="#10b981" stroke-width="2"/>
  <text x="320" y="245" fill="#10b981" font-family="monospace" font-size="14" font-weight="bold">L = 11.5 mm / Ø 4.1 mm</text>
  <text x="25" y="465" fill="#94a3b8" font-family="monospace" font-size="12">DENSIDAD OSEA: D2 (850 HU) | DISTANCIA A SENO MAXILAR: 2.4 mm</text>
</svg>`);

function seed() {
  initDatabase();

  // Comprobar si ya existen doctores base
  const doctorsCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
  if (doctorsCount === 0) {
    console.log('🌱 Sembrando datos iniciales de la clínica dental...');

    // 1. Doctores
    const insertDoctor = db.prepare(`
      INSERT INTO doctors (name, specialty, email, phone, license_number, color, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const doc1 = insertDoctor.run(
      'Dr. Mateo Morales',
      'Ortodoncia y Ortopedia Dentofacial',
      'mateo.morales@clinicadental.com',
      '+51 987 654 321',
      'COP-34821',
      '#0ea5e9',
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256'
    );

    const doc2 = insertDoctor.run(
      'Dra. Sofía Valenzuela',
      'Odontología General y Estética',
      'sofia.valenzuela@clinicadental.com',
      '+51 976 543 210',
      'COP-41920',
      '#10b981',
      'https://images.unsplash.com/photo-1594824813576-2678d85fbf8f?auto=format&fit=crop&q=80&w=256'
    );

    const doc3 = insertDoctor.run(
      'Dr. Andrés Navarro',
      'Cirugía Oral y Periodoncia',
      'andres.navarro@clinicadental.com',
      '+51 965 432 109',
      'COP-29104',
      '#8b5cf6',
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=256'
    );

    const doc4 = insertDoctor.run(
      'Dra. Camila Rivas',
      'Odontopediatría y Ortodoncia Interceptiva',
      'camila.rivas@clinicadental.com',
      '+51 954 321 098',
      'COP-52319',
      '#f59e0b',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256'
    );

    // 2. Horarios de Doctores
    const insertSchedule = db.prepare(`
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, break_start, break_end, slot_duration_minutes, dental_chair)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    [1, 3, 5].forEach(day => {
      insertSchedule.run(doc1.lastInsertRowid, day, '08:30', '18:00', '13:00', '14:30', 30, 'Sillón Ortodoncia 1');
    });
    insertSchedule.run(doc1.lastInsertRowid, 6, '09:00', '14:00', null, null, 30, 'Sillón Ortodoncia 1');

    [1, 2, 3, 4, 5].forEach(day => {
      insertSchedule.run(doc2.lastInsertRowid, day, '08:00', '17:00', '13:00', '14:00', 45, 'Sillón Estética 2');
    });

    [2, 4].forEach(day => {
      insertSchedule.run(doc3.lastInsertRowid, day, '09:00', '19:00', '13:30', '15:00', 60, 'Sillón Quirúrgico 3');
    });

    [1, 2, 3, 4].forEach(day => {
      insertSchedule.run(doc4.lastInsertRowid, day, '09:00', '14:00', null, null, 30, 'Sillón Pediátrico 4');
    });
    insertSchedule.run(doc4.lastInsertRowid, 6, '09:00', '15:00', '12:30', '13:30', 30, 'Sillón Pediátrico 4');

    // 3. Bloqueos de Horario
    const insertBlock = db.prepare(`
      INSERT INTO schedule_blocks (doctor_id, title, start_datetime, end_datetime, reason)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertBlock.run(doc1.lastInsertRowid, 'Congreso Internacional de Ortodoncia', '2026-11-20 08:00', '2026-11-21 18:00', 'Capacitación en técnicas de autoligado');

    // 4. Pacientes
    const insertPatient = db.prepare(`
      INSERT INTO patients (first_name, last_name, dni, birthdate, gender, phone, email, address, emergency_contact, emergency_phone, medical_history, has_orthodontics, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const p1 = insertPatient.run(
      'Lucía', 'Fernández Ríos', '71829304', '2001-05-14', 'Femenino',
      '+51 912 345 678', 'lucia.fernandez@gmail.com', 'Av. San Martín 450, Miraflores',
      'Rosa Ríos (Madre)', '+51 981 112 233',
      'Alergia a la penicilina. Sin antecedentes sistémicos relevantes. Buena higiene.', 1,
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'
    );

    const p2 = insertPatient.run(
      'Carlos Eduardo', 'Benítez Mendoza', '74561238', '2007-09-22', 'Masculino',
      '+51 923 456 789', 'carlos.benitez@outlook.com', 'Calle Los Sauces 124, San Borja',
      'Eduardo Benítez (Padre)', '+51 982 223 344',
      'Respirador bucal. Mordida cruzada anterior en tratamiento. Ninguna alergia conocida.', 1,
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256'
    );

    const p3 = insertPatient.run(
      'Mariana', 'Gómez Saldaña', '45892301', '1995-11-03', 'Femenino',
      '+51 934 567 890', 'mariana.gomez@gmail.com', 'Jr. Junín 389, Surco',
      'Jorge Gómez (Hermano)', '+51 983 334 455',
      'Sensibilidad dental leve en molares inferiores. Bruxismo nocturno leve.', 0,
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
    );

    const p4 = insertPatient.run(
      'Alejandro', 'Torres Vega', '40918273', '1990-03-18', 'Masculino',
      '+51 945 678 901', 'atorres@empresa.com', 'Av. Javier Prado Este 2100, San Isidro',
      'Valeria Peña (Esposa)', '+51 984 445 566',
      'Hipertensión arterial controlada con Losartán 50mg. No fumador.', 1,
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
    );

    const p5 = insertPatient.run(
      'Valentina', 'Castro Paredes', '79820145', '2016-08-12', 'Femenino',
      '+51 956 789 012', 'familia.castro@hotmail.com', 'Av. Arequipa 1450, Lince',
      'Carmen Paredes (Madre)', '+51 985 556 677',
      'Dentición mixta. Hábito de succión digital superado. Sin alergias.', 0,
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256'
    );

    const p6 = insertPatient.run(
      'Roberto', 'Morales Silva', '10293847', '1976-12-05', 'Masculino',
      '+51 967 890 123', 'roberto.morales@corp.com', 'Calle El Polo 780, Surco',
      'Patricia de Morales (Esposa)', '+51 986 667 788',
      'Diabético tipo 2 controlado. Pérdida de piezas 16 y 46. Requiere implantes.', 0,
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256'
    );

    // 5. Odontograma Base
    const insertTooth = db.prepare(`
      INSERT INTO odontogram_teeth (patient_id, tooth_number, condition, surfaces, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertTooth.run(p1.lastInsertRowid, 16, 'obturado', JSON.stringify({ oclusal: 'obturado' }), 'Resina compuesta 3M en buen estado');
    insertTooth.run(p1.lastInsertRowid, 14, 'caries', JSON.stringify({ mesial: 'caries' }), 'Caries incipiente esmalte');
    insertTooth.run(p1.lastInsertRowid, 26, 'obturado', JSON.stringify({ oclusal: 'obturado', palatino: 'obturado' }), 'Obturación estética');
    insertTooth.run(p1.lastInsertRowid, 36, 'sellante', JSON.stringify({ oclusal: 'sellante' }), 'Sellante de fosas y fisuras');
    insertTooth.run(p1.lastInsertRowid, 46, 'obturado', JSON.stringify({ oclusal: 'obturado' }), 'Restauración Oclusal');
    insertTooth.run(p1.lastInsertRowid, 18, 'ausente', '{}', 'Tercer molar no erupcionado / agenesia');
    insertTooth.run(p1.lastInsertRowid, 28, 'ausente', '{}', 'Exodoncia preventiva realizada en 2024');

    insertTooth.run(p6.lastInsertRowid, 16, 'ausente', '{}', 'Pérdida por caries profunda. Plan de implante');
    insertTooth.run(p6.lastInsertRowid, 26, 'corona', JSON.stringify({ completo: 'corona' }), 'Corona de zirconio sobre metal');
    insertTooth.run(p6.lastInsertRowid, 36, 'endodoncia', '{}', 'Tratamiento de conducto obturado');
    insertTooth.run(p6.lastInsertRowid, 46, 'implante', '{}', 'Implante osteointegrado Straumann');

    // 6. Planes de Ortodoncia
    const insertOrthoPlan = db.prepare(`
      INSERT INTO orthodontic_plans (
        patient_id, doctor_id, start_date, estimated_months, bracket_type,
        current_phase, progress_percent, upper_arch_current, lower_arch_current,
        ligature_type, ligature_color, elastics, appliances, total_cost, monthly_fee, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrthoPlan.run(
      p1.lastInsertRowid, doc1.lastInsertRowid, '2026-02-20', 18, 'Zafiro Cristal Estéticos',
      'Cierre de Espacios', 55, 'Acero .019x.025 con postes soldados', 'Acero .019x.025',
      'Cadeneta Elástica Continua', '#ec4899', 'Elásticos intermaxilares 3/16 Clase II 4.5 oz uso nocturno',
      'Tubos simples en 16, 26, 36, 46. Botón lingual en pieza 23.', 1800.0, 75.0, 'Activo',
      'Evolución muy favorable. Espacios de extracción cerrando según lo planificado.'
    );
  }

  // =========================================================================
  // SIEMBRA DE NUEVOS MÓDULOS CLÍNICOS (SI ESTÁN VACÍOS)
  // =========================================================================
  const historiesCount = db.prepare('SELECT COUNT(*) as count FROM clinical_histories').get().count;
  if (historiesCount === 0) {
    console.log('🩺 Sembrando Historias Clínicas, Evoluciones, Rayos X y Recetas Médicas...');

    // 1. Historias Clínicas Estomatológicas
    const insertHistory = db.prepare(`
      INSERT INTO clinical_histories (
        patient_id, doctor_id, blood_type, allergies, systemic_diseases,
        current_medications, habits, blood_pressure, heart_rate, temperature,
        extraoral_exam, intraoral_exam, occlusion_class, oral_hygiene_index,
        presumptive_diagnosis, definitive_diagnosis, prognosis, informed_consent_signed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertHistory.run(
      1, 1, 'O+',
      'ALERGIA A LA PENICILINA Y DERIVADOS BETA-LACTÁMICOS (Usar Clindamicina o Azitromicina en caso de infección).',
      'Ninguna enfermedad sistémica. No hipertensión, no diabetes, coagulación normal.',
      'Ninguna medicación crónica actual.',
      'Cepillado 3 veces al día, uso de hilo dental Superfloss y cepillos interproximales.',
      '115/75 mmHg', '68 lpm', '36.5 °C',
      'Simetría facial conservada. ATM sin ruidos ni chasquidos articulares a la apertura máxima (44mm). Ganglios submandibulares no palpables.',
      'Mucosa yugal y lingual húmedas y normocoloreadas. Encías rosadas sin sangrado al sondaje. Presencia de aparatología ortodóntica fija de Zafiro.',
      'Clase I de Angle con apiñamiento moderado en resolución',
      'Excelente (IHO-S: 0.4)',
      'Maloclusión dentaria + Lesión cariosa incipiente en pieza 14',
      'K07.3 Anomalías de la posición del diente / K02.0 Caries limitada al esmalte (Pza 14)',
      'Muy Favorable', 1
    );

    insertHistory.run(
      2, 1, 'A+',
      'Ninguna alergia medicamentosa ni anestésica conocida.',
      'Rinitis alérgica estacional leve.',
      'Loratadina 10mg condicional.',
      'Respirador bucal nocturno en rehabilitación funcional.',
      '110/70 mmHg', '74 lpm', '36.6 °C',
      'Perfil ligeramente convexo. Competencia labial en entrenamiento.',
      'Paladar ojival expandido satisfactoriamente post-disyunción Hyrax.',
      'Clase III funcional corregida a Clase I',
      'Buena (IHO-S: 1.1)',
      'Compresión maxilar transversal y mordida cruzada anterior',
      'K07.2 Anomalías de la relación entre los arcos dentarios',
      'Favorable', 1
    );

    insertHistory.run(
      6, 3, 'O+',
      'No presenta alergias a anestésicos locales (Lidocaína / Articaína).',
      'Diabetes Mellitus Tipo 2 diagnosticada hace 4 años, controlada con hemoglobina glicosilada HbA1c en 6.4%.',
      'Metformina 850mg (1 tableta con el desayuno y cena).',
      'Ex-fumador hace 8 años. Bruxismo funcional leve.',
      '128/82 mmHg', '76 lpm', '36.7 °C',
      'Tercio inferior facial conservado. Apertura bucal amplia sin deflexión mandibular.',
      'Reborde alveolar edéntulo en zona de pieza 16 con buen volumen óseo queratinizado. Pieza 36 con tratamiento endodóntico previo asintomático.',
      'Clase I con edentulismo parcial posterior',
      'Buena (IHO-S: 0.9)',
      'Edentulismo parcial maxilar por pérdida de primer molar superior derecho (16)',
      'K08.1 Pérdida de dientes debida a extracción o enfermedad periodontal local',
      'Favorable para rehabilitación sobre implantes', 1
    );

    // 2. Evoluciones Clínicas por Sesión
    const insertEvolution = db.prepare(`
      INSERT INTO clinical_evolutions (
        patient_id, doctor_id, evolution_date, tooth_number, procedure_performed,
        anesthesia_used, materials_used, clinical_notes, post_op_indications,
        next_step, treatment_status, cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvolution.run(
      1, 2, '2026-09-12', 'Pieza 14 (Mesial)',
      'Restauración Estética Directa con Resina Compuesta Fotopolimerizable',
      'Articaína 4% con epinefrina 1:100,000 (0.8 cartucho infiltrativa)',
      'Ácido fosfórico 37%, Adhesivo Universal Single Bond, Resina 3M Filtek Z350 XT tono A2 Esmalte/Cuerpo',
      'Se realizó aislamiento absoluto con dique de goma. Eliminación selectiva de tejido cariado en cara mesial de pieza 14. Grabado ácido por 15 seg, aplicación de adhesivo y obturación incremental estratificada. Ajuste oclusal y pulido de alto brillo con discos Sof-Lex.',
      'Evitar alimentos con colorantes intensos las primeras 24 horas. Pasar hilo dental con enhebrador.',
      'Continuar controles mensuales de cierre de espacios en ortodoncia.',
      'Completado', 95.0
    );

    insertEvolution.run(
      1, 1, '2026-10-16', 'Arcada Superior / Pieza 14',
      'Recementado de Bracket de Zafiro + Activación de Cadeneta Elástica',
      'No requerida (Procedimiento no invasivo)',
      'Resina ortodóntica Transbond XT 3M, Cadeneta elastomérica continua rosa, Arco Acero .019x.025',
      'Se retiró remanente de adhesivo en superficie vestibular de pieza 14 con fresa multihojas de carburo. Microarenado y acondicionamiento de esmalte, recementado directo de bracket de zafiro prescripción Roth .022. Se colocó cadeneta continua de 16 a 26 con 150g de fuerza.',
      'Evitar alimentos duros, crocantes o pegajosos. Uso estricto de elásticos intermaxilares Clase II por las noches.',
      'Evaluar cierre total de espacio mesial y paralelismo radicular en 4 semanas.',
      'En Proceso', 75.0
    );

    insertEvolution.run(
      6, 3, '2026-10-15', 'Pieza 36',
      'Endodoncia Mecanizada Birradicular + Reconstrucción con Poste de Fibra',
      'Lidocaína 2% con epinefrina 1:80,000 (1.5 cartuchos bloqueo troncular dentario inferior)',
      'Sistema rotatorio Protaper Gold, Hipoclorito de sodio 2.5%, EDTA 17%, Cemento biocerámico BioRoot RCS, Conos de gutapercha',
      'Apertura cameral, localización de 3 conductos (MV, ML, Distal). Conductometría electrónica con localizador apical (21mm). Instrumentación rotatoria hasta F2/F3, irrigación ultrasónica pasiva y obturación termoplastificada. Control radiográfico periapical óptimo.',
      'Tomar analgésico prescrito en caso de molestia leve a la percusión durante las primeras 48 horas.',
      'Preparación para corona definitiva de disilicato de litio / zirconio.',
      'Completado', 280.0
    );

    // 3. Exámenes de Radiodiagnóstico y Rayos X
    const insertRadiology = db.prepare(`
      INSERT INTO radiology_exams (
        patient_id, doctor_id, exam_date, exam_type, tooth_area,
        title, image_url, radiological_findings, radiation_dose
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRadiology.run(
      1, 1, '2026-09-25',
      'Radiografía Panorámica (Ortopantomografía)',
      'Maxilar Superior e Inferior Completo',
      'Ortopantomografía Digital de Control Ortodóntico',
      PANORAMIC_XRAY_SVG,
      'Paralelismo radicular adecuado en sectores anteriores y premolares. Crestas óseas alveolares conservadas sin signos de reabsorción radicular apical externa. Senos maxilares neumáticos y libres. Ausencia de terceros molares superiores (18 y 28).',
      '12.4 uGy·m² (Digital Baja Dosis)'
    );

    insertRadiology.run(
      1, 2, '2026-09-12',
      'Radiografía Periapical Digital (RVG)',
      'Cuadrante 3 (Piezas 35, 36, 37)',
      'Control Radiográfico Periapical Molares Inferiores',
      PERIAPICAL_XRAY_SVG,
      'Espacio del ligamento periodontal normal. Lámina dura íntegra. En pieza 36 se observa tratamiento endodóntico previo con obturación densa y homogénea respetando el límite CDC a 0.5mm del ápice radiográfico.',
      '1.8 uGy·m² (Sensor RVG Intraoral)'
    );

    insertRadiology.run(
      6, 3, '2026-10-15',
      'Tomografía Computarizada Cone Beam 3D (CBCT)',
      'Zona Edéntula Pieza 16 (Maxilar Superior Derecho)',
      'Planificación Tomográfica 3D para Implante Straumann Pza 16',
      CBCT_IMPLANT_SVG,
      'Disponibilidad ósea vertical de 11.5 mm hasta el piso del seno maxilar y espesor vestíbulo-palatino de 7.8 mm. Calidad ósea tipo D2 según clasificación de Misch (850 Unidades Hounsfield). Ideal para implante de 4.1 x 10 mm sin necesidad de elevación sinusal traumática.',
      '38.0 uGy·m² (FOV Reducido Alta Resolución)'
    );

    // 4. Recetas Médicas Odontológicas (Prescripciones Rx)
    const insertPrescription = db.prepare(`
      INSERT INTO prescriptions (
        patient_id, doctor_id, prescription_date, diagnosis,
        medications_json, general_recommendations, valid_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertPrescription.run(
      1, 1, '2026-10-16',
      'K07.3 Control de Ortodoncia Activa + Sensibilidad por activación de arco',
      JSON.stringify([
        {
          name: 'Paracetamol',
          concentration: '500 mg',
          form: 'Tabletas',
          quantity: '06 tabletas',
          dosage_instructions: 'Tomar 01 tableta vía oral cada 8 horas por 2 días (solo si presenta dolor por tensión dental). Preferible paracetamol para no inhibir el movimiento ortodóntico.',
          duration: '2 días'
        },
        {
          name: 'Colutorio de Digluconato de Clorhexidina + CPC',
          concentration: '0.12%',
          form: 'Frasco Enjuague Bucal 250ml',
          quantity: '01 frasco',
          dosage_instructions: 'Realizar enjuagues con 15 ml sin diluir durante 30 segundos, cada 12 horas (mañana y noche) después del cepillado.',
          duration: '7 días'
        },
        {
          name: 'Cera Ortodóntica Protectora con Vitamina E',
          concentration: 'Uso tópico mucoso',
          form: 'Estuche de barras',
          quantity: '01 unidad',
          dosage_instructions: 'Aplicar una pequeña esfera sobre el bracket o tubo que genere roce en mucosa labial o yugal.',
          duration: 'Uso condicional'
        }
      ]),
      'NOTA IMPORTANTE: Paciente alérgica a la Penicilina. Mantener dieta blanda durante las primeras 48 horas post-ajuste. Utilizar cepillos interproximales después de cada comida.',
      '2026-11-16'
    );

    insertPrescription.run(
      6, 3, '2026-10-15',
      'K04.0 Terapia Endodóntica y Profilaxis Pre-Quirúrgica de Implante Dental',
      JSON.stringify([
        {
          name: 'Amoxicilina + Ácido Clavulánico',
          concentration: '875 mg / 125 mg',
          form: 'Comprimidos recubiertos',
          quantity: '14 comprimidos',
          dosage_instructions: 'Tomar 01 comprimido vía oral cada 12 horas (8:00 am y 8:00 pm) junto con los alimentos por 7 días completos.',
          duration: '7 días'
        },
        {
          name: 'Dexketoprofeno Trometamol (Enantyum)',
          concentration: '25 mg',
          form: 'Comprimidos recubiertos',
          quantity: '10 comprimidos',
          dosage_instructions: 'Tomar 01 comprimido vía oral cada 8 horas por 3 días para control del dolor e inflamación.',
          duration: '3 días'
        },
        {
          name: 'Ketorolaco Trometamina Sublingual',
          concentration: '10 mg',
          form: 'Tabletas sublinguales',
          quantity: '04 tabletas',
          dosage_instructions: 'Colocar 01 tableta debajo de la lengua solo en caso de dolor agudo intenso.',
          duration: 'Rescate'
        }
      ]),
      'Continuar con su medicación habitual para la glucosa (Metformina 850mg). No masticar alimentos duros por el lado intervenido.',
      '2026-11-15'
    );

    console.log('✅ Historias clínicas, evoluciones, radiografías y recetas sembradas con éxito.');
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
