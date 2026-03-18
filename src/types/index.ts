// ============================================================
// TransEurop - Type Definitions
// ============================================================

// Order types
export type OrderType = 'colet' | 'pasager' | 'masina';
export type OrderStatus = 'nou' | 'confirmat' | 'ridicat' | 'in_tranzit' | 'livrat' | 'finalizat' | 'anulat' | 'problema' | 'retur';
export type PaymentMethod = 'numerar_ridicare' | 'numerar_livrare' | 'transfer' | 'card';
export type PaymentStatus = 'neplatit' | 'platit' | 'partial';
export type UserRole = 'admin' | 'dispecer' | 'sofer' | 'client';
export type Currency = 'EUR' | 'GBP' | 'RON';
export type DriverStatus = 'disponibil' | 'pe_ruta' | 'liber';
export type ClientType = 'ocazional' | 'fidel';

export type DamageSeverity = 'minor' | 'major' | 'total';

export interface Order {
  id: string;
  awb: string;
  type: OrderType;
  status: OrderStatus;
  routeId: string;
  // Colet fields
  expeditor?: string;
  telefonExpeditor?: string;
  adresaRidicare: string;
  destinatar?: string;
  telefonDestinatar?: string;
  adresaLivrare: string;
  greutate?: number; // kg
  continut?: string;
  lungime?: number; // cm
  latime?: number;  // cm
  inaltime?: number; // cm
  // Pasager fields
  numePasager?: string;
  telefonPasager?: string;
  nrLocuri?: number;
  bagajKg?: number;
  // Masina fields
  proprietar?: string;
  telefonProprietar?: string;
  modelAuto?: string;
  nrInmatriculare?: string;
  // Common
  observatii?: string;
  photos?: string[]; // base64 photos (merchandise, address, etc.)
  pret: number;
  moneda: Currency;
  metodaPlata: PaymentMethod;
  statusPlata: PaymentStatus;
  soferId?: string;
  clientId?: string;
  dataCreare: string;
  dataRidicare?: string;
  dataLivrare?: string;
  dataEstimata?: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: string;
  userId: string;
  userName: string;
  nota?: string;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  zilePlecare: string;
  zileSosire: string;
  durata: string;
  pretColetKg: number;
  pretPasager: number;
  pretMasina: number;
  moneda: Currency;
  activa: boolean;
}

export interface Driver {
  id: string;
  name: string;
  telefon: string;
  vehiculId?: string;
  status: DriverStatus;
  foto?: string;
}

export interface Vehicle {
  id: string;
  tip: string;
  marca: string;
  model: string;
  matricula: string;
  capacitateLocuri: number;
  capacitateKg: number;
  areRemorca: boolean;
  arePlatforma: boolean;
}

export interface Client {
  id: string;
  name: string;
  telefon: string;
  telefon2?: string;
  email?: string;
  adrese: string[];
  tip: ClientType;
  note?: string;
  dataInregistrare: string;
}

export interface Payment {
  id: string;
  orderId: string;
  suma: number;
  moneda: Currency;
  metoda: PaymentMethod;
  data: string;
  incasatDe: string;
}

export type ExpenseCategory =
  | 'combustibil'
  | 'taxe_drum'
  | 'intretinere'
  | 'anvelope'
  | 'asigurari'
  | 'itp_revizie'
  | 'spalatorie'
  | 'parcare'
  | 'cazare'
  | 'diurna'
  | 'amenzi'
  | 'piese'
  | 'taxe_licente'
  | 'telefonie'
  | 'altele';

export type ExpenseStatus = 'in_asteptare' | 'aprobat' | 'respins';

export interface Expense {
  id: string;
  categorie: ExpenseCategory;
  descriere: string;
  suma: number;
  moneda: Currency;
  data: string;
  routeId?: string;
  soferId?: string;
  vehiculId?: string;
  // Fuel-specific
  litri?: number;
  pretLitru?: number;
  kmOdometru?: number;
  // Workflow
  status: ExpenseStatus;
  adaugatDe: string; // userId
  aprobatDe?: string; // userId
  // Document reference
  document?: string; // receipt reference / photo name
}

export interface Alert {
  id: string;
  tip: 'fara_sofer' | 'neplatit' | 'problema' | 'stagnare' | 'info';
  mesaj: string;
  severitate: 'critic' | 'atentie' | 'info';
  orderId?: string;
  timestamp: string;
  rezolvat: boolean;
}

export interface Note {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface AppSettings {
  companyName: string;
  email: string;
  phone: string;
  logo: string | null;
  currencies: Currency[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface DeliveryProof {
  id: string;
  orderId: string;
  photos: string[];
  signature?: string;
  note?: string;
  timestamp: string;
  gpsLat?: number;
  gpsLng?: number;
}

export interface PickupProof {
  id: string;
  orderId: string;
  photos: string[];
  note?: string;
  timestamp: string;
  gpsLat?: number;
  gpsLng?: number;
}

export interface DamageReport {
  id: string;
  orderId: string;
  photos: string[];
  descriere: string;
  severitate: DamageSeverity;
  timestamp: string;
  raportatDe: string; // userId
}
