import { useState } from 'react';
import { Fuel, Receipt, Wrench, Hotel, Wallet, AlertTriangle, MoreHorizontal, Camera, CircleDot, ParkingSquare } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';
import type { ExpenseCategory, Currency } from '../../types';

interface QuickExpenseProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories: { key: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'combustibil', label: 'Combustibil', icon: <Fuel /> },
  { key: 'taxe_drum', label: 'Taxe drum', icon: <Receipt /> },
  { key: 'intretinere', label: 'Întreținere', icon: <Wrench /> },
  { key: 'cazare', label: 'Cazare', icon: <Hotel /> },
  { key: 'diurna', label: 'Diurnă', icon: <Wallet /> },
  { key: 'parcare', label: 'Parcare', icon: <ParkingSquare /> },
  { key: 'anvelope', label: 'Anvelope', icon: <CircleDot /> },
  { key: 'amenzi', label: 'Amenzi', icon: <AlertTriangle /> },
  { key: 'altele', label: 'Altele', icon: <MoreHorizontal /> },
];

const currencies: Currency[] = ['EUR', 'GBP', 'RON'];

export function QuickExpense({ isOpen, onClose }: QuickExpenseProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<ExpenseCategory | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [receipt, setReceipt] = useState<string | null>(null);

  function resetState() {
    setSelected(null);
    setAmount('');
    setCurrency('EUR');
    setReceipt(null);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleReceiptCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceipt(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!selected || !amount) {
      toast('Selectează categoria și suma', 'warning');
      return;
    }
    toast(`Cheltuială ${amount} ${currency} salvată`, 'success');
    resetState();
    onClose();
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Cheltuială rapidă">
      <div className="space-y-5">
        {/* Category grid */}
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelected(cat.key)}
              className={[
                'flex flex-col items-center justify-center gap-1.5 p-3 rounded-[8px] border transition-colors min-h-[72px]',
                selected === cat.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-primary text-text-secondary hover:bg-bg-secondary',
              ].join(' ')}
            >
              <span className="[&_svg]:size-6">{cat.icon}</span>
              <span className="text-[11px] font-medium leading-tight text-center">
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs text-text-secondary mb-1">Sumă</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full text-2xl font-semibold text-text-primary bg-bg-secondary border border-border rounded-[8px] px-4 py-3 text-center focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Currency */}
        <div className="flex gap-2">
          {currencies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={[
                'flex-1 py-2.5 rounded-[8px] border text-[13px] font-semibold transition-colors',
                currency === c
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-bg-primary text-text-secondary hover:bg-bg-secondary',
              ].join(' ')}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Receipt photo */}
        <div>
          <label className="block text-xs text-text-secondary mb-1">Bon / Factură (opțional)</label>
          <label className="flex items-center justify-center gap-2 w-full h-12 border border-dashed border-border rounded-[8px] text-text-secondary text-[13px] cursor-pointer hover:bg-bg-secondary transition-colors">
            <Camera className="size-4" />
            <span>{receipt ? 'Foto adăugată' : 'Adaugă foto bon'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleReceiptCapture}
            />
          </label>
          {receipt && (
            <img
              src={receipt}
              alt="Bon"
              className="mt-2 h-16 rounded-[6px] object-cover border border-border"
            />
          )}
        </div>

        {/* Save */}
        <Button className="w-full" size="lg" onClick={handleSave}>
          Salvează
        </Button>
      </div>
    </BottomSheet>
  );
}
