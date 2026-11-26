/* Lumen Reef 60 — shared control logic for every UI version.
   Hardware does not exist yet: MockDevice stands in for the light's future Wi-Fi JSON API.
   Swap MockDevice.request() for fetch(`http://<light-ip>${path}`) when the controller exists. */
(function () {
  'use strict';

  // Channel data from the product render. `par` = estimated PAR at 100% at mid-depth in a 60 cm tank (simulated).
  const CHANNELS = [
    { id: 'uv',     name: 'UV',         nm: 400, width: 10, color: '#8a3dff', par: 30 },
    { id: 'violet', name: 'Violet',     nm: 420, width: 12, color: '#a25cff', par: 50 },
    { id: 'royal',  name: 'Royal Blue', nm: 450, width: 11, color: '#3d4fff', par: 120 },
    { id: 'blue',   name: 'Blue',       nm: 470, width: 13, color: '#2f9bff', par: 90 },
    { id: 'green',  name: 'Green',      nm: 520, width: 16, color: '#2ee59a', par: 40 },
    { id: 'white',  name: 'White',      nm: 570, width: 60, color: '#f3efe6', par: 130 },
    { id: 'red',    name: 'Red',        nm: 660, width: 11, color: '#ff3b4f', par: 40 },
  ];
  const PAR_MAX = CHANNELS.reduce((s, c) => s + c.par, 0); // 500

  const CORAL = { uv: 55, violet: 70, royal: 95, blue: 60, green: 20, white: 35, red: 15 };
  const PRESETS = [
    { id: 'coral',    name: 'Coral Pop',   note: 'Blue-heavy, makes coral fluoresce', mix: CORAL, master: 100 },
    { id: 'daylight', name: 'Daylight',    note: 'Balanced, natural colors',          mix: { uv: 20, violet: 30, royal: 60, blue: 55, green: 45, white: 85, red: 40 }, master: 100 },
    { id: 'deep',     name: 'Deep Reef',   note: 'Like 15 m down, almost no white',    mix: { uv: 70, violet: 80, royal: 100, blue: 70, green: 10, white: 10, red: 0 }, master: 100 },
    { id: 'photo',    name: 'Photo',       note: 'White-rich, true colors for photos', mix: { uv: 10, violet: 20, royal: 55, blue: 50, green: 50, white: 100, red: 55 }, master: 100 },
    { id: 'accl',     name: 'Acclimation', note: 'Coral Pop at 40% for new corals',    mix: CORAL, master: 40 },
  ];

  const DEFAULT = {
    mix: { ...CORAL }, master: 100, preset: 'coral',
    schedule: { sunriseStart: 7, sunriseEnd: 10, sunsetStart: 17, sunsetEnd: 20, moon: 4 },
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (x) => x * x * (3 - 2 * x);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: keep in memory */ } },
  };

  // ---------- Mock device: same routes the real controller will serve ----------
  class MockDevice {
    constructor() {
      this.memory = store.get('lumen.device') || structuredClone(DEFAULT);
      this.online = true;
      this.log = [];
      this.info = { model: 'Lumen Reef 60 (simulated)', firmware: 'mock-0.1', ip: '192.168.1.60', channels: CHANNELS.length };
    }
    request(method, path, body) {
      const started = performance.now();
      const ms = 80 + Math.random() * 180;
      return new Promise((resolve) => setTimeout(() => {
        let status = 200, json;
        if (!this.online) { status = 503; json = { error: 'Light not reachable' }; }
        else if (method === 'GET' && path === '/api/v1/state') json = { ...this.memory, device: this.info };
        else if (method === 'PUT' && path === '/api/v1/channels') {
          const ok = body && body.mix && CHANNELS.every((c) => Number.isFinite(body.mix[c.id]));
          if (!ok) { status = 400; json = { error: 'mix must include every channel' }; }
          else { this.memory.mix = { ...body.mix }; this.memory.master = clamp(body.master, 0, 100); this.memory.preset = body.preset; json = { ok: true }; }
        } else if (method === 'PUT' && path === '/api/v1/schedule') { this.memory.schedule = { ...body }; json = { ok: true }; }
        else { status = 404; json = { error: 'unknown route' }; }
        if (status === 200 && method !== 'GET') store.set('lumen.device', this.memory);
        const entry = { at: new Date(), method, path, body, status, ms: Math.round(performance.now() - started) };
        this.log.unshift(entry); this.log.length = Math.min(this.log.length, 40);
        resolve({ status, json, entry });
      }, ms));
    }
  }

  // ---------- Light model ----------
  function factor(t, s) {
    if (t < s.sunriseStart || t >= s.sunsetEnd) return 0;
    if (t < s.sunriseEnd) return smooth((t - s.sunriseStart) / (s.sunriseEnd - s.sunriseStart));
    if (t < s.sunsetStart) return 1;
    return smooth(1 - (t - s.sunsetStart) / (s.sunsetEnd - s.sunsetStart));
  }
  function phase(t, s) {
    if (t < s.sunriseStart || t >= s.sunsetEnd) return 'Moonlight';
    if (t < s.sunriseEnd) return 'Sunrise';
    if (t < s.sunsetStart) return 'Midday';
    return 'Sunset';
  }
  // Blues lead at dawn and linger at dusk; white/red/green follow more slowly, like real reef lights.
  const WARM = new Set(['green', 'white', 'red']);
  function output(t, st) {
    const f = factor(t, st.schedule), out = {};
    for (const c of CHANNELS) {
      const base = st.mix[c.id] * st.master / 100;
      out[c.id] = base * (WARM.has(c.id) ? Math.pow(f, 1.8) : f);
    }
    out.royal = Math.max(out.royal, st.schedule.moon);
    out.blue = Math.max(out.blue, st.schedule.moon * 0.4);
    return out;
  }
  const par = (out) => CHANNELS.reduce((s, c) => s + out[c.id] / 100 * c.par, 0);
  const hexRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function lightRGB(out) {
    let r = 0, g = 0, b = 0;
    for (const c of CHANNELS) { const [cr, cg, cb] = hexRGB(c.color); const w = out[c.id] / 100; r += cr * w; g += cg * w; b += cb * w; }
    const m = Math.max(r, g, b, 1);
    return [r, g, b].map((v) => Math.round(v / m * 255));
  }
  const gauss = (x, mu, w) => Math.exp(-0.5 * ((x - mu) / w) ** 2);
  function spd(out, nm) {
    let v = 0;
    for (const c of CHANNELS) {
      const k = out[c.id] / 100;
      v += c.id === 'white' ? k * (0.55 * gauss(nm, 450, 10) + 0.75 * gauss(nm, 565, 55)) : k * gauss(nm, c.nm, c.width);
    }
    return v;
  }
  function spectrum(out, from = 380, to = 720, step = 4) {
    const pts = [];
    for (let nm = from; nm <= to; nm += step) pts.push({ nm, v: spd(out, nm) });
    return pts;
  }
  // Approximate visible color of a wavelength (for drawing spectrum axes).
  function nmColor(nm) {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else r = 1;
    const fade = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (720 - nm) / 20 : 1;
    return `rgb(${[r, g, b].map((v) => Math.round(255 * clamp(v * fade, 0, 1))).join(',')})`;
  }
  const fmt = (h) => { h = ((h % 24) + 24) % 24; const m = Math.round(h * 60); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  const nowHours = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; };

  // ---------- App state + sync ----------
  const device = new MockDevice();
  const listeners = new Set();
  const L = {
    CHANNELS, PRESETS, PAR_MAX, device, fmt, nmColor, spectrum, spd, clamp,
    state: structuredClone(DEFAULT),
    sync: 'connecting',            // connecting | saved | saving | error
    clock: { t: nowHours(), mode: 'live' }, // live | scrub | play
    on(fn) { listeners.add(fn); fn('init'); return () => listeners.delete(fn); },
    emit(why) { listeners.forEach((fn) => fn(why)); },
    view(t = L.clock.t) {
      const out = output(t, L.state), rgb = lightRGB(out), p = par(out);
      return { t, time: fmt(t), phase: phase(t, L.state.schedule), factor: factor(t, L.state.schedule), out, par: p,
        rgb, color: `rgb(${rgb})`, level: p / PAR_MAX };
    },
    peakPar() { return par(output((L.state.schedule.sunriseEnd + L.state.schedule.sunsetStart) / 2, L.state)); },
    setChannel(id, v) { L.state.mix[id] = clamp(Math.round(v), 0, 100); L.state.preset = 'custom'; L.emit('mix'); push('channels'); },
    setMaster(v) { L.state.master = clamp(Math.round(v), 0, 100); L.state.preset = 'custom'; L.emit('mix'); push('channels'); },
    applyPreset(id) { const p = PRESETS.find((x) => x.id === id); L.state.mix = { ...p.mix }; L.state.master = p.master; L.state.preset = id; L.emit('mix'); push('channels'); },
    setSchedule(key, v) {
      const s = { ...L.state.schedule, [key]: v };
      // keep the four schedule points in order, at least 15 min apart
      const order = ['sunriseStart', 'sunriseEnd', 'sunsetStart', 'sunsetEnd'];
      for (let i = 1; i < 4; i++) s[order[i]] = Math.max(s[order[i]], s[order[i - 1]] + 0.25);
      for (let i = 2; i >= 0; i--) s[order[i]] = Math.min(s[order[i]], s[order[i + 1]] - 0.25);
      if (s.sunriseStart < 0 || s.sunsetEnd > 24) return;
      L.state.schedule = s; L.emit('schedule'); push('schedule');
    },
    setTime(t) { L.clock = { t: ((t % 24) + 24) % 24, mode: 'scrub' }; L.emit('time'); },
    play() { L.clock.mode = 'play'; L.emit('time'); },
    live() { L.clock = { t: nowHours(), mode: 'live' }; L.emit('time'); },
    setOnline(on) { device.online = on; push('channels'); },
    retry() { push('channels'); push('schedule'); },
  };

  const timers = {};
  function push(kind) {
    clearTimeout(timers[kind]);
    L.sync = 'saving'; L.emit('sync');
    timers[kind] = setTimeout(async () => {
      const res = kind === 'schedule'
        ? await device.request('PUT', '/api/v1/schedule', L.state.schedule)
        : await device.request('PUT', '/api/v1/channels', { mix: L.state.mix, master: L.state.master, preset: L.state.preset });
      L.sync = res.status === 200 ? 'saved' : 'error'; L.emit('sync');
    }, 160);
  }

  device.request('GET', '/api/v1/state').then((res) => {
    if (res.status === 200) { const { device: _, ...st } = res.json; L.state = st; L.sync = 'saved'; }
    else L.sync = 'error';
    L.emit('mix'); L.emit('sync');
  });

  // Clock: live follows the wall clock; play runs a whole day in 40 s for demos.
  let last = performance.now();
  (function tick(now) {
    const dt = (now - last) / 1000; last = now;
    if (L.clock.mode === 'play') { L.clock.t = (L.clock.t + dt * 24 / 40) % 24; L.emit('time'); }
    else if (L.clock.mode === 'live' && Math.floor(now / 1000) !== Math.floor((now - dt * 1000) / 1000)) { L.clock.t = nowHours(); L.emit('time'); }
    requestAnimationFrame(tick);
  })(last);

  // Self-check: Coral Pop at midday must read ~280 PAR, like the product render.
  console.assert(Math.round(par(output(12, DEFAULT))) === 279, 'PAR model drifted from render (expected ~280)');
  console.assert(factor(3, DEFAULT.schedule) === 0 && factor(12, DEFAULT.schedule) === 1, 'schedule factor broken');

  // ?t=12 opens the page previewing that hour (for demos and README screenshots)
  const qt = parseFloat(new URLSearchParams(location.search).get('t'));
  if (Number.isFinite(qt)) L.clock = { t: clamp(qt, 0, 23.99), mode: 'scrub' };

  window.Lumen = L;
})();
