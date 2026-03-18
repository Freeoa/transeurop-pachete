import { useReducer, useEffect, useRef, useState, useCallback } from 'react'

// ─── Design Tokens — Light mode ───────────────────────────────────────────────
const T = {
  // Backgrounds (light mode, surface layers por elevación)
  bgBase:    '#F0F2F8',
  bgSurface: '#FFFFFF',
  bgElev:    '#F6F7FB',
  bgRaised:  '#ECEEF5',
  bgHover:   'rgba(67,56,202,0.04)',

  // Borders
  borderSubtle: 'rgba(0,0,0,0.06)',
  borderLight:  'rgba(0,0,0,0.10)',
  borderMed:    'rgba(0,0,0,0.16)',

  // Text
  textPrimary:   '#111827',
  textSecondary: '#4B5563',
  textTertiary:  '#9CA3AF',
  textMuted:     '#D1D5DB',

  // Brand (indigo — confianza, técnico, profesional)
  brand:         '#4338CA',
  brandDim:      'rgba(67,56,202,0.08)',
  brandDimHover: 'rgba(67,56,202,0.14)',

  // Status — saturados y legibles sobre fondo claro
  green:     '#16A34A',
  greenDim:  'rgba(22,163,74,0.08)',
  amber:     '#D97706',
  amberDim:  'rgba(217,119,6,0.08)',
  red:       '#DC2626',
  redDim:    'rgba(220,38,38,0.08)',
  blue:      '#2563EB',
  blueDim:   'rgba(37,99,235,0.08)',
  purple:    '#7C3AED',
  purpleDim: 'rgba(124,58,237,0.08)',

  // Radius
  rSm:  6,
  rMd:  10,
  rLg:  14,
  rXl:  18,
  rPill: 999,

  // Spacing (4pt grid)
  sp1: 4, sp2: 8, sp3: 12, sp4: 16, sp5: 20, sp6: 24, sp8: 32,

  // Typography
  fontBase: "'Inter', system-ui, -apple-system, sans-serif",
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const card = (extra = {}) => ({
  background: T.bgSurface,
  border: `1px solid ${T.borderLight}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  borderRadius: T.rLg,
  padding: '18px 20px',
  ...extra,
})

const label = (extra = {}) => ({
  fontSize: 10, fontWeight: 700, color: T.textTertiary,
  textTransform: 'uppercase', letterSpacing: 1.4,
  ...extra,
})

// ─── Actividades ──────────────────────────────────────────────────────────────
const ACT = {
  driving:      { id: 'driving',      label: 'Conducere',      se: '🚗', vdo: 'd', color: '#00e87a' },
  work:         { id: 'work',         label: 'Altă muncă',    se: '⚒',  vdo: 'a', color: '#f5a623' },
  rest:         { id: 'rest',         label: 'Odihnă/Pauză',  se: '🛏',  vdo: 'b', color: '#4fc3f7' },
  availability: { id: 'availability', label: 'Disponibilitate', se: '⬡',  vdo: 'c', color: '#ce93d8' },
}

const LIMITS = {
  BREAK_AFTER:  270,   // 4h30 → pausa obligatoria
  BREAK_MIN:     45,   // minutos para limpiar E010
  SPLIT_P1:      15,   // primer tramo pausa dividida
  SPLIT_P2:      30,   // segundo tramo
  DAILY_MAX:    540,   // 9h conducción diaria
  WEEKLY_MAX:  3360,   // 56h semanal
  DAILY_REST:   660,   // 11h descanso diario
  SPEED_LIMIT:   90,   // km/h límite furgonetas
}

const ERRORS = {
  E001: { code: 'E001', msg: 'Fără card — în conducere',       cause: 'Conducere fără card >1 min. Inserează cardul de conducere.' },
  E002: { code: 'E002', msg: 'Conflict de card',              cause: 'Două carduri ale aceluiași conducător detectate.' },
  E003: { code: 'E003', msg: 'Sesiune neînchisă',             cause: 'Card extras incorect. Inserează din nou cardul.' },
  E004: { code: 'E004', msg: 'Eroare senzor mișcare',         cause: 'Eroare senzor KITAS. Necesită atelier autorizat.' },
  E005: { code: 'E005', msg: 'Întrerupere alimentare',        cause: 'Pană de curent. Verifică bateria și cablajul.' },
  E006: { code: 'E006', msg: 'Imprimantă — fără hârtie',     cause: 'Reîncarcă rola de hârtie termică.' },
  E007: { code: 'E007', msg: 'Eroare descărcare (6-pin)',     cause: 'Verifică cablul de descărcare și conectorul.' },
  E008: { code: 'E008', msg: 'Card neautentificat',           cause: 'Chip murdar. Curăță cu o cârpă uscată și încearcă din nou.' },
  E009: { code: 'E009', msg: 'Depășire viteză',               cause: '>90 km/h înregistrat. Eveniment salvat în tahograf.' },
  E010: { code: 'E010', msg: 'Pauză obligatorie — 4h30 min', cause: 'Oprește vehiculul. Odihnește-te minim 45 minute.' },
  E011: { code: 'E011', msg: 'Conducere zilnică max. (9h)',   cause: 'Ai atins limita de 9h zilnice. Oprește vehiculul și odihnește-te cel puțin 11 ore consecutive.' },
  E012: { code: 'E012', msg: 'Conducere săptămânală max. (56h)', cause: 'Ai atins limita săptămânală de 56h. Nu poți conduce până la începutul săptămânii următoare.' },
}

const MENU_SE = [
  { id: 'print',    label: 'IMPRIMARE / VIZUALIZARE', items: ['Tură 24h (conducător)', 'Evenimente și erori', 'Date tehnice vehicul', 'Listă depășire viteză', 'Intrări manuale'] },
  { id: 'manual',   label: 'INTRARE MANUALĂ',         items: ['Selectare activitate', 'Dată început', 'Oră început', 'Loc (oraș)', 'Confirmare intrare'] },
  { id: 'ferry',    label: 'FERRY / ÎN AFARA DOMENIULUI',items: ['Început traversare', 'Sfârșit traversare', 'Confirmare'] },
  { id: 'tech',     label: 'DATE TEHNICE',            items: ['Vitezometru km/h', 'RPM motor', 'Nr. înmatriculare', 'VIN vehicul', 'Dată calibrare'] },
  { id: 'download', label: 'DESCĂRCARE DATE',         items: ['Descărcare card (28 zile)', 'Descărcare unitate VU (90 zile)'] },
  { id: 'config',   label: 'CONFIGURARE',             items: ['Activitate la pornire', 'Activitate la oprire', 'Limbă'] },
]

const MENU_VDO = [
  { id: 'times',    label: 'TIMPII MEI',              items: ['Conducere zilnică', 'Conducere săptămânală', 'Odihnă disponibilă', 'Următoarea pauză'] },
  { id: 'vehicle',  label: 'VEHICUL',                items: ['Înmatriculare / VIN', 'Viteză curentă', 'Calibrare'] },
  { id: 'print',    label: 'IMPRIMARE',              items: ['Activități tură', 'Evenimente și erori', 'Date tehnice'] },
  { id: 'manual',   label: 'INTRARE MANUALĂ',        items: ['Selectare activitate', 'Dată început', 'Oră început', 'Loc (oraș)', 'Confirmare intrare'] },
  { id: 'download', label: 'DESCĂRCARE DLK PRO',     items: ['Card conducere (28z)', 'Unitate vehicul (90z)'] },
]

const COUNTRIES = ['ES', 'FR', 'PT', 'DE', 'IT', 'BE', 'NL', 'PL', 'RO', 'UK']
const DEMO_CARD  = { name: 'POPESCU ALEXANDRU', cardNo: 'RO9823741B' }
const DEMO_CARD2 = { name: 'GARCIA CARLOS',     cardNo: 'ES1234567A' }

const SCENARIOS = [
  { id: 's1', title: '1. Începe tura', steps: ['Inserează cardul în slotul 1 (butonul "1" sau clic pe slot).','Tahograful citește cardul și afișează numele tău. Apasă ✓ pentru confirmare.','Selectează "Altă muncă" (⚒) cu ▲/▼ în timp ce pregătești vehiculul.','La pornire, conducerea se activează automat. Ești înregistrat!'] },
  { id: 's2', title: '2. Trecere de frontieră', steps: ['Oprește vehiculul înainte de trecere. Apasă ✓ → FERRY / ÎN AFARA DOMENIULUI.','Selectează "Început traversare" și confirmă. Țara se schimbă pe ecran.','Reia mersul. Tahograful înregistrează trecerea cu coordonate GPS.','DTCO 3.0 (Gen.2): trecerea se înregistrează automat.'] },
  { id: 's3', title: '3. Sfârșit de tură', steps: ['Oprește vehiculul. Apasă ▲ sau ▼ → selectează odihnă (🛏 / b).','Confirmă cu ✓. Cronometrul de odihnă începe.','Așteaptă ca tahograful să termine salvarea datelor.','Extrage cardul apăsând butonul "1". Păstrează-l în loc sigur.'] },
  { id: 's4', title: '4. Control de trafic', steps: ['Oprește vehiculul. Inspectorul poate cere ultimele 28 de zile.','Apasă ✓ → IMPRIMARE / VIZUALIZARE → Tură 24h (conducător).','Confirmă cu ✓. Imprimanta emite tichetul în câteva secunde.','Poți arăta și cardul direct inspectorului.'] },
  { id: 's5', title: '5. Cardul nu citește (E008)', steps: ['Extrage cardul (butonul "1"). Tahograful afișează E008.','Curăță chipul auriu cu o cârpă uscată. NU folosi lichide.','Verifică dacă există praf sau murdărie în slotul tahografului.','Inserează din nou. Dacă persistă, conduce notând pe hârtie și mergi la un atelier.'] },
  { id: 's6', title: '6. Pauză 45 min obligatorie', steps: ['După 4h30 de conducere tahograful emite alerta E010.','Oprește vehiculul IMEDIAT. Selectează odihnă (🛏 / b).','Odihnește-te minim 45 min continuu, sau 15 min + 30 min în această ordine.','Contorul se resetează când acumulezi 45 min de pauză continuă.'] },
  { id:'s7', title:'7. Schimb de conducător', steps: [
    'Inserează cardul conducătorului 1 (slot 1) și al conducătorului 2 (slot 2). Vom simula un schimb.',
    'Vehiculul a condus 4h30 — E010 activ. Oprește vehiculul și selectează odihnă pentru conducătorul 1.',
    'După 45 min de odihnă a conducătorului 1, conducătorul 2 preia volanul. Mărește viteza.',
    'Observă cum fiecare slot acumulează timpuri independente. Conducătorul 2 își începe tura de la 00:00.'
  ]},
]

function pad(n)        { return String(n).padStart(2, '0') }
function fmtMin(m)     { return `${pad(Math.floor(m / 60))}:${pad(m % 60)}` }
function fmtTime(h, m) { return `${pad(h)}:${pad(m)}` }
function fmtRem(total, elapsed) {
  const r = total - elapsed
  return r <= 0 ? '00:00' : `-${fmtMin(r)}`
}
const DAYS = ['DUM', 'LUN', 'MAR', 'MIE', 'JOI', 'VIN', 'SÂM']

// ─── Reducer ──────────────────────────────────────────────────────────────────
function init() {
  const n = new Date()
  return {
    boot: 2, screen: 'driving', activity: 'rest', activity2: 'availability',
    card1: null, card2: null, speed: 0, country: 'RO', errors: [],
    drivingMin: 0, restMin: 0, workMin: 0, availMin: 0,       // conductor 1 — resetean a medianoche
    drivingMin2: 0, restMin2: 0, workMin2: 0, availMin2: 0,   // conductor 2
    weeklyDrivingMin: 0,   // acumulado semanal (no se resetea con el día)
    e010RestMin: 0,         // minutos de descanso acumulados desde que se activó E010
    menuIdx: 0, subIdx: 0, activeMenu: null,
    downloading: null, paperEmpty: false,
    h: n.getHours(), m: n.getMinutes(), techScreen: null,
    splitBreakPhase: 0, splitBreakMin: 0,
    activityLog: [],
    manualEntry: { step: 0, actIdx: 1, h: 0, m: 0 },
  }
}

function reducer(s, a) {
  switch (a.type) {
    case 'BOOT_STEP': return { ...s, boot: s.boot - 1 }
    case 'TICK': {
      if (s.boot > 0) return s
      const nm = s.m + 1, nh = nm >= 60 ? (s.h + 1) % 24 : s.h
      const midnightReset = nh === 0 && s.h === 23  // cruce de medianoche
      const act  = s.speed > 0 ? 'driving' : s.activity
      const act2 = s.card2 ? (s.speed > 0 ? 'driving' : (s.activity2 || 'availability')) : null
      const errs = [...s.errors]
      if (act === 'driving' && !s.card1 && !errs.includes('E001')) errs.push('E001')
      if (act !== 'driving' || s.card1) { const i = errs.indexOf('E001'); if (i > -1) errs.splice(i, 1) }
      if (s.drivingMin >= LIMITS.BREAK_AFTER && s.speed > 0 && !errs.includes('E010')) errs.push('E010')
      // Activity log: record when activity changes
      const lastLog = s.activityLog[s.activityLog.length - 1]
      const newLog = (!lastLog || lastLog.act !== act)
        ? [...s.activityLog.slice(-99), { act, h: s.h, m: s.m }]
        : s.activityLog
      // E010: split break logic (EU 561/2006 art. 7)
      let e010RestMin = errs.includes('E010') ? s.e010RestMin : 0
      let splitBreakPhase = s.splitBreakPhase
      let splitBreakMin = s.splitBreakMin
      if (errs.includes('E010')) {
        if (act === 'rest') {
          splitBreakMin += 1
          e010RestMin += 1
          if (splitBreakPhase === 0 && splitBreakMin >= LIMITS.SPLIT_P1) {
            // Primer tramo completado (15 min)
            splitBreakPhase = 1; splitBreakMin = 0
          } else if (splitBreakPhase === 1 && splitBreakMin >= LIMITS.SPLIT_P2) {
            // Segundo tramo completado (30 min) → E010 limpio
            errs.splice(errs.indexOf('E010'), 1)
            splitBreakPhase = 0; splitBreakMin = 0; e010RestMin = 0
          } else if (splitBreakPhase === 0 && e010RestMin >= LIMITS.BREAK_MIN) {
            // Alternativa: 45 min continuos también limpian E010
            errs.splice(errs.indexOf('E010'), 1)
            splitBreakPhase = 0; splitBreakMin = 0; e010RestMin = 0
          }
        } else if (act === 'driving') {
          // Conducción reinicia todo el progreso de pausa
          if (splitBreakPhase === 0) {
            splitBreakMin = 0; e010RestMin = 0  // perdió el primer tramo
          }
          // Si splitBreakPhase=1, mantiene el primer tramo ganado
        }
        // work/availability: no avanza pausa pero tampoco reinicia fase 1 ya completada
      }
      // E011/E012
      if (s.drivingMin >= LIMITS.DAILY_MAX && s.speed > 0 && !errs.includes('E011')) errs.push('E011')
      if (s.weeklyDrivingMin >= LIMITS.WEEKLY_MAX && !errs.includes('E012')) errs.push('E012')
      // midnight: also clear E011
      if (midnightReset) { const i = errs.indexOf('E011'); if (i > -1) errs.splice(i, 1) }
      return { ...s, m: nm % 60, h: nh, errors: errs, e010RestMin, splitBreakPhase, splitBreakMin, activityLog: newLog,
        drivingMin: midnightReset ? 0 : (act === 'driving' ? s.drivingMin + 1 : s.drivingMin),
        restMin:    midnightReset ? 0 : (act === 'rest'    ? s.restMin + 1    : s.restMin),
        workMin:    midnightReset ? 0 : (act === 'work'    ? s.workMin + 1    : s.workMin),
        availMin:   midnightReset ? 0 : (act === 'availability' ? s.availMin + 1 : s.availMin),
        weeklyDrivingMin: act === 'driving' ? s.weeklyDrivingMin + 1 : s.weeklyDrivingMin,
        drivingMin2: s.card2 ? (midnightReset ? 0 : (act2 === 'driving' ? s.drivingMin2 + 1 : s.drivingMin2)) : s.drivingMin2,
        restMin2:    s.card2 ? (midnightReset ? 0 : (act2 === 'rest'    ? s.restMin2 + 1    : s.restMin2))    : s.restMin2,
        workMin2:    s.card2 ? (midnightReset ? 0 : (act2 === 'work'    ? s.workMin2 + 1    : s.workMin2))    : s.workMin2,
        availMin2:   s.card2 ? (midnightReset ? 0 : (act2 === 'availability' ? s.availMin2 + 1 : s.availMin2)) : s.availMin2,
      }
    }
    case 'SPEED': {
      const sp = a.v, wasMoving = s.speed > 0, nowMoving = sp > 0
      const errs = [...s.errors]
      if (sp > LIMITS.SPEED_LIMIT && !errs.includes('E009')) errs.push('E009')
      if (sp <= LIMITS.SPEED_LIMIT) { const i = errs.indexOf('E009'); if (i > -1) errs.splice(i, 1) }
      // E010 NO se limpia al parar — requiere 45 min de descanso (ver TICK reducer)
      return { ...s, speed: sp, errors: errs,
        activity: nowMoving ? 'driving' : (wasMoving && s.activity === 'driving' ? 'availability' : s.activity) }
    }
    case 'INSERT': {
      const newCard = a.slot === 1 ? 'card1' : 'card2'
      const otherCard = a.slot === 1 ? s.card2 : s.card1
      const errs = s.errors.filter(e => e !== 'E001' && e !== 'E003' && e !== 'E002')
      if (otherCard && a.card.cardNo === otherCard.cardNo) errs.push('E002')
      return { ...s, [newCard]: a.card, errors: errs, screen: 'driving', ...(a.slot === 2 ? { activity2: 'availability', drivingMin2: 0, restMin2: 0, workMin2: 0, availMin2: 0 } : {}) }
    }
    case 'EJECT': {
      const errs = s.speed > 0 ? [...s.errors.filter(e => e !== 'E001'), 'E003'] : s.errors.filter(e => e !== 'E001')
      return { ...s, [a.slot === 1 ? 'card1' : 'card2']: null, errors: errs, screen: 'driving' }
    }
    case 'COUNTRY': return { ...s, country: a.v }
    case 'ERR_ADD':  return s.errors.includes(a.code) ? s : { ...s, errors: [...s.errors, a.code] }
    case 'ERR_CLEAR': return { ...s, errors: [], e010RestMin: 0, splitBreakPhase: 0, splitBreakMin: 0 }
    case 'WEEK_RESET': return { ...s, weeklyDrivingMin: 0, errors: s.errors.filter(e => e !== 'E012') }
    case 'PAPER':  return { ...s, paperEmpty: !s.paperEmpty }
    case 'CANCEL': return { ...s, screen: 'driving', menuIdx: 0, subIdx: 0, activeMenu: null, downloading: null, techScreen: null }
    case 'ENTER': {
      if (s.screen === 'manual_entry') {
        const me = s.manualEntry
        if (me.step < 3) return { ...s, manualEntry: { ...me, step: me.step + 1 } }
        // Confirmar entrada
        const acts = ['work', 'rest', 'availability']
        const act = acts[me.actIdx]
        const newLog = [...s.activityLog.slice(-99), { act, h: me.h, m: me.m, manual: true }]
        return { ...s, screen: 'driving', activityLog: newLog, manualEntry: { step: 0, actIdx: 1, h: s.h, m: 0 } }
      }
      if (s.screen === 'dl_done') return { ...s, screen: 'driving', menuIdx: 0, subIdx: 0, activeMenu: null, downloading: null, techScreen: null }
      if (s.screen === 'driving') return { ...s, screen: 'menu', menuIdx: 0 }
      if (s.screen === 'menu') {
        const menu = a.brand === 'se' ? MENU_SE : MENU_VDO
        return { ...s, screen: 'submenu', activeMenu: menu[s.menuIdx].id, subIdx: 0 }
      }
      if (s.screen === 'submenu') {
        const menu = a.brand === 'se' ? MENU_SE : MENU_VDO
        const parent = menu.find(m => m.id === s.activeMenu)
        const item = parent?.items[s.subIdx] ?? ''
        if (s.activeMenu === 'manual') return { ...s, screen: 'manual_entry', manualEntry: { step: 0, actIdx: 1, h: s.h, m: Math.max(0, s.m - 5) } }
        if (s.activeMenu === 'tech') return { ...s, screen: 'tech', techScreen: item }
        if (s.activeMenu === 'ferry') return { ...s, country: s.country === 'RO' ? 'HU' : 'RO', screen: 'driving' }
        const isPrint = ['imprimare','tură','evenimente','activități','date tehnice'].some(k => item.toLowerCase().includes(k))
        if (isPrint) {
          if (s.paperEmpty) return { ...s, errors: [...s.errors.filter(e => e !== 'E006'), 'E006'] }
          return { ...s, screen: 'print' }
        }
        const isDl = ['descărcare','card','unitate'].some(k => item.toLowerCase().includes(k))
        if (isDl) return { ...s, screen: 'download', downloading: 0 }
        // VDO: "Mis Tiempos" → pantalla times_vdo
        if (s.activeMenu === 'times') return { ...s, screen: 'times_vdo' }
        return s
      }
      if (s.screen === 'actsel') {
        const acts = ['work', 'rest', 'availability']
        return { ...s, activity: acts[s.menuIdx] ?? s.activity, screen: 'driving' }
      }
      if (s.screen === 'times_vdo') return { ...s, screen: 'driving' }
      return s
    }
    case 'UP': {
      if (s.screen === 'manual_entry') {
        const me = s.manualEntry
        if (me.step === 0) return { ...s, manualEntry: { ...me, actIdx: (me.actIdx - 1 + 3) % 3 } }
        if (me.step === 1) return { ...s, manualEntry: { ...me, h: (me.h - 1 + 24) % 24 } }
        if (me.step === 2) return { ...s, manualEntry: { ...me, m: (me.m - 5 + 60) % 60 } }
        return s
      }
      if (s.screen === 'menu') { const m = a.brand === 'se' ? MENU_SE : MENU_VDO; return { ...s, menuIdx: (s.menuIdx - 1 + m.length) % m.length } }
      if (s.screen === 'submenu') { const m = a.brand === 'se' ? MENU_SE : MENU_VDO; const l = m.find(x => x.id === s.activeMenu)?.items.length ?? 1; return { ...s, subIdx: (s.subIdx - 1 + l) % l } }
      if (s.screen === 'driving') { if (s.speed > 0) return { ...s, errors: [...s.errors.filter(e => e !== 'E_MOV'), 'E_MOV'] }; return { ...s, screen: 'actsel', menuIdx: 0 } }
      if (s.screen === 'actsel') return { ...s, menuIdx: (s.menuIdx - 1 + 3) % 3 }
      return s
    }
    case 'DOWN': {
      if (s.screen === 'manual_entry') {
        const me = s.manualEntry
        if (me.step === 0) return { ...s, manualEntry: { ...me, actIdx: (me.actIdx + 1) % 3 } }
        if (me.step === 1) return { ...s, manualEntry: { ...me, h: (me.h + 1) % 24 } }
        if (me.step === 2) return { ...s, manualEntry: { ...me, m: (me.m + 5) % 60 } }
        return s
      }
      if (s.screen === 'menu') { const m = a.brand === 'se' ? MENU_SE : MENU_VDO; return { ...s, menuIdx: (s.menuIdx + 1) % m.length } }
      if (s.screen === 'submenu') { const m = a.brand === 'se' ? MENU_SE : MENU_VDO; const l = m.find(x => x.id === s.activeMenu)?.items.length ?? 1; return { ...s, subIdx: (s.subIdx + 1) % l } }
      if (s.screen === 'driving') { if (s.speed > 0) return { ...s, errors: [...s.errors.filter(e => e !== 'E_MOV'), 'E_MOV'] }; return { ...s, screen: 'actsel', menuIdx: 0 } }
      if (s.screen === 'actsel') return { ...s, menuIdx: (s.menuIdx + 1) % 3 }
      return s
    }
    case 'ACT_NOW': return { ...s, activity: a.act, screen: 'driving' }
    case 'DL_TICK': { const p = (s.downloading ?? 0) + 8; return p >= 100 ? { ...s, downloading: 100 } : { ...s, downloading: p } }
    case 'DL_DONE': return { ...s, screen: 'dl_done', downloading: null }
    case 'DISMISS_MOV': return { ...s, errors: s.errors.filter(e => e !== 'E_MOV') }
    case 'TIME_WARP': {
      let st = { ...s }
      const mins = a.minutes ?? 30
      for (let i = 0; i < mins; i++) { st = reducer(st, { type: 'TICK' }) }
      return st
    }
    case 'RESET': return init()
    default: return s
  }
}

// ─── LCD SE5000 ───────────────────────────────────────────────────────────────
function SE_Screen({ s }) {
  const act = s.speed > 0 ? 'driving' : s.activity
  const a1 = ACT[act]
  const hasErr = s.errors.some(e => e !== 'E_MOV')
  const err = hasErr ? ERRORS[s.errors.find(e => e !== 'E_MOV')] : null
  const actMin = act === 'driving' ? s.drivingMin : act === 'rest' ? s.restMin : act === 'work' ? s.workMin : s.availMin
  const act2 = s.card2 ? (s.speed > 0 ? 'driving' : (s.activity2 || 'availability')) : null
  const actMin2 = s.card2 ? (act2 === 'driving' ? s.drivingMin2 : act2 === 'rest' ? s.restMin2 : act2 === 'work' ? s.workMin2 : s.availMin2) : 0
  const movErr = s.errors.includes('E_MOV')
  const remBreak = LIMITS.BREAK_AFTER - (s.drivingMin % LIMITS.BREAK_AFTER)

  if (s.boot > 0) return (
    <div style={{ fontFamily: 'monospace', color: '#00e87a', textAlign: 'center', paddingTop: 10 }}>
      {s.boot === 2
        ? <div style={{ fontSize: 11, letterSpacing: 3, animation: 'blink 0.6s infinite' }}>STONERIDGE</div>
        : <><div style={{ fontSize: 9, letterSpacing: 2 }}>SE5000 Exakt Duo2</div><div style={{ fontSize: 8, marginTop: 4, color: '#00a050' }}>v7.6  EU 165/2014</div><div style={{ marginTop: 8, height: 4, background: '#003300', borderRadius: 2 }}><div style={{ height: '100%', background: '#00e87a', width: '60%', borderRadius: 2 }} /></div></>}
    </div>
  )
  if (s.screen === 'download') return (
    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#00e87a' }}>
      <div style={{ fontSize: 8, borderBottom: '1px solid #005530', paddingBottom: 2, marginBottom: 4 }}>■ OPTAC / DESCĂRCARE</div>
      <div style={{ fontSize: 9 }}>Se transferă...</div>
      <div style={{ margin: '6px 0', height: 8, background: '#002a18', border: '1px solid #004422', borderRadius: 1 }}>
        <div style={{ height: '100%', background: '#00e87a', width: `${s.downloading ?? 0}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: 12, textAlign: 'center', letterSpacing: 1 }}>{pad(s.downloading ?? 0)}%{(s.downloading ?? 0) >= 100 ? '  ✓' : ''}</div>
    </div>
  )
  if (s.screen === 'print') return (
    <div style={{ fontFamily: 'monospace', fontSize: 8, lineHeight: '14px', color: '#00e87a' }}>
      <div style={{ fontSize: 7, borderBottom: '1px solid #005530', marginBottom: 2 }}>STONERIDGE SE5000</div>
      <div>DRV: {s.card1?.name ?? '---'}</div>
      <div style={{ marginTop: 2 }}>🚗 {fmtMin(s.drivingMin)}  🛏 {fmtMin(s.restMin)}</div>
      <div>⚒ {fmtMin(s.workMin)}  ⬡ {fmtMin(s.availMin)}</div>
      <div style={{ marginTop: 2, fontSize: 7 }}>*** SFÂRȘIT IMPRIMARE ***</div>
    </div>
  )
  if (s.screen === 'menu') return (
    <div style={{ fontFamily: 'monospace', fontSize: 9, lineHeight: '16px', color: '#00e87a' }}>
      {MENU_SE.map((m, i) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', background: i === s.menuIdx ? '#00e87a' : 'transparent', color: i === s.menuIdx ? '#001800' : '#00e87a', paddingLeft: 2 }}>
          <span style={{ width: 8 }}>{i === s.menuIdx ? '▶' : ' '}</span><span style={{ fontSize: 8 }}>{m.label}</span>
        </div>
      ))}
    </div>
  )
  if (s.screen === 'submenu') {
    const parent = MENU_SE.find(m => m.id === s.activeMenu)
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 9, lineHeight: '16px', color: '#00e87a' }}>
        <div style={{ fontSize: 7, borderBottom: '1px solid #005530', marginBottom: 2 }}>{parent?.label}</div>
        {parent?.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', background: i === s.subIdx ? '#00e87a' : 'transparent', color: i === s.subIdx ? '#001800' : '#00e87a', paddingLeft: 2 }}>
            <span style={{ width: 8 }}>{i === s.subIdx ? '▶' : ' '}</span><span>{item}</span>
          </div>
        ))}
      </div>
    )
  }
  if (s.screen === 'actsel') {
    const opts = [{ id: 'work', sym: '⚒', label: 'ALTĂ MUNCĂ' }, { id: 'rest', sym: '🛏', label: 'ODIHNĂ' }, { id: 'availability', sym: '⬡', label: 'DISPONIBIL' }]
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 9, lineHeight: '17px', color: '#00e87a' }}>
        <div style={{ fontSize: 7, borderBottom: '1px solid #005530', marginBottom: 2 }}>ACTIVITATE COND. 1</div>
        {opts.map((o, i) => (
          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: i === s.menuIdx ? '#00e87a' : 'transparent', color: i === s.menuIdx ? '#001800' : '#00e87a', paddingLeft: 2 }}>
            <span style={{ width: 8 }}>{i === s.menuIdx ? '▶' : ' '}</span><span>{o.sym}</span><span>{o.label}</span>
          </div>
        ))}
      </div>
    )
  }
  if (s.screen === 'dl_done') return (
    <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#00e87a', textAlign: 'center', paddingTop: 14 }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>✓</div>
      <div style={{ letterSpacing: 1 }}>DESCĂRCARE OK</div>
      <div style={{ fontSize: 7, color: '#005530', marginTop: 4 }}>100% · Se închide...</div>
    </div>
  )
  if (s.screen === 'manual_entry') {
    const me = s.manualEntry
    const acts = [
      { id:'work',         sym:'⚒', label:'ALTĂ MUNCĂ' },
      { id:'rest',         sym:'🛏', label:'ODIHNĂ' },
      { id:'availability', sym:'⬡', label:'DISPONIBIL' },
    ]
    return (
      <div style={{ fontFamily:'monospace', fontSize:9, lineHeight:'16px', color:'#00e87a' }}>
        <div style={{ fontSize:7, borderBottom:'1px solid #005530', marginBottom:3 }}>
          INTRARE MANUALĂ · Pasul {me.step+1}/4
        </div>
        {me.step === 0 && acts.map((a, i) => (
          <div key={a.id} style={{ display:'flex', gap:4, background: i===me.actIdx ? '#00e87a' : 'transparent', color: i===me.actIdx ? '#001800' : '#00e87a', paddingLeft:2 }}>
            <span style={{width:8}}>{i===me.actIdx?'▶':' '}</span><span>{a.sym}</span><span>{a.label}</span>
          </div>
        ))}
        {me.step === 1 && (
          <div>
            <div style={{fontSize:7,color:'#005530'}}>Ora de început (▲▼)</div>
            <div style={{fontSize:18,textAlign:'center',letterSpacing:2,marginTop:4}}>{pad(me.h)}:--</div>
          </div>
        )}
        {me.step === 2 && (
          <div>
            <div style={{fontSize:7,color:'#005530'}}>Minute (▲▼)</div>
            <div style={{fontSize:18,textAlign:'center',letterSpacing:2,marginTop:4}}>{pad(me.h)}:{pad(me.m)}</div>
          </div>
        )}
        {me.step === 3 && (
          <div>
            <div style={{fontSize:7,color:'#005530'}}>Confirmare (✓)</div>
            <div style={{marginTop:4}}>{acts[me.actIdx].sym} {acts[me.actIdx].label}</div>
            <div style={{fontSize:8,color:'#005530'}}>de la {pad(me.h)}:{pad(me.m)}</div>
          </div>
        )}
      </div>
    )
  }
  if (s.screen === 'tech') {
    const techContent = {
      'Vitezometru km/h':    <><div>VEL: {pad(s.speed)} km/h</div><div style={{fontSize:7,color:'#005530'}}>K-FACTOR: 6000 imp/km</div></>,
      'RPM motor':           <><div>RPM: 1840</div><div style={{fontSize:7,color:'#005530'}}>Ralanti: 680 rpm</div></>,
      'Nr. înmatriculare':   <><div>MAT: 1234-ABC</div><div style={{fontSize:7,color:'#005530'}}>Țara: RO</div></>,
      'VIN vehicul':         <><div style={{fontSize:7}}>WDB9634031L456789</div><div style={{fontSize:7,color:'#005530'}}>Mercedes-Benz Sprinter</div></>,
      'Dată calibrare':      <><div>CAL: 2024-11-15</div><div style={{fontSize:7,color:'#005530'}}>Urm: 2026-11-15</div></>,
    }
    const content = techContent[s.techScreen] ?? <><div>VEL: {pad(s.speed)} km/h</div><div>ȚARA: {s.country}</div></>
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 9, lineHeight: '16px', color: '#00e87a' }}>
        <div style={{ fontSize: 7, borderBottom: '1px solid #005530', marginBottom: 4 }}>DATE TEHNICE</div>
        {content}
        <div style={{ fontSize: 7, color: '#005530', marginTop: 4 }}>GPS: {s.card1 ? '●FIX' : '○---'} · EU 165/2014</div>
      </div>
    )
  }
  return (
    <div style={{ fontFamily: 'monospace', color: '#00e87a', userSelect: 'none' }}>
      {hasErr && err && <div style={{ background: '#001a00', border: '1px solid #00aa55', borderRadius: 1, padding: '1px 3px', marginBottom: 2, fontSize: 8 }}><span style={{ color: '#ffcc00' }}>▲</span> {err.code}: {err.msg}</div>}
      {movErr && !hasErr && <div style={{ background: '#1a1000', border: '1px solid #f5a623', borderRadius: 1, padding: '1px 3px', marginBottom: 2, fontSize: 8, color: '#f5a623' }}>▲ Oprește vehiculul</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#ffcc00' }}>1{s.speed > 0 ? '▶' : ' '}</span>
          <span style={{ fontSize: 15 }}>{a1.se}</span>
        </div>
        <span style={{ fontSize: 13, letterSpacing: 1, fontWeight: 'bold' }}>{fmtMin(actMin)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 17, opacity: s.card2 ? 0.75 : 0.35 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 10 }}>2{s.card2 && s.speed > 0 ? '▶' : ' '}</span><span style={{ fontSize: 13 }}>{s.card2 ? ACT[act2].se : '--'}</span></div>
        <span style={{ fontSize: 12, letterSpacing: 1 }}>{s.card2 ? fmtMin(actMin2) : '--:--'}</span>
      </div>
      <div style={{ borderTop: '1px solid #004422', margin: '2px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ letterSpacing: 1 }}>{fmtTime(s.h, s.m)}</span>
        <span style={{ fontSize: 9 }}>{DAYS[new Date().getDay()]}</span>
        <span style={{ fontWeight: 'bold', letterSpacing: 1 }}>{s.country}</span>
        <span style={{ fontSize: 10, color: s.card1 ? '#00ff66' : '#004422' }}>{s.card1 ? '●' : '○'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9, marginTop: 1 }}>
        <span>{s.speed > 0 ? '▶' : '■'} <span style={{ fontSize: 12, color: s.speed > LIMITS.SPEED_LIMIT ? '#ff4444' : '#00e87a', fontWeight: 'bold' }}>{pad(s.speed)}</span><span style={{ fontSize: 8 }}> km/h</span></span>
        <span style={{ fontSize: 8, color: remBreak <= 30 && s.drivingMin > 0 ? '#ffcc00' : '#005530' }}>{s.drivingMin > 0 ? fmtRem(LIMITS.BREAK_AFTER, s.drivingMin % LIMITS.BREAK_AFTER) : '04:30'}</span>
        <span style={{ fontSize: 8, opacity: 0.5, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.card1 ? s.card1.name.split(' ')[0] : 'FĂRĂ CARD'}</span>
      </div>
    </div>
  )
}

// ─── LCD VDO ──────────────────────────────────────────────────────────────────
function VDO_Screen({ s, model = '1381' }) {
  const act = s.speed > 0 ? 'driving' : s.activity
  const vdoSym = ACT[act].vdo
  const actMin = act === 'driving' ? s.drivingMin : act === 'rest' ? s.restMin : act === 'work' ? s.workMin : s.availMin
  const act2 = s.card2 ? (s.speed > 0 ? 'driving' : (s.activity2 || 'availability')) : null
  const vdoSym2 = s.card2 ? ACT[act2].vdo : '--'
  const actMin2 = s.card2 ? (act2 === 'driving' ? s.drivingMin2 : act2 === 'rest' ? s.restMin2 : act2 === 'work' ? s.workMin2 : s.availMin2) : 0
  const hasErr = s.errors.some(e => e !== 'E_MOV')
  const err = hasErr ? ERRORS[s.errors.find(e => e !== 'E_MOV')] : null
  const movErr = s.errors.includes('E_MOV')
  const remBreak = LIMITS.BREAK_AFTER - (s.drivingMin % LIMITS.BREAK_AFTER)

  if (s.boot > 0) return (
    <div style={{ fontFamily: 'monospace', color: '#fff', textAlign: 'center', paddingTop: 10 }}>
      {s.boot === 2
        ? <div style={{ fontSize: 14, fontWeight: 900, color: '#cc8800', letterSpacing: 4, animation: 'blink 0.6s infinite' }}>VDO</div>
        : <><div style={{ fontSize: 9, color: '#888', letterSpacing: 1 }}>DTCO {model}</div><div style={{ fontSize: 8, marginTop: 3, color: '#555' }}>EU 165/2014  v3.0</div><div style={{ marginTop: 5, height: 3, background: '#222', borderRadius: 1 }}><div style={{ height: '100%', background: '#cc8800', width: '55%', borderRadius: 1 }} /></div></>}
    </div>
  )
  if (s.screen === 'download') return (
    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#fff' }}>
      <div style={{ fontSize: 8, borderBottom: '1px solid #444', paddingBottom: 2, marginBottom: 4, color: '#cc8800' }}>DLK PRO — DESCĂRCARE</div>
      <div style={{ fontSize: 9 }}>Se transferă...</div>
      <div style={{ margin: '6px 0', height: 8, background: '#1a1a1a', border: '1px solid #333', borderRadius: 1 }}>
        <div style={{ height: '100%', background: '#fff', width: `${s.downloading ?? 0}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: 12, textAlign: 'center', color: '#aaa' }}>{pad(s.downloading ?? 0)}%{(s.downloading ?? 0) >= 100 ? '  ✓' : ''}</div>
    </div>
  )
  if (s.screen === 'print') return (
    <div style={{ fontFamily: 'monospace', fontSize: 8, lineHeight: '14px', color: '#fff' }}>
      <div style={{ fontSize: 7, borderBottom: '1px solid #444', marginBottom: 2, color: '#cc8800' }}>VDO DTCO {model}</div>
      <div>DRV: {s.card1?.name ?? '---'}</div>
      <div style={{ marginTop: 2 }}>d {fmtMin(s.drivingMin)}  b {fmtMin(s.restMin)}</div>
      <div>a {fmtMin(s.workMin)}  c {fmtMin(s.availMin)}</div>
      <div style={{ marginTop: 2, fontSize: 7 }}>*** FIN ***</div>
    </div>
  )
  if (s.screen === 'menu') return (
    <div style={{ fontFamily: 'monospace', fontSize: 9, lineHeight: '16px', color: '#fff' }}>
      {MENU_VDO.map((m, i) => (
        <div key={m.id} style={{ display: 'flex', background: i === s.menuIdx ? '#fff' : 'transparent', color: i === s.menuIdx ? '#000' : '#fff', paddingLeft: 2 }}>
          <span style={{ width: 8 }}>{i === s.menuIdx ? '▶' : ' '}</span><span style={{ fontSize: 8 }}>{m.label}</span>
        </div>
      ))}
    </div>
  )
  if (s.screen === 'submenu') {
    const parent = MENU_VDO.find(m => m.id === s.activeMenu)
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 9, lineHeight: '16px', color: '#fff' }}>
        <div style={{ fontSize: 7, borderBottom: '1px solid #444', marginBottom: 2, color: '#888' }}>{parent?.label}</div>
        {parent?.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', background: i === s.subIdx ? '#fff' : 'transparent', color: i === s.subIdx ? '#000' : '#fff', paddingLeft: 2 }}>
            <span style={{ width: 8 }}>{i === s.subIdx ? '▶' : ' '}</span><span>{item}</span>
          </div>
        ))}
      </div>
    )
  }
  if (s.screen === 'actsel') {
    const opts = [{ id: 'work', sym: 'a', label: 'ALTĂ MUNCĂ' }, { id: 'rest', sym: 'b', label: 'ODIHNĂ' }, { id: 'availability', sym: 'c', label: 'DISPONIBILITATE' }]
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 9, lineHeight: '17px', color: '#fff' }}>
        <div style={{ fontSize: 7, borderBottom: '1px solid #444', marginBottom: 2, color: '#888' }}>SELEC. ACTIVITATE</div>
        {opts.map((o, i) => (
          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: i === s.menuIdx ? '#fff' : 'transparent', color: i === s.menuIdx ? '#000' : '#fff', paddingLeft: 2 }}>
            <span style={{ width: 8 }}>{i === s.menuIdx ? '▶' : ' '}</span><span style={{ fontWeight: 900, fontSize: 12 }}>{o.sym}</span><span style={{ fontSize: 8 }}>{o.label}</span>
          </div>
        ))}
      </div>
    )
  }
  if (s.screen === 'dl_done') return (
    <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#fff', textAlign: 'center', paddingTop: 14 }}>
      <div style={{ fontSize: 18, marginBottom: 4, color: '#cc8800' }}>✓</div>
      <div style={{ letterSpacing: 1 }}>DESCĂRCARE OK</div>
      <div style={{ fontSize: 7, color: '#555', marginTop: 4 }}>100% complet</div>
    </div>
  )
  if (s.screen === 'manual_entry') {
    const me = s.manualEntry
    const acts = [
      { id:'work',         sym:'a', label:'ALTĂ MUNCĂ' },
      { id:'rest',         sym:'b', label:'ODIHNĂ' },
      { id:'availability', sym:'c', label:'DISPONIBIL' },
    ]
    return (
      <div style={{ fontFamily:'monospace', fontSize:9, lineHeight:'16px', color:'#fff' }}>
        <div style={{ fontSize:7, borderBottom:'1px solid #444', marginBottom:3, color:'#cc8800' }}>
          INTRARE MANUALĂ · Pasul {me.step+1}/4
        </div>
        {me.step === 0 && acts.map((a, i) => (
          <div key={a.id} style={{ display:'flex', gap:4, background: i===me.actIdx ? '#fff' : 'transparent', color: i===me.actIdx ? '#000' : '#fff', paddingLeft:2 }}>
            <span style={{width:8}}>{i===me.actIdx?'▶':' '}</span><span style={{fontWeight:900}}>{a.sym}</span><span style={{fontSize:8}}>{a.label}</span>
          </div>
        ))}
        {me.step === 1 && (
          <div>
            <div style={{fontSize:7,color:'#555'}}>Ora de început (▲▼)</div>
            <div style={{fontSize:18,textAlign:'center',letterSpacing:2,marginTop:4}}>{pad(me.h)}:--</div>
          </div>
        )}
        {me.step === 2 && (
          <div>
            <div style={{fontSize:7,color:'#555'}}>Minute (▲▼)</div>
            <div style={{fontSize:18,textAlign:'center',letterSpacing:2,marginTop:4}}>{pad(me.h)}:{pad(me.m)}</div>
          </div>
        )}
        {me.step === 3 && (
          <div>
            <div style={{fontSize:7,color:'#555'}}>Confirmare (✓ = OK)</div>
            <div style={{marginTop:4,fontWeight:900}}>{acts[me.actIdx].sym} {acts[me.actIdx].label}</div>
            <div style={{fontSize:8,color:'#555'}}>de la {pad(me.h)}:{pad(me.m)}</div>
          </div>
        )}
      </div>
    )
  }
  if (s.screen === 'times_vdo') return (
    <div style={{ fontFamily: 'monospace', fontSize: 9, lineHeight: '17px', color: '#fff' }}>
      <div style={{ fontSize: 7, borderBottom: '1px solid #444', marginBottom: 2, color: '#cc8800' }}>TIMPII MEI</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>d zilnic</span><span>{fmtMin(s.drivingMin)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: remBreak <= 30 ? '#ffcc00' : '#fff' }}><span>▲ pauză</span><span>{fmtRem(LIMITS.BREAK_AFTER, s.drivingMin % LIMITS.BREAK_AFTER)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}><span>b odihnă</span><span>{fmtMin(s.restMin)}</span></div>
      <div style={{ fontSize: 7, color: '#444', marginTop: 2 }}>✓ pentru a reveni</div>
    </div>
  )
  return (
    <div style={{ fontFamily: 'monospace', color: '#ffffff', userSelect: 'none' }}>
      {hasErr && err && <div style={{ background: '#1a0000', border: '1px solid #ff4444', borderRadius: 1, padding: '1px 3px', marginBottom: 2, fontSize: 8, color: '#ff8888' }}>x {err.code}: {err.msg}</div>}
      {movErr && !hasErr && <div style={{ background: '#1a1200', border: '1px solid #f5a623', borderRadius: 1, padding: '1px 3px', marginBottom: 2, fontSize: 8, color: '#f5a623' }}>! Oprește vehiculul</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ fontWeight: 900, fontSize: 15 }}>{vdoSym}</span><span style={{ fontSize: 10, color: '#ffcc00' }}>{s.speed > 0 ? '▶' : ' '}</span><span style={{ fontSize: 13, letterSpacing: 1 }}>{fmtMin(actMin)}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 9, color: hasErr ? '#ff4444' : '#333', fontWeight: 'bold' }}>{hasErr ? '!' : ' '}</span><span style={{ fontSize: 12, letterSpacing: 1 }}>{fmtTime(s.h, s.m)}</span><span style={{ fontSize: 9, color: '#666' }}>{DAYS[new Date().getDay()]}</span></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 17, opacity: s.card2 ? 0.8 : 0.4 }}>
        <div><span style={{ fontWeight: 900, fontSize: 13 }}>{s.card2 ? vdoSym2 : '--'}</span><span style={{ fontSize: 11, marginLeft: 4, letterSpacing: 1 }}>{s.card2 ? fmtMin(actMin2) : '--:--'}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {model === '3.0' && <span style={{ fontSize: 9, color: s.card1 ? '#44cc44' : '#333' }}>{s.card1 ? '⊕' : '⊙'}</span>}
          <span style={{ fontWeight: 'bold', letterSpacing: 2, fontSize: 11 }}>{s.country}</span>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #2a2a2a', margin: '2px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
        <span>{s.speed > 0 ? '↓' : '■'} <span style={{ fontSize: 13, color: s.speed > LIMITS.SPEED_LIMIT ? '#ff4444' : '#fff', fontWeight: 'bold' }}>{pad(s.speed)}</span><span style={{ fontSize: 8, color: '#555' }}> km/h</span></span>
        <span style={{ fontSize: 8, color: '#444', letterSpacing: 1 }}>DTCO {model}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, marginTop: 1 }}>
        <span style={{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{s.card1 ? s.card1.name.split(' ')[0] : 'FĂRĂ CARD'}</span>
        <span style={{ color: remBreak <= 30 && s.drivingMin > 0 ? '#ffcc00' : '#333' }}>{s.drivingMin > 0 ? fmtRem(LIMITS.BREAK_AFTER, s.drivingMin % LIMITS.BREAK_AFTER) : '04:30'}</span>
      </div>
    </div>
  )
}

// ─── Botón físico (con affordance: shadow press) ──────────────────────────────
function Btn({ label, onClick, bg = '#3a3a3a', w = 36, h = 28, r = 4, textColor = '#e0e0e0', fontSize = 13 }) {
  const [p, setP] = useState(false)
  return (
    <button onPointerDown={() => setP(true)} onPointerUp={() => { setP(false); onClick() }} onPointerLeave={() => setP(false)}
      style={{
        width: w, height: h,
        background: p ? `color-mix(in srgb, ${bg} 70%, #000)` : bg,
        border: 'none', borderRadius: r, cursor: 'pointer',
        color: textColor, fontSize, fontWeight: 700, fontFamily: 'monospace',
        transform: p ? 'translateY(2px) scale(0.97)' : 'none',
        boxShadow: p ? `0 1px 0 rgba(0,0,0,0.6), inset 0 1px 3px rgba(0,0,0,0.5)` : `0 3px 0 rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.35)`,
        transition: 'transform 0.06s, box-shadow 0.06s, background 0.06s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
      }}>{label}</button>
  )
}

// ─── Hardware SE5000 ──────────────────────────────────────────────────────────
function SE5000({ s, dispatch }) {
  const onEnter = () => s.screen === 'dl_done' ? dispatch({ type: 'CANCEL' }) : s.screen === 'download' && (s.downloading ?? 0) >= 100 ? dispatch({ type: 'DL_DONE' }) : dispatch({ type: 'ENTER', brand: 'se' })
  const onUp    = () => dispatch({ type: 'UP',   brand: 'se' })
  const onDown  = () => dispatch({ type: 'DOWN', brand: 'se' })
  const ledColor = s.card1 ? '#00ff55' : s.errors.filter(e=>e!=='E_MOV').length > 0 ? '#ff3300' : '#333'

  return (
    <div style={{ width: '100%', background: 'linear-gradient(170deg,#313131 0%,#272727 45%,#1e1e1e 100%)', borderRadius: 10, border: '1px solid #484848', outline: '3px solid #0c0c0c', boxShadow: '0 5px 0 #080808, 0 14px 40px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.09)', userSelect: 'none', overflow: 'hidden' }}>

      {/* Franja superior metálica */}
      <div style={{ height: 4, background: 'linear-gradient(90deg,#3a3a3a 0%,#777 25%,#999 50%,#666 75%,#3a3a3a 100%)', opacity: 0.55 }} />

      <div style={{ padding: '10px 12px 0' }}>
        {/* Header: marca + LEDs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 3, height: 26, background: `linear-gradient(180deg,#00e87a,#006030)`, borderRadius: 2 }} />
            <div>
              <div style={{ fontSize: 11, color: '#d4d4d4', letterSpacing: 3, fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>Stoneridge</div>
              <div style={{ fontSize: 7, color: '#3e3e3e', letterSpacing: 1.5, marginTop: 1 }}>SE5000  Exakt Duo2  Rev.7.6</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1c1c1c', border: '1px solid #2a2a2a' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: ledColor, boxShadow: s.card1 ? `0 0 8px ${ledColor}, 0 0 16px ${ledColor}40` : s.errors.filter(e=>e!=='E_MOV').length > 0 ? `0 0 6px ${ledColor}` : 'none', transition: 'all 0.3s', border: '1px solid rgba(0,0,0,0.3)' }} />
              <span style={{ fontSize: 5.5, color: '#383838', letterSpacing: 0.5 }}>{s.card1 ? 'OK' : s.errors.filter(e=>e!=='E_MOV').length > 0 ? 'ERR' : '---'}</span>
            </div>
          </div>
        </div>

        {/* Área principal: LCD + ranuras */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          {/* LCD con bisel doble */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: '#0a0a0a', border: '3px solid #111', borderRadius: 5, padding: 3, boxShadow: 'inset 0 0 0 1px #060606, 0 0 0 1px #222' }}>
              <div style={{ background: '#001200', border: '1px solid #003200', borderRadius: 3, padding: '9px 10px', minHeight: 108, boxShadow: `inset 0 3px 14px rgba(0,0,0,0.98), inset 0 0 6px rgba(0,0,0,0.5), 0 0 ${s.card1 ? '18px' : '4px'} rgba(0,232,122,${s.card1 ? '0.13' : '0.02'})`, position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.5s' }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.20) 3px,rgba(0,0,0,0.20) 4px)' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, background: 'linear-gradient(180deg,rgba(0,100,0,0.08) 0%,transparent 100%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(0,0,0,0.40) 100%)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}><SE_Screen s={s} /></div>
              </div>
            </div>
          </div>

          {/* Ranuras de tarjeta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 60, flexShrink: 0 }}>
            {[1, 2].map(slot => {
              const card = slot === 1 ? s.card1 : s.card2
              return (
                <div key={slot}>
                  <div style={{ fontSize: 6, color: '#383838', letterSpacing: 1.5, marginBottom: 3, textAlign: 'center', fontFamily: 'monospace' }}>DRV {slot}</div>
                  <div onClick={() => card ? dispatch({ type: 'EJECT', slot }) : dispatch({ type: 'INSERT', slot, card: slot === 1 ? DEMO_CARD : DEMO_CARD2 })} title={card ? 'Extragere card' : 'Inserare card'}
                    style={{ width: '100%', height: 34, background: card ? '#080e08' : '#070707', border: `1.5px solid ${card ? '#1a5c28' : '#1e1e1e'}`, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.85)', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 7, right: 7, height: 2, background: card ? '#0e2a14' : '#141414', transform: 'translateY(-50%)', borderRadius: 1 }} />
                    {!card && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: '70%', height: 1.5, background: '#2a2a2a', borderRadius: 1 }} />
                        <span style={{ fontSize: 6, color: '#3a3a3a', letterSpacing: 1, animation: 'blink 1.5s infinite' }}>INSERARE</span>
                      </div>
                    )}
                    {card && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 24, height: 16, background: 'linear-gradient(135deg,#f0dca0 0%,#d4a843 100%)', borderRadius: 2, border: '1px solid #b09030', boxShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                          <div style={{ margin: '3px auto 0', width: 15, height: 10, background: 'linear-gradient(135deg,#c8962a,#a07020)', borderRadius: 1 }} />
                        </div>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff55', boxShadow: '0 0 5px #00ff55, 0 0 10px #00ff5540' }} />
                      </div>
                    )}
                  </div>
                  <button onClick={() => card ? dispatch({ type: 'EJECT', slot }) : dispatch({ type: 'INSERT', slot, card: slot === 1 ? DEMO_CARD : DEMO_CARD2 })}
                    style={{ width: '100%', height: 14, marginTop: 2, background: '#181818', border: '1px solid #2c2c2c', borderRadius: 2, color: '#424242', fontSize: 8, cursor: 'pointer', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all 0.1s' }} >
                    {slot}
                  </button>
                </div>
              )
            })}
            {/* Puerto 6-PIN */}
            <div style={{ marginTop: 4, textAlign: 'center' }}>
              <div style={{ width: 38, height: 15, background: '#050505', border: '1px solid #252525', borderRadius: 3, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9)' }}>
                <div style={{ display: 'flex', gap: 3 }}>{[...Array(6)].map((_, i) => <div key={i} style={{ width: 2, height: 8, background: '#4a4a4a', borderRadius: 1 }} />)}</div>
              </div>
              <div style={{ fontSize: 6, color: '#2a2a2a', marginTop: 2, letterSpacing: 1 }}>6-PIN</div>
            </div>
          </div>
        </div>

        {/* Ranura impresora */}
        <div style={{ margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 8, background: '#080808', border: '1px solid #242424', borderRadius: 2, overflow: 'hidden', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.85)' }}>
            <div style={{ margin: '2px 6px', height: 3, background: 'repeating-linear-gradient(90deg,#111 0px,#111 2px,#1a1a1a 2px,#1a1a1a 4px)', borderRadius: 1 }} />
          </div>
          <span style={{ fontSize: 6, color: '#2a2a2a', letterSpacing: 1.2, whiteSpace: 'nowrap' }}>THERMAL PRINTER</span>
        </div>
      </div>

      {/* Panel de botones (área separada, más oscura) */}
      <div style={{ background: 'linear-gradient(180deg,#161616 0%,#111 100%)', borderTop: '2px solid #0a0a0a', marginTop: 10, padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 9 }}>
          {[
            { label:'✖', fn: () => dispatch({ type:'CANCEL' }), bg:'#5c1e1e', tc:'#ff9090', lbl:'CANCEL' },
            { label:'▲', fn: onUp,    bg:'#2a2a2e', tc:'#c0c0c0', lbl:'▲' },
            { label:'▼', fn: onDown,  bg:'#2a2a2e', tc:'#c0c0c0', lbl:'▼' },
            { label:'✓', fn: onEnter, bg:'#183c1c', tc:'#80ff90', lbl:'ENTER' },
          ].map(({ label, fn, bg, tc, lbl }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Btn label={label} onClick={fn} bg={bg} w={50} h={35} r={6} textColor={tc} fontSize={15} />
              <span style={{ fontSize: 7, color: '#2e2e2e', letterSpacing: 0.5 }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Hardware VDO DTCO ────────────────────────────────────────────────────────
function DTCO({ s, dispatch, model = '1381' }) {
  const onEnter = () => s.screen === 'dl_done' ? dispatch({ type: 'CANCEL' }) : s.screen === 'download' && (s.downloading ?? 0) >= 100 ? dispatch({ type: 'DL_DONE' }) : dispatch({ type: 'ENTER', brand: 'vdo' })
  const onUp    = () => dispatch({ type: 'UP',   brand: 'vdo' })
  const onDown  = () => dispatch({ type: 'DOWN', brand: 'vdo' })
  const hasRealErr = s.errors.filter(e => e !== 'E_MOV').length > 0

  const CardSlot = ({ slot, card }) => (
    <div onClick={() => card ? dispatch({ type:'EJECT', slot }) : dispatch({ type:'INSERT', slot, card: slot === 1 ? DEMO_CARD : DEMO_CARD2 })} title={card ? 'Extragere' : 'Inserare'}
      style={{ width: 50, flexShrink: 0, background: '#070707', border: `1.5px solid ${card ? '#1c4a20' : '#181818'}`, borderRadius: 4, cursor: 'pointer', padding: '4px 3px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9)', transition: 'border-color 0.25s' }}>
      <div style={{ fontSize: 6.5, color: '#2a2a2a', letterSpacing: 1.2, fontFamily: 'monospace' }}>DRV {slot}</div>
      <div style={{ width: 36, height: 26, background: card ? '#070e07' : '#080808', border: `1px solid ${card ? '#163016' : '#101010'}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8)' }}>
        <div style={{ position: 'absolute', top: '50%', left: 5, right: 5, height: 1.5, background: card ? '#0c1c0c' : '#131313', transform: 'translateY(-50%)', borderRadius: 1 }} />
        {!card && <span style={{ fontSize: 6, color: '#2a2a2a', letterSpacing: 0.8, position: 'relative', zIndex: 1, animation: 'blink 1.5s infinite' }}>INSERT</span>}
        {card && (
          <div style={{ width: 28, height: 19, background: 'linear-gradient(135deg,#f0dca0 0%,#d4a843 100%)', borderRadius: 2, border: '1px solid #b09030', boxShadow: '0 1px 4px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ width: 19, height: 12, background: 'linear-gradient(135deg,#c89428,#9c6c1e)', borderRadius: 1 }} />
          </div>
        )}
      </div>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: card ? '#44ff44' : '#120000', boxShadow: card ? '0 0 7px #44ff44, 0 0 12px #44ff4430' : 'none', transition: 'all 0.3s', border: '1px solid rgba(0,0,0,0.3)' }} />
    </div>
  )

  return (
    <div style={{ width: '100%', background: 'linear-gradient(160deg,#1b1b1d 0%,#131315 45%,#0c0c0e 100%)', borderRadius: 7, border: '1px solid #2e2e2e', outline: '3px solid #060606', boxShadow: '0 5px 0 #000, 0 14px 40px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.035)', userSelect: 'none', overflow: 'hidden' }}>

      {/* Franja naranja VDO */}
      <div style={{ height: 4, background: 'linear-gradient(90deg,#aa6600 0%,#e8a000 35%,#f0aa10 50%,#cc8800 70%,#996600 100%)' }} />

      <div style={{ padding: '8px 10px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 17, color: '#e8a000', fontWeight: 900, letterSpacing: 3.5, fontFamily: 'Arial Black, Arial, sans-serif', textShadow: '0 0 12px rgba(232,160,0,0.25)' }}>VDO</span>
            <div>
              <div style={{ fontSize: 7, color: '#282828', letterSpacing: 1.8, fontWeight: 600 }}>DIGITAL TACHOGRAPH</div>
              <div style={{ fontSize: 7, color: '#e8a000', letterSpacing: 1.5, marginTop: 2, opacity: 0.7 }}>DTCO {model}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            {model === '3.0' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.card1 ? '#3388ff' : '#181830', boxShadow: s.card1 ? '0 0 5px #3388ff' : 'none', transition: 'all 0.3s' }} />
                <span style={{ fontSize: 6, color: '#1e1e3a', letterSpacing: 0.5 }}>GNSS</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.card1 ? '#44ff44' : hasRealErr ? '#ff3300' : '#1a1a1a', boxShadow: s.card1 ? '0 0 7px #44ff44' : hasRealErr ? '0 0 6px #ff3300' : 'none', transition: 'all 0.3s', border: '1px solid rgba(0,0,0,0.4)' }} />
              <span style={{ fontSize: 6, color: '#262626' }}>{s.card1 ? 'OK' : hasRealErr ? 'ERR' : '---'}</span>
            </div>
          </div>
        </div>

        {/* Ranuras + LCD */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'stretch', marginBottom: 8 }}>
          <CardSlot slot={1} card={s.card1} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: '#050505', border: '2px solid #141414', borderRadius: 4, padding: 3, boxShadow: 'inset 0 0 0 1px #080808' }}>
              <div style={{ background: '#030303', border: '1px solid #161616', borderRadius: 3, padding: '8px 10px', minHeight: 96, boxShadow: 'inset 0 3px 14px rgba(0,0,0,0.99), inset 0 0 5px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.022) 3px,rgba(255,255,255,0.022) 4px)' }} />
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 35%, transparent 38%, rgba(0,0,0,0.55) 100%)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}><VDO_Screen s={s} model={model} /></div>
              </div>
            </div>
          </div>
          <CardSlot slot={2} card={s.card2} />
        </div>

        {/* Puerto 6-PIN + Impresora */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 15, background: '#050505', border: '1px solid #1e1e1e', borderRadius: 3, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.9)' }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ width: 2.5, height: 9, background: '#383838', borderRadius: 1 }} />)}
            </div>
            <div style={{ fontSize: 6, color: '#202020', marginTop: 2, letterSpacing: 1 }}>DLK 6-PIN</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 96, height: 8, background: '#060606', border: '1px solid #1c1c1c', borderRadius: 2, overflow: 'hidden', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.85)' }}>
              <div style={{ margin: '2px 6px', height: 3, background: 'repeating-linear-gradient(90deg,#0e0e0e 0px,#0e0e0e 2px,#181818 2px,#181818 4px)', borderRadius: 1 }} />
            </div>
            <div style={{ fontSize: 6, color: '#202020', marginTop: 2, letterSpacing: 1 }}>PRINTER  ✂</div>
          </div>
        </div>
      </div>

      {/* Panel de botones */}
      <div style={{ background: 'linear-gradient(180deg,#0e0e10 0%,#090909 100%)', borderTop: '2px solid #060606', marginTop: 8, padding: '8px 10px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
          {[
            { label:'✖', fn:() => dispatch({type:'CANCEL'}), bg:'#401414', tc:'#ff8888', lbl:'ESC' },
            { label:'▲', fn:onUp,    bg:'#1c1c20', tc:'#b8b8b8', lbl:'▲' },
            { label:'▼', fn:onDown,  bg:'#1c1c20', tc:'#b8b8b8', lbl:'▼' },
            { label:'✓', fn:onEnter, bg:'#0e1c0e', tc:'#60d060', lbl:'OK' },
            { label:'⚡', fn:() => dispatch({type:'DOWN',brand:'vdo'}), bg:'#10101e', tc:'#7070cc', lbl:'ACT' },
          ].map(({ label, fn, bg, tc, lbl }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Btn label={label} onClick={fn} bg={bg} w={46} h={30} r={4} textColor={tc} fontSize={label === '⚡' ? 11 : 13} />
              <span style={{ fontSize: 7, color: '#272727', letterSpacing: 0.5 }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Ticket impreso ───────────────────────────────────────────────────────────
function PrintTicket({ s, brand, dispatch }) {
  if (s.screen !== 'print') return null
  const isSE = brand === 'se'
  return (
    <div style={{ marginTop: 10, position: 'relative' }}>
      {/* Borde dentado superior (perforación de papel) */}
      <div style={{ height: 9, background: `repeating-linear-gradient(90deg,${isSE ? '#f0f0e8' : '#f5f5f0'} 0px,${isSE ? '#f0f0e8' : '#f5f5f0'} 4px,rgba(0,0,0,0) 4px,rgba(0,0,0,0) 5px,${isSE ? '#f0f0e8' : '#f5f5f0'} 5px,${isSE ? '#f0f0e8' : '#f5f5f0'} 9px)`, borderLeft: '1px solid #d4d4c8', borderRight: '1px solid #d4d4c8', borderTop: '1px solid #c8c8bc' }} />
      <div style={{ background: isSE ? '#f7f7ef' : '#f8f8f2', color: '#111', fontFamily: "'Courier New', Courier, monospace", fontSize: 9.5, lineHeight: '19px', boxShadow: '0 6px 20px rgba(0,0,0,0.30)', border: '1px solid #d8d8cc', borderTop: 'none', borderBottom: 'none', padding: '2px 16px 10px' }}>
        {/* Cabecera */}
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #c0c0b0', marginBottom: 8, paddingBottom: 8, paddingTop: 6 }}>
          <div style={{ fontWeight: 700, letterSpacing: 2.5, fontSize: 10 }}>{isSE ? 'STONERIDGE SE5000' : 'VDO DTCO ' + (brand === 'vdo3' ? '3.0' : '1381')}</div>
          <div style={{ fontSize: 8, color: '#888', letterSpacing: 0.8, marginTop: 2 }}>Exakt Duo2 · EU Reg. 165/2014</div>
        </div>
        {/* Datos jornada */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DATA</span><span>{new Date().toLocaleDateString('ro-RO')}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ORA  </span><span>{fmtTime(s.h, s.m)}  {s.country}</span></div>
        {/* Conductor */}
        <div style={{ borderTop: '1px dashed #c8c8b8', marginTop: 7, paddingTop: 7 }}>
          <div>CONDUCĂTOR 1:</div>
          <div style={{ paddingLeft: 8, fontWeight: 700 }}>{s.card1?.name ?? '---'}</div>
          <div style={{ paddingLeft: 8, fontSize: 8, color: '#888' }}>Nº: {s.card1?.cardNo ?? '---'}</div>
        </div>
        {/* Actividades */}
        <div style={{ borderTop: '1px dashed #c8c8b8', marginTop: 7, paddingTop: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{isSE ? 'CONDUCERE' : 'd CONDUCERE'}</span><span style={{ fontWeight: 700 }}>{fmtMin(s.drivingMin)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{isSE ? 'ODIHNĂ   ' : 'b ODIHNĂ   '}</span><span style={{ fontWeight: 700 }}>{fmtMin(s.restMin)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{isSE ? 'MUNCĂ    ' : 'a MUNCĂ    '}</span><span>{fmtMin(s.workMin)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{isSE ? 'DISPONIB. ' : 'c DISPONIB. '}</span><span>{fmtMin(s.availMin)}</span></div>
        </div>
        <div style={{ marginTop: 7, fontSize: 7.5, color: '#aaa', textAlign: 'center', letterSpacing: 0.5 }}>EU Reg. 165/2014 · 561/2006 · 2020/1054</div>
        {/* Firma */}
        <div style={{ borderTop: '1px dashed #c8c8b8', marginTop: 8, paddingTop: 8, textAlign: 'center', color: '#999', fontSize: 9 }}>
          ________________________<br /><span style={{ fontSize: 8 }}>SEMNĂTURA CONDUCĂTORULUI</span>
        </div>
        <button onClick={() => dispatch({ type: 'CANCEL' })}
          style={{ display: 'block', width: '100%', marginTop: 10, padding: '6px 0', background: '#1e1e1e', color: '#aaa', border: '1px solid #333', borderRadius: 3, cursor: 'pointer', fontSize: 9, fontFamily: "'Courier New', monospace", letterSpacing: 1.5, transition: 'all 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.background = '#333'; e.currentTarget.style.color = '#eee' }}
          onMouseOut={e => { e.currentTarget.style.background = '#1e1e1e'; e.currentTarget.style.color = '#aaa' }}>
          ✖  ÎNCHIDE IMPRIMAREA
        </button>
      </div>
      {/* Borde dentado inferior */}
      <div style={{ height: 9, background: `repeating-linear-gradient(90deg,${isSE ? '#f0f0e8' : '#f5f5f0'} 0px,${isSE ? '#f0f0e8' : '#f5f5f0'} 4px,rgba(0,0,0,0) 4px,rgba(0,0,0,0) 5px,${isSE ? '#f0f0e8' : '#f5f5f0'} 5px,${isSE ? '#f0f0e8' : '#f5f5f0'} 9px)`, borderLeft: '1px solid #d4d4c8', borderRight: '1px solid #d4d4c8', borderBottom: '1px solid #c8c8bc' }} />
    </div>
  )
}

// ─── Panel: Guía contextual ───────────────────────────────────────────────────
const GUIDES = {
  driving:   { title: 'Ecran principal', icon: '📟', text: 'Vedere normală în timpul conducerii. Modul conducere se activează automat la pornire. Apasă ▲ sau ▼ cu vehiculul oprit pentru a schimba activitatea.', tip: 'Nu extrage cardul cu vehiculul în mișcare — rămâne înregistrat ca infracțiune E003.' },
  menu:      { title: 'Meniu principal',     icon: '☰',  text: 'Navighează cu ▲▼ și confirmă cu ✓. Apasă ✖/ESC pentru a reveni fără modificări.', tip: 'Un inspector poate cere înregistrările din ultimele 28 de zile în orice moment.' },
  submenu:   { title: 'Submeniu',            icon: '→',  text: 'Navighează cu ▲▼ și apasă ✓ pentru a executa acțiunea selectată.', tip: '' },
  print:     { title: 'Se imprimă…',        icon: '🖨', text: 'Imprimanta emite tichetul termic. Păstrează hârtia — este dovada ta la inspecții.', tip: 'Hârtia termică se șterge la căldură. Păstrează copiile la loc răcoros și întunecat.' },
  download:  { title: 'Descărcare în curs',  icon: '⬇',  text: 'Conectează OPTAC (Stoneridge) sau DLK PRO (VDO) la portul de 6 pini. Descărcarea captează toate înregistrările.', tip: 'Compania descarcă VU la fiecare 90 de zile și cardurile la fiecare 28 de zile.' },
  actsel:    { title: 'Schimbare activitate', icon: '⚙', text: 'Vehiculul trebuie să fie OPRIT. Conducerea nu se selectează manual — o detectează senzorul de mișcare KITAS.', tip: 'VDO folosește litere: d=conducere, a=muncă, b=odihnă, c=disponibilitate.' },
  times_vdo: { title: 'Timpii mei (VDO)',   icon: '⏱',  text: 'DTCO afișează rezumatul timpilor din ziua curentă. Apasă ✓ pentru a reveni.', tip: '' },
  tech:      { title: 'Date tehnice',        icon: '📡', text: 'Viteza curentă, semnal GPS și date de calibrare ale vehiculului.', tip: '' },
  error:     { title: 'Eroare / Eveniment',  icon: '⚠', text: 'Apasă ✓ pentru a confirma eroarea. Toate erorile rămân înregistrate permanent în tahograf.', tip: 'Un inspector poate citi toate erorile din ultimele 365 de zile.' },
  manual_entry: { title: 'Intrare manuală', icon: '✏️', text: 'Înregistrează o activitate pe care ai realizat-o în afara vehiculului. Folosește ▲▼ pentru a schimba valoarea și ✓ pentru a avansa la pasul următor.', tip: 'Intrările manuale sunt marcate cu "M" în tahograf și pot fi verificate de inspectori.' },
}

function GuidePanel({ s }) {
  const hasErr = s.errors.some(e => e !== 'E_MOV')
  const errCode = hasErr ? s.errors.find(e => e !== 'E_MOV') : null
  const err = errCode ? ERRORS[errCode] : null
  const key = hasErr ? 'error' : (s.screen in GUIDES ? s.screen : 'driving')
  const g = GUIDES[key]
  return (
    <div style={card()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>{g.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, letterSpacing: -0.2 }}>{g.title}</span>
      </div>
      {err && (
        <div style={{ background: T.redDim, border: `1px solid rgba(255,68,102,0.2)`, borderRadius: T.rMd, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ color: T.red, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{err.code} — {err.msg}</div>
          <div style={{ color: 'rgba(255,100,130,0.8)', fontSize: 11, lineHeight: 1.55 }}>{err.cause}</div>
        </div>
      )}
      <div style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.65 }}>{g.text}</div>
      {g.tip && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, paddingTop: 10, borderTop: `1px solid ${T.borderSubtle}` }}>
          <span style={{ color: T.amber, fontSize: 13, flexShrink: 0 }}>💡</span>
          <span style={{ color: T.amber, fontSize: 11, lineHeight: 1.55, opacity: 0.9 }}>{g.tip}</span>
        </div>
      )}
    </div>
  )
}

// ─── Panel: Tiempos ───────────────────────────────────────────────────────────
function TimesPanel({ s, dispatch }) {
  const remBreak = LIMITS.BREAK_AFTER - (s.drivingMin % LIMITS.BREAK_AFTER)
  const warn = s.drivingMin >= LIMITS.BREAK_AFTER
  const hasE010 = s.errors.includes('E010')

  const bars = [
    { label: 'Conducere zilnică',              val: s.drivingMin,                         max: LIMITS.DAILY_MAX,  color: T.green },
    { label: 'De la ultima pauză',            val: s.drivingMin % LIMITS.BREAK_AFTER,    max: LIMITS.BREAK_AFTER, color: T.red   },
    { label: 'Odihnă acumulată (zilnică)',    val: s.restMin,                            max: LIMITS.DAILY_REST, color: T.blue  },
    { label: 'Conducere săptămânală',         val: s.weeklyDrivingMin,                   max: LIMITS.WEEKLY_MAX, color: T.amber },
  ]

  return (
    <div style={card()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>⏱</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, letterSpacing: -0.2 }}>Timpuri EU 561/2006</span>
        </div>
        <span style={{ ...label(), fontSize: 9 }}>reg. în vigoare</span>
      </div>

      {bars.map(b => {
        const pct = Math.min(100, (b.val / b.max) * 100)
        const critical = pct > 85
        const barColor = critical ? T.amber : b.color
        return (
          <div key={b.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: critical ? T.amber : T.textSecondary, transition: 'color 0.3s' }}>{b.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: critical ? T.amber : T.textPrimary }}>{fmtMin(b.val)}<span style={{ color: T.textTertiary, fontWeight: 400 }}> / {fmtMin(b.max)}</span></span>
            </div>
            <div style={{ height: 4, background: T.bgRaised, borderRadius: T.rPill, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: T.rPill, background: barColor, width: `${pct}%`, transition: 'width 0.4s ease, background 0.3s' }} />
            </div>
          </div>
        )
      })}

      {/* Próxima pausa — elemento hero */}
      <div style={{ marginTop: 4, padding: '12px 14px', borderRadius: T.rMd, background: warn ? T.redDim : T.bgElev, border: `1px solid ${warn ? 'rgba(255,68,102,0.25)' : T.borderSubtle}`, transition: 'all 0.3s' }}>
        <div style={{ ...label(), marginBottom: 6 }}>următoarea pauză obligatorie</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: warn ? 22 : 20, fontWeight: 800, fontFamily: 'monospace', color: warn ? T.red : remBreak < LIMITS.BREAK_AFTER / 4 ? T.amber : T.green, letterSpacing: -1, transition: 'color 0.3s' }}>
            {warn ? 'ACUM' : fmtMin(remBreak)}
          </span>
          {!warn && <span style={{ fontSize: 11, color: T.textTertiary }}>rămase</span>}
        </div>
        {warn && <div style={{ color: 'rgba(255,100,130,0.8)', fontSize: 11, marginTop: 4 }}>Odihnește-te minim 45 min (sau 15+30 min)</div>}
      </div>

      {/* E010 en curso — progreso del descanso hacia los 45 min */}
      {hasE010 && (
        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: T.rMd, background: T.amberDim, border: `1px solid rgba(217,119,6,0.2)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: T.amber, fontWeight: 600 }}>
              {s.splitBreakPhase === 1 ? '⏳ Pauză împărțită — prima etapă ✓' : '⏳ Odihnă în curs (E010)'}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: T.amber, fontWeight: 700 }}>
              {s.splitBreakPhase === 1 ? `${s.splitBreakMin}/${LIMITS.SPLIT_P2} min` : `${s.e010RestMin}/${LIMITS.BREAK_MIN} min`}
            </span>
          </div>
          <div style={{ height: 4, background: T.bgRaised, borderRadius: T.rPill, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: T.rPill, background: s.splitBreakPhase === 1 ? T.green : T.amber, width: `${Math.min(100, s.splitBreakPhase === 1 ? (s.splitBreakMin/LIMITS.SPLIT_P2)*100 : (s.e010RestMin/LIMITS.BREAK_MIN)*100)}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 4 }}>
            {s.splitBreakPhase === 1 ? '15 min ✓ · Odihnește-te încă 30 min pentru a curăța E010' : `Opțiunea A: 45 min continuu · Opțiunea B: 15 min + 30 min (EU 561/2006 art.7)`}
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
        {[['9h zilnic', 'max cond.'], ['4h30', 'pauză la'], ['28 zile', 'card'], ['90 zile', 'VU']].map(([v, l]) => (
          <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: T.textSecondary }}>{v}</span>
            <span style={{ fontSize: 10, color: T.textTertiary }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: `1px solid ${T.borderSubtle}` }}>
        <button onClick={() => dispatch({ type: 'WEEK_RESET' })}
          style={{ padding: '4px 12px', fontSize: 10, borderRadius: T.rSm, cursor: 'pointer', background: 'transparent', border: `1px solid ${T.borderLight}`, color: T.textTertiary, fontFamily: T.fontBase, transition: 'all 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = T.amber; e.currentTarget.style.color = T.amber }}
          onMouseOut={e => { e.currentTarget.style.borderColor = T.borderLight; e.currentTarget.style.color = T.textTertiary }}>
          ↺ Simulare săptămână nouă
        </button>
      </div>
    </div>
  )
}

// ─── Panel: Timeline (jornada) ────────────────────────────────────────────────
function TimelinePanel({ s }) {
  const log = s.activityLog
  if (log.length === 0) return null
  const firstH = log[0].h, firstM = log[0].m
  const nowMin = s.h * 60 + s.m
  const startMin = firstH * 60 + firstM
  const totalMin = nowMin > startMin ? nowMin - startMin : (24*60 - startMin + nowMin)
  if (totalMin <= 0) return null

  return (
    <div style={card()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 15 }}>📊</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, letterSpacing: -0.2 }}>Tură</span>
        <span style={{ fontSize: 10, color: T.textTertiary, marginLeft: 'auto' }}>{fmtTime(log[0].h, log[0].m)} → {fmtTime(s.h, s.m)}</span>
      </div>
      <div style={{ display: 'flex', height: 28, borderRadius: T.rSm, overflow: 'hidden', border: `1px solid ${T.borderLight}` }}>
        {log.map((entry, i) => {
          const entryMin = entry.h * 60 + entry.m
          const nextMin = i + 1 < log.length ? (log[i+1].h * 60 + log[i+1].m) : nowMin
          let dur = nextMin - entryMin; if (dur < 0) dur += 24 * 60
          const pct = Math.max(1, (dur / totalMin) * 100)
          const a = ACT[entry.act]
          return (
            <div key={i} title={`${a.label} · ${fmtTime(entry.h, entry.m)} (${fmtMin(dur)})`}
              style={{ width: `${pct}%`, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'width 0.4s' }}>
              {pct > 6 && <span style={{ fontSize: 9, opacity: 0.8, filter: 'brightness(0.3)' }}>{a.se || a.vdo}</span>}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        {Object.values(ACT).map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color }} />
            <span style={{ fontSize: 9, color: T.textTertiary }}>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Panel: Control ───────────────────────────────────────────────────────────
function ControlPanel({ s, dispatch }) {
  const [speedInput, setSpeedInput] = useState(s.speed)
  useEffect(() => { setSpeedInput(s.speed) }, [s.speed])

  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }
  const secLabel = { ...label(), display: 'block', marginBottom: 8 }
  const btnBase = { padding: '6px 0', fontSize: 11, borderRadius: T.rSm, cursor: 'pointer', border: `1px solid`, fontFamily: T.fontBase, fontWeight: 600, transition: 'all 0.15s', flex: 1 }

  return (
    <div style={card()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 15 }}>🎛</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, letterSpacing: -0.2 }}>Simulare</span>
      </div>

      {/* Velocidad */}
      <div style={{ marginBottom: 16 }}>
        <div style={rowStyle}>
          <span style={{ ...label() }}>viteză</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: s.speed > LIMITS.SPEED_LIMIT ? T.red : T.textPrimary, letterSpacing: -1, transition: 'color 0.2s' }}>{pad(s.speed)}</span>
            <span style={{ fontSize: 11, color: T.textTertiary }}>km/h</span>
            {s.speed > LIMITS.SPEED_LIMIT && <span style={{ fontSize: 10, color: T.red, fontWeight: 700, marginLeft: 2 }}>⚠ lím</span>}
          </div>
        </div>
        <input type="range" min={0} max={130} value={s.speed}
          onChange={e => dispatch({ type: 'SPEED', v: parseInt(e.target.value) })}
          style={{ width: '100%', accentColor: s.speed > LIMITS.SPEED_LIMIT ? T.red : T.green, cursor: 'pointer' }} />
        <div style={{ position: 'relative', height: 20, marginTop: 4 }}>
          {[
            { v:  0, label: 'oprit',      color: T.textMuted },
            { v: 50, label: '50',         color: T.textMuted },
            { v: 90, label: '90 — lim.',  color: T.red       },
            { v:130, label: '130',        color: T.textMuted },
          ].map(({ v, label, color }) => (
            <div key={v} style={{ position: 'absolute', left: `${(v/130)*100}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <div style={{ width: 1, height: 4, background: v === 90 ? T.red : T.borderLight }} />
              <span style={{ fontSize: 8, color, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tarjetas */}
      {[1, 2].map(slot => {
        const card2 = slot === 1 ? s.card1 : s.card2
        const demo  = slot === 1 ? DEMO_CARD : DEMO_CARD2
        return (
          <div key={slot} style={{ marginBottom: 14 }}>
            <span style={secLabel}>conducător {slot} — card</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => dispatch({ type: 'INSERT', slot, card: demo })} disabled={!!card2}
                style={{ ...btnBase, background: card2 ? 'transparent' : T.greenDim, borderColor: card2 ? T.borderSubtle : 'rgba(0,232,122,0.2)', color: card2 ? T.textMuted : T.green, cursor: card2 ? 'not-allowed' : 'pointer' }}>
                ▶ Inserare
              </button>
              <button onClick={() => dispatch({ type: 'EJECT', slot })} disabled={!card2}
                style={{ ...btnBase, background: card2 ? T.redDim : 'transparent', borderColor: card2 ? 'rgba(255,68,102,0.2)' : T.borderSubtle, color: card2 ? T.red : T.textMuted, cursor: card2 ? 'pointer' : 'not-allowed' }}>
                ◀ Extragere
              </button>
              {slot === 2 && (
                <button onClick={() => dispatch({ type: 'INSERT', slot: 2, card: DEMO_CARD })} disabled={!!card2 || !s.card1}
                  style={{ ...btnBase, background: T.amberDim, borderColor: 'rgba(217,119,6,0.2)', color: T.amber, cursor: (card2 || !s.card1) ? 'not-allowed' : 'pointer', flex: 'none', padding: '6px 8px', fontSize: 10 }}
                  title="Inserează același card al conducătorului 1 pentru a simula E002">
                  E002
                </button>
              )}
            </div>
            {card2 && <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 5, fontFamily: 'monospace' }}>🃏 {card2.name} · {card2.cardNo}</div>}
          </div>
        )
      })}

      {/* País */}
      <div style={{ marginBottom: 14 }}>
        <span style={secLabel}>țara curentă</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {COUNTRIES.map(c => (
            <button key={c} onClick={() => dispatch({ type: 'COUNTRY', v: c })}
              style={{ padding: '3px 10px', fontSize: 10, borderRadius: T.rSm, cursor: 'pointer', border: `1px solid`, fontFamily: 'monospace', fontWeight: 700, transition: 'all 0.15s',
                background: s.country === c ? T.brandDim : 'transparent',
                borderColor: s.country === c ? 'rgba(233,69,96,0.35)' : T.borderSubtle,
                color: s.country === c ? T.brand : T.textSecondary }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      <div style={{ marginBottom: 14 }}>
        <span style={secLabel}>simulare eroare / eveniment</span>
        <select onChange={e => { if (e.target.value) dispatch({ type: 'ERR_ADD', code: e.target.value }); e.target.value = '' }}
          style={{ width: '100%', padding: '7px 10px', background: T.bgElev, border: `1px solid ${T.borderLight}`, borderRadius: T.rSm, color: T.textPrimary, fontSize: 11, outline: 'none', cursor: 'pointer', fontFamily: T.fontBase }}>
          <option value="" style={{ background: T.bgElev }}>— Selectează o eroare —</option>
          {Object.values(ERRORS).map(e => <option key={e.code} value={e.code} style={{ background: T.bgElev }}>{e.code}: {e.msg}</option>)}
        </select>
        {s.errors.filter(e => e !== 'E_MOV').length > 0 && (
          <button onClick={() => dispatch({ type: 'ERR_CLEAR' })}
            style={{ marginTop: 6, width: '100%', padding: '6px 0', fontSize: 11, borderRadius: T.rSm, cursor: 'pointer', background: T.redDim, border: `1px solid rgba(255,68,102,0.2)`, color: T.red, fontFamily: T.fontBase, fontWeight: 600, transition: 'all 0.15s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,68,102,0.18)'}
            onMouseOut={e => e.currentTarget.style.background = T.redDim}>
            ✖ Șterge erorile ({s.errors.filter(e => e !== 'E_MOV').length})
          </button>
        )}
      </div>

      {/* Salto de tiempo */}
      <div style={{ marginBottom: 14 }}>
        <span style={secLabel}>avansare timp simulat</span>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[['▶ +30 min', 30], ['▶▶ +1h', 60], ['▶▶▶ +4h30', 270], ['⚡ Tură', 540]].map(([lbl, mins]) => (
            <button key={lbl} onClick={() => dispatch({ type: 'TIME_WARP', minutes: mins })}
              style={{ padding: '5px 10px', fontSize: 10, borderRadius: T.rSm, cursor: 'pointer', border: `1px solid ${T.borderLight}`, background: T.bgElev, color: T.textSecondary, fontFamily: T.fontBase, transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.background = T.brandDim; e.currentTarget.style.borderColor = `rgba(67,56,202,0.25)`; e.currentTarget.style.color = T.brand }}
              onMouseOut={e => { e.currentTarget.style.background = T.bgElev; e.currentTarget.style.borderColor = T.borderLight; e.currentTarget.style.color = T.textSecondary }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 9, color: T.textTertiary, marginTop: 5 }}>"+4h30" simulează conducere continuă până la E010</div>
      </div>

      {/* Papel + Reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${T.borderSubtle}` }}>
        <div>
          <span style={{ ...label(), display: 'block', marginBottom: 6 }}>hârtie imprimantă</span>
          <button onClick={() => dispatch({ type: 'PAPER' })}
            style={{ padding: '5px 12px', fontSize: 11, borderRadius: T.rSm, cursor: 'pointer', border: `1px solid`, fontFamily: T.fontBase, fontWeight: 600, transition: 'all 0.15s',
              background: s.paperEmpty ? T.redDim : T.greenDim,
              borderColor: s.paperEmpty ? 'rgba(255,68,102,0.2)' : 'rgba(0,232,122,0.2)',
              color: s.paperEmpty ? T.red : T.green }}>
            {s.paperEmpty ? '⚠ Fără hârtie' : '✓ Cu hârtie'}
          </button>
        </div>
        <button onClick={() => dispatch({ type: 'RESET' })}
          style={{ padding: '5px 14px', fontSize: 11, borderRadius: T.rSm, cursor: 'pointer', background: 'transparent', border: `1px solid ${T.borderLight}`, color: T.textSecondary, fontFamily: T.fontBase, transition: 'all 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.background = T.bgHover; e.currentTarget.style.color = T.textPrimary }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSecondary }}>
          ↺ Resetare
        </button>
      </div>
    </div>
  )
}

// ─── Panel: Escenarios ────────────────────────────────────────────────────────
function ScenariosPanel({ s, dispatch }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)
  const [step, setStep] = useState(0)

  const start = sc => { setActive(sc); setStep(0); dispatch({ type: 'RESET' }); setOpen(false) }
  const next = () => {
    if (!active) return
    if (step === 0 && active.id === 's1') dispatch({ type: 'INSERT', slot: 1, card: DEMO_CARD })
    if (step === 3 && active.id === 's1') dispatch({ type: 'SPEED', v: 60 })
    if (step === 0 && active.id === 's3') dispatch({ type: 'ACT_NOW', act: 'rest' })
    if (step === 3 && active.id === 's3') dispatch({ type: 'EJECT', slot: 1 })
    if (step === 0 && active.id === 's4') dispatch({ type: 'INSERT', slot: 1, card: DEMO_CARD })
    if (step === 0 && active.id === 's5') dispatch({ type: 'EJECT', slot: 1 })
    if (step === 2 && active.id === 's5') dispatch({ type: 'INSERT', slot: 1, card: DEMO_CARD })
    if (step === 0 && active.id === 's6') { dispatch({ type: 'INSERT', slot: 1, card: DEMO_CARD }); dispatch({ type: 'SPEED', v: 80 }) }
    if (step === 1 && active.id === 's6') dispatch({ type: 'ERR_ADD', code: 'E010' })
    if (step === 2 && active.id === 's6') { dispatch({ type: 'SPEED', v: 0 }); dispatch({ type: 'ACT_NOW', act: 'rest' }) }
    if (step === 0 && active.id === 's7') {
      dispatch({ type: 'INSERT', slot: 1, card: DEMO_CARD })
      dispatch({ type: 'INSERT', slot: 2, card: DEMO_CARD2 })
      dispatch({ type: 'SPEED', v: 80 })
    }
    if (step === 1 && active.id === 's7') {
      dispatch({ type: 'ERR_ADD', code: 'E010' })
      dispatch({ type: 'SPEED', v: 0 })
      dispatch({ type: 'ACT_NOW', act: 'rest' })
    }
    if (step === 2 && active.id === 's7') dispatch({ type: 'SPEED', v: 70 })
    setStep(p => p + 1)
  }

  return (
    <div style={card()}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🎯</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, letterSpacing: -0.2 }}>Scenarii de practică</span>
        </div>
        <span style={{ fontSize: 11, color: T.textTertiary, transition: 'transform 0.2s', display: 'block', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {SCENARIOS.map(sc => (
            <button key={sc.id} onClick={() => start(sc)}
              style={{ textAlign: 'left', padding: '8px 12px', background: T.bgElev, border: `1px solid ${T.borderSubtle}`, borderRadius: T.rMd, color: T.textSecondary, fontSize: 12, cursor: 'pointer', fontFamily: T.fontBase, transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.background = T.bgRaised; e.currentTarget.style.borderColor = T.borderLight; e.currentTarget.style.color = T.textPrimary }}
              onMouseOut={e => { e.currentTarget.style.background = T.bgElev; e.currentTarget.style.borderColor = T.borderSubtle; e.currentTarget.style.color = T.textSecondary }}>
              ▶ {sc.title}
            </button>
          ))}
        </div>
      )}

      {active && step < active.steps.length && (
        <div style={{ marginTop: 14, background: T.bgElev, border: `1px solid ${T.borderMed}`, borderRadius: T.rMd, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.purple }}>{active.title}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {active.steps.map((_, i) => <div key={i} style={{ width: i < step ? 16 : 6, height: 4, borderRadius: T.rPill, background: i < step ? T.purple : i === step ? T.purple : T.bgRaised, transition: 'all 0.3s' }} />)}
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.65, marginBottom: 10 }}>{active.steps[step]}</div>
          <span style={{ fontSize: 10, color: T.textTertiary }}>Pasul {step + 1} din {active.steps.length}</span>
          <button onClick={next} style={{ display: 'block', marginTop: 10, padding: '7px 18px', background: T.purple, border: 'none', borderRadius: T.rSm, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.fontBase, transition: 'opacity 0.15s' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.85'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
            Următorul →
          </button>
        </div>
      )}

      {active && step >= active.steps.length && (
        <div style={{ marginTop: 14, background: T.greenDim, border: `1px solid rgba(0,232,122,0.2)`, borderRadius: T.rMd, padding: '14px 16px' }}>
          <div style={{ color: T.green, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>✓ Scenariu completat</div>
          <div style={{ fontSize: 11, color: 'rgba(0,232,122,0.7)', marginBottom: 10 }}>Ai practicat toți pașii acestui scenariu.</div>
          <button onClick={() => { setActive(null); setStep(0) }} style={{ fontSize: 11, color: T.textSecondary, background: 'none', border: `1px solid ${T.borderLight}`, borderRadius: T.rSm, padding: '4px 12px', cursor: 'pointer', fontFamily: T.fontBase }}>Închide</button>
        </div>
      )}
    </div>
  )
}

// ─── Referencia rápida ────────────────────────────────────────────────────────
function QuickRef() {
  const sections = [
    { title: 'SE5000 — Pictograme', color: T.green,
      items: [['🚗','Conducere (auto)'],['⚒','Altă muncă'],['🛏','Odihnă'],['⬡','Disponibilitate'],['●','GPS activ'],['1▶','Conducător activ']] },
    { title: 'VDO DTCO — Simboluri', color: '#cc8800',
      items: [['d▶','Conducere (auto)'],['a','Altă muncă'],['b','Odihnă'],['c','Disponibilitate'],['!','Eveniment'],['x','Defect echipament']] },
    { title: 'Erori frecvente', color: T.red,
      items: [['E001','Fără card'],['E003','Sesiune neînchisă'],['E006','Fără hârtie'],['E008','Chip murdar'],['E009','Vit >90 km/h'],['E010','Pauză obligatorie'],['E011','Cond. zilnică 9h'],['E012','Cond. săpt. 56h']] },
    { title: 'Descărcări și termene', color: T.purple,
      items: [['28 zile','Card'],['90 zile','VU vehicul'],['OPTAC','Tool Stoneridge'],['DLK PRO','Tool VDO'],['.DDD','Format date'],['365 zile','Retenție min.']] },
  ]
  return (
    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
      {sections.map(sec => (
        <div key={sec.title} style={card({ padding: '14px 16px' })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: sec.color, marginBottom: 10, letterSpacing: -0.1 }}>{sec.title}</div>
          {sec.items.map(([sym, desc]) => (
            <div key={sym} style={{ display: 'flex', gap: 10, fontSize: 11, marginBottom: 5, alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', color: sec.color, fontWeight: 700, minWidth: 40, flexShrink: 0 }}>{sym}</span>
              <span style={{ color: T.textTertiary }}>{desc}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
const MODELS = [
  { id: 'se',      label: 'Stoneridge SE5000', sub: 'Exakt Duo2  Rev.7.6',    accent: '#00e87a' },
  { id: 'vdo1381', label: 'VDO DTCO 1381',     sub: 'Continental  Gen.1',      accent: '#cc8800' },
  { id: 'vdo3',    label: 'VDO DTCO 3.0',      sub: 'Smart Tachograph Gen.2', accent: '#f5a623' },
]

export default function SimuladorPage() {
  const [brand, setBrand] = useState('se')
  const [s, dispatch] = useReducer(reducer, null, init)
  const timerRef = useRef(null)
  const dlRef    = useRef(null)
  const bootRef  = useRef(null)

  // Boot — also re-runs after RESET (tab switch)
  useEffect(() => {
    if (s.boot > 0) {
      const delay = s.boot === 2 ? 900 : 1200
      bootRef.current = setTimeout(() => dispatch({ type: 'BOOT_STEP' }), delay)
    }
    return () => clearTimeout(bootRef.current)
  }, [s.boot])

  // Reloj (20s = 1 min simulado)
  useEffect(() => { timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 20000); return () => clearInterval(timerRef.current) }, [])

  // Descarga
  useEffect(() => {
    if (s.screen === 'download' && s.downloading !== null && s.downloading < 100) { dlRef.current = setTimeout(() => dispatch({ type: 'DL_TICK' }), 320) }
    return () => clearTimeout(dlRef.current)
  }, [s.screen, s.downloading])

  useEffect(() => { if (s.speed === 0) dispatch({ type: 'DISMISS_MOV' }) }, [s.speed])

  // Auto-close dl_done screen after 2s
  useEffect(() => {
    if (s.screen === 'dl_done') {
      const t = setTimeout(() => dispatch({ type: 'CANCEL' }), 2000)
      return () => clearTimeout(t)
    }
  }, [s.screen])

  // Teclado
  useEffect(() => {
    const brd = brand === 'se' ? 'se' : 'vdo'
    const h = e => {
      if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === 'ArrowUp')   { e.preventDefault(); dispatch({ type: 'UP',     brand: brd }) }
      if (e.key === 'ArrowDown') { e.preventDefault(); dispatch({ type: 'DOWN',   brand: brd }) }
      if (e.key === 'Enter')     { e.preventDefault(); dispatch({ type: 'ENTER',  brand: brd }) }
      if (e.key === 'Escape')    { e.preventDefault(); dispatch({ type: 'CANCEL'            }) }
      if (e.key === 'i')         dispatch({ type: 'INSERT', slot: 1, card: DEMO_CARD })
      if (e.key === 'e')         dispatch({ type: 'EJECT',  slot: 1 })
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [brand])

  const activModel = MODELS.find(m => m.id === brand)
  const vdoModel   = brand === 'vdo3' ? '3.0' : '1381'
  const isSE       = brand === 'se'

  return (
    <div style={{ color: T.textPrimary, fontFamily: T.fontBase }}>

      {/* ── Model selector toolbar ───────────────────────────────────────── */}
      <div style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderSubtle}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', padding: '8px 0' }}>
          {/* Model tabs */}
          <div style={{ display: 'flex', gap: 2, background: T.bgElev, borderRadius: T.rMd, padding: 4, border: `1px solid ${T.borderLight}` }}>
            {MODELS.map(m => {
              const active = brand === m.id
              return (
                <button key={m.id} onClick={() => { setBrand(m.id); dispatch({ type: 'RESET' }) }}
                  style={{
                    padding: '6px 16px', borderRadius: T.rSm, cursor: 'pointer', border: 'none', fontFamily: T.fontBase,
                    background: active ? T.bgRaised : 'transparent',
                    boxShadow: active ? `0 0 0 1px ${m.accent}33, inset 0 1px 0 rgba(255,255,255,0.04)` : 'none',
                    transition: 'all 0.18s',
                  }}
                  onMouseOver={e => { if (!active) e.currentTarget.style.background = T.bgHover }}
                  onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? m.accent : T.textSecondary, transition: 'color 0.18s', letterSpacing: -0.1 }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: active ? T.textTertiary : T.textMuted, marginTop: 1 }}>{m.sub}</div>
                </button>
              )
            })}
          </div>

          {/* Atajos teclado */}
          <div className="tacho-keys" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {[['↑↓','navigare'],['Enter','confirmare'],['Esc','anulare'],['I','inserare'],['E','extragere']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <kbd style={{ fontSize: 9, padding: '2px 5px', background: T.bgElev, border: `1px solid ${T.borderMed}`, borderRadius: 4, color: T.textSecondary, fontFamily: 'monospace' }}>{k}</kbd>
                <span style={{ fontSize: 9, color: T.textMuted }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px' }}>

        {/* Indicador modelo activo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: activModel.accent, boxShadow: `0 0 8px ${activModel.accent}` }} />
          <span style={{ fontSize: 12, color: T.textSecondary }}>{activModel.label}</span>
          <span style={{ fontSize: 11, color: T.textTertiary }}>·</span>
          <span style={{ fontSize: 11, color: T.textTertiary }}>{activModel.sub}</span>
          {s.card1 && <><span style={{ fontSize: 11, color: T.textTertiary }}>·</span><span style={{ fontSize: 11, color: T.green }}>● {s.card1.name}</span></>}
          {s.errors.filter(e => e !== 'E_MOV').length > 0 && <><span style={{ fontSize: 11, color: T.textTertiary }}>·</span><span style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>⚠ {s.errors.filter(e => e !== 'E_MOV').length} {s.errors.filter(e => e !== 'E_MOV').length > 1 ? 'erori' : 'eroare'}</span></>}
        </div>

        {/* Layout: dispositivo | paneles */}
        <div className="tacho-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 560px) 1fr', gap: 24, alignItems: 'start' }}>

          {/* Columna izquierda — el hardware es el héroe */}
          <div className="tacho-sticky" style={{ position: 'sticky', top: 24 }}>
            {isSE
              ? <SE5000 s={s} dispatch={dispatch} />
              : <DTCO s={s} dispatch={dispatch} model={vdoModel} />
            }
            <PrintTicket s={s} brand={isSE ? 'se' : 'vdo'} dispatch={dispatch} />

            {/* Atajos visibles bajo el dispositivo */}
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[['↑↓','navigare'],['Enter','confirmare'],['Esc','anulare'],['I','inserare card'],['E','extragere card']].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: T.bgSurface, borderRadius: T.rSm, border: `1px solid ${T.borderSubtle}` }}>
                  <kbd style={{ fontSize: 9, color: T.textSecondary, fontFamily: 'monospace', fontWeight: 700 }}>{k}</kbd>
                  <span style={{ fontSize: 9, color: T.textMuted }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha — paneles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GuidePanel s={s} />
            <TimesPanel s={s} dispatch={dispatch} />
            <TimelinePanel s={s} />
            <ControlPanel s={s} dispatch={dispatch} />
            <ScenariosPanel s={s} dispatch={dispatch} />
          </div>
        </div>

        <QuickRef />

      </div>

      <div style={{ borderTop: `1px solid ${T.borderSubtle}`, padding: '16px 24px', textAlign: 'center', marginTop: 40 }}>
        <div style={{ color: T.textMuted, fontSize: 9, letterSpacing: 0.3 }}>
          Doar pentru instruire · Nu înlocuiește tahograful real · Bazat pe manualele SE5000 Exakt Duo2 Rev.7.6 și VDO DTCO 1381/3.0 · EU Reg. 165/2014 · 561/2006 + 2020/1054
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        * { box-sizing: border-box; }
        input[type=range] { height: 4px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${T.bgBase}; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.28); }
        @media(max-width:900px){.tacho-grid{grid-template-columns:1fr!important}}
        @media(max-width:900px){.tacho-sticky{position:static!important}}
        @media(max-width:768px){.tacho-keys{display:none!important}}
      `}</style>
    </div>
  )
}
