/* Agentic LIGO benchmark monitor: three views (scores, datasets, models) and the reference
   text. Published runs come from runs.json; a viewer can also open a results file from their
   own computer, which is read in the browser and never uploaded. */
'use strict';
(() => {
  const app = document.getElementById('app');
  if (!app) return;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '–').replace('-', '−');
  const num = v => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? +v : NaN);
  const str = v => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');
  const icon = {
    db: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
    toy: '<svg viewBox="0 0 24 24"><path d="M4 18c3-9 5-13 8-13s5 4 8 13"/><path d="M3 20h18"/></svg>',
    wave: '<svg viewBox="0 0 24 24"><path d="M2 12h3l2-6 3 12 3-9 2 5 2-2h5"/></svg>',
    term: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  };

  // ---------------------------------------------------------------- data from the reference text
  const NANO = 'Reconstructed events in the NanoAOD format, slimmed to muons, electrons, photons from final-state radiation, trigger objects and trigger decisions.';
  const DATASETS = [
    { kind: 'physics', name: 'HiggsLepMass', code: 'h4l', status: 'built',
      measures: 'The Higgs boson signal strength and mass from H→ZZ*→4ℓ, detector calibrations included',
      handsIn: 'Values with uncertainties, and a binned likelihood model',
      data: 'CMS Open Data simulation, 2016 conditions', hf: 'hep-ex-bench/HiggsLepMass',
      worlds: 'About twice the integrated luminosity of the public dataset in each sealed world.' },
    { kind: 'physics', name: 'HiggsWidth', code: 'h4l_width', status: 'built',
      measures: 'The Higgs width relative to the Standard Model, and the on-shell signal strength, from H→ZZ→4ℓ',
      handsIn: 'Intervals, and a binned likelihood model whose rates scale with them',
      data: 'CMS Open Data simulation and private samples through the same detector simulation, 2016 conditions', hf: 'hep-ex-bench/HiggsWidth',
      worlds: 'About twice the integrated luminosity of the public dataset in each sealed world.' },
    { kind: 'physics', name: 'LepCalib', code: 'lep_calib', status: 'built',
      measures: 'Lepton calibrations from Z→ℓℓ',
      handsIn: 'Corrections as functions, in the correctionlib format',
      data: 'CMS Open Data derived simulation, 2016 conditions', hf: 'hep-ex-bench/LepCalib',
      worlds: 'Every sealed world carries 10 fb⁻¹.' },
    { kind: 'toy', name: 'Gaussian peak', code: 'gauss_peak', status: 'toy', measures: 'A Gaussian peak', handsIn: 'Values with uncertainties' },
    { kind: 'toy', name: 'Bump model', code: 'bump_model', status: 'toy', measures: 'A resonance on a falling background', handsIn: 'Values, and a binned likelihood model' },
    { kind: 'toy', name: 'Peak calibration', code: 'peak_calib', status: 'toy', measures: 'A muon momentum scale, resolution and efficiency from a Z boson peak', handsIn: 'Corrections' },
    { kind: 'toy', name: 'Width toy', code: 'width_toy', status: 'toy', measures: 'A width ratio from an off-shell mass spectrum', handsIn: 'Intervals, and a binned likelihood model' },
    { kind: 'ligo', name: 'LIGO bursts', code: 'not yet in the benchmark', status: 'designing',
      measures: 'Short gravitational-wave bursts in LIGO strain: a search from detector data to a list of candidate events',
      handsIn: 'A trigger list: a CSV file with one row per candidate event, giving the start GPS time (s), the end GPS time (s) and the false-alarm rate (Hz)',
      data: 'Real LIGO strain from the third observing run (O3), Hanford and Livingston, at 16,384 Hz, with simulated short bursts (under 10 s) added',
      extra: [
        ['Status', 'A first scorer runs on the training data; the task is not yet in the benchmark.'],
        ['Training', 'The first half of the run (O3a): one set with injected signals and one with noise only. 39 waveforms: 19 sine-Gaussians, 16 white-noise bursts, 4 binary black hole mergers on circular orbits.'],
        ['Sealed test', 'The second half (O3b), with the same two parts: the same 39 waveforms plus five classes the agent never sees in training.'],
        ['Offline', 'Agents run with no network. O3 strain is public, so subtracting it from the data would reveal every injection.'],
        ['Planned benchmarks', 'Sensitivity at a fixed false-alarm rate; honest false-alarm rates on noise-only data; generalization to the held-out classes; a cheating check with signals too faint for any real search; the standard search plots. Later: latency, and the probability that a candidate is a real signal.'],
        ['Hosting', 'Not on Hugging Face; where the benchmark will host it is not decided yet.'],
      ] },
  ];
  const HARNESSES = [
    { name: 'Claude Code', note: 'Has a run script. The run record adds its permission mode.' },
    { name: 'Codex', note: 'Has a run script. The run record adds its reasoning effort, approval and sandbox settings.' },
    { name: 'opencode', note: 'Has a run script.' },
  ];
  const FLAGS = { grid_snap: 'on the truth grid', literature_pin: 'a published value', repeated_value: 'one value in every world', null_pin: 'pinned at zero signal', tight_sigma: 'uncertainty far below the reference\'s' };
  const flagsOf = r => {
    const f = Array.isArray(r.tripwire) ? r.tripwire : r.tripwire && Array.isArray(r.tripwire.flags) ? r.tripwire.flags : null;
    return f && f.map(str).filter(Boolean);
  };
  const flagName = x => (Object.prototype.hasOwnProperty.call(FLAGS, x) ? FLAGS[x] : x);
  const WEIGHTS = [
    ['Physics', 1, 'The measured quantities, each charged as in step 1; the total uses the average of their scores.'],
    ['Truthfulness', 0.5, 'Whether the reported numbers match what the evaluator gets by refitting the agent\'s own model.'],
    ['Goodness of fit', 0.30, 'Whether the agent\'s statistical model fits the data, over all worlds together.'],
    ['Calibration', 0.10, 'Detector calibrations the agent measures, against the values injected into each world.'],
    ['Completeness', 0.10, 'Whether the model includes the standard sources of uncertainty, as real effects.'],
    ['Compute', 0.1, 'Run time against the reference: free up to 1.5 times, then +1 per doubling.'],
    ['Claims', 0.05, 'Whether side claims, such as a discovery claim, agree with the refit.'],
  ];
  const weightFor = (task, k, w) => (task === 'lep_calib' ? (k === 'peak' ? 0.5 : null) : k === 'peak' ? null : w);
  const TERMS = [['phys', 'Physics', 1], ['cal', 'Calibration', 0.10], ['gof', 'Goodness of fit', 0.30], ['syst', 'Completeness', 0.10],
    ['truth', 'Truthfulness', 0.5], ['claims', 'Claims', 0.05], ['peak', 'Z peak', 0.5], ['compute', 'Compute', 0.1]];

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

  // ---------------------------------------------------------------- drawer
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

  // ---------------------------------------------------------------- scores: weights
  $('weights').innerHTML = WEIGHTS.map(([n, w, d]) => `<div class="weight"><span class="weight__name">${n}</span><span class="weight__bar"><span class="weight__fill" style="width:${w * 100}%"></span></span><span class="weight__w">×${w}</span><span class="weight__d">${esc(d)}</span></div>`).join('')
    + '<p class="muted" style="margin-top:.4rem">For tasks where the agent hands in a statistical model. The lepton calibration task uses its own total: physics, completeness, a check of the corrected Z boson peak (×0.5) and compute.</p>';

  // ---------------------------------------------------------------- datasets
  const accent = { physics: 'var(--sky)', toy: 'var(--olive)', ligo: 'var(--lav)' };
  const pillFor = { built: '<span class="pill pill--sage">built</span>', toy: '<span class="pill pill--olive">toy</span>', designing: '<span class="pill pill--lav">in development</span>' };
  function dsTile(d, i) {
    const tags = [];
    if (d.kind === 'physics') tags.push('CMS Open Data', 'NanoAOD', '2016', 'v0.2');
    if (d.kind === 'toy') tags.push('in the repository', 'worked example');
    if (d.kind === 'ligo') tags.push('O3', 'H1 + L1', '16,384 Hz', '5 held-out classes');
    return `<button type="button" class="tile" data-ds="${i}" aria-labelledby="ds-t${i}" aria-describedby="ds-d${i}" style="--accent:${accent[d.kind]}">
      <span class="tile__top"><span class="tile__icon" aria-hidden="true">${d.kind === 'toy' ? icon.toy : d.kind === 'ligo' ? icon.wave : icon.db}</span>
        <span class="tile__title"><b id="ds-t${i}">${esc(d.name)}</b><code>${esc(d.code)}</code></span>${pillFor[d.status]}</span>
      <span class="tile__desc" id="ds-d${i}">${esc(d.measures)}</span>
      <span class="tags" aria-hidden="true">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</span></button>`;
  }
  function dsDetail(d) {
    const rows = [['Measures', d.measures], ['Hands in', d.handsIn]];
    if (d.data) rows.push(['Data', d.data]);
    if (d.kind === 'physics') rows.push(['Format', NANO], ['Sealed worlds', d.worlds]);
    if (d.kind === 'toy') rows.push(['Where', 'Shipped whole in the repository, as a worked example for adding a task.']);
    (d.extra || []).forEach(r => rows.push(r));
    const links = [];
    if (d.hf) links.push(`<a class="btn" href="https://huggingface.co/datasets/${d.hf}">${esc(d.hf)} on Hugging Face ↗</a>`);
    return `<div class="tile__top" style="--accent:${accent[d.kind]}"><span class="tile__icon" aria-hidden="true">${d.kind === 'toy' ? icon.toy : d.kind === 'ligo' ? icon.wave : icon.db}</span>
      <div class="tile__title"><h2 id="drawer-title">${esc(d.name)}</h2><code>${esc(d.code)}</code></div>${pillFor[d.status]}</div>
      <dl class="facts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${links.length ? `<div class="card__tools" style="margin-left:0">${links.join('')}</div>` : ''}`;
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
  $('m-harness').innerHTML = HARNESSES.map(h => `<div class="tile tile--static" style="--accent:var(--sage)">
    <span class="tile__top"><span class="tile__icon" aria-hidden="true">${icon.term}</span><span class="tile__title"><b>${esc(h.name)}</b><code>command-line coding tool</code></span></span>
    <span class="tile__desc">${esc(h.note)}</span></div>`).join('');

  // ---------------------------------------------------------------- leaderboard
  const board = $('b-board'), seg = $('b-task'), src = $('b-src'), err = $('b-err'), file = $('b-file');
  const sc = r => num(r.relative_score);
  const lo = r => { const v = Array.isArray(r.relative_score_range) ? num(r.relative_score_range[0]) : NaN; return Number.isFinite(v) ? v : sc(r); };
  const hi = r => { const v = Array.isArray(r.relative_score_range) ? num(r.relative_score_range[1]) : NaN; return Number.isFinite(v) ? v : sc(r); };
  const mins = sec => (!Number.isFinite(sec) ? '–' : sec < 120 ? `${Math.round(sec)} s` : `${Math.round(sec / 60)} min`);
  let published = [], failed = false, loaded = false, current = [], label = null, task = 'all';

  function setStatus(t) { $('status').textContent = t; }
  function matrix(runs) {
    const ms = [...new Set(runs.map(r => str(r.model) || '?'))], ts = [...new Set(runs.map(r => str(r.task) || '?'))];
    if (ms.length < 2 && ts.length < 2) return '';
    const cell = (m, t) => {
      const vals = runs.filter(r => (str(r.model) || '?') === m && (str(r.task) || '?') === t).map(sc).filter(Number.isFinite);
      if (!vals.length) return '<div class="matrix__cell" style="background:#19191b;color:var(--text-3)">–</div>';
      const v = Math.max(...vals);
      const a = Math.min(.32, Math.abs(v - 100) / 100 * .32 + .08);
      const bg = v >= 100 ? `rgba(159,201,154,${a.toFixed(3)})` : `rgba(215,156,156,${a.toFixed(3)})`;
      return `<div class="matrix__cell" style="background:${bg}">${fmt(v)}</div>`;
    };
    return `<div class="table-wrap table-wrap--bare"><div class="matrix" style="grid-template-columns: minmax(8rem, auto) repeat(${ts.length}, minmax(5rem, 1fr))">
      <div></div>${ts.map(t => `<div class="matrix__head">${esc(t)}</div>`).join('')}
      ${ms.map(m => `<div class="matrix__row">${esc(m)}</div>${ts.map(t => cell(m, t)).join('')}`).join('')}</div>
      </div><p class="muted">Best relative score (%) for each model and task.</p>`;
  }
  function render() {
    const runs = current.filter(r => task === 'all' || str(r.task) === task);
    if (!loaded && !label) { board.innerHTML = '<div class="empty"><b>Loading the published runs…</b></div>'; return; }
    if (failed && !label) {
      board.innerHTML = `<div class="empty"><span class="empty__icon">${icon.chart}</span><b>The published run list could not be loaded</b><p>Reload to try again. You can still open a results file from your computer.</p></div>`;
      return;
    }
    if (!current.length) {
      board.innerHTML = label ? '<div class="empty"><b>This file holds no runs.</b></div>'
        : `<div class="empty"><span class="empty__icon">${icon.chart}</span><b>No agent runs are published yet</b><p>Each published run will appear here ranked by its relative score, with its ±1σ range, its checks and the time it used. To look at runs of your own, open a results file from your computer, or drop it here. It is read in your browser and never uploaded.</p></div>`;
      return;
    }
    const key = r => (Number.isFinite(sc(r)) ? sc(r) : -Infinity);
    const sorted = runs.slice().sort((a, b) => key(b) - key(a));
    const top = Math.min(1000, Math.max(150, ...sorted.map(hi).filter(Number.isFinite)));
    const pos = v => (Number.isFinite(v) ? Math.max(0, Math.min(100, v / top * 100)) : 0);
    const checks = r => {
      const f = flagsOf(r), parts = [];
      if (f === null) parts.push('<span class="pill pill--quiet">tripwire not run</span>');
      else if (!f.length) parts.push('<span class="pill pill--sage">clean</span>');
      else parts.push(`<span class="pill pill--lav">${f.length} flag${f.length === 1 ? '' : 's'}</span>`);
      if (r.missing_background === true) parts.push('<span class="pill pill--lav">missing background</span>');
      return parts.join(' ');
    };
    board.innerHTML = matrix(current) + `<div class="table-wrap table-wrap--bare"><table class="board"><thead><tr><th>#</th><th>Model</th><th>Task</th><th>Relative score</th><th></th><th>Checks</th><th>Time</th></tr></thead><tbody>
      ${sorted.map((r, i) => `<tr tabindex="0" data-run="${current.indexOf(r)}">
        <td class="rank">${i + 1}</td>
        <td class="who"><b>${esc(str(r.model) || '?')}</b><small>${esc([str(r.harness), str(r.prompt), str(r.effort) || 'default effort'].filter(Boolean).join(' · '))}</small></td>
        <td>${esc(str(r.task))}</td>
        <td class="score"><div class="meter"><span class="meter__ref" style="left:${pos(100)}%"></span><span class="meter__band" style="left:${pos(lo(r))}%;width:${Math.max(0, pos(hi(r)) - pos(lo(r)))}%"></span>${Number.isFinite(sc(r)) ? `<span class="meter__pt" style="left:${pos(sc(r))}%"></span>` : ''}</div></td>
        <td class="num ${Number.isFinite(sc(r)) ? (sc(r) >= 100 ? 'up' : 'down') : ''}">${fmt(sc(r))} %<br><small>${fmt(lo(r))} – ${fmt(hi(r))}</small></td>
        <td>${checks(r)}</td>
        <td class="num">${mins(num(r.wall_time_s))}</td></tr>`).join('')}
      </tbody></table></div><p class="muted">The dashed line is the reference (100 %). Click a run for its details.</p>`;
  }
  function runDetail(r) {
    const t = r.terms && typeof r.terms === 'object' ? r.terms : {}, tk = str(r.task);
    const rows = TERMS.filter(([k]) => Number.isFinite(num(t[k]))).map(([k, n, w]) => {
      const ww = weightFor(tk, k, w), c = num(t[k]);
      return `<tr><td>${n}</td><td class="num">${fmt(c, 3)}</td><td class="num">${ww === null ? '–' : '×' + ww}</td><td class="num">${ww === null ? '–' : fmt(ww * c, 3)}</td></tr>`;
    }).join('');
    const segs = (Array.isArray(r.segments) ? r.segments : []).filter(x => x && typeof x === 'object');
    const ends = segs.map(x => num(x.end_s)).filter(Number.isFinite);
    const budget = Number.isFinite(num(r.budget_s)) && num(r.budget_s) > 0 ? num(r.budget_s) : ends.length ? Math.max(...ends) : NaN;
    const bar = Number.isFinite(budget) ? segs.map(x => {
      const a = num(x.start_s), b = num(x.end_s);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return '';
      return `<span title="exit ${esc(str(x.exit))}" style="position:absolute;top:2px;bottom:2px;left:${Math.max(0, a / budget * 100)}%;width:${Math.max(0, (b - a) / budget * 100)}%;border-radius:4px;background:${num(x.exit) === 124 ? 'var(--rose)' : 'var(--sky)'};opacity:.7"></span>`;
    }).join('') : '';
    const w = r.worlds && typeof r.worlds === 'object' ? r.worlds : {}, f = w.failed && typeof w.failed === 'object' ? w.failed : {};
    const fl = flagsOf(r);
    const flags = fl === null ? '<p class="muted">The tripwire was not run for this task.</p>'
      : fl.length ? `<ul class="tags">${fl.map(x => `<li>${esc(flagName(x))}</li>`).join('')}</ul>` : '<p class="muted">Clean: no flags.</p>';
    const s0 = sc(r);
    return `<h2 id="drawer-title">${esc(str(r.model) || '?')}</h2>
      <p class="muted">${esc([str(r.harness), str(r.effort) || 'default effort', str(r.prompt) && 'prompt ' + str(r.prompt), tk, str(r.suite) && 'suite ' + str(r.suite), str(r.date)].filter(Boolean).join(' · '))}</p>
      <p class="num ${Number.isFinite(s0) ? (s0 >= 100 ? 'up' : 'down') : ''}" style="font-size:1.6rem">${fmt(s0)} % <small>1σ ${fmt(lo(r))} – ${fmt(hi(r))}</small></p>
      ${rows ? `<div class="table-wrap"><table class="table"><thead><tr><th>Check</th><th>Charge</th><th>Weight</th><th>Weighted</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
      <div><h3 class="drawer__h">Tripwire</h3>${flags}${r.missing_background === true ? '<p class="muted">Flagged for a missing standard background process.</p>' : ''}</div>
      <div><h3 class="drawer__h">Time used</h3><p class="muted">${mins(num(r.wall_time_s))} of ${Number.isFinite(budget) ? mins(budget) : 'an unknown budget'}</p>
        ${bar ? `<div class="meter" style="height:14px;margin-top:.4rem">${bar}</div>` : ''}</div>
      <div><h3 class="drawer__h">Sealed worlds</h3><p class="muted">${esc(str(w.n) || '?')} worlds; failed: ${['timeout', 'oom', 'crash', 'rejected', 'env', 'missing'].map(k => `${k} ${esc(str(f[k]) || '0')}`).join(', ')}</p></div>`;
  }
  board.addEventListener('click', e => { const tr = e.target.closest('[data-run]'); if (tr) openDrawer(runDetail(current[+tr.dataset.run]), tr); });
  board.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tr = e.target.closest('[data-run]');
    if (!tr) return;
    e.preventDefault();
    openDrawer(runDetail(current[+tr.dataset.run]), tr);
  });
  function tasksSeg() {
    const ts = [...new Set(current.map(r => str(r.task)).filter(Boolean))].sort();
    if (ts.length < 2 || !ts.includes(task)) task = 'all';
    seg.innerHTML = ts.length > 1 ? ['all', ...ts].map(t => `<button type="button" data-task="${esc(t)}" aria-pressed="${t === task}">${t === 'all' ? 'All tasks' : esc(t)}</button>`).join('') : '';
  }
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    task = b.dataset.task; tasksSeg(); render();
    const again = [...seg.querySelectorAll('button')].find(x => x.dataset.task === task); if (again) again.focus();
  });
  function show(runs, name) {
    current = runs; label = name;
    src.innerHTML = '';
    if (name) {
      const s = document.createElement('span');
      s.textContent = `Showing ${name} from this computer (${runs.length} run${runs.length === 1 ? '' : 's'}); nothing is uploaded.`;
      const back = document.createElement('button');
      back.type = 'button'; back.className = 'btn btn--ghost'; back.textContent = 'Back to the published runs';
      back.addEventListener('click', () => { err.textContent = ''; show(published, null); $('b-open').focus(); });
      src.append(s, back);
      setStatus(`local file · ${runs.length} run${runs.length === 1 ? '' : 's'}`);
    } else setStatus(!loaded ? 'loading…' : failed ? 'run list not loaded' : runs.length ? `${runs.length} published run${runs.length === 1 ? '' : 's'}` : 'no published runs');
    tasksSeg(); render();
  }
  function openLocal(f) {
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      let list = null;
      try { const d = JSON.parse(fr.result); list = Array.isArray(d) ? d : d && d.runs; } catch (_) { list = null; }
      if (!Array.isArray(list) || !list.every(r => r && typeof r === 'object' && !Array.isArray(r))) {
        err.textContent = `${f.name} is not a run list (JSON with a "runs" list of objects).`;
        return;
      }
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
  show([], null);
  (async () => {
    try {
      const res = await fetch(app.dataset.runs, { cache: 'no-cache' });
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      if (!d || !Array.isArray(d.runs)) throw new Error('shape');
      published = d.runs.filter(r => r && typeof r === 'object' && !Array.isArray(r));
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
