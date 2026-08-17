(() => {
  'use strict';

  /* ================= KONSTANTA ================= */
  const MAX_LEVEL = 10;
  const WINS_NEEDED = 10;
  const QUESTIONS_PER_PLAYER = 10;

  const MODES = {
    rebuttan:   { label: 'Rebutan',     emoji: '⚡', desc: 'Siapa cepat dia dapat! Jawab barengan, yang duluan benar dapat poin.' },
    bergantian: { label: 'Bergantian',  emoji: '🔄', desc: 'Giliran satu-satu, masing-masing 10 soal. Yang paling banyak benar menang!' },
  };

  const OPERATIONS = {
    add: { symbol: '+',  label: 'Penjumlahan', emoji: '➕', fn: makeAdd },
    sub: { symbol: '−',  label: 'Pengurangan', emoji: '➖', fn: makeSub },
    mul: { symbol: '×',  label: 'Perkalian',   emoji: '✖️', fn: makeMul },
    div: { symbol: '÷',  label: 'Pembagian',   emoji: '➗', fn: makeDiv },
    mix: { symbol: '?',  label: 'Campuran',    emoji: '🎲', fn: makeMix },
  };

  const DIFFICULTIES = {
    easy:   { label: 'Mudah',  emoji: '🌱', desc: 'Hasil 1–20',  max: 20 },
    medium: { label: 'Sedang', emoji: '🔥', desc: 'Hasil 1–50',  max: 50 },
    hard:   { label: 'Sulit',  emoji: '💀', desc: 'Hasil 1–100', max: 100 },
  };

  const PRIZES = ['🎁', '🎈', '🏆', '🍭', '⭐', '🧸', '🍬', '👑'];

  const TIME_OPTIONS = [
    { value: 0, label: 'Tanpa Batas', emoji: '∞' },
    { value: 60, label: '1 Menit', emoji: '⏱️' },
    { value: 30, label: '30 Detik', emoji: '⏱️' },
    { value: 20, label: '20 Detik', emoji: '⏱️' },
    { value: 10, label: '10 Detik', emoji: '⏱️' },
  ];

  const RING_C = 2 * Math.PI * 25;

  const P1_KEYS = ['q', 'w', 'e', 'r'];
  const P2_KEYS = ['u', 'i', 'o', 'p'];
  const SHARED_KEYS = ['1', '2', '3', '4'];

  const ARENA = {
    W: 1000, H: 720,
    POLE_X: 500, POLE_W: 28,
    GROUND_Y: 660, TOP_Y: 245,
    P1_X: 392, P2_X: 516,
  };

  /* ================= UTIL ================= */
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function feetY(level) {
    return ARENA.GROUND_Y - (ARENA.GROUND_Y - ARENA.TOP_Y) * (level / MAX_LEVEL);
  }

  /* ================= SOAL ================= */
  function makeAdd(level, diffMax) {
    const maxA = Math.max(2, diffMax - 2);
    let a, b;
    if (level <= 3)      { a = rand(2, Math.min(9, maxA));  b = rand(2, Math.min(9, diffMax - a)); }
    else if (level <= 6) { a = rand(8, Math.min(25, maxA)); b = rand(5, Math.min(15, diffMax - a)); }
    else if (level <= 9) { a = rand(15, Math.min(60, maxA)); b = rand(10, Math.min(40, diffMax - a)); }
    else                 { a = rand(Math.min(60, maxA), Math.min(120, maxA)); b = rand(Math.min(30, diffMax - a), Math.min(90, diffMax - a)); }
    if (b < 2) b = 2;
    if (a + b > diffMax) { b = diffMax - a; if (b < 2) { a = diffMax - 2; b = 2; } }
    return buildQuestion(a + b, `${a} + ${b}`);
  }
  function makeSub(level, diffMax) {
    let a, b;
    if (level <= 3)      { a = rand(6, Math.min(18, diffMax));  b = rand(1, Math.min(a - 1, diffMax)); }
    else if (level <= 6) { a = rand(20, Math.min(50, diffMax)); b = rand(2, Math.min(19, a - 1)); }
    else if (level <= 9) { a = rand(40, Math.min(99, diffMax)); b = rand(10, Math.min(a - 1, diffMax)); }
    else                 { a = rand(Math.min(100, diffMax), diffMax); b = rand(Math.min(50, a - 1), a - 2); }
    if (a - b < 0) b = a;
    if (a - b > diffMax) a = b + diffMax;
    return buildQuestion(a - b, `${a} − ${b}`);
  }
  function makeMul(level, diffMax) {
    let a, b;
    if (level <= 3)      { a = rand(2, Math.min(5, Math.floor(Math.sqrt(diffMax)))); b = rand(2, Math.min(5, Math.floor(diffMax / a))); }
    else if (level <= 6) { a = rand(3, Math.min(8, Math.floor(Math.sqrt(diffMax)))); b = rand(2, Math.min(9, Math.floor(diffMax / a))); }
    else if (level <= 9) { a = rand(3, Math.min(12, Math.floor(Math.sqrt(diffMax)))); b = rand(3, Math.min(10, Math.floor(diffMax / a))); }
    else                 { a = rand(Math.min(6, Math.floor(Math.sqrt(diffMax))), Math.min(12, Math.floor(Math.sqrt(diffMax)))); b = rand(a, Math.min(12, Math.floor(diffMax / a))); }
    if (a < 2) a = 2; if (b < 2) b = 2;
    if (a * b > diffMax) { b = Math.floor(diffMax / a); if (b < 2) { a = Math.floor(Math.sqrt(diffMax)); b = Math.floor(diffMax / a); } }
    return buildQuestion(a * b, `${a} × ${b}`);
  }
  function makeDiv(level, diffMax) {
    let ans, b;
    if (level <= 3)      { ans = rand(2, Math.min(5, diffMax));  b = rand(2, Math.min(5, Math.floor(diffMax / ans))); }
    else if (level <= 6) { ans = rand(3, Math.min(8, diffMax));  b = rand(2, Math.min(8, Math.floor(diffMax / ans))); }
    else if (level <= 9) { ans = rand(4, Math.min(10, diffMax)); b = rand(2, Math.min(10, Math.floor(diffMax / ans))); }
    else                 { ans = rand(Math.min(6, diffMax), Math.min(12, diffMax)); b = rand(3, Math.min(12, Math.floor(diffMax / ans))); }
    if (ans < 2) ans = 2; if (b < 2) b = 2;
    if (ans > diffMax) ans = diffMax;
    if (ans * b > diffMax) { b = Math.floor(diffMax / ans); if (b < 2) b = 2; }
    const a = ans * b;
    return buildQuestion(ans, `${a} ÷ ${b}`);
  }
  function makeMix(level, diffMax) {
    return pick([makeAdd, makeSub, makeMul, makeDiv])(level, diffMax);
  }

  function buildQuestion(answer, text) {
    const opts = new Set([answer]);
    const candidates = shuffle(
      [answer + 1, answer + 2, answer + 3, answer - 1, answer - 2, answer - 3,
       answer + 10, answer - 10, answer * 2, Math.max(0, Math.floor(answer / 2)) + 1, answer + 5]
    );
    for (const c of candidates) {
      if (opts.size >= 4) break;
      if (c >= 0 && c !== answer) opts.add(c);
    }
    let extra = 7;
    while (opts.size < 4) opts.add(answer + extra++);
    return { text, answer, options: shuffle([...opts]) };
  }

  /* ================= AUDIO ================= */
  let audioCtx = null;
  let soundOn = true;

  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function tone(freqs, type, dur, vol) {
    if (!soundOn || !audioCtx) return;
    const t0 = audioCtx.currentTime;
    freqs.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = f;
      const t = t0 + i * 0.12;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }
  const sndClick   = () => tone([660], 'triangle', 0.15, 0.2);
  const sndCorrect = () => tone([523.25, 659.25, 783.99, 1046.5], 'triangle', 0.35, 0.3);
  const sndWrong   = () => tone([260, 196, 147], 'sine', 0.3, 0.3);
  const sndWin     = () => tone([523.25, 659.25, 783.99, 1046.5, 1318.5, 1568], 'triangle', 0.5, 0.3);

  /* ================= GAMBAR KARAKTER (SVG) ================= */
  function climberSVG(arms, style) {
    const R = arms === 'right';
    const handX = R ? 96 : -6;
    const skin = style.skin || '#ffd9b0';

    let s = '';
    s += `<ellipse cx="46" cy="107" rx="30" ry="6" fill="rgba(0,0,0,.18)"/>`;
    s += `<path d="M41,84 Q33,96 37,104" fill="none" stroke="${skin}" stroke-width="9" stroke-linecap="round"/>`;
    s += `<path d="M51,84 Q59,96 55,104" fill="none" stroke="${skin}" stroke-width="9" stroke-linecap="round"/>`;
    s += `<ellipse cx="35" cy="105" rx="10" ry="5.5" fill="${style.shoe}"/>`;
    s += `<ellipse cx="57" cy="105" rx="10" ry="5.5" fill="${style.shoe}"/>`;
    s += `<rect x="31" y="78" width="30" height="10" rx="5" fill="${style.pants}"/>`;
    s += `<rect x="31" y="46" width="30" height="36" rx="13" fill="${style.shirt}"/>`;
    s += `<path d="M28,60 l6,0" stroke="rgba(0,0,0,.15)" stroke-width="4" stroke-linecap="round"/>`;
    s += `<path d="M58,52 L${handX},48" stroke="${skin}" stroke-width="8" stroke-linecap="round"/>`;
    s += `<path d="M38,54 L${handX},60" stroke="${skin}" stroke-width="8" stroke-linecap="round"/>`;
    s += `<circle cx="${handX}" cy="48" r="5.5" fill="${skin}"/>`;
    s += `<circle cx="${handX}" cy="60" r="5.5" fill="${skin}"/>`;
    s += `<circle cx="46" cy="28" r="19" fill="${skin}"/>`;

    if (style.girl) {
      s += `<path d="M26,30 A19,19 0 0 1 66,30 L63,25 A15,15 0 0 0 29,25 Z" fill="${style.hair}"/>`;
      s += `<circle cx="23" cy="33" r="7" fill="${style.hair}"/>`;
      s += `<circle cx="69" cy="33" r="7" fill="${style.hair}"/>`;
      s += `<circle cx="23" cy="33" r="3" fill="${style.bow}"/>`;
      s += `<circle cx="69" cy="33" r="3" fill="${style.bow}"/>`;
    } else {
      s += `<path d="M27,30 A19,19 0 0 1 65,30 L61,26 A15,15 0 0 0 31,26 Z" fill="${style.hair}"/>`;
      s += `<rect x="24" y="17" width="44" height="13" rx="6.5" fill="${style.cap}"/>`;
      s += `<rect x="24" y="22" width="44" height="6" rx="3" fill="${style.capDark}"/>`;
    }

    s += `<circle cx="39" cy="29" r="3" fill="#3b2314"/><circle cx="53" cy="29" r="3" fill="#3b2314"/>`;
    s += `<circle cx="40.3" cy="28" r="1" fill="#fff"/><circle cx="54.3" cy="28" r="1" fill="#fff"/>`;
    s += `<path d="M40,36 Q46,43 52,36" fill="none" stroke="#7a4d22" stroke-width="2.2" stroke-linecap="round"/>`;
    s += `<circle cx="34" cy="35" r="3.4" fill="#ff9fb0" opacity=".65"/>`;
    s += `<circle cx="58" cy="35" r="3.4" fill="#ff9fb0" opacity=".65"/>`;

    return `<g>${s}</g>`;
  }

  /* ================= ARENA SVG ================= */
  function buildArena() {
    const P = [];
    const A = ARENA;

    P.push(`<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#69bcf4"/><stop offset="55%" stop-color="#bfe9ff"/><stop offset="100%" stop-color="#eafcff"/>
      </linearGradient>
      <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8be04e"/><stop offset="100%" stop-color="#55b22e"/>
      </linearGradient>
      <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#8a5a2b"/><stop offset="50%" stop-color="#b47a3d"/><stop offset="100%" stop-color="#77491f"/>
      </linearGradient>
    </defs>`);

    P.push(`<rect width="1000" height="720" fill="url(#sky)"/>`);

    P.push(`<g transform="translate(92,92)"><circle r="42" fill="#ffe066"/><g stroke="#ffd93d" stroke-width="7" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a => `<line x1="0" y1="-52" x2="0" y2="-64" transform="rotate(${a})"/>`).join('')}</g><circle r="42" fill="#ffdf66"/><circle cx="-12" cy="-10" r="6" fill="#ffce3d"/><circle cx="14" cy="6" r="5" fill="#ffce3d"/></g>`);

    P.push(cloud(700, 68, 1));
    P.push(cloud(180, 180, 0.8));
    P.push(cloud(830, 210, 0.7));

    P.push(`<ellipse cx="210" cy="672" rx="280" ry="74" fill="#a8e063"/>`);
    P.push(`<ellipse cx="790" cy="676" rx="260" ry="66" fill="#a8e063"/>`);
    P.push(`<rect x="0" y="650" width="1000" height="70" fill="url(#grass)"/>`);
    P.push(`<rect x="0" y="650" width="1000" height="10" fill="#77d13f"/>`);

    const flagColors = ['#ff6b81', '#ffd93d', '#6fce3c', '#54a0ff', '#ec4f8f', '#ff9f43'];
    for (let x = 70; x <= 930; x += 62) {
      const c = flagColors[Math.floor(x / 62) % flagColors.length];
      P.push(`<polygon points="${x},42 ${x + 62},42 ${x + 31},86" fill="${c}"/>`);
    }
    P.push(`<line x1="40" y1="42" x2="960" y2="42" stroke="#c96f2e" stroke-width="4"/>`);

    P.push(`<rect x="146" y="120" width="14" height="540" rx="7" fill="#c96f2e"/>`);
    P.push(`<rect x="840" y="120" width="14" height="540" rx="7" fill="#c96f2e"/>`);

    P.push(`<rect x="146" y="122" width="708" height="12" rx="6" fill="#d2691e"/>`);
    P.push(`<rect x="146" y="124" width="708" height="4" fill="#e08b3e"/>`);

    PRIZES.forEach((p, i) => {
      const x = 200 + i * 87;
      P.push(`<line x1="${x}" y1="134" x2="${x}" y2="168" stroke="#a4551f" stroke-width="2"/>`);
      P.push(`<g class="prize-sway" style="transform-origin:${x}px 134px"><text x="${x}" y="200" font-size="36" text-anchor="middle">${p}</text></g>`);
    });

    P.push(`<g transform="translate(500,132)"><path d="M0,0 C-24,-30 -80,-44 -120,-30 C-86,-18 -40,-10 0,0" fill="#3e9a2f"/><path d="M0,0 C24,-30 80,-44 120,-30 C86,-18 40,-10 0,0" fill="#3e9a2f"/><path d="M0,0 C-30,-18 -74,-26 -96,-6 C-60,4 -26,4 0,0" fill="#48ab35"/><path d="M0,0 C30,-18 74,-26 96,-6 C60,4 26,4 0,0" fill="#48ab35"/><circle r="9" fill="#8a5a2b"/></g>`);

    P.push(`<rect x="${A.POLE_X - A.POLE_W / 2}" y="132" width="${A.POLE_W}" height="${A.GROUND_Y - 132}" fill="url(#trunk)"/>`);

    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      const y = feetY(lvl) - 6;
      const side = lvl % 2 === 1;
      if (side) P.push(`<rect x="${A.POLE_X - A.POLE_W / 2 - 18}" y="${y}" width="18" height="10" rx="5" fill="#9c6a32"/>`);
      else      P.push(`<rect x="${A.POLE_X + A.POLE_W / 2}" y="${y}" width="18" height="10" rx="5" fill="#9c6a32"/>`);
    }
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      const y = feetY(lvl);
      P.push(`<text x="${A.POLE_X}" y="${y + 4}" font-size="13" font-weight="bold" fill="#fff3d6" text-anchor="middle" opacity=".55">${lvl}</text>`);
    }

    P.push(`<line x1="200" y1="${A.TOP_Y}" x2="800" y2="${A.TOP_Y}" stroke="#ff6b81" stroke-width="4" stroke-dasharray="10 8" opacity=".6"/>`);

    for (const [fx, fy, c] of [[60, 690, '#ff9fb0'], [120, 706, '#ffd93d'], [890, 688, '#ec4f8f'], [950, 706, '#aee3ff'], [320, 706, '#ff9fb0'], [690, 706, '#ffd93d']]) {
      P.push(`<circle cx="${fx}" cy="${fy}" r="6" fill="${c}"/><circle cx="${fx}" cy="${fy}" r="2.4" fill="#fff2b0"/>`);
    }

    const p1 = climberSVG('right', { shirt: '#4fc3f7', pants: '#ffa726', cap: '#ff7043', capDark: '#e2572e', shoe: '#5b3a29', hair: '#4e342e', skin: '#ffd9b0' });
    const p2 = climberSVG('left', { shirt: '#ff8a65', pants: '#ec407a', shoe: '#4a3b32', hair: '#6d4c41', skin: '#f7c9a0', girl: true, bow: '#ff80ab' });

    P.push(`<g id="climber-1" class="climber-g">${p1}</g>`);
    P.push(`<g id="climber-2" class="climber-g">${p2}</g>`);

    return P.join('');
  }

  function cloud(cx, cy, s) {
    return `<g transform="translate(${cx},${cy}) scale(${s})" fill="#fff" opacity=".9">
      <ellipse cx="0" cy="0" rx="52" ry="22"/><ellipse cx="-34" cy="8" rx="28" ry="16"/>
      <ellipse cx="34" cy="8" rx="28" ry="16"/><ellipse cx="-14" cy="-16" rx="24" ry="18"/>
      <ellipse cx="22" cy="-14" rx="20" ry="15"/>
    </g>`;
  }

  /* ================= STATE & FLOW ================= */
  const state = {
    mode: 'rebuttan',
    op: null,
    diffMax: 20,
    players: null,
    current: 0,
    questionNum: 0,
    totalQuestions: 0,
    over: false,
    lock: false,
    question: null,
    lastText: '',
    lastAnswers: [],
    selectedMode: 'rebuttan',
    selectedOp: null,
    selectedTime: 20,
    selectedDiff: 'easy',
    timeLimit: 0,
    timeLeft: 0,
    timerId: null,
    token: 0,
  };

  function isRebuttan() { return state.mode === 'rebuttan'; }
  function isBergantian() { return state.mode === 'bergantian'; }

  function startGame() {
    const name1 = $('name-1').value.trim() || 'Raka';
    const name2 = $('name-2').value.trim() || 'Sari';
    state.mode = state.selectedMode;
    state.op = state.selectedOp;
    state.diffMax = DIFFICULTIES[state.selectedDiff].max;
    state.players = [
      { name: name1, level: 0, answered: 0, correct: 0, emoji: '👦' },
      { name: name2, level: 0, answered: 0, correct: 0, emoji: '👧' },
    ];
    state.current = 0;
    state.questionNum = 0;
    state.totalQuestions = isRebuttan() ? Infinity : QUESTIONS_PER_PLAYER * 2;
    state.over = false;
    state.lock = false;
    state.lastText = '';
    state.lastAnswers = [];
    state.token++;
    state.timeLimit = state.selectedTime;
    stopTimer();

    $('p1-name').textContent = name1;
    $('p2-name').textContent = name2;
    $('qp-name-1').textContent = name1;
    $('qp-name-2').textContent = name2;
    $('op-badge').textContent = `${OPERATIONS[state.op].emoji} ${OPERATIONS[state.op].label}`;

    const qp = $('question-panel');
    qp.classList.toggle('mode-bergantian', isBergantian());

    $('screen-menu').classList.add('hidden');
    $('screen-game').classList.remove('hidden');
    $('win-overlay').classList.add('hidden');

    placeClimbers(0);
    renderPanels();
    nextQuestion();
  }

  function nextQuestion() {
    if (state.over) return;
    state.lock = false;

    if (isBergantian()) {
      if (state.players[0].answered >= QUESTIONS_PER_PLAYER && state.players[1].answered >= QUESTIONS_PER_PLAYER) {
        endByCorrect();
        return;
      }
      while (state.players[state.current].answered >= QUESTIONS_PER_PLAYER) {
        state.current = 1 - state.current;
      }
    }

    state.questionNum++;

    const p = state.players[state.current];
    const levelForQ = isRebuttan()
      ? Math.max(1, Math.round((state.players[0].level + state.players[1].level) / 2) + 1)
      : Math.max(1, p.level + 1);

    let q;
    for (let i = 0; i < 30; i++) {
      q = OPERATIONS[state.op].fn(levelForQ, state.diffMax);
      if (q.text === state.lastText) continue;
      const la = state.lastAnswers;
      const sameCount = la.length >= 2 && la[la.length - 1] === q.answer && la[la.length - 2] === q.answer ? 2 : (la.length >= 1 && la[la.length - 1] === q.answer ? 1 : 0);
      if (sameCount < 2) break;
    }
    state.question = q;
    state.lastText = q.text;
    state.lastAnswers.push(q.answer);
    if (state.lastAnswers.length > 4) state.lastAnswers.shift();
    renderQuestion();
    renderPanels();
    startTimer();
  }

  function answerPlayer(playerIdx, optionIdx) {
    if (state.over || state.lock || !state.question) return;
    if (isBergantian() && playerIdx !== state.current) return;
    state.lock = true;
    stopTimer();
    ensureAudio();
    const correct = state.question.options[optionIdx] === state.question.answer;
    highlightAnswer(optionIdx, correct, playerIdx);
    resolveAnswer(correct, playerIdx);
  }

  function answerTimeout() {
    if (state.over || state.lock) return;
    state.lock = true;
    ensureAudio();
    disableAllOptions();
    const fb = $('feedback');
    const name = state.players[state.current].name;
    fb.textContent = '⏰ Waktu habis! Tidak ada perubahan level.';
    fb.className = 'feedback bad';
    const myToken = state.token;
    const cur = state.current;
    setTimeout(() => {
      if (state.token !== myToken) return;
      if (isBergantian()) {
        state.players[cur].answered++;
        state.current = 1 - state.current;
      }
      nextQuestion();
    }, 1400);
  }

  function resolveAnswer(correct, playerIdx) {
    const p = state.players[playerIdx];
    const before = p.level;

    if (correct) {
      p.correct++;
      p.level = Math.min(MAX_LEVEL, p.level + 1);
      sndCorrect();
    } else {
      p.level = Math.max(0, p.level - 1);
      sndWrong();
    }

    feedbackMsg(correct, playerIdx, before === 0);
    animateClimber(playerIdx, correct);
    placeClimbers();
    renderPanels();

    const myToken = state.token;

    if (isRebuttan()) {
      if (p.correct >= WINS_NEEDED) {
        setTimeout(() => { if (state.token === myToken) endGame(playerIdx, 'rebuttan'); }, 900);
        return;
      }
    } else {
      p.answered++;
      if (p.answered >= QUESTIONS_PER_PLAYER && state.players[1 - playerIdx].answered >= QUESTIONS_PER_PLAYER) {
        setTimeout(() => { if (state.token === myToken) endByCorrect(); }, 1100);
        return;
      }
      state.current = 1 - playerIdx;
    }

    setTimeout(() => { if (state.token === myToken) nextQuestion(); }, correct ? 1000 : 1400);
  }

  function endByCorrect() {
    const [a, b] = state.players;
    if (a.correct === b.correct) { endGame(-1, 'seri'); return; }
    endGame(a.correct > b.correct ? 0 : 1, 'correct');
  }

  function endGame(winnerIdx, reason) {
    state.over = true;
    stopTimer();
    const win = $('win-overlay');

    if (winnerIdx === -1) {
      $('win-avatar').textContent = '🤝';
      $('win-title').textContent = 'Seri!';
      $('win-message').textContent = 'Kalian hebat, sama kuatnya!';
      $('win-prize').textContent = '🎀';
    } else {
      const p = state.players[winnerIdx];
      const prize = pick(PRIZES);
      $('win-avatar').textContent = p.emoji;
      $('win-title').textContent = `${p.name} Menang!`;
      if (reason === 'rebuttan') {
        $('win-message').textContent = `Berhasil menjawab ${WINS_NEEDED} soal dengan benar lebih dulu! 🎉`;
      } else if (reason === 'puncak') {
        $('win-message').textContent = 'Berhasil memanjat sampai puncak dan meraih hadiah! 🎉';
      } else {
        $('win-message').textContent = `Menjawab lebih banyak soal dengan benar (${p.correct}/${isBergantian() ? QUESTIONS_PER_PLAYER : '∞'})! 🎉`;
      }
      $('win-prize').textContent = prize;
      sndWin();
    }
    win.classList.remove('hidden');
    launchConfetti();
  }

  /* ================= UI: PANEL PEMAIN ================= */
  function renderPanels() {
    state.players.forEach((p, i) => {
      const prefix = i + 1;
      $(`p${prefix}-name`).textContent = p.name;
      $(`p${prefix}-correct`).textContent = p.correct;
      if (isRebuttan()) {
        $(`p${prefix}-prog`).style.width = `${Math.min(100, (p.correct / WINS_NEEDED) * 100)}%`;
        $(`p${prefix}-count`).textContent = `Tingkat ${p.level}`;
      } else {
        $(`p${prefix}-prog`).style.width = `${Math.min(100, (p.answered / QUESTIONS_PER_PLAYER) * 100)}%`;
        $(`p${prefix}-count`).textContent = `Soal ${Math.min(p.answered, QUESTIONS_PER_PLAYER)}/${QUESTIONS_PER_PLAYER}`;
      }
    });

    const tb = $('turn-banner');
    if (isBergantian()) {
      tb.classList.remove('hidden');
      tb.className = `turn-banner ${state.current === 0 ? 'turn-p1' : 'turn-p2'}`;
      tb.textContent = `Giliran: ${state.players[state.current].name} ${state.players[state.current].emoji}`;
    } else {
      tb.classList.add('hidden');
    }
  }

  /* ================= UI: SOAL ================= */
  function renderQuestion() {
    const q = state.question;
    $('question-text').textContent = `${q.text} = ?`;

    if (isRebuttan()) {
      $('qnum').textContent = '';
      renderRebuttanPanels(q);
    } else {
      $('qnum').textContent = `Soal ${state.players[state.current].answered + 1} / ${QUESTIONS_PER_PLAYER}`;
      renderBergantianPanel(q);
    }

    $('feedback').textContent = '';
    $('feedback').className = 'feedback';
  }

  function renderRebuttanPanels(q) {
    $('opts-shared').classList.add('hidden');

    ['opts-p1', 'opts-p2'].forEach((containerId, pIdx) => {
      const wrap = $(containerId);
      wrap.parentElement.classList.remove('hidden');
      wrap.innerHTML = '';
      q.options.forEach((val, i) => {
        const b = document.createElement('button');
        b.className = 'qp-btn';
        b.textContent = val;
        b.dataset.idx = i;
        b.addEventListener('click', () => answerPlayer(pIdx, i));
        wrap.appendChild(b);
      });
    });
  }

  function renderBergantianPanel(q) {
    $('opts-p1').parentElement.classList.add('hidden');
    $('opts-p2').parentElement.classList.add('hidden');

    const wrap = $('opts-shared');
    wrap.classList.remove('hidden');
    wrap.innerHTML = '';
    q.options.forEach((val, i) => {
      const b = document.createElement('button');
      b.className = 'qp-btn';
      b.textContent = val;
      b.dataset.idx = i;
      b.addEventListener('click', () => answerPlayer(state.current, i));
      wrap.appendChild(b);
    });
  }

  function highlightAnswer(chosenIdx, correct, playerIdx) {
    if (isBergantian()) {
      const btns = document.querySelectorAll('#opts-shared .qp-btn');
      btns.forEach((b, i) => {
        b.disabled = true;
        if (correct) {
          if (i === chosenIdx) b.classList.add('correct');
        } else {
          if (i === chosenIdx) b.classList.add('wrong');
          if (Number(b.textContent) === state.question.answer) b.classList.add('correct');
        }
      });
    } else {
      const containerId = playerIdx === 0 ? 'opts-p1' : 'opts-p2';
      const btns = document.querySelectorAll(`#${containerId} .qp-btn`);
      btns.forEach((b, i) => {
        b.disabled = true;
        if (correct) {
          if (i === chosenIdx) b.classList.add('correct');
        } else {
          if (i === chosenIdx) b.classList.add('wrong');
          if (Number(b.textContent) === state.question.answer) b.classList.add('correct');
        }
      });
    }
  }

  function disableAllOptions() {
    document.querySelectorAll('.qp-btn').forEach(b => { b.disabled = true; });
  }

  function feedbackMsg(correct, playerIdx, wasAtBottom) {
    const fb = $('feedback');
    const name = state.players[playerIdx].name;
    if (correct) {
      fb.textContent = `🎉 ${name} benar! Naik 1 tingkat!`;
      fb.className = 'feedback good';
    } else if (wasAtBottom) {
      fb.textContent = `😅 ${name} salah, tapi sudah di dasar.`;
      fb.className = 'feedback bad';
    } else {
      fb.textContent = `😅 ${name} salah. Turun 1 tingkat.`;
      fb.className = 'feedback bad';
    }
  }

  /* ================= UI: KLIMBER ================= */
  function climberEl(idx) { return document.getElementById(`climber-${idx + 1}`); }

  function placeClimbers() {
    if (!state.players) return;
    state.players.forEach((p, i) => {
      const g = climberEl(i);
      if (!g) return;
      const x = i === 0 ? ARENA.P1_X : ARENA.P2_X;
      const y = feetY(p.level) - 110;
      g.style.setProperty('--cx', `${x}px`);
      g.style.setProperty('--cy', `${y}px`);
      g.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  function animateClimber(idx, correct) {
    const g = climberEl(idx);
    if (!g) return;
    g.classList.remove('jump', 'slip');
    void g.getBoundingClientRect();
    g.classList.add(correct ? 'jump' : 'slip');
  }

  /* ================= TIMER ================= */
  function startTimer() {
    stopTimer();
    const wrap = $('timer-wrap');
    if (!state.timeLimit) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');
    wrap.classList.remove('danger');
    $('timer-ring-fill').classList.remove('danger');
    state.timeLeft = state.timeLimit;
    renderTimer();
    state.timerId = setInterval(() => {
      state.timeLeft--;
      renderTimer();
      if (state.timeLeft <= 0) {
        clearInterval(state.timerId);
        state.timerId = null;
        answerTimeout();
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  function renderTimer() {
    const t = Math.max(0, state.timeLeft);
    $('timer-label').textContent = t;
    const frac = state.timeLimit ? t / state.timeLimit : 0;
    $('timer-ring-fill').style.strokeDashoffset = String(RING_C * (1 - frac));
    const danger = t <= 5;
    $('timer-ring-fill').classList.toggle('danger', danger);
    $('timer-wrap').classList.toggle('danger', danger);
  }

  /* ================= MENU ================= */
  function buildModeMenu() {
    const grid = $('mode-buttons');
    Object.entries(MODES).forEach(([key, mode]) => {
      const b = document.createElement('button');
      b.className = `mode-btn mode-${key}`;
      b.innerHTML = `<span class="m-icon">${mode.emoji}</span><span class="m-name">${mode.label}</span><span class="m-desc">${mode.desc}</span>`;
      b.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(o => o.classList.remove('selected'));
        b.classList.add('selected');
        state.selectedMode = key;
        $('btn-start').disabled = false;
        sndClick();
      });
      if (key === state.selectedMode) b.classList.add('selected');
      grid.appendChild(b);
    });
  }

  function buildOpMenu() {
    const grid = $('op-buttons');
    Object.entries(OPERATIONS).forEach(([key, op]) => {
      const b = document.createElement('button');
      b.className = `op-btn op-${key}`;
      b.innerHTML = `<span class="op-icon">${op.emoji}</span><span class="op-name">${op.label}</span>`;
      b.addEventListener('click', () => {
        document.querySelectorAll('.op-btn').forEach(o => o.classList.remove('selected'));
        b.classList.add('selected');
        state.selectedOp = key;
        $('btn-start').disabled = false;
        sndClick();
      });
      grid.appendChild(b);
    });
  }

  function buildTimeMenu() {
    const grid = $('time-buttons');
    TIME_OPTIONS.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'time-btn';
      b.innerHTML = `<span class="t-icon">${opt.emoji}</span><span class="t-name">${opt.label}</span>`;
      b.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(o => o.classList.remove('selected'));
        b.classList.add('selected');
        state.selectedTime = opt.value;
        sndClick();
      });
      if (opt.value === state.selectedTime) b.classList.add('selected');
      grid.appendChild(b);
    });
  }

  function buildDiffMenu() {
    const grid = $('diff-buttons');
    Object.entries(DIFFICULTIES).forEach(([key, diff]) => {
      const b = document.createElement('button');
      b.className = 'diff-btn';
      b.innerHTML = `<span class="d-icon">${diff.emoji}</span><span class="d-name">${diff.label}</span><span class="d-desc">${diff.desc}</span>`;
      b.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(o => o.classList.remove('selected'));
        b.classList.add('selected');
        state.selectedDiff = key;
        sndClick();
      });
      if (key === state.selectedDiff) b.classList.add('selected');
      grid.appendChild(b);
    });
  }

  function showMenu() {
    stopTimer();
    state.token++;
    $('screen-game').classList.add('hidden');
    $('win-overlay').classList.add('hidden');
    $('screen-menu').classList.remove('hidden');
  }

  /* ================= KONFETI ================= */
  function launchConfetti() {
    const box = $('confetti');
    box.classList.remove('hidden');
    box.innerHTML = '';
    const emojis = ['🎉', '⭐', '🎊', '🌈', '✨', '🍬', '🎈', '💖'];
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('span');
      s.textContent = pick(emojis);
      s.style.left = `${rand(0, 100)}vw`;
      s.style.fontSize = `${rand(16, 34)}px`;
      s.style.animationDuration = `${rand(2.2, 4.2)}s`;
      s.style.animationDelay = `${rand(0, 0.9)}s`;
      box.appendChild(s);
    }
    setTimeout(() => box.classList.add('hidden'), 6000);
  }

  /* ================= LISTENERS & INIT ================= */
  function init() {
    buildModeMenu();
    buildOpMenu();
    buildTimeMenu();
    buildDiffMenu();
    $('arena').innerHTML = buildArena();
    const placeAt0 = (id, x) => {
      const g = document.getElementById(id);
      const y = feetY(0) - 110;
      g.style.setProperty('--cx', `${x}px`);
      g.style.setProperty('--cy', `${y}px`);
      g.style.transform = `translate(${x}px, ${y}px)`;
    };
    placeAt0('climber-1', ARENA.P1_X);
    placeAt0('climber-2', ARENA.P2_X);

    $('btn-start').addEventListener('click', () => { ensureAudio(); sndClick(); startGame(); });

    $('btn-exit').addEventListener('click', () => { ensureAudio(); sndClick(); showMenu(); });
    $('btn-again').addEventListener('click', () => { sndClick(); startGame(); });
    $('btn-change').addEventListener('click', () => { sndClick(); showMenu(); });
    $('btn-sound').addEventListener('click', () => {
      soundOn = !soundOn;
      $('btn-sound').textContent = soundOn ? '🔊' : '🔇';
      ensureAudio();
      if (soundOn) sndClick();
    });

    document.addEventListener('keydown', (e) => {
      if ($('screen-game').classList.contains('hidden')) return;
      if (state.over || !state.question || state.lock) return;
      const key = e.key.toLowerCase();

      if (isRebuttan()) {
        const p1Idx = P1_KEYS.indexOf(key);
        if (p1Idx !== -1) { answerPlayer(0, p1Idx); return; }
        const p2Idx = P2_KEYS.indexOf(key);
        if (p2Idx !== -1) { answerPlayer(1, p2Idx); return; }
      } else {
        const sIdx = SHARED_KEYS.indexOf(key);
        if (sIdx !== -1) { answerPlayer(state.current, sIdx); return; }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
