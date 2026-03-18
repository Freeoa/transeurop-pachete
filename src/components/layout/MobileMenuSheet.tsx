import { useNavigate } from 'react-router-dom';
import { Calendar, Truck, UserCheck, Receipt, BarChart3, Settings, X } from 'lucide-react';

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Programări', path: '/programari', icon: Calendar },
  { label: 'Flotă', path: '/flota', icon: Truck },
  { label: 'Clienți', path: '/clienti', icon: UserCheck },
  { label: 'Cheltuieli', path: '/cheltuieli', icon: Receipt },
  { label: 'Rapoarte', path: '/rapoarte', icon: BarChart3 },
  { label: 'Setări', path: '/setari', icon: Settings },
];

export function MobileMenuSheet({ isOpen, onClose }: MobileMenuSheetProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary animate-[slide-up_200ms_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <h2 className="text-subhead text-text-primary">Mai mult</h2>
        <button
          onClick={onClose}
          className="flex items-center justify-center size-10 rounded-full hover:bg-bg-tertiary transition-colors"
          aria-label="Închide"
        >
          <X className="size-5 text-text-secondary" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className="flex flex-col items-center justify-center gap-2 min-h-[100px] border border-border rounded-[8px] bg-bg-primary hover:bg-bg-tertiary active:bg-bg-tertiary transition-colors"
          >
            <item.icon className="size-7 text-accent" strokeWidth={1.75} />
            <span className="text-[13px] font-medium text-text-primary">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
