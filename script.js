// script.js
// Interatividade, acessibilidade e pequenos utilitários para o Undertale Fan Hub.
// Coloque este arquivo como assets/js/script.js e adicione <script src="assets/js/script.js" defer></script> antes do fechamento de </body>.

// Strict mode
'use strict';

/* -------------------------
   Helper utilities
   ------------------------- */
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const on = (el, ev, fn) => (el && el.addEventListener(ev, fn));

/* -------------------------
   Smooth internal navigation focus management
   ------------------------- */
on(document, 'click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // move focus for keyboard users
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  window.setTimeout(() => target.removeAttribute('tabindex'), 1000);
});

/* -------------------------
   Reveal animations on scroll (IntersectionObserver)
   ------------------------- */
(function setupReveal() {
  const els = $$('.reveal');
  if (!els.length || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();

/* -------------------------
   Audio playlist preview with keyboard controls
   ------------------------- */
const AudioPlayer = (function () {
  const audio = $('#audio1');
  if (!audio) return null;
  let playlist = [
    { title: 'Determination (fan remix)', src: audio.querySelector('source')?.src || 'assets/audio/sample.mp3' }
  ];
  let index = 0;

  function load(i) {
    index = (i + playlist.length) % playlist.length;
    audio.src = playlist[index].src;
    audio.load();
    audio.play().catch(()=>{/* autoplay blocked; user gesture required */});
    updateNowPlaying();
  }

  function updateNowPlaying() {
    const info = document.createElement('div');
    info.id = 'now-playing';
    info.style.fontSize = '13px';
    info.style.color = 'var(--muted)';
    info.textContent = `Tocando: ${playlist[index].title}`;
    const existing = $('#now-playing');
    if (existing) existing.replaceWith(info); else audio.parentElement.appendChild(info);
  }

  // Keyboard shortcuts: Space toggle, Arrow Right next, Arrow Left prev
  on(document, 'keydown', e => {
    if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (!audio) return;
    if (e.code === 'Space') {
      e.preventDefault();
      audio.paused ? audio.play().catch(()=>{}) : audio.pause();
    }
    if (e.code === 'ArrowRight') { load(index + 1); }
    if (e.code === 'ArrowLeft') { load(index - 1); }
  });

  // init
  audio.addEventListener('play', updateNowPlaying);
  audio.addEventListener('pause', updateNowPlaying);
  updateNowPlaying();

  return { load };
})();

/* -------------------------
   Lightweight gallery lightbox
   ------------------------- */
(function setupLightbox() {
  const thumbs = $$('.gallery img[loading]');
  if (!thumbs.length) return;

  // Create lightbox elements
  const overlay = document.createElement('div');
  overlay.id = 'lf-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: 0, background: 'rgba(3,6,12,0.9)', display: 'none', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, padding: '20px'
  });
  const img = document.createElement('img');
  img.alt = '';
  Object.assign(img.style, { maxWidth: '95%', maxHeight: '95%', borderRadius: '10px', boxShadow: '0 6px 30px rgba(0,0,0,0.6)' });
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  function open(src, alt) {
    img.src = src;
    img.alt = alt || '';
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    img.focus?.();
  }
  function close() {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    img.src = '';
  }

  thumbs.forEach(t => {
    t.style.cursor = 'zoom-in';
    t.tabIndex = 0;
    on(t, 'click', () => open(t.src || t.dataset.src, t.alt));
    on(t, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(t.src || t.dataset.src, t.alt); } });
  });

  overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target === img) close(); });
  on(document, 'keydown', e => { if (e.key === 'Escape') close(); });
})();

/* -------------------------
   Dark mode toggle with prefers-color-scheme support
   ------------------------- */
(function darkMode() {
  const toggleId = 'uf-dark-toggle';
  const stored = localStorage.getItem('uf-dark') || null;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = stored ? (stored === '1') : prefersDark;
  if (isDark) document.documentElement.classList.add('dark-mode');

  // create small toggle in header
  const header = document.querySelector('header .brand');
  if (!header) return;
  const btn = document.createElement('button');
  btn.id = toggleId;
  btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  btn.title = 'Alternar modo escuro';
  Object.assign(btn.style, {
    marginLeft: '12px', padding: '6px 10px', borderRadius: '8px', background: 'transparent', color: 'inherit',
    border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer'
  });
  btn.textContent = isDark ? 'Modo Escuro' : 'Modo Claro';
  header.appendChild(btn);

  btn.addEventListener('click', () => {
    const active = document.documentElement.classList.toggle('dark-mode');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.textContent = active ? 'Modo Escuro' : 'Modo Claro';
    localStorage.setItem('uf-dark', active ? '1' : '0');
  });

  // minimal CSS injection for dark mode adjustments
  const style = document.createElement('style');
  style.textContent = `
    :root { color-scheme: dark; }
    .dark-mode body { background: linear-gradient(180deg,#020204 0%, #05060a 100%); }
    .dark-mode .card { filter: brightness(1.02); }
  `;
  document.head.appendChild(style);
})();

/* -------------------------
   Accessibility fixes and focus outlines for keyboard users
   ------------------------- */
(function focusVisiblePolyfill(){
  let keyboard = false;
  on(document, 'keydown', e => { if (e.key === 'Tab') keyboard = true; });
  on(document, 'mousedown', () => keyboard = false);
  document.addEventListener('focusin', e => {
    if (!keyboard) return;
    const el = e.target;
    if (el && el.style) el.style.outline = '3px solid rgba(255,204,0,0.2)';
  });
  document.addEventListener('focusout', e => {
    const el = e.target;
    if (el && el.style) el.style.outline = '';
  });
})();

/* -------------------------
   Small performance improvements: lazyload for non-native images
   ------------------------- */
(function polyfillLazy() {
  if ('loading' in HTMLImageElement.prototype) return;
  const lazy = $$('img[loading="lazy"]');
  if (!lazy.length) return;
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset && img.dataset.src) img.src = img.dataset.src;
      obs.unobserve(img);
    });
  });
  lazy.forEach(img => io.observe(img));
})();

/* -------------------------
   Lightweight analytics event emitter (no external calls)
   ------------------------- */
const events = [];
function trackEvent(name, data = {}) {
  events.push({ ts: Date.now(), name, data });
  // expose for debugging in console
  window._uf_analytics = window._uf_analytics || [];
  window._uf_analytics.push({ name, data, ts: Date.now() });
}
// Examples of tracked events
on(document, 'click', e => {
  const target = e.target.closest('a, button, img');
  if (!target) return;
  trackEvent('click', { tag: target.tagName, text: (target.textContent || '').trim().slice(0,50) });
});

/* -------------------------
   Init complete
   ------------------------- */
document.documentElement.classList.add('uf-js');
trackEvent('script_loaded', { version: '1.0' });
