// ===== Mobile menu =====
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', false);
  })
);

// ===== Reveal on scroll =====
const revealTargets = document.querySelectorAll(
  '.section__head, .service, .adv__card, .about__intro, .cases, .step, .review, .quiz, .contacts, .stat'
);
revealTargets.forEach((el) => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);
revealTargets.forEach((el) => revealObserver.observe(el));

// ===== Animated counters =====
const formatNum = (n, decimals) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const decimals = Number(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const duration = 1600;

      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = formatNum(target * eased, decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);
document.querySelectorAll('[data-count]').forEach((el) => countObserver.observe(el));

// ===== Cases accordion =====
const cases = [...document.querySelectorAll('.case')];
const caseImg = document.getElementById('caseImg');
const caseNum = document.getElementById('caseNum');

cases.forEach((item, i) => {
  item.querySelector('.case__head').addEventListener('click', () => {
    if (item.classList.contains('is-open')) return;
    cases.forEach((c) => c.classList.remove('is-open'));
    item.classList.add('is-open');
    caseNum.textContent = String(i + 1).padStart(2, '0');

    caseImg.classList.add('is-fading');
    const next = new Image();
    next.src = item.dataset.img;
    next.onload = () => {
      caseImg.src = item.dataset.img;
      caseImg.alt = item.querySelector('.case__head').firstChild.textContent.trim();
      caseImg.classList.remove('is-fading');
    };
  });
});

// ===== Quiz funnel =====
const form = document.getElementById('quizForm');
const steps = [...form.querySelectorAll('.qstep')];
const bar = document.getElementById('quizBar');
const stepLabel = document.getElementById('quizStep');
const btnBack = document.getElementById('quizBack');
const btnNext = document.getElementById('quizNext');
const errorEl = document.getElementById('quizError');
const done = document.getElementById('quizDone');
const nav2 = document.getElementById('quizNav');
const total = steps.length;
let current = 1;

function showStep(n) {
  current = n;
  steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) === n));
  bar.style.width = `${(n / total) * 100}%`;
  stepLabel.textContent = n;
  btnBack.disabled = n === 1;
  btnNext.textContent = n === total ? 'Получить расчёт' : 'Далее';
  errorEl.textContent = '';
}

function validate(n) {
  const data = new FormData(form);
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  const fail = (msg, field) => {
    errorEl.textContent = msg;
    if (field) {
      const input = form.elements[field];
      input.classList.add('is-invalid');
      input.focus();
    }
    return false;
  };

  if (n === 1 && !data.get('service')) return fail('Выберите услугу');
  if (n === 2 && !data.get('car').trim()) return fail('Укажите марку и модель', 'car');
  if (n === 3 && !data.get('when')) return fail('Выберите, когда удобно приехать');
  if (n === 4) {
    if (!data.get('name').trim()) return fail('Как к вам обращаться?', 'name');
    if (data.get('phone').replace(/\D/g, '').length < 11) return fail('Введите номер телефона полностью', 'phone');
    if (!data.get('agree')) return fail('Нужно согласие на обработку данных');
  }
  return true;
}

function submitQuiz() {
  const data = Object.fromEntries(new FormData(form));
  // Демо-режим: заявка никуда не отправляется. Здесь подключается Telegram-бот, CRM или почта.
  console.log('Новая заявка FIXSERVICE:', data);

  steps.forEach((s) => s.classList.remove('is-active'));
  nav2.hidden = true;
  errorEl.textContent = '';
  bar.style.width = '100%';
  stepLabel.textContent = total;
  document.getElementById('quizSum').innerHTML = [data.service, data.car + (data.year ? `, ${data.year}` : ''), data.when]
    .map((t) => `<span>${t.replace(/</g, '&lt;')}</span>`)
    .join('');
  done.hidden = false;
}

btnNext.addEventListener('click', () => {
  if (!validate(current)) return;
  if (current < total) showStep(current + 1);
  else submitQuiz();
});
btnBack.addEventListener('click', () => current > 1 && showStep(current - 1));

// Auto-advance on radio choice
form.querySelectorAll('input[type="radio"]').forEach((r) =>
  r.addEventListener('change', () => setTimeout(() => validate(current) && showStep(current + 1), 250))
);

form.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
    e.preventDefault();
    btnNext.click();
  }
});

// "Оставить заявку" on service cards pre-selects the service
document.querySelectorAll('[data-service]').forEach((btn) =>
  btn.addEventListener('click', () => {
    const radio = form.querySelector(`input[name="service"][value="${btn.dataset.service}"]`);
    if (!radio || !done.hidden) return;
    radio.checked = true;
    showStep(2);
  })
);

// Phone mask +7 (XXX) XXX-XX-XX
const phone = form.elements.phone;
phone.addEventListener('input', () => {
  let d = phone.value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let out = '+7';
  if (p[0]) out += ` (${p[0]}`;
  if (p[0].length === 3) out += ')';
  if (p[1]) out += ` ${p[1]}`;
  if (p[2]) out += `-${p[2]}`;
  if (p[3]) out += `-${p[3]}`;
  phone.value = out;
});

// ===== Hide mobile CTA near the quiz =====
const mobileCta = document.querySelector('.mobile-cta');
new IntersectionObserver(
  ([entry]) => mobileCta.classList.toggle('is-hidden', entry.isIntersecting),
  { threshold: 0.15 }
).observe(document.getElementById('quiz'));
