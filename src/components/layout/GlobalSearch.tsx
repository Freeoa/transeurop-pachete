import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Users, Truck, X } from 'lucide-react';
import { useDataStore } from '../../contexts/DataStoreContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'order' | 'client' | 'driver';
  primary: string;
  secondary: string;
  route: string;
}

function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { state } = useDataStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
      // Small delay to ensure modal is rendered
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Search logic
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

    const q = debouncedQuery.toLowerCase();
    const items: SearchResult[] = [];

    // Orders: filter by AWB
    const matchedOrders = state.orders
      .filter((o) => o.awb.toLowerCase().includes(q))
      .slice(0, 5);
    for (const order of matchedOrders) {
      const route = state.routes.find((r) => r.id === order.routeId);
      items.push({
        id: order.id,
        type: 'order',
        primary: order.awb,
        secondary: route ? `${route.origin} → ${route.destination}` : '',
        route: `/comenzi/${order.id}`,
      });
    }

    // Clients: filter by name or telefon
    const matchedClients = state.clients
      .filter((c) => c.name.toLowerCase().includes(q) || c.telefon.includes(q))
      .slice(0, 5);
    for (const client of matchedClients) {
      items.push({
        id: client.id,
        type: 'client',
        primary: client.name,
        secondary: client.telefon,
        route: '/clienti',
      });
    }

    // Drivers: filter by name
    const matchedDrivers = state.drivers
      .filter((d) => d.name.toLowerCase().includes(q))
      .slice(0, 5);
    for (const driver of matchedDrivers) {
      items.push({
        id: driver.id,
        type: 'driver',
        primary: driver.name,
        secondary: driver.telefon,
        route: '/soferi',
      });
    }

    return items;
  }, [debouncedQuery, state.orders, state.clients, state.drivers, state.routes]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: { label: string; icon: typeof Package; items: SearchResult[] }[] = [];
    const orders = results.filter((r) => r.type === 'order');
    const clients = results.filter((r) => r.type === 'client');
    const drivers = results.filter((r) => r.type === 'driver');
    if (orders.length > 0) groups.push({ label: 'Comenzi', icon: Package, items: orders });
    if (clients.length > 0) groups.push({ label: 'Clienți', icon: Users, items: clients });
    if (drivers.length > 0) groups.push({ label: 'Șoferi', icon: Truck, items: drivers });
    return groups;
  }, [results]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => results, [results]);

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      navigate(result.route);
      onClose();
    },
    [navigate, onClose],
  );

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          navigateToResult(flatResults[selectedIndex]);
        }
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, flatResults, selectedIndex, navigateToResult]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  if (!isOpen) return null;

  const iconForType = (type: 'order' | 'client' | 'driver') => {
    if (type === 'order') return <Package className="size-4 text-text-tertiary" />;
    if (type === 'client') return <Users className="size-4 text-text-tertiary" />;
    return <Truck className="size-4 text-text-tertiary" />;
  };

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full mx-auto mt-[15vh] bg-bg-primary border border-border rounded-[10px] shadow-2xl overflow-hidden animate-[modal-in_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="size-4 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută comenzi, clienți, șoferi..."
            className="flex-1 h-12 text-[15px] text-text-primary placeholder:text-text-tertiary bg-transparent focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {!debouncedQuery.trim() && (
            <div className="px-4 py-8 text-center text-[13px] text-text-tertiary">
              Tastați pentru a căuta...
            </div>
          )}

          {debouncedQuery.trim() && results.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-text-tertiary">
              Niciun rezultat găsit
            </div>
          )}

          {groupedResults.map((group) => (
            <div key={group.label}>
              <div className="px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary bg-bg-secondary">
                {group.label}
              </div>
              {group.items.map((item) => {
                flatIndex++;
                const idx = flatIndex;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateToResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      isSelected ? 'bg-accent/8' : 'hover:bg-bg-secondary',
                    ].join(' ')}
                  >
                    {iconForType(item.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-text-primary truncate">{item.primary}</p>
                      {item.secondary && (
                        <p className="text-[11px] text-text-tertiary truncate">{item.secondary}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-text-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded-[3px] bg-bg-tertiary border border-border text-[10px]">↑↓</kbd>
            navigare
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded-[3px] bg-bg-tertiary border border-border text-[10px]">Enter</kbd>
            selectare
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded-[3px] bg-bg-tertiary border border-border text-[10px]">Esc</kbd>
            închide
          </span>
        </div>
      </div>
    </div>
  );
}

export { GlobalSearch };
export type { GlobalSearchProps };
