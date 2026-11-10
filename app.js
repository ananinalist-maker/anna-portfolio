(() => {
  'use strict';

  // ---------- Кейсы ----------
  const CASES = [
    { title: 'Рутенія', type: 'Мини-отель с бассейном · концепт',
      desc: 'Концепт в стиле «Forest»: тёмная зелень, живое видео с бассейном, бронь прямо с первого экрана.',
      tags: ['Дизайн', 'Hero-видео', 'Концепт'], v: 'ruteniya' },
    { title: 'Горянка', type: 'Садиба в Карпатах · живой сайт',
      desc: 'Сайт для семейной садибы: видео-hero, номера, форма брони без посредников. Гости приходят напрямую.',
      tags: ['Сайт под ключ', 'SEO', 'Бронирование'], v: 'horianka' },
    { title: 'Карпатська Форель', type: 'Отель и форелевое хозяйство · живой сайт',
      desc: 'Большой сайт с номерами, бассейном, рестораном и рыбалкой. Онлайн-заявка и своя страница под каждую услугу.',
      tags: ['Сайт под ключ', 'SEO', 'Заявки'], v: 'forel' },
    { title: 'Геолог', type: 'Гостевые квартиры · Стрый',
      desc: 'Сайт для отеля у вокзала: номера, кухня, отзывы гостей дословно и заявка напрямую, без Booking.',
      tags: ['Отель', 'Прототип', 'Заявки'], v: 'geolog' },
    { title: 'Абітурієнт', type: 'Репетиторский центр · Винники',
      desc: 'Живой мультяшный первый экран, табло НМТ от 100 до 200, направления, поездки учеников по Европе и отзывы.',
      tags: ['Образование', 'Hero-видео', 'Анимация'], v: 'abiturient' },
    { title: 'maxiterm T5', type: 'Лендинг твердотопливных котлов',
      desc: 'Лендинг на пару моделей: карточки котлов, доставка и оплата, заявки сразу в Telegram.',
      tags: ['Лендинг', 'Товары', 'Telegram'], v: 'kotly' },
    { title: 'KIOS Sutri', type: 'Интернет-магазин одежды · Италия',
      desc: 'Первый экран-подиум: образы магазина сами выходят из глубины, рядом вещи из образа с ценами и кнопкой «в корзину». Размеры от 38 до 52.',
      tags: ['Интернет-магазин', 'Подиум образов', 'Корзина'], v: 'kios' },
    { title: 'Tuttofare', type: 'Ремонт под ключ в Риме · живой сайт',
      desc: 'Сайт на итальянском для ремонтной компании: услуги, работы, блог. SEO под Google и AI-поиск.',
      tags: ['Сайт', 'SEO', 'Блог'], v: 'tuttofare' }
  ].map(c => ({ ...c, video: `assets/video/case-${c.v}.mp4`, poster: `assets/video/case-${c.v}.jpg` }));

  // ---------- Две сцены: горизонтальная (компьютер) и вертикальная (телефон) ----------
  // Переход идёт по скроллу (метод Apple, скилл stopscroll-hero): кадры webp рисуются на canvas.
  const MOBILE = matchMedia('(max-width:820px)').matches;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CONF = MOBILE ? {
    w: 720, h: 1280, dir: 'assets/frames-m', total: 96, end: 'assets/img/end-m.jpg',
    quad: [[-2, 395], [722, 397], [722, 867], [-2, 863]], sw: 1120, sh: 720,   // экран в последнем кадре
    focusStart: [0.6, 0.5], focusEnd: [0.5, 0.5]
  } : {
    w: 1280, h: 720, dir: 'assets/frames', total: 120, end: 'assets/img/end-frame.jpg',
    quad: [[177, 125], [1107, 127], [1109, 671], [173, 669]], sw: 1280, sh: 744,
    focusStart: [0.62, 0.42], focusEnd: [0.5, 0.5]
  };

  const $ = id => document.getElementById(id);
  const body = document.body;
  const scene = $('scene'), seq = $('seq'), screen = $('screen'), caseVideo = $('caseVideo');
  const card = $('caseCard'), track = $('track'), scrub = $('scrub');
  scene.style.width = CONF.w + 'px'; scene.style.height = CONF.h + 'px';
  seq.width = CONF.w; seq.height = CONF.h;
  screen.style.width = CONF.sw + 'px'; screen.style.height = CONF.sh + 'px';
  $('endImg').src = CONF.end;
  const ctx = seq.getContext('2d');

  let state = '', caseIdx = 0, focus = CONF.focusStart.slice(), busy = false, prog = 0;

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
  // углы экрана в каждом кадре наезда (_src/v3_quads_track.py): сайт стоит на экране уже в движении
  let QUADS = [];
  fetch(MOBILE ? 'assets/quads-m.json' : 'assets/quads.json').then(r => r.json()).then(q => { QUADS = q; drawn = -1; }).catch(() => {});
  const RECT = [[0, 0], [CONF.sw, 0], [CONF.sw, CONF.sh], [0, CONF.sh]];
  let screenOn = false, past = false;
  function placeScreen(k) {
    const q = QUADS[k];
    if (q) screen.style.transform = 'matrix3d(' + homography(RECT, q).join(',') + ')';
    if (!!q !== screenOn) { screenOn = !!q; body.classList.toggle('screen-on', screenOn); }
    syncVideo();
  }
  function syncVideo() {
    if (screenOn && !past) { if (caseVideo.paused && !busy) caseVideo.play().catch(() => {}); }
    else caseVideo.pause();
  }

  // ---------- Кадры перехода: грузим батчами, рисуем только при смене ----------
  const frames = new Array(CONF.total);
  let want = 0, drawn = -1, loaded = 0;
  const url = i => `${CONF.dir}/f_${String(i + 1).padStart(4, '0')}.webp`;
  function nearest(i) {                       // нужного кадра ещё нет — берём ближайший готовый
    for (let d = 0; d < CONF.total; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  }
  function draw() {
    const k = nearest(want);
    if (k < 0 || k === drawn) return;
    ctx.drawImage(frames[k], 0, 0, CONF.w, CONF.h);
    drawn = k;
    placeScreen(k);
  }
  (function loop() { if (want !== drawn) draw(); requestAnimationFrame(loop); })();
  function loadFrame(i) {
    return new Promise(res => {
      const img = new Image(); img.decoding = 'async';
      img.onload = () => { frames[i] = img; loaded++; res(); };
      img.onerror = () => { loaded++; res(); };
      img.src = url(i);
    });
  }
  const bar = $('loadbar');
  (async () => {
    await loadFrame(0); draw();
    const order = [CONF.total - 1];            // сначала последний кадр, потом по порядку
    for (let i = 1; i < CONF.total - 1; i++) order.push(i);
    for (let i = 0; i < order.length; i += 12) {
      await Promise.all(order.slice(i, i + 12).map(loadFrame));
      bar.style.setProperty('--p', (loaded / CONF.total).toFixed(3));
    }
    bar.classList.add('done');
    preloadCases();
  })();

  // ---------- Кейсы ----------
  const dots = $('caseDots');
  dots.innerHTML = CASES.map(() => '<i></i>').join('');
  function renderCase(i) {
    const c = CASES[i];
    $('caseNum').textContent = String(i + 1).padStart(2, '0');
    $('caseTotal').textContent = String(CASES.length).padStart(2, '0');
    $('caseTitle').textContent = c.title;
    $('caseType').textContent = c.type;
    $('caseDesc').textContent = c.desc;
    $('caseTags').innerHTML = c.tags.map(t => `<li>${t}</li>`).join('');
    [...dots.children].forEach((d, k) => { d.className = k === i ? 'on' : k < i ? 'done' : ''; });
  }
  function loadCaseVideo(i, play) {
    const c = CASES[i];
    caseVideo.pause();
    caseVideo.poster = c.poster;
    caseVideo.src = c.video;
    caseVideo.currentTime = 0;
    if (play) caseVideo.play().catch(() => {});
  }
  function showCase(i) {
    i = (i + CASES.length) % CASES.length;
    if (busy || i === caseIdx) return;
    busy = true;
    caseIdx = i;
    caseVideo.pause();                        // прежнее видео стоп
    card.classList.add('is-out');
    caseVideo.classList.add('is-out');
    setTimeout(() => {
      renderCase(caseIdx);
      loadCaseVideo(caseIdx, screenOn && !past);   // новое с начала
      card.classList.remove('is-out');
      caseVideo.classList.remove('is-out');
      setTimeout(() => { busy = false; }, 300);
    }, 420);
  }
  const next = () => showCase(caseIdx + 1), prev = () => showCase(caseIdx - 1);
  $('prevBtn').addEventListener('click', prev);
  $('nextBtn').addEventListener('click', next);
  caseVideo.loop = true;                      // по промту кейсы сами не переключаются
  function preloadCases() {
    CASES.forEach(c => { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = c.video; document.head.appendChild(l); });
  }

  // ---------- Скролл → прогресс → кадр, фокус, состояние ----------
  function setState(s) {
    if (s === state) return;
    state = s;
    body.classList.toggle('is-hero', s === 'hero');
    body.classList.toggle('is-playing', s === 'playing');
    body.classList.toggle('is-cases', s === 'cases');
  }
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  function onScroll() {
    const span = scrub.offsetHeight;
    prog = Math.max(0, Math.min(1, scrollY / span));
    want = Math.min(CONF.total - 1, Math.round(prog * (CONF.total - 1)));
    const e = ease(prog);
    focus = [0, 1].map(k => CONF.focusStart[k] + (CONF.focusEnd[k] - CONF.focusStart[k]) * e);
    fitScene();
    setState(prog < 0.015 ? 'hero' : prog < 0.94 ? 'playing' : 'cases');
    // кейсы закреплены, пока идёт блок удержания; дальше видео на паузе
    past = scrollY > track.offsetHeight - innerHeight * 0.2;
    body.classList.toggle('scrolled', past);
    syncVideo();
  }
  addEventListener('scroll', onScroll, { passive: true });

  const scrubEnd = () => scrub.offsetHeight + 2;
  function goCases() { window.scrollTo({ top: scrubEnd(), behavior: REDUCED ? 'auto' : 'smooth' }); }
  function goHero() { window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }); }

  // ---------- Ввод ----------
  // горизонтальный свайп на кейсах — следующий/предыдущий сайт
  let tx = null, ty = null, used = false;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; used = false; }, { passive: true });
  addEventListener('touchmove', e => {
    if (tx == null || used || state !== 'cases') return;
    const dx = tx - e.touches[0].clientX, dy = ty - e.touches[0].clientY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { used = true; dx > 0 ? next() : prev(); }
  }, { passive: true });
  addEventListener('keydown', e => {
    if (state !== 'cases' || (e.target.closest && e.target.closest('input,textarea'))) return;
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  $('scrollHint').addEventListener('click', goCases);
  document.querySelectorAll('[data-goto="cases"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goCases(); }));
  document.querySelectorAll('[data-home]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goHero(); }));
  document.querySelectorAll('.nav__links a[href^="#"]:not([data-goto])').forEach(a => a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth' });
  }));

  // QA: ?tkp=0.55 — зафиксировать прогресс без ручного скролла
  const forced = new URLSearchParams(location.search).get('tkp');

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

  // ---------- Прототипы: видео играет при наведении (ПК) или в кадре (телефон) ----------
  document.querySelectorAll('.proto video').forEach(v => {
    const card = v.closest('.proto');
    const load = () => { if (!v.src) v.src = v.dataset.src; };
    if (MOBILE) {
      new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { load(); v.play().catch(() => {}); } else v.pause();
      }), { threshold: 0.6 }).observe(v);
    } else {
      card.addEventListener('mouseenter', () => { load(); v.play().catch(() => {}); });
      card.addEventListener('mouseleave', () => v.pause());
    }
  });

  // ---------- Курсор и «магнитные» кнопки (только мышь) ----------
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const cur = $('cursor'), lab = cur.querySelector('span');
    let mx = -100, my = -100, cx = -100, cy = -100;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() { cx += (mx - cx) * .2; cy += (my - cy) * .2; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor],a,button');
      cur.classList.toggle('is-link', !!t && !t.dataset.cursor);
      cur.classList.toggle('is-label', !!(t && t.dataset.cursor));
      lab.textContent = t && t.dataset.cursor ? t.dataset.cursor : '';
    });
    body.classList.add('has-cursor');
    document.querySelectorAll('.btn').forEach(bt => {
      bt.addEventListener('mousemove', e => {
        const r = bt.getBoundingClientRect();
        bt.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      bt.addEventListener('mouseleave', () => { bt.style.transform = ''; });
    });
  }

  addEventListener('resize', onScroll);
  renderCase(0);
  loadCaseVideo(0, false); caseVideo.preload = 'auto';
  if (forced != null) requestAnimationFrame(() => window.scrollTo(0, scrub.offsetHeight * parseFloat(forced)));
  onScroll();
})();
