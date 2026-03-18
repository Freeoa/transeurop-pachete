import { Truck, User } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Badge } from '../ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { mockDrivers, mockOrders, mockVehicles } from '../../data';
import type { DriverStatus } from '../../types';

interface AssignDriverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  onAssign?: (driverId: string) => void;
}

const statusVariant: Record<DriverStatus, 'success' | 'warning' | 'info'> = {
  disponibil: 'success',
  pe_ruta: 'warning',
  liber: 'info',
};

const statusLabel: Record<DriverStatus, string> = {
  disponibil: 'Disponibil',
  pe_ruta: 'Pe rută',
  liber: 'Liber',
};

export function AssignDriverSheet({ isOpen, onClose, orderId: _orderId, onAssign }: AssignDriverSheetProps) {
  const { toast } = useToast();

  const driversWithInfo = mockDrivers.map((driver) => {
    const vehicle = driver.vehiculId
      ? mockVehicles.find((v) => v.id === driver.vehiculId)
      : undefined;
    const orderCount = mockOrders.filter((o) => o.soferId === driver.id && !['finalizat', 'anulat'].includes(o.status)).length;
    return { driver, vehicle, orderCount };
  });

  const handleAssign = (driver: typeof mockDrivers[0]) => {
    onAssign?.(driver.id);
    toast(`Șofer asignat cu succes`, 'success');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Asignează șofer">
      <div className="flex flex-col gap-2">
        {driversWithInfo.map(({ driver, vehicle, orderCount }) => (
          <button
            key={driver.id}
            onClick={() => handleAssign(driver)}
            className="flex items-start gap-3 w-full p-3 rounded-[8px] border border-border bg-bg-primary text-left hover:border-border-strong hover:bg-bg-secondary transition-colors"
          >
            <div className="flex items-center justify-center size-10 rounded-full bg-bg-tertiary text-text-secondary shrink-0">
              <User className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[14px] font-medium text-text-primary truncate">
                  {driver.name}
                </span>
                <Badge variant={statusVariant[driver.status]}>
                  {statusLabel[driver.status]}
                </Badge>
              </div>
              <p className="text-[13px] text-text-secondary">{driver.telefon}</p>
              {vehicle && (
                <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1">
                  <Truck className="size-3" />
                  {vehicle.marca} {vehicle.model} ({vehicle.matricula})
                </p>
              )}
              <p className="text-xs text-text-tertiary mt-0.5">
                {orderCount} {orderCount === 1 ? 'comandă activă' : 'comenzi active'}
              </p>
            </div>
          </button>
        ))}
        {driversWithInfo.length === 0 && (
          <p className="text-center text-[13px] text-text-tertiary py-6">
            Niciun șofer disponibil
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
