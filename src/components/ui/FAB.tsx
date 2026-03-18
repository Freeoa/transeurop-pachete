import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIsMobile } from '../../hooks/useIsMobile';

export function FAB() {
  const { isMobile } = useIsMobile();
  const { isManager, isDriver, isClient } = useAuth();
  const navigate = useNavigate();

  if (!isMobile || isClient) return null;

  const handleClick = () => {
    if (isManager) navigate('/comenzi/nou');
    if (isDriver) {
      // Will trigger QuickExpense — for now navigate to cheltuieli
      navigate('/cheltuieli');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed z-40 right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-all"
      aria-label={isManager ? 'Comandă nouă' : 'Adaugă cheltuială'}
    >
      <Plus className="size-6" />
    </button>
  );
}
