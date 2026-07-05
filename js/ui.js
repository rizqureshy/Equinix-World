/* ============================================================
   Deal Command Center — UI toolkit
   el() builder · tooltips · toasts · modals · command palette ·
   guided tour spotlight
   ============================================================ */
'use strict';

(function () {
  /* ---------- element builder ---------- */
  // el('div.card.reveal', {onclick: fn, 'data-tip': '...'}, child, child...)
  function el(spec, attrs, ...kids) {
    const [tag, ...classes] = spec.split('.');
    const node = document.createElement(tag || 'div');
    if (classes.length) node.className = classes.join(' ');
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null) continue;
        if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else node.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return node;
  }

  /* ---------- tooltip singleton ---------- */
  let tipEl = null, tipTimer = null;
  function initTips() {
    tipEl = el('div.tooltip');
    document.body.appendChild(tipEl);
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-tip]');
      if (!t) return;
      clearTimeout(tipTimer);
      tipTimer = setTimeout(() => showTip(t), 380);
    });
    document.addEventListener('pointerout', e => {
      if (e.target.closest('[data-tip]')) { clearTimeout(tipTimer); hideTip(); }
    });
    document.addEventListener('pointerdown', () => { clearTimeout(tipTimer); hideTip(); }, true);
  }
  function showTip(target) {
    const text = target.getAttribute('data-tip');
    if (!text || !target.isConnected) return;
    tipEl.textContent = text;
    tipEl.classList.add('on');
    const r = target.getBoundingClientRect();
    const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - tw - 8));
    let y = r.top - th - 9;
    if (y < 8) { y = r.bottom + 9; tipEl.classList.add('below'); } else tipEl.classList.remove('below');
    tipEl.style.left = x + 'px';
    tipEl.style.top = y + 'px';
  }
  function hideTip() { if (tipEl) tipEl.classList.remove('on'); }

  /* ---------- toasts ---------- */
  let toastHost = null;
  function toast(msg, kind) {
    if (!toastHost) { toastHost = el('div.toast-host'); document.body.appendChild(toastHost); }
    const t = el('div.toast' + (kind ? '.' + kind : ''), { text: msg });
    toastHost.appendChild(t);
    requestAnimationFrame(() => t.classList.add('on'));
    setTimeout(() => {
      t.classList.remove('on');
      setTimeout(() => t.remove(), 350);
    }, 2600);
  }

  /* ---------- modal ---------- */
  function modal(title, bodyNode, actions) {
    const close = () => {
      wrap.classList.remove('on');
      setTimeout(() => wrap.remove(), 250);
      document.removeEventListener('keydown', onKey);
    };
    const onKey = e => { if (e.key === 'Escape') close(); };
    const card = el('div.modal-card',
      null,
      el('div.modal-head', null,
        el('div.modal-title', { text: title }),
        el('button.icon-btn', { 'aria-label': 'Close', html: '&times;', onclick: close })
      ),
      el('div.modal-body', null, bodyNode),
      actions && actions.length
        ? el('div.modal-foot', null, actions.map(a =>
            el('button.btn' + (a.primary ? '.primary' : '') + (a.danger ? '.danger' : ''), {
              text: a.label,
              onclick: () => { const keep = a.onClick && a.onClick(); if (!keep) close(); }
            })))
        : null
    );
    const wrap = el('div.modal-wrap', { onclick: e => { if (e.target === wrap) close(); } }, card);
    document.body.appendChild(wrap);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => wrap.classList.add('on'));
    const f = card.querySelector('input, textarea, select, button.primary');
    if (f) setTimeout(() => f.focus(), 120);
    return { close, card };
  }

  function confirmModal(title, message, onYes, yesLabel) {
    modal(title, el('p.modal-msg', { text: message }), [
      { label: 'Cancel' },
      { label: yesLabel || 'Delete', danger: true, onClick: onYes }
    ]);
  }

  /* ---------- command palette ---------- */
  let palette = null;
  function openPalette(commands) {
    if (palette) { palette.remove(); palette = null; }
    let idx = 0, filtered = commands;

    const input = el('input.pal-input', { placeholder: 'Type a command or deal name…', 'aria-label': 'Command' });
    const list = el('div.pal-list');
    const wrap = el('div.pal-wrap', { onclick: e => { if (e.target === wrap) closePal(); } },
      el('div.pal-card', null,
        el('div.pal-head', null, input, el('span.pal-hint', { text: 'esc' })),
        list));

    function closePal() {
      wrap.classList.remove('on');
      setTimeout(() => wrap.remove(), 200);
      document.removeEventListener('keydown', onKey, true);
      palette = null;
    }
    function run(cmd) { closePal(); setTimeout(() => cmd.run(), 80); }
    function renderList() {
      list.innerHTML = '';
      filtered.slice(0, 12).forEach((c, i) => {
        list.appendChild(el('div.pal-item' + (i === idx ? '.sel' : ''), {
          onclick: () => run(c),
          onpointerenter: ev => { idx = i; renderList(); }
        },
          el('span.pal-kind', { text: c.kind || '' }),
          el('span.pal-label', { text: c.label }),
          c.meta ? el('span.pal-meta', { text: c.meta }) : null
        ));
      });
      if (!filtered.length) list.appendChild(el('div.pal-empty', { text: 'No matches' }));
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); closePal(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, Math.min(filtered.length, 12) - 1); renderList(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); renderList(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (filtered[idx]) run(filtered[idx]); }
    }
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      filtered = !q ? commands : commands.filter(c =>
        (c.label + ' ' + (c.kind || '') + ' ' + (c.meta || '')).toLowerCase().includes(q));
      idx = 0; renderList();
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
    palette = wrap;
    renderList();
    requestAnimationFrame(() => { wrap.classList.add('on'); input.focus(); });
  }

  /* ---------- guided tour ---------- */
  function tour(steps, onDone) {
    let i = 0;
    const shade = el('div.tour-shade');
    const box = el('div.tour-box');
    const card = el('div.tour-card');
    document.body.append(shade, box, card);

    function place() {
      const st = steps[i];
      if (st.before) st.before();
      // allow the view to render before measuring
      setTimeout(() => {
        const t = document.querySelector(st.sel);
        const r = t ? t.getBoundingClientRect() : { left: innerWidth / 2 - 30, top: innerHeight / 2 - 30, width: 60, height: 60 };
        box.style.cssText = `left:${r.left - 8}px;top:${r.top - 8}px;width:${r.width + 16}px;height:${r.height + 16}px;`;
        card.innerHTML = '';
        card.append(
          el('div.tour-step', { text: (i + 1) + ' / ' + steps.length }),
          el('div.tour-title', { text: st.title }),
          el('div.tour-body', { text: st.body }),
          el('div.tour-nav', null,
            el('button.btn.ghost', { text: 'Skip tour', onclick: end }),
            el('button.btn.primary', { text: i === steps.length - 1 ? 'Done' : 'Next', onclick: next }))
        );
        let cx = r.left, cy = r.bottom + 14;
        if (cy + 190 > innerHeight) cy = Math.max(14, r.top - 190);
        cx = Math.max(14, Math.min(cx, innerWidth - 360));
        card.style.left = cx + 'px';
        card.style.top = cy + 'px';
        shade.classList.add('on'); box.classList.add('on'); card.classList.add('on');
      }, st.wait || 120);
    }
    function next() { i++; i >= steps.length ? end() : place(); }
    function end() {
      [shade, box, card].forEach(n => { n.classList.remove('on'); setTimeout(() => n.remove(), 300); });
      if (onDone) onDone();
    }
    place();
  }

  /* ---------- misc ---------- */
  function copyText(text, okMsg) {
    const done = () => toast(okMsg || 'Copied to clipboard', 'good');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = el('textarea', { style: { position: 'fixed', opacity: '0' } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed', 'bad'); }
      ta.remove();
    }
  }

  window.DCC = window.DCC || {};
  DCC.UI = { el, initTips, hideTip, toast, modal, confirmModal, openPalette, tour, copyText };
})();
