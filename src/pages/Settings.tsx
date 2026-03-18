// ============================================================
// TransEurop - Settings / Setări Page
// ============================================================

import { useState, useRef } from 'react';
import { Save, Upload, Plus, Pencil, Trash2, Shield, User as UserIcon } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { Button, Input, Badge } from '../components/ui';
import { Select } from '../components/ui/Select';
import { BottomSheet } from '../components/ui/BottomSheet';
import { useToast } from '../contexts/ToastContext';
import { useDataStore } from '../contexts/DataStoreContext';
import { formatCurrency } from '../utils';
import type { Route, UserRole, Currency } from '../types';

type SettingsTab = 'general' | 'rute' | 'utilizatori';

const tabs: { key: SettingsTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'rute', label: 'Rute' },
  { key: 'utilizatori', label: 'Utilizatori' },
];

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  dispecer: 'Dispecer',
  sofer: 'Șofer',
  client: 'Client',
};

const roleBadge: Record<UserRole, 'danger' | 'info' | 'warning' | 'neutral'> = {
  admin: 'danger',
  dispecer: 'info',
  sofer: 'warning',
  client: 'neutral',
};

// ---- General Tab ----
function GeneralTab() {
  const store = useDataStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const settings = store.state.settings;
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState(settings.phone);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo);
  const [currencies, setCurrencies] = useState<string[]>(settings.currencies);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    store.updateSettings({
      companyName,
      email,
      phone,
      logo: logoPreview,
      currencies: currencies as Currency[],
    });
    setSaved(true);
    toast('Setările au fost salvate', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <div className="bg-bg-secondary border border-border rounded-[6px] p-5">
        <h3 className="text-[14px] font-semibold text-text-primary mb-4">
          Informații companie
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nume companie"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      {/* Logo Upload */}
      <div className="bg-bg-secondary border border-border rounded-[6px] p-5">
        <h3 className="text-[14px] font-semibold text-text-primary mb-4">Logo companie</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-[6px] border-2 border-dashed border-border bg-bg-primary overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-[11px] text-text-tertiary text-center leading-tight px-2">
                Logo
              </span>
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setLogoPreview(reader.result as string);
                    toast('Logo încărcat', 'success');
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <Button variant="secondary" size="sm" icon={<Upload />} onClick={() => fileRef.current?.click()}>
              Încarcă logo
            </Button>
            <p className="text-xs text-text-tertiary">PNG, SVG sau JPG. Max 2MB.</p>
          </div>
        </div>
      </div>

      {/* Currencies */}
      <div className="bg-bg-secondary border border-border rounded-[6px] p-5">
        <h3 className="text-[14px] font-semibold text-text-primary mb-4">Monede active</h3>
        <div className="flex flex-wrap gap-2">
          {['EUR', 'GBP', 'RON'].map((cur) => (
            <button
              key={cur}
              onClick={() =>
                setCurrencies((prev) =>
                  prev.includes(cur) ? prev.filter((c) => c !== cur) : [...prev, cur]
                )
              }
              className={[
                'h-9 px-4 rounded-[6px] text-[13px] font-medium border transition-colors',
                currencies.includes(cur)
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-primary text-text-secondary border-border hover:border-border-strong',
              ].join(' ')}
            >
              {cur}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-2">
          Selectează monedele utilizate în operațiuni.
        </p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button icon={<Save />} onClick={handleSave}>
          Salvează setările
        </Button>
        {saved && (
          <span className="text-[13px] text-success font-medium">
            Setările au fost salvate.
          </span>
        )}
      </div>
    </div>
  );
}

// ---- Routes Tab ----
function RoutesTab() {
  const store = useDataStore();
  const { toast } = useToast();
  const routes = store.state.routes;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Route>>({});
  const [addRouteOpen, setAddRouteOpen] = useState(false);

  // Add route form state
  const [newRouteName, setNewRouteName] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newZilePlecare, setNewZilePlecare] = useState('');
  const [newZileSosire, setNewZileSosire] = useState('');
  const [newDurata, setNewDurata] = useState('');
  const [newPretColetKg, setNewPretColetKg] = useState('');
  const [newPretPasager, setNewPretPasager] = useState('');
  const [newPretMasina, setNewPretMasina] = useState('');

  const startEdit = (route: Route) => {
    setEditingId(route.id);
    setEditValues({
      pretColetKg: route.pretColetKg,
      pretPasager: route.pretPasager,
      pretMasina: route.pretMasina,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    store.updateRoute(editingId, {
      pretColetKg: editValues.pretColetKg,
      pretPasager: editValues.pretPasager,
      pretMasina: editValues.pretMasina,
    });
    toast('Rută actualizată', 'success');
    setEditingId(null);
    setEditValues({});
  };

  const toggleActive = (id: string) => {
    const route = routes.find((r) => r.id === id);
    if (route) store.updateRoute(id, { activa: !route.activa });
  };

  const handleAddRoute = () => {
    if (!newRouteName.trim() || !newOrigin.trim() || !newDestination.trim()) return;
    store.addRoute({
      id: 'route-' + Date.now(),
      name: newRouteName.trim(),
      origin: newOrigin.trim(),
      destination: newDestination.trim(),
      zilePlecare: newZilePlecare.trim(),
      zileSosire: newZileSosire.trim(),
      durata: newDurata.trim(),
      pretColetKg: parseFloat(newPretColetKg) || 0,
      pretPasager: parseFloat(newPretPasager) || 0,
      pretMasina: parseFloat(newPretMasina) || 0,
      moneda: 'EUR' as Currency,
      activa: true,
    });
    toast('Rută adăugată', 'success');
    setAddRouteOpen(false);
    setNewRouteName('');
    setNewOrigin('');
    setNewDestination('');
    setNewZilePlecare('');
    setNewZileSosire('');
    setNewDurata('');
    setNewPretColetKg('');
    setNewPretPasager('');
    setNewPretMasina('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-secondary">
          Gestionează rutele și prețurile
        </p>
        <Button size="sm" icon={<Plus />} onClick={() => setAddRouteOpen(true)}>
          Adaugă rută
        </Button>
      </div>

      <div className="border border-border rounded-[6px] overflow-hidden bg-bg-primary">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-bg-secondary">
                <th className="h-8 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Rută
                </th>
                <th className="h-8 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Zile
                </th>
                <th className="h-8 px-3 text-right text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Colet/kg
                </th>
                <th className="h-8 px-3 text-right text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Pasager
                </th>
                <th className="h-8 px-3 text-right text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Mașină
                </th>
                <th className="h-8 px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Status
                </th>
                <th className="h-8 px-3 text-right text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => {
                const isEditing = editingId === route.id;
                return (
                  <tr
                    key={route.id}
                    className="border-b border-border last:border-b-0 hover:bg-bg-tertiary transition-colors"
                  >
                    <td className="h-[42px] px-3">
                      <div>
                        <span className="text-[13px] font-medium text-text-primary">
                          {route.name}
                        </span>
                        <span className="block text-[11px] text-text-tertiary">
                          {route.origin} → {route.destination}
                        </span>
                      </div>
                    </td>
                    <td className="h-[42px] px-3 text-[12px] text-text-secondary">
                      <span className="block">{route.zilePlecare}</span>
                      <span className="block text-text-tertiary">{route.zileSosire}</span>
                    </td>
                    <td className="h-[42px] px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={editValues.pretColetKg ?? ''}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, pretColetKg: parseFloat(e.target.value) || 0 }))
                          }
                          className="w-24 h-10 sm:w-20 sm:h-7 px-2 rounded border border-border bg-bg-primary text-[12px] text-right font-mono focus:outline-none focus:border-accent"
                        />
                      ) : (
                        <span className="font-mono text-[12px] text-text-primary">
                          {formatCurrency(route.pretColetKg, route.moneda)}
                        </span>
                      )}
                    </td>
                    <td className="h-[42px] px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="1"
                          value={editValues.pretPasager ?? ''}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, pretPasager: parseFloat(e.target.value) || 0 }))
                          }
                          className="w-24 h-10 sm:w-20 sm:h-7 px-2 rounded border border-border bg-bg-primary text-[12px] text-right font-mono focus:outline-none focus:border-accent"
                        />
                      ) : (
                        <span className="font-mono text-[12px] text-text-primary">
                          {formatCurrency(route.pretPasager, route.moneda)}
                        </span>
                      )}
                    </td>
                    <td className="h-[42px] px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="10"
                          value={editValues.pretMasina ?? ''}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, pretMasina: parseFloat(e.target.value) || 0 }))
                          }
                          className="w-24 h-10 sm:w-20 sm:h-7 px-2 rounded border border-border bg-bg-primary text-[12px] text-right font-mono focus:outline-none focus:border-accent"
                        />
                      ) : (
                        <span className="font-mono text-[12px] text-text-primary">
                          {formatCurrency(route.pretMasina, route.moneda)}
                        </span>
                      )}
                    </td>
                    <td className="h-[42px] px-3 text-center">
                      <button onClick={() => toggleActive(route.id)}>
                        <Badge variant={route.activa ? 'success' : 'neutral'}>
                          {route.activa ? 'Activă' : 'Inactivă'}
                        </Badge>
                      </button>
                    </td>
                    <td className="h-[42px] px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Button size="sm" onClick={saveEdit}>
                              Salvează
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEdit}>
                              Anulează
                            </Button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(route)}
                              className="flex items-center justify-center size-7 rounded-[4px] text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                              title="Editează"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              className="flex items-center justify-center size-7 rounded-[4px] text-text-tertiary hover:bg-danger-bg hover:text-danger transition-colors"
                              title="Șterge"
                              onClick={() => { if (window.confirm('Sigur vrei să ștergi ruta ' + route.name + '?')) { store.deleteRoute(route.id); toast('Rută ștearsă', 'success'); } }}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add route bottom sheet */}
      <BottomSheet
        isOpen={addRouteOpen}
        onClose={() => setAddRouteOpen(false)}
        title="Rută nouă"
      >
        <div className="space-y-4">
          <Input
            label="Denumire"
            placeholder="Ex: București → Londra"
            value={newRouteName}
            onChange={(e) => setNewRouteName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Origine"
              placeholder="Ex: București"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              required
            />
            <Input
              label="Destinație"
              placeholder="Ex: Londra"
              value={newDestination}
              onChange={(e) => setNewDestination(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Zile plecare"
              placeholder="Ex: Ma, Jo, Sâ"
              value={newZilePlecare}
              onChange={(e) => setNewZilePlecare(e.target.value)}
            />
            <Input
              label="Zile sosire"
              placeholder="Ex: Mi, Vi, Du"
              value={newZileSosire}
              onChange={(e) => setNewZileSosire(e.target.value)}
            />
          </div>
          <Input
            label="Durată"
            placeholder="Ex: 28-32h"
            value={newDurata}
            onChange={(e) => setNewDurata(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Preț colet/kg"
              type="number"
              step="0.5"
              min="0"
              placeholder="0"
              value={newPretColetKg}
              onChange={(e) => setNewPretColetKg(e.target.value)}
            />
            <Input
              label="Preț pasager"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={newPretPasager}
              onChange={(e) => setNewPretPasager(e.target.value)}
            />
            <Input
              label="Preț mașină"
              type="number"
              step="10"
              min="0"
              placeholder="0"
              value={newPretMasina}
              onChange={(e) => setNewPretMasina(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setAddRouteOpen(false)}>
              Anulează
            </Button>
            <Button size="sm" onClick={handleAddRoute}>
              Adaugă rută
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

// ---- Users Tab ----
function UsersTab() {
  const store = useDataStore();
  const users = store.state.users;
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; email: string }>({ name: '', email: '' });
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('dispecer');
  const { toast } = useToast();

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    store.addUser({
      id: 'usr-' + Date.now(),
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
    });
    toast('Utilizator adăugat', 'success');
    setAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('dispecer');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-secondary">
          Gestionează utilizatorii și rolurile
        </p>
        <Button size="sm" icon={<Plus />} onClick={() => setAddUserOpen(true)}>
          Adaugă utilizator
        </Button>
      </div>

      <div className="grid gap-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-4 px-4 py-3 bg-bg-secondary border border-border rounded-[6px] hover:bg-bg-tertiary transition-colors"
          >
            {/* Avatar */}
            <div className="flex items-center justify-center size-10 rounded-full bg-bg-tertiary border border-border shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="size-4 text-text-tertiary" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editingUserId === user.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={editValues.name}
                    onChange={(e) => setEditValues(v => ({ ...v, name: e.target.value }))}
                    className="h-8 px-2.5 rounded-[6px] border border-border bg-bg-primary text-[13px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                    placeholder="Nume"
                  />
                  <input
                    type="email"
                    value={editValues.email}
                    onChange={(e) => setEditValues(v => ({ ...v, email: e.target.value }))}
                    className="h-8 px-2.5 rounded-[6px] border border-border bg-bg-primary text-[13px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                    placeholder="Email"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-text-primary truncate">
                      {user.name}
                    </span>
                    <Badge variant={roleBadge[user.role]}>
                      {user.role === 'admin' && <Shield className="size-2.5 mr-1" />}
                      {roleLabels[user.role]}
                    </Badge>
                  </div>
                  <span className="text-[12px] text-text-tertiary">{user.email}</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {editingUserId === user.id ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      store.updateUser(editingUserId!, { name: editValues.name, email: editValues.email });
                      setEditingUserId(null);
                      toast('Utilizator actualizat', 'success');
                    }}
                  >
                    Salvează
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingUserId(null)}>
                    Anulează
                  </Button>
                </>
              ) : (
                <>
                  <button
                    className="flex items-center justify-center size-7 rounded-[4px] text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                    title="Editează"
                    onClick={() => { setEditingUserId(user.id); setEditValues({ name: user.name, email: user.email }); }}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    className="flex items-center justify-center size-7 rounded-[4px] text-text-tertiary hover:bg-danger-bg hover:text-danger transition-colors"
                    title="Șterge"
                    onClick={() => { if (window.confirm('Sigur vrei să ștergi utilizatorul ' + user.name + '?')) { store.deleteUser(user.id); toast('Utilizator șters', 'success'); } }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add user bottom sheet */}
      <BottomSheet
        isOpen={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        title="Utilizator nou"
      >
        <div className="space-y-4">
          <Input
            label="Nume"
            placeholder="Numele utilizatorului"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            required
          />
          <Input
            label="Email"
            placeholder="email@exemplu.com"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            required
          />
          <Select
            label="Rol"
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
            options={[
              { value: 'admin', label: 'Administrator' },
              { value: 'dispecer', label: 'Dispecer' },
              { value: 'sofer', label: 'Șofer' },
              { value: 'client', label: 'Client' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setAddUserOpen(false)}>
              Anulează
            </Button>
            <Button size="sm" onClick={handleAddUser}>
              Adaugă utilizator
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

// ---- Main Settings Page ----
export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  return (
    <>
      <PageHeader title="Setări" subtitle="Configurări generale ale aplicației" />

      {/* Tab Bar */}
      <div className="flex gap-0 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'relative h-10 px-4 text-[13px] font-medium transition-colors',
              activeTab === tab.key
                ? 'text-accent'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && <GeneralTab />}
      {activeTab === 'rute' && <RoutesTab />}
      {activeTab === 'utilizatori' && <UsersTab />}
    </>
  );
}
