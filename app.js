(() => {
  'use strict';

  // ---------- Кейсы ----------
  const CASES = [
    {
      title: 'Горянка', type: 'Садиба в Карпатах · живой сайт',
      desc: 'Сайт для семейной садибы: видео-hero, номера, форма брони без посредников. Сайт работает и приводит гостей напрямую.',
      tags: ['Сайт под ключ', 'SEO', 'Бронирование'],
      url: 'https://horianka.com.ua', video: 'assets/video/case-horianka.mp4', poster: 'assets/video/case-horianka.jpg'
    },
    {
      title: 'Карпатська Форель', type: 'Отель и форелевое хозяйство · живой сайт',
      desc: 'Большой сайт с номерами, бассейном, рестораном и рыбалкой. Онлайн-заявка, своя страница под каждую услугу.',
      tags: ['Сайт под ключ', 'SEO', 'Заявки'],
      url: 'https://karpatska-forel.com.ua', video: 'assets/video/case-forel.mp4', poster: 'assets/video/case-forel.jpg'
    },
    {
      title: 'Рутенія', type: 'Мини-отель с бассейном · концепт',
      desc: 'Концепт сайта в стиле «Forest»: тёмная зелень, живое видео с бассейном, бронь прямо с первого экрана.',
      tags: ['Дизайн', 'Hero-видео', 'Концепт'],
      url: 'https://ananinalist-maker.github.io/proto-ruteniya-forest/', video: 'assets/video/case-ruteniya.mp4', poster: 'assets/video/case-ruteniya.jpg'
    },
    {
      title: 'Tuttofare', type: 'Ремонт под ключ в Риме · живой сайт',
      desc: 'Сайт на итальянском для ремонтной компании: услуги, работы, блог. SEO под Google и AI-поиск.',
      tags: ['Сайт', 'SEO', 'Блог'],
      url: 'https://tuttofare-roma.it/', video: 'assets/video/case-tuttofare.mp4', poster: 'assets/video/case-tuttofare.jpg'
    }
  ];

  // ---------- Две сцены: горизонтальная (компьютер) и вертикальная (телефон) ----------
  const MOBILE = matchMedia('(max-width:820px)').matches;
  const CONF = MOBILE ? {
    w: 720, h: 1280,
    trans: 'assets/video/transition-m.mp4', end: 'assets/img/end-m.jpg', overlay: 'assets/img/end_overlay-m.webp',
    quad: [[24, 447], [632, 392], [684, 836], [76, 955]],       // углы экрана в последнем кадре
    focusStart: [0.62, 0.5], focusEnd: [0.5, 0.5]
  } : {
    w: 1280, h: 720,
    trans: 'assets/video/transition.mp4', end: 'assets/img/end-frame.jpg', overlay: 'assets/img/end_overlay.webp',
    quad: [[232, 211], [767, 174], [836, 531], [301, 655]],
    focusStart: [0.62, 0.42], focusEnd: [0.42, 0.55]
  };
  const SCREEN_W = 1280, SCREEN_H = 800, CASE_DUR = 16;

  const $ = id => document.getElementById(id);
  const body = document.body;
  const scene = $('scene'), trans = $('trans'), screen = $('screen'), caseVideo = $('caseVideo');
  const card = $('caseCard');
  scene.style.width = CONF.w + 'px'; scene.style.height = CONF.h + 'px';
  trans.src = CONF.trans;
  $('endImg').src = CONF.end;
  $('overlayImg').src = CONF.overlay;

  let state = 'hero', caseIdx = 0, focus = CONF.focusStart.slice(), busy = false;

  // ---------- Обрезка сцены как cover с точкой фокуса ----------
  function fitScene() {
    const vw = innerWidth, vh = innerHeight;
    const s = Math.max(vw / CONF.w, vh / CONF.h);
    const w = CONF.w * s, h = CONF.h * s;
    const x = Math.min(0, Math.max(vw - w, vw / 2 - focus[0] * w));
    const y = Math.min(0, Math.max(vh - h, vh / 2 - focus[1] * h));
    scene.style.transform = `translate(${x}px,${y}px) scale(${s})`;
  }

  // ---------- Перспектива: прямоугольник видео → четырёхугольник экрана ----------
  function homography(src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    for (let c = 0; c < 8; c++) {
      let p = c;
      for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = 0; r < 8; r++) if (r !== c) {
        const f = A[r][c] / A[c][c];
        for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    const h = b.map((v, i) => v / A[i][i]);
    return [h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, 1];
  }
  screen.style.transform = 'matrix3d(' + homography(
    [[0, 0], [SCREEN_W, 0], [SCREEN_W, SCREEN_H], [0, SCREEN_H]], CONF.quad
  ).join(',') + ')';

  // ---------- Кейсы ----------
  const dots = $('caseDots');
  dots.innerHTML = CASES.map(() => '<i></i>').join('');
  dots.style.setProperty('--dur', CASE_DUR + 's');
  function renderCase(i) {
    const c = CASES[i];
    $('caseNum').textContent = String(i + 1).padStart(2, '0');
    $('caseTotal').textContent = String(CASES.length).padStart(2, '0');
    $('caseTitle').textContent = c.title;
    $('caseType').textContent = c.type;
    $('caseDesc').textContent = c.desc;
    $('caseTags').innerHTML = c.tags.map(t => `<li>${t}</li>`).join('');
    $('caseLink').href = c.url;
    [...dots.children].forEach((d, k) => {
      d.className = k < i ? 'done' : '';
      if (k === i) { void d.offsetWidth; d.className = 'on'; }
    });
  }
  function loadCaseVideo(i) {
    const c = CASES[i];
    caseVideo.pause();
    caseVideo.poster = c.poster;
    caseVideo.src = c.video;
    caseVideo.currentTime = 0;
    caseVideo.play().catch(() => {});
  }
  function showCase(i) {
    i = (i + CASES.length) % CASES.length;
    if (busy || i === caseIdx) return;
    busy = true;
    caseIdx = i;
    caseVideo.pause();
    card.classList.add('is-out');
    caseVideo.classList.add('is-out');
    setTimeout(() => {
      renderCase(caseIdx);
      loadCaseVideo(caseIdx);
      card.classList.remove('is-out');
      caseVideo.classList.remove('is-out');
      setTimeout(() => { busy = false; }, 300);
    }, 420);
  }
  const next = () => showCase(caseIdx + 1), prev = () => showCase(caseIdx - 1);
  $('prevBtn').addEventListener('click', prev);
  $('nextBtn').addEventListener('click', next);
  // кейс доиграл — сам переходим к следующему
  caseVideo.loop = false;
  caseVideo.addEventListener('ended', () => { if (state === 'cases') next(); });
  const preload = () => CASES.forEach(c => { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = c.video; document.head.appendChild(l); });

  // ---------- Состояния ----------
  function setState(s) {
    state = s;
    body.classList.toggle('is-hero', s === 'hero');
    body.classList.toggle('is-playing', s === 'playing');
    body.classList.toggle('is-cases', s === 'cases');
  }

  let raf = 0;
  function trackFocus() {
    const d = trans.duration || 6;
    const t = Math.min(1, trans.currentTime / d);
    const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    focus = [0, 1].map(k => CONF.focusStart[k] + (CONF.focusEnd[k] - CONF.focusStart[k]) * e);
    fitScene();
    if (state === 'playing') raf = requestAnimationFrame(trackFocus);
  }

  function goCases(instant) {
    if (state !== 'hero') return;
    setState('playing');
    window.scrollTo(0, 0);
    if (instant) { finishTransition(); return; }
    trans.currentTime = 0;
    const p = trans.play();
    raf = requestAnimationFrame(trackFocus);
    if (p) p.catch(() => finishTransition());
  }
  function finishTransition() {
    cancelAnimationFrame(raf);
    focus = CONF.focusEnd.slice(); fitScene();
    if (trans.duration) trans.currentTime = trans.duration;
    setState('cases');
    renderCase(caseIdx);
    loadCaseVideo(caseIdx);
  }
  trans.addEventListener('ended', finishTransition);

  function goHero() {
    if (state === 'hero') return;
    cancelAnimationFrame(raf);
    trans.pause(); caseVideo.pause();
    trans.currentTime = 0;
    focus = CONF.focusStart.slice(); fitScene();
    window.scrollTo(0, 0);
    setState('hero');
  }

  // ---------- Ввод ----------
  let lock = 0;
  const now = () => performance.now();
  addEventListener('wheel', e => {
    if (state === 'hero' && e.deltaY > 6) { e.preventDefault(); goCases(); lock = now(); }
    else if (state === 'playing') e.preventDefault();
    else if (state === 'cases' && e.deltaY < -6 && scrollY <= 0 && now() - lock > 900) { e.preventDefault(); goHero(); }
  }, { passive: false });

  // касания: вертикальный свайп — сцены, горизонтальный на кейсах — следующий сайт
  let tx = null, ty = null, used = false;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; used = false; }, { passive: true });
  addEventListener('touchmove', e => {
    if (ty == null || used) return;
    const dx = tx - e.touches[0].clientX, dy = ty - e.touches[0].clientY;
    if (state === 'hero' && dy > 30 && Math.abs(dy) > Math.abs(dx)) { used = true; goCases(); lock = now(); }
    else if (state === 'cases' && scrollY <= 0 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { used = true; dx > 0 ? next() : prev(); }
    else if (state === 'cases' && dy < -40 && Math.abs(dy) > Math.abs(dx) && scrollY <= 0 && now() - lock > 900) { used = true; goHero(); }
  }, { passive: true });

  addEventListener('keydown', e => {
    if (state === 'hero' && ['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key) && !(e.target.closest && e.target.closest('a,button'))) { e.preventDefault(); goCases(); }
    if (state === 'cases' && scrollY <= 0) {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowUp' || e.key === 'PageUp') goHero();
    }
  });

  $('scrollHint').addEventListener('click', () => goCases());
  document.querySelectorAll('[data-goto="cases"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (state === 'hero') goCases(); else window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
  document.querySelectorAll('[data-home]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goHero(); }));
  document.querySelectorAll('.nav__links a[href^="#"]:not([data-goto])').forEach(a => a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    if (state === 'hero') goCases(true);
    requestAnimationFrame(() => t.scrollIntoView({ behavior: 'smooth' }));
  }));

  // видео кейса не на экране — пауза
  addEventListener('scroll', () => {
    body.classList.toggle('scrolled', state === 'cases' && scrollY > innerHeight * 0.6);
    if (state !== 'cases') return;
    if (scrollY > innerHeight * 0.9) caseVideo.pause();
    else if (caseVideo.paused && !busy && !caseVideo.ended) caseVideo.play().catch(() => {});
  }, { passive: true });

  // ---------- Живые часы: Рим и время посетителя ----------
  const romeFmt = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const localFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dayItems = [...document.querySelectorAll('#dayList li')];
  function tick() {
    const d = new Date();
    document.querySelectorAll('.js-rome-time').forEach(n => { n.textContent = romeFmt.format(d); });
    document.querySelectorAll('.js-local-time').forEach(n => { n.textContent = localFmt.format(d); });
    // «сейчас» в ленте дня — последний момент, который уже наступил
    const h = d.getHours() + d.getMinutes() / 60;
    let cur = dayItems[dayItems.length - 1];
    dayItems.forEach(li => { if (+li.dataset.h <= h) cur = li; });
    dayItems.forEach(li => li.classList.toggle('is-now', li === cur));
  }
  tick(); setInterval(tick, 1000);

  // ---------- Появление блоков при прокрутке ----------
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(n => io.observe(n));

  addEventListener('resize', fitScene);
  renderCase(0);
  fitScene();
  setState('hero');
  addEventListener('load', () => setTimeout(preload, 1500));
  history.scrollRestoration = 'manual';
})();
