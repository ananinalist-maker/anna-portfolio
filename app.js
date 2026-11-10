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

  // Углы экрана ноутбука в последнем кадре перехода (кадр 1280×720)
  const QUAD = [[232, 211], [767, 174], [836, 531], [301, 655]];
  const SCREEN_W = 1280, SCREEN_H = 800, SCENE_W = 1280, SCENE_H = 720;
  // Точка фокуса при обрезке под экран (доли кадра): на старте — Анна, в конце — экран
  const MOBILE = matchMedia('(max-width:820px)').matches;
  const FOCUS_START = MOBILE ? [0.7, 0.42] : [0.62, 0.42], FOCUS_END = [0.42, 0.55];

  const $ = id => document.getElementById(id);
  const body = document.body;
  const scene = $('scene'), trans = $('trans'), screen = $('screen'), caseVideo = $('caseVideo');
  const card = $('caseCard');
  let state = 'hero';
  let caseIdx = 0;
  let focus = FOCUS_START.slice();
  let busy = false;

  // ---------- Обрезка сцены как object-fit: cover с точкой фокуса ----------
  function fitScene() {
    const vw = innerWidth, vh = innerHeight;
    const s = Math.max(vw / SCENE_W, vh / SCENE_H);
    const w = SCENE_W * s, h = SCENE_H * s;
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
    // Гаусс
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
    [[0, 0], [SCREEN_W, 0], [SCREEN_W, SCREEN_H], [0, SCREEN_H]], QUAD
  ).join(',') + ')';

  // ---------- Кейсы ----------
  function renderCase(i) {
    const c = CASES[i];
    $('caseNum').textContent = String(i + 1).padStart(2, '0');
    $('caseTotal').textContent = String(CASES.length).padStart(2, '0');
    $('caseTitle').textContent = c.title;
    $('caseType').textContent = c.type;
    $('caseDesc').textContent = c.desc;
    $('caseTags').innerHTML = c.tags.map(t => `<li>${t}</li>`).join('');
    $('caseLink').href = c.url;
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
    if (busy || i === caseIdx) return;
    busy = true;
    caseIdx = (i + CASES.length) % CASES.length;
    caseVideo.pause();                        // прежнее видео стоп
    card.classList.add('is-out');
    caseVideo.classList.add('is-out');
    setTimeout(() => {
      renderCase(caseIdx);
      loadCaseVideo(caseIdx);                 // новое с начала
      card.classList.remove('is-out');
      caseVideo.classList.remove('is-out');
      setTimeout(() => { busy = false; }, 300);
    }, 420);
  }
  $('prevBtn').addEventListener('click', () => showCase((caseIdx - 1 + CASES.length) % CASES.length));
  $('nextBtn').addEventListener('click', () => showCase((caseIdx + 1) % CASES.length));
  // предзагрузка следующих видео
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
    const d = trans.duration || 8;
    const t = Math.min(1, trans.currentTime / d);
    const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    focus = [FOCUS_START[0] + (FOCUS_END[0] - FOCUS_START[0]) * e, FOCUS_START[1] + (FOCUS_END[1] - FOCUS_START[1]) * e];
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
    focus = FOCUS_END.slice(); fitScene();
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
    focus = FOCUS_START.slice(); fitScene();
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

  let ty = null;
  addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', e => {
    if (ty == null) return;
    const dy = ty - e.touches[0].clientY;
    if (state === 'hero' && dy > 30) { goCases(); ty = null; lock = now(); }
    else if (state === 'cases' && dy < -40 && scrollY <= 0 && now() - lock > 900) { goHero(); ty = null; }
  }, { passive: true });

  addEventListener('keydown', e => {
    if (state === 'hero' && ['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); goCases(); }
    if (state === 'cases' && scrollY <= 0) {
      if (e.key === 'ArrowRight') $('nextBtn').click();
      if (e.key === 'ArrowLeft') $('prevBtn').click();
      if (e.key === 'ArrowUp' || e.key === 'PageUp') goHero();
    }
  });

  $('scrollHint').addEventListener('click', () => goCases());
  document.querySelectorAll('[data-goto="cases"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (state === 'hero') goCases(); else window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
  document.querySelectorAll('[data-home]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goHero(); }));
  document.querySelectorAll('a[href^="#services"],a[href^="#contact"]').forEach(a => a.addEventListener('click', e => {
    if (state === 'hero') { e.preventDefault(); goCases(true); requestAnimationFrame(() => document.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' })); }
  }));

  // пока видео кейсов не на экране — не играем (экономия батареи)
  addEventListener('scroll', () => {
    if (state !== 'cases') return;
    if (scrollY > innerHeight * 0.9) caseVideo.pause();
    else if (caseVideo.paused && !busy) caseVideo.play().catch(() => {});
  }, { passive: true });

  addEventListener('resize', fitScene);
  renderCase(0);
  fitScene();
  setState('hero');
  addEventListener('load', () => setTimeout(preload, 1500));
  history.scrollRestoration = 'manual';
})();
