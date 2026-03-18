import { createContext, useContext, useReducer, useMemo, useEffect, type ReactNode } from 'react';
import type {
  Order, OrderStatus, OrderStatusHistory, PaymentStatus, ExpenseStatus,
  Client, Payment, Expense, Vehicle, Driver, Route,
  DeliveryProof, PickupProof, DamageReport,
  User, AppSettings, Currency,
} from '../types';
import {
  orders as mockOrders,
  orderStatusHistory as mockStatusHistory,
  clients as mockClients,
  payments as mockPayments,
  expenses as mockExpenses,
  vehicles as mockVehicles,
  drivers as mockDrivers,
  routes as mockRoutes,
  users as mockUsers,
} from '../data';
import { saveState, loadState } from '../utils/storage';

// ── State ────────────────────────────────────────────────────────
interface DataStoreState {
  orders: Order[];
  statusHistory: OrderStatusHistory[];
  clients: Client[];
  payments: Payment[];
  expenses: Expense[];
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: Route[];
  users: User[];
  deliveryProofs: DeliveryProof[];
  pickupProofs: PickupProof[];
  damageReports: DamageReport[];
  settings: AppSettings;
}

// ── Actions ──────────────────────────────────────────────────────
type Action =
  | { type: 'UPDATE_ORDER_STATUS'; orderId: string; status: OrderStatus }
  | { type: 'UPDATE_PAYMENT_STATUS'; orderId: string; status: PaymentStatus }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'ASSIGN_DRIVER'; orderId: string; driverId: string }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'ADD_PAYMENT'; payment: Payment }
  | { type: 'ADD_CLIENT'; client: Client }
  | { type: 'DELETE_CLIENT'; clientId: string }
  | { type: 'ADD_VEHICLE'; vehicle: Vehicle }
  | { type: 'ADD_DRIVER'; driver: Driver }
  | { type: 'ADD_DELIVERY_PROOF'; proof: DeliveryProof }
  | { type: 'ADD_PICKUP_PROOF'; proof: PickupProof }
  | { type: 'ADD_DAMAGE_REPORT'; report: DamageReport }
  | { type: 'ADD_ORDER_PHOTOS'; orderId: string; photos: string[] }
  | { type: 'UPDATE_EXPENSE_STATUS'; expenseId: string; status: ExpenseStatus; aprobatDe?: string }
  | { type: 'UPDATE_ORDER'; orderId: string; updates: Partial<Order> }
  | { type: 'UPDATE_CLIENT'; clientId: string; updates: Partial<Client> }
  | { type: 'UPDATE_DRIVER'; driverId: string; updates: Partial<Driver> }
  | { type: 'DELETE_DRIVER'; driverId: string }
  | { type: 'UPDATE_VEHICLE'; vehicleId: string; updates: Partial<Vehicle> }
  | { type: 'DELETE_VEHICLE'; vehicleId: string }
  | { type: 'ADD_ROUTE'; route: Route }
  | { type: 'UPDATE_ROUTE'; routeId: string; updates: Partial<Route> }
  | { type: 'DELETE_ROUTE'; routeId: string }
  | { type: 'ADD_USER'; user: User }
  | { type: 'UPDATE_USER'; userId: string; updates: Partial<User> }
  | { type: 'DELETE_USER'; userId: string }
  | { type: 'UPDATE_SETTINGS'; updates: Partial<AppSettings> };

function reducer(state: DataStoreState, action: Action): DataStoreState {
  switch (action.type) {
    case 'UPDATE_ORDER_STATUS': {
      const now = new Date().toISOString();
      const newHistoryEntry: OrderStatusHistory = {
        id: `sh-${Date.now()}`,
        orderId: action.orderId,
        status: action.status,
        timestamp: now,
        userId: 'usr-1',
        userName: 'Admin',
      };
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? {
                ...o,
                status: action.status,
                ...(action.status === 'ridicat' && { dataRidicare: now }),
                ...(action.status === 'livrat' && { dataLivrare: now }),
              }
            : o
        ),
        statusHistory: [newHistoryEntry, ...state.statusHistory],
      };
    }
    case 'UPDATE_PAYMENT_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, statusPlata: action.status } : o
        ),
      };
    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] };
    case 'ASSIGN_DRIVER':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, soferId: action.driverId } : o
        ),
      };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] };
    case 'ADD_PAYMENT':
      return { ...state, payments: [action.payment, ...state.payments] };
    case 'ADD_CLIENT':
      return { ...state, clients: [action.client, ...state.clients] };
    case 'DELETE_CLIENT':
      return { ...state, clients: state.clients.filter((c) => c.id !== action.clientId) };
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [action.vehicle, ...state.vehicles] };
    case 'ADD_DRIVER':
      return { ...state, drivers: [action.driver, ...state.drivers] };
    case 'ADD_DELIVERY_PROOF': {
      const now = new Date().toISOString();
      const newHistory: OrderStatusHistory = {
        id: `sh-${Date.now()}`,
        orderId: action.proof.orderId,
        status: 'livrat',
        timestamp: now,
        userId: 'usr-1',
        userName: 'Șofer',
        nota: 'Dovadă livrare confirmată',
      };
      return {
        ...state,
        deliveryProofs: [action.proof, ...state.deliveryProofs],
        orders: state.orders.map((o) =>
          o.id === action.proof.orderId ? { ...o, status: 'livrat' as const, dataLivrare: now } : o
        ),
        statusHistory: [newHistory, ...state.statusHistory],
      };
    }
    case 'ADD_PICKUP_PROOF': {
      const now = new Date().toISOString();
      const newHistory: OrderStatusHistory = {
        id: `sh-${Date.now()}`,
        orderId: action.proof.orderId,
        status: 'ridicat',
        timestamp: now,
        userId: 'usr-1',
        userName: 'Șofer',
        nota: 'Dovadă ridicare confirmată',
      };
      return {
        ...state,
        pickupProofs: [action.proof, ...state.pickupProofs],
        orders: state.orders.map((o) =>
          o.id === action.proof.orderId ? { ...o, status: 'ridicat' as const, dataRidicare: now } : o
        ),
        statusHistory: [newHistory, ...state.statusHistory],
      };
    }
    case 'ADD_DAMAGE_REPORT': {
      const now = new Date().toISOString();
      const newHistory: OrderStatusHistory = {
        id: `sh-${Date.now()}`,
        orderId: action.report.orderId,
        status: 'problema',
        timestamp: now,
        userId: action.report.raportatDe,
        userName: 'Raport daune',
        nota: action.report.descriere,
      };
      return {
        ...state,
        damageReports: [action.report, ...state.damageReports],
        orders: state.orders.map((o) =>
          o.id === action.report.orderId ? { ...o, status: 'problema' as const } : o
        ),
        statusHistory: [newHistory, ...state.statusHistory],
      };
    }
    case 'ADD_ORDER_PHOTOS':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? { ...o, photos: [...(o.photos ?? []), ...action.photos] }
            : o
        ),
      };
    case 'UPDATE_EXPENSE_STATUS':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.expenseId
            ? { ...e, status: action.status, aprobatDe: action.aprobatDe }
            : e
        ),
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, ...action.updates } : o
        ),
      };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.clientId ? { ...c, ...action.updates } : c
        ),
      };
    case 'UPDATE_DRIVER':
      return {
        ...state,
        drivers: state.drivers.map((d) =>
          d.id === action.driverId ? { ...d, ...action.updates } : d
        ),
      };
    case 'DELETE_DRIVER':
      return { ...state, drivers: state.drivers.filter((d) => d.id !== action.driverId) };
    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map((v) =>
          v.id === action.vehicleId ? { ...v, ...action.updates } : v
        ),
      };
    case 'DELETE_VEHICLE':
      return { ...state, vehicles: state.vehicles.filter((v) => v.id !== action.vehicleId) };
    case 'ADD_ROUTE':
      return { ...state, routes: [action.route, ...state.routes] };
    case 'UPDATE_ROUTE':
      return {
        ...state,
        routes: state.routes.map((r) =>
          r.id === action.routeId ? { ...r, ...action.updates } : r
        ),
      };
    case 'DELETE_ROUTE':
      return { ...state, routes: state.routes.filter((r) => r.id !== action.routeId) };
    case 'ADD_USER':
      return { ...state, users: [action.user, ...state.users] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.userId ? { ...u, ...action.updates } : u
        ),
      };
    case 'DELETE_USER':
      return { ...state, users: state.users.filter((u) => u.id !== action.userId) };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.updates } };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────
interface DataStoreContextType {
  state: DataStoreState;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  addOrder: (order: Order) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  addExpense: (expense: Expense) => void;
  addPayment: (payment: Payment) => void;
  addClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  addVehicle: (vehicle: Vehicle) => void;
  addDriver: (driver: Driver) => void;
  addDeliveryProof: (proof: DeliveryProof) => void;
  addPickupProof: (proof: PickupProof) => void;
  addDamageReport: (report: DamageReport) => void;
  addOrderPhotos: (orderId: string, photos: string[]) => void;
  updateExpenseStatus: (expenseId: string, status: ExpenseStatus, aprobatDe?: string) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;
  updateDriver: (driverId: string, updates: Partial<Driver>) => void;
  deleteDriver: (driverId: string) => void;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (vehicleId: string) => void;
  addRoute: (route: Route) => void;
  updateRoute: (routeId: string, updates: Partial<Route>) => void;
  deleteRoute: (routeId: string) => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const DataStoreContext = createContext<DataStoreContextType | null>(null);

const saved = loadState();
const initialState: DataStoreState = {
  orders: saved?.orders ?? [...mockOrders],
  statusHistory: saved?.statusHistory ?? [...mockStatusHistory],
  clients: saved?.clients ?? [...mockClients],
  payments: saved?.payments ?? [...mockPayments],
  expenses: saved?.expenses ?? [...mockExpenses],
  vehicles: saved?.vehicles ?? [...mockVehicles],
  drivers: saved?.drivers ?? [...mockDrivers],
  routes: saved?.routes ?? [...mockRoutes],
  users: saved?.users ?? [...mockUsers],
  deliveryProofs: saved?.deliveryProofs ?? [],
  pickupProofs: saved?.pickupProofs ?? [],
  damageReports: saved?.damageReports ?? [],
  settings: saved?.settings ?? {
    companyName: 'TransEurop SRL',
    email: 'office@transeurop.ro',
    phone: '+40 740 000 000',
    logo: null,
    currencies: ['EUR', 'GBP', 'RON'] as Currency[],
  },
};

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const timer = setTimeout(() => saveState(state), 300);
    return () => clearTimeout(timer);
  }, [state]);

  const actions = useMemo(
    () => ({
      updateOrderStatus: (orderId: string, status: OrderStatus) =>
        dispatch({ type: 'UPDATE_ORDER_STATUS', orderId, status }),
      updatePaymentStatus: (orderId: string, status: PaymentStatus) =>
        dispatch({ type: 'UPDATE_PAYMENT_STATUS', orderId, status }),
      addOrder: (order: Order) =>
        dispatch({ type: 'ADD_ORDER', order }),
      assignDriver: (orderId: string, driverId: string) =>
        dispatch({ type: 'ASSIGN_DRIVER', orderId, driverId }),
      addExpense: (expense: Expense) =>
        dispatch({ type: 'ADD_EXPENSE', expense }),
      addPayment: (payment: Payment) =>
        dispatch({ type: 'ADD_PAYMENT', payment }),
      addClient: (client: Client) =>
        dispatch({ type: 'ADD_CLIENT', client }),
      deleteClient: (clientId: string) =>
        dispatch({ type: 'DELETE_CLIENT', clientId }),
      addVehicle: (vehicle: Vehicle) =>
        dispatch({ type: 'ADD_VEHICLE', vehicle }),
      addDriver: (driver: Driver) =>
        dispatch({ type: 'ADD_DRIVER', driver }),
      addDeliveryProof: (proof: DeliveryProof) =>
        dispatch({ type: 'ADD_DELIVERY_PROOF', proof }),
      addPickupProof: (proof: PickupProof) =>
        dispatch({ type: 'ADD_PICKUP_PROOF', proof }),
      addDamageReport: (report: DamageReport) =>
        dispatch({ type: 'ADD_DAMAGE_REPORT', report }),
      addOrderPhotos: (orderId: string, photos: string[]) =>
        dispatch({ type: 'ADD_ORDER_PHOTOS', orderId, photos }),
      updateExpenseStatus: (expenseId: string, status: ExpenseStatus, aprobatDe?: string) =>
        dispatch({ type: 'UPDATE_EXPENSE_STATUS', expenseId, status, aprobatDe }),
      updateOrder: (orderId: string, updates: Partial<Order>) =>
        dispatch({ type: 'UPDATE_ORDER', orderId, updates }),
      updateClient: (clientId: string, updates: Partial<Client>) =>
        dispatch({ type: 'UPDATE_CLIENT', clientId, updates }),
      updateDriver: (driverId: string, updates: Partial<Driver>) =>
        dispatch({ type: 'UPDATE_DRIVER', driverId, updates }),
      deleteDriver: (driverId: string) =>
        dispatch({ type: 'DELETE_DRIVER', driverId }),
      updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) =>
        dispatch({ type: 'UPDATE_VEHICLE', vehicleId, updates }),
      deleteVehicle: (vehicleId: string) =>
        dispatch({ type: 'DELETE_VEHICLE', vehicleId }),
      addRoute: (route: Route) =>
        dispatch({ type: 'ADD_ROUTE', route }),
      updateRoute: (routeId: string, updates: Partial<Route>) =>
        dispatch({ type: 'UPDATE_ROUTE', routeId, updates }),
      deleteRoute: (routeId: string) =>
        dispatch({ type: 'DELETE_ROUTE', routeId }),
      addUser: (user: User) =>
        dispatch({ type: 'ADD_USER', user }),
      updateUser: (userId: string, updates: Partial<User>) =>
        dispatch({ type: 'UPDATE_USER', userId, updates }),
      deleteUser: (userId: string) =>
        dispatch({ type: 'DELETE_USER', userId }),
      updateSettings: (updates: Partial<AppSettings>) =>
        dispatch({ type: 'UPDATE_SETTINGS', updates }),
    }),
    []
  );

  const value = useMemo(() => ({ state, ...actions }), [state, actions]);

  return (
    <DataStoreContext.Provider value={value}>
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error('useDataStore must be used within DataStoreProvider');
  return ctx;
}

// Re-export types for convenience
export type { DataStoreState };
