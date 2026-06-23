/* =========================================================
   Hetavin Pokiya – Portfolio  |  script.js
   ========================================================= */

'use strict';

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
   9. SMOOTH SCROLL for anchor links
   ========================================================= */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
   INIT — page ready
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Ensure hero stats start at 0 visually
  $$('.stat-num').forEach(el => { el.textContent = '0'; });

  // Mark first section as active in nav
  if (navLinks[0]) navLinks[0].classList.add('active');
});
