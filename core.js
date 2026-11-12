/* ===== Comunia · núcleo: utilidades, estado, persistencia, dominio ===== */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const NUM = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const eur = n => EUR.format(+n || 0);
const r2 = n => Math.round((+n || 0) * 100) / 100;
const todayISO = () => new Date().toISOString().slice(0, 10);
const fdate = d => d ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fdt = d => d ? new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const perLabel = p => { const [y, m] = p.split('-'); return MES[+m - 1] + ' ' + y; };
const perLong = p => { const [y, m] = p.split('-'); return MESL[+m - 1] + ' de ' + y; };
const addMonths = (p, n) => { const [y, m] = p.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const curPeriod = () => todayISO().slice(0, 7);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/* ---------- Validaciones ---------- */
function ibanValid(iban) {
  const s = String(iban || '').replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  if (s.startsWith('ES') && s.length !== 24) return false;
  const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => c.charCodeAt(0) - 55);
  let m = 0; for (const ch of r) m = (m * 10 + +ch) % 97;
  return m === 1;
}
const ibanFmt = s => String(s || '').replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();
function nifValid(v) {
  const s = String(v || '').toUpperCase().replace(/[\s-]/g, '');
  const L = 'TRWAGMYFPDXBNJZSQVHLCKE';
  if (/^\d{8}[A-Z]$/.test(s)) return L[+s.slice(0, 8) % 23] === s[8];
  if (/^[XYZ]\d{7}[A-Z]$/.test(s)) return L[+(('XYZ'.indexOf(s[0])) + s.slice(1, 8)) % 23] === s[8];
  if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(s)) return true; // CIF (formato)
  return false;
}
// Identificador de acreedor SEPA (AT-02): ES + dígitos control + sufijo + NIF
function sepaCreditorId(nif, suf = '000') {
  const n = String(nif || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const conv = (n + 'ES00').replace(/[A-Z]/g, c => c.charCodeAt(0) - 55);
  let m = 0; for (const ch of conv) m = (m * 10 + +ch) % 97;
  return 'ES' + String(98 - m).padStart(2, '0') + suf + n;
}

/* ---------- Estado ---------- */
const COLLS = ['comunidades', 'unidades', 'recibos', 'movimientos', 'presupuestos', 'derramas', 'incidencias', 'proveedores', 'zonas', 'reservas', 'juntas', 'comunicados', 'documentos', 'actividad', 'remesas'];
let S = null; // estado
const UI = { route: 'panel', comId: null, role: 'admin', vecinoUnit: null, filters: {}, theme: 'light' };
const dirty = new Set();
function emptyState() {
  const s = { meta: { org: 'Mi gestoría', plan: 'gestoria', creado: new Date().toISOString(), iaUsada: 0 } };
  COLLS.forEach(k => s[k] = []);
  return s;
}
function touch(...keys) { keys.forEach(k => dirty.add(k)); Persist.schedule(); }
function log(txt, comId = UI.comId) { S.actividad.unshift({ id: uid('a'), f: new Date().toISOString(), txt, comId }); if (S.actividad.length > 300) S.actividad.length = 300; touch('actividad'); }

/* ---------- Persistencia (db de la página, en trozos; respaldo local) ---------- */
const Persist = {
  db: null, mode: 'local', timer: null, saving: false, again: false, manifest: { chunks: {} },
  async init() {
    try {
      const use = window.claude && window.claude.use;
      if (use) {
        const db = await Promise.race([window.claude.use('db'), new Promise(r => setTimeout(() => r(null), 10000))]);
        if (db) { this.db = db; this.mode = 'db'; }
      }
    } catch (e) { this.db = null; }
    let data = null;
    if (this.db) { try { data = await this.loadDb(); } catch (e) { console.warn('db load', e); this.mode = 'local'; this.db = null; } }
    if (!data) data = this.loadLocal();
    return data;
  },
  async loadDb() {
    const m = await this.db.doc('store/manifest').get();
    if (!m.exists) return null;
    this.manifest = JSON.parse(JSON.stringify(m.data()));
    const s = emptyState(); s.meta = this.manifest.meta || s.meta;
    for (const k of COLLS) {
      const n = (this.manifest.chunks || {})[k] || 0; let arr = [];
      for (let i = 0; i < n; i++) { const d = await this.db.doc('store/' + k + '~' + i).get(); if (d.exists) arr = arr.concat(d.data().items || []); }
      s[k] = JSON.parse(JSON.stringify(arr));
    }
    return s;
  },
  loadLocal() { try { const t = localStorage.getItem('comunia.v1'); return t ? JSON.parse(t) : null; } catch (e) { return null; } },
  saveLocal() { try { localStorage.setItem('comunia.v1', JSON.stringify(S)); } catch (e) { } },
  schedule() { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 900); setSync('pending'); },
  async flush() {
    if (this.saving) { this.again = true; return; }
    this.saving = true; this.saveLocal();
    if (this.db) {
      const keys = [...dirty]; dirty.clear();
      try {
        for (const k of keys) {
          if (!COLLS.includes(k)) continue;
          const chunks = chunkItems(S[k], 180000);
          for (let i = 0; i < chunks.length; i++) await this.db.doc('store/' + k + '~' + i).set({ items: chunks[i] });
          const old = this.manifest.chunks[k] || 0;
          for (let i = chunks.length; i < old; i++) await this.db.doc('store/' + k + '~' + i).delete();
          this.manifest.chunks[k] = chunks.length;
        }
        this.manifest.meta = S.meta;
        await this.db.doc('store/manifest').set(this.manifest);
        setSync('ok');
      } catch (e) {
        console.warn('db save', e); keysBack(keys);
        if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) { this.db = null; this.mode = 'local'; toast('Sin permiso para guardar en la nube: los cambios se guardan solo en este navegador.'); }
        else if (e && e.code === 'quota_exceeded') toast('Se ha llenado el almacenamiento. Elimina documentos adjuntos grandes.');
        setSync(this.db ? 'err' : 'local');
      }
    } else setSync('local');
    this.saving = false;
    if (this.again) { this.again = false; this.flush(); }
  },
  async saveAll() { COLLS.forEach(k => dirty.add(k)); await this.flush(); }
};
function keysBack(keys) { keys.forEach(k => dirty.add(k)); }
function chunkItems(arr, max) {
  const out = []; let cur = [], size = 2;
  for (const it of arr) { const l = JSON.stringify(it).length + 1; if (size + l > max && cur.length) { out.push(cur); cur = []; size = 2; } cur.push(it); size += l; }
  if (cur.length || !out.length) out.push(cur);
  return out;
}
function setSync(st) {
  if (st) Persist.state = st; else st = Persist.state || 'ok';
  const el = $('#sync'); if (!el) return;
  const local = Persist.mode !== 'db';
  el.className = 'sync' + (local ? ' local' : '');
  el.innerHTML = '<i></i>' + (st === 'pending' ? 'Guardando…' : st === 'err' ? 'Error al guardar, reintentando' : local ? 'Guardado en este navegador' : 'Guardado en la nube');
  if (st === 'err') setTimeout(() => Persist.flush(), 4000);
}

/* ---------- Planes (freemium) ---------- */
const PLANS = {
  gratis: { nombre: 'Gratis', precio: '0 €', per: 'para siempre', maxCom: 1, maxUni: 20, feats: ['panel', 'unidades', 'recibos', 'banco', 'incidencias', 'comunicados', 'ajustes', 'portal'] },
  comunidad: { nombre: 'Comunidad', precio: '14,90 €', per: '/mes por comunidad', maxCom: 1, maxUni: 200, feats: ['panel', 'unidades', 'recibos', 'remesas', 'banco', 'presupuestos', 'morosidad', 'derramas', 'incidencias', 'reservas', 'juntas', 'comunicados', 'documentos', 'informes', 'ajustes', 'portal'] },
  gestoria: { nombre: 'Gestoría Pro', precio: '89 €', per: '/mes · hasta 40 comunidades', maxCom: 40, maxUni: 99999, feats: '*' }
};
const FEAT_PLAN = f => { for (const p of ['gratis', 'comunidad', 'gestoria']) { const fs = PLANS[p].feats; if (fs === '*' || fs.includes(f)) return p; } return 'gestoria'; };
const hasFeat = f => { const fs = PLANS[S.meta.plan].feats; return fs === '*' || fs.includes(f); };

/* ---------- Selectores de dominio ---------- */
const com = () => S.comunidades.find(c => c.id === UI.comId) || S.comunidades[0];
const unitsOf = cid => S.unidades.filter(u => u.comId === cid).sort((a, b) => a.orden - b.orden || a.ref.localeCompare(b.ref, 'es', { numeric: true }));
const unit = id => S.unidades.find(u => u.id === id);
const prov = id => S.proveedores.find(p => p.id === id);
const recOf = cid => S.recibos.filter(r => r.comId === cid);
const movOf = cid => S.movimientos.filter(m => m.comId === cid).sort((a, b) => b.fecha.localeCompare(a.fecha));
const saldo = cid => { const c = S.comunidades.find(x => x.id === cid); return r2((c?.saldoInicial || 0) + S.movimientos.filter(m => m.comId === cid).reduce((s, m) => s + m.importe, 0)); };
const deudaUnit = uidv => r2(S.recibos.filter(r => r.unidadId === uidv && r.estado !== 'cobrado' && r.vencimiento < todayISO()).reduce((s, r) => s + r.importe, 0));
const pendUnit = uidv => r2(S.recibos.filter(r => r.unidadId === uidv && r.estado !== 'cobrado').reduce((s, r) => s + r.importe, 0));
const cuotaMensual = u => { const c = S.comunidades.find(x => x.id === u.comId); return r2((c.presupuestoAnual || 0) * (u.coef / 100) / 12); };
const coefSum = cid => r2(unitsOf(cid).reduce((s, u) => s + (+u.coef || 0), 0));
const CATS_GASTO = ['Limpieza', 'Mantenimiento ascensor', 'Electricidad', 'Agua', 'Seguro', 'Administración', 'Jardinería', 'Reparaciones', 'Conserjería', 'Gastos bancarios', 'Otros'];
const CATS_ING = ['Cuotas ordinarias', 'Derramas', 'Alquiler zonas comunes', 'Otros ingresos'];
const ESTADO_REC = { pendiente: ['Pendiente', 'b-warn'], cobrado: ['Cobrado', 'b-good'], devuelto: ['Devuelto', 'b-bad'], remesado: ['En remesa', 'b-info'] };
const ESTADO_INC = { abierta: ['Abierta', 'b-bad'], en_curso: ['En curso', 'b-warn'], presupuesto: ['Presupuesto', 'b-info'], resuelta: ['Resuelta', 'b-good'] };
const PRIO = { baja: ['Baja', 'b-neutral'], media: ['Media', 'b-info'], alta: ['Alta', 'b-warn'], urgente: ['Urgente', 'b-bad'] };
const badge = (map, k) => { const v = map[k] || [k, 'b-neutral']; return `<span class="badge ${v[1]}">${esc(v[0])}</span>`; };

/* ---------- Operaciones de dominio ---------- */
function emitirCuotas(cid, periodo) {
  const c = S.comunidades.find(x => x.id === cid); let n = 0, tot = 0;
  const venc = periodo + '-' + String(c.diaVencimiento || 5).padStart(2, '0');
  for (const u of unitsOf(cid)) {
    if (S.recibos.some(r => r.unidadId === u.id && r.periodo === periodo && r.tipo === 'ordinaria')) continue;
    const imp = cuotaMensual(u); if (imp <= 0) continue;
    S.recibos.push({ id: uid('r'), comId: cid, unidadId: u.id, tipo: 'ordinaria', concepto: 'Cuota ordinaria ' + perLabel(periodo), periodo, importe: imp, emision: todayISO(), vencimiento: venc, estado: 'pendiente', numero: nextReciboNum(cid) });
    n++; tot += imp;
  }
  touch('recibos'); if (n) log(`Emitidos ${n} recibos de ${perLabel(periodo)} (${eur(tot)})`, cid);
  return { n, tot: r2(tot) };
}
function nextReciboNum(cid) { const y = new Date().getFullYear(); const n = S.recibos.filter(r => r.comId === cid && String(r.numero || '').startsWith(y + '/')).length + 1; return y + '/' + String(n).padStart(5, '0'); }
function cobrarRecibo(r, fecha = todayISO(), viaRemesa = false) {
  if (r.estado === 'cobrado') return;
  r.estado = 'cobrado'; r.fechaCobro = fecha;
  if (!viaRemesa) {
    const u = unit(r.unidadId);
    S.movimientos.push({ id: uid('m'), comId: r.comId, fecha, concepto: `Cobro ${r.concepto} · ${u?.ref || ''}`, importe: r.importe, categoria: r.tipo === 'derrama' ? 'Derramas' : 'Cuotas ordinarias', conciliado: true, reciboId: r.id });
    touch('movimientos');
  }
  touch('recibos');
}
function devolverRecibo(r, gastos = 0) {
  const u = unit(r.unidadId); const was = r.estado;
  r.estado = 'devuelto'; r.devuelto = todayISO();
  if (was === 'cobrado') S.movimientos.push({ id: uid('m'), comId: r.comId, fecha: todayISO(), concepto: `Devolución ${r.concepto} · ${u?.ref || ''}`, importe: -r.importe, categoria: r.tipo === 'derrama' ? 'Derramas' : 'Cuotas ordinarias', conciliado: true, reciboId: r.id });
  if (gastos > 0) S.movimientos.push({ id: uid('m'), comId: r.comId, fecha: todayISO(), concepto: `Comisión devolución · ${u?.ref || ''}`, importe: -gastos, categoria: 'Gastos bancarios', conciliado: true });
  touch('recibos', 'movimientos'); log(`Recibo ${r.numero || ''} de ${u?.ref || ''} devuelto`, r.comId);
}
function crearRemesa(cid, recIds, fechaCargo) {
  const recs = S.recibos.filter(r => recIds.includes(r.id));
  const rem = { id: uid('rm'), comId: cid, fecha: todayISO(), fechaCargo, recibos: recIds, total: r2(recs.reduce((s, r) => s + r.importe, 0)), estado: 'generada', ref: 'REM-' + todayISO().replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 5).toUpperCase() };
  recs.forEach(r => { r.estado = 'remesado'; r.remesaId = rem.id; });
  S.remesas.unshift(rem); touch('remesas', 'recibos'); log(`Remesa ${rem.ref} generada: ${recs.length} recibos, ${eur(rem.total)}`, cid);
  return rem;
}
function cobrarRemesa(rem) {
  const recs = S.recibos.filter(r => rem.recibos.includes(r.id) && r.estado === 'remesado');
  recs.forEach(r => cobrarRecibo(r, rem.fechaCargo, true));
  S.movimientos.push({ id: uid('m'), comId: rem.comId, fecha: rem.fechaCargo, concepto: `Abono remesa SEPA ${rem.ref} (${recs.length} recibos)`, importe: r2(recs.reduce((s, r) => s + r.importe, 0)), categoria: 'Cuotas ordinarias', conciliado: true, remesaId: rem.id });
  rem.estado = 'cobrada'; touch('remesas', 'movimientos', 'recibos'); log(`Remesa ${rem.ref} abonada en cuenta`, rem.comId);
}
function sepaXML(rem) {
  const c = S.comunidades.find(x => x.id === rem.comId);
  const recs = S.recibos.filter(r => rem.recibos.includes(r.id));
  const x = s => esc(String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 70));
  const now = new Date().toISOString().slice(0, 19);
  const ci = sepaCreditorId(c.cif);
  const tx = recs.map(r => { const u = unit(r.unidadId); const p = u.propietario || {};
    return `      <DrctDbtTxInf>
        <PmtId><EndToEndId>${x(r.numero || r.id)}</EndToEndId></PmtId>
        <InstdAmt Ccy="EUR">${r.importe.toFixed(2)}</InstdAmt>
        <DrctDbtTx><MndtRltdInf><MndtId>${x(p.mandato || ('MND-' + u.id))}</MndtId><DtOfSgntr>${p.fechaMandato || '2020-01-01'}</DtOfSgntr></MndtRltdInf></DrctDbtTx>
        <DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt>
        <Dbtr><Nm>${x(p.nombre || u.ref)}</Nm></Dbtr>
        <DbtrAcct><Id><IBAN>${String(p.iban || '').replace(/\s/g, '')}</IBAN></Id></DbtrAcct>
        <RmtInf><Ustrd>${x(r.concepto + ' ' + u.ref)}</Ustrd></RmtInf>
      </DrctDbtTxInf>`; }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrDrctDbtInitn>
    <GrpHdr><MsgId>${x(rem.ref)}</MsgId><CreDtTm>${now}</CreDtTm><NbOfTxs>${recs.length}</NbOfTxs><CtrlSum>${rem.total.toFixed(2)}</CtrlSum><InitgPty><Nm>${x(c.nombre)}</Nm><Id><OrgId><Othr><Id>${ci}</Id></Othr></OrgId></Id></InitgPty></GrpHdr>
    <PmtInf>
      <PmtInfId>${x(rem.ref)}-1</PmtInfId><PmtMtd>DD</PmtMtd><BtchBookg>true</BtchBookg><NbOfTxs>${recs.length}</NbOfTxs><CtrlSum>${rem.total.toFixed(2)}</CtrlSum>
      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl><LclInstrm><Cd>CORE</Cd></LclInstrm><SeqTp>RCUR</SeqTp></PmtTpInf>
      <ReqdColltnDt>${rem.fechaCargo}</ReqdColltnDt>
      <Cdtr><Nm>${x(c.nombre)}</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>${String(c.iban || '').replace(/\s/g, '')}</IBAN></Id></CdtrAcct>
      <CdtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></CdtrAgt>
      <ChrgBr>SLEV</ChrgBr>
      <CdtrSchmeId><Id><PrvtId><Othr><Id>${ci}</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id></CdtrSchmeId>
${tx}
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;
}
function crearDerrama(d) {
  const us = unitsOf(d.comId); const nU = us.length;
  for (let i = 0; i < d.plazos; i++) {
    const per = addMonths(d.inicio, i);
    for (const u of us) {
      const parte = d.reparto === 'igual' ? d.total / nU : d.total * (u.coef / 100);
      S.recibos.push({ id: uid('r'), comId: d.comId, unidadId: u.id, tipo: 'derrama', derramaId: d.id, concepto: `Derrama ${d.concepto} (${i + 1}/${d.plazos})`, periodo: per, importe: r2(parte / d.plazos), emision: todayISO(), vencimiento: per + '-10', estado: 'pendiente', numero: nextReciboNum(d.comId) });
    }
  }
  S.derramas.unshift(d); touch('derramas', 'recibos'); log(`Derrama "${d.concepto}" aprobada: ${eur(d.total)} en ${d.plazos} plazos`, d.comId);
}
function morosos(cid) {
  const hoy = todayISO(); const map = {};
  for (const r of recOf(cid)) {
    if (r.estado === 'cobrado' || r.vencimiento >= hoy) continue;
    const m = map[r.unidadId] ||= { unidadId: r.unidadId, total: 0, n: 0, masAntiguo: r.vencimiento, tramos: [0, 0, 0, 0] };
    m.total += r.importe; m.n++; if (r.vencimiento < m.masAntiguo) m.masAntiguo = r.vencimiento;
    const d = daysBetween(r.vencimiento, hoy); m.tramos[d <= 30 ? 0 : d <= 90 ? 1 : d <= 180 ? 2 : 3] += r.importe;
  }
  return Object.values(map).map(m => ({ ...m, total: r2(m.total) })).sort((a, b) => b.total - a.total);
}
function serieMensual(cid, n = 6) {
  const out = []; const p0 = curPeriod();
  for (let i = n - 1; i >= 0; i--) {
    const p = addMonths(p0, -i); const ms = S.movimientos.filter(m => m.comId === cid && m.fecha.startsWith(p));
    out.push({ p, ing: r2(ms.filter(m => m.importe > 0).reduce((s, m) => s + m.importe, 0)), gas: r2(-ms.filter(m => m.importe < 0).reduce((s, m) => s + m.importe, 0)) });
  }
  return out;
}
function tasaCobro(cid, meses = 6) {
  const desde = addMonths(curPeriod(), -meses + 1); const hoy = todayISO();
  const rs = recOf(cid).filter(r => r.periodo >= desde && r.vencimiento < hoy);
  const tot = rs.reduce((s, r) => s + r.importe, 0); const cob = rs.filter(r => r.estado === 'cobrado').reduce((s, r) => s + r.importe, 0);
  return tot ? cob / tot : 1;
}
// Votación LPH: doble mayoría (propietarios y cuotas de participación)
function resultadoVoto(junta, punto) {
  const us = unitsOf(junta.comId); const v = punto.votos || {};
  const agg = { si: { n: 0, c: 0 }, no: { n: 0, c: 0 }, abst: { n: 0, c: 0 } };
  for (const [uidv, val] of Object.entries(v)) { const u = us.find(x => x.id === uidv); if (!u || !agg[val]) continue; agg[val].n++; agg[val].c += +u.coef; }
  const presentes = agg.si.n + agg.no.n + agg.abst.n;
  const tipo = punto.mayoria || 'simple';
  let aprobado;
  if (tipo === 'simple') aprobado = agg.si.n > agg.no.n && agg.si.c > agg.no.c;
  else if (tipo === 'tres_quintos') aprobado = agg.si.n >= us.length * 0.6 && agg.si.c >= 60;
  else if (tipo === 'tercio') aprobado = agg.si.n >= us.length / 3 && agg.si.c >= 33.34;
  else aprobado = agg.si.n === us.length; // unanimidad
  return { agg, presentes, total: us.length, aprobado, tipo };
}
const MAYORIAS = { simple: 'Mayoría simple de presentes (art. 17.7 LPH)', tercio: 'Un tercio de propietarios y cuotas (art. 17.1 LPH)', tres_quintos: 'Tres quintas partes (art. 17.3 LPH)', unanimidad: 'Unanimidad (art. 17.6 LPH)' };

/* ---------- Datos de demostración ---------- */
function demoData() {
  const s = emptyState(); s.meta.org = 'Fincas Horizonte, S.L.';
  const rnd = (a, b) => a + Math.random() * (b - a); const pick = a => a[Math.floor(Math.random() * a.length)];
  const NOM = ['María García López', 'José Martínez Ruiz', 'Carmen Sánchez Díaz', 'Antonio Fernández Gil', 'Lucía Romero Ortega', 'Javier Navarro Molina', 'Elena Torres Castro', 'Manuel Ramos Vega', 'Isabel Jiménez Rubio', 'Francisco Moreno Serrano', 'Laura Álvarez Blanco', 'David Muñoz Herrero', 'Pilar Domínguez Prieto', 'Sergio Gutiérrez Cano', 'Ana Iglesias Marín', 'Pablo Santos Núñez', 'Rosa Castillo León', 'Alberto Garrido Peña', 'Marta Ortiz Calvo', 'Raúl Delgado Vidal', 'Cristina Rubio Lozano', 'Fernando Cabrera Mora', 'Silvia Pastor Rey', 'Miguel Ángel Herrera', 'Beatriz Fuentes Arias', 'Rubén Carmona Soler', 'Nuria Vicente Bravo', 'Óscar Méndez Pardo', 'Patricia Aguilar Gallego', 'Daniel Campos Ibáñez', 'Teresa Nieto Reyes', 'Hugo Benítez Rojas', 'Alicia Crespo Montero', 'Iván Sáez Velasco', 'Sara Medina Hidalgo', 'Jorge Lorenzo Vargas', 'Inmaculada Cruz Esteban', 'Adrián Parra Soto', 'Noelia Rivas Guerrero', 'Guillermo Pascual Luque'];
  let ni = 0; const nextNom = () => NOM[(ni++) % NOM.length];
  const mkIban = () => { let b = 'ES00' + Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join(''); const r = (b.slice(4) + '142800').replace(/[A-Z]/g, c => c.charCodeAt(0) - 55); let m = 0; for (const ch of r) m = (m * 10 + +ch) % 97; return 'ES' + String(98 - m).padStart(2, '0') + b.slice(4); };
  const mkDni = () => { const n = Math.floor(rnd(10000000, 79999999)); return n + 'TRWAGMYFPDXBNJZSQVHLCKE'[n % 23]; };
  const defs = [
    { nombre: 'C.P. Residencial Los Almendros', cif: 'H87654321', direccion: 'Calle de los Almendros, 14', cp: '28032', ciudad: 'Madrid', plantas: 6, pp: 4, locales: 2, garajes: 12, pres: 62000, ascensor: true, piscina: true },
    { nombre: 'C.P. Calle Alcalá 245', cif: 'H81234567', direccion: 'Calle de Alcalá, 245', cp: '28028', ciudad: 'Madrid', plantas: 5, pp: 2, locales: 1, garajes: 0, pres: 21500, ascensor: true, piscina: false },
    { nombre: 'Mancomunidad Parque Sur', cif: 'H86543219', direccion: 'Av. del Parque Sur, 3-7', cp: '28030', ciudad: 'Madrid', plantas: 4, pp: 6, locales: 0, garajes: 20, pres: 88000, ascensor: true, piscina: true }
  ];
  const P0 = curPeriod();
  const provs = [
    ['Ascensores Meridiano', 'Ascensores', 4.6], ['Limpiezas Brillo, S.L.', 'Limpieza', 4.2], ['Fontanería Castellana', 'Fontanería', 4.8], ['Electricidad Volta', 'Electricidad', 4.4], ['Jardines del Sur', 'Jardinería', 3.9], ['Seguros Atalaya', 'Seguros', 4.1], ['Cerrajería Rápida 24h', 'Cerrajería', 4.7], ['Piscinas Aqua Clara', 'Piscinas', 4.3]
  ].map(([n, sv, v]) => ({ id: uid('p'), nombre: n, servicio: sv, valoracion: v, tel: '91 ' + Math.floor(rnd(300, 799)) + ' ' + Math.floor(rnd(10, 99)) + ' ' + Math.floor(rnd(10, 99)), email: n.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) + '@ejemplo.es', cif: 'B' + Math.floor(rnd(10000000, 99999999)), contrato: pick(['Mantenimiento anual', 'Bajo demanda', 'Contrato trimestral']), notas: '' }));
  s.proveedores = provs;
  defs.forEach((d, ci) => {
    const c = { id: uid('c'), nombre: d.nombre, cif: d.cif, direccion: d.direccion, cp: d.cp, ciudad: d.ciudad, iban: mkIban(), banco: pick(['CaixaBank', 'BBVA', 'Banco Santander', 'Bankinter']), saldoInicial: r2(rnd(8000, 30000)), presupuestoAnual: d.pres, fondoReserva: 10, diaVencimiento: 5, presidente: null, creada: '2024-01-15', notas: '' };
    s.comunidades.push(c);
    const us = []; let orden = 0;
    for (let p = 1; p <= d.plantas; p++) for (let l = 0; l < d.pp; l++) us.push({ ref: `${p}º ${'ABCDEF'[l]}`, tipo: 'vivienda', m2: Math.round(rnd(65, 120)) });
    for (let l = 1; l <= d.locales; l++) us.push({ ref: `Local ${l}`, tipo: 'local', m2: Math.round(rnd(80, 160)) });
    for (let g = 1; g <= d.garajes; g++) us.push({ ref: `Garaje ${g}`, tipo: 'garaje', m2: 12 });
    const tm2 = us.reduce((s2, u) => s2 + u.m2, 0);
    let acc = 0;
    us.forEach((u, i) => {
      let coef = r2(u.m2 / tm2 * 100); if (i === us.length - 1) coef = r2(100 - acc); acc = r2(acc + coef);
      const nom = u.tipo === 'garaje' && Math.random() < .6 && us[i % (d.plantas * d.pp)] ? null : nextNom();
      const full = { id: uid('u'), comId: c.id, orden: orden++, ref: u.ref, tipo: u.tipo, m2: u.m2, coef, propietario: { nombre: nom || NOM[(i * 7) % NOM.length], dni: mkDni(), email: '', tel: '6' + Math.floor(rnd(10000000, 99999999)), iban: mkIban(), mandato: 'MND-' + c.cif + '-' + String(i + 1).padStart(4, '0'), fechaMandato: '2023-0' + (1 + i % 9) + '-15', domiciliado: Math.random() > .12 }, inquilino: Math.random() < .18 ? { nombre: nextNom(), tel: '6' + Math.floor(rnd(10000000, 99999999)) } : null, notas: '' };
      full.propietario.email = full.propietario.nombre.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '.' + full.ref.replace(/\W/g, '').toLowerCase() + '@correo.es';
      s.unidades.push(full);
    });
    c.presidente = s.unidades.find(u => u.comId === c.id && u.tipo === 'vivienda').id;
    // recibos 6 meses
    const cus = s.unidades.filter(u => u.comId === c.id);
    const malos = new Set(cus.filter(() => Math.random() < .09).map(u => u.id));
    let num = 1;
    for (let k = 5; k >= 0; k--) {
      const per = addMonths(P0, -k); const venc = per + '-05'; let cobradoMes = 0;
      for (const u of cus) {
        const imp = r2(d.pres * u.coef / 100 / 12);
        let estado = 'cobrado';
        if (venc >= todayISO()) estado = 'pendiente';
        else if (malos.has(u.id) && Math.random() < .75) estado = Math.random() < .5 ? 'devuelto' : 'pendiente';
        else if (k === 0 && Math.random() < .25) estado = 'pendiente';
        const r = { id: uid('r'), comId: c.id, unidadId: u.id, tipo: 'ordinaria', concepto: 'Cuota ordinaria ' + perLabel(per), periodo: per, importe: imp, emision: per + '-01', vencimiento: venc, estado, numero: new Date().getFullYear() + '/' + String(num++).padStart(5, '0') };
        if (estado === 'cobrado') { r.fechaCobro = per + '-0' + Math.floor(rnd(5, 9)); cobradoMes += imp; }
        s.recibos.push(r);
      }
      if (cobradoMes) s.movimientos.push({ id: uid('m'), comId: c.id, fecha: per + '-07', concepto: `Abono remesa cuotas ${perLabel(per)}`, importe: r2(cobradoMes), categoria: 'Cuotas ordinarias', conciliado: true });
      const gastos = [['Limpieza', .16, 1], ['Mantenimiento ascensor', .08, 0], ['Electricidad', .09, 3], ['Agua', .05, 2], ['Administración', .08, null], ['Conserjería', .22, null]];
      if (d.piscina && [5, 6, 7, 8].includes(+per.slice(5))) gastos.push(['Jardinería', .05, 4]);
      for (const [cat, pct, pi] of gastos) s.movimientos.push({ id: uid('m'), comId: c.id, fecha: per + '-' + String(Math.floor(rnd(10, 27))).padStart(2, '0'), concepto: cat === 'Administración' ? 'Honorarios administración' : cat === 'Conserjería' ? 'Nómina y SS conserje' : `Factura ${cat.toLowerCase()} ${perLabel(per)}`, importe: -r2(d.pres * pct / 12 * rnd(.9, 1.1)), categoria: cat, conciliado: Math.random() > .1 || k > 0, proveedorId: pi != null ? provs[pi].id : null });
      if (Math.random() < .5) s.movimientos.push({ id: uid('m'), comId: c.id, fecha: per + '-18', concepto: pick(['Reparación bajante', 'Sustitución luminarias portal', 'Reparación portero automático', 'Desatasco arqueta']), importe: -r2(rnd(120, 900)), categoria: 'Reparaciones', conciliado: true, proveedorId: pick(provs).id });
    }
    s.movimientos.push({ id: uid('m'), comId: c.id, fecha: addMonths(P0, -4) + '-20', concepto: 'Prima anual seguro multirriesgo', importe: -r2(d.pres * .06), categoria: 'Seguro', conciliado: true, proveedorId: provs[5].id });
    // presupuesto
    const y = new Date().getFullYear();
    s.presupuestos.push({ id: uid('b'), comId: c.id, anio: y, partidas: [['Conserjería', .22], ['Limpieza', .16], ['Electricidad', .09], ['Mantenimiento ascensor', .08], ['Administración', .08], ['Seguro', .06], ['Agua', .05], ['Reparaciones', .1], ['Jardinería', .04], ['Gastos bancarios', .01], ['Fondo de reserva', .1], ['Otros', .01]].map(([cat, p]) => ({ cat, importe: r2(d.pres * p) })) });
    // zonas
    if (d.piscina) s.zonas.push({ id: uid('z'), comId: c.id, nombre: 'Pádel', franja: 90, horaIni: 9, horaFin: 22, precio: 0, fianza: 0, aforo: 4, normas: 'Máximo 2 reservas por vivienda y semana. Cancelar con 2 h de antelación.', activa: true });
    s.zonas.push({ id: uid('z'), comId: c.id, nombre: 'Sala comunitaria', franja: 120, horaIni: 10, horaFin: 22, precio: 25, fianza: 100, aforo: 30, normas: 'Dejar la sala limpia. Prohibido fumar. Horario de silencio a partir de las 22:00.', activa: true });
    if (d.piscina) s.zonas.push({ id: uid('z'), comId: c.id, nombre: 'Barbacoa', franja: 240, horaIni: 12, horaFin: 24, precio: 15, fianza: 50, aforo: 20, normas: 'Solo de abril a octubre. Apagar completamente las brasas.', activa: true });
    // incidencias
    const incs = [['Ascensor detenido entre plantas 3 y 4', 'Ascensores', 'urgente', 'en_curso', 0], ['Fuga de agua en garaje plaza 7', 'Fontanería', 'alta', 'abierta', 2], ['Bombilla fundida rellano 2º', 'Electricidad', 'baja', 'resuelta', 3], ['Puerta del portal no cierra bien', 'Cerrajería', 'media', 'presupuesto', 6], ['Humedad en fachada patio interior', 'Fontanería', 'media', 'abierta', null], ['Limpieza insuficiente en escalera B', 'Limpieza', 'baja', 'en_curso', 1]];
    incs.slice(0, ci === 1 ? 4 : 6).forEach(([t, z, pr, st, pi], j) => {
      const f = new Date(Date.now() - rnd(1, 25) * 864e5).toISOString();
      s.incidencias.push({ id: uid('i'), comId: c.id, numero: 'INC-' + (100 + j + ci * 10), titulo: t, desc: 'Comunicado por un vecino a través del portal. ' + (pr === 'urgente' ? 'Requiere atención inmediata.' : ''), zona: z, prioridad: pr, estado: st, unidadId: pick(cus).id, proveedorId: pi != null ? provs[pi].id : null, coste: st === 'presupuesto' ? 480 : st === 'resuelta' ? 35 : 0, fecha: f, historial: [{ f, t: 'Incidencia creada' }].concat(st !== 'abierta' ? [{ f: new Date(Date.parse(f) + 864e5).toISOString(), t: 'Estado: ' + ESTADO_INC[st][0] }] : []) });
    });
    // junta
    const jf = new Date(Date.now() + 12 * 864e5).toISOString().slice(0, 10);
    s.juntas.push({ id: uid('j'), comId: c.id, tipo: 'ordinaria', fecha: jf, hora: '19:00', hora2: '19:30', lugar: 'Sala comunitaria', estado: 'convocada', votacionOnline: true, orden: [
      { id: uid('o'), texto: 'Lectura y aprobación, si procede, del acta de la junta anterior.', mayoria: 'simple', votos: {} },
      { id: uid('o'), texto: 'Aprobación de las cuentas del ejercicio ' + (y - 1) + '.', mayoria: 'simple', votos: {} },
      { id: uid('o'), texto: 'Aprobación del presupuesto ordinario ' + y + ' y cuotas.', mayoria: 'simple', votos: {} },
      { id: uid('o'), texto: 'Instalación de puntos de recarga para vehículos eléctricos en el garaje.', mayoria: 'tercio', votos: {} },
      { id: uid('o'), texto: 'Ruegos y preguntas.', mayoria: null, votos: {} }], acta: '' });
    // votos de ejemplo
    s.juntas[s.juntas.length - 1].orden.slice(0, 4).forEach(o => cus.slice(0, Math.floor(cus.length * .45)).forEach(u => o.votos[u.id] = Math.random() < .78 ? 'si' : Math.random() < .5 ? 'no' : 'abst'));
    s.juntas.push({ id: uid('j'), comId: c.id, tipo: 'extraordinaria', fecha: addMonths(P0, -3) + '-12', hora: '19:00', hora2: '19:30', lugar: 'Sala comunitaria', estado: 'celebrada', votacionOnline: false, orden: [{ id: uid('o'), texto: 'Aprobación de derrama para rehabilitación de la cubierta.', mayoria: 'tres_quintos', votos: {} }], acta: 'Acta de la Junta General Extraordinaria celebrada en segunda convocatoria. Se aprueba por mayoría de tres quintos la derrama para la rehabilitación de la cubierta.' });
    // derrama
    if (ci !== 1) { const dd = { id: uid('d'), comId: c.id, concepto: 'Rehabilitación de cubierta', total: ci === 0 ? 18000 : 32000, plazos: 6, inicio: addMonths(P0, -2), reparto: 'coef', estado: 'activa', fecha: addMonths(P0, -3) + '-12' };
      for (let i = 0; i < dd.plazos; i++) { const per = addMonths(dd.inicio, i); for (const u of cus) { const venc = per + '-10'; const paid = venc < todayISO() && !malos.has(u.id); const r = { id: uid('r'), comId: c.id, unidadId: u.id, tipo: 'derrama', derramaId: dd.id, concepto: `Derrama ${dd.concepto} (${i + 1}/${dd.plazos})`, periodo: per, importe: r2(dd.total * u.coef / 100 / dd.plazos), emision: dd.fecha, vencimiento: venc, estado: paid ? 'cobrado' : 'pendiente', numero: new Date().getFullYear() + '/' + String(num++).padStart(5, '0') }; if (paid) r.fechaCobro = venc; s.recibos.push(r); }
        const cob = s.recibos.filter(r => r.derramaId === dd.id && r.periodo === per && r.estado === 'cobrado').reduce((a, r) => a + r.importe, 0); if (cob) s.movimientos.push({ id: uid('m'), comId: c.id, fecha: per + '-11', concepto: `Cobro derrama cubierta ${i + 1}/${dd.plazos}`, importe: r2(cob), categoria: 'Derramas', conciliado: true }); }
      s.derramas.push(dd); }
    // comunicados
    s.comunicados.push({ id: uid('n'), comId: c.id, titulo: 'Convocatoria de Junta General Ordinaria', cuerpo: `Se convoca a todos los propietarios a la Junta General Ordinaria el día ${fdate(jf)} a las 19:00 en primera convocatoria y a las 19:30 en segunda. Podéis votar online desde el portal.`, categoria: 'Juntas', fecha: new Date(Date.now() - 2 * 864e5).toISOString(), fijado: true, leidos: [] });
    s.comunicados.push({ id: uid('n'), comId: c.id, titulo: 'Corte de agua programado', cuerpo: 'El próximo martes de 9:00 a 13:00 se cortará el suministro de agua por trabajos de mantenimiento en la acometida general.', categoria: 'Avisos', fecha: new Date(Date.now() - 6 * 864e5).toISOString(), fijado: false, leidos: [] });
    s.comunicados.push({ id: uid('n'), comId: c.id, titulo: 'Recordatorio: normas de uso de zonas comunes', cuerpo: 'Recordamos que las reservas de zonas comunes se realizan exclusivamente desde el portal del propietario.', categoria: 'Normas', fecha: new Date(Date.now() - 15 * 864e5).toISOString(), fijado: false, leidos: [] });
    ['Estatutos de la comunidad.pdf', 'Póliza seguro multirriesgo ' + y + '.pdf', 'Acta junta extraordinaria.pdf', 'Certificado inspección ascensor.pdf', 'Presupuesto ' + y + '.xlsx'].forEach((n, k) => s.documentos.push({ id: uid('f'), comId: c.id, nombre: n, categoria: ['Estatutos', 'Seguros', 'Actas', 'Certificados', 'Cuentas'][k], fecha: addMonths(P0, -k) + '-03', tam: Math.floor(rnd(80, 900)) * 1024, publico: k !== 1, data: null }));
  });
  // reservas de ejemplo
  s.zonas.forEach(z => { const us = s.unidades.filter(u => u.comId === z.comId && u.tipo === 'vivienda'); for (let k = 0; k < 6; k++) { const d = new Date(Date.now() + Math.floor(rnd(0, 7)) * 864e5).toISOString().slice(0, 10); const slots = Math.floor((z.horaFin - z.horaIni) * 60 / z.franja); const h = z.horaIni * 60 + Math.floor(rnd(0, slots)) * z.franja; if (s.reservas.some(r => r.zonaId === z.id && r.fecha === d && r.ini === h)) continue; s.reservas.push({ id: uid('rs'), zonaId: z.id, comId: z.comId, unidadId: pick(us).id, fecha: d, ini: h, estado: 'confirmada', creada: new Date().toISOString() }); } });
  s.actividad = [
    { id: uid('a'), f: new Date(Date.now() - 36e5).toISOString(), txt: 'Pago recibido del 2º B (cuota ' + perLabel(P0) + ')', comId: s.comunidades[0].id },
    { id: uid('a'), f: new Date(Date.now() - 5 * 36e5).toISOString(), txt: 'Nueva incidencia: Fuga de agua en garaje plaza 7', comId: s.comunidades[0].id },
    { id: uid('a'), f: new Date(Date.now() - 26 * 36e5).toISOString(), txt: 'Junta General Ordinaria convocada y notificada a 30 propietarios', comId: s.comunidades[0].id },
    { id: uid('a'), f: new Date(Date.now() - 50 * 36e5).toISOString(), txt: 'Remesa SEPA de ' + perLabel(addMonths(P0, -1)) + ' abonada en cuenta', comId: s.comunidades[1].id }
  ];
  return s;
}
