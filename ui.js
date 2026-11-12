/* ===== Comunia · componentes de interfaz ===== */
'use strict';
const IC = {
  panel: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  build: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  receipt: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-1 .7-3-2-3 2-3-2-3 2-3-2zM8 8h8M8 12h8M8 16h5"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  bank: '<path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-7 10 7z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  gavel: '<path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10M16 16l6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>',
  mega: '<path d="m3 11 18-5v12L3 14zM11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  report: '<path d="M21.2 15.9A10 10 0 1 1 8 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  spark: '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  up: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>', check: '<path d="M20 6 9 17l-5-5"/>', copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>', chev: '<path d="m6 9 6 6 6-6"/>', lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/>'
};
const ico = (k, s = 17) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k] || ''}</svg>`;

function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3800); }

/* ---------- Modales ---------- */
function openModal({ title, body, foot = '', wide = false, onOpen }) {
  closeModal();
  const o = document.createElement('div'); o.className = 'overlay'; o.id = 'overlay';
  o.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-h"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Cerrar">${ico('x')}</button></div><div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
  o.addEventListener('mousedown', e => { if (e.target === o) closeModal(); });
  o.querySelector('[data-close]').onclick = closeModal;
  document.body.appendChild(o);
  onOpen && onOpen(o);
  const f = o.querySelector('input:not([type=hidden]),select,textarea'); f && f.focus();
  return o;
}
function closeModal() { const o = $('#overlay'); o && o.remove(); }
function fieldHtml(f) {
  const id = 'f_' + f.k; const v = f.value ?? '';
  let inp;
  if (f.type === 'select') inp = `<select class="select" id="${id}" name="${f.k}">${f.options.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
  else if (f.type === 'textarea') inp = `<textarea class="input" id="${id}" name="${f.k}" rows="${f.rows || 4}" style="width:100%">${esc(v)}</textarea>`;
  else if (f.type === 'checkbox') return `<div class="field ${f.full ? 'full' : ''}"><label class="check" style="font-weight:500"><input type="checkbox" name="${f.k}" ${v ? 'checked' : ''}> ${esc(f.label)}</label></div>`;
  else inp = `<input class="input" id="${id}" name="${f.k}" type="${f.type || 'text'}" value="${esc(v)}" ${f.step ? `step="${f.step}"` : ''} ${f.min != null ? `min="${f.min}"` : ''} ${f.req ? 'required' : ''} placeholder="${esc(f.ph || '')}">`;
  return `<div class="field ${f.full ? 'full' : ''}"><label for="${id}">${esc(f.label)}${f.req ? ' *' : ''}</label>${inp}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}<div class="err" data-err="${f.k}"></div></div>`;
}
function formModal({ title, fields, submit = 'Guardar', onSubmit, wide, extraFoot = '', intro = '' }) {
  const o = openModal({ title, wide, body: `${intro}<form class="form" id="mform" novalidate>${fields.map(fieldHtml).join('')}</form>`, foot: `${extraFoot}<button class="btn" data-close2>Cancelar</button><button class="btn primary" data-submit>${esc(submit)}</button>` });
  o.querySelector('[data-close2]').onclick = closeModal;
  const go = () => {
    const vals = {}; const form = $('#mform');
    fields.forEach(f => { const el = form.elements[f.k]; if (!el) return; vals[f.k] = f.type === 'checkbox' ? el.checked : f.type === 'number' ? (el.value === '' ? null : +el.value) : el.value.trim(); });
    $$('[data-err]', form).forEach(e => e.textContent = '');
    let bad = false;
    fields.forEach(f => { if (f.req && (vals[f.k] === '' || vals[f.k] == null)) { $(`[data-err="${f.k}"]`, form).textContent = 'Obligatorio'; bad = true; } });
    if (bad) return;
    const res = onSubmit(vals);
    if (res && typeof res === 'object' && res.err) { Object.entries(res.err).forEach(([k, m]) => { const e = $(`[data-err="${k}"]`, form); if (e) e.textContent = m; else toast(m); }); return; }
    if (res !== false) { closeModal(); render(); }
  };
  o.querySelector('[data-submit]').onclick = go;
  o.querySelector('form').addEventListener('submit', e => { e.preventDefault(); go(); });
  return o;
}
function confirmModal(title, msg, okLabel, fn, danger = true) {
  const o = openModal({ title, body: `<p style="margin:0">${msg}</p>`, foot: `<button class="btn" data-close2>Cancelar</button><button class="btn ${danger ? 'primary' : 'primary'}" data-ok style="${danger ? 'background:var(--bad);border-color:var(--bad);color:#fff' : ''}">${esc(okLabel)}</button>` });
  o.querySelector('[data-close2]').onclick = closeModal;
  o.querySelector('[data-ok]').onclick = () => { fn(); closeModal(); render(); };
}

/* ---------- Descargas ---------- */
let DL = null;
async function download(filename, data, previewText) {
  try {
    if (!DL && window.claude && window.claude.use) DL = await window.claude.use('downloads');
  } catch (e) { DL = null; }
  if (DL) {
    try { await DL.save({ filename, data }); toast('Archivo listo: ' + filename); return; }
    catch (e) { if (e && e.code === 'declined') return; if (e && e.code === 'rate_limited') { toast('Ya hay una descarga pendiente de confirmar.'); return; } }
  }
  if (!window.claude) { // fuera de Claude (Vercel, local): descarga normal del navegador
    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: filename.endsWith('.csv') ? 'text/csv' : filename.endsWith('.html') ? 'text/html' : filename.endsWith('.json') ? 'application/json' : 'text/plain' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast('Descargado: ' + filename); return;
    } catch (e) { }
  }
  const text = previewText ?? (typeof data === 'string' ? data : null);
  if (text != null) {
    const o = openModal({ title: 'Copiar contenido · ' + filename, wide: true, body: `<p class="muted small" style="margin-top:0">La descarga directa no está disponible en esta vista. Copia el contenido y guárdalo como <b>${esc(filename.replace(/\.zip$/, '.xml'))}</b>.</p><textarea class="input" style="width:100%;height:340px;font-family:ui-monospace,monospace;font-size:12px" readonly>${esc(text)}</textarea>`, foot: `<button class="btn primary" data-cp>${ico('copy')} Copiar</button>` });
    o.querySelector('[data-cp]').onclick = async () => { try { await navigator.clipboard.writeText(text); toast('Copiado al portapapeles'); } catch (e) { o.querySelector('textarea').select(); toast('Selecciona y copia con Ctrl+C'); } };
  } else toast('La descarga no está disponible en esta vista.');
}
const csv = rows => '﻿' + rows.map(r => r.map(c => { const s = String(c ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
// ZIP sin compresión (para entregar el XML SEPA)
function crc32(buf) { let c, crc = 0xFFFFFFFF; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xFFFFFFFF) >>> 0; }
function zipOne(name, text) {
  const enc = new TextEncoder(); const data = enc.encode(text); const fn = enc.encode(name); const crc = crc32(data);
  const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, fn.length, true);
  const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, fn.length, true);
  const off = 30 + fn.length + data.length; const cdSize = 46 + fn.length;
  const end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, 1, true); end.setUint16(10, 1, true); end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
  return new Blob([lh, fn, data, ch, fn, end]);
}

/* ---------- Gráficos (SVG, con tooltip) ---------- */
function barChart(id, data, series, { h = 220, fmt = eur } = {}) {
  const W = 640, H = h, pl = 56, pr = 8, pt = 10, pb = 26; const iw = W - pl - pr, ih = H - pt - pb;
  const max = Math.max(1, ...data.flatMap(d => series.map(s => d[s.k]))); const nice = niceMax(max);
  const gw = iw / data.length; const bw = Math.min(26, (gw - 14) / series.length - 2);
  let g = '';
  for (let i = 0; i <= 4; i++) { const y = pt + ih - ih * i / 4; g += `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/><text x="${pl - 8}" y="${y + 4}" text-anchor="end">${fmtShort(nice * i / 4)}</text>`; }
  let bars = '';
  data.forEach((d, i) => {
    const gx = pl + gw * i + (gw - (bw + 2) * series.length) / 2;
    series.forEach((s, j) => { const v = d[s.k]; const bh = Math.max(v > 0 ? 2 : 0, ih * v / nice); const x = gx + j * (bw + 2), y = pt + ih - bh; bars += `<path d="M${x},${pt + ih} V${y + Math.min(4, bh)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${pt + ih} z" fill="${s.c}"/>`; });
    bars += `<rect x="${pl + gw * i}" y="${pt}" width="${gw}" height="${ih}" fill="transparent" data-i="${i}"/>`;
    g += `<text x="${pl + gw * i + gw / 2}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  setTimeout(() => {
    const root = document.getElementById(id); if (!root) return; const tip = root.querySelector('.tip');
    root.querySelectorAll('rect[data-i]').forEach(r => {
      r.addEventListener('mousemove', e => { const d = data[+r.dataset.i]; tip.innerHTML = `<b>${esc(d.tip || d.label)}</b>` + series.map(s => `<div class="flex"><i style="width:8px;height:8px;border-radius:2px;background:${s.c};display:inline-block"></i>${esc(s.n)}: <b style="display:inline;margin:0">${fmt(d[s.k])}</b></div>`).join(''); tip.style.display = 'block'; const bb = root.getBoundingClientRect(); let x = e.clientX - bb.left + 12; if (x > bb.width - 170) x -= 190; tip.style.left = x + 'px'; tip.style.top = (e.clientY - bb.top - 10) + 'px'; r.setAttribute('fill', 'rgba(127,127,127,.06)'); });
      r.addEventListener('mouseleave', () => { tip.style.display = 'none'; r.setAttribute('fill', 'transparent'); });
    });
  });
  return `<div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de barras"><g class="axis">${g}</g>${bars}</svg><div class="tip"></div></div>`;
}
function niceMax(m) { const p = Math.pow(10, Math.floor(Math.log10(m))); const n = m / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function fmtShort(n) { return n >= 1e6 ? NUM.format(r2(n / 1e6)) + ' M€' : n >= 1e3 ? NUM.format(Math.round(n / 100) / 10) + ' k€' : NUM.format(Math.round(n)) + ' €'; }
const legend = series => `<div class="legend">${series.map(s => `<span><i style="background:${s.c}"></i>${esc(s.n)}</span>`).join('')}</div>`;
function hbars(rows, { color = 'var(--s1)', fmt = eur } = {}) {
  const max = Math.max(1, ...rows.map(r => Math.max(r.v, r.ref || 0)));
  return rows.map(r => `<div class="bar-row" title="${esc(r.l)}: ${fmt(r.v)}${r.ref != null ? ' de ' + fmt(r.ref) : ''}"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.l)}</div><div class="bar-track">${r.ref != null ? `<div class="bar-fill" style="width:${r.ref / max * 100}%;background:var(--line-2)"></div>` : ''}<div class="bar-fill" style="width:${r.v / max * 100}%;background:${r.over ? 'var(--bad)' : color}"></div></div><div class="num" style="text-align:right;font-variant-numeric:tabular-nums">${fmt(r.v)}</div></div>`).join('');
}
