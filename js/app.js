/* Seam interaction, scroll reveals, language bootstrapping. */

(function () {
  'use strict';

  /* ---------- Language ---------- */

  function resolveLang() {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'fr' || param === 'en') return param;
    try {
      const stored = localStorage.getItem('lang');
      if (stored === 'fr' || stored === 'en') return stored;
    } catch (e) { /* storage may be unavailable */ }
    const nav = navigator.language || '';
    if (nav) return nav.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    return 'fr';
  }

  let currentLang = resolveLang();
  applyLang(currentLang);

  const toggle = document.getElementById('lang-toggle');
  toggle.addEventListener('click', () => {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    applyLang(currentLang);
  });

  /* ---------- Seam (hero) ---------- */

  const hero = document.getElementById('hero');
  const finePointer = window.matchMedia('(pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (finePointer.matches && !reducedMotion.matches) {
    let current = 50;
    let target = 50;
    let rafId = null;
    let idleTimer = null;

    // Piecewise opacity: 0.25 at center, up to 0.55 when the seam reaches that
    // side (22% / 78%), down to 0.12 on the far side.
    function paneOpacity(x, side) {
      const t = (x - 50) / 28; // -1 (full left) .. 1 (full right)
      const s = side === 'left' ? -t : t;
      return s >= 0 ? 0.25 + s * (0.55 - 0.25) : 0.25 + s * (0.25 - 0.12);
    }

    function apply() {
      const left = paneOpacity(current, 'left');
      const right = paneOpacity(current, 'right');
      hero.style.setProperty('--seam-x', current + '%');
      hero.style.setProperty('--list-l', left.toFixed(3));
      hero.style.setProperty('--list-r', right.toFixed(3));
      hero.style.setProperty('--wash-l', (0.08 * (left / 0.25)).toFixed(3));
      hero.style.setProperty('--wash-r', (0.08 * (right / 0.25)).toFixed(3));
    }

    function tick() {
      current += (target - current) * 0.08;
      if (Math.abs(target - current) < 0.05) {
        current = target;
        rafId = null;
      } else {
        rafId = requestAnimationFrame(tick);
      }
      apply();
    }

    function setTarget(value) {
      target = value;
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setTarget(Math.min(78, Math.max(22, pct)));
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setTarget(50), 4000);
    });

    hero.addEventListener('pointerleave', () => {
      clearTimeout(idleTimer);
      setTarget(50);
    });
  }

  /* ---------- Scroll reveals ---------- */

  const revealed = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealed.forEach((el) => observer.observe(el));
  } else {
    revealed.forEach((el) => el.classList.add('in'));
  }
})();
