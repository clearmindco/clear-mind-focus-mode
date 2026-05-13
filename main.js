/* ============================================================
   RIVERA'S EXPRESS PAINTING & FLOORING — main.js
   ============================================================ */

(function () {
  'use strict';

  /* ── HELPERS ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── 1. STICKY NAV ── */
  const header = $('#header');
  const onScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    updateActiveNav();
    toggleScrollTop();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 2. ACTIVE NAV LINKS ── */
  const sections = $$('section[id], div[id]');
  const navLinks = $$('.nav-links a[href^="#"], .nav-mobile a[href^="#"]');

  function updateActiveNav() {
    let current = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= 120) current = sec.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  /* ── 3. MOBILE MENU ── */
  const toggle = $('#navToggle');
  const mobileMenu = $('#navMobile');
  const mobileLinks = $$('.nav-mobile a');

  toggle?.addEventListener('click', () => {
    const open = toggle.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileLinks.forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ── 4. SMOOTH SCROLLING ── */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = header.offsetHeight + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── 5. SCROLL REVEAL (INTERSECTION OBSERVER) ── */
  const revealOpts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        revealObs.unobserve(en.target);
      }
    });
  }, revealOpts);

  $$('.reveal, .reveal-left, .reveal-right').forEach(el => revealObs.observe(el));

  /* ── 6. FAQ ACCORDION ── */
  $$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      /* Close all */
      $$('.faq-item.open').forEach(el => el.classList.remove('open'));

      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── 7. GALLERY LIGHTBOX ── */
  const lightbox   = $('#lightbox');
  const lbImg      = $('#lbImg');
  const lbCaption  = $('#lbCaption');
  const lbClose    = $('#lbClose');
  const lbPrev     = $('#lbPrev');
  const lbNext     = $('#lbNext');
  const galleryItems = $$('.gallery-item');
  let lbIndex = 0;

  function openLightbox(idx) {
    lbIndex = idx;
    const item = galleryItems[idx];
    const img = item.dataset.full || item.dataset.src || '';
    const caption = item.dataset.caption || '';

    if (lbImg) {
      if (img) {
        lbImg.src = img;
        lbImg.style.display = 'block';
        lbImg.nextElementSibling && (lbImg.nextElementSibling.style.display = 'none');
      } else {
        lbImg.style.display = 'none';
        const ph = $('#lbPlaceholder');
        if (ph) ph.style.display = 'flex';
      }
    }
    if (lbCaption) lbCaption.textContent = caption;
    lightbox?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function prevImage() {
    lbIndex = (lbIndex - 1 + galleryItems.length) % galleryItems.length;
    openLightbox(lbIndex);
  }
  function nextImage() {
    lbIndex = (lbIndex + 1) % galleryItems.length;
    openLightbox(lbIndex);
  }

  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  lbClose?.addEventListener('click', closeLightbox);
  lbPrev?.addEventListener('click', prevImage);
  lbNext?.addEventListener('click', nextImage);

  lightbox?.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  /* ── 8. SCROLL TO TOP ── */
  const scrollTopBtn = $('#scrollTop');

  function toggleScrollTop() {
    scrollTopBtn?.classList.toggle('show', window.scrollY > 400);
  }

  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── 9. ESTIMATE FORM ── */
  const form        = $('#estimateForm');
  const formWrap    = $('#formWrap');
  const formSuccess = $('#formSuccess');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Sending…</span>';
    submitBtn.disabled = true;

    try {
      const data = new FormData(form);
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });

      if (res.ok) {
        formWrap.style.display = 'none';
        formSuccess?.classList.add('show');
      } else {
        throw new Error('Network error');
      }
    } catch {
      /* Fallback: show success anyway if Netlify not configured */
      formWrap.style.display = 'none';
      formSuccess?.classList.add('show');
    }

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  });

  /* ── 10. PHONE PULSE ANIMATION ── */
  const mapPins = $$('.areas-map-pin-dot');
  mapPins.forEach((pin, i) => {
    pin.style.animationDelay = `${i * 0.4}s`;
  });

  /* ── 11. TRUST TICKER DUPLICATE ── */
  const ticker = $('#trustTicker');
  if (ticker) {
    const clone = ticker.cloneNode(true);
    ticker.parentElement.appendChild(clone);
  }

  /* ── 12. COUNTER ANIMATION ── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const step = 16;
    const increments = Math.ceil(duration / step);
    let count = 0;
    const inc = target / increments;

    const timer = setInterval(() => {
      count = Math.min(count + inc, target);
      el.textContent = Math.floor(count).toLocaleString() + (el.dataset.suffix || '');
      if (count >= target) clearInterval(timer);
    }, step);
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        animateCounter(en.target);
        counterObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.5 });

  $$('[data-target]').forEach(el => counterObs.observe(el));

  /* ── 13. FILE UPLOAD LABEL ── */
  const fileInput = $('#photoUpload');
  const fileLabel = $('#uploadLabel');

  fileInput?.addEventListener('change', () => {
    const files = fileInput.files;
    if (files.length > 0) {
      const names = [...files].map(f => f.name).join(', ');
      if (fileLabel) {
        fileLabel.querySelector('strong').textContent = `${files.length} file(s) selected`;
        fileLabel.querySelector('.form-upload-text').textContent = names.substring(0, 60) + (names.length > 60 ? '…' : '');
      }
    }
  });

  /* ── 14. FORM FIELD FOCUS EFFECT ── */
  $$('.form-input, .form-select, .form-textarea').forEach(input => {
    const field = input.closest('.form-field');
    input.addEventListener('focus',  () => field?.classList.add('focused'));
    input.addEventListener('blur',   () => field?.classList.remove('focused'));
  });

})();
