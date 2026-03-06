/* eslint-disable @typescript-eslint/no-explicit-any */
// Comprehensive seed data for the dental clinic demo
// Generates realistic Romanian-style data for all modules

function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ─── Fixed IDs for cross-referencing ───────────────────────────────
const DOCTOR_IDS = [uuid(), uuid(), uuid(), uuid(), uuid()];
const USER_IDS = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()]; // admin + 5 doctors
const CABINET_IDS = [1, 2, 3, 4, 5];

// Generate patient IDs upfront
const PATIENT_COUNT = 150;
const PATIENT_IDS: string[] = [];
for (let i = 0; i < PATIENT_COUNT; i++) PATIENT_IDS.push(uuid());

// Treatment IDs
const TREATMENT_IDS: string[] = [];
for (let i = 0; i < 30; i++) TREATMENT_IDS.push(uuid());

// ─── Helpers ───────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startDays: number, endDays: number): string {
  const now = new Date();
  const days = randomInt(startDays, endDays);
  const d = new Date(now.getTime() + days * 86400000);
  return d.toISOString().split('T')[0];
}

function randomTime(): string {
  const hours = randomInt(8, 20);
  const mins = pick([0, 15, 30, 45]);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function randomPhone(): string {
  const prefixes = ['721', '722', '723', '724', '725', '731', '732', '733', '741', '742', '743', '751', '752', '753', '761', '762', '763', '771', '772', '773'];
  return `+40 ${pick(prefixes)} ${randomInt(100, 999)} ${randomInt(100, 999)}`;
}

function randomEmail(first: string, last: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'mail.com'];
  return `${first.toLowerCase()}.${last.toLowerCase()}@${pick(domains)}`;
}

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

// ─── Name Data ─────────────────────────────────────────────────────
const FIRST_NAMES_M = ['Alexandru', 'Andrei', 'Cristian', 'Daniel', 'Florin', 'Gabriel', 'Ion', 'Lucian', 'Marian', 'Nicolae', 'Octavian', 'Paul', 'Radu', 'Sebastian', 'Tudor', 'Valentin', 'Adrian', 'Bogdan', 'Ciprian', 'Dragoș', 'Emil', 'Felix', 'George', 'Horea', 'Ionuț', 'Laurențiu', 'Mihai', 'Petru', 'Silviu', 'Vlad'];
const FIRST_NAMES_F = ['Ana', 'Bianca', 'Cristina', 'Diana', 'Elena', 'Florina', 'Gabriela', 'Ioana', 'Laura', 'Maria', 'Nicoleta', 'Oana', 'Patricia', 'Raluca', 'Simona', 'Teodora', 'Valentina', 'Alexandra', 'Camelia', 'Denisa', 'Eva', 'Georgiana', 'Irina', 'Larisa', 'Mirela', 'Paula', 'Roxana', 'Sorina', 'Adriana', 'Alina'];
const LAST_NAMES = ['Popescu', 'Ionescu', 'Popa', 'Stan', 'Dumitru', 'Stoica', 'Gheorghe', 'Rusu', 'Marin', 'Constantin', 'Ciobanu', 'Dinu', 'Tudor', 'Moldovan', 'Matei', 'Toma', 'Barbu', 'Nistor', 'Luca', 'Munteanu', 'Diaconu', 'Florea', 'Neagu', 'Badea', 'Drăgan', 'Ene', 'Petrescu', 'Radu', 'Savu', 'Voicu', 'Zamfir', 'Preda', 'Anghel', 'Voinea', 'Oprea', 'Lungu', 'Mihăilescu', 'Dumitrescu', 'Paraschiv', 'Manole'];

const CITIES = ['București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești', 'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Botoșani', 'Satu Mare'];

const STREETS = ['Str. Mihai Eminescu', 'Bd. Unirii', 'Str. Libertății', 'Str. Republicii', 'Bd. 1 Decembrie', 'Str. Victoriei', 'Str. Ștefan cel Mare', 'Str. Avram Iancu', 'Str. Nicolae Bălcescu', 'Str. George Enescu', 'Str. Traian', 'Str. Alexandru Ioan Cuza', 'Bd. Independenței', 'Str. Primăverii', 'Str. Florilor'];

const ALLERGIES = ['Penicilină', 'Lidocaină', 'Latex', 'Aspirină', 'Ibuprofen', 'Amoxicilină', 'Metale', 'Polen'];
const MEDICAL_CONDITIONS = ['Diabet tip 2', 'Hipertensiune arterială', 'Astm bronșic', 'Aritmie cardiacă', 'Hepatită B', 'Anemie', 'Epilepsie', 'Tiroidită'];

// ─── Doctors ───────────────────────────────────────────────────────
function seedDoctors(): any[] {
  return [
    { id: DOCTOR_IDS[0], name: 'Dr. Alexandru Popescu', color: '#3B82F6', specialization: 'Ortodonție', doctor_code: 'AP001', email: 'alexandru.popescu@perfectsmile.ro', phone: '+40 721 100 200', is_active: true, user_id: USER_IDS[1], email_notifications_enabled: true, created_at: isoDate(-365), updated_at: isoDate(-1) },
    { id: DOCTOR_IDS[1], name: 'Dr. Maria Ionescu', color: '#EC4899', specialization: 'Implantologie', doctor_code: 'MI002', email: 'maria.ionescu@perfectsmile.ro', phone: '+40 722 300 400', is_active: true, user_id: USER_IDS[2], email_notifications_enabled: true, created_at: isoDate(-365), updated_at: isoDate(-1) },
    { id: DOCTOR_IDS[2], name: 'Dr. Andrei Dumitrescu', color: '#10B981', specialization: 'Chirurgie Orală', doctor_code: 'AD003', email: 'andrei.dumitrescu@perfectsmile.ro', phone: '+40 723 500 600', is_active: true, user_id: USER_IDS[3], email_notifications_enabled: true, created_at: isoDate(-365), updated_at: isoDate(-1) },
    { id: DOCTOR_IDS[3], name: 'Dr. Elena Gheorghiu', color: '#F59E0B', specialization: 'Endodonție', doctor_code: 'EG004', email: 'elena.gheorghiu@perfectsmile.ro', phone: '+40 724 700 800', is_active: true, user_id: USER_IDS[4], email_notifications_enabled: true, created_at: isoDate(-365), updated_at: isoDate(-1) },
    { id: DOCTOR_IDS[4], name: 'Dr. Cristian Moldovan', color: '#8B5CF6', specialization: 'Protetică Dentară', doctor_code: 'CM005', email: 'cristian.moldovan@perfectsmile.ro', phone: '+40 725 900 100', is_active: true, user_id: USER_IDS[5], email_notifications_enabled: true, created_at: isoDate(-365), updated_at: isoDate(-1) },
  ];
}

// ─── Cabinets ──────────────────────────────────────────────────────
function seedCabinets(): any[] {
  return CABINET_IDS.map((id, i) => ({
    id,
    name: `Cabinet ${id}`,
    doctor: `Dr. ${['Alexandru Popescu', 'Maria Ionescu', 'Andrei Dumitrescu', 'Elena Gheorghiu', 'Cristian Moldovan'][i]}`,
    is_active: true,
    created_at: isoDate(-365),
    updated_at: isoDate(-1),
  }));
}

// ─── Users & Auth ──────────────────────────────────────────────────
function seedMockUsers(): any[] {
  return [
    { id: USER_IDS[0], email: 'admin@perfectsmile.ro', password: 'demo123', created_at: isoDate(-365) },
    { id: USER_IDS[1], email: 'alexandru.popescu@perfectsmile.ro', password: 'demo123', created_at: isoDate(-365) },
    { id: USER_IDS[2], email: 'maria.ionescu@perfectsmile.ro', password: 'demo123', created_at: isoDate(-365) },
    { id: USER_IDS[3], email: 'andrei.dumitrescu@perfectsmile.ro', password: 'demo123', created_at: isoDate(-365) },
    { id: USER_IDS[4], email: 'elena.gheorghiu@perfectsmile.ro', password: 'demo123', created_at: isoDate(-365) },
    { id: USER_IDS[5], email: 'cristian.moldovan@perfectsmile.ro', password: 'demo123', created_at: isoDate(-365) },
  ];
}

function seedProfiles(): any[] {
  return [
    { id: uuid(), user_id: USER_IDS[0], full_name: 'Administrator', username: 'admin', avatar_url: null, must_change_password: false, notification_email: 'admin@perfectsmile.ro', created_at: isoDate(-365), updated_at: isoDate(-1) },
    { id: uuid(), user_id: USER_IDS[1], full_name: 'Dr. Alexandru Popescu', username: 'alexandru.popescu', avatar_url: null, must_change_password: false, notification_email: null, created_at: isoDate(-365), updated_at: isoDate(-1) },
    { id: uuid(), user_id: USER_IDS[2], full_name: 'Dr. Maria Ionescu', username: 'maria.ionescu', avatar_url: null, must_change_password: false, notification_email: null, created_at: isoDate(-365), updated_at: isoDate(-1) },
    { id: uuid(), user_id: USER_IDS[3], full_name: 'Dr. Andrei Dumitrescu', username: 'andrei.dumitrescu', avatar_url: null, must_change_password: false, notification_email: null, created_at: isoDate(-365), updated_at: isoDate(-1) },
    { id: uuid(), user_id: USER_IDS[4], full_name: 'Dr. Elena Gheorghiu', username: 'elena.gheorghiu', avatar_url: null, must_change_password: false, notification_email: null, created_at: isoDate(-365), updated_at: isoDate(-1) },
    { id: uuid(), user_id: USER_IDS[5], full_name: 'Dr. Cristian Moldovan', username: 'cristian.moldovan', avatar_url: null, must_change_password: false, notification_email: null, created_at: isoDate(-365), updated_at: isoDate(-1) },
  ];
}

function seedUserRoles(): any[] {
  return [
    { id: uuid(), user_id: USER_IDS[0], role: 'admin', created_at: isoDate(-365) },
    { id: uuid(), user_id: USER_IDS[1], role: 'user', created_at: isoDate(-365) },
    { id: uuid(), user_id: USER_IDS[2], role: 'user', created_at: isoDate(-365) },
    { id: uuid(), user_id: USER_IDS[3], role: 'user', created_at: isoDate(-365) },
    { id: uuid(), user_id: USER_IDS[4], role: 'user', created_at: isoDate(-365) },
    { id: uuid(), user_id: USER_IDS[5], role: 'user', created_at: isoDate(-365) },
  ];
}

// ─── Patients ──────────────────────────────────────────────────────
function seedPatients(): any[] {
  const patients: any[] = [];

  for (let i = 0; i < PATIENT_COUNT; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = pick(isMale ? FIRST_NAMES_M : FIRST_NAMES_F);
    const lastName = pick(LAST_NAMES);
    const hasAllergies = Math.random() > 0.8;
    const hasConditions = Math.random() > 0.85;
    const age = randomInt(18, 80);
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age);

    patients.push({
      id: PATIENT_IDS[i],
      first_name: firstName,
      last_name: lastName,
      phone: randomPhone(),
      email: Math.random() > 0.3 ? randomEmail(firstName, lastName) : null,
      date_of_birth: dob.toISOString().split('T')[0],
      gender: isMale ? 'Masculin' : 'Feminin',
      cnp: Math.random() > 0.5 ? String(randomInt(1000000000000, 9999999999999)) : null,
      allergies: hasAllergies ? pickN(ALLERGIES, randomInt(1, 3)) : null,
      medical_conditions: hasConditions ? pickN(MEDICAL_CONDITIONS, randomInt(1, 2)) : null,
      medications: Math.random() > 0.9 ? ['Metformin', 'Enalapril'].slice(0, randomInt(1, 2)) : null,
      notes: Math.random() > 0.8 ? pick(['Pacient cooperant', 'Necesită atenție specială', 'Anxios la tratamente', 'Programări doar dimineața']) : null,
      address: `${pick(STREETS)} Nr. ${randomInt(1, 200)}`,
      city: pick(CITIES),
      emergency_contact_name: Math.random() > 0.7 ? `${pick(FIRST_NAMES_F)} ${pick(LAST_NAMES)}` : null,
      emergency_contact_phone: Math.random() > 0.7 ? randomPhone() : null,
      registration_number: String(1000 + i),
      is_edentulous: Math.random() > 0.95,
      is_implant_patient: Math.random() > 0.85,
      is_periodontal_patient: Math.random() > 0.8,
      has_dental_appliance: Math.random() > 0.9,
      is_finalized: false,
      diag_chirurgical: null,
      diag_ocluzal: null,
      diag_odontal: null,
      diag_ortodontic: null,
      diag_parodontal: null,
      created_at: isoDate(-randomInt(1, 300)),
      updated_at: isoDate(-randomInt(0, 30)),
    });
  }

  return patients;
}

// ─── Treatments ────────────────────────────────────────────────────
function seedTreatments(): any[] {
  const treatments = [
    { name: 'Consultație', category: 'Consultații', default_duration: 30, default_price: 100, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Consultație de urgență', category: 'Consultații', default_duration: 30, default_price: 150, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Detartraj', category: 'Igienă', default_duration: 45, default_price: 200, cas: 100, co_plata: 100, decont: 100 },
    { name: 'Periaj profesional', category: 'Igienă', default_duration: 30, default_price: 150, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Albire dentară', category: 'Estetică', default_duration: 60, default_price: 800, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Obturație compozit', category: 'Odontoterapie', default_duration: 45, default_price: 250, cas: 150, co_plata: 100, decont: 150 },
    { name: 'Obturație compozit complexă', category: 'Odontoterapie', default_duration: 60, default_price: 400, cas: 200, co_plata: 200, decont: 200 },
    { name: 'Tratament de canal (monoradicular)', category: 'Endodonție', default_duration: 60, default_price: 500, cas: 250, co_plata: 250, decont: 250 },
    { name: 'Tratament de canal (pluriradicular)', category: 'Endodonție', default_duration: 90, default_price: 800, cas: 300, co_plata: 500, decont: 300 },
    { name: 'Retratament de canal', category: 'Endodonție', default_duration: 90, default_price: 900, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Extracție simplă', category: 'Chirurgie', default_duration: 30, default_price: 200, cas: 100, co_plata: 100, decont: 100 },
    { name: 'Extracție chirurgicală', category: 'Chirurgie', default_duration: 60, default_price: 500, cas: 200, co_plata: 300, decont: 200 },
    { name: 'Extracție molar de minte', category: 'Chirurgie', default_duration: 90, default_price: 800, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Coroană metalceramică', category: 'Protetică', default_duration: 30, default_price: 900, cas: 400, co_plata: 500, decont: 400 },
    { name: 'Coroană zirconiu', category: 'Protetică', default_duration: 30, default_price: 1500, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Coroană E-Max', category: 'Protetică', default_duration: 30, default_price: 1800, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Punte dentară (per element)', category: 'Protetică', default_duration: 30, default_price: 1000, cas: 400, co_plata: 600, decont: 400 },
    { name: 'Proteze mobilizabile', category: 'Protetică', default_duration: 60, default_price: 2500, cas: 1000, co_plata: 1500, decont: 1000 },
    { name: 'Implant dentar', category: 'Implantologie', default_duration: 90, default_price: 3500, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Implant dentar + bont protetic', category: 'Implantologie', default_duration: 60, default_price: 4500, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Augmentare osoasă', category: 'Implantologie', default_duration: 90, default_price: 2000, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Sigilare', category: 'Pediatrie', default_duration: 20, default_price: 100, cas: 50, co_plata: 50, decont: 50 },
    { name: 'Fluorizare', category: 'Pediatrie', default_duration: 15, default_price: 80, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Aparat dentar metalic', category: 'Ortodonție', default_duration: 60, default_price: 5000, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Aparat dentar ceramic', category: 'Ortodonție', default_duration: 60, default_price: 7000, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Gutieră Invisalign', category: 'Ortodonție', default_duration: 45, default_price: 12000, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Control ortodontic', category: 'Ortodonție', default_duration: 30, default_price: 200, cas: 0, co_plata: 0, decont: 0 },
    { name: 'Radiografie panoramică', category: 'Radiologie', default_duration: 15, default_price: 100, cas: 50, co_plata: 50, decont: 50 },
    { name: 'Radiografie retroalveolară', category: 'Radiologie', default_duration: 10, default_price: 50, cas: 25, co_plata: 25, decont: 25 },
    { name: 'Fațetă dentară', category: 'Estetică', default_duration: 45, default_price: 2000, cas: 0, co_plata: 0, decont: 0 },
  ];

  return treatments.map((t, i) => ({
    id: TREATMENT_IDS[i],
    ...t,
    description: null,
    is_active: true,
    created_at: isoDate(-365),
  }));
}

// ─── Appointments ──────────────────────────────────────────────────
function seedAppointments(): { appointments: any[]; appointmentTreatments: any[]; treatmentRecords: any[] } {
  const appointments: any[] = [];
  const appointmentTreatments: any[] = [];
  const treatmentRecords: any[] = [];

  const statuses = ['completed', 'completed', 'completed', 'completed', 'scheduled', 'confirmed', 'cancelled', 'no_show'];
  const paymentMethods = ['Cash', 'Card', 'Transfer bancar', null];

  for (let i = 0; i < 500; i++) {
    const appointmentId = uuid();
    const patientId = pick(PATIENT_IDS);
    const doctorId = pick(DOCTOR_IDS);
    const doctorIdx = DOCTOR_IDS.indexOf(doctorId);
    const cabinetId = CABINET_IDS[doctorIdx] || pick(CABINET_IDS);
    const treatmentId = pick(TREATMENT_IDS);

    const isPast = i < 350; // 350 past, 150 future
    const daysOffset = isPast ? -randomInt(1, 180) : randomInt(1, 60);
    const date = randomDate(daysOffset, daysOffset);
    const time = randomTime();
    const duration = pick([15, 30, 30, 45, 45, 60, 60, 90]);

    let status: string;
    if (isPast) {
      status = pick(['completed', 'completed', 'completed', 'completed', 'completed', 'cancelled', 'no_show']);
    } else {
      status = pick(['scheduled', 'scheduled', 'confirmed', 'confirmed']);
    }

    const price = pick([100, 150, 200, 250, 300, 400, 500, 800, 900, 1000, 1500]);
    const isPaid = status === 'completed' ? Math.random() > 0.15 : false;
    const paidAmount = isPaid ? price : (status === 'completed' ? Math.random() > 0.5 ? Math.round(price * 0.5) : 0 : 0);
    const debtAmount = status === 'completed' && !isPaid ? price - paidAmount : 0;

    const appointment: any = {
      id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      cabinet_id: cabinetId,
      treatment_id: treatmentId,
      appointment_date: date,
      start_time: time,
      duration,
      status,
      price,
      paid_amount: paidAmount > 0 ? paidAmount : null,
      payment_method: isPaid ? pick(paymentMethods) : null,
      is_paid: isPaid,
      debt_amount: debtAmount > 0 ? debtAmount : null,
      debt_paid_at: null,
      notes: Math.random() > 0.85 ? pick(['Pacient la prima vizită', 'Continuare tratament', 'Control periodic', 'Urgență dentară']) : null,
      reminder_sent_at: isPast && Math.random() > 0.5 ? isoDate(daysOffset - 1) : null,
      cancellation_reason: status === 'cancelled' ? pick(['Pacientul a anulat', 'Reprogramare', 'Urgență medicală', 'Indisponibilitate doctor']) : null,
      cancelled_at: status === 'cancelled' ? isoDate(daysOffset) : null,
      created_at: isoDate(daysOffset - randomInt(1, 7)),
      updated_at: isoDate(daysOffset),
    };

    appointments.push(appointment);

    // Add 1-3 appointment treatments
    const numTreatments = pick([1, 1, 1, 2, 2, 3]);
    const treatmentIdsForAppt = pickN(TREATMENT_IDS, numTreatments);
    for (const tId of treatmentIdsForAppt) {
      const tIdx = TREATMENT_IDS.indexOf(tId);
      const treatmentData = seedTreatments()[tIdx];
      if (!treatmentData) continue;

      const atId = uuid();
      appointmentTreatments.push({
        id: atId,
        appointment_id: appointmentId,
        treatment_id: tId,
        treatment_name: treatmentData.name,
        price: treatmentData.default_price,
        duration: treatmentData.default_duration,
        co_plata: treatmentData.co_plata || null,
        decont: treatmentData.decont || null,
        discount_percent: Math.random() > 0.9 ? pick([5, 10, 15, 20]) : null,
        laborator: Math.random() > 0.85 ? pick([200, 300, 500, 800]) : null,
        tooth_numbers: Math.random() > 0.5 ? [randomInt(11, 48)] : null,
        tooth_data: null,
        plan_item_id: null,
        created_at: appointment.created_at,
      });
    }

    // Create treatment records for completed appointments
    if (status === 'completed') {
      treatmentRecords.push({
        id: uuid(),
        patient_id: patientId,
        appointment_id: appointmentId,
        treatment_id: treatmentId,
        treatment_name: seedTreatments()[TREATMENT_IDS.indexOf(treatmentId)]?.name || 'Consultație',
        performed_at: date,
        diagnosis: Math.random() > 0.5 ? pick(['Carie profundă', 'Pulpită acută', 'Parodontită cronică', 'Gingivită', 'Dinte fracturat']) : null,
        description: null,
        tooth_numbers: Math.random() > 0.5 ? [randomInt(11, 48)] : null,
        notes: null,
        price: price,
        cabinet_id: cabinetId,
        created_at: isoDate(daysOffset),
      });
    }
  }

  return { appointments, appointmentTreatments, treatmentRecords };
}

// ─── WhatsApp Messages ─────────────────────────────────────────────
function seedWhatsAppMessages(): any[] {
  const messages: any[] = [];
  const chatPatients = PATIENT_IDS.slice(0, 35);
  const patients = seedPatients();

  const inboundMessages = [
    'Bună ziua, aș dori să fac o programare.',
    'Când aveți un loc liber pentru un control?',
    'Am o durere de măsea, se poate programa ceva urgent?',
    'Mulțumesc pentru programare! Voi fi acolo.',
    'Pot să reprogramez vizita de mâine?',
    'Bună, am nevoie de o consultație pentru copil.',
    'La ce oră trebuie să vin?',
    'Am primit mesajul, mulțumesc!',
    'Se poate programa un detartraj în această săptămână?',
    'Sunt în drum, ajung în 10 minute.',
    'Pot plăti cu cardul?',
    'Am uitat să întreb - cât costă un implant?',
    'Bună seara, pot să vin mâine de dimineață?',
    'Vreau să știu dacă mai aveți loc săptămâna viitoare.',
    'Mulțumesc pentru tratament, mă simt mult mai bine!',
    'Am o problemă cu o obturație, se poate rezolva repede?',
    'Bună, ce acte trebuie să aduc la programare?',
    'Se poate face o radiografie panoramică?',
    'Cât durează un tratament de canal?',
    'Pot veni cu copilul și el la control?',
  ];

  const outboundMessages = [
    'Bună ziua! V-am programat pentru data de {date} la ora {time}. Vă așteptăm!',
    'Bună ziua! Vă reamintim că aveți o programare mâine. Vă rugăm să confirmați prezența.',
    'Mulțumim pentru confirmare. Vă așteptăm!',
    'Bună ziua! Avem locuri disponibile începând de luni. Doriți să programăm?',
    'Vă mulțumim pentru vizită! Pentru orice problemă, nu ezitați să ne contactați.',
    'Bună ziua! Reprogramarea a fost efectuată cu succes.',
    'Costul consultației este de 100 lei. Acceptăm plata cash sau cu cardul.',
    'Vă așteptăm cu actul de identitate și cardul de sănătate.',
    'Da, desigur! Puteți veni mâine la ora 10:00.',
    'Tratamentul durează aproximativ 60 de minute. Veți primi toate detaliile la consultație.',
  ];

  for (const patientId of chatPatients) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) continue;

    const numMessages = randomInt(3, 10);
    const baseDays = -randomInt(1, 60);

    for (let j = 0; j < numMessages; j++) {
      const isInbound = Math.random() > 0.4;
      const dayOffset = baseDays + j;
      const msgBody = isInbound ? pick(inboundMessages) : pick(outboundMessages).replace('{date}', randomDate(1, 7)).replace('{time}', randomTime());

      messages.push({
        id: uuid(),
        patient_phone: patient.phone,
        patient_name: `${patient.first_name} ${patient.last_name}`,
        patient_id: patientId,
        message_body: msgBody,
        message_sid: `SM${uuid().replace(/-/g, '').substring(0, 32)}`,
        direction: isInbound ? 'inbound' : 'outbound',
        status: isInbound ? (Math.random() > 0.3 ? 'read' : 'unread') : 'delivered',
        media_urls: null,
        media_types: null,
        created_at: isoDate(dayOffset),
        read_at: isInbound && Math.random() > 0.3 ? isoDate(dayOffset + 0.1) : null,
      });
    }
  }

  // Sort by created_at
  messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return messages;
}

// ─── Lab Samples ───────────────────────────────────────────────────
function seedLabSamples(): any[] {
  const samples: any[] = [];
  const workTypes = ['Coroană metalceramică', 'Coroană zirconiu', 'Coroană E-Max', 'Punte', 'Proteză mobilizabilă', 'Scheletizată', 'Implant+Bont', 'Fațetă'];
  const labs = ['Lab. Necula/microdent', 'Lab. Chișinău/smile dent'];
  const statusOptions = ['sent', 'trial', 'in_work', 'ready', 'returned', 'finalized'];
  const colors = ['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'C1', 'C2', 'D2', 'D3'];
  const patients = seedPatients();

  for (let i = 0; i < 35; i++) {
    const patient = pick(patients);
    const doctorId = pick(DOCTOR_IDS);
    const daysAgo = randomInt(1, 90);
    const status = pick(statusOptions);

    samples.push({
      id: uuid(),
      patient_id: patient.id,
      patient_name: `${patient.first_name} ${patient.last_name}`,
      doctor_id: doctorId,
      cabinet_id: pick(CABINET_IDS),
      work_type: pick(workTypes),
      laboratory_name: pick(labs),
      status,
      sample_date: randomDate(-daysAgo, -daysAgo),
      expected_return_date: randomDate(-daysAgo + 7, -daysAgo + 14),
      actual_return_date: ['returned', 'finalized'].includes(status) ? randomDate(-daysAgo + 10, -daysAgo + 14) : null,
      trial_date: ['trial', 'ready', 'returned', 'finalized'].includes(status) ? randomDate(-daysAgo + 5, -daysAgo + 8) : null,
      finalized_date: status === 'finalized' ? randomDate(-daysAgo + 12, -daysAgo + 16) : null,
      zone_quadrant: `${randomInt(1, 4)}.${randomInt(1, 8)}`,
      vita_color: pick(colors),
      notes: Math.random() > 0.7 ? pick(['Atenție la culoare', 'Pacient pretențios', 'Se grăbește', 'Refacere lucrare']) : null,
      resend_date: null,
      resend_reason: null,
      created_at: isoDate(-daysAgo),
      updated_at: isoDate(-Math.max(0, daysAgo - 5)),
    });
  }

  return samples;
}

// ─── Stock Items & Movements ───────────────────────────────────────
function seedStockItems(): any[] {
  const items = [
    { name: 'Mănuși latex S', quantity: 500, unit: 'buc', category: 'Protecție' },
    { name: 'Mănuși latex M', quantity: 800, unit: 'buc', category: 'Protecție' },
    { name: 'Mănuși latex L', quantity: 300, unit: 'buc', category: 'Protecție' },
    { name: 'Mănuși nitrile M', quantity: 600, unit: 'buc', category: 'Protecție' },
    { name: 'Măști chirurgicale', quantity: 200, unit: 'buc', category: 'Protecție' },
    { name: 'Compozit A2', quantity: 15, unit: 'seringi', category: 'Materiale restaurative' },
    { name: 'Compozit A3', quantity: 12, unit: 'seringi', category: 'Materiale restaurative' },
    { name: 'Acid ortofosforic', quantity: 8, unit: 'seringi', category: 'Materiale restaurative' },
    { name: 'Adeziv dentar', quantity: 5, unit: 'flacoane', category: 'Materiale restaurative' },
    { name: 'Ciment ionomer sticlă', quantity: 6, unit: 'flacoane', category: 'Materiale restaurative' },
    { name: 'Ace endodontice K-File', quantity: 50, unit: 'buc', category: 'Endodonție' },
    { name: 'Ace endodontice H-File', quantity: 40, unit: 'buc', category: 'Endodonție' },
    { name: 'Conuri de gutapercă', quantity: 100, unit: 'buc', category: 'Endodonție' },
    { name: 'EDTA', quantity: 3, unit: 'flacoane', category: 'Endodonție' },
    { name: 'Hipoclorit de sodiu', quantity: 5, unit: 'litri', category: 'Endodonție' },
    { name: 'Carpule anestezie', quantity: 200, unit: 'buc', category: 'Anestezie' },
    { name: 'Ace anestezie', quantity: 300, unit: 'buc', category: 'Anestezie' },
    { name: 'Bisturiu chirurgical', quantity: 30, unit: 'buc', category: 'Chirurgie' },
    { name: 'Fire de sutură', quantity: 25, unit: 'buc', category: 'Chirurgie' },
    { name: 'Tampoane sterile', quantity: 500, unit: 'buc', category: 'Igienă' },
    { name: 'Roluri vată', quantity: 200, unit: 'buc', category: 'Igienă' },
    { name: 'Pastă profilactică', quantity: 10, unit: 'tuburi', category: 'Igienă' },
    { name: 'Dezinfectant suprafețe', quantity: 8, unit: 'litri', category: 'Dezinfecție' },
    { name: 'Dezinfectant instrumente', quantity: 5, unit: 'litri', category: 'Dezinfecție' },
    { name: 'Pungi sterilizare', quantity: 500, unit: 'buc', category: 'Sterilizare' },
  ];

  return items.map((item, _i) => ({
    id: uuid(),
    ...item,
    created_at: isoDate(-randomInt(30, 180)),
    updated_at: isoDate(-randomInt(0, 15)),
  }));
}

function seedStockMovements(stockItems: any[]): any[] {
  const movements: any[] = [];
  const types = ['in', 'out', 'company_in', 'cabinet_out'];

  for (let i = 0; i < 60; i++) {
    const item = pick(stockItems);
    const type = pick(types);
    movements.push({
      id: uuid(),
      item_id: item.id,
      item_name: item.name,
      type,
      quantity: randomInt(1, 50),
      cabinet_id: type === 'cabinet_out' ? pick(CABINET_IDS) : null,
      source_cabinet_id: null,
      notes: Math.random() > 0.7 ? pick(['Aprovizionare lunară', 'Comandă urgentă', 'Transfer cabinet', 'Consum zilnic']) : null,
      deleted_at: null,
      created_at: isoDate(-randomInt(1, 90)),
    });
  }

  return movements;
}

// ─── Monthly Expenses ──────────────────────────────────────────────
function seedMonthlyExpenses(): { expenses: any[]; entries: any[] } {
  const expenses: any[] = [];
  const entries: any[] = [];

  const categories = [
    'Chirie', 'Utilități (electric)', 'Utilități (apă)', 'Utilități (gaz)', 'Internet',
    'Salarii personal', 'Contribuții sociale', 'Materiale consumabile', 'Materiale protetice',
    'Întreținere echipamente', 'Servicii contabilitate', 'Asigurare', 'Curățenie',
    'Materiale dezinfecție', 'Marketing/Publicitate', 'Telefonie', 'Software/Licențe',
    'Taxe și impozite', 'Diverse',
  ];

  const amounts: Record<string, [number, number]> = {
    'Chirie': [3000, 5000], 'Utilități (electric)': [500, 1200], 'Utilități (apă)': [100, 300],
    'Utilități (gaz)': [200, 600], 'Internet': [100, 200], 'Salarii personal': [15000, 25000],
    'Contribuții sociale': [5000, 10000], 'Materiale consumabile': [2000, 5000],
    'Materiale protetice': [3000, 8000], 'Întreținere echipamente': [500, 2000],
    'Servicii contabilitate': [1500, 2500], 'Asigurare': [800, 1500],
    'Curățenie': [1000, 2000], 'Materiale dezinfecție': [500, 1000],
    'Marketing/Publicitate': [1000, 3000], 'Telefonie': [200, 400],
    'Software/Licențe': [300, 800], 'Taxe și impozite': [2000, 5000], 'Diverse': [200, 1000],
  };

  // Generate 6 months of expenses
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const isPastMonth = m > 0;

    for (const cat of categories) {
      const [min, max] = amounts[cat] || [100, 500];
      const amount = Math.round(randomInt(min, max) / 10) * 10;
      const isPaid = isPastMonth ? Math.random() > 0.1 : Math.random() > 0.6;

      const expenseId = uuid();
      expenses.push({
        id: expenseId,
        month_year: monthYear,
        expense_name: cat,
        amount,
        is_paid: isPaid,
        paid_at: isPaid ? isoDate(-m * 30 + randomInt(1, 25)) : null,
        created_at: isoDate(-m * 30),
        updated_at: isoDate(-m * 30 + randomInt(0, 25)),
      });

      // Add 1-3 entries for some expenses
      if (Math.random() > 0.6) {
        const numEntries = randomInt(1, 3);
        const entryAmount = Math.round(amount / numEntries / 10) * 10;
        for (let e = 0; e < numEntries; e++) {
          entries.push({
            id: uuid(),
            expense_id: expenseId,
            amount: entryAmount,
            description: `${cat} - parte ${e + 1}`,
            is_paid: isPaid,
            paid_at: isPaid ? isoDate(-m * 30 + randomInt(1, 25)) : null,
            created_at: isoDate(-m * 30 + e),
            updated_at: isoDate(-m * 30 + e),
          });
        }
      }
    }
  }

  return { expenses, entries };
}

// ─── CAS Budget ────────────────────────────────────────────────────
function seedCasBudget(): any[] {
  const budgets: any[] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const initial = pick([15000, 18000, 20000, 22000, 25000]);
    const used = m > 0 ? randomInt(Math.round(initial * 0.5), initial) : randomInt(0, Math.round(initial * 0.3));

    budgets.push({
      id: uuid(),
      month_year: monthYear,
      initial_budget: initial,
      used_budget: used,
      created_at: isoDate(-m * 30),
      updated_at: isoDate(-m * 30 + randomInt(0, 25)),
    });
  }
  return budgets;
}

// ─── Patient Reminders ─────────────────────────────────────────────
function seedPatientReminders(): any[] {
  const reminders: any[] = [];
  const recallTypes = ['Control periodic', 'Detartraj', 'Control ortodontic', 'Verificare implant', 'Continuare tratament'];

  for (let i = 0; i < 25; i++) {
    const isCompleted = Math.random() > 0.5;
    const daysFromNow = isCompleted ? -randomInt(1, 60) : randomInt(-7, 30);

    reminders.push({
      id: uuid(),
      patient_id: pick(PATIENT_IDS),
      doctor_id: pick(DOCTOR_IDS),
      reminder_date: randomDate(daysFromNow, daysFromNow),
      recall_type: pickN(recallTypes, randomInt(1, 2)),
      is_completed: isCompleted,
      completed_at: isCompleted ? isoDate(daysFromNow + 1) : null,
      completed_by: isCompleted ? pick(USER_IDS) : null,
      note: Math.random() > 0.6 ? pick(['Pacient contactat telefonic', 'Mesaj WhatsApp trimis', 'Nu a răspuns', 'Reprogramat']) : null,
      created_by: pick(USER_IDS),
      created_at: isoDate(daysFromNow - randomInt(7, 30)),
      updated_at: isoDate(daysFromNow),
    });
  }

  return reminders;
}

// ─── Dental Status ─────────────────────────────────────────────────
function seedDentalData(): { dentalStatus: any[]; dentalStatusHistory: any[]; dentalConditions: any[]; toothConditions: any[]; toothInterventions: any[] } {
  const dentalStatus: any[] = [];
  const dentalStatusHistory: any[] = [];
  const toothConditions: any[] = [];
  const toothInterventions: any[] = [];

  const statuses: Array<'healthy' | 'cavity' | 'filled' | 'crown' | 'missing' | 'implant' | 'root_canal' | 'extraction_needed'> = ['healthy', 'cavity', 'filled', 'crown', 'missing', 'implant', 'root_canal', 'extraction_needed'];

  const dentalConditions = [
    { id: uuid(), code: 'CAR', name: 'Carie', is_active: true, sort_order: 1, created_at: isoDate(-365) },
    { id: uuid(), code: 'GIN', name: 'Gingivită', is_active: true, sort_order: 2, created_at: isoDate(-365) },
    { id: uuid(), code: 'PAR', name: 'Parodontită', is_active: true, sort_order: 3, created_at: isoDate(-365) },
    { id: uuid(), code: 'PUL', name: 'Pulpită', is_active: true, sort_order: 4, created_at: isoDate(-365) },
    { id: uuid(), code: 'ABS', name: 'Abces', is_active: true, sort_order: 5, created_at: isoDate(-365) },
    { id: uuid(), code: 'FRA', name: 'Fractură', is_active: true, sort_order: 6, created_at: isoDate(-365) },
    { id: uuid(), code: 'ERO', name: 'Eroziune', is_active: true, sort_order: 7, created_at: isoDate(-365) },
    { id: uuid(), code: 'MAL', name: 'Malpoziție', is_active: true, sort_order: 8, created_at: isoDate(-365) },
  ];

  // Generate dental status for 50 patients
  const patientsWithDental = PATIENT_IDS.slice(0, 50);
  const allTeeth = [11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48];

  for (const patientId of patientsWithDental) {
    // Random subset of teeth with non-healthy status
    const numAffected = randomInt(2, 10);
    const affectedTeeth = pickN(allTeeth, numAffected);

    for (const tooth of affectedTeeth) {
      const status = pick(statuses.filter(s => s !== 'healthy'));
      dentalStatus.push({
        id: uuid(),
        patient_id: patientId,
        tooth_number: tooth,
        status,
        notes: null,
        updated_at: isoDate(-randomInt(1, 180)),
      });

      // History entry
      dentalStatusHistory.push({
        id: uuid(),
        patient_id: patientId,
        tooth_number: tooth,
        old_status: 'healthy',
        new_status: status,
        notes: null,
        changed_by: pick(USER_IDS),
        changed_at: isoDate(-randomInt(1, 180)),
      });
    }

    // Some tooth conditions
    if (Math.random() > 0.5) {
      const condTeeth = pickN(allTeeth, randomInt(1, 3));
      for (const tooth of condTeeth) {
        toothConditions.push({
          id: uuid(),
          patient_id: patientId,
          tooth_number: tooth,
          condition_id: pick(dentalConditions).id,
          notes: null,
          created_by: pick(USER_IDS),
          created_at: isoDate(-randomInt(1, 90)),
        });
      }
    }

    // Some interventions
    if (Math.random() > 0.4) {
      const numInterventions = randomInt(1, 3);
      for (let j = 0; j < numInterventions; j++) {
        toothInterventions.push({
          id: uuid(),
          patient_id: patientId,
          tooth_number: pick(allTeeth),
          treatment_name: pick(['Obturație compozit', 'Tratament de canal', 'Extracție', 'Coroană', 'Detartraj']),
          treatment_id: pick(TREATMENT_IDS),
          doctor_id: pick(DOCTOR_IDS),
          performed_at: isoDate(-randomInt(1, 180)),
          notes: null,
          created_at: isoDate(-randomInt(1, 180)),
        });
      }
    }
  }

  return { dentalStatus, dentalStatusHistory, dentalConditions, toothConditions, toothInterventions };
}

// ─── Treatment Plans ───────────────────────────────────────────────
function seedTreatmentPlans(): { plans: any[]; items: any[] } {
  const plans: any[] = [];
  const items: any[] = [];
  const treatments = seedTreatments();
  const planPatients = PATIENT_IDS.slice(0, 40);

  for (let i = 0; i < 40; i++) {
    const planId = uuid();
    const patientId = planPatients[i];
    const doctorId = pick(DOCTOR_IDS);

    plans.push({
      id: planId,
      patient_id: patientId,
      doctor_id: doctorId,
      name: pick(['Plan tratament general', 'Plan reabilitare orală', 'Plan ortodontic', 'Plan protetizare', 'Plan implant', null]),
      notes: Math.random() > 0.7 ? 'Planul include toate procedurile necesare.' : null,
      discount_percent: Math.random() > 0.8 ? pick([5, 10, 15]) : 0,
      next_appointment_date: Math.random() > 0.5 ? randomDate(1, 30) : null,
      next_appointment_time: Math.random() > 0.5 ? randomTime() : null,
      created_at: isoDate(-randomInt(1, 90)),
      updated_at: isoDate(-randomInt(0, 30)),
    });

    // Add 2-6 items per plan
    const numItems = randomInt(2, 6);
    const planTreatments = pickN(treatments, numItems);
    for (let j = 0; j < planTreatments.length; j++) {
      const t = planTreatments[j];
      const isCompleted = Math.random() > 0.6;

      items.push({
        id: uuid(),
        treatment_plan_id: planId,
        treatment_id: t.id,
        treatment_name: t.name,
        tooth_number: Math.random() > 0.5 ? randomInt(11, 48) : null,
        tooth_numbers: null,
        price: t.default_price,
        quantity: 1,
        duration: t.default_duration,
        discount_percent: null,
        laborator: null,
        cas: t.cas || null,
        payment_status: isCompleted ? 'paid' : 'pending',
        paid_amount: isCompleted ? t.default_price : 0,
        completed_at: isCompleted ? isoDate(-randomInt(1, 60)) : null,
        completed_appointment_id: null,
        doctor_id: doctorId,
        sort_order: j,
        created_at: isoDate(-randomInt(1, 90)),
      });
    }
  }

  return { plans, items };
}

// ─── Doctor Shifts ─────────────────────────────────────────────────
function seedDoctorShifts(): any[] {
  const shifts: any[] = [];

  // Generate shifts for past 2 weeks and next 4 weeks
  for (let d = -14; d <= 28; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue; // Skip Sundays

    const shiftDate = date.toISOString().split('T')[0];

    for (let docIdx = 0; docIdx < 5; docIdx++) {
      // Each doctor works ~4 days a week
      if (Math.random() > 0.75) continue;

      const isMorning = Math.random() > 0.5;
      shifts.push({
        id: uuid(),
        doctor_id: DOCTOR_IDS[docIdx],
        cabinet_id: CABINET_IDS[docIdx],
        shift_date: shiftDate,
        start_time: isMorning ? '08:00' : '13:00',
        end_time: isMorning ? '14:00' : '20:00',
        notes: null,
        created_at: isoDate(-14),
        updated_at: isoDate(-14),
      });
    }
  }

  return shifts;
}

// ─── Doctor Time Off ───────────────────────────────────────────────
function seedDoctorTimeOff(): any[] {
  return [
    { id: uuid(), doctor_id: DOCTOR_IDS[0], start_date: randomDate(14, 14), end_date: randomDate(21, 21), time_off_type: 'vacation', status: 'approved', reason: 'Concediu de odihnă', approved_by: USER_IDS[0], approved_at: isoDate(-5), rejection_reason: null, created_at: isoDate(-10), updated_at: isoDate(-5) },
    { id: uuid(), doctor_id: DOCTOR_IDS[2], start_date: randomDate(7, 7), end_date: randomDate(8, 8), time_off_type: 'conference', status: 'approved', reason: 'Congres Implantologie', approved_by: USER_IDS[0], approved_at: isoDate(-3), rejection_reason: null, created_at: isoDate(-7), updated_at: isoDate(-3) },
    { id: uuid(), doctor_id: DOCTOR_IDS[1], start_date: randomDate(21, 21), end_date: randomDate(22, 22), time_off_type: 'sick_leave', status: 'pending', reason: null, approved_by: null, approved_at: null, rejection_reason: null, created_at: isoDate(-1), updated_at: isoDate(-1) },
  ];
}

// ─── Login Logs ────────────────────────────────────────────────────
function seedLoginLogs(): any[] {
  const logs: any[] = [];
  const emails = seedMockUsers().map(u => u.email);

  for (let i = 0; i < 60; i++) {
    const email = pick(emails);
    const user = seedMockUsers().find(u => u.email === email);
    logs.push({
      id: uuid(),
      user_id: user?.id || null,
      username: email,
      success: Math.random() > 0.05,
      ip_address: `192.168.1.${randomInt(1, 254)}`,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      error_message: Math.random() > 0.95 ? 'Invalid password' : null,
      created_at: isoDate(-randomInt(0, 30)),
    });
  }

  return logs.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// ─── App Settings ──────────────────────────────────────────────────
function seedAppSettings(): any[] {
  return [
    { setting_key: 'whatsapp_reminders_enabled', setting_value: 'true', description: 'Enable WhatsApp appointment reminders', created_at: isoDate(-365), updated_at: isoDate(-1) },
    { setting_key: 'whatsapp_reminder_message', setting_value: 'Bună ziua! Vă reamintim că aveți o programare mâine la clinica Perfect Smile Glim.', description: 'WhatsApp reminder template', created_at: isoDate(-365), updated_at: isoDate(-1) },
    { setting_key: 'clinic_name', setting_value: 'Perfect Smile Glim', description: 'Clinic name', created_at: isoDate(-365), updated_at: isoDate(-1) },
    { setting_key: 'clinic_phone', setting_value: '+40 721 000 000', description: 'Clinic phone', created_at: isoDate(-365), updated_at: isoDate(-1) },
    { setting_key: 'clinic_address', setting_value: 'Str. Republicii Nr. 10, Cluj-Napoca', description: 'Clinic address', created_at: isoDate(-365), updated_at: isoDate(-1) },
  ];
}

// ─── Prescriptions ─────────────────────────────────────────────────
function seedPrescriptions(): { prescriptions: any[]; items: any[] } {
  const prescriptions: any[] = [];
  const prescriptionItems: any[] = [];
  const medications = [
    { name: 'Amoxicilină 500mg', dosage: '1 comprimat la 8 ore', quantity: '21 comprimate' },
    { name: 'Ibuprofen 400mg', dosage: '1 comprimat la 8 ore, după masă', quantity: '15 comprimate' },
    { name: 'Paracetamol 500mg', dosage: '1-2 comprimate la 6-8 ore', quantity: '20 comprimate' },
    { name: 'Metronidazol 250mg', dosage: '1 comprimat la 8 ore', quantity: '21 comprimate' },
    { name: 'Ketonal 100mg', dosage: '1 comprimat la 12 ore', quantity: '10 comprimate' },
    { name: 'Augmentin 1g', dosage: '1 comprimat la 12 ore', quantity: '14 comprimate' },
    { name: 'Nurofen Express 400mg', dosage: '1 capsulă la nevoie', quantity: '12 capsule' },
    { name: 'Clorhexidină 0.2%', dosage: 'Clătiri bucale de 2 ori/zi', quantity: '1 flacon' },
  ];

  for (let i = 0; i < 15; i++) {
    const rxId = uuid();
    prescriptions.push({
      id: rxId,
      patient_id: pick(PATIENT_IDS),
      doctor_id: pick(DOCTOR_IDS),
      prescription_date: randomDate(-randomInt(1, 90), -randomInt(1, 90)),
      diagnostic: pick(['Pulpită acută', 'Abces dentoalveolar', 'Parodontită', 'Post-extracțional', 'Gingivită ulcero-necrotică']),
      nr_fisa: String(randomInt(1000, 9999)),
      serie_nr: `PS${String(randomInt(100, 999))}`,
      unitate_sanitara: 'Perfect Smile Glim SRL',
      judet: 'Cluj',
      localitate: 'Cluj-Napoca',
      created_at: isoDate(-randomInt(1, 90)),
      updated_at: isoDate(-randomInt(1, 90)),
    });

    // 1-3 medications per prescription
    const numMeds = randomInt(1, 3);
    const meds = pickN(medications, numMeds);
    for (let j = 0; j < meds.length; j++) {
      prescriptionItems.push({
        id: uuid(),
        prescription_id: rxId,
        medication: meds[j].name,
        dosage: meds[j].dosage,
        quantity: meds[j].quantity,
        sort_order: j,
        created_at: isoDate(-randomInt(1, 90)),
      });
    }
  }

  return { prescriptions, items: prescriptionItems };
}

// ─── Generate All Seed Data ────────────────────────────────────────
export function generateSeedData(): Record<string, any[]> {
  const patients = seedPatients();
  const treatments = seedTreatments();
  const { appointments, appointmentTreatments, treatmentRecords } = seedAppointments();
  const stockItems = seedStockItems();
  const stockMovements = seedStockMovements(stockItems);
  const { expenses, entries } = seedMonthlyExpenses();
  const { dentalStatus, dentalStatusHistory, dentalConditions, toothConditions, toothInterventions } = seedDentalData();
  const { plans, items: planItems } = seedTreatmentPlans();
  const { prescriptions, items: prescriptionItems } = seedPrescriptions();

  return {
    // Auth
    mock_users: seedMockUsers(),
    profiles: seedProfiles(),
    user_roles: seedUserRoles(),

    // Core
    doctors: seedDoctors(),
    cabinets: seedCabinets(),
    patients,
    treatments,

    // Appointments
    appointments,
    appointment_treatments: appointmentTreatments,
    treatment_records: treatmentRecords,

    // Treatment Plans
    treatment_plans: plans,
    treatment_plan_items: planItems,

    // Dental
    dental_status: dentalStatus,
    dental_status_history: dentalStatusHistory,
    dental_conditions: dentalConditions,
    tooth_conditions: toothConditions,
    tooth_interventions: toothInterventions,

    // Communication
    whatsapp_messages: seedWhatsAppMessages(),
    patient_reminders: seedPatientReminders(),

    // Lab
    lab_samples: seedLabSamples(),

    // Stock
    stock_items: stockItems,
    stock_movements: stockMovements,

    // Financial
    monthly_expenses: expenses,
    expense_entries: entries,
    cas_budget: seedCasBudget(),

    // Prescriptions
    prescriptions,
    prescription_items: prescriptionItems,

    // Doctor schedule
    doctor_shifts: seedDoctorShifts(),
    doctor_time_off: seedDoctorTimeOff(),

    // System
    app_settings: seedAppSettings(),
    login_logs: seedLoginLogs(),

    // Empty tables (will be populated by user actions)
    patient_documents: [],
    patient_radiographs: [],
  };
}
