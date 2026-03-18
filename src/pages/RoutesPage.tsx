import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Clock,
  Calendar,
  Package,
  User,
  Car,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { addDays, format, startOfWeek, isSameDay } from 'date-fns';
import { ro } from 'date-fns/locale';

import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import type { Route } from '../types';
import { formatCurrency } from '../utils';
import { mockOrders } from '../data';
import { useDataStore } from '../contexts/DataStoreContext';

import PageHeader from '../components/layout/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

// ── Helpers ──────────────────────────────────────────────────────

const dayNames = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

function routeDepartsOnDay(route: Route, dayName: string): boolean {
  return route.zilePlecare.toLowerCase().includes(dayName.toLowerCase());
}

function getRouteOrderCount(routeId: string): number {
  return mockOrders.filter((o) => o.routeId === routeId).length;
}

function getRouteActiveOrderCount(routeId: string): number {
  return mockOrders.filter(
    (o) => o.routeId === routeId && !['finalizat', 'anulat'].includes(o.status)
  ).length;
}

// ── Component ────────────────────────────────────────────────────

export default function RoutesPage() {
  const store = useDataStore();
  const navigate = useNavigate();
  const routes = store.state.routes;

  const [routeStates, setRouteStates] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    routes.forEach((r) => {
      map[r.id] = r.activa;
    });
    return map;
  });

  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(
    () => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7),
    [weekOffset]
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dayName: dayNames[i],
        label: format(date, 'dd MMM', { locale: ro }),
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [weekStart]);

  const activeRoutes = routes.filter((r) => routeStates[r.id]);

  function toggleRoute(routeId: string) {
    setRouteStates((prev) => ({ ...prev, [routeId]: !prev[routeId] }));
  }

  return (
    <>
      <PageHeader
        title="Rute și Programări"
        subtitle={`${activeRoutes.length} rute active din ${routes.length} total`}
        actions={
          <Button size="sm" icon={<Plus />} onClick={() => navigate('/setari')}>
            Adaugă rută
          </Button>
        }
      />

      {/* Route cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {routes.map((route, index) => {
          const isActive = routeStates[route.id];
          const orderCount = getRouteOrderCount(route.id);
          const activeOrderCount = getRouteActiveOrderCount(route.id);

          return (
            <div
              key={route.id}
              className={[
                'flex flex-col gap-3 p-4 rounded-[6px] border transition-all duration-200 animate-enter',
                'hover:shadow-lg hover:-translate-y-0.5',
                isActive
                  ? 'border-border bg-bg-primary'
                  : 'border-border bg-bg-secondary opacity-60',
              ].join(' ')}
              style={{ '--stagger': index } as React.CSSProperties}
            >
              {/* Header: origin -> destination */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[14px] font-semibold text-text-primary truncate">
                    {route.origin}
                  </span>
                  <ArrowRight className="size-4 text-accent shrink-0" />
                  <span className="text-[14px] font-semibold text-text-primary truncate">
                    {route.destination}
                  </span>
                </div>
                <button
                  onClick={() => toggleRoute(route.id)}
                  className="shrink-0 text-text-secondary hover:text-text-primary transition-colors"
                  title={isActive ? 'Dezactivează ruta' : 'Activează ruta'}
                >
                  {isActive ? (
                    <ToggleRight className="size-6 text-success" />
                  ) : (
                    <ToggleLeft className="size-6 text-text-tertiary" />
                  )}
                </button>
              </div>

              {/* Schedule & duration */}
              <div className="flex flex-col gap-1.5 text-[12px]">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Calendar className="size-3.5 text-text-tertiary shrink-0" />
                  <span>Plecare: {route.zilePlecare}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Calendar className="size-3.5 text-text-tertiary shrink-0" />
                  <span>Sosire: {route.zileSosire}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Clock className="size-3.5 text-text-tertiary shrink-0" />
                  <span>Durată: {route.durata}</span>
                </div>
              </div>

              {/* Prices */}
              <div className="flex items-center gap-3 pt-1 border-t border-border">
                <div className="flex items-center gap-1 text-[12px]">
                  <Package className="size-3.5 text-text-tertiary" />
                  <span className="font-mono text-text-primary">
                    {formatCurrency(route.pretColetKg, route.moneda)}
                  </span>
                  <span className="text-text-tertiary">/kg</span>
                </div>
                <div className="flex items-center gap-1 text-[12px]">
                  <User className="size-3.5 text-text-tertiary" />
                  <span className="font-mono text-text-primary">
                    {formatCurrency(route.pretPasager, route.moneda)}
                  </span>
                  <span className="text-text-tertiary">/loc</span>
                </div>
                <div className="flex items-center gap-1 text-[12px]">
                  <Car className="size-3.5 text-text-tertiary" />
                  <span className="font-mono text-text-primary">
                    {formatCurrency(route.pretMasina, route.moneda)}
                  </span>
                  <span className="text-text-tertiary">/auto</span>
                </div>
              </div>

              {/* Footer: moneda + orders */}
              <div className="flex items-center justify-between text-[11px]">
                <Badge variant={isActive ? 'success' : 'neutral'}>
                  {isActive ? 'Activă' : 'Inactivă'}
                </Badge>
                <span className="text-text-secondary">
                  {activeOrderCount} active / {orderCount} total comenzi
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly calendar */}
      <div className="border border-border rounded-[6px] bg-bg-primary overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border">
          <h2 className="text-[14px] font-semibold text-text-primary">
            Calendar săptămânal — Plecări
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="flex items-center justify-center size-7 rounded-[4px] text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
              aria-label="Săptămâna anterioară"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2.5 h-7 rounded-[4px] text-[12px] font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              Astăzi
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="flex items-center justify-center size-7 rounded-[4px] text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
              aria-label="Săptămâna următoare"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 divide-x divide-border">
          {weekDays.map((day) => {
            const departingRoutes = activeRoutes.filter((r) =>
              routeDepartsOnDay(r, day.dayName)
            );

            return (
              <div key={day.dayName} className="min-h-[140px]">
                {/* Day header */}
                <div
                  className={[
                    'px-2 py-2 text-center border-b border-border',
                    day.isToday ? 'bg-accent/5' : 'bg-bg-secondary',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'text-[11px] font-semibold uppercase tracking-wider',
                      day.isToday ? 'text-accent' : 'text-text-secondary',
                    ].join(' ')}
                  >
                    {day.dayName}
                  </div>
                  <div
                    className={[
                      'text-[12px] mt-0.5',
                      day.isToday ? 'text-accent font-medium' : 'text-text-tertiary',
                    ].join(' ')}
                  >
                    {day.label}
                  </div>
                </div>

                {/* Departures */}
                <div className="p-1.5 flex flex-col gap-1">
                  {departingRoutes.length > 0 ? (
                    departingRoutes.map((route) => {
                      const activeCount = getRouteActiveOrderCount(route.id);
                      return (
                        <div
                          key={route.id}
                          className="p-1.5 rounded-[4px] bg-accent/5 border border-accent/15 hover:bg-accent/10 transition-colors"
                        >
                          <div className="text-[10px] font-semibold text-accent leading-tight truncate">
                            {route.origin} \→ {route.destination}
                          </div>
                          <div className="text-[10px] text-text-secondary mt-0.5 leading-tight">
                            {route.durata} \• {activeCount} cmd
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-1 py-2 text-center text-[10px] text-text-tertiary">
                      —
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
