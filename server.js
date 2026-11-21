'use strict';
/* Тихий клёв — онлайн-сервер (Express + Socket.IO) для Render Web Service */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 10000;               // Render передаёт PORT сам
const MAX_PLAYERS = Number(process.env.MAX_PLAYERS) || 100;
const ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
const ANY = ORIGINS.includes('*');

/* ---------- аккаунты: пароли и права хранятся и проверяются ТОЛЬКО на сервере ---------- */
// На Render задай свой секрет в переменной окружения AUTH_SECRET (иначе он генерится заново
// при каждом рестарте и все выданные токены становятся недействительными).
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
// Ники админов — тоже через переменную окружения, через запятую: ADMIN_NAMES=CATx,Вася
const ADMIN_NAMES = new Set((process.env.ADMIN_NAMES || 'CATx').split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
// Код для выдачи админки аккаунту CATx. Задай его в переменной окружения на Render — это секрет, не часть кода.
const ADMIN_BOOTSTRAP_KEY = process.env.ADMIN_BOOTSTRAP_KEY || '546777';
const USERS_FILE = path.join(__dirname, 'users.json');
const NICK_RE = /^[A-Za-zА-Яа-яЁё0-9_]{3,16}$/;
const TOKEN_TTL = 1000 * 60 * 60 * 24 * 30; // 30 дней

function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { return {}; }
}
function saveUsers(u) {
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(u)); } catch (e) { console.error('Не удалось сохранить users.json', e); }
}
let USERS = loadUsers();                                      // key: lower(name) -> { name, salt, hash }

function hashPass(pass, salt) {
  return crypto.scryptSync(String(pass), salt, 32).toString('hex');
}
function b64url(buf) { return Buffer.from(buf).toString('base64url'); }
function sign(payloadObj) {
  const payload = b64url(JSON.stringify(payloadObj));
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}
function isAdminKey(key) { return ADMIN_NAMES.has(key) || !!(USERS[key] && USERS[key].admin); }
function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const good = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  if (sig !== good || sig.length !== good.length) return null; // совпадение длин, timingSafeEqual ниже
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  } catch (e) { return null; }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || !data.name || !data.exp || Date.now() > data.exp) return null;
    const key = String(data.name).toLowerCase();
    if (!USERS[key]) return null; // аккаунт мог быть удалён (бан за читерство) — токен сразу невалиден
    return { name: data.name, key, admin: isAdminKey(key) }; // admin считаем заново при каждой проверке, по текущему списку/флагу
  } catch (e) { return null; }
}
function issueToken(name) {
  return sign({ name, exp: Date.now() + TOKEN_TTL });
}

/* ---------- экономика: деньги, улов, снасти — источник правды только сервер ---------- */
// Каталог рыб (id -> диапазон веса и редкость) вытаскиваем прямо из public/game.js,
// чтобы не дублировать вручную и не разойтись с клиентом.
const RP = [35, 80, 200, 600, 2000];
const FISH_CATALOG = (() => {
  const map = new Map();
  try {
    const src = fs.readFileSync(path.join(__dirname, 'public', 'game.js'), 'utf8');
    const m = src.match(/const SP=\{\};\n`([\s\S]*?)`\.split\('\\n'\)\.forEach\(l=>\{const a=l\.split\('\|'\)/);
    if (m) {
      for (const line of m[1].split('\n')) {
        const a = line.split('|'); if (a.length < 10) continue;
        const id = a[0], wMin = Number(a[2]), wMax = Number(a[3]), r = Number(a[9]);
        if (id && Number.isFinite(wMin) && Number.isFinite(wMax) && Number.isFinite(r)) map.set(id, { w: [wMin, wMax], r: Math.max(0, Math.min(4, r)) });
      }
    }
  } catch (e) { console.error('Не удалось разобрать каталог рыб из game.js', e); }
  return map;
})();
console.log('Каталог рыб для сервера: ' + FISH_CATALOG.size + ' видов');
const ROD_CATALOG = { starter: 0, river: 900, carp: 2800, match: 6200 };
const UPGRADE_MAX = 5, UPGRADE_COST = lvl => (lvl + 1) * 400;
const CATCH_COOLDOWN_MS = 2500; // быстрее физически поймать нельзя
function priceOf(s, w) { const rr = (w - s.w[0]) / (s.w[1] - s.w[0]); return Math.max(1, Math.round(w * RP[s.r] * (rr >= .8 ? 4 : rr >= .45 ? 2 : 1))); }
function tierOf(s, w) { const rr = (w - s.w[0]) / (s.w[1] - s.w[0]); return rr >= .8 ? 2 : rr >= .45 ? 1 : 0; }
function freshEco() { return { money: 0, fish: [], up: { line: 0, cast: 0 }, rods: ['starter'], equippedRod: 'starter' }; }

/* ---------- анти-чит: 3 нарушения подряд — аккаунт удаляется и все данные сбрасываются ---------- */
function violation(socket, me, reason) {
  const u = USERS[me.user]; if (!u) return;
  u.violations = (u.violations || 0) + 1;
  console.log('Нарушение (' + u.violations + '/3) у ' + u.name + ': ' + reason);
  if (u.violations >= 3) {
    delete USERS[me.user];                                    // аккаунт удалён, все данные (деньги, улов, снасти) стёрты
    saveUsers(USERS);
    socket.emit('cheat:banned', { reason });
    players.delete(socket.id);
    socket.disconnect(true);
    return;
  }
  saveUsers(USERS);
  socket.emit('cheat:warning', { count: u.violations, reason });
}
function syncEco(socket, me) {
  const u = USERS[me.user]; if (!u) return;
  socket.emit('eco:sync', u.eco);
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2kb' }));
app.use((req, res, next) => {                                  // CORS для обычных HTTP-запросов
  const o = req.headers.origin;
  if (o && (ANY || ORIGINS.includes(o))) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  next();
});

// простейший анти-брутфорс: не больше 10 попыток логина/регистрации в минуту с одного IP
const hits = new Map();
function rateLimited(req) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(ip && now);
  hits.set(ip, arr);
  return arr.length > 10;
}

app.post('/api/register', (req, res) => {
  if (rateLimited(req)) return res.status(429).json({ ok: false, error: 'Слишком много попыток, подожди минуту' });
  const name = String((req.body && req.body.name) || '').trim();
  const pass = String((req.body && req.body.pass) || '');
  if (!NICK_RE.test(name)) return res.status(400).json({ ok: false, error: 'Ник: 3–16 символов, буквы/цифры/_' });
  if (pass.length < 3) return res.status(400).json({ ok: false, error: 'Пароль минимум 3 символа' });
  const key = name.toLowerCase();
  if (USERS[key]) return res.status(409).json({ ok: false, error: 'Такой ник уже занят' });
  const salt = crypto.randomBytes(16).toString('hex');
  USERS[key] = { name, salt, hash: hashPass(pass, salt), violations: 0, admin: false, eco: freshEco() };
  saveUsers(USERS);
  res.json({ ok: true, token: issueToken(name), name, admin: isAdminKey(key) });
});

app.post('/api/login', (req, res) => {
  if (rateLimited(req)) return res.status(429).json({ ok: false, error: 'Слишком много попыток, подожди минуту' });
  const name = String((req.body && req.body.name) || '').trim();
  const pass = String((req.body && req.body.pass) || '');
  const key = name.toLowerCase();
  const u = USERS[key];
  if (!u) return res.status(404).json({ ok: false, error: 'Аккаунт не найден' });
  const good = hashPass(pass, u.salt);
  const a = Buffer.from(good), b = Buffer.from(u.hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ ok: false, error: 'Неверный пароль' });
  if (!u.eco) { u.eco = freshEco(); saveUsers(USERS); }           // на случай старых аккаунтов без экономики
  res.json({ ok: true, token: issueToken(u.name), name: u.name, admin: isAdminKey(key) });
});

app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const info = verifyToken(auth.startsWith('Bearer ') ? auth.slice(7) : '');
  if (!info) return res.status(401).json({ ok: false });
  res.json({ ok: true, name: info.name, admin: info.admin });
});

const players = new Map();                                     // socket.id -> { id, p, t, tc, ta, admin }
app.get('/health', (req, res) => res.json({ ok: true, online: players.size, uptime: Math.round(process.uptime()) }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '5m' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ANY ? true : ORIGINS, methods: ['GET', 'POST'] },   // CORS для Socket.IO
  pingInterval: 10000, pingTimeout: 15000, maxHttpBufferSize: 1e4
});

const STATES = new Set(['idle', 'charge', 'cast', 'wait', 'bite', 'fight', 'catch']);
const NULLABLE = new Set(['bx', 'by', 'bz', 'dp']);
const NUM = [['c', 0, 360], ['l', 0, 9], ['x', -400, 400], ['z', -400, 400], ['b', -100, 100], ['bx', -400, 400], ['by', -5, 40], ['bz', -400, 400], ['dp', 0, 1]];
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n);
const str2 = v => str(v, 32);
function clean(d) {                                            // проверка и ограничение всех входящих полей
  const o = {};
  if (!d || typeof d !== 'object') return o;
  if ('n' in d) { const n = str(d.n, 16); if (n) o.n = n; }
  if ('k' in d) { const k = str(d.k, 2).toUpperCase(); if (/^[A-Z]{2}$/.test(k)) o.k = k; }
  for (const [k, a, b] of NUM) {
    if (!(k in d)) continue;
    if (d[k] === null && NULLABLE.has(k)) { o[k] = null; continue; }
    const v = Number(d[k]);
    if (Number.isFinite(v)) o[k] = k === 'l' ? Math.round(Math.min(b, Math.max(a, v))) : Math.min(b, Math.max(a, v));
  }
  if (typeof d.s === 'string' && STATES.has(d.s)) o.s = d.s;
  return o;
}
function merge(base, patch) { for (const k in patch) { if (patch[k] === null) delete base[k]; else base[k] = patch[k]; } }
const history = [];

io.on('connection', socket => {
  socket.on('join', d => {
    if (players.has(socket.id)) return;
    if (players.size >= MAX_PLAYERS) { socket.emit('full'); socket.disconnect(true); return; }
    const p = clean(d);
    // Личность и права игрока решает ТОЛЬКО сервер по токену, что бы ни прислал клиент в 'n'/'admin'.
    const auth = verifyToken(d && d.token);
    let admin = false, user = null;
    if (auth) { p.n = auth.name; admin = auth.admin; user = auth.key; }
    if (!p.n) p.n = 'Рыбак' + (100 + Math.floor(Math.random() * 900));
    const me = { id: socket.id, p, t: 0, tc: 0, ta: 0, lc: 0, admin, user };
    const others = [...players.values()].map(x => ({ id: x.id, p: x.p }));
    players.set(socket.id, me);
    socket.emit('welcome', { id: socket.id, peers: others, history: history.slice(-30), admin });
    if (user) syncEco(socket, me);
    socket.broadcast.emit('peer:join', { id: socket.id, p });
  });

  /* ---- экономика: сервер — единственный источник правды по деньгам/улову, для залогиненных ---- */
  function eco(socket) {
    const me = players.get(socket.id);
    if (!me || !me.user || !USERS[me.user]) return null;
    return { me, u: USERS[me.user] };
  }

  socket.on('eco:catch', d => {
    const ctx = eco(socket); if (!ctx) return; const { me, u } = ctx;
    const now = Date.now();
    if (now - me.lc < CATCH_COOLDOWN_MS) return violation(socket, me, 'слишком частые поклёвки (подделка улова)');
    const sp = str2(d && d.sp), w = Number(d && d.w);
    const fish = FISH_CATALOG.get(sp);
    if (!fish || !Number.isFinite(w) || w < fish.w[0] - 1e-6 || w > fish.w[1] + 1e-6) return violation(socket, me, 'несуществующая рыба или невозможный вес');
    me.lc = now;
    if (u.eco.fish.length >= 300) u.eco.fish.shift();
    u.eco.fish.push({ id: sp, w: Math.round(w * 1000) / 1000, p: priceOf(fish, w), t: tierOf(fish, w) });
    saveUsers(USERS);
    syncEco(socket, me);
  });

  socket.on('eco:sell', d => {
    const ctx = eco(socket); if (!ctx) return; const { me, u } = ctx;
    const idx = Math.round(Number(d && d.idx));
    if (!Number.isInteger(idx) || idx < 0 || idx >= u.eco.fish.length) return violation(socket, me, 'продажа несуществующей рыбы');
    const f = u.eco.fish.splice(idx, 1)[0];
    u.eco.money += f.p;
    saveUsers(USERS);
    syncEco(socket, me);
  });

  socket.on('eco:sellAll', () => {
    const ctx = eco(socket); if (!ctx) return; const { me, u } = ctx;
    for (const f of u.eco.fish) u.eco.money += f.p;
    u.eco.fish = [];
    saveUsers(USERS);
    syncEco(socket, me);
  });

  socket.on('eco:buyRod', d => {
    const ctx = eco(socket); if (!ctx) return; const { me, u } = ctx;
    const id = str2(d && d.id); const price = ROD_CATALOG[id];
    if (price === undefined) return violation(socket, me, 'несуществующая удочка');
    if (u.eco.rods.includes(id)) { u.eco.equippedRod = id; saveUsers(USERS); syncEco(socket, me); return; }
    if (u.eco.money < price) return violation(socket, me, 'покупка удочки без денег');
    u.eco.money -= price; u.eco.rods.push(id); u.eco.equippedRod = id;
    saveUsers(USERS);
    syncEco(socket, me);
  });

  socket.on('eco:equipRod', d => {
    const ctx = eco(socket); if (!ctx) return; const { me, u } = ctx;
    const id = str2(d && d.id);
    if (!u.eco.rods.includes(id)) return;
    u.eco.equippedRod = id; saveUsers(USERS); syncEco(socket, me);
  });

  socket.on('eco:buyUpgrade', d => {
    const ctx = eco(socket); if (!ctx) return; const { me, u } = ctx;
    const kind = d && d.kind;
    if (kind !== 'line' && kind !== 'cast') return violation(socket, me, 'несуществующий апгрейд');
    const lvl = u.eco.up[kind];
    if (lvl >= UPGRADE_MAX) return;
    const cost = UPGRADE_COST(lvl);
    if (u.eco.money < cost) return violation(socket, me, 'покупка апгрейда без денег');
    u.eco.money -= cost; u.eco.up[kind]++;
    saveUsers(USERS);
    syncEco(socket, me);
  });

  socket.on('eco:setDrag', d => {
    const ctx = eco(socket); if (!ctx) return; const { me, u } = ctx;
    const v = Number(d && d.v); if (!Number.isFinite(v)) return;
    u.eco.drag = Math.min(0.9, Math.max(0.2, v));
    saveUsers(USERS);
  });

  socket.on('admin:bootstrap', d => {
    const ctx = eco(socket); if (!ctx) return; const { me, u } = ctx;
    if (String(d && d.key) !== ADMIN_BOOTSTRAP_KEY) { socket.emit('admin:bootstrap:result', { ok: false, error: 'Неверный код' }); return; }
    if (me.user !== 'catx') { socket.emit('admin:bootstrap:result', { ok: false, error: 'Этот код только для аккаунта CATx' }); return; }
    u.admin = true; saveUsers(USERS); me.admin = true;
    socket.emit('admin:bootstrap:result', { ok: true });
  });

  socket.on('state', d => {                                    // позиция, состояние рыбалки, поплавок
    const me = players.get(socket.id); if (!me) return;
    const now = Date.now(); if (now - me.t < 40) return; me.t = now;
    const patch = clean(d); if (!Object.keys(patch).length) return;
    merge(me.p, patch);
    socket.volatile.broadcast.emit('peer:state', { id: socket.id, p: patch });
  });

  socket.on('chat', d => {                                     // общий чат
    const me = players.get(socket.id); if (!me) return;
    const now = Date.now(); if (now - me.tc < 700) return; me.tc = now;
    const t = str(d && d.t, 160); if (!t) return;
    const m = { id: socket.id, n: me.p.n, k: me.p.k || '', c: me.p.c || 0, t, ts: now };
    history.push({ n: m.n, k: m.k, c: m.c, t: m.t }); if (history.length > 40) history.shift();
    io.emit('chat', m);
  });

  socket.on('announce', d => {                                 // трофеи и редкие уловы
    const me = players.get(socket.id); if (!me || !d) return;
    const now = Date.now(); if (now - me.ta < 3000) return; me.ta = now;
    const sp = str(d.sp, 24), w = Number(d.w), tier = Math.round(Number(d.tier));
    if (!sp || !Number.isFinite(w) || w <= 0 || w > 400) return;
    io.emit('announce', { n: me.p.n, k: me.p.k || '', sp, w, tier: tier === 2 ? 2 : tier === 1 ? 1 : 0 });
  });

  socket.on('disconnect', () => {
    if (players.delete(socket.id)) socket.broadcast.emit('peer:leave', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log('Тихий клёв: сервер запущен, порт ' + PORT));
const stop = () => { io.close(); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 3000).unref(); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
