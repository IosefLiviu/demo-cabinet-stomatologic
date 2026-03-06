/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock Supabase Client - In-memory database with localStorage persistence
// Implements the Supabase JS client API surface used by this project

const STORAGE_KEY = 'mock_supabase_db';
const AUTH_KEY = 'mock_supabase_auth';

type Listener = (event: string, session: any) => void;

// ─── In-Memory Store ───────────────────────────────────────────────
let store: Record<string, any[]> = {};
let authListeners: Listener[] = [];
let currentSession: any = null;
let fileStore: Record<string, Blob> = {};

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function now(): string {
  return new Date().toISOString();
}

// ─── Persistence ───────────────────────────────────────────────────
function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* localStorage full or unavailable */ }
}

function loadStore(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      store = JSON.parse(raw);
      return true;
    }
  } catch { /* parse error */ }
  return false;
}

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      currentSession = JSON.parse(raw);
    }
  } catch { /* ignore */ }
}

function saveAuth() {
  try {
    if (currentSession) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentSession));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch { /* ignore */ }
}

// ─── Table helpers ─────────────────────────────────────────────────
function getTable(name: string): any[] {
  if (!store[name]) store[name] = [];
  return store[name];
}

function setTable(name: string, data: any[]) {
  store[name] = data;
  saveStore();
}

// ─── Relationship map (for join resolution) ────────────────────────
interface RelDef { fk: string; table: string; pk: string; }
const RELATIONSHIPS: Record<string, Record<string, RelDef>> = {
  appointments: {
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
    doctors: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
    treatments: { fk: 'treatment_id', table: 'treatments', pk: 'id' },
  },
  appointment_treatments: {
    appointments: { fk: 'appointment_id', table: 'appointments', pk: 'id' },
    treatments: { fk: 'treatment_id', table: 'treatments', pk: 'id' },
    treatment_plan_items: { fk: 'plan_item_id', table: 'treatment_plan_items', pk: 'id' },
  },
  dental_status: {
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
  },
  dental_status_history: {
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
  },
  doctor_shifts: {
    cabinets: { fk: 'cabinet_id', table: 'cabinets', pk: 'id' },
    doctors: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
  },
  doctor_time_off: {
    doctors: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
  },
  expense_entries: {
    monthly_expenses: { fk: 'expense_id', table: 'monthly_expenses', pk: 'id' },
  },
  lab_samples: {
    cabinets: { fk: 'cabinet_id', table: 'cabinets', pk: 'id' },
    doctors: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
  },
  patient_documents: {
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
  },
  patient_radiographs: {
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
  },
  patient_reminders: {
    doctors: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
  },
  prescriptions: {
    doctors: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
  },
  prescription_items: {
    prescriptions: { fk: 'prescription_id', table: 'prescriptions', pk: 'id' },
  },
  stock_movements: {
    cabinets: { fk: 'cabinet_id', table: 'cabinets', pk: 'id' },
    stock_items: { fk: 'item_id', table: 'stock_items', pk: 'id' },
  },
  tooth_conditions: {
    dental_conditions: { fk: 'condition_id', table: 'dental_conditions', pk: 'id' },
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
  },
  tooth_interventions: {
    doctors: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
    treatments: { fk: 'treatment_id', table: 'treatments', pk: 'id' },
  },
  treatment_plan_items: {
    appointments: { fk: 'completed_appointment_id', table: 'appointments', pk: 'id' },
    doctors: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
    treatments: { fk: 'treatment_id', table: 'treatments', pk: 'id' },
    treatment_plans: { fk: 'treatment_plan_id', table: 'treatment_plans', pk: 'id' },
  },
  treatment_plans: {
    doctors: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
  },
  treatment_records: {
    appointments: { fk: 'appointment_id', table: 'appointments', pk: 'id' },
    patients: { fk: 'patient_id', table: 'patients', pk: 'id' },
    treatments: { fk: 'treatment_id', table: 'treatments', pk: 'id' },
  },
};

// Special aliased relationships (e.g., select('*, doctor:doctors(name)'))
const ALIAS_RELATIONSHIPS: Record<string, Record<string, RelDef>> = {
  tooth_interventions: {
    doctor: { fk: 'doctor_id', table: 'doctors', pk: 'id' },
  },
  tooth_conditions: {
    condition: { fk: 'condition_id', table: 'dental_conditions', pk: 'id' },
  },
};

// Reverse relationships (one-to-many from parent table)
const REVERSE_RELATIONSHIPS: Record<string, Record<string, { table: string; fk: string }>> = {
  appointments: {
    appointment_treatments: { table: 'appointment_treatments', fk: 'appointment_id' },
  },
  treatment_plans: {
    treatment_plan_items: { table: 'treatment_plan_items', fk: 'treatment_plan_id' },
  },
};

// ─── Select Parser ─────────────────────────────────────────────────
interface ParsedSelect {
  columns: string[] | '*';
  joins: { alias: string; relName: string; columns: string[] | '*' }[];
}

function parseSelect(selectStr: string): ParsedSelect {
  const result: ParsedSelect = { columns: '*', joins: [] };
  if (!selectStr || selectStr.trim() === '*') return result;

  const cols: string[] = [];
  let depth = 0;
  let current = '';

  for (const ch of selectStr) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      cols.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) cols.push(current.trim());

  const plainCols: string[] = [];
  for (const col of cols) {
    const joinMatch = col.match(/^(\w+)(?::(\w+))?\s*\(([^)]*)\)$/);
    if (joinMatch) {
      const alias = joinMatch[1];
      const relName = joinMatch[2] || joinMatch[1];
      const innerCols = joinMatch[3].trim();
      result.joins.push({
        alias,
        relName,
        columns: innerCols === '*' ? '*' : innerCols.split(',').map(c => c.trim()),
      });
    } else if (col === '*') {
      // keep as wildcard
    } else {
      plainCols.push(col.trim());
    }
  }

  if (plainCols.length > 0 && !cols.includes('*')) {
    result.columns = plainCols;
  }

  return result;
}

function pickColumns(row: any, columns: string[] | '*'): any {
  if (columns === '*') return { ...row };
  const result: any = {};
  for (const col of columns) {
    if (col in row) result[col] = row[col];
  }
  return result;
}

function resolveJoins(tableName: string, row: any, joins: ParsedSelect['joins']): any {
  const result = { ...row };

  for (const join of joins) {
    const { alias, relName, columns } = join;

    // Check alias relationships first
    const aliasRel = ALIAS_RELATIONSHIPS[tableName]?.[alias];
    // Check normal relationships
    const normalRel = RELATIONSHIPS[tableName]?.[relName] || RELATIONSHIPS[tableName]?.[alias];
    // Check reverse relationships
    const reverseRel = REVERSE_RELATIONSHIPS[tableName]?.[alias];

    const rel = aliasRel || normalRel;

    if (rel) {
      // Forward relationship (many-to-one)
      const fkValue = row[rel.fk];
      if (fkValue != null) {
        const relTable = getTable(rel.table);
        const related = relTable.find(r => r[rel.pk] === fkValue);
        result[alias] = related ? pickColumns(related, columns) : null;
      } else {
        result[alias] = null;
      }
    } else if (reverseRel) {
      // Reverse relationship (one-to-many)
      const relTable = getTable(reverseRel.table);
      const related = relTable.filter(r => r[reverseRel.fk] === row.id);
      result[alias] = related.map(r => pickColumns(r, columns));
    } else {
      result[alias] = null;
    }
  }

  return result;
}

// ─── Query Builder ─────────────────────────────────────────────────
type FilterFn = (row: any) => boolean;
type OrderSpec = { column: string; ascending: boolean; nullsFirst: boolean };

class MockQueryBuilder {
  private tableName: string;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectStr = '*';
  private countOption: string | null = null;
  private filters: FilterFn[] = [];
  private orders: OrderSpec[] = [];
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private limitCount: number | null = null;
  private insertData: any = null;
  private updateData: any = null;
  private returnData = false;
  private singleMode: 'single' | 'maybeSingle' | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns?: string, options?: { count?: string }): this {
    this.operation = 'select';
    if (columns) this.selectStr = columns;
    if (options?.count) this.countOption = options.count;
    return this;
  }

  insert(data: any): this {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any): this {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  // Filters
  eq(column: string, value: any): this {
    this.filters.push(row => row[column] === value);
    return this;
  }

  neq(column: string, value: any): this {
    this.filters.push(row => row[column] !== value);
    return this;
  }

  gt(column: string, value: any): this {
    this.filters.push(row => row[column] > value);
    return this;
  }

  gte(column: string, value: any): this {
    this.filters.push(row => row[column] >= value);
    return this;
  }

  lt(column: string, value: any): this {
    this.filters.push(row => row[column] < value);
    return this;
  }

  lte(column: string, value: any): this {
    this.filters.push(row => row[column] <= value);
    return this;
  }

  is(column: string, value: any): this {
    this.filters.push(row => row[column] === value);
    return this;
  }

  not(column: string, operator: string, value: any): this {
    if (operator === 'is') {
      this.filters.push(row => row[column] !== value);
    } else if (operator === 'eq') {
      this.filters.push(row => row[column] !== value);
    } else if (operator === 'in') {
      this.filters.push(row => !value.includes(row[column]));
    }
    return this;
  }

  in(column: string, values: any[]): this {
    this.filters.push(row => values.includes(row[column]));
    return this;
  }

  ilike(column: string, pattern: string): this {
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this.filters.push(row => regex.test(String(row[column] || '')));
    return this;
  }

  or(conditions: string, _opts?: any): this {
    // Parse simple OR conditions like "first_name.ilike.%search%,last_name.ilike.%search%"
    const parts = conditions.split(',');
    const fns: FilterFn[] = [];
    for (const part of parts) {
      const [col, op, ...valParts] = part.split('.');
      const val = valParts.join('.');
      if (op === 'ilike') {
        const regex = new RegExp(val.replace(/%/g, '.*'), 'i');
        fns.push(row => regex.test(String(row[col] || '')));
      } else if (op === 'eq') {
        fns.push(row => String(row[col]) === val);
      }
    }
    if (fns.length > 0) {
      this.filters.push(row => fns.some(fn => fn(row)));
    }
    return this;
  }

  // Ordering
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.orders.push({
      column,
      ascending: options?.ascending !== false,
      nullsFirst: options?.nullsFirst ?? false,
    });
    return this;
  }

  // Pagination
  range(from: number, to: number): this {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  // Return modes
  single(): PromiseLike<{ data: any; error: any }> {
    this.singleMode = 'single';
    this.returnData = true;
    return this as any;
  }

  maybeSingle(): PromiseLike<{ data: any; error: any }> {
    this.singleMode = 'maybeSingle';
    this.returnData = true;
    return this as any;
  }

  // Execute (makes the builder thenable)
  then(
    resolve?: (value: { data: any; error: any; count?: number | null }) => any,
    reject?: (error: any) => any
  ): Promise<any> {
    try {
      const result = this.execute();
      return resolve ? Promise.resolve(resolve(result)) : Promise.resolve(result);
    } catch (e) {
      return reject ? Promise.resolve(reject(e)) : Promise.reject(e);
    }
  }

  private execute(): { data: any; error: any; count?: number | null } {
    try {
      switch (this.operation) {
        case 'select': return this.executeSelect();
        case 'insert': return this.executeInsert();
        case 'update': return this.executeUpdate();
        case 'delete': return this.executeDelete();
        default: return { data: null, error: { message: 'Unknown operation' } };
      }
    } catch (e: any) {
      return { data: null, error: { message: e.message, code: e.code } };
    }
  }

  private executeSelect(): { data: any; error: any; count?: number | null } {
    let rows = [...getTable(this.tableName)];

    // Apply filters
    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }

    const totalCount = rows.length;

    // Apply ordering
    if (this.orders.length > 0) {
      rows.sort((a, b) => {
        for (const { column, ascending, nullsFirst } of this.orders) {
          const aVal = a[column];
          const bVal = b[column];

          if (aVal == null && bVal == null) continue;
          if (aVal == null) return nullsFirst ? -1 : 1;
          if (bVal == null) return nullsFirst ? 1 : -1;

          let cmp = 0;
          if (typeof aVal === 'string') {
            cmp = aVal.localeCompare(bVal);
          } else {
            cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          }

          if (cmp !== 0) return ascending ? cmp : -cmp;
        }
        return 0;
      });
    }

    // Apply range
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
    }

    // Apply limit
    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    // Parse select and resolve joins
    const parsed = parseSelect(this.selectStr);
    if (parsed.joins.length > 0) {
      rows = rows.map(row => {
        const picked = pickColumns(row, parsed.columns);
        return resolveJoins(this.tableName, picked, parsed.joins);
      });
    } else if (parsed.columns !== '*') {
      rows = rows.map(row => pickColumns(row, parsed.columns));
    }

    // Single mode
    if (this.singleMode === 'single') {
      if (rows.length === 0) return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
      if (rows.length > 1) return { data: null, error: { message: 'Multiple rows returned', code: 'PGRST116' } };
      return { data: rows[0], error: null };
    }
    if (this.singleMode === 'maybeSingle') {
      if (rows.length > 1) return { data: null, error: { message: 'Multiple rows returned', code: 'PGRST116' } };
      return { data: rows[0] || null, error: null };
    }

    const result: any = { data: rows, error: null };
    if (this.countOption) {
      result.count = totalCount;
    }
    return result;
  }

  private executeInsert(): { data: any; error: any } {
    const table = getTable(this.tableName);
    const isArray = Array.isArray(this.insertData);
    const items = isArray ? this.insertData : [this.insertData];

    const inserted: any[] = [];
    for (const item of items) {
      const record = {
        id: item.id || generateId(),
        created_at: item.created_at || now(),
        updated_at: item.updated_at || now(),
        ...item,
      };

      // Check unique constraints (simplified - check for tooth_conditions unique)
      if (this.tableName === 'tooth_conditions') {
        const existing = table.find(r =>
          r.patient_id === record.patient_id &&
          r.tooth_number === record.tooth_number &&
          r.condition_id === record.condition_id
        );
        if (existing) {
          const err: any = new Error('duplicate key value violates unique constraint');
          err.code = '23505';
          return { data: null, error: err };
        }
      }

      table.push(record);
      inserted.push(record);
    }

    setTable(this.tableName, table);

    if (this.returnData || this.singleMode) {
      if (this.singleMode === 'single' || this.singleMode === 'maybeSingle') {
        return { data: inserted[0] || null, error: null };
      }
      return { data: isArray ? inserted : inserted[0], error: null };
    }
    return { data: isArray ? inserted : inserted[0], error: null };
  }

  private executeUpdate(): { data: any; error: any } {
    const table = getTable(this.tableName);
    const updated: any[] = [];

    for (let i = 0; i < table.length; i++) {
      const row = table[i];
      const matches = this.filters.every(fn => fn(row));
      if (matches) {
        table[i] = { ...row, ...this.updateData, updated_at: now() };
        updated.push(table[i]);
      }
    }

    setTable(this.tableName, table);

    if (this.singleMode === 'single' || this.singleMode === 'maybeSingle') {
      return { data: updated[0] || null, error: null };
    }
    if (this.returnData) {
      return { data: updated, error: null };
    }
    return { data: updated, error: null };
  }

  private executeDelete(): { data: any; error: any } {
    const table = getTable(this.tableName);
    const remaining = table.filter(row => !this.filters.every(fn => fn(row)));
    setTable(this.tableName, remaining);
    return { data: null, error: null };
  }
}

// Make select() chainable to return self for further operations like .select().single()
// This is needed because insert().select().single() pattern
const originalInsert = MockQueryBuilder.prototype.insert;
const originalUpdate = MockQueryBuilder.prototype.update;

// Patch insert to allow .select() chaining
const origSelect = MockQueryBuilder.prototype.select;
MockQueryBuilder.prototype.select = function(this: any, columns?: string, options?: any) {
  if (this.operation === 'insert' || this.operation === 'update') {
    this.returnData = true;
    if (columns) this.selectStr = columns;
    return this;
  }
  return origSelect.call(this, columns, options);
};

// ─── Mock Auth ─────────────────────────────────────────────────────
const mockAuth = {
  onAuthStateChange(callback: Listener) {
    authListeners.push(callback);
    // Fire initial event if session exists
    if (currentSession) {
      setTimeout(() => callback('SIGNED_IN', currentSession), 0);
    }
    return {
      data: {
        subscription: {
          unsubscribe() {
            authListeners = authListeners.filter(l => l !== callback);
          }
        }
      }
    };
  },

  async getSession() {
    return { data: { session: currentSession }, error: null };
  },

  async getUser() {
    return { data: { user: currentSession?.user ?? null }, error: null };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    // Look up user in profiles table
    const profiles = getTable('profiles');
    const users = getTable('mock_users');
    const mockUser = users.find((u: any) => u.email === email && u.password === password);

    if (!mockUser) {
      return { data: { session: null, user: null }, error: { message: 'Email sau parolă incorectă' } };
    }

    const profile = profiles.find((p: any) => p.user_id === mockUser.id);

    const session = {
      access_token: 'mock-token-' + generateId(),
      refresh_token: 'mock-refresh-' + generateId(),
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        app_metadata: {},
        user_metadata: { full_name: profile?.full_name || mockUser.email },
        aud: 'authenticated',
        created_at: mockUser.created_at || now(),
      }
    };

    currentSession = session;
    saveAuth();

    // Notify listeners
    for (const listener of authListeners) {
      listener('SIGNED_IN', session);
    }

    // Log the login
    const loginLogs = getTable('login_logs');
    loginLogs.push({
      id: generateId(),
      user_id: mockUser.id,
      username: email,
      success: true,
      ip_address: '127.0.0.1',
      user_agent: navigator.userAgent,
      created_at: now(),
    });
    setTable('login_logs', loginLogs);

    return { data: { session, user: session.user }, error: null };
  },

  async signOut() {
    currentSession = null;
    saveAuth();
    for (const listener of authListeners) {
      listener('SIGNED_OUT', null);
    }
    return { error: null };
  },

  async updateUser(_updates: any) {
    return { data: { user: currentSession?.user }, error: null };
  },

  async resetPasswordForEmail(_email: string) {
    return { data: {}, error: null };
  },
};

// ─── Mock Storage ──────────────────────────────────────────────────
function createStorageBucket(_bucketName: string) {
  return {
    async upload(path: string, file: Blob | File, _options?: any) {
      fileStore[path] = file;
      return { data: { path }, error: null };
    },

    async download(path: string) {
      const file = fileStore[path];
      if (!file) return { data: null, error: { message: 'File not found' } };
      return { data: file, error: null };
    },

    async createSignedUrl(path: string, _expiresIn: number) {
      const file = fileStore[path];
      if (!file) return { data: null, error: { message: 'File not found' } };
      const url = URL.createObjectURL(file);
      return { data: { signedUrl: url }, error: null };
    },

    async remove(paths: string[]) {
      for (const path of paths) {
        delete fileStore[path];
      }
      return { data: paths, error: null };
    },
  };
}

const mockStorage = {
  from(bucketName: string) {
    return createStorageBucket(bucketName);
  }
};

// ─── Mock Functions ────────────────────────────────────────────────
const mockFunctions = {
  async invoke(name: string, options?: { body?: any }) {
    const body = options?.body || {};

    switch (name) {
      case 'send-whatsapp': {
        // Mock: store the message in whatsapp_messages
        const messages = getTable('whatsapp_messages');
        messages.push({
          id: generateId(),
          patient_phone: body.to || '',
          patient_name: body.patientName || '',
          patient_id: body.patientId || null,
          message_body: body.message || `Reminder: ${body.templateType || 'message'}`,
          message_sid: 'mock-sid-' + generateId().substring(0, 8),
          direction: 'outbound',
          status: 'sent',
          media_urls: null,
          media_types: null,
          created_at: now(),
          read_at: null,
        });
        setTable('whatsapp_messages', messages);
        return { data: { success: true, sid: 'mock-sid' }, error: null };
      }
      case 'send-lab-notification':
      case 'send-doctor-notification':
      case 'send-appointment-reminders':
        return { data: { success: true }, error: null };
      case 'create-user': {
        const users = getTable('mock_users');
        const profiles = getTable('profiles');
        const userRoles = getTable('user_roles');
        const newId = generateId();
        users.push({ id: newId, email: body.email, password: body.password || 'demo123', created_at: now() });
        profiles.push({ id: generateId(), user_id: newId, full_name: body.full_name || body.email, username: body.email, must_change_password: true, created_at: now(), updated_at: now() });
        if (body.role) {
          userRoles.push({ id: generateId(), user_id: newId, role: body.role, created_at: now() });
        }
        setTable('mock_users', users);
        setTable('profiles', profiles);
        setTable('user_roles', userRoles);
        return { data: { user: { id: newId } }, error: null };
      }
      case 'delete-user': {
        const userId = body.user_id;
        setTable('mock_users', getTable('mock_users').filter(u => u.id !== userId));
        setTable('profiles', getTable('profiles').filter(p => p.user_id !== userId));
        setTable('user_roles', getTable('user_roles').filter(r => r.user_id !== userId));
        return { data: { success: true }, error: null };
      }
      case 'reset-user-password':
        return { data: { success: true }, error: null };
      case 'lookup-user-email': {
        const profiles = getTable('profiles');
        const users = getTable('mock_users');
        const profile = profiles.find((p: any) =>
          p.username === body.username || p.full_name === body.username
        );
        if (profile) {
          const user = users.find((u: any) => u.id === profile.user_id);
          return { data: { email: user?.email, user_id: profile.user_id }, error: null };
        }
        // Also try matching by email directly
        const directUser = users.find((u: any) => u.email === body.username);
        if (directUser) {
          return { data: { email: directUser.email, user_id: directUser.id }, error: null };
        }
        return { data: { email: null }, error: null };
      }
      case 'log-login':
        return { data: { success: true }, error: null };
      case 'import-patients': {
        const patients = getTable('patients');
        const importedPatients = body.patients || [];
        let count = 0;
        for (const p of importedPatients) {
          patients.push({
            id: generateId(),
            first_name: p.first_name || 'Necunoscut',
            last_name: p.last_name || 'Necunoscut',
            phone: p.phone || '',
            email: p.email || null,
            date_of_birth: p.date_of_birth || null,
            gender: p.gender || null,
            cnp: p.cnp || null,
            allergies: null,
            medical_conditions: null,
            medications: null,
            notes: null,
            address: null,
            city: null,
            created_at: now(),
            updated_at: now(),
          });
          count++;
        }
        setTable('patients', patients);
        return { data: { imported: count }, error: null };
      }
      default:
        return { data: null, error: null };
    }
  }
};

// ─── Mock Realtime ─────────────────────────────────────────────────
class MockChannel {
  private _name: string;
  constructor(name: string) { this._name = name; }
  on(_event: string, _opts: any, _callback?: any) { return this; }
  subscribe(_callback?: any) { return this; }
  unsubscribe() { return this; }
}

// ─── Main Mock Client ──────────────────────────────────────────────
export const mockSupabase = {
  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  },

  auth: mockAuth,
  storage: mockStorage,
  functions: mockFunctions,

  channel(name: string) {
    return new MockChannel(name);
  },

  removeChannel(_channel: MockChannel) {
    return Promise.resolve();
  },

  // Utility: initialize the store
  _initStore(seedData: Record<string, any[]>) {
    store = seedData;
    saveStore();
  },

  _isSeeded() {
    return Object.keys(store).length > 0 && getTable('patients').length > 0;
  },

  _resetStore() {
    store = {};
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_KEY);
    currentSession = null;
    authListeners = [];
    fileStore = {};
  },

  _getStore() {
    return store;
  },
};

// Initialize from localStorage on load
loadStore();
loadAuth();
