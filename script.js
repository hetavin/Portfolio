/* =========================================================
   Hetavin Pokiya – Portfolio  |  script.js
   ========================================================= */

'use strict';

/* =========================================================
   0. PAGE LOADER — 5-second minimum progress bar + water fill
   ========================================================= */
(function () {
  const TOTAL_MS = 5000;

  const loader     = document.getElementById('page-loader');
  const barFill    = document.getElementById('plBarFill');
  const barGlow    = document.getElementById('plBarGlow');
  const percent    = document.getElementById('plPercent');
  const statusEl   = document.getElementById('plStatus');
  const nameFill   = document.getElementById('plNameFill');   // fill layer
  const waterline  = document.getElementById('plWaterline');  // glow line

  if (!loader || !barFill) return;

  const stages = [
    { at: 10,  label: 'Loading assets…'   },
    { at: 28,  label: 'Building layout…'  },
    { at: 48,  label: 'Applying styles…'  },
    { at: 66,  label: 'Running scripts…'  },
    { at: 84,  label: 'Almost ready…'     },
    { at: 100, label: 'Welcome!'           },
  ];

  let current  = 0;
  let stageIdx = 0;
  let rafId;
  const startTime = performance.now();

  function setProgress(val) {
    current = Math.min(val, 100);
    const pct = Math.round(current);

    /* ── Progress bar ── */
    barFill.style.width  = pct + '%';
    barGlow.style.left   = `calc(${pct}% - 10px)`;
    percent.textContent  = pct + '%';

    /* ── Water fill on name ── */
    if (nameFill) {
      // clip-path inset from top → (100 - pct)% = water level
      nameFill.style.clipPath = `inset(${100 - pct}% 0 0 0)`;
    }

    /* ── Waterline position ── */
    if (waterline) {
      if (pct > 1 && pct < 100) {
        waterline.style.opacity = '1';
        // top = (100-pct)% of the name wrap height
        waterline.style.top = `${100 - pct}%`;
      } else {
        waterline.style.opacity = '0';
      }
    }

    /* ── Stage labels ── */
    if (stageIdx < stages.length && current >= stages[stageIdx].at) {
      statusEl.textContent = stages[stageIdx].label;
      stageIdx++;
    }
  }

  // Time-driven tick — reaches ~92% at 4.4 s
  function tick(now) {
    const elapsed = now - startTime;
    const natural = (elapsed / TOTAL_MS) * 92;
    setProgress(natural);
    if (current < 92) rafId = requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function finish() {
    cancelAnimationFrame(rafId);
    setProgress(100);
    setTimeout(() => loader.classList.add('loaded'), 600);
  }

  const timerDone = new Promise(resolve => setTimeout(resolve, TOTAL_MS));
  const pageDone  = new Promise(resolve => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });

  Promise.all([timerDone, pageDone]).then(finish);
})();


/* ---- DOM helpers ---- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* =========================================================
   1. CUSTOM CURSOR
   ========================================================= */
const cursor = $('#cursor');
const follower = $('#cursorFollower');

if (window.matchMedia('(hover: hover)').matches && cursor && follower) {
  let mx = 0, my = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    follower.style.left = mx + 'px';
    follower.style.top  = my + 'px';
  });

  // Grow follower on interactive elements
  $$('a, button, .skill-pill, .proj-card, .strength-card, .ci').forEach(el => {
    el.addEventListener('mouseenter', () => {
      follower.style.width = '50px';
      follower.style.height = '50px';
      follower.style.opacity = '0.5';
    });
    el.addEventListener('mouseleave', () => {
      follower.style.width = '32px';
      follower.style.height = '32px';
      follower.style.opacity = '1';
    });
  });
}

/* =========================================================
   2. NAVBAR — scroll effects & active link
   ========================================================= */
const navbar = $('#navbar');
const sections = $$('section[id]');
const navLinks = $$('.nav-link');

window.addEventListener('scroll', () => {
  // Scrolled class
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Active nav link
  const scrollY = window.scrollY + 120;
  sections.forEach(sec => {
    const top = sec.offsetTop;
    const h   = sec.offsetHeight;
    const id  = sec.getAttribute('id');
    if (scrollY >= top && scrollY < top + h) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = $$(`.nav-link[href="#${id}"]`);
      active.forEach(l => l.classList.add('active'));
    }
  });
}, { passive: true });

/* =========================================================
   3. MOBILE MENU
   ========================================================= */
const hamburger = $('#hamburger');
const mobileMenu = $('#mobileMenu');

hamburger?.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
});

// Close on mobile link click
$$('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

/* =========================================================
   4. TYPEWRITER EFFECT
   ========================================================= */
const typeEl = $('#typewriter');
const phrases = [
  'Computer Engineering Student',
  'Aspiring Software Developer',
  'ML & Computer Vision Enthusiast',
  'Flask & Python Builder',
  'Open to Internships',
];
let phraseIdx = 0;
let charIdx   = 0;
let isDeleting = false;

function typewrite() {
  if (!typeEl) return;
  const current = phrases[phraseIdx];

  if (!isDeleting) {
    typeEl.textContent = current.slice(0, ++charIdx);
    if (charIdx === current.length) {
      isDeleting = true;
      setTimeout(typewrite, 1800);
      return;
    }
  } else {
    typeEl.textContent = current.slice(0, --charIdx);
    if (charIdx === 0) {
      isDeleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
    }
  }
  setTimeout(typewrite, isDeleting ? 50 : 90);
}

// Start after a brief delay
setTimeout(typewrite, 400);

/* =========================================================
   5. COUNTER ANIMATION (hero stats)
   ========================================================= */
function animateCounter(el, target, duration = 1200) {
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(ease * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      $$('.stat-num').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target));
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.4 });

const heroStats = $('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

/* =========================================================
   6. SCROLL REVEAL
   ========================================================= */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings if inside a grid
      const delay = entry.target.dataset.delay
        || (Array.from(entry.target.parentElement?.children || []).indexOf(entry.target) * 80);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach(el => revealObserver.observe(el));

/* =========================================================
   7. CONTACT FORM — mailto handler
   ========================================================= */
const contactForm = $('#contactForm');
const submitBtn   = $('#submitBtn');

contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();

  const name    = $('#fname').value.trim();
  const email   = $('#femail').value.trim();
  const subject = $('#fsubject').value.trim() || 'Message from Portfolio';
  const message = $('#fmsg').value.trim();

  // Simple validation
  if (!name) { showToast('Please enter your name.', 'error'); $('#fname').focus(); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email.', 'error'); $('#femail').focus(); return;
  }
  if (!message) { showToast('Please write a message.', 'error'); $('#fmsg').focus(); return; }

  // Build mailto
  const body = `Hi Hetavin,\n\n${message}\n\n---\nFrom: ${name}\nEmail: ${email}`;
  const mailto = `mailto:hetavinpokiya@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Button loading state
  const originalHTML = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span style="display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></span> Sending...';
  submitBtn.disabled = true;

  // Inject spin keyframes once
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }

  setTimeout(() => {
    window.location.href = mailto;
    submitBtn.innerHTML = originalHTML;
    submitBtn.disabled = false;
    contactForm.reset();
    showToast('✓ Mail client opened!', 'success');
  }, 600);
});

/* =========================================================
   8. TOAST NOTIFICATION
   ========================================================= */
function showToast(msg, type = 'success') {
  let toast = document.getElementById('liveToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'liveToast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  void toast.offsetWidth; // reflow
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

/* =========================================================
   9. SMOOTH SCROLL for anchor links (custom eased)
   ========================================================= */
function smoothScrollTo(targetEl, duration = 800) {
  const navH   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 70;
  const start  = window.scrollY;
  const target = targetEl.getBoundingClientRect().top + window.scrollY - navH;
  const diff   = target - start;
  let startTime = null;

  function easeInOutExpo(t) {
    return t === 0 ? 0 : t === 1 ? 1 :
      t < 0.5 ? Math.pow(2, 20 * t - 10) / 2
              : (2 - Math.pow(2, -20 * t + 10)) / 2;
  }

  function step(ts) {
    if (!startTime) startTime = ts;
    const elapsed  = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + diff * easeInOutExpo(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      smoothScrollTo(target, 900);
    }
  });
});

/* =========================================================
   10. SKILL PILL — subtle hover tilt
   ========================================================= */
$$('.skill-pill').forEach(pill => {
  pill.addEventListener('mousemove', (e) => {
    const rect = pill.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width  - 0.5;
    const yRel = (e.clientY - rect.top)  / rect.height - 0.5;
    pill.style.transform = `translateY(-3px) rotateX(${yRel * -8}deg) rotateY(${xRel * 8}deg)`;
  });
  pill.addEventListener('mouseleave', () => {
    pill.style.transform = '';
  });
});

/* =========================================================
   11. PROJECT CARD — 3D tilt on hover
   ========================================================= */
$$('.proj-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width  - 0.5;
    const yRel = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${yRel * -6}deg) rotateY(${xRel * 6}deg)`;
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.4s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s';
  });
});

/* =========================================================
   12. PARALLAX — hero orbs follow mouse gently
   ========================================================= */
const orb1 = document.querySelector('.orb-1');
const orb2 = document.querySelector('.orb-2');
const orb3 = document.querySelector('.orb-3');

if (orb1 && orb2 && orb3) {
  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    orb1.style.transform = `translate(${dx * 18}px, ${dy * 14}px) scale(1)`;
    orb2.style.transform = `translate(${dx * -14}px, ${dy * -10}px) scale(1)`;
    orb3.style.transform = `translate(${dx * 10}px, ${dy * 18}px) scale(1)`;
  });

  // Smooth transition for orbs
  [orb1, orb2, orb3].forEach(o => {
    o.style.transition = 'transform 1.2s cubic-bezier(0.25,0.46,0.45,0.94)';
  });
}

/* =========================================================
   13. SKILL PILLS — staggered scroll reveal
   ========================================================= */
const skillRows = $$('.skill-row');
skillRows.forEach(row => {
  const pills = [...row.children];
  pills.forEach((pill, i) => {
    pill.style.opacity    = '0';
    pill.style.transform  = 'translateY(20px)';
    pill.style.transition = `opacity 0.5s ease ${i * 80}ms, transform 0.5s cubic-bezier(.34,1.56,.64,1) ${i * 80}ms`;
  });
});

const pillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      [...entry.target.children].forEach(pill => {
        pill.style.opacity   = '1';
        pill.style.transform = 'translateY(0)';
      });
      pillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

skillRows.forEach(row => pillObserver.observe(row));

/* =========================================================
   INIT — page ready
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Ensure hero stats start at 0 visually
  $$('.stat-num').forEach(el => { el.textContent = '0'; });

  // Mark first section as active in nav
  if (navLinks[0]) navLinks[0].classList.add('active');

  // Navbar entrance
  const navbar = $('#navbar');
  if (navbar) {
    navbar.style.opacity    = '0';
    navbar.style.transform  = 'translateY(-16px)';
    navbar.style.transition = 'opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(.16,1,.3,1) 0.1s';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        navbar.style.opacity   = '1';
        navbar.style.transform = 'translateY(0)';
      });
    });
  }
});
