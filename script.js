/* ============ ÉLORA SKIN — interactions (vanilla JS) ============ */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body = document.body;

  /* ---------- Image fallback: keep layout pretty if a photo fails ---------- */
  $$('img').forEach(img => {
    img.addEventListener('error', () => { img.style.opacity = '0'; });
  });

  /* ---------- Page loader ---------- */
  body.classList.add('is-loading');
  const loader = $('#loader');
  const startSite = () => {
    loader.classList.add('is-done');
    body.classList.remove('is-loading');
    setTimeout(() => body.classList.add('is-ready'), 500);
  };
  const minDelay = new Promise(r => setTimeout(r, reduceMotion ? 100 : 1600));
  const loaded = new Promise(r => {
    if (document.readyState === 'complete') r();
    else window.addEventListener('load', r, { once: true });
    setTimeout(r, 4000); // never block the page for long
  });
  Promise.all([minDelay, loaded]).then(startSite);

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Custom cursor ---------- */
  const cursor = $('#cursor');
  if (finePointer && !reduceMotion && cursor) {
    body.classList.add('has-cursor');
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    cursor.classList.add('is-hidden');

    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.remove('is-hidden');
    });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));
    window.addEventListener('mousedown', () => cursor.classList.add('is-down'));
    window.addEventListener('mouseup', () => cursor.classList.remove('is-down'));

    const tick = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(tick);
    };
    tick();

    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      cursor.classList.remove('is-link', 'is-button', 'is-card');
      if (t) cursor.classList.add('is-' + t.dataset.cursor);
    });
  }

  /* ---------- Navigation: scrolled state, hide on scroll down, mobile menu ---------- */
  const nav = $('#nav');
  const toggle = $('#navToggle');
  let lastY = 0;

  const setMenu = open => {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Scroll handler: nav + parallax (single rAF loop) ---------- */
  const parallaxEls = $$('[data-parallax]');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 60);
    if (!body.classList.contains('menu-open')) {
      nav.classList.toggle('is-hidden', y > lastY && y > 500);
    }
    lastY = y;

    if (!reduceMotion) {
      const vh = innerHeight;
      parallaxEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const speed = parseFloat(el.dataset.parallax);
        const offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = `translate3d(0, ${(-offset).toFixed(1)}px, 0)`;
      });
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Scroll reveal + stat counters ---------- */
  const countUp = el => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const dur = 1800, t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      $$('[data-count]', entry.target).forEach(countUp);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

  $$('.reveal').forEach((el, i) => {
    // light stagger for siblings that share a parent and have no custom delay
    if (!el.style.getPropertyValue('--d') && el.parentElement.classList.contains('about__text')) {
      el.style.setProperty('--d', (Array.from(el.parentElement.children).indexOf(el) * 0.08) + 's');
    }
    io.observe(el);
  });

  /* ---------- Product cards: Add to bag ---------- */
  const bagBtn = $('#bagBtn');
  const bagCount = $('#bagCount');
  const toast = $('#toast');
  let bag = 0, toastTimer;

  const showToast = msg => {
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-show'), 2400);
  };

  $$('.add').forEach(btn => {
    btn.addEventListener('click', () => {
      bag++;
      bagCount.textContent = bag;
      bagBtn.classList.remove('bump'); void bagBtn.offsetWidth; bagBtn.classList.add('bump');
      btn.classList.add('is-added');
      btn.textContent = 'Added ✓';
      setTimeout(() => { btn.classList.remove('is-added'); btn.textContent = 'Add to Bag'; }, 1600);
      showToast(`${btn.dataset.name} added to your ritual`);
    });
  });
  bagBtn.addEventListener('click', () => {
    showToast(bag === 0 ? 'Your ritual bag is empty — discover the collection' : `You have ${bag} item${bag > 1 ? 's' : ''} in your ritual bag`);
  });

  /* ---------- Skincare ritual (Cleanse / Treat / Hydrate) ---------- */
  const steps = [
    { n: '01', title: 'Cleanse', tip: 'Pairs with — Hydrating Facial Cleanser',
      text: 'Begin with a clean canvas. Massage a small amount of Hydrating Facial Cleanser onto damp skin in slow circles for sixty seconds, then rinse with lukewarm water.' },
    { n: '02', title: 'Treat', tip: 'Pairs with — Vitamin C Serum',
      text: 'Press three drops of Vitamin C Serum into the face and neck. Let the actives settle for a minute — this is where brightness and clarity begin.' },
    { n: '03', title: 'Hydrate', tip: 'Pairs with — Daily Moisturizer & Overnight Repair Cream',
      text: 'Seal in every layer with Daily Moisturizer by day, or Overnight Repair Cream by night, and let your skin drink in deep, lasting comfort.' }
  ];
  const tabs = $$('.ritual__tabs [role="tab"]');
  const imgs = $$('.ritual__imgs img');
  const copy = $('.ritual__copy');
  const bar = $('#ritualBar');
  let current = 0, swapTimer;

  const goStep = i => {
    current = (i + steps.length) % steps.length;
    tabs.forEach((t, k) => {
      t.classList.toggle('is-active', k === current);
      t.setAttribute('aria-selected', String(k === current));
    });
    imgs.forEach((im, k) => im.classList.toggle('is-active', k === current));
    bar.style.transform = `translateX(${current * 100}%)`;
    copy.classList.add('is-swapping');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      const s = steps[current];
      $('#ritualNum').textContent = s.n;
      $('#ritualTitle').textContent = s.title;
      $('#ritualText').textContent = s.text;
      $('#ritualTip').textContent = s.tip;
      copy.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 320);
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => goStep(i)));
  $('#stepPrev').addEventListener('click', () => goStep(current - 1));
  $('#stepNext').addEventListener('click', () => goStep(current + 1));

  /* ---------- Testimonial slider ---------- */
  const track = $('#sliderTrack');
  const slides = $$('.slide', track);
  const dotsWrap = $('#dots');
  let idx = 0, auto;

  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.setAttribute('aria-label', `Go to review ${i + 1}`);
    d.dataset.cursor = 'button';
    d.addEventListener('click', () => { goSlide(i); restartAuto(); });
    dotsWrap.appendChild(d);
  });
  const dots = $$('button', dotsWrap);

  function goSlide(i) {
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
    dots.forEach((d, k) => d.classList.toggle('is-active', k === idx));
  }
  function restartAuto() {
    clearInterval(auto);
    if (!reduceMotion) auto = setInterval(() => goSlide(idx + 1), 7000);
  }
  $('#prev').addEventListener('click', () => { goSlide(idx - 1); restartAuto(); });
  $('#next').addEventListener('click', () => { goSlide(idx + 1); restartAuto(); });

  const slider = $('#slider');
  slider.addEventListener('mouseenter', () => clearInterval(auto));
  slider.addEventListener('mouseleave', restartAuto);
  slider.setAttribute('tabindex', '0');
  slider.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { goSlide(idx - 1); restartAuto(); }
    if (e.key === 'ArrowRight') { goSlide(idx + 1); restartAuto(); }
  });

  // Swipe support (mobile)
  let startX = 0, startY = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { goSlide(idx + (dx < 0 ? 1 : -1)); restartAuto(); }
  }, { passive: true });

  goSlide(0);
  restartAuto();

  /* ---------- Newsletter ---------- */
  const form = $('#newsForm');
  const email = $('#email');
  const msg = $('#formMsg');
  const valid = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = email.value.trim();
    msg.className = 'form__msg';
    email.classList.remove('is-error');
    if (!valid(v)) {
      email.classList.add('is-error');
      msg.classList.add('is-error');
      msg.textContent = 'Please enter a valid email address.';
      return;
    }
    msg.classList.add('is-success');
    msg.textContent = 'Welcome to the ritual. Your 10% welcome gift is on its way ✦';
    form.reset();
    email.blur();
  });
  email.addEventListener('input', () => email.classList.remove('is-error'));
})();
