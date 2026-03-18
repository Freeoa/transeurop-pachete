# PROMPT COMPLETO — TRANSEUROP: APP PROFESIONAL DE GESTIÓN DE TRANSPORTE INTERNACIONAL

## INSTRUCCIÓN PRINCIPAL

Construye desde cero una aplicación web completa, profesional y funcional para una empresa de transporte internacional de paquetería, pasajeros y vehículos en plataforma que opera con furgonetas y microbuses (5-9 plazas) entre Rumanía, Inglaterra, Alemania e Italia (ida y vuelta semanal).

La app debe cubrir TODO el flujo operativo del negocio: desde que un cliente pide enviar un paquete, reservar un asiento o transportar un coche, hasta la entrega final, el cobro y la contabilidad interna.

El resultado debe parecer un producto SaaS real, maduro y serio. Debe funcionar como herramienta de trabajo diaria, accesible al 100% desde móvil (mobile-first para clientes, responsive para admin).

---

## CONTEXTO DEL NEGOCIO

### Qué hace esta empresa
- Recoge paquetes de particulares desde Inglaterra, Alemania, Italia y los trae a Rumanía (y viceversa, ida y vuelta semanal).
- Los paquetes van desde sobres y cajas pequeñas hasta bicicletas, sillas, electrodomésticos, muebles.
- Transporta pasajeros (1-8 plazas por microbús).
- Transporta coches subidos en plataforma/remolque.
- Opera con furgonetas tipo Mercedes Sprinter, Ford Transit, VW Crafter (5-9 plazas) que pueden llevar remolques para mercancía o plataformas para coches.

### Cómo funciona hoy (lo que hay que digitalizar)
- Todo se gestiona por teléfono y WhatsApp.
- Los pedidos se apuntan en papel o en la cabeza del conductor.
- Los clientes llaman, preguntan precio, reservan de palabra.
- El conductor recoge en domicilio, cobra en efectivo, entrega en destino.
- La contabilidad se lleva a mano o en Excel básico.
- Los clientes preguntan constantemente "¿dónde está mi paquete?" por WhatsApp.
- La asignación de conductores y rutas es manual.

### Rutas operativas
| Ruta | Días | Duración | Precio colet/kg | Precio asiento | Precio coche plataforma |
|------|------|----------|-----------------|----------------|------------------------|
| România → Anglia (UK) | Joi → Duminică | 28-32h | 3.5£/kg | 150£ | 600£ |
| România → Germania | Miercuri → Sâmbătă | 18-22h | 3.0€/kg | 120€ | 500€ |
| România → Italia | Vineri → Luni | 16-20h | 2.8€/kg | 100€ | 450€ |
| Anglia → România | Duminică → Miercuri | 28-32h | 3.5£/kg | 150£ | 600£ |
| Germania → România | Sâmbătă → Marți | 18-22h | 3.0€/kg | 120€ | 500€ |
| Italia → România | Luni → Joi | 16-20h | 2.8€/kg | 100€ | 450€ |

### Tipos de servicio
1. **Colet (paquete)** — se cobra por kg, puerta a puerta, con AWB y tracking
2. **Pasager (pasajero)** — se cobra por asiento, con reserva, datos personales y parada
3. **Mașină pe platformă (coche)** — se cobra tarifa fija, con matrícula y modelo

### Idiomas
- Interfaz principal en **Română** (la mayoría de clientes y operadores son rumanos)
- Los textos de este prompt están en español pero la app debe renderizarse en **Română**
- Preparar estructura para añadir inglés como segundo idioma en el futuro

---

## ARQUITECTURA DE LA APLICACIÓN

### Roles de usuario
1. **Admin / Patron** — Ve todo, configura precios, rutas, conductores, contabilidad, reportes
2. **Dispecer (Despachador)** — Gestiona pedidos del día, asigna conductores, actualiza estados
3. **Șofer (Conductor)** — Ve sus pedidos asignados, actualiza estado (ridicat/livrat), registra cobros
4. **Client** — Hace pedidos, ve sus envíos, hace tracking AWB, ve precios

### Módulos funcionales obligatorios

#### 1. COMENZI (Pedidos/Órdenes)
- Crear pedido nuevo (colet / pasager / mașină)
- Generar AWB automático (formato: AWB-2026-XXXXX)
- Campos según tipo:
  - **Colet**: expeditor, destinatar, telefon expeditor, telefon destinatar, adresă ridicare, adresă livrare, greutate (kg), conținut (descripción), observații, foto colet (opcional)
  - **Pasager**: nume, telefon, nr. locuri, adresă ridicare, adresă destinație, bagaj inclus (kg), observații
  - **Mașină**: proprietar, telefon, model auto, nr. înmatriculare, adresă ridicare, adresă livrare, observații
- Cálculo automático de precio según ruta × tipo × peso/locuri
- Estados del pedido: `Nou` → `Confirmat` → `Ridicat` → `În tranzit` → `Livrat` → `Finalizat`
- También: `Anulat`, `Problemă`, `Retur`
- Cada cambio de estado registra timestamp y quién lo cambió
- Posibilidad de añadir nota/comentario en cada estado
- Asignación de conductor a cada pedido
- Método de plată: Numerar la ridicare / Numerar la livrare / Transfer bancar / Card
- Estado de plată: Neplătit / Plătit / Parțial

#### 2. TRACKING AWB (Público)
- Página pública (sin login) donde el cliente introduce su AWB
- Muestra: estado actual, timeline de estados, ruta, conductor asignado (nombre + telefon), fecha estimada de livrare
- Enlace compartible por WhatsApp/SMS
- Diseño mobile-first, limpio, con la marca de la empresa

#### 3. RUTE ȘI PROGRAMĂRI (Rutas y Programación)
- Configurar rutas activas con días de plecare/sosire
- Configurar precios por ruta/tipo
- Ver calendario semanal de salidas
- Capacidad disponible por ruta (kg disponibles, locuri libere, plataformă disponibilă)

#### 4. ȘOFERI ȘI FLOTĂ (Conductores y Flota)
- Lista de conductores con: nombre, teléfono, vehículo asignado, matrícula, estado (disponibil/pe rută/liber)
- Lista de vehículos: tipo, matrícula, capacidad (locuri + kg), si tiene remolque/platformă
- Historial de rutas por conductor
- Asignación de conductor a ruta/pedidos

#### 5. CLIENȚI (Clientes)
- Base de datos de clientes con: nombre, teléfono(s), dirección(es) frecuentes, historial de pedidos, notas internas
- Diferenciación: client ocazional / client fidel
- Búsqueda rápida por nombre o teléfono

#### 6. FINANȚE (Finanzas)
- Registro de cobros (quién cobró, cuándo, cuánto, método)
- Estado de deuda por pedido
- Resumen de ingresos por ruta, por semana, por conductor
- Resumen de gastos operativos: combustibil, taxe drum, reparații, cazare
- Balance por ruta (ingresos - gastos)
- Exportar a Excel

#### 7. RAPOARTE (Reportes)
- Dashboard con KPIs principales:
  - Comenzi azi / săptămâna aceasta
  - Venituri totale (por monedă: € y £)
  - Colete în tranzit
  - Locuri ocupate vs disponibile
  - Comenzi neplătite
  - Comenzi cu problemă
- Gráficos: evolución semanal de pedidos, distribución por tipo, distribución por ruta, tasa de cobro
- Filtro por ruta, por tipo, por período, por conductor

#### 8. NOTIFICĂRI ȘI ALERTE
- Alerte pe ecran cuando:
  - Un pedido lleva más de 24h sin cambiar de estado
  - Un pedido tiene `Problemă`
  - Hay pedidos sin conductor asignado
  - Hay cobros pendientes de más de 7 días
- Posibilidad de enviar SMS/WhatsApp al cliente cuando cambia el estado (integración futura — preparar la estructura)

#### 9. SETĂRI (Configuración)
- Gestionar rutas y precios
- Gestionar conductores y vehículos
- Gestionar usuarios del sistema (admin, dispecer, șofer)
- Logo y datos de la empresa
- Monedas activas (RON, EUR, GBP)

---

## DIRECCIÓN VISUAL Y DISEÑO — REQUISITOS ESTRICTOS

### PROBLEMA QUE HAY QUE EVITAR
La interfaz NO debe parecer:
- Una plantilla genérica generada por IA
- Un demo con tarjetas gigantes y poco contenido
- Una app infantil o demasiado "amigable"
- Un collage de cards decorativas sin densidad real
- Un dashboard más decorativo que operativo

### OBJETIVO VISUAL
La interfaz debe sentirse:
- **Profesional** — como un producto SaaS real de gestión empresarial
- **Sobria** — colores controlados, solo para significado funcional
- **Densa pero limpia** — mucha información útil sin agobiar
- **Madura** — propia de software enterprise moderno
- **Funcional** — cada elemento tiene un propósito operativo real
- **Credible** — un cliente o inversor la vería y pensaría "esto es serio"

### REFERENCIAS VISUALES OBLIGATORIAS
Estudia el criterio, la estructura y la densidad de estas referencias antes de diseñar. Toma inspiración de la estructura, la jerarquía y la profesionalidad, NUNCA copies la apariencia exacta.

1. **Stripe Dashboard** — Para: jerarquía de dashboard, backoffice serio, estados financieros, bloques operativos compactos, navegación profesional
   - https://docs.stripe.com/dashboard/basics

2. **Shopify Polaris** — Para: estructura de panel admin, componentes de gestión, tablas, filtros, formularios, acciones de negocio
   - https://polaris-react.shopify.com/components
   - https://polaris-react.shopify.com/components/tables/data-table

3. **Linear** — Para: refinamiento visual, densidad, spacing, tipografía, sidebar, estética premium moderna
   - https://linear.app/changelog/2024-03-20-new-linear-ui

4. **Atlassian Design System** — Para: app layout, navegación lateral, tablas dinámicas, estructura de software profesional
   - https://atlassian.design/components/navigation-system/
   - https://atlassian.design/components/dynamic-table/

5. **IBM Carbon Design System** — Para: lenguaje enterprise, tablas de datos densas, indicadores de estado, empty states, estilo corporativo
   - https://carbondesignsystem.com/components/data-table/usage/

6. **Material Design 3** — Para: reglas de layout, densidad en escritorio, fundamentos de UI
   - https://m3.material.io/foundations/layout/understanding-layout/density

### SISTEMA VISUAL

#### Layout
- **Desktop**: Sidebar colapsable (220px expandida, 56px colapsada) + área principal
- **Mobile**: Sidebar se convierte en bottom tab bar o menú hamburguesa
- Contenido principal con max-width ~1200px centrado, con padding lateral de 24-32px
- Grid de 12 columnas para organizar el contenido

#### Tipografía
- Font principal: **Inter** (por legibilidad en interfaces densas y soporte extenso de caracteres rumanos: ă, â, î, ș, ț)
- Font monospace para AWBs, precios, datos numéricos: **JetBrains Mono** o **IBM Plex Mono**
- Escala tipográfica:
  - Page title: 20px/600
  - Section title: 15px/600
  - Body: 13-14px/400
  - Caption/meta: 12px/400
  - Mono/data: 13px/500
- Interlineado: 1.4-1.5 para texto, 1.2 para headings
- Letter-spacing: -0.01em en headings, 0 en body

#### Paleta de colores
```
--bg-primary: #ffffff           (fondo principal)
--bg-secondary: #f8f9fa         (fondo de secciones, sidebar)
--bg-tertiary: #f1f3f5          (fondo de tarjetas KPI, filas hover)
--bg-sidebar: #1a1d23           (sidebar oscura, estilo Linear)
--text-primary: #111827         (texto principal)
--text-secondary: #6b7280       (texto secundario, labels)
--text-tertiary: #9ca3af        (texto deshabilitado, placeholders)
--border: #e5e7eb               (bordes sutiles)
--border-strong: #d1d5db        (bordes de tablas, separadores)
--accent: #2563eb               (azul primario — acciones, links, selección)
--accent-hover: #1d4ed8
--success: #059669              (verde — livrat, plătit, disponibil)
--warning: #d97706              (ámbar — în așteptare, atenție)
--danger: #dc2626               (rojo — problemă, anulat, neplătit, alertă)
--info: #0284c7                 (azul claro — informativo, în tranzit)
--purple: #7c3aed               (morado — mașină pe platformă, etiqueta especial)
```
- Uso de color SOLO para significado funcional (estados, alertas, acciones)
- Fondo de la app mayoritariamente blanco/gris muy claro
- Sidebar oscura (contraste profesional)

#### Iconografía
- Usar **Lucide React** como librería única de iconos en TODA la app
- Tamaño estándar: 16px en sidebar y tablas, 20px en headers y acciones
- Stroke-width: 1.75 (más refinado que el default)
- Siempre coherentes: mismo estilo, mismo peso visual

#### Bordes, radios y sombras
- Border-radius: 6px (componentes), 8px (cards), 10px (modales)
- NUNCA border-radius excesivo (nada de 16px, 20px, 30px en cards)
- Sombras: mínimas y solo funcionales
  - Cards: `0 1px 2px rgba(0,0,0,0.05)`
  - Modales: `0 8px 30px rgba(0,0,0,0.12)`
  - Dropdowns: `0 4px 12px rgba(0,0,0,0.08)`
- Bordes de 1px en `--border` para separar elementos, sin abusar de sombras

#### Densidad
- Padding de celdas en tablas: 8-10px vertical, 12px horizontal
- Filas de tabla: 36-40px de altura
- KPI cards: compactas (no más de 80px de alto)
- Spacing entre secciones: 20-24px
- Spacing entre elementos dentro de una sección: 8-12px
- La interfaz debe mostrar MUCHA información útil sin parecer recargada

### COMPONENTES CLAVE — ESPECIFICACIONES

#### 1. Sidebar
- Fondo oscuro (#1a1d23)
- Texto claro, iconos Lucide en 16px
- Logo de la empresa arriba (texto "TransEurop" + subtítulo)
- Agrupada por áreas con separadores y labels de grupo en caps/small:
  ```
  OPERATIV
    Comenzi
    Tracking
    Programări
  RESURSE
    Șoferi
    Flotă
    Clienți
  FINANCIAR
    Încasări
    Rapoarte
    Cheltuieli
  SISTEM
    Setări
    Utilizatori
  ```
- Estado activo: fondo sutil más claro + indicador lateral izquierdo de 3px en color accent
- Hover: fondo sutil más claro
- Colapsable a solo iconos (56px)
- En mobile: bottom tab bar con los 4-5 items más importantes

#### 2. Topbar
- Altura: 52px
- Fondo blanco con borde inferior sutil
- Contenido:
  - Izquierda: breadcrumb o título de la sección actual
  - Centro: barra de búsqueda global (buscar AWB, cliente, teléfono)
  - Derecha: selector de ruta/campaña activa, icono de notificaciones (con badge rojo si hay pendientes), avatar/menú de usuario

#### 3. Dashboard principal (Admin)
Layout propuesto (de arriba a abajo):
```
[Topbar]
[Cabecera: "Dashboard" + fecha + botones: "Comandă nouă" / "Export"]

[Fila KPIs: 5-6 KPIs compactos en una fila]
  - Comenzi azi (número + variación vs ayer)
  - Venituri săptămâna (suma + moneda mixta)
  - Colete în tranzit (número)
  - Locuri ocupate / disponibile (barra progreso)
  - Neplătite (número en rojo si hay)
  - Probleme active (número en rojo si hay)

[Dos columnas]
  Columna izquierda (65%):
    - Tabla "Comenzi recente" (últimas 10-15, con estado, tipo, rută, preț, șofer)
    - Con filtros rápidos: Toate / Colete / Pasageri / Mașini / Neplătite
    
  Columna derecha (35%):
    - Bloque "Alerte" (lista priorizada de alertas activas)
    - Bloque "Activitate recentă" (timeline de últimos cambios de estado)
    - Bloque "Următoarele plecări" (próximas salidas con capacidad disponible)
```

#### 4. Tablas (criterio Stripe + Polaris + Carbon)
- Encabezados: texto en mayúsculas pequeñas (11px, 600, color --text-secondary), fondo --bg-secondary
- Filas: 38px de alto, hover con fondo --bg-tertiary
- Columnas típicas para tabla de comenzi: `AWB | Tip | Rută | Expeditor | Destinatar | Data | Greutate/Locuri | Preț | Plată | Status | Șofer | Acțiuni`
- Status como badges pequeños con color de fondo sutil y texto en el color del estado
- Acciones por fila: menú de 3 puntos (⋯) con dropdown: Detalii, Editează, Schimbă status, Atribuie șofer, Anulează
- Filtros encima de la tabla: chips clicables para tipo y estado + input de búsqueda + selector de rută
- Paginación en la parte inferior: "Afișează 1-20 din 156 comenzi" + flechas de página
- Ordenación al hacer clic en encabezado de columna
- Checkbox de selección para acciones en lote

#### 5. Formulario de nueva comanda (Modal o Drawer lateral)
- Drawer lateral derecho (480px de ancho) o modal centrado
- Paso 1: Selector de tipo (3 opciones como radio cards compactas: Colet / Pasager / Mașină)
- Paso 2: Selector de ruta (dropdown con rutas activas y sus días)
- Paso 3: Campos dinámicos según tipo
- Paso 4: Cálculo de precio en vivo (bloque sticky en la parte inferior)
- Botón principal: "Creează AWB" (accent color)
- Botón secundario: "Anulează"
- Validación inline de campos obligatorios

#### 6. Vista de detalle de comanda
- Panel lateral derecho (drawer) o página completa
- Header: AWB grande (monospace) + badge de status + badge de tipo
- Bloque de ruta visual: Origen → Destino con fecha y duración
- Bloque de datos: expeditor, destinatar, adrese, telefoane, greutate/locuri/model auto
- Bloque financiar: preț, metoda de plată, status plată
- Timeline de estados (vertical, con timestamps y usuario que cambió)
- Bloque de conductor asignado (con teléfono clicable)
- Acciones: botones para cambiar estado al siguiente paso, reasignar conductor, marcar plata, anular
- Sección de note/comentarii (tipo chat interno)

#### 7. Página de tracking público (sin login)
- Página separada, accesible sin autenticación
- URL: /track/{AWB}
- Diseño mobile-first, centrado, limpio
- Input de AWB arriba + botón "Caută"
- Resultado: card con ruta, estado actual, timeline visual de progreso, datos del conductor (nombre + teléfono), fecha estimada
- Branding de la empresa (logo, colores)
- Botón "Sună șoferul" (link tel:)
- Botón "Trimite pe WhatsApp" (link wa.me)

#### 8. KPIs
- Diseño compacto: máximo 80px de alto
- Layout: label arriba (12px, --text-secondary), valor grande (24px, mono, --text-primary), indicador de cambio abajo (12px, verde/rojo con flecha)
- Fondo: --bg-secondary o blanco con borde sutil
- En fila horizontal, 5-6 por fila en desktop, scroll horizontal en mobile
- Sin iconos grandes decorativos dentro del KPI

#### 9. Alertas
- Lista vertical priorizada
- Cada alerta: icono de severidad (Lucide) + texto descriptivo + timestamp + botón de acción
- Severidad con color de borde izquierdo: rojo (crítico), ámbar (atenção), azul (info)
- Ejemplo: "⚠️ 3 comenzi fără șofer atribuit — Atribuie acum"
- Ejemplo: "🔴 Comanda AWB-2026-00144 neplătită de 8 zile — Vezi detalii"

### REGLAS ESTRICTAS DE DISEÑO

1. **NO** hagas una interfaz genérica con aspecto de plantilla IA
2. **NO** uses tarjetas gigantes con mucho espacio vacío
3. **NO** uses border-radius excesivo (máximo 8-10px en cards)
4. **NO** uses sombras pesadas ni efectos decorativos innecesarios
5. **NO** uses iconos aleatorios ni inconsistentes — solo Lucide, siempre
6. **NO** uses colores decorativos — el color solo comunica estado o acción
7. **NO** llenes espacio con elementos decorativos — cada componente tiene función real
8. **NO** hagas un dashboard que parezca un collage de tarjetas
9. **SÍ** prioriza densidad útil: mostrar mucha información legible en poco espacio
10. **SÍ** usa jerarquía tipográfica fuerte: tamaño, peso y color distinguen claramente cada nivel
11. **SÍ** usa tablas profesionales como componente principal de datos (no cards)
12. **SÍ** mantén la sidebar compacta y elegante (estilo Linear/Stripe)
13. **SÍ** haz que cada pantalla parezca una herramienta de trabajo real

---

## STACK TÉCNICO

### Frontend
- **React 18+** con functional components y hooks
- **TypeScript** (obligatorio para profesionalidad y mantenimiento)
- **Tailwind CSS** para estilos (con configuración custom de colores, tipografía y spacing según el sistema visual definido arriba)
- **Lucide React** para iconos
- **React Router** para navegación
- **Recharts** o **Chart.js** para gráficos (sobrios, ejecutivos, no decorativos)
- **React Hook Form** + **Zod** para formularios y validación
- **TanStack Table** (React Table v8) para tablas profesionales con sorting, filtering, pagination
- **date-fns** para manejo de fechas
- Estructura de carpetas:
  ```
  src/
    components/
      layout/         (Sidebar, Topbar, PageHeader, Layout)
      ui/             (Button, Badge, Input, Select, Modal, Drawer, Table, KPICard, Alert, Timeline)
      orders/         (OrderList, OrderDetail, OrderForm, OrderFilters)
      drivers/        (DriverList, DriverCard)
      clients/        (ClientList, ClientDetail)
      finance/        (IncomeList, ExpenseForm, BalanceReport)
      tracking/       (PublicTracker, TrackingTimeline)
      dashboard/      (DashboardKPIs, RecentOrders, AlertsPanel, UpcomingDepartures)
    pages/
      Dashboard.tsx
      Orders.tsx
      OrderDetail.tsx
      Drivers.tsx
      Fleet.tsx
      Clients.tsx
      Routes.tsx
      Finance.tsx
      Reports.tsx
      Settings.tsx
      PublicTracking.tsx
    hooks/
    utils/
    types/
    data/             (mock data realista para demo)
    styles/
  ```

### Backend (preparar estructura, implementar básico)
- **Node.js + Express** o **Next.js API Routes**
- **PostgreSQL** como base de datos (con Prisma ORM)
- **Modelos de datos**:
  - `orders` (pedidos con todos los campos descritos)
  - `order_status_history` (timeline de cambios de estado)
  - `routes` (rutas configurables)
  - `drivers` (conductores)
  - `vehicles` (vehículos)
  - `clients` (base de clientes)
  - `payments` (cobros registrados)
  - `expenses` (gastos operativos)
  - `users` (usuarios del sistema con roles)
  - `notes` (notas/comentarios en pedidos)
  - `alerts` (alertas generadas automáticamente)

### Mobile (fase 2)
- **Capacitor** para envolver la web app React como app nativa Android e iOS
- O **React Native** / **Expo** para app nativa completa en fase posterior
- La web app debe ser 100% responsive y usable en móvil desde el día 1

---

## DATOS MOCK REALISTAS

Genera datos de demostración realistas para que la app se sienta poblada y funcional:

- Mínimo 30-50 pedidos con variedad de tipos, estados, rutas y fechas (últimas 3 semanas)
- 4-5 conductores con vehículos reales
- 20-30 clientes con nombres rumanos realistas
- Historial de estados para cada pedido
- Mezcla de monedas (EUR y GBP según ruta)
- Algunos pedidos con problemas (neplătit, problemă, anulat) para que las alertas se vean pobladas
- Datos financieros suficientes para que los gráficos y KPIs tengan sentido

---

## ENTREGABLES ESPERADOS

1. **Código fuente completo** de la aplicación React con TypeScript
2. **Sistema de diseño** implementado en Tailwind config (colores, tipografía, spacing, componentes)
3. **Todas las páginas funcionales** listadas arriba con navegación completa
4. **Tablas profesionales** con sorting, filtering, búsqueda y paginación
5. **Formularios funcionales** con validación
6. **Dashboard operativo** con KPIs reales, tabla de pedidos recientes, alertas y próximas salidas
7. **Página de tracking público** funcional y mobile-friendly
8. **Datos mock realistas** precargados
9. **Responsive**: funcional en desktop (sidebar) y mobile (bottom nav o hamburger)
10. **Código limpio, tipado, organizado** en carpetas con componentes reutilizables

---

## CRITERIO FINAL DE CALIDAD

El resultado debe pasar este test mental:

> Si le muestras esta app a un dueño de empresa de transporte rumano que hoy gestiona todo por WhatsApp y papel, debe decir: "Esto es exactamente lo que necesito. Se ve profesional. Puedo usarlo desde el teléfono. Mis clientes pueden ver dónde está su paquete. Mis conductores saben qué tienen que hacer. Yo veo cuánto dinero entra y sale."

> Si le muestras esta app a un inversor o a un potencial socio tecnológico, debe decir: "Esto parece un producto SaaS real y comercializable, con potencial para escalar a más empresas del sector."

Eso es lo que necesito. Construye.
