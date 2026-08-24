// Bilingual toggle (Arabic default, English optional)
const langToggle = document.getElementById('langToggle');
const LANG_KEY = 'site-lang';

function applyLang(lang) {
  const en = lang === 'en';
  const root = document.documentElement;
  root.lang = en ? 'en' : 'ar';
  root.dir = en ? 'ltr' : 'rtl';

  // swap inner HTML for elements that have an English variant
  document.querySelectorAll('[data-en]').forEach((el) => {
    if (el.dataset.ar === undefined) el.dataset.ar = el.innerHTML.trim();
    el.innerHTML = en ? el.dataset.en : el.dataset.ar;
  });
  // swap aria-labels
  document.querySelectorAll('[data-en-label]').forEach((el) => {
    if (el.dataset.arLabel === undefined) el.dataset.arLabel = el.getAttribute('aria-label') || '';
    el.setAttribute('aria-label', en ? el.dataset.enLabel : el.dataset.arLabel);
  });
  // swap input/textarea placeholders
  document.querySelectorAll('[data-en-ph]').forEach((el) => {
    if (el.dataset.arPh === undefined) el.dataset.arPh = el.getAttribute('placeholder') || '';
    el.setAttribute('placeholder', en ? el.dataset.enPh : el.dataset.arPh);
  });

  if (langToggle) {
    langToggle.textContent = en ? 'العربية' : 'EN';
    langToggle.setAttribute('aria-label', en ? 'التبديل إلى العربية' : 'Switch to English');
  }
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
}

let savedLang = 'ar';
try { if (localStorage.getItem(LANG_KEY) === 'en') savedLang = 'en'; } catch (e) {}
applyLang(savedLang);

if (langToggle) {
  langToggle.addEventListener('click', () => {
    applyLang(document.documentElement.lang === 'ar' ? 'en' : 'ar');
  });
}

// Mobile navigation toggle
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
});

// Close menu when a link is clicked (mobile)
nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Scroll to the very top for links to #top (back-to-top button + logo).
// href="#top" alone fails because the sticky header is always in view.
document.querySelectorAll('.back-top, a.logo').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Scroll progress bar
const progress = document.createElement('div');
progress.className = 'scroll-progress';
document.body.appendChild(progress);

// Header shadow on scroll
const header = document.querySelector('.site-header');
const onScroll = () => {
  const h = document.documentElement;
  const scrolled = h.scrollTop || document.body.scrollTop;
  const height = h.scrollHeight - h.clientHeight;
  progress.style.width = height > 0 ? (scrolled / height) * 100 + '%' : '0%';
  if (header) header.classList.toggle('scrolled', scrolled > 8);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Reveal-on-scroll animation (with per-group stagger)
const revealEls = document.querySelectorAll(
  '.card, .feature, .work, .section-head, .contact-inner, .contact-actions, .social, .hire-panel'
);
revealEls.forEach((el) => el.classList.add('reveal'));

// Stagger items that share the same grid/parent
document.querySelectorAll('.cards, .features, .portfolio-grid').forEach((grid) => {
  Array.from(grid.children).forEach((child, i) => {
    child.style.transitionDelay = (i % 3) * 0.09 + 0.05 * Math.floor(i / 3) + 's';
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
        // clear stagger delay so it doesn't affect later hover transitions
        setTimeout(() => { entry.target.style.transitionDelay = ''; }, 1000);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => observer.observe(el));

// ===== Consultation modal =====
const consultModal = document.getElementById('consultModal');
const openConsultBtn = document.getElementById('openConsult');
if (consultModal && openConsultBtn) {
  const cBody = document.getElementById('consultBody');
  const cThanks = document.getElementById('consultThanks');
  const cForm = document.getElementById('consultForm');

  const openModal = () => {
    cBody.hidden = false;
    cThanks.hidden = true;
    consultModal.hidden = false;
    document.body.classList.add('modal-open');
    const first = document.getElementById('cm-name');
    if (first) setTimeout(() => first.focus(), 50);
  };
  const closeModal = () => {
    consultModal.hidden = true;
    document.body.classList.remove('modal-open');
  };

  openConsultBtn.addEventListener('click', openModal);
  consultModal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !consultModal.hidden) closeModal();
  });

  const FORM_ENDPOINT = 'https://formsubmit.co/ajax/islam.daw@gmail.com';
  cForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!cForm.checkValidity()) { cForm.reportValidity(); return; }
    const en = document.documentElement.lang === 'en';
    const btn = cForm.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = en ? 'Sending…' : 'جارٍ الإرسال…';
    const payload = {
      name: document.getElementById('cm-name').value.trim(),
      email: document.getElementById('cm-email').value.trim(),
      phone: document.getElementById('cm-phone').value.trim(),
      message: document.getElementById('cm-message').value.trim(),
      _subject: 'طلب استشارة جديد من الموقع',
      _template: 'table',
      _captcha: 'false'
    };
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (json && String(json.success) === 'true') {
        cForm.reset();
        cBody.hidden = true;
        cThanks.hidden = false;
      } else {
        throw new Error(json && json.message ? json.message : 'send failed');
      }
    } catch (err) {
      alert(en
        ? 'Sorry, sending failed. Please contact me on WhatsApp: +970 599 268 700'
        : 'عذرًا، تعذّر الإرسال. يرجى التواصل عبر واتساب: 970599268700+');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

// Localized (Arabic) form validation messages
(function () {
  const dict = {
    ar: { fill: 'يرجى تعبئة هذا الحقل', email: 'يرجى إدخال بريد إلكتروني صحيح', check: 'يرجى التحقق من هذا الحقل' },
    en: { fill: 'Please fill out this field.', email: 'Please enter a valid email address.', check: 'Please check this field.' }
  };
  const msgFor = (el) => {
    const t = dict[document.documentElement.lang === 'en' ? 'en' : 'ar'];
    if (el.validity.valueMissing) return t.fill;
    if (el.validity.typeMismatch) return el.type === 'email' ? t.email : t.check;
    return t.check;
  };
  document.querySelectorAll('#consultForm input, #consultForm textarea').forEach((el) => {
    el.addEventListener('invalid', () => el.setCustomValidity(msgFor(el)));
    el.addEventListener('input', () => el.setCustomValidity(''));
  });
})();
