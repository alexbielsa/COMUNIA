/* ===== Comunia · vistas y acciones ===== */
'use strict';
const NAV_ADMIN = [
  ['Principal', [['panel', 'Panel de control', 'panel'], ['asistente', 'Asistente IA', 'spark', 'ia']]],
  ['Comunidad', [['cartera', 'Cartera de comunidades', 'build', 'cartera'], ['unidades', 'Inmuebles y propietarios', 'users'], ['comunicados', 'Comunicados', 'mega'], ['documentos', 'Documentos', 'file']]],
  ['Finanzas', [['recibos', 'Recibos', 'receipt'], ['remesas', 'Remesas SEPA', 'send'], ['banco', 'Banco y movimientos', 'bank'], ['presupuestos', 'Presupuestos', 'chart'], ['morosidad', 'Morosidad', 'alert'], ['derramas', 'Derramas', 'layers']]],
  ['Operaciones', [['incidencias', 'Incidencias', 'wrench'], ['proveedores', 'Proveedores', 'truck', 'proveedores'], ['reservas', 'Zonas comunes', 'cal'], ['juntas', 'Juntas y votaciones', 'gavel']]],
  ['Análisis', [['informes', 'Informes', 'report'], ['ajustes', 'Ajustes y plan', 'gear']]]
];
const NAV_PORTAL = [
  ['Mi vivienda', [['p-inicio', 'Inicio', 'home', 'portal'], ['p-recibos', 'Mis recibos', 'receipt', 'portal'], ['p-incidencias', 'Incidencias', 'wrench', 'portal'], ['p-reservas', 'Reservar zonas', 'cal', 'reservas'], ['p-juntas', 'Juntas y votaciones', 'gavel', 'juntas']]],
  ['Comunidad', [['p-comunicados', 'Tablón de anuncios', 'mega', 'portal'], ['p-documentos', 'Documentos', 'file', 'documentos'], ['asistente', 'Asistente IA', 'spark', 'ia']]]
];
const featOf = (r, f) => f || r;
const isPortal = () => UI.role === 'vecino';
const me = () => unit(UI.vecinoUnit) || unitsOf(com().id).find(u => u.tipo === 'vivienda');

/* ---------- Shell ---------- */
function renderShell() {
  const c = com(); const nav = isPortal() ? NAV_PORTAL : NAV_ADMIN;
  const counts = { incidencias: S.incidencias.filter(i => i.comId === c.id && i.estado === 'abierta').length, morosidad: morosos(c.id).length };
  const navHtml = nav.map(([g, items]) => `<div class="nav-group">${g}</div>` + items.filter(([r]) => !(UI.role === 'presidente' && r === 'cartera')).map(([r, l, i, f]) => {
    const locked = !hasFeat(featOf(r, f));
    return `<a href="#${r}" class="${UI.route === r ? 'active' : ''}">${ico(i)}<span>${l}</span>${locked ? `<span class="lock">${PLANS[FEAT_PLAN(featOf(r, f))].nombre.split(' ')[0]}</span>` : counts[r] && !isPortal() ? `<span class="count">${counts[r]}</span>` : ''}</a>`;
  }).join('')).join('');
  const notes = notifications();
  const units = unitsOf(c.id);
  $('#app').innerHTML = `
  <div class="app">
    <aside class="sidebar" id="sidebar">
      <div class="logo"><div class="logo-mark">${ico('home', 18)}</div><div>Comunia<small>${esc(S.meta.org)}</small></div></div>
      <button class="com-switch" data-act="switchCom" aria-label="Cambiar de comunidad"><div style="flex:1;min-width:0"><div class="t">${esc(c.nombre)}</div><div class="s">${units.length} inmuebles · ${esc(c.ciudad || '')}</div></div>${ico('chev', 15)}</button>
      <nav class="nav">${navHtml}</nav>
      <div class="side-foot"><div class="plan-pill"><span>Plan <b style="color:var(--text)">${PLANS[S.meta.plan].nombre}</b></span>${S.meta.plan !== 'gestoria' && !isPortal() ? '<a href="#ajustes" class="small">Mejorar</a>' : ''}</div></div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="icon-btn menu-btn" data-act="menu" aria-label="Menú">${ico('menu')}</button>
        <button class="search-btn" data-act="search">${ico('search', 16)}<span>Buscar propietarios, recibos, incidencias…</span><kbd>Ctrl K</kbd></button>
        <div class="spacer"></div>
        <span class="sync" id="sync"><i></i>…</span>
        <select class="role-select" id="roleSel" aria-label="Ver como">
          <option value="admin" ${UI.role === 'admin' ? 'selected' : ''}>Administrador</option>
          <option value="presidente" ${UI.role === 'presidente' ? 'selected' : ''}>Presidente</option>
          <option value="vecino" ${UI.role === 'vecino' ? 'selected' : ''}>Propietario (portal)</option>
        </select>
        ${isPortal() ? `<select class="role-select" id="unitSel" aria-label="Vivienda">${units.map(u => `<option value="${u.id}" ${me()?.id === u.id ? 'selected' : ''}>${esc(u.ref)} · ${esc(u.propietario.nombre.split(' ')[0])}</option>`).join('')}</select>` : ''}
        <div style="position:relative"><button class="icon-btn" data-act="notif" aria-label="Avisos">${ico('bell')}${notes.length ? '<span class="dot"></span>' : ''}</button><div id="notifDrop"></div></div>
        <button class="icon-btn" data-act="theme" aria-label="Tema">${ico('moon')}</button>
      </header>
      <main class="content" id="content"></main>
    </div>
  </div>`;
  $('#roleSel').onchange = e => { UI.role = e.target.value; location.hash = isPortal() ? 'p-inicio' : 'panel'; render(); };
  const us = $('#unitSel'); if (us) us.onchange = e => { UI.vecinoUnit = e.target.value; render(); };
  setSync();
}
function render() {
  if (!S || !S.comunidades.length) return renderOnboarding();
  const r = UI.route;
  const allowed = isPortal() ? NAV_PORTAL : NAV_ADMIN;
  const flat = allowed.flatMap(g => g[1]);
  const item = flat.find(x => x[0] === r) || flat[0];
  if (item[0] !== r) { UI.route = item[0]; }
  const focus = document.activeElement && document.activeElement.id ? { id: document.activeElement.id, s: document.activeElement.selectionStart } : null;
  renderShell();
  const f = featOf(item[0], item[3]);
  const view = VIEWS[UI.route];
  $('#content').innerHTML = !hasFeat(f) ? lockedView(f, item[1]) : view ? view() : '<div class="empty">Vista no encontrada</div>';
  if (focus) { const el = document.getElementById(focus.id); if (el) { el.focus(); try { el.setSelectionRange(focus.s, focus.s); } catch (e) { } } }
  AFTER.forEach(fn => fn()); AFTER.length = 0;
}
const AFTER = [];
function lockedView(f, label) {
  const p = FEAT_PLAN(f);
  return `<div class="card locked"><div style="display:inline-grid;place-items:center;width:52px;height:52px;border-radius:14px;background:var(--brand-soft);color:var(--brand)">${ico('lock', 24)}</div><h2>${esc(label)} está incluido en el plan ${PLANS[p].nombre}</h2><p>Tu plan actual es ${PLANS[S.meta.plan].nombre}. Mejora para desbloquear esta función y el resto de herramientas profesionales.</p>${isPortal() ? '<p class="small muted">Pide al administrador de tu comunidad que active el plan.</p>' : `<a class="btn primary" href="#ajustes">Ver planes</a>`}</div>`;
}
const head = (t, sub, actions = '') => `<div class="page-head"><div><h1>${esc(t)}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="actions">${actions}</div></div>`;
const btn = (act, label, { icon, cls = '', id = '', extra = '' } = {}) => `<button class="btn ${cls}" data-act="${act}" ${id ? `data-id="${esc(id)}"` : ''} ${extra}>${icon ? ico(icon) : ''}${esc(label)}</button>`;
const kpi = (l, v, d = '', cls = '') => `<div class="card kpi"><div class="l">${l}</div><div class="v ${cls}">${v}</div><div class="d">${d}</div></div>`;
const filt = (k, d = '') => UI.filters[k] ?? d;

/* ---------- Avisos ---------- */
function notifications() {
  const c = com(); const out = []; const hoy = todayISO();
  const urg = S.incidencias.filter(i => i.comId === c.id && i.prioridad === 'urgente' && i.estado !== 'resuelta');
  if (isPortal()) {
    const u = me(); const d = deudaUnit(u.id); if (d > 0) out.push({ t: `Tienes ${eur(d)} en recibos vencidos`, r: 'p-recibos', i: 'receipt' });
    S.juntas.filter(j => j.comId === c.id && j.estado === 'convocada' && j.votacionOnline).forEach(j => out.push({ t: `Votación online abierta: junta del ${fdate(j.fecha)}`, r: 'p-juntas', i: 'gavel' }));
    return out;
  }
  urg.forEach(i => out.push({ t: `Urgente: ${i.titulo}`, r: 'incidencias', i: 'alert' }));
  const venc = recOf(c.id).filter(r => r.estado !== 'cobrado' && r.vencimiento < hoy); if (venc.length) out.push({ t: `${venc.length} recibos vencidos sin cobrar (${eur(venc.reduce((s, r) => s + r.importe, 0))})`, r: 'morosidad', i: 'receipt' });
  S.remesas.filter(r => r.comId === c.id && r.estado === 'generada').forEach(r => out.push({ t: `Remesa ${r.ref} pendiente de abono`, r: 'remesas', i: 'send' }));
  S.juntas.filter(j => j.comId === c.id && j.estado === 'convocada' && daysBetween(hoy, j.fecha) <= 15 && j.fecha >= hoy).forEach(j => out.push({ t: `Junta ${j.tipo} en ${daysBetween(hoy, j.fecha)} días`, r: 'juntas', i: 'gavel' }));
  if (Math.abs(coefSum(c.id) - 100) > .05) out.push({ t: `Los coeficientes suman ${NUM.format(coefSum(c.id))} %, no 100 %`, r: 'unidades', i: 'users' });
  const per = curPeriod(); if (!recOf(c.id).some(r => r.periodo === per && r.tipo === 'ordinaria')) out.push({ t: `Cuotas de ${perLabel(per)} sin emitir`, r: 'recibos', i: 'receipt' });
  return out;
}

/* ================= VISTAS ================= */
const VIEWS = {};

VIEWS.panel = () => {
  const c = com(); const hoy = todayISO();
  const sal = saldo(c.id); const venc = recOf(c.id).filter(r => r.estado !== 'cobrado' && r.vencimiento < hoy); const deuda = venc.reduce((s, r) => s + r.importe, 0);
  const tasa = tasaCobro(c.id); const incA = S.incidencias.filter(i => i.comId === c.id && i.estado !== 'resuelta');
  const ser = serieMensual(c.id, 6).map(d => ({ ...d, label: perLabel(d.p).split(' ')[0], tip: perLong(d.p) }));
  const series = [{ k: 'ing', n: 'Ingresos', c: 'var(--s1)' }, { k: 'gas', n: 'Gastos', c: 'var(--s2)' }];
  const mor = morosos(c.id).slice(0, 5);
  const jun = S.juntas.filter(j => j.comId === c.id && j.estado === 'convocada').sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  const resHoy = S.reservas.filter(r => r.comId === c.id && r.fecha === hoy && r.estado === 'confirmada');
  const act = S.actividad.filter(a => a.comId === c.id).slice(0, 6);
  const notes = notifications();
  const ytd = S.movimientos.filter(m => m.comId === c.id && m.fecha.startsWith(String(new Date().getFullYear())) && m.importe < 0).reduce((s, m) => s - m.importe, 0);
  return head('Hola 👋 ' + (UI.role === 'presidente' ? 'Presidencia' : S.meta.org), `${esc(c.nombre)} · ${esc(c.direccion)}, ${esc(c.ciudad)}`, btn('go', 'Emitir cuotas', { icon: 'receipt', extra: 'data-to="recibos" data-then="emitir"' }) + btn('newInc', 'Nueva incidencia', { icon: 'plus', cls: 'primary' })) +
  `<div class="grid g4">
    ${kpi('Saldo en cuenta', eur(sal), esc(c.banco) + ' · ' + ibanFmt(c.iban).slice(-9))}
    ${kpi('Pendiente vencido', eur(deuda), `${venc.length} recibos · ${morosos(c.id).length} morosos`, deuda > 0 ? 'down' : '')}
    ${kpi('Tasa de cobro (6 meses)', NUM.format(Math.round(tasa * 1000) / 10) + ' %', `<div class="progress" style="margin-top:6px"><i style="width:${tasa * 100}%;background:${tasa > .95 ? 'var(--good)' : tasa > .85 ? 'var(--warn)' : 'var(--bad)'}"></i></div>`)}
    ${kpi('Incidencias activas', incA.length, `${incA.filter(i => i.prioridad === 'urgente').length} urgentes · ${incA.filter(i => i.estado === 'abierta').length} sin asignar`)}
  </div>
  <div class="grid g21 mt">
    <div class="card"><div class="card-h"><div><h3>Ingresos y gastos</h3><div class="sub">Últimos 6 meses · gasto acumulado del año ${eur(ytd)}</div></div>${legend(series)}</div><div class="card-b">${barChart('ch_ing', ser, series)}</div></div>
    <div class="card"><div class="card-h"><h3>Requiere tu atención</h3><span class="badge ${notes.length ? 'b-warn' : 'b-good'}">${notes.length || 'Todo al día'}</span></div><div class="list">${notes.length ? notes.slice(0, 6).map(n => `<a class="li" href="#${n.r}" style="text-decoration:none;color:inherit"><div class="ic">${ico(n.i)}</div><div class="tt" style="font-weight:500">${esc(n.t)}</div></a>`).join('') : '<div class="empty">Nada pendiente. Buen trabajo.</div>'}</div></div>
  </div>
  <div class="grid g3 mt">
    <div class="card"><div class="card-h"><h3>Mayores deudores</h3><a href="#morosidad" class="small">Ver todo</a></div><div class="list">${mor.length ? mor.map(m => { const u = unit(m.unidadId); return `<div class="li row-click" data-act="ficha" data-id="${u.id}"><div class="avatar">${initials(u.propietario.nombre)}</div><div><div class="tt">${esc(u.ref)} · ${esc(u.propietario.nombre)}</div><div class="ss">${m.n} ${m.n === 1 ? 'recibo' : 'recibos'} · desde ${fdate(m.masAntiguo)}</div></div><div class="rr strong down">${eur(m.total)}</div></div>`; }).join('') : '<div class="empty">Sin morosidad</div>'}</div></div>
    <div class="card"><div class="card-h"><h3>Agenda</h3></div><div class="list">
      ${jun ? `<a class="li" href="#juntas" style="text-decoration:none;color:inherit"><div class="ic">${ico('gavel')}</div><div><div class="tt">Junta ${esc(jun.tipo)}</div><div class="ss">${fdate(jun.fecha)} · ${esc(jun.hora)} · ${esc(jun.lugar)}</div></div><div class="rr"><span class="badge b-info">${daysBetween(hoy, jun.fecha)} días</span></div></a>` : ''}
      ${resHoy.map(r => { const z = S.zonas.find(z => z.id === r.zonaId); return `<div class="li"><div class="ic">${ico('cal')}</div><div><div class="tt">${esc(z?.nombre)} · ${hm(r.ini)}</div><div class="ss">Reserva de ${esc(unit(r.unidadId)?.ref)} hoy</div></div></div>`; }).join('')}
      ${!jun && !resHoy.length ? '<div class="empty">Sin eventos próximos</div>' : ''}
    </div></div>
    <div class="card"><div class="card-h"><h3>Actividad reciente</h3></div><div class="list">${act.map(a => `<div class="li"><div><div class="tt" style="font-weight:500">${esc(a.txt)}</div><div class="ss">${fdt(a.f)}</div></div></div>`).join('') || '<div class="empty">Sin actividad</div>'}</div></div>
  </div>`;
};

VIEWS.cartera = () => {
  const rows = S.comunidades.map(c => ({ c, u: unitsOf(c.id).length, s: saldo(c.id), d: morosos(c.id).reduce((a, m) => a + m.total, 0), t: tasaCobro(c.id), i: S.incidencias.filter(i => i.comId === c.id && i.estado !== 'resuelta').length }));
  const tot = rows.reduce((a, r) => ({ u: a.u + r.u, s: a.s + r.s, d: a.d + r.d }), { u: 0, s: 0, d: 0 });
  return head('Cartera de comunidades', `${S.comunidades.length} comunidades gestionadas · ${tot.u} inmuebles`, btn('newCom', 'Nueva comunidad', { icon: 'plus', cls: 'primary' })) +
  `<div class="grid g4">${kpi('Comunidades', S.comunidades.length, `Límite del plan: ${PLANS[S.meta.plan].maxCom}`)}${kpi('Inmuebles', tot.u)}${kpi('Saldo agregado', eur(tot.s))}${kpi('Deuda agregada', eur(tot.d), '', tot.d ? 'down' : '')}</div>
  <div class="card mt"><div class="table-wrap"><table><thead><tr><th>Comunidad</th><th>CIF</th><th class="num">Inmuebles</th><th class="num">Saldo</th><th class="num">Deuda vencida</th><th class="num">Tasa cobro</th><th class="num">Incidencias</th><th></th></tr></thead><tbody>
  ${rows.map(r => `<tr class="row-click" data-act="selCom" data-id="${r.c.id}"><td><div class="strong">${esc(r.c.nombre)}</div><div class="small muted">${esc(r.c.direccion)}, ${esc(r.c.ciudad)}</div></td><td>${esc(r.c.cif)}</td><td class="num">${r.u}</td><td class="num">${eur(r.s)}</td><td class="num ${r.d ? 'down' : ''}">${eur(r.d)}</td><td class="num">${NUM.format(Math.round(r.t * 1000) / 10)} %</td><td class="num">${r.i}</td><td>${r.c.id === UI.comId ? '<span class="badge b-brand">Activa</span>' : ''}</td></tr>`).join('')}
  </tbody></table></div></div>`;
};

VIEWS.unidades = () => {
  const c = com(); const q = filt('uq').toLowerCase(); const tp = filt('ut', 'todos');
  let us = unitsOf(c.id);
  if (tp !== 'todos') us = us.filter(u => u.tipo === tp);
  if (q) us = us.filter(u => (u.ref + ' ' + u.propietario.nombre + ' ' + u.propietario.email + ' ' + (u.inquilino?.nombre || '') + ' ' + u.propietario.dni).toLowerCase().includes(q));
  const cs = coefSum(c.id);
  return head('Inmuebles y propietarios', `${unitsOf(c.id).length} inmuebles · suma de coeficientes <b class="${Math.abs(cs - 100) > .05 ? 'down' : 'up'}">${NUM.format(cs)} %</b>`, btn('importUnits', 'Importar CSV', { icon: 'up' }) + btn('exportUnits', 'Exportar', { icon: 'down' }) + btn('editUnit', 'Nuevo inmueble', { icon: 'plus', cls: 'primary' })) +
  `<div class="card"><div class="toolbar"><input class="input" id="uq" data-filter="uq" placeholder="Buscar por piso, nombre, DNI, email…" value="${esc(filt('uq'))}" style="flex:1;max-width:340px"><div class="seg">${['todos', 'vivienda', 'local', 'garaje', 'trastero'].map(t => `<button class="${tp === t ? 'on' : ''}" data-act="setF" data-k="ut" data-v="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>
  <div class="table-wrap"><table><thead><tr><th>Inmueble</th><th>Propietario</th><th>Contacto</th><th class="num">m²</th><th class="num">Coef. %</th><th class="num">Cuota/mes</th><th class="num">Deuda</th><th>Cobro</th></tr></thead><tbody>
  ${us.map(u => { const d = deudaUnit(u.id); return `<tr class="row-click" data-act="ficha" data-id="${u.id}"><td><div class="strong">${esc(u.ref)}</div><div class="small muted">${esc(u.tipo)}${u.id === c.presidente ? ' · <span class="badge b-brand">Presidente</span>' : ''}</div></td><td><div class="flex"><div class="avatar">${initials(u.propietario.nombre)}</div><div><div>${esc(u.propietario.nombre)}</div><div class="small muted">${esc(u.propietario.dni)}${u.inquilino ? ' · Inquilino: ' + esc(u.inquilino.nombre) : ''}</div></div></div></td><td><div class="small">${esc(u.propietario.email)}</div><div class="small muted">${esc(u.propietario.tel)}</div></td><td class="num">${u.m2}</td><td class="num">${NUM.format(u.coef)}</td><td class="num">${eur(cuotaMensual(u))}</td><td class="num ${d ? 'down strong' : ''}">${d ? eur(d) : '—'}</td><td>${u.propietario.domiciliado ? (ibanValid(u.propietario.iban) ? '<span class="badge b-good">Domiciliado</span>' : '<span class="badge b-bad">IBAN no válido</span>') : '<span class="badge b-neutral">Transferencia</span>'}</td></tr>`; }).join('') || '<tr><td colspan="8" class="empty">Sin resultados</td></tr>'}
  </tbody></table></div></div>`;
};

VIEWS.recibos = () => {
  const c = com(); const st = filt('rs', 'todos'), per = filt('rp', 'todos'), tp = filt('rt', 'todos'), q = filt('rq').toLowerCase();
  let rs = recOf(c.id);
  const pers = [...new Set(rs.map(r => r.periodo))].sort().reverse();
  if (st !== 'todos') rs = rs.filter(r => st === 'vencido' ? r.estado !== 'cobrado' && r.vencimiento < todayISO() : r.estado === st);
  if (per !== 'todos') rs = rs.filter(r => r.periodo === per);
  if (tp !== 'todos') rs = rs.filter(r => r.tipo === tp);
  if (q) rs = rs.filter(r => { const u = unit(r.unidadId); return (u.ref + ' ' + u.propietario.nombre + ' ' + r.numero + ' ' + r.concepto).toLowerCase().includes(q); });
  rs.sort((a, b) => b.periodo.localeCompare(a.periodo) || (unit(a.unidadId)?.orden - unit(b.unidadId)?.orden));
  const tot = rs.reduce((s, r) => s + r.importe, 0); const sel = UI.sel || (UI.sel = new Set());
  const shown = rs.slice(0, 400);
  return head('Recibos', `${rs.length} recibos · ${eur(tot)}`, btn('exportRec', 'Exportar CSV', { icon: 'down' }) + btn('newRecibo', 'Recibo manual', { icon: 'plus' }) + btn('emitir', 'Emitir cuotas del mes', { icon: 'receipt', cls: 'primary' })) +
  `<div class="card"><div class="toolbar">
    <input class="input" id="rq" data-filter="rq" placeholder="Buscar piso, propietario o nº…" value="${esc(filt('rq'))}" style="width:240px">
    <select class="select" data-fsel="rs">${[['todos', 'Todos los estados'], ['pendiente', 'Pendientes'], ['vencido', 'Vencidos'], ['remesado', 'En remesa'], ['cobrado', 'Cobrados'], ['devuelto', 'Devueltos']].map(([v, l]) => `<option value="${v}" ${st === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <select class="select" data-fsel="rp"><option value="todos">Todos los periodos</option>${pers.map(p => `<option value="${p}" ${per === p ? 'selected' : ''}>${perLabel(p)}</option>`).join('')}</select>
    <select class="select" data-fsel="rt">${[['todos', 'Todos los tipos'], ['ordinaria', 'Cuota ordinaria'], ['derrama', 'Derrama'], ['otro', 'Otros']].map(([v, l]) => `<option value="${v}" ${tp === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <div class="spacer" style="flex:1"></div>
    <span class="small muted">${sel.size} seleccionados</span>
    ${btn('bulkCobrar', 'Marcar cobrados', { cls: 'sm' })}${hasFeat('remesas') ? btn('bulkRemesa', 'Crear remesa SEPA', { cls: 'sm' }) : ''}
  </div>
  <div class="table-wrap" style="max-height:62vh"><table><thead><tr><th style="width:30px"><input type="checkbox" data-act="selAll" aria-label="Seleccionar todos"></th><th>Nº</th><th>Inmueble</th><th>Concepto</th><th>Vence</th><th class="num">Importe</th><th>Estado</th><th></th></tr></thead><tbody>
  ${shown.map(r => { const u = unit(r.unidadId); const v = r.estado !== 'cobrado' && r.vencimiento < todayISO(); return `<tr><td><input type="checkbox" data-act="selOne" data-id="${r.id}" ${sel.has(r.id) ? 'checked' : ''} aria-label="Seleccionar"></td><td class="small muted">${esc(r.numero || '')}</td><td><a href="javascript:void 0" data-act="ficha" data-id="${u.id}" class="strong">${esc(u.ref)}</a><div class="small muted">${esc(u.propietario.nombre)}</div></td><td>${esc(r.concepto)}</td><td class="${v ? 'down' : ''}">${fdate(r.vencimiento)}</td><td class="num strong">${eur(r.importe)}</td><td>${badge(ESTADO_REC, r.estado)}${v && r.estado === 'pendiente' ? ' <span class="badge b-bad">Vencido</span>' : ''}</td><td style="white-space:nowrap;text-align:right">${r.estado !== 'cobrado' ? btn('cobrar', 'Cobrar', { cls: 'sm', id: r.id }) : btn('devolver', 'Devolución', { cls: 'sm ghost', id: r.id })} ${btn('verRecibo', 'Ver', { cls: 'sm ghost', id: r.id })}</td></tr>`; }).join('') || '<tr><td colspan="8" class="empty">Sin recibos con estos filtros</td></tr>'}
  </tbody></table>${rs.length > 400 ? `<div class="empty small">Mostrando 400 de ${rs.length}. Afina los filtros.</div>` : ''}</div></div>`;
};

VIEWS.remesas = () => {
  const c = com(); const rems = S.remesas.filter(r => r.comId === c.id);
  const pend = recOf(c.id).filter(r => r.estado === 'pendiente' || r.estado === 'devuelto');
  const dom = pend.filter(r => { const u = unit(r.unidadId); return u.propietario.domiciliado && ibanValid(u.propietario.iban); });
  return head('Remesas SEPA', `Adeudos directos SEPA Core (pain.008.001.02) · Identificador de acreedor <b>${sepaCreditorId(c.cif)}</b>`, btn('newRemesa', 'Nueva remesa', { icon: 'plus', cls: 'primary' })) +
  `<div class="grid g3">${kpi('Recibos listos para remesar', dom.length, eur(dom.reduce((s, r) => s + r.importe, 0)))}${kpi('Pendientes no domiciliados', pend.length - dom.length, 'Cobro por transferencia o IBAN no válido')}${kpi('Remesas en curso', rems.filter(r => r.estado === 'generada').length, eur(rems.filter(r => r.estado === 'generada').reduce((s, r) => s + r.total, 0)))}</div>
  <div class="card mt"><div class="card-h"><h3>Historial de remesas</h3></div><div class="table-wrap"><table><thead><tr><th>Referencia</th><th>Generada</th><th>Fecha de cargo</th><th class="num">Recibos</th><th class="num">Importe</th><th>Estado</th><th></th></tr></thead><tbody>
  ${rems.map(r => `<tr><td class="strong">${esc(r.ref)}</td><td>${fdate(r.fecha)}</td><td>${fdate(r.fechaCargo)}</td><td class="num">${r.recibos.length}</td><td class="num strong">${eur(r.total)}</td><td>${r.estado === 'cobrada' ? '<span class="badge b-good">Abonada</span>' : '<span class="badge b-info">Enviada al banco</span>'}</td><td style="text-align:right;white-space:nowrap">${btn('xmlRemesa', 'Fichero XML', { cls: 'sm', icon: 'down', id: r.id })} ${r.estado !== 'cobrada' ? btn('abonarRemesa', 'Marcar abonada', { cls: 'sm primary', id: r.id }) : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">Aún no has generado ninguna remesa. Crea la primera para cobrar todos los recibos domiciliados en un clic.</td></tr>'}
  </tbody></table></div></div>`;
};

VIEWS.banco = () => {
  const c = com(); const tp = filt('mt', 'todos'), cat = filt('mc', 'todas'), q = filt('mq').toLowerCase();
  let ms = movOf(c.id);
  if (tp === 'ing') ms = ms.filter(m => m.importe > 0); if (tp === 'gas') ms = ms.filter(m => m.importe < 0); if (tp === 'nc') ms = ms.filter(m => !m.conciliado);
  if (cat !== 'todas') ms = ms.filter(m => m.categoria === cat);
  if (q) ms = ms.filter(m => (m.concepto + ' ' + (prov(m.proveedorId)?.nombre || '')).toLowerCase().includes(q));
  const nc = movOf(c.id).filter(m => !m.conciliado).length;
  const ser = serieMensual(c.id, 1)[0];
  return head('Banco y movimientos', `${esc(c.banco)} · ${ibanFmt(c.iban)}`, btn('importBank', 'Importar extracto', { icon: 'up' }) + btn('exportMov', 'Exportar', { icon: 'down' }) + btn('newMov', 'Nuevo movimiento', { icon: 'plus', cls: 'primary' })) +
  `<div class="grid g4">${kpi('Saldo actual', eur(saldo(c.id)))}${kpi('Ingresos este mes', eur(ser.ing), '', 'up')}${kpi('Gastos este mes', eur(ser.gas), '', 'down')}${kpi('Sin conciliar', nc, nc ? 'Revisa y concilia' : 'Todo conciliado')}</div>
  <div class="card mt"><div class="toolbar"><input class="input" id="mq" data-filter="mq" placeholder="Buscar concepto o proveedor…" value="${esc(filt('mq'))}" style="width:260px">
  <div class="seg">${[['todos', 'Todos'], ['ing', 'Ingresos'], ['gas', 'Gastos'], ['nc', 'Sin conciliar']].map(([v, l]) => `<button class="${tp === v ? 'on' : ''}" data-act="setF" data-k="mt" data-v="${v}">${l}</button>`).join('')}</div>
  <select class="select" data-fsel="mc"><option value="todas">Todas las categorías</option>${[...CATS_ING, ...CATS_GASTO].map(x => `<option ${cat === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div class="table-wrap" style="max-height:60vh"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Proveedor</th><th class="num">Importe</th><th>Conciliado</th><th></th></tr></thead><tbody>
  ${ms.slice(0, 400).map(m => `<tr><td>${fdate(m.fecha)}</td><td>${esc(m.concepto)}</td><td><span class="badge b-neutral">${esc(m.categoria)}</span></td><td class="small">${esc(prov(m.proveedorId)?.nombre || '')}</td><td class="num strong ${m.importe < 0 ? 'down' : 'up'}">${eur(m.importe)}</td><td><button class="btn sm ghost" data-act="toggleConc" data-id="${m.id}">${m.conciliado ? '<span class="badge b-good">✓ Sí</span>' : '<span class="badge b-warn">Pendiente</span>'}</button></td><td style="text-align:right">${btn('editMov', 'Editar', { cls: 'sm ghost', id: m.id })}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">Sin movimientos</td></tr>'}
  </tbody></table></div></div>`;
};

VIEWS.presupuestos = () => {
  const c = com(); const y = new Date().getFullYear();
  let b = S.presupuestos.find(p => p.comId === c.id && p.anio === y);
  const real = {}; S.movimientos.filter(m => m.comId === c.id && m.importe < 0 && m.fecha.startsWith(String(y))).forEach(m => real[m.categoria] = (real[m.categoria] || 0) - m.importe);
  if (!b) return head('Presupuesto ' + y, 'Aún no hay presupuesto para este ejercicio.', btn('newBudget', 'Crear presupuesto', { icon: 'plus', cls: 'primary' })) + '<div class="card empty">Crea el presupuesto ordinario para calcular las cuotas por coeficiente y seguir su ejecución.</div>';
  const tot = b.partidas.reduce((s, p) => s + p.importe, 0); const totR = Object.values(real).reduce((s, v) => s + v, 0);
  const mesFrac = (new Date().getMonth() + 1) / 12;
  const rows = b.partidas.filter(p => p.cat !== 'Fondo de reserva').map(p => ({ l: p.cat, v: r2(real[p.cat] || 0), ref: p.importe, over: (real[p.cat] || 0) > p.importe * mesFrac * 1.15 }));
  const desv = Object.keys(real).filter(k => !b.partidas.some(p => p.cat === k));
  return head('Presupuesto ' + y, `Ejecución al ${Math.round(mesFrac * 100)} % del ejercicio · las barras grises son lo presupuestado y las de color lo gastado`, btn('editBudget', 'Editar partidas', { icon: 'edit' }) + btn('applyBudget', 'Aplicar a cuotas', { cls: 'primary' })) +
  `<div class="grid g4">${kpi('Presupuesto anual', eur(tot), `Cuota base actual: ${eur(c.presupuestoAnual)}/año`)}${kpi('Gastado en ' + y, eur(totR), NUM.format(Math.round(totR / tot * 1000) / 10) + ' % del total')}${kpi('Previsión a cierre', eur(totR / mesFrac), (totR / mesFrac > tot ? '<span class="down">Por encima</span>' : '<span class="up">Dentro</span>') + ' del presupuesto', totR / mesFrac > tot ? 'down' : '')}${kpi('Fondo de reserva', eur(b.partidas.find(p => p.cat === 'Fondo de reserva')?.importe || 0), 'Mínimo legal: 10 % del presupuesto')}</div>
  <div class="grid g21 mt"><div class="card"><div class="card-h"><h3>Ejecución por partida</h3><div class="legend"><span><i style="background:var(--line-2)"></i>Presupuestado</span><span><i style="background:var(--s1)"></i>Real</span><span><i style="background:var(--bad)"></i>Desviación</span></div></div><div class="card-b">${hbars(rows)}</div></div>
  <div class="card"><div class="card-h"><h3>Partidas</h3></div><div class="table-wrap"><table><thead><tr><th>Partida</th><th class="num">Importe</th><th class="num">%</th></tr></thead><tbody>${b.partidas.map(p => `<tr><td>${esc(p.cat)}</td><td class="num">${eur(p.importe)}</td><td class="num">${NUM.format(Math.round(p.importe / tot * 1000) / 10)}</td></tr>`).join('')}<tr><td class="strong">Total</td><td class="num strong">${eur(tot)}</td><td class="num">100</td></tr></tbody></table></div>${desv.length ? `<div class="card-b small muted">Gastos sin partida asignada: ${desv.map(esc).join(', ')}</div>` : ''}</div></div>`;
};

VIEWS.morosidad = () => {
  const c = com(); const ms = morosos(c.id); const tot = ms.reduce((s, m) => s + m.total, 0);
  const tr = [0, 1, 2, 3].map(i => ms.reduce((s, m) => s + m.tramos[i], 0));
  return head('Morosidad', 'Recibos vencidos y no cobrados, por antigüedad', btn('exportMor', 'Exportar listado', { icon: 'down' })) +
  `<div class="grid g4">${kpi('Deuda total vencida', eur(tot), '', tot ? 'down' : '')}${kpi('Propietarios con deuda', ms.length, `de ${unitsOf(c.id).length} inmuebles`)}${kpi('Deuda media', eur(ms.length ? tot / ms.length : 0))}${kpi('Más de 90 días', eur(tr[2] + tr[3]), 'Candidata a reclamación judicial (art. 21 LPH)')}</div>
  <div class="grid g21 mt"><div class="card"><div class="card-h"><h3>Deudores</h3></div><div class="table-wrap"><table><thead><tr><th>Inmueble</th><th>Propietario</th><th class="num">Recibos</th><th>Desde</th><th class="num">Deuda</th><th></th></tr></thead><tbody>
  ${ms.map(m => { const u = unit(m.unidadId); const d = daysBetween(m.masAntiguo, todayISO()); return `<tr><td class="strong">${esc(u.ref)}</td><td>${esc(u.propietario.nombre)}<div class="small muted">${esc(u.propietario.tel)}</div></td><td class="num">${m.n}</td><td>${fdate(m.masAntiguo)} <span class="badge ${d > 90 ? 'b-bad' : d > 30 ? 'b-warn' : 'b-neutral'}">${d} d</span></td><td class="num strong down">${eur(m.total)}</td><td style="white-space:nowrap;text-align:right">${btn('recordatorio', 'Recordatorio', { cls: 'sm', id: u.id })} ${btn('certDeuda', 'Certificado', { cls: 'sm', id: u.id })} ${btn('saldarUnit', 'Registrar pago', { cls: 'sm primary', id: u.id })}</td></tr>`; }).join('') || '<tr><td colspan="6" class="empty">¡Sin morosos! Todos los recibos vencidos están cobrados.</td></tr>'}
  </tbody></table></div></div>
  <div class="card"><div class="card-h"><h3>Antigüedad de la deuda</h3></div><div class="card-b">${hbars([{ l: '0–30 días', v: tr[0] }, { l: '31–90 días', v: tr[1] }, { l: '91–180 días', v: tr[2] }, { l: 'Más de 180 días', v: tr[3] }], { color: 'var(--s2)' })}<p class="small muted" style="margin-bottom:0">El certificado de deuda firmado por el secretario con el visto bueno del presidente permite iniciar el proceso monitorio (art. 21 LPH).</p></div></div></div>`;
};

VIEWS.derramas = () => {
  const c = com(); const ds = S.derramas.filter(d => d.comId === c.id);
  return head('Derramas', 'Cuotas extraordinarias aprobadas en junta, fraccionadas por plazos', btn('newDerrama', 'Nueva derrama', { icon: 'plus', cls: 'primary' })) +
  (ds.length ? `<div class="grid g2">${ds.map(d => { const rs = S.recibos.filter(r => r.derramaId === d.id); const cob = rs.filter(r => r.estado === 'cobrado').reduce((s, r) => s + r.importe, 0); const pct = cob / d.total; return `<div class="card"><div class="card-h"><div><h3>${esc(d.concepto)}</h3><div class="sub">Aprobada ${fdate(d.fecha)} · ${d.plazos} plazos desde ${perLabel(d.inicio)} · reparto ${d.reparto === 'coef' ? 'por coeficiente' : 'a partes iguales'}</div></div><span class="badge ${pct >= .999 ? 'b-good' : 'b-info'}">${pct >= .999 ? 'Completada' : 'En cobro'}</span></div><div class="card-b"><div class="flex between"><span class="muted">Cobrado</span><b>${eur(cob)} de ${eur(d.total)}</b></div><div class="progress" style="margin:8px 0 14px"><i style="width:${pct * 100}%"></i></div><div class="grid g3" style="gap:8px">${Array.from({ length: d.plazos }, (_, i) => { const per = addMonths(d.inicio, i); const rp = rs.filter(r => r.periodo === per); const cp = rp.filter(r => r.estado === 'cobrado').length; return `<div style="border:1px solid var(--line);border-radius:8px;padding:8px" class="small"><b>Plazo ${i + 1}</b> · ${perLabel(per)}<div class="muted">${cp}/${rp.length} cobrados</div></div>`; }).join('')}</div></div></div>`; }).join('')}</div>` : '<div class="card empty">No hay derramas. Crea una para generar automáticamente los recibos de cada plazo.</div>');
};

VIEWS.incidencias = () => {
  const c = com(); const pr = filt('ip', 'todas'); let is = S.incidencias.filter(i => i.comId === c.id); if (pr !== 'todas') is = is.filter(i => i.prioridad === pr);
  const order = { urgente: 0, alta: 1, media: 2, baja: 3 };
  const col = st => is.filter(i => i.estado === st).sort((a, b) => order[a.prioridad] - order[b.prioridad] || b.fecha.localeCompare(a.fecha));
  AFTER.push(bindKanban);
  return head('Incidencias', 'Arrastra las tarjetas entre columnas para cambiar su estado', `<div class="seg">${['todas', 'urgente', 'alta', 'media', 'baja'].map(p => `<button class="${pr === p ? 'on' : ''}" data-act="setF" data-k="ip" data-v="${p}">${p[0].toUpperCase() + p.slice(1)}</button>`).join('')}</div>` + btn('newInc', 'Nueva incidencia', { icon: 'plus', cls: 'primary' })) +
  `<div class="kanban">${Object.keys(ESTADO_INC).map(st => `<div class="kcol" data-col="${st}"><div class="kcol-h"><span>${ESTADO_INC[st][0]}</span><span class="badge b-neutral">${col(st).length}</span></div><div class="kcol-b">${col(st).map(i => `<div class="kcard" draggable="true" data-inc="${i.id}" data-act="incDetail" data-id="${i.id}"><div class="t">${esc(i.titulo)}</div><div class="m">${badge(PRIO, i.prioridad)}<span>${esc(i.numero)}</span><span>· ${esc(i.zona)}</span></div><div class="m" style="margin-top:6px">${i.proveedorId ? ico('truck', 13) + esc(prov(i.proveedorId)?.nombre) : '<span class="down">Sin proveedor</span>'}<span style="margin-left:auto">${Math.max(0, daysBetween(i.fecha.slice(0, 10), todayISO()))} d</span></div></div>`).join('') || '<div class="small muted" style="padding:8px">Sin incidencias</div>'}</div></div>`).join('')}</div>`;
};
function bindKanban() {
  $$('.kcard').forEach(k => k.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', k.dataset.inc); }));
  $$('.kcol').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('drag-over'); const i = S.incidencias.find(x => x.id === e.dataTransfer.getData('text/plain')); if (i && i.estado !== col.dataset.col) setIncEstado(i, col.dataset.col); });
  });
}
function setIncEstado(i, st) {
  i.estado = st; i.historial.push({ f: new Date().toISOString(), t: 'Estado: ' + ESTADO_INC[st][0] }); touch('incidencias'); log(`Incidencia ${i.numero} → ${ESTADO_INC[st][0]}`, i.comId);
  if (st === 'resuelta' && i.coste > 0 && !i.gastoId) {
    render();
    confirmModal('Registrar el gasto', `La incidencia tiene un coste de <b>${eur(i.coste)}</b>${i.proveedorId ? ' de ' + esc(prov(i.proveedorId)?.nombre) : ''}. ¿Quieres registrarlo como gasto en el banco?`, 'Registrar gasto', () => { const m = { id: uid('m'), comId: i.comId, fecha: todayISO(), concepto: `Factura ${i.numero}: ${i.titulo}`, importe: -i.coste, categoria: 'Reparaciones', conciliado: false, proveedorId: i.proveedorId }; S.movimientos.push(m); i.gastoId = m.id; touch('movimientos', 'incidencias'); toast('Gasto registrado'); }, false);
    return;
  }
  render();
}

VIEWS.proveedores = () => {
  const y = String(new Date().getFullYear());
  return head('Proveedores', 'CRM de proveedores compartido por todas tus comunidades', btn('editProv', 'Nuevo proveedor', { icon: 'plus', cls: 'primary' })) +
  `<div class="card"><div class="table-wrap"><table><thead><tr><th>Proveedor</th><th>Servicio</th><th>Contacto</th><th>Contrato</th><th>Valoración</th><th class="num">Incidencias activas</th><th class="num">Facturado ${y}</th><th></th></tr></thead><tbody>
  ${S.proveedores.map(p => { const inc = S.incidencias.filter(i => i.proveedorId === p.id && i.estado !== 'resuelta').length; const g = -S.movimientos.filter(m => m.proveedorId === p.id && m.fecha.startsWith(y)).reduce((s, m) => s + m.importe, 0); return `<tr><td><div class="strong">${esc(p.nombre)}</div><div class="small muted">${esc(p.cif)}</div></td><td><span class="badge b-neutral">${esc(p.servicio)}</span></td><td class="small">${esc(p.tel)}<div class="muted">${esc(p.email)}</div></td><td class="small">${esc(p.contrato || '')}</td><td><span class="stars">${'★'.repeat(Math.round(p.valoracion))}${'☆'.repeat(5 - Math.round(p.valoracion))}</span> <span class="small muted">${NUM.format(p.valoracion)}</span></td><td class="num">${inc}</td><td class="num">${eur(g)}</td><td>${btn('editProv', 'Editar', { cls: 'sm ghost', id: p.id })}</td></tr>`; }).join('')}
  </tbody></table></div></div>`;
};

/* --- Reservas (compartida admin/portal) --- */
const hm = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
function weekStart(off = 0) { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day + off * 7); d.setHours(12, 0, 0, 0); return d; }
function calendarHtml(z, portal) {
  const off = UI.week || 0; const ws = weekStart(off); const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); });
  const slots = []; for (let m = z.horaIni * 60; m + z.franja <= z.horaFin * 60; m += z.franja) slots.push(m);
  const now = new Date(); const nowISO = todayISO(); const nowMin = now.getHours() * 60 + now.getMinutes();
  const myId = portal ? me().id : null;
  let h = `<div class="cal"><div class="ch"></div>${days.map(d => `<div class="ch ${d === nowISO ? 'today' : ''}">${new Date(d + 'T12:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</div>`).join('')}`;
  for (const s of slots) {
    h += `<div class="hr">${hm(s)}</div>`;
    for (const d of days) {
      const r = S.reservas.find(x => x.zonaId === z.id && x.fecha === d && x.ini === s && x.estado === 'confirmada');
      const past = d < nowISO || (d === nowISO && s < nowMin);
      if (r) { const u = unit(r.unidadId); const mine = r.unidadId === myId; h += `<div class="slot"><div class="bk ${portal ? (mine ? 'mine' : 'other') : ''}" data-act="resDetail" data-id="${r.id}" title="${esc(u?.ref)}">${portal ? (mine ? 'Tu reserva' : 'Ocupado') : esc(u?.ref)}</div></div>`; }
      else h += `<div class="slot ${past ? 'past' : ''}" ${past ? '' : `data-act="book" data-z="${z.id}" data-d="${d}" data-s="${s}"`} title="${past ? 'Pasado' : 'Reservar ' + hm(s)}"></div>`;
    }
  }
  return h + '</div>';
}
function reservasView(portal) {
  const c = com(); const zs = S.zonas.filter(z => z.comId === c.id && z.activa !== false);
  if (!zs.length) return head(portal ? 'Reservar zonas comunes' : 'Zonas comunes', '', portal ? '' : btn('editZona', 'Nueva zona', { icon: 'plus', cls: 'primary' })) + '<div class="card empty">No hay zonas comunes configuradas.</div>';
  const z = zs.find(x => x.id === UI.zona) || zs[0]; UI.zona = z.id;
  const ws = weekStart(UI.week || 0); const we = new Date(ws); we.setDate(we.getDate() + 6);
  const mine = portal ? S.reservas.filter(r => r.unidadId === me().id && r.estado === 'confirmada' && r.fecha >= todayISO()).sort((a, b) => (a.fecha + a.ini).localeCompare(b.fecha + b.ini)) : [];
  return head(portal ? 'Reservar zonas comunes' : 'Zonas comunes y reservas', portal ? 'Pulsa un hueco libre para reservar' : 'Configura las zonas y gestiona las reservas de los vecinos', portal ? '' : btn('editZona', 'Editar zona', { icon: 'edit', id: z.id }) + btn('editZona', 'Nueva zona', { icon: 'plus', cls: 'primary' })) +
  `<div class="tabs">${zs.map(x => `<button class="${x.id === z.id ? 'on' : ''}" data-act="setZona" data-id="${x.id}">${esc(x.nombre)}</button>`).join('')}</div>
  <div class="grid g21"><div><div class="flex between mb"><div class="flex">${btn('week', '‹', { cls: 'sm', id: '-1' })}<b>${ws.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${we.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</b>${btn('week', '›', { cls: 'sm', id: '1' })}${btn('week', 'Hoy', { cls: 'sm ghost', id: '0' })}</div><span class="small muted">Franjas de ${z.franja} min</span></div>${calendarHtml(z, portal)}</div>
  <div class="grid" style="align-content:start"><div class="card"><div class="card-h"><h3>${esc(z.nombre)}</h3></div><div class="card-b small"><div class="flex between"><span class="muted">Horario</span><b>${hm(z.horaIni * 60)} – ${hm(z.horaFin * 60)}</b></div><div class="flex between mt" style="margin-top:6px"><span class="muted">Precio</span><b>${z.precio ? eur(z.precio) : 'Gratuita'}</b></div><div class="flex between" style="margin-top:6px"><span class="muted">Fianza</span><b>${z.fianza ? eur(z.fianza) : '—'}</b></div><div class="flex between" style="margin-top:6px"><span class="muted">Aforo</span><b>${z.aforo} personas</b></div><p style="margin-bottom:0" class="muted">${esc(z.normas)}</p></div></div>
  ${portal ? `<div class="card"><div class="card-h"><h3>Mis próximas reservas</h3></div><div class="list">${mine.map(r => `<div class="li"><div class="ic">${ico('cal')}</div><div><div class="tt">${esc(S.zonas.find(x => x.id === r.zonaId)?.nombre)}</div><div class="ss">${fdate(r.fecha)} · ${hm(r.ini)}</div></div><div class="rr">${btn('cancelRes', 'Cancelar', { cls: 'sm ghost', id: r.id })}</div></div>`).join('') || '<div class="empty">No tienes reservas</div>'}</div></div>` : `<div class="card"><div class="card-h"><h3>Uso este mes</h3></div><div class="card-b">${hbars(S.zonas.filter(x => x.comId === c.id).map(x => ({ l: x.nombre, v: S.reservas.filter(r => r.zonaId === x.id && r.fecha.startsWith(curPeriod()) && r.estado === 'confirmada').length })), { fmt: n => n + ' reservas' })}</div></div>`}</div></div>`;
}
VIEWS.reservas = () => reservasView(false);
VIEWS['p-reservas'] = () => reservasView(true);

/* --- Juntas --- */
function juntaDetail(j, portal) {
  const c = com(); const us = unitsOf(c.id); const myU = portal ? me() : null;
  const pts = j.orden.map((o, idx) => {
    if (!o.mayoria) return `<div class="li"><div class="ic">${idx + 1}</div><div class="tt" style="font-weight:500">${esc(o.texto)}</div></div>`;
    const r = resultadoVoto(j, o); const T = Math.max(1, r.presentes); const cT = r.agg.si.c + r.agg.no.c + r.agg.abst.c || 1;
    const myV = myU ? o.votos[myU.id] : null;
    return `<div class="li" style="display:block"><div class="flex between wrap" style="gap:10px"><div class="flex" style="align-items:flex-start"><div class="ic">${idx + 1}</div><div><div class="tt" style="font-weight:500">${esc(o.texto)}</div><div class="ss">${esc(MAYORIAS[o.mayoria])}</div></div></div>
    ${portal ? (j.estado === 'convocada' && j.votacionOnline ? `<div class="seg">${['si', 'no', 'abst'].map(v => `<button class="${myV === v ? 'on' : ''}" data-act="vote" data-j="${j.id}" data-o="${o.id}" data-v="${v}">${{ si: 'A favor', no: 'En contra', abst: 'Abstención' }[v]}</button>`).join('')}</div>` : myV ? `<span class="badge b-brand">Tu voto: ${{ si: 'A favor', no: 'En contra', abst: 'Abstención' }[myV]}</span>` : '') : `<div class="flex">${r.presentes ? `<span class="badge ${r.aprobado ? 'b-good' : 'b-bad'}">${r.aprobado ? 'Se aprobaría' : 'No alcanza mayoría'}</span>` : ''}${btn('regVote', 'Registrar voto', { cls: 'sm', id: o.id, extra: `data-j="${j.id}"` })}</div>`}</div>
    ${r.presentes ? `<div style="margin:10px 0 0 44px"><div class="small muted" style="margin-bottom:4px">${r.presentes} de ${r.total} propietarios han votado · por cuotas: a favor ${NUM.format(r2(r.agg.si.c))} %, en contra ${NUM.format(r2(r.agg.no.c))} %</div><div class="vote-bar">${[['si', 'var(--good)', 'A favor'], ['no', 'var(--bad)', 'En contra'], ['abst', 'var(--muted)', 'Abst.']].map(([k, col, l]) => r.agg[k].n ? `<div style="width:${r.agg[k].n / T * 100}%;background:${col}" title="${l}: ${r.agg[k].n} votos, ${NUM.format(r2(r.agg[k].c))} % cuotas">${l} ${r.agg[k].n}</div>` : '').join('')}</div></div>` : ''}</div>`;
  }).join('');
  return `<div class="card"><div class="card-h"><div><h3>Junta General ${esc(j.tipo === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria')} · ${fdate(j.fecha)}</h3><div class="sub">1ª convocatoria ${esc(j.hora)} · 2ª convocatoria ${esc(j.hora2 || '')} · ${esc(j.lugar)}${j.votacionOnline ? ' · Votación online activa' : ''}</div></div>${badge({ borrador: ['Borrador', 'b-neutral'], convocada: ['Convocada', 'b-info'], celebrada: ['Celebrada', 'b-good'] }, j.estado)}</div>
  <div class="list">${pts}</div>
  ${!portal ? `<div class="card-b flex wrap" style="border-top:1px solid var(--line)">${btn('convocatoria', 'Generar convocatoria', { icon: 'file', id: j.id })}${btn('acta', j.acta ? 'Ver acta' : 'Generar acta', { icon: 'file', id: j.id })}${j.estado === 'convocada' ? btn('celebrar', 'Marcar como celebrada', { icon: 'check', id: j.id }) : ''}${btn('editJunta', 'Editar', { icon: 'edit', id: j.id, cls: 'ghost' })}</div>` : j.acta ? `<div class="card-b" style="border-top:1px solid var(--line)">${btn('acta', 'Ver acta', { icon: 'file', id: j.id })}</div>` : ''}</div>`;
}
function juntasView(portal) {
  const c = com(); const js = S.juntas.filter(j => j.comId === c.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const sel = js.find(j => j.id === UI.junta) || js.find(j => j.estado === 'convocada') || js[0];
  return head(portal ? 'Juntas y votaciones' : 'Juntas y votaciones', portal ? 'Consulta el orden del día y vota online' : 'Convocatorias, votación online con doble mayoría (propietarios y cuotas) y actas', portal ? '' : btn('editJunta', 'Convocar junta', { icon: 'plus', cls: 'primary' })) +
  (js.length ? `<div class="grid" style="grid-template-columns:280px 1fr"><div class="card"><div class="list">${js.map(j => `<div class="li row-click" data-act="selJunta" data-id="${j.id}" style="${j.id === sel.id ? 'background:var(--brand-soft)' : ''}"><div class="ic">${ico('gavel')}</div><div><div class="tt">${j.tipo === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria'}</div><div class="ss">${fdate(j.fecha)}</div></div><div class="rr">${badge({ borrador: ['Borrador', 'b-neutral'], convocada: ['Convocada', 'b-info'], celebrada: ['Celebrada', 'b-good'] }, j.estado)}</div></div>`).join('')}</div></div>${juntaDetail(sel, portal)}</div>` : '<div class="card empty">No hay juntas.</div>');
}
VIEWS.juntas = () => juntasView(false);
VIEWS['p-juntas'] = () => juntasView(true);

/* --- Comunicados --- */
function comunicadosView(portal) {
  const c = com(); const ns = S.comunicados.filter(n => n.comId === c.id).sort((a, b) => (b.fijado - a.fijado) || b.fecha.localeCompare(a.fecha)); const nU = unitsOf(c.id).length;
  return head(portal ? 'Tablón de anuncios' : 'Comunicados', portal ? '' : 'Publica avisos en el portal de los vecinos', portal ? '' : btn('newCom2', 'Nuevo comunicado', { icon: 'plus', cls: 'primary' })) +
  `<div class="grid">${ns.map(n => { const read = portal && n.leidos.includes(me().id); return `<div class="card"><div class="card-h"><div class="flex">${n.fijado ? '<span class="badge b-brand">📌 Fijado</span>' : ''}<span class="badge b-neutral">${esc(n.categoria)}</span><h3>${esc(n.titulo)}</h3></div><span class="small muted">${fdt(n.fecha)}</span></div><div class="card-b" style="white-space:pre-wrap">${esc(n.cuerpo)}</div><div class="card-b flex between" style="border-top:1px solid var(--line);padding:10px 16px">${portal ? (read ? '<span class="small muted">✓ Leído</span>' : btn('readNote', 'Marcar como leído', { cls: 'sm', id: n.id })) : `<span class="small muted">Leído por ${n.leidos.length} de ${nU} inmuebles</span><div class="flex">${btn('pinNote', n.fijado ? 'Desfijar' : 'Fijar', { cls: 'sm ghost', id: n.id })}${btn('delNote', 'Eliminar', { cls: 'sm ghost danger', id: n.id })}</div>`}</div></div>`; }).join('') || '<div class="card empty">Sin comunicados</div>'}</div>`;
}
VIEWS.comunicados = () => comunicadosView(false);
VIEWS['p-comunicados'] = () => comunicadosView(true);

/* --- Documentos --- */
function documentosView(portal) {
  const c = com(); let ds = S.documentos.filter(d => d.comId === c.id && (!portal || d.publico)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  return head('Documentos', portal ? 'Documentación compartida por la administración' : 'Repositorio documental de la comunidad', portal ? '' : `<label class="btn primary" style="cursor:pointer">${ico('up')}Subir documento<input type="file" id="docUp" hidden></label>`) +
  `<div class="card"><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Categoría</th><th>Fecha</th><th class="num">Tamaño</th>${portal ? '' : '<th>Visible en portal</th>'}<th></th></tr></thead><tbody>
  ${ds.map(d => `<tr><td><div class="flex">${ico('file')}<span class="strong">${esc(d.nombre)}</span></div></td><td><span class="badge b-neutral">${esc(d.categoria)}</span></td><td>${fdate(d.fecha)}</td><td class="num">${d.tam > 1048576 ? NUM.format(r2(d.tam / 1048576)) + ' MB' : Math.round(d.tam / 1024) + ' KB'}</td>${portal ? '' : `<td><button class="btn sm ghost" data-act="toggleDoc" data-id="${d.id}">${d.publico ? '<span class="badge b-good">Visible</span>' : '<span class="badge b-neutral">Privado</span>'}</button></td>`}<td style="text-align:right;white-space:nowrap">${d.data ? btn('dlDoc', 'Descargar', { cls: 'sm', id: d.id }) : '<span class="small muted">Ejemplo</span>'} ${portal ? '' : btn('delDoc', 'Eliminar', { cls: 'sm ghost danger', id: d.id })}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Sin documentos</td></tr>'}
  </tbody></table></div></div>`;
}
VIEWS.documentos = () => { AFTER.push(bindDocUp); return documentosView(false); };
VIEWS['p-documentos'] = () => documentosView(true);
function bindDocUp() {
  const inp = $('#docUp'); if (!inp) return;
  inp.onchange = () => { const f = inp.files[0]; if (!f) return;
    const save = data => formModal({ title: 'Nuevo documento', fields: [{ k: 'nombre', label: 'Nombre', value: f.name, req: true, full: true }, { k: 'categoria', label: 'Categoría', type: 'select', options: ['Actas', 'Estatutos', 'Seguros', 'Certificados', 'Contratos', 'Cuentas', 'Facturas', 'Otros'] }, { k: 'publico', label: 'Visible en el portal de propietarios', type: 'checkbox', value: true }],
      intro: data ? '' : `<p class="small muted" style="margin-top:0">El archivo pesa ${Math.round(f.size / 1024)} KB: se guardará la ficha del documento, pero solo se almacenan archivos de hasta 150 KB.</p>`,
      onSubmit: v => { S.documentos.push({ id: uid('f'), comId: UI.comId, nombre: v.nombre, categoria: v.categoria, fecha: todayISO(), tam: f.size, publico: v.publico, data }); touch('documentos'); log('Documento subido: ' + v.nombre); toast('Documento guardado'); } });
    if (f.size <= 150 * 1024) { const rd = new FileReader(); rd.onload = () => save(rd.result); rd.readAsDataURL(f); } else save(null);
  };
}

/* --- Informes --- */
VIEWS.informes = () => {
  const c = com(); const y = String(new Date().getFullYear());
  const ms = S.movimientos.filter(m => m.comId === c.id && m.fecha.startsWith(y));
  const by = {}; ms.forEach(m => { by[m.categoria] = by[m.categoria] || { i: 0, g: 0 }; if (m.importe > 0) by[m.categoria].i += m.importe; else by[m.categoria].g -= m.importe; });
  const ing = ms.filter(m => m.importe > 0).reduce((s, m) => s + m.importe, 0), gas = -ms.filter(m => m.importe < 0).reduce((s, m) => s + m.importe, 0);
  const rep = (t, d, act) => `<div class="card kpi"><div class="strong">${t}</div><div class="small muted" style="margin:4px 0 12px">${d}</div>${btn(act, 'Descargar', { cls: 'sm', icon: 'down' })}</div>`;
  return head('Informes', 'Documentos listos para la junta, el banco o la asesoría') +
  `<div class="grid g4">${rep('Estado de cuentas ' + y, 'Ingresos y gastos por partida, en formato para la junta', 'repCuentas')}${rep('Listado de propietarios', 'Censo con coeficientes, contacto y domiciliación', 'exportUnits')}${rep('Libro de recibos', 'Todos los recibos emitidos, con estado y cobro', 'exportRec')}${rep('Relación de deudores', 'Para incluir en la convocatoria (art. 16.2 LPH)', 'exportMor')}</div>
  <div class="card mt"><div class="card-h"><h3>Cuenta de resultados ${y} · ${esc(c.nombre)}</h3><span class="sub">Saldo inicial ${eur(c.saldoInicial)} · saldo actual ${eur(saldo(c.id))}</span></div><div class="table-wrap"><table><thead><tr><th>Partida</th><th class="num">Ingresos</th><th class="num">Gastos</th></tr></thead><tbody>${Object.entries(by).sort((a, b) => (b[1].i - a[1].i) || (b[1].g - a[1].g)).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v.i ? eur(v.i) : ''}</td><td class="num">${v.g ? eur(v.g) : ''}</td></tr>`).join('')}<tr><td class="strong">Total</td><td class="num strong up">${eur(ing)}</td><td class="num strong down">${eur(gas)}</td></tr><tr><td class="strong">Resultado</td><td colspan="2" class="num strong ${ing - gas >= 0 ? 'up' : 'down'}">${eur(ing - gas)}</td></tr></tbody></table></div></div>`;
};

/* --- Ajustes --- */
VIEWS.ajustes = () => {
  const c = com();
  const pl = Object.entries(PLANS).map(([k, p]) => `<div class="plan ${S.meta.plan === k ? 'cur' : ''}"><div class="flex between"><b>${p.nombre}</b>${S.meta.plan === k ? '<span class="badge b-brand">Plan actual</span>' : ''}</div><div class="price">${p.precio} <small>${p.per}</small></div><ul>${{ gratis: ['1 comunidad, hasta 20 inmuebles', 'Saldo y movimientos bancarios', 'Recibos y cobros', 'Incidencias y comunicados', 'Portal del propietario'], comunidad: ['Todo lo del plan Gratis', 'Remesas SEPA y morosidad', 'Presupuestos y derramas', 'Reservas de zonas comunes', 'Juntas con votación online', 'Documentos e informes'], gestoria: ['Todo lo del plan Comunidad', 'Hasta 40 comunidades en una cuenta', 'Asistente IA para gestores y vecinos', 'CRM de proveedores', 'Importación masiva desde otros programas', 'Soporte prioritario'] }[k].map(x => `<li>${x}</li>`).join('')}</ul>${S.meta.plan === k ? '' : btn('setPlan', 'Cambiar a ' + p.nombre, { id: k, cls: k === 'gestoria' ? 'primary' : '' })}</div>`).join('');
  return head('Ajustes y plan', 'Datos de la comunidad, suscripción y copias de seguridad') +
  `<div class="tabs">${[['com', 'Comunidad'], ['plan', 'Plan y facturación'], ['datos', 'Datos y copias']].map(([k, l]) => `<button class="${(UI.tab || 'com') === k ? 'on' : ''}" data-act="tab" data-id="${k}">${l}</button>`).join('')}</div>` +
  ({ com: `<div class="grid g2"><div class="card"><div class="card-h"><h3>Datos de ${esc(c.nombre)}</h3>${btn('editCom', 'Editar', { cls: 'sm', icon: 'edit', id: c.id })}</div><div class="card-b small">${[['CIF', c.cif + (nifValid(c.cif) ? '' : ' ⚠ revisar')], ['Dirección', `${c.direccion}, ${c.cp} ${c.ciudad}`], ['Banco', c.banco], ['IBAN', ibanFmt(c.iban) + (ibanValid(c.iban) ? ' ✓' : ' ⚠ no válido')], ['Identificador acreedor SEPA', sepaCreditorId(c.cif)], ['Presupuesto anual', eur(c.presupuestoAnual)], ['Día de vencimiento', 'Día ' + c.diaVencimiento + ' de cada mes'], ['Presidente', unit(c.presidente) ? unit(c.presidente).ref + ' · ' + unit(c.presidente).propietario.nombre : '—'], ['Saldo inicial', eur(c.saldoInicial)]].map(([k, v]) => `<div class="flex between" style="padding:7px 0;border-bottom:1px solid var(--line)"><span class="muted">${k}</span><b style="text-align:right">${esc(v)}</b></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Organización</h3>${btn('editOrg', 'Editar', { cls: 'sm', icon: 'edit' })}</div><div class="card-b small"><div class="flex between" style="padding:7px 0"><span class="muted">Nombre comercial</span><b>${esc(S.meta.org)}</b></div><p class="muted">El nombre aparece en recibos, certificados y en el portal de los propietarios.</p></div></div></div>`,
    plan: `<div class="plans">${pl}</div><p class="small muted mt">Precios orientativos sin IVA. El cambio de plan en esta versión es inmediato y no genera cargos.</p>`,
    datos: `<div class="grid g2"><div class="card"><div class="card-h"><h3>Copia de seguridad</h3></div><div class="card-b"><p class="muted small" style="margin-top:0">Exporta todos los datos en JSON para guardarlos o migrarlos. Puedes restaurarlos después en cualquier momento.</p><div class="flex wrap">${btn('backup', 'Exportar copia', { icon: 'down' })}<label class="btn" style="cursor:pointer">${ico('up')}Restaurar copia<input type="file" id="restoreIn" accept=".json,application/json" hidden></label></div></div></div>
    <div class="card"><div class="card-h"><h3>Zona de peligro</h3></div><div class="card-b"><p class="muted small" style="margin-top:0">Recarga los datos de demostración o empieza desde cero. No se puede deshacer.</p><div class="flex wrap">${btn('resetDemo', 'Recargar demo', { cls: 'danger' })}${btn('wipe', 'Borrar todos los datos', { cls: 'danger' })}</div></div></div></div>` })[UI.tab || 'com'];
};

/* --- Portal: inicio, recibos, incidencias --- */
VIEWS['p-inicio'] = () => {
  const c = com(); const u = me(); const rs = S.recibos.filter(r => r.unidadId === u.id);
  const pend = rs.filter(r => r.estado !== 'cobrado').sort((a, b) => a.vencimiento.localeCompare(b.vencimiento)); const d = deudaUnit(u.id);
  const fij = S.comunicados.filter(n => n.comId === c.id).sort((a, b) => (b.fijado - a.fijado) || b.fecha.localeCompare(a.fecha)).slice(0, 3);
  const j = S.juntas.find(j => j.comId === c.id && j.estado === 'convocada');
  const myInc = S.incidencias.filter(i => i.unidadId === u.id && i.estado !== 'resuelta');
  return head('Hola, ' + u.propietario.nombre.split(' ')[0], `${esc(u.ref)} · ${esc(c.nombre)}`, btn('newInc', 'Comunicar incidencia', { icon: 'plus', cls: 'primary' })) +
  `<div class="grid g4">${kpi('Estado de cuenta', d ? eur(d) : 'Al corriente', d ? 'Recibos vencidos pendientes' : 'No tienes recibos vencidos', d ? 'down' : 'up')}${kpi('Próximo recibo', pend[0] ? eur(pend[0].importe) : '—', pend[0] ? 'Vence ' + fdate(pend[0].vencimiento) : 'Sin recibos pendientes')}${kpi('Tu cuota mensual', eur(cuotaMensual(u)), 'Coeficiente ' + NUM.format(u.coef) + ' %')}${kpi('Mis incidencias abiertas', myInc.length)}</div>
  ${j && j.votacionOnline && hasFeat('juntas') ? `<div class="card mt" style="border-color:var(--brand)"><div class="card-b flex between wrap"><div class="flex">${ico('gavel', 22)}<div><b>Junta ${esc(j.tipo)} el ${fdate(j.fecha)} a las ${esc(j.hora)}</b><div class="small muted">La votación online está abierta. Tu voto cuenta con tu coeficiente.</div></div></div><a class="btn primary" href="#p-juntas">Votar ahora</a></div></div>` : ''}
  <div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Tablón de anuncios</h3><a class="small" href="#p-comunicados">Ver todo</a></div><div class="list">${fij.map(n => `<div class="li"><div class="ic">${ico('mega')}</div><div><div class="tt">${n.fijado ? '📌 ' : ''}${esc(n.titulo)}</div><div class="ss">${esc(n.cuerpo.slice(0, 110))}${n.cuerpo.length > 110 ? '…' : ''}</div></div></div>`).join('') || '<div class="empty">Sin anuncios</div>'}</div></div>
  <div class="card"><div class="card-h"><h3>Recibos pendientes</h3><a class="small" href="#p-recibos">Ver todos</a></div><div class="list">${pend.slice(0, 4).map(r => `<div class="li"><div class="ic">${ico('receipt')}</div><div><div class="tt">${esc(r.concepto)}</div><div class="ss">Vence ${fdate(r.vencimiento)}</div></div><div class="rr"><b>${eur(r.importe)}</b><div>${btn('pagar', 'Pagar', { cls: 'sm primary', id: r.id })}</div></div></div>`).join('') || '<div class="empty">Estás al corriente de pago 🎉</div>'}</div></div></div>`;
};
VIEWS['p-recibos'] = () => {
  const u = me(); const rs = S.recibos.filter(r => r.unidadId === u.id).sort((a, b) => b.vencimiento.localeCompare(a.vencimiento));
  return head('Mis recibos', `${esc(u.ref)} · ${u.propietario.domiciliado ? 'Domiciliados en ' + ibanFmt(u.propietario.iban).slice(0, 4) + ' ···· ' + ibanFmt(u.propietario.iban).slice(-4) : 'Pago por transferencia'}`, btn('certDeuda', 'Certificado de estar al corriente', { icon: 'file', id: u.id })) +
  `<div class="card"><div class="table-wrap"><table><thead><tr><th>Nº</th><th>Concepto</th><th>Vencimiento</th><th class="num">Importe</th><th>Estado</th><th></th></tr></thead><tbody>${rs.map(r => `<tr><td class="small muted">${esc(r.numero)}</td><td>${esc(r.concepto)}</td><td>${fdate(r.vencimiento)}</td><td class="num strong">${eur(r.importe)}</td><td>${badge(ESTADO_REC, r.estado)}</td><td style="text-align:right;white-space:nowrap">${r.estado !== 'cobrado' && r.estado !== 'remesado' ? btn('pagar', 'Pagar', { cls: 'sm primary', id: r.id }) : ''} ${btn('verRecibo', 'Ver', { cls: 'sm ghost', id: r.id })}</td></tr>`).join('')}</tbody></table></div></div>`;
};
VIEWS['p-incidencias'] = () => {
  const c = com(); const u = me(); const mine = S.incidencias.filter(i => i.comId === c.id && i.unidadId === u.id).sort((a, b) => b.fecha.localeCompare(a.fecha)); const comm = S.incidencias.filter(i => i.comId === c.id && i.unidadId !== u.id && i.estado !== 'resuelta');
  const row = i => `<div class="li row-click" data-act="incDetail" data-id="${i.id}"><div class="ic">${ico('wrench')}</div><div><div class="tt">${esc(i.titulo)}</div><div class="ss">${esc(i.numero)} · ${esc(i.zona)} · ${fdate(i.fecha.slice(0, 10))}</div></div><div class="rr">${badge(ESTADO_INC, i.estado)}</div></div>`;
  return head('Incidencias', 'Comunica averías y sigue su resolución en tiempo real', btn('newInc', 'Comunicar incidencia', { icon: 'plus', cls: 'primary' })) +
  `<div class="grid g2"><div class="card"><div class="card-h"><h3>Mis incidencias</h3></div><div class="list">${mine.map(row).join('') || '<div class="empty">No has comunicado incidencias</div>'}</div></div><div class="card"><div class="card-h"><h3>Otras incidencias en curso</h3><span class="sub">Antes de comunicar, comprueba que no esté ya avisada</span></div><div class="list">${comm.map(row).join('') || '<div class="empty">Ninguna</div>'}</div></div></div>`;
};

/* --- Asistente IA --- */
let SAMPLE; const CHAT = { log: [], busy: false };
VIEWS.asistente = () => {
  const portal = isPortal();
  const chips = portal ? ['¿Cuánto debo y cuándo vence mi próximo recibo?', '¿Cómo reservo la pista de pádel?', '¿Qué mayoría hace falta para instalar un cargador eléctrico?', 'Explícame qué es una derrama'] : ['Resume el estado financiero de la comunidad', '¿Quiénes son los morosos y cuánto deben?', 'Redacta un recordatorio de pago amable', '¿Qué incidencias urgentes hay y qué propones?', '¿Vamos a cumplir el presupuesto este año?', 'Redacta el comunicado de corte de agua del martes'];
  AFTER.push(() => { const l = $('#chatLog'); if (l) l.scrollTop = l.scrollHeight; const t = $('#chatIn'); t && t.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }); });
  return head('Asistente IA', portal ? 'Pregunta lo que quieras sobre tu vivienda y la comunidad' : 'Consulta los datos de la comunidad, redacta comunicados y resuelve dudas sobre la Ley de Propiedad Horizontal', CHAT.log.length ? btn('clearChat', 'Nueva conversación', { cls: 'ghost' }) : '') +
  `<div class="card chat"><div class="chat-log" id="chatLog">${CHAT.log.length ? CHAT.log.map(m => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${esc(m.content)}</div>`).join('') : `<div class="empty"><div style="display:inline-grid;place-items:center;width:48px;height:48px;border-radius:14px;background:var(--brand-soft);color:var(--brand)">${ico('spark', 22)}</div><h3 style="color:var(--text);margin:12px 0 4px">¿En qué te ayudo?</h3><div>El asistente consulta los datos reales de ${esc(com().nombre)} para responder.</div></div>`}</div>
  ${CHAT.log.length ? '' : `<div class="chips">${chips.map(c => `<button class="chip" data-act="chip">${esc(c)}</button>`).join('')}</div>`}
  <div class="chat-in"><textarea class="input" id="chatIn" placeholder="Escribe tu pregunta…" aria-label="Pregunta"></textarea><button class="btn primary" data-act="sendChat" ${CHAT.busy ? 'disabled' : ''}>${ico('send')}Enviar</button></div></div>`;
};
async function getSample() { if (SAMPLE !== undefined) return SAMPLE; try { SAMPLE = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (e) { SAMPLE = null; } return SAMPLE; }
function aiContext() {
  const c = com(); const portal = isPortal(); const y = new Date().getFullYear();
  const base = { hoy: todayISO(), comunidad: { nombre: c.nombre, direccion: c.direccion + ', ' + c.ciudad, inmuebles: unitsOf(c.id).length, presupuestoAnual: c.presupuestoAnual, diaVencimiento: c.diaVencimiento },
    zonas: S.zonas.filter(z => z.comId === c.id).map(z => ({ nombre: z.nombre, horario: hm(z.horaIni * 60) + '-' + hm(z.horaFin * 60), franjaMin: z.franja, precio: z.precio, fianza: z.fianza, normas: z.normas })),
    juntas: S.juntas.filter(j => j.comId === c.id && j.estado === 'convocada').map(j => ({ fecha: j.fecha, hora: j.hora, lugar: j.lugar, orden: j.orden.map(o => o.texto) })),
    comunicados: S.comunicados.filter(n => n.comId === c.id).slice(0, 5).map(n => ({ titulo: n.titulo, texto: n.cuerpo })) };
  if (portal) { const u = me(); return { ...base, rol: 'propietario', miVivienda: { ref: u.ref, coef: u.coef, cuotaMensual: cuotaMensual(u), deudaVencida: deudaUnit(u.id), recibosPendientes: S.recibos.filter(r => r.unidadId === u.id && r.estado !== 'cobrado').map(r => ({ concepto: r.concepto, importe: r.importe, vence: r.vencimiento })), misIncidencias: S.incidencias.filter(i => i.unidadId === u.id).map(i => ({ titulo: i.titulo, estado: i.estado })) } }; }
  const ser = serieMensual(c.id, 6); const b = S.presupuestos.find(p => p.comId === c.id && p.anio === y);
  return { ...base, rol: UI.role, saldoBanco: saldo(c.id), tasaCobro6m: Math.round(tasaCobro(c.id) * 1000) / 10, ingresosGastos6m: ser, deudaTotal: r2(morosos(c.id).reduce((s, m) => s + m.total, 0)), numMorosos: morosos(c.id).length,
    presupuesto: b ? b.partidas : null, gastoRealAnio: (() => { const o = {}; S.movimientos.filter(m => m.comId === c.id && m.importe < 0 && m.fecha.startsWith(String(y))).forEach(m => o[m.categoria] = r2((o[m.categoria] || 0) - m.importe)); return o; })(),
    incidenciasActivas: S.incidencias.filter(i => i.comId === c.id && i.estado !== 'resuelta').map(i => ({ numero: i.numero, titulo: i.titulo, prioridad: i.prioridad, estado: i.estado, proveedor: prov(i.proveedorId)?.nombre || null, diasAbierta: daysBetween(i.fecha.slice(0, 10), todayISO()) })),
    derramas: S.derramas.filter(d => d.comId === c.id).map(d => ({ concepto: d.concepto, total: d.total, plazos: d.plazos })) };
}
function aiTools() {
  const c = com(); const portal = isPortal();
  const t = [{ name: 'consultar_morosos', description: 'Lista de inmuebles con recibos vencidos impagados: piso, propietario, deuda total, nº recibos y fecha del más antiguo.', inputSchema: { type: 'object', properties: {} }, execute: () => morosos(c.id).slice(0, 40).map(m => { const u = unit(m.unidadId); return { piso: u.ref, propietario: u.propietario.nombre, telefono: u.propietario.tel, deuda: m.total, recibos: m.n, desde: m.masAntiguo }; }) },
    { name: 'buscar_propietario', description: 'Busca inmuebles por piso, nombre o email y devuelve su ficha (coeficiente, cuota, deuda, contacto).', inputSchema: { type: 'object', properties: { texto: { type: 'string' } }, required: ['texto'] }, execute: ({ texto }) => unitsOf(c.id).filter(u => (u.ref + ' ' + u.propietario.nombre + ' ' + u.propietario.email).toLowerCase().includes(String(texto).toLowerCase())).slice(0, 10).map(u => ({ piso: u.ref, tipo: u.tipo, propietario: u.propietario.nombre, email: u.propietario.email, tel: u.propietario.tel, coef: u.coef, cuotaMensual: cuotaMensual(u), deudaVencida: deudaUnit(u.id), domiciliado: u.propietario.domiciliado })) },
    { name: 'consultar_movimientos', description: 'Movimientos bancarios recientes, opcionalmente filtrados por categoría (p. ej. Limpieza, Electricidad, Reparaciones).', inputSchema: { type: 'object', properties: { categoria: { type: 'string' } } }, execute: ({ categoria } = {}) => movOf(c.id).filter(m => !categoria || m.categoria.toLowerCase().includes(String(categoria).toLowerCase())).slice(0, 40).map(m => ({ fecha: m.fecha, concepto: m.concepto, importe: m.importe, categoria: m.categoria })) },
    { name: 'crear_incidencia', description: 'Registra una nueva incidencia en la comunidad. Úsala solo si el usuario lo pide expresamente.', inputSchema: { type: 'object', properties: { titulo: { type: 'string' }, descripcion: { type: 'string' }, prioridad: { type: 'string', enum: ['baja', 'media', 'alta', 'urgente'] }, zona: { type: 'string' } }, required: ['titulo'] }, execute: ({ titulo, descripcion = '', prioridad = 'media', zona = 'General' }) => { const i = newIncidencia({ titulo, desc: descripcion, prioridad, zona }); return { creada: i.numero }; } }];
  return portal ? t.filter(x => x.name === 'crear_incidencia') : t;
}
async function sendChat(text) {
  const inp = $('#chatIn'); const q = (text || inp?.value || '').trim(); if (!q || CHAT.busy) return;
  const sample = await getSample();
  CHAT.log.push({ role: 'user', content: q }); CHAT.log.push({ role: 'assistant', content: 'Pensando…' }); CHAT.busy = true; render();
  const last = CHAT.log[CHAT.log.length - 1];
  if (!sample) { last.content = 'El asistente IA no está disponible en esta vista. Ábrelo desde claude.ai con la sesión iniciada para usarlo.'; CHAT.busy = false; render(); return; }
  const sys = `Eres el asistente de Comunia, una plataforma de gestión de comunidades de propietarios en España. Respondes en español, claro y conciso, sin Markdown pesado (puedes usar guiones para listas). Conoces la Ley 49/1960 de Propiedad Horizontal y explicas mayorías, derramas, fondos de reserva, morosidad, etc. ${isPortal() ? 'Hablas con un propietario: solo puedes hablar de SUS datos y de información general de la comunidad; nunca reveles deudas ni datos personales de otros vecinos.' : 'Hablas con la administración de la finca. Usa las herramientas para consultar datos concretos cuando haga falta.'} Si redactas un texto (comunicado, carta), entrégalo listo para copiar. No inventes cifras: usa solo los datos facilitados o las herramientas.\n\nDATOS ACTUALES (JSON):\n${JSON.stringify(aiContext())}`;
  const msgs = CHAT.log.slice(0, -1).filter(m => m.content !== 'Pensando…').map((m, i) => ({ role: m.role, content: i === 0 ? sys + '\n\nPREGUNTA DEL USUARIO:\n' + m.content : m.content }));
  try {
    const res = await sample(msgs, { cache: false, tools: aiTools(), onText: ({ text }) => { last.content = text || 'Pensando…'; const l = $('#chatLog'); if (l && l.lastElementChild) { l.lastElementChild.textContent = last.content; l.scrollTop = l.scrollHeight; } } });
    last.content = res.text || last.content; S.meta.iaUsada = (S.meta.iaUsada || 0) + 1;
  } catch (e) { last.content = e && e.code === 'rate_limited' ? 'Demasiadas consultas seguidas. Espera un momento y vuelve a intentarlo.' : e && e.code === 'not_granted' ? 'No se ha concedido permiso al asistente.' : 'No he podido responder ahora mismo. Inténtalo de nuevo.' + (e && e.text ? '\n\n' + e.text : ''); }
  CHAT.busy = false; render();
}
async function aiDraft(prompt, target) {
  const sample = await getSample(); if (!sample) { toast('La IA no está disponible en esta vista'); return; }
  if (!hasFeat('ia')) { toast('La redacción con IA está incluida en el plan Gestoría Pro'); return; }
  const el = typeof target === 'string' ? $(target) : target; const orig = el.value; el.value = 'Redactando…'; el.disabled = true;
  try { const r = await sample(prompt + '\n\nDevuelve únicamente el texto final, sin comentarios ni Markdown.', { cache: false, onText: ({ text }) => { if (text) el.value = text; } }); el.value = r.text; }
  catch (e) { el.value = orig; toast('No se pudo redactar ahora'); }
  el.disabled = false;
}
