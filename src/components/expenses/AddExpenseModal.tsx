import { useState } from 'react';
import {
  Fuel,
  Receipt,
  Wrench,
  CircleDot,
  ShieldCheck,
  ClipboardCheck,
  Droplets,
  ParkingSquare,
  Hotel,
  Wallet,
  AlertTriangle,
  Cog,
  FileText,
  Smartphone,
  MoreHorizontal,
} from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { getExpenseCategoryLabel } from '../../utils';
import { mockDrivers, mockVehicles } from '../../data';
import { useDataStore } from '../../contexts/DataStoreContext';
import type { Expense, ExpenseCategory, Currency } from '../../types';

const categoryIcons: Record<ExpenseCategory, typeof Fuel> = {
  combustibil: Fuel,
  taxe_drum: Receipt,
  intretinere: Wrench,
  anvelope: CircleDot,
  asigurari: ShieldCheck,
  itp_revizie: ClipboardCheck,
  spalatorie: Droplets,
  parcare: ParkingSquare,
  cazare: Hotel,
  diurna: Wallet,
  amenzi: AlertTriangle,
  piese: Cog,
  taxe_licente: FileText,
  telefonie: Smartphone,
  altele: MoreHorizontal,
};

const allCategories: ExpenseCategory[] = [
  'combustibil', 'taxe_drum', 'intretinere', 'anvelope', 'asigurari',
  'itp_revizie', 'spalatorie', 'parcare', 'cazare', 'diurna',
  'amenzi', 'piese', 'taxe_licente', 'telefonie', 'altele',
];

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (expense: Expense) => void;
}

export function AddExpenseModal({ isOpen, onClose, onSave }: AddExpenseModalProps) {
  const store = useDataStore();
  const [categorie, setCategorie] = useState<ExpenseCategory>('combustibil');
  const [descriere, setDescriere] = useState('');
  const [suma, setSuma] = useState('');
  const [moneda, setMoneda] = useState<Currency>('EUR');
  const [soferId, setSoferId] = useState('');
  const [vehiculId, setVehiculId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [litri, setLitri] = useState('');
  const [pretLitru, setPretLitru] = useState('');
  const [kmOdometru, setKmOdometru] = useState('');

  const isFuel = categorie === 'combustibil';
  const needsVehicle = ['combustibil', 'intretinere', 'anvelope', 'itp_revizie', 'spalatorie', 'piese'].includes(categorie);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Expense = {
      id: 'exp-' + Date.now(),
      categorie,
      descriere,
      suma: parseFloat(suma) || 0,
      moneda,
      data: new Date().toISOString(),
      soferId: soferId || undefined,
      vehiculId: vehiculId || undefined,
      routeId: routeId || undefined,
      litri: litri ? parseFloat(litri) : undefined,
      pretLitru: pretLitru ? parseFloat(pretLitru) : undefined,
      kmOdometru: kmOdometru ? parseInt(kmOdometru) : undefined,
      status: 'in_asteptare',
      adaugatDe: 'usr-1',
    };
    onSave?.(expense);
    onClose();
  };

  const CatIcon = categoryIcons[categorie];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Adaugă cheltuială" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category picker */}
        <div>
          <label className="text-[13px] font-medium text-text-primary block mb-2">Categorie</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {allCategories.map((cat) => {
              const Icon = categoryIcons[cat];
              const selected = categorie === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategorie(cat)}
                  className={[
                    'flex flex-col items-center gap-1 p-2 rounded-[6px] border text-[11px] transition-all',
                    selected
                      ? 'border-accent bg-accent/5 text-accent font-medium'
                      : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/30 hover:text-text-primary',
                  ].join(' ')}
                >
                  <Icon className="size-4" />
                  <span className="text-center leading-tight">{getExpenseCategoryLabel(cat)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <Input
          label="Descriere"
          placeholder="Ex: Motorină ruta București-Londra"
          value={descriere}
          onChange={(e) => setDescriere(e.target.value)}
          icon={<CatIcon />}
          required
        />

        {/* Amount + Currency row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Sumă"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={suma}
            onChange={(e) => setSuma(e.target.value)}
            required
          />
          <Select
            label="Monedă"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as Currency)}
            options={[
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (\£)' },
              { value: 'RON', label: 'RON' },
            ]}
          />
        </div>

        {/* Fuel-specific fields */}
        {isFuel && (
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Litri"
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={litri}
              onChange={(e) => setLitri(e.target.value)}
            />
            <Input
              label="Preț/litru"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={pretLitru}
              onChange={(e) => setPretLitru(e.target.value)}
            />
            <Input
              label="Km odometru"
              type="number"
              min="0"
              placeholder="0"
              value={kmOdometru}
              onChange={(e) => setKmOdometru(e.target.value)}
            />
          </div>
        )}

        {/* Odometer for maintenance */}
        {!isFuel && needsVehicle && (
          <Input
            label="Km odometru (opțional)"
            type="number"
            min="0"
            placeholder="0"
            value={kmOdometru}
            onChange={(e) => setKmOdometru(e.target.value)}
          />
        )}

        {/* Driver + Vehicle + Route */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Șofer"
            value={soferId}
            onChange={(e) => setSoferId(e.target.value)}
            placeholder="Selectează..."
            options={mockDrivers.map((d) => ({ value: d.id, label: d.name }))}
          />
          {needsVehicle && (
            <Select
              label="Vehicul"
              value={vehiculId}
              onChange={(e) => setVehiculId(e.target.value)}
              placeholder="Selectează..."
              options={mockVehicles.map((v) => ({ value: v.id, label: `${v.marca} ${v.model} (${v.matricula})` }))}
            />
          )}
          <Select
            label="Rută"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            placeholder="Selectează..."
            options={store.state.routes.map((r) => ({ value: r.id, label: `${r.origin} \→ ${r.destination}` }))}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Anulează
          </Button>
          <Button size="sm" type="submit">
            Salvează cheltuiala
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
