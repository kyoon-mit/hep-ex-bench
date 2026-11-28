/* Agentic LIGO benchmark monitor: three views (scores, datasets, models) and the reference
   text. Published runs come from runs.json; a viewer can also open a results file from their
   own computer, which is read in the browser and never uploaded. */
'use strict';
(() => {
  const app = document.getElementById('app');
  if (!app) return;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? +v : NaN);
  const str = v => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');
  const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const fmt = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '–').replace('-', '−');
  const pct = x => (Number.isFinite(x) ? `${fmt(x * 100)} %` : '–');
  const icon = {
    db: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    wave: '<svg viewBox="0 0 24 24"><path d="M2 12h3l2-6 3 12 3-9 2 5 2-2h5"/></svg>',
    toy: '<svg viewBox="0 0 24 24"><path d="M4 18c3-9 5-13 8-13s5 4 8 13"/><path d="M3 20h18"/></svg>',
    term: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  };

  // ---------------------------------------------------------------- data from the reference text
  const PILL = {
    documented: '<span class="pill pill--sage">documented</span>',
    sealed: '<span class="pill pill--lav">sealed</span>',
    training: '<span class="pill pill--sky">training</span>',
    heldout: '<span class="pill pill--olive">test only</span>',
    planned: '<span class="pill pill--quiet">planned</span>',
  };
  const DATASETS = [
    { kind: 'data', icon: 'db', name: 'Training injections', code: 'O3a · injections', pill: 'documented',
      desc: 'From the first half of the run. Where every signal is, and what it is, is documented.',
      rows: [['Half of the run', 'First (O3a)'], ['Signals', 'The 39 training waveforms, at documented times.']] },
    { kind: 'data', icon: 'db', name: 'Training noise', code: 'O3a · no signals', pill: 'documented',
      desc: 'From the first half of the run, with no injected signals.',
      rows: [['Half of the run', 'First (O3a)'], ['Signals', 'None.']] },
    { kind: 'data', icon: 'lock', name: 'Test injections', code: 'O3b · injections', pill: 'sealed',
      desc: 'From the second half of the run. The signals are hidden, and the GPS times are shifted by a secret amount.',
      rows: [['Half of the run', 'Second (O3b)'], ['Signals', 'The same 39 waveforms plus five classes the agent never sees in training; all hidden.'], ['Against gaming', 'The GPS times are shifted by a secret amount.']] },
    { kind: 'data', icon: 'lock', name: 'Test noise', code: 'O3b · no signals', pill: 'sealed',
      desc: 'From the second half of the run. The search also runs here, to check that its false-alarm rates are honest.',
      rows: [['Half of the run', 'Second (O3b)'], ['Signals', 'None.'], ['Used for', 'The honesty check: the number of triggers below each false-alarm rate must agree with what the claimed rates predict.']] },
    { kind: 'signals', icon: 'wave', name: 'Sine-Gaussians', code: '19 waveforms', pill: 'training',
      desc: 'A sine wave under a bell-shaped envelope.' },
    { kind: 'signals', icon: 'wave', name: 'White-noise bursts', code: '16 waveforms', pill: 'training',
      desc: 'A short burst of random noise in a frequency band.' },
    { kind: 'signals', icon: 'wave', name: 'Binary black holes', code: '4 waveforms', pill: 'training',
      desc: 'Mergers on circular orbits.' },
    { kind: 'signals', icon: 'wave', name: 'Held-out classes', code: '5 classes', pill: 'heldout',
      desc: 'Signal classes the agent never sees in training. They are reported separately from the training classes.' },
    { kind: 'toy', icon: 'toy', name: 'LIGO toy task', code: 'not built yet', pill: 'planned',
      desc: 'Simulated Gaussian noise in two detectors, with simple injected bursts and chirps. No real LIGO strain.',
      rows: [['Holds', 'Simulated Gaussian noise in two detectors, with simple injected bursts and chirps. No sizes are set.'],
        ['Hands in', 'The same trigger list as the real task: a CSV file with start GPS time, end GPS time and false-alarm rate (Hz).'],
        ['Purpose', 'Checks the scoring and the cheating submissions on data with no real LIGO strain, before the real task.'],
        ['Status', 'Planned as the first pull request. It will be a task in the repository; its name is not chosen.']],
      link: ['Design note, section 8', 'https://github.com/kyoon-mit/agentic-ligo/blob/ligo-benchmarks/docs/LIGO_BENCHMARKS_DESIGN.md#8-plan'] },
  ];
  const SIGNAL_ROWS = d => [['Waveforms', d.code], ['Duration', 'Under 10 s, added to the strain.'],
    ['Where', d.pill === 'heldout' ? 'The sealed test set only.' : 'Training data and the sealed test set.']];
  const SEARCHES = [
    { name: 'Excess power', desc: 'An excess-power search.' },
    { name: '1D convolutional network', desc: 'A small one-dimensional convolutional network on whitened 1 s windows.' },
    { name: 'Noise-only autoencoder', desc: 'An autoencoder trained on noise only.' },
  ];
  const HARNESSES = [
    { name: 'Claude Code', note: 'Has a run script. The run record adds its permission mode.' },
    { name: 'Codex', note: 'Has a run script. The run record adds its reasoning effort, approval and sandbox settings.' },
    { name: 'opencode', note: 'Has a run script.' },
  ];

  // ---------------------------------------------------------------- drawer and views
  const drawer = $('drawer'), dbody = $('drawer-body');
  const pages = [...document.querySelectorAll('.page')];
  const rail = [...document.querySelectorAll('.rail__item')];
  let currentPage = null;
  function route() {
    const want = (location.hash || '#scores').slice(1);
    if (!pages.some(p => p.dataset.page === want) && currentPage) return false;
    const name = pages.some(p => p.dataset.page === want) ? want : 'scores';
    currentPage = name;
    pages.forEach(p => { p.hidden = p.dataset.page !== name; });
    rail.forEach(a => { if (a.dataset.view === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = `${name[0].toUpperCase() + name.slice(1)} · Agentic LIGO benchmark monitor`;
    return true;
  }
  window.addEventListener('hashchange', () => {
    const wasOpen = !drawer.hidden;
    if (wasOpen) closeDrawer(false);
    if (route() || wasOpen) { $('view').focus({ preventScroll: true }); window.scrollTo(0, 0); }
  });
  document.querySelector('.skip').addEventListener('click', e => { e.preventDefault(); $('view').focus(); });

  const behind = [document.querySelector('.top'), document.querySelector('.rail'), $('view'), document.querySelector('.skip')];
  let lastFocus = null;
  function openDrawer(html, from) {
    lastFocus = from || document.activeElement;
    dbody.innerHTML = html;
    drawer.hidden = false;
    behind.forEach(el => { if (el) el.inert = true; });
    drawer.querySelector('.drawer__x').focus();
  }
  function closeDrawer(refocus = true) {
    drawer.hidden = true;
    behind.forEach(el => { if (el) el.inert = false; });
    if (refocus && lastFocus && document.contains(lastFocus) && lastFocus.offsetParent !== null) lastFocus.focus();
  }
  drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDrawer(); });
  route();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });

  // ---------------------------------------------------------------- datasets
  const accent = { data: 'var(--sky)', signals: 'var(--lav)', toy: 'var(--olive)' };
  function dsTile(d, i) {
    return `<button type="button" class="tile" data-ds="${i}" aria-labelledby="ds-t${i}" aria-describedby="ds-d${i}" style="--accent:${accent[d.kind]}">
      <span class="tile__top"><span class="tile__icon" aria-hidden="true">${icon[d.icon]}</span>
        <span class="tile__title"><b id="ds-t${i}">${esc(d.name)}</b><code>${esc(d.code)}</code></span>${PILL[d.pill]}</span>
      <span class="tile__desc" id="ds-d${i}">${esc(d.desc)}</span></button>`;
  }
  function dsDetail(d) {
    const rows = [['About', d.desc], ...(d.kind === 'signals' ? SIGNAL_ROWS(d) : d.rows || [])];
    return `<div class="tile__top" style="--accent:${accent[d.kind]}"><span class="tile__icon" aria-hidden="true">${icon[d.icon]}</span>
      <div class="tile__title"><h2 id="drawer-title">${esc(d.name)}</h2><code>${esc(d.code)}</code></div>${PILL[d.pill]}</div>
      <dl class="facts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${d.link ? `<div class="card__tools" style="margin-left:0"><a class="btn" href="${d.link[1]}">${esc(d.link[0])} ↗</a></div>` : ''}`;
  }
  const dgrid = $('d-grid');
  function showDatasets(kind) {
    dgrid.innerHTML = DATASETS.map((d, i) => (kind === 'all' || d.kind === kind ? dsTile(d, i) : '')).join('');
  }
  dgrid.addEventListener('click', e => { const t = e.target.closest('[data-ds]'); if (t) openDrawer(dsDetail(DATASETS[+t.dataset.ds]), t); });
  $('d-filter').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $('d-filter').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    showDatasets(b.dataset.kind);
  });
  showDatasets('all');

  // ---------------------------------------------------------------- models
  $('m-search').innerHTML = SEARCHES.map(s => `<div class="tile tile--static" style="--accent:var(--olive)">
    <span class="tile__top"><span class="tile__icon" aria-hidden="true">${icon.search}</span><span class="tile__title"><b>${esc(s.name)}</b><code>reference search</code></span><span class="pill pill--olive">toy, frozen</span></span>
    <span class="tile__desc">${esc(s.desc)}</span></div>`).join('');
  $('m-harness').innerHTML = HARNESSES.map(h => `<div class="tile tile--static" style="--accent:var(--sage)">
    <span class="tile__top"><span class="tile__icon" aria-hidden="true">${icon.term}</span><span class="tile__title"><b>${esc(h.name)}</b><code>command-line coding tool</code></span></span>
    <span class="tile__desc">${esc(h.note)}</span></div>`).join('');

  // ---------------------------------------------------------------- leaderboard
  const board = $('b-board'), kindSeg = $('b-kind'), splitSeg = $('b-split'), thrNote = $('b-thr'), src = $('b-src'), err = $('b-err'), file = $('b-file');
  const RATES = [['hour', 3600], ['day', 86400], ['week', 604800], ['year', 31557600], ['10 years', 315576000]];
  function rateText(v) {
    const r = num(v);
    if (!(r > 0) || !Number.isFinite(r)) return '';
    const hit = RATES.find(([, s]) => Math.abs(r * s - 1) < 0.01);
    return hit ? `1 per ${hit[0]}` : `${r.toExponential(2).replace('-', '−')} Hz`;
  }
  const isFake = r => str(r.kind) === 'fake';
  const sens = r => num(obj(r.sensitivity).overall);
  const nameOf = r => str(r.model) || str(r.id) || '?';
  const honesty = r => { const p = obj(r.far_honesty).pass; return p === true ? 'pass' : p === false ? 'fail' : null; };
  const faint = r => { const f = obj(r.faint_check).flagged; return f === true ? 'flag' : f === false ? 'clear' : null; };
  const flagged = r => honesty(r) === 'fail' || faint(r) === 'flag';
  const splitOf = r => (str(r.split) === 'train' ? 'train' : str(r.split) === 'test' ? 'test' : 'other');
  const SPLIT = { test: 'Test', train: 'Training', other: 'Other' };
  const mins = sec => (!Number.isFinite(sec) ? '–' : sec < 120 ? `${Math.round(sec)} s` : `${Math.round(sec / 60)} min`);
  const KIND = { agent: 'agent', reference: 'reference search', fake: 'scorer test' };
  let published = { thr: null, runs: [] }, failed = false, loaded = false, current = published, label = null, view = 'board', split = null;

  function setStatus(t) { $('status').textContent = t; }
  function checks(r) {
    const h = honesty(r), f = faint(r), out = [];
    out.push(h === 'pass' ? '<span class="pill pill--sage">rates honest</span>' : h === 'fail' ? '<span class="pill pill--rose">rates not honest</span>' : '<span class="pill pill--quiet">honesty not checked</span>');
    if (f === 'flag') out.push('<span class="pill pill--rose">too-faint flag</span>');
    else if (f === null) out.push('<span class="pill pill--quiet">faint check not run</span>');
    return out.join(' ');
  }
  function segs() {
    const searches = current.runs.filter(r => !isFake(r)), fakes = current.runs.filter(isFake);
    kindSeg.innerHTML = [['board', `Searches (${searches.length})`], ['tests', `Scorer tests (${fakes.length})`]]
      .map(([k, t]) => `<button type="button" data-view="${k}" aria-pressed="${k === view}">${t}</button>`).join('');
    const pool = view === 'board' ? searches : fakes;
    const have = ['test', 'train', 'other'].filter(s => pool.some(r => splitOf(r) === s));
    if (!have.includes(split)) split = have[0] || null;
    splitSeg.innerHTML = have.length > 1 ? have.map(s => `<button type="button" data-split="${s}" aria-pressed="${s === split}">${SPLIT[s]}</button>`).join('') : '';
  }
  function render() {
    const t = rateText(current.thr);
    thrNote.textContent = t ? `Sensitivity is the fraction of scored signals found at a false-alarm rate of ${t}.` : 'No false-alarm-rate threshold is set for this run list yet.';
    if (!loaded && !label) { board.innerHTML = '<div class="empty"><b>Loading the published runs…</b></div>'; return; }
    if (failed && !label) {
      board.innerHTML = `<div class="empty"><span class="empty__icon">${icon.chart}</span><b>The published run list could not be loaded</b><p>Reload to try again. You can still open a results file from your computer.</p></div>`;
      return;
    }
    const pool = current.runs.filter(r => (view === 'board' ? !isFake(r) : isFake(r)) && (!split || splitOf(r) === split));
    if (!pool.length) {
      board.innerHTML = view === 'tests'
        ? `<div class="empty"><span class="empty__icon">${icon.chart}</span><b>No scorer tests in this run list</b><p>The fake trigger lists that test the scorer appear here, never on the board. The first ones are described in the <a href="https://kyoon-mit.github.io/projects/agentic-ligo/updates/2026-11-27-first-scoring-run/">27 November update</a>.</p></div>`
        : label ? '<div class="empty"><b>This file holds no search runs.</b></div>'
          : `<div class="empty"><span class="empty__icon">${icon.chart}</span><b>No runs are published yet</b><p>Each published run, from an agent or a reference search, will appear here with the fraction of signals it finds, its result on the held-out classes, and its honesty checks. To look at runs of your own, open a results file from your computer, or drop it here. It is read in your browser and never uploaded.</p></div>`;
      return;
    }
    const key = r => (Number.isFinite(sens(r)) ? sens(r) : -Infinity);
    const sorted = pool.slice().sort((a, b) => (flagged(a) - flagged(b)) || (key(b) - key(a)));
    const firstFlag = sorted.findIndex(flagged);
    const row = r => {
      const s = sens(r), so = obj(r.sensitivity);
      const sub = [KIND[str(r.kind)] || str(r.kind), str(r.model) && str(r.harness), str(r.effort), str(r.prompt) && `prompt ${str(r.prompt)}`].filter(Boolean).join(' · ');
      return `<tr tabindex="0" data-run="${current.runs.indexOf(r)}"${flagged(r) ? ' class="is-flagged"' : ''}>
        <td class="who"><b>${esc(nameOf(r))}</b><small>${esc(sub)}</small></td>
        <td class="score"><div class="meter">${Number.isFinite(s) ? `<span class="meter__band" style="left:0;width:${Math.max(0, Math.min(1, s)) * 100}%"></span><span class="meter__pt" style="left:${Math.max(0, Math.min(1, s)) * 100}%"></span>` : ''}</div></td>
        <td class="num">${pct(s)}</td>
        <td class="num">${pct(num(so.train_classes))}</td>
        <td class="num">${pct(num(so.heldout_classes))}</td>
        <td>${checks(r)}</td>
        <td class="num">${mins(num(r.wall_time_s))}</td></tr>`;
    };
    const body = sorted.map((r, i) => (i === firstFlag ? `<tr class="board__sep"><td colspan="7">Flagged: sensitivity counts only for honest searches.</td></tr>` : '') + row(r)).join('');
    board.innerHTML = `<div class="table-wrap table-wrap--bare"><table class="board"><thead><tr><th>Search</th><th>Signals found</th><th></th><th>Training classes</th><th>Held-out classes</th><th>Checks</th><th>Time</th></tr></thead><tbody>${body}</tbody></table></div>
      <p class="muted">Sorted by the fraction of signals found; flagged runs go last. No ranking is chosen yet. Click a run for its details.</p>`;
  }
  function runDetail(r) {
    const so = obj(r.sensitivity), fam = obj(so.by_family), s50 = obj(r.snr50), h = obj(r.far_honesty), f = obj(r.faint_check);
    const t = rateText(current.thr);
    const gap = num(r.generalization_gap);
    const rows = [['Overall', pct(num(so.overall))], ['Training classes', pct(num(so.train_classes))], ['Held-out classes', pct(num(so.heldout_classes))],
      ['Gap, training minus held-out', Number.isFinite(gap) ? `${fmt(gap * 100)} points` : '–'],
      ['Sine-Gaussians', pct(num(fam.sine_gaussian))], ['White-noise bursts', pct(num(fam.white_noise_burst))], ['Binary black holes, circular', pct(num(fam.bbh_circular))],
      ['Half found at SNR, training', fmt(num(s50.train_classes))], ['Half found at SNR, held-out', fmt(num(s50.heldout_classes))]];
    const hv = honesty(r), fv = faint(r);
    const hText = hv === null ? 'Not checked.' : `${hv === 'pass' ? 'Honest' : 'Not honest'}${Number.isFinite(num(h.observed)) ? `: ${esc(str(h.observed))} triggers on noise-only data` : ''}${Number.isFinite(num(h.expected)) ? `, against ${fmt(num(h.expected))} expected from the claimed rates` : ''}${Number.isFinite(num(h.p_value)) ? ` (p = ${esc(num(h.p_value).toPrecision(2))})` : ''}.`;
    const fText = fv === null ? 'Not run.' : `${fv === 'flag' ? 'Flagged' : 'Not flagged'}${Number.isFinite(num(f.found_fraction)) ? `: found ${pct(num(f.found_fraction))} of the too-faint signals` : ''}.`;
    const sg = (Array.isArray(r.segments) ? r.segments : []).filter(x => x && typeof x === 'object');
    const ends = sg.map(x => num(x.end_s)).filter(Number.isFinite);
    const budget = Number.isFinite(num(r.budget_s)) && num(r.budget_s) > 0 ? num(r.budget_s) : ends.length ? Math.max(...ends) : NaN;
    const bar = Number.isFinite(budget) ? sg.map(x => {
      const a = num(x.start_s), b = num(x.end_s);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return '';
      return `<span title="exit ${esc(str(x.exit))}" style="position:absolute;top:2px;bottom:2px;left:${Math.max(0, a / budget * 100)}%;width:${Math.max(0, (b - a) / budget * 100)}%;border-radius:4px;background:${num(x.exit) === 124 ? 'var(--rose)' : 'var(--sky)'};opacity:.7"></span>`;
    }).join('') : '';
    const ds = obj(r.datasets), fl = obj(ds.failed);
    const meta = [KIND[str(r.kind)] || str(r.kind), str(r.harness), str(r.model) && str(r.id) ? `run ${str(r.id)}` : '', str(r.effort), str(r.prompt) && `prompt ${str(r.prompt)}`, SPLIT[splitOf(r)] && splitOf(r) !== 'other' ? `${SPLIT[splitOf(r)].toLowerCase()} split` : '', str(r.date)].filter(Boolean).join(' · ');
    return `<h2 id="drawer-title">${esc(nameOf(r))}</h2>
      <p class="muted">${esc(meta)}</p>
      <p class="num" style="font-size:1.6rem">${pct(sens(r))} <small>of scored signals found${t ? ` at ${esc(t)}` : ''}</small></p>
      <div class="table-wrap"><table class="table"><thead><tr><th>Signals found</th><th>Fraction</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join('')}</tbody></table></div>
      <div><h3 class="drawer__h">Honest false-alarm rates</h3><p class="muted">${hText}</p></div>
      <div><h3 class="drawer__h">Too-faint signals</h3><p class="muted">${fText}</p></div>
      <div><h3 class="drawer__h">Time used</h3><p class="muted">${mins(num(r.wall_time_s))} of ${Number.isFinite(budget) ? mins(budget) : 'an unknown budget'}</p>
        ${bar ? `<div class="meter" style="height:14px;margin-top:.4rem">${bar}</div>` : ''}</div>
      <div><h3 class="drawer__h">Datasets</h3><p class="muted">${Number.isFinite(num(ds.n)) ? `${esc(str(ds.n))} datasets; failed: ${['timeout', 'oom', 'crash', 'rejected', 'env', 'missing'].map(k => `${k} ${esc(str(fl[k]) || '0')}`).join(', ')}` : 'Not recorded.'}</p></div>`;
  }
  const openRun = tr => openDrawer(runDetail(current.runs[+tr.dataset.run]), tr);
  board.addEventListener('click', e => { const tr = e.target.closest('[data-run]'); if (tr) openRun(tr); });
  board.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tr = e.target.closest('[data-run]');
    if (!tr) return;
    e.preventDefault();
    openRun(tr);
  });
  kindSeg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    view = b.dataset.view; segs(); render();
    const again = kindSeg.querySelector(`[data-view="${view}"]`); if (again) again.focus();
  });
  splitSeg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    split = b.dataset.split; segs(); render();
    const again = splitSeg.querySelector(`[data-split="${split}"]`); if (again) again.focus();
  });
  function show(list, name) {
    current = list; label = name;
    src.innerHTML = '';
    const n = list.runs.filter(r => !isFake(r)).length;
    if (name) {
      const s = document.createElement('span');
      s.textContent = `Showing ${name} from this computer (${list.runs.length} run${list.runs.length === 1 ? '' : 's'}); nothing is uploaded.`;
      const back = document.createElement('button');
      back.type = 'button'; back.className = 'btn btn--ghost'; back.textContent = 'Back to the published runs';
      back.addEventListener('click', () => { err.textContent = ''; show(published, null); $('b-open').focus(); });
      src.append(s, back);
      setStatus(`local file · ${n} search run${n === 1 ? '' : 's'}`);
    } else setStatus(!loaded ? 'loading…' : failed ? 'run list not loaded' : n ? `${n} published run${n === 1 ? '' : 's'}` : 'no published runs');
    segs(); render();
  }
  const clean = d => {
    const list = Array.isArray(d) ? d : d && typeof d === 'object' ? d.runs : null;
    if (!Array.isArray(list) || !list.every(r => r && typeof r === 'object' && !Array.isArray(r))) return null;
    return { thr: d && !Array.isArray(d) ? d.far_threshold_hz : null, runs: list };
  };
  function openLocal(f) {
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      let list = null;
      try { list = clean(JSON.parse(fr.result)); } catch (_) { list = null; }
      if (!list) { err.textContent = `${f.name} is not a run list (JSON with a "runs" list of objects).`; return; }
      err.textContent = '';
      show(list, f.name);
    };
    fr.onerror = () => { err.textContent = `${f.name} could not be read.`; };
    fr.readAsText(f);
  }
  $('b-open').addEventListener('click', () => file.click());
  file.addEventListener('change', () => { openLocal(file.files[0]); file.value = ''; });
  const card = board.closest('.card');
  document.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); });
  document.addEventListener('drop', e => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    if (card.contains(e.target) && e.dataTransfer.files.length) openLocal(e.dataTransfer.files[0]);
  });
  show(published, null);
  (async () => {
    try {
      const res = await fetch(app.dataset.runs, { cache: 'no-cache' });
      if (!res.ok) throw new Error(String(res.status));
      const d = clean(await res.json());
      if (!d) throw new Error('shape');
      published = { thr: d.thr, runs: d.runs.filter(r => r && typeof r === 'object' && !Array.isArray(r)) };
    } catch (_) { failed = true; }
    loaded = true;
    if (!label) show(published, null);
  })();

  // ---------------------------------------------------------------- reference tabs
  const tabs = [...document.querySelectorAll('.tab')];
  function select(t) {
    tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $(x.getAttribute('aria-controls')).hidden = !on; });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus();
    });
  });
})();
